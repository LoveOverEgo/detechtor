import * as vscode from 'vscode';
import { analyzeProject, analyzeWorkspace } from './analyze/index';
import { buildReadme } from './readme/readmeBuilder';
import { ProjectOverviewViewProvider } from './view/projectOverviewView';
import { WorkspaceAnalysis } from './types';

let registeredView: vscode.Disposable;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    let projectView = new ProjectOverviewViewProvider(context.extensionUri);

    console.log('Project Analyzer extension is now active!');
    
    // Create and register the sidebar view
    registeredView = vscode.window.registerWebviewViewProvider(
        'projectOverviewView',
        projectView
    );

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = '$(pulse) Analyze Project';
    statusBarItem.tooltip = 'Analyze project structure and dependencies';
    statusBarItem.command = 'projectAnalyzer.quickAnalyze';
    statusBarItem.show();

    // Command: Quick analyze with status bar
    const quickAnalyzeCommand = vscode.commands.registerCommand(
        'projectAnalyzer.quickAnalyze',
        async () => {
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Analyzing project...',
                    cancellable: false,
                },
                async (progress) => {
                    try {
                        const folder = vscode.workspace.workspaceFolders?.[0];
                        if (!folder) {
                            vscode.window.showWarningMessage(
                                'Please open a folder or workspace first.'
                            );
                            return;
                        }

                        progress.report({ increment: 0, message: 'Detecting languages...' });
                        const workspaceAnalysis = await analyzeWorkspace(folder.uri.fsPath);
                        const languages = getWorkspaceLanguages(workspaceAnalysis);

                        // Update status bar
                        const languageCount = languages.length;
                        statusBarItem.text = `$(file-code) ${languageCount} lang${
                            languageCount !== 1 ? 's' : ''
                        }`;

                        // Show quick info
                        vscode.window.showInformationMessage(
                            `Project analysis complete (${workspaceAnalysis.summary.projectCount} project${workspaceAnalysis.summary.projectCount !== 1 ? 's' : ''}): ${languages.join(', ')}`
                        );

                        progress.report({ increment: 100, message: 'Analysis complete!' });
                    } catch (error) {
                        vscode.window.showErrorMessage(
                            `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                        );
                    }
                }
            );
        }
    );

    // Command: Full analysis with View
    const analyzeCommand = vscode.commands.registerCommand(
        'projectAnalyzer.analyze',
        async () => {
            const folder = vscode.workspace.workspaceFolders?.[0];
            if (!folder) {
                vscode.window.showWarningMessage(
                    'Please open a folder or workspace first.'
                );
                return;
            }

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Window,
                    title: 'Analyzing Project',
                    cancellable: true,
                },
                async (progress, token) => {
                    try {
                        const workspaceAnalysis = await analyzeWorkspace(folder.uri.fsPath, progress, token);
                        // update the view with analysis & bring sidebar into view
                        projectView.updateWorkspace(workspaceAnalysis);
                        await vscode.commands.executeCommand(
                            'workbench.view.extension.detechtor'
                        );

                        progress.report({ increment: 100, message: 'Analysis complete!' });
                    } catch (error) {
                        vscode.window.showErrorMessage(
                            `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                        );
                    }
                }
            );
        }
    );

    // Command: Generate README
    const readmeCommand = vscode.commands.registerCommand(
        'projectAnalyzer.generateReadme',
        async () => {
            const folder = vscode.workspace.workspaceFolders?.[0];
            if (!folder) {
                vscode.window.showWarningMessage(
                    'Please open a folder or workspace first.'
                );
                return;
            }

            try {
                const analysis = await analyzeProject(folder.uri.fsPath);
                const markdown = buildReadme(analysis);

                // Check if README already exists
                const readmeUri = vscode.Uri.joinPath(folder.uri, 'README.md');
                let writeDocument = false;

                try {
                    await vscode.workspace.fs.stat(readmeUri);
                    // File exists, ask for confirmation
                    const choice = await vscode.window.showWarningMessage(
                        'README.md already exists. Overwrite?',
                        'Overwrite',
                        'Create New',
                        'Cancel'
                    );

                    if (choice === 'Overwrite') {
                        writeDocument = true;
                    } else if (choice === 'Create New') {
                        // Create with timestamp
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        const newReadmeUri = vscode.Uri.joinPath(
                            folder.uri,
                            `README_${timestamp}.md`
                        );
                        const doc = await vscode.workspace.openTextDocument({
                            content: markdown,
                            language: 'markdown',
                        });
                        await vscode.window.showTextDocument(doc);
                        return;
                    } else {
                        return;
                    }
                } catch {
                    // File doesn't exist, proceed
                    writeDocument = true;
                }

                if (writeDocument) {
                    const encoder = new TextEncoder();
                    await vscode.workspace.fs.writeFile(
                        readmeUri,
                        encoder.encode(markdown)
                    );

                    const doc = await vscode.workspace.openTextDocument(readmeUri);
                    await vscode.window.showTextDocument(doc);

                    vscode.window.showInformationMessage('README.md generated successfully!');
                }
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Failed to generate README: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }
    );

    // Command: Refresh analysis
    const refreshCommand = vscode.commands.registerCommand(
        'projectAnalyzer.refresh',
        async () => {
            if (projectView) {
                const folder = vscode.workspace.workspaceFolders?.[0];
                if (!folder) {
                    return;
                }

                const workspaceAnalysis = await analyzeWorkspace(folder.uri.fsPath);
                projectView.updateWorkspace(workspaceAnalysis);
                vscode.window.showInformationMessage('Analysis refreshed!');
            }
        }
    );

    // Register commands
    context.subscriptions.push(
        registeredView,
        statusBarItem,
        quickAnalyzeCommand,
        analyzeCommand,
        readmeCommand,
        refreshCommand
    );

    // Auto-analyze when workspace opens
    const autoAnalyze = vscode.workspace.onDidOpenTextDocument(async (document) => {
        // Only auto-analyze for certain file types
        const shouldAnalyze = [
            'package.json',
            'requirements.txt',
            'pyproject.toml',
            'Cargo.toml',
            'go.mod',
        ].some((fileName) => document.fileName.endsWith(fileName));

        if (shouldAnalyze && vscode.workspace.workspaceFolders?.length) {
            // Debounced auto-analysis
            setTimeout(async () => {
                const folder = vscode.workspace.workspaceFolders![0];
                try {
                    const workspaceAnalysis = await analyzeWorkspace(folder.uri.fsPath);
                    
                    // Update status bar with detected languages
                    const languageCount = getWorkspaceLanguages(workspaceAnalysis).length;
                    statusBarItem.text = `$(file-code) ${languageCount} lang${
                        languageCount !== 1 ? 's' : ''
                    }`;
                } catch (error) {
                    console.error('Auto-analysis failed:', error);
                }
            }, 1000);
        }
    });

    context.subscriptions.push(autoAnalyze);
}

function getWorkspaceLanguages(workspaceAnalysis: WorkspaceAnalysis): string[] {
    const languages = new Set<string>();
    for (const project of workspaceAnalysis.projects) {
        for (const language of project.languages ?? []) {
            languages.add(language);
        }
    }
    return Array.from(languages);
}

export function deactivate() {
    statusBarItem?.dispose();
}
