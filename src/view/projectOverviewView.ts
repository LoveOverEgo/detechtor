import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectAnalysis } from '../analyzers';
import { getNonce, renderHeader, renderSummaryCards, renderLanguagesSection, renderFrameworksSection, renderDependenciesSection, renderTestingSection, renderProjectStructureSection, renderActionsSection } from './helpers';

export class ProjectOverviewViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _disposables: vscode.Disposable[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private _analysis?: ProjectAnalysis
    ) {}

     // Called by VS Code when the sidebar view is shown
    resolveWebviewView(webviewView: vscode.WebviewView): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'media')
            ]
        };

        // Initial empty / placeholder render
        webviewView.webview.html = this._getHtmlForWebview(
            webviewView.webview
        );

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'generateReadme':
                        await vscode.commands.executeCommand('projectAnalyzer.generateReadme');
                        
                        return;

                    case 'refreshAnalysis':
                        await vscode.commands.executeCommand('projectAnalyzer.refresh');
                        
                        return;

                    case 'openFile':
                        if (!message.path) return;

                        const folder = vscode.workspace.workspaceFolders?.[0];
                        if (!folder) return;

                        const targetUri = vscode.Uri.joinPath(
                            folder.uri,
                            message.path
                        );

                        try {
                            const stat = await vscode.workspace.fs.stat(targetUri);

                            // Always reveal in Explorer
                            await vscode.commands.executeCommand(
                                'revealInExplorer',
                                targetUri
                            );

                            // If it's a file, also open it
                            if (stat.type === vscode.FileType.File) {
                                const doc = await vscode.workspace.openTextDocument(targetUri);
                                await vscode.window.showTextDocument(doc, {
                                    preview: true
                                });
                            }

                        } catch (err) {
                            vscode.window.showErrorMessage(
                                `Could not open ${message.path}`
                            );
                        }

                        return;

                    case 'copyToClipboard':
                        if (message.text) {
                            await vscode.env.clipboard.writeText(message.text);
                            vscode.window.showInformationMessage(
                                'Copied to clipboard!'
                            );
                        }

                        return;

                    case 'showMessage':
                        if (message.text) {
                            const type = message.type ?? 'info';
                            if (type === 'error') {
                                vscode.window.showErrorMessage(message.text);
                            } else if (type === 'warning') {
                                vscode.window.showWarningMessage(message.text);
                            } else {
                                vscode.window.showInformationMessage(message.text);
                            }
                        }

                        return;
                }
            },
            null,
            this._disposables
        );
    }

    // Called by commands to push new data
    public update(analysis: ProjectAnalysis) {
        this._analysis = analysis;

        if (!this._view) {
            return;
        }

        this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        // Get the local path to main script run in the webview
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
        );
        // Get the local path to css styles
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
        );
        const styleMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
        );

        if (!this._analysis) {
            return `
                <!DOCTYPE html>
                <html>
                <body>
                    <div style="padding: 16px;">
                    <p>No analysis yet.</p>
                    <p>Run <strong>Analyze Project</strong>.</p>
                    </div>
                </body>
                </html>
            `;
        }

        return `<!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${styleResetUri}" rel="stylesheet">
                    <link href="${styleVSCodeUri}" rel="stylesheet">
                    <link href="${styleMainUri}" rel="stylesheet">
                    <title>Project Overview</title>
                </head>
                <body>
                    <div class="container">
                        ${renderHeader(this._analysis)}
                        ${renderSummaryCards(this._analysis)}
                        ${renderLanguagesSection(this._analysis)}
                        ${renderFrameworksSection(this._analysis)}
                        ${renderDependenciesSection(this._analysis)}
                        ${renderTestingSection(this._analysis)}
                        ${renderProjectStructureSection(this._analysis)}
                        ${renderActionsSection(this._analysis)}
                    </div>

                    <script nonce="${nonce}" src="${scriptUri}"></script>
                </body>
            </html>`;
    }
}


