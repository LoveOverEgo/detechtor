import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Phase, ProjectAnalysis, ProjectInfo, WorkspaceAnalysis, WorkspaceProjectRoot } from '../types/index';
import { analyzeDependencies, detectBackend, detectFrontend, detectLanguages, detectTestingTools, pathExists, scanForConfigFiles, analyzeProjectStructure, detectWorkspaceProjects } from '../helpers/analyze/index';

export async function analyzeProject(
    projectPath: string,
    progress?: vscode.Progress<{ message?: string; increment?: number }>,
    token?: vscode.CancellationToken
): Promise<ProjectAnalysis> {
    const analysis = {
        projectInfo: {},
        fileStructure: {},
        timestamps: {},
    } as ProjectAnalysis;

    try {
        // Check if project path exists
        await pathExists(projectPath);

        // Get project last modified date
        const stats = await fs.stat(projectPath);
        analysis.timestamps.projectLastModified = stats.mtime.toISOString();

        const phases: Phase[] = [
            "LANGUAGE",
            "CONFIGURATION",
            "FRAMEWORK",
            "TESTING",
            "DEPENDENCY",
            "PROJECT_STRUCTURE",
            "DOCUMENTATION",
            "METADATA"
        ];

        let increment = 0;
        for (const phase of phases) {
            if (token?.isCancellationRequested) break;

            increment += 100 / phases.length;
            await startPhase(analysis, projectPath, phase, progress, increment);
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(errorMsg);
    }

    return analysis as ProjectAnalysis;
}

export async function analyzeWorkspace(
    workspacePath: string,
    progress?: vscode.Progress<{ message?: string; increment?: number }>,
    token?: vscode.CancellationToken
): Promise<WorkspaceAnalysis> {
    await pathExists(workspacePath);

    const roots = await detectWorkspaceProjects(workspacePath);
    const projects: ProjectAnalysis[] = [];

    for (const root of roots) {
        if (token?.isCancellationRequested) break;
        progress?.report({ message: `Analyzing ${root.name}...` });

        const analysis = await analyzeProject(root.rootPath, progress, token);
        analysis.rootPath = root.rootPath;
        analysis.projectTypeHints = deriveProjectTypeHints(analysis, root);
        projects.push(analysis);
    }

    return {
        roots,
        projects,
        summary: {
            projectCount: projects.length,
        },
    };
}

async function startPhase(
    analysis: ProjectAnalysis,
    projectPath: string,
    phase: Phase,
    progress?: vscode.Progress<{ message?: string; increment?: number }>,
    increment?: number
): Promise<void> {        
    switch (phase) {
        case "LANGUAGE":
            progress?.report({ message: 'Detecting programming languages...', increment});
            analysis.languages = await detectLanguages(projectPath);
            analysis.projectInfo.hasTypeScript = analysis.languages.includes('TypeScript');

            break;
        case "CONFIGURATION":
            progress?.report({ message: 'Scanning configuration files...', increment});
            const configFiles = await scanForConfigFiles(projectPath);

            analysis.fileStructure.configFiles = configFiles;

            analysis.projectInfo.hasLinting = configFiles.some(file => 
                file.includes('eslint') || file.includes('.prettierrc') || file.includes('.stylelintrc')
            );

            analysis.projectInfo.hasCI = configFiles.some(file => 
                file.includes('.github/workflows') || 
                file.includes('.gitlab-ci.yml') || 
                file.includes('.travis.yml') ||
                file.includes('azure-pipelines.yml')
            );

            analysis.projectInfo.hasDocker = configFiles.some(file => 
                file.includes('Dockerfile') || file.includes('docker-compose')
            );
            
            break;
        case "FRAMEWORK":
            progress?.report({ message: 'Detecting frameworks...', increment});
            const [frontendAnalysis, backendAnalysis] = await Promise.all([
                detectFrontend(projectPath),
                detectBackend(projectPath),
            ]);
            analysis.frontend = { ...analysis.frontend, ...frontendAnalysis };
            analysis.backend = { ...analysis.backend, ...backendAnalysis };
            
            break;
        case "TESTING":
            progress?.report({ message: 'Identifying testing tools...', increment});            
            const testingAnalysis = await detectTestingTools(projectPath);
            analysis.testing = testingAnalysis;
            analysis.projectInfo.hasTests = testingAnalysis.frameworks.length > 0 || testingAnalysis.e2eTools.length > 0;

            break;
        case "DEPENDENCY":
            progress?.report({ message: 'Scanning dependencies...', increment});
            analysis.dependencies = await analyzeDependencies(projectPath);
            
            break;
        case "PROJECT_STRUCTURE":
            progress?.report({ message: 'Analyzing project structure...', increment});
            Object.assign(analysis.fileStructure, await analyzeProjectStructure(projectPath));
            
            break;
        case "DOCUMENTATION":
            progress?.report({ message: 'Checking for documentation...', increment});
            analysis.projectInfo.hasDocumentation = await hasDocumentation(projectPath);
            
            break;
        case "METADATA":
            progress?.report({ message: 'Extracting project metadata...', increment});
            Object.assign(analysis.projectInfo, await extractProjectMetadata(projectPath));
            
            break;

        default:
            break;
    }
}

async function hasDocumentation(projectPath: string): Promise<boolean> {
    const docFiles = [
        'README.md',
        'README.txt',
        'README',
        'docs/',
        'documentation/',
        'CHANGELOG.md',
        'CONTRIBUTING.md',
        'LICENSE',
        'LICENSE.txt',
    ];
    
    for (const docFile of docFiles) {
        try {
            await fs.access(path.join(projectPath, docFile));
            return true;
        } catch {
            // File doesn't exist
        }
    }
    
    return false;
}

async function extractProjectMetadata(projectPath: string) {
    const metadata: Record<string, any> = {};
    
    // Try to read package.json first
    try {
        const packageJsonPath = path.join(projectPath, 'package.json');
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        
        metadata.name = packageJson.name || path.basename(projectPath);
        metadata.version = packageJson.version;
        metadata.description = packageJson.description;
        metadata.license = packageJson.license;
        metadata.author = typeof packageJson.author === 'object' 
            ? `${packageJson.author.name}${packageJson.author.email ? ` <${packageJson.author.email}>` : ''}`
            : packageJson.author;
        metadata.repository = typeof packageJson.repository === 'object'
            ? packageJson.repository.url
            : packageJson.repository;
        metadata.mainEntry = packageJson.main;
    } catch (error) {
        // package.json doesn't exist or is invalid
        metadata.name = path.basename(projectPath);
    }
    
    return metadata;
}

function deriveProjectTypeHints(analysis: ProjectAnalysis, root: WorkspaceProjectRoot): string[] {
    const hints = new Set(root.typeHints);

    if (analysis.frontend?.framework && analysis.frontend.framework !== 'Unknown') {
        hints.add('frontend');
    }

    if (analysis.backend?.framework && analysis.backend.framework !== 'Unknown') {
        hints.add('backend');
    }

    return Array.from(hints);
}
