import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ComponentAnalysis, Phase, ProjectAnalysis, ProjectInfo, TechnologyDescriptor, WorkspaceAnalysis, WorkspaceComponentRef, WorkspaceProjectRoot } from '../types/index';
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

        analysis.rootPath = projectPath;
        analysis.components = buildComponentsFromAnalysis(analysis);
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

    const frontendComponents: WorkspaceComponentRef[] = [];
    const backendComponents: WorkspaceComponentRef[] = [];

    for (const root of roots) {
        if (token?.isCancellationRequested) break;
        progress?.report({ message: `Analyzing ${root.name}...` });

        const analysis = await analyzeProject(root.rootPath, progress, token);
        analysis.projectId = root.id;
        analysis.rootPath = root.rootPath;
        analysis.projectTypeHints = deriveProjectTypeHints(analysis, root);
        projects.push(analysis);

        for (const component of analysis.components ?? []) {
            if (component.kind === 'frontend') {
                frontendComponents.push({
                    projectId: root.id,
                    componentId: component.id,
                    name: component.name ?? root.name,
                    rootPath: component.rootPath,
                    kind: 'frontend',
                    frameworks: component.technologies
                        .filter(tech => tech.kind === 'framework')
                        .map(tech => tech.name),
                });
            }

            if (component.kind === 'backend') {
                backendComponents.push({
                    projectId: root.id,
                    componentId: component.id,
                    name: component.name ?? root.name,
                    rootPath: component.rootPath,
                    kind: 'backend',
                    frameworks: component.technologies
                        .filter(tech => tech.kind === 'framework')
                        .map(tech => tech.name),
                });
            }
        }
    }

    return {
        roots,
        projects,
        summary: {
            projectCount: projects.length,
            frontendComponents,
            backendComponents,
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

    if (analysis.frontend?.framework?.name && analysis.frontend.framework.name !== 'Unknown') {
        hints.add('frontend');
    }

    if (analysis.backend?.framework?.name && analysis.backend.framework.name !== 'Unknown') {
        hints.add('backend');
    }

    return Array.from(hints);
}

function buildComponentsFromAnalysis(analysis: ProjectAnalysis): ComponentAnalysis[] {
    const components: ComponentAnalysis[] = [];
    const baseId = analysis.projectInfo?.name ? sanitizeId(analysis.projectInfo.name) : 'project';
    const rootPath = analysis.rootPath ?? '';

    const baseData = {
        rootPath,
        languages: analysis.languages ?? [],
        packageManagers: analysis.dependencies?.packageManagers ?? [],
        hasLockFile: analysis.dependencies?.hasLockFile ?? false,
        dependencies: analysis.dependencies,
        testing: analysis.testing,
        fileStructure: analysis.fileStructure,
    };

    if (analysis.frontend?.framework?.name && analysis.frontend.framework.name !== 'Unknown') {
        components.push({
            id: `${baseId}-frontend-1`,
            kind: 'frontend',
            name: `${analysis.projectInfo?.name ?? 'Project'} Frontend`,
            technologies: collectFrontendTechnologies(analysis),
            frontend: analysis.frontend,
            ...baseData,
        });
    }

    if (analysis.backend?.framework?.name && analysis.backend.framework.name !== 'Unknown') {
        components.push({
            id: `${baseId}-backend-1`,
            kind: 'backend',
            name: `${analysis.projectInfo?.name ?? 'Project'} Backend`,
            technologies: collectBackendTechnologies(analysis),
            backend: analysis.backend,
            ...baseData,
        });
    }

    if (components.length === 0) {
        components.push({
            id: `${baseId}-unknown-1`,
            kind: 'unknown',
            name: analysis.projectInfo?.name ?? 'Project',
            technologies: [],
            ...baseData,
        });
    }

    return components;
}

function collectFrontendTechnologies(analysis: ProjectAnalysis): TechnologyDescriptor[] {
    const technologies: TechnologyDescriptor[] = [];
    const frontend = analysis.frontend;
    const seen = new Set<string>();

    if (!frontend) {
        return technologies;
    }

    if (frontend.framework?.name && frontend.framework.name !== 'Unknown') {
        technologies.push({ name: frontend.framework.name, version: frontend.framework.version, kind: 'framework' });
        seen.add(frontend.framework.name);
    }

    if (frontend.frameworks?.length) {
        frontend.frameworks.forEach(framework => {
            if (!framework?.name || framework.name === 'Unknown' || seen.has(framework.name)) {
                return;
            }
            technologies.push({ name: framework.name, version: framework.version, kind: 'framework' });
            seen.add(framework.name);
        });
    }

    if (frontend.metaFrameworks?.length) {
        frontend.metaFrameworks.forEach(framework => {
            technologies.push({ name: framework, kind: 'meta-framework' });
        });
    }

    if (frontend.buildTool) {
        technologies.push({ name: frontend.buildTool, version: frontend.buildToolVersion, kind: 'build-tool' });
    }

    if (frontend.cssFramework) {
        technologies.push({ name: frontend.cssFramework, kind: 'css' });
    }

    if (frontend.uiLibrary) {
        technologies.push({ name: frontend.uiLibrary, kind: 'ui' });
    }

    return technologies;
}

function collectBackendTechnologies(analysis: ProjectAnalysis): TechnologyDescriptor[] {
    const technologies: TechnologyDescriptor[] = [];
    const backend = analysis.backend;
    const seen = new Set<string>();

    if (!backend) {
        return technologies;
    }

    if (backend.framework?.name && backend.framework.name !== 'Unknown') {
        technologies.push({ name: backend.framework.name, version: backend.framework.version, kind: 'framework' });
        seen.add(backend.framework.name);
    }

    if (backend.frameworks?.length) {
        backend.frameworks.forEach(framework => {
            if (!framework?.name || framework.name === 'Unknown' || seen.has(framework.name)) {
                return;
            }
            technologies.push({ name: framework.name, version: framework.version, kind: 'framework' });
            seen.add(framework.name);
        });
    }

    if (backend.runtime) {
        technologies.push({ name: backend.runtime, kind: 'runtime' });
    }

    if (backend.database?.length) {
        backend.database.forEach(database => {
            technologies.push({ name: database, kind: 'database' });
        });
    }

    if (backend.orm) {
        technologies.push({ name: backend.orm, kind: 'orm' });
    }

    if (backend.server) {
        technologies.push({ name: backend.server, kind: 'service' });
    }

    return technologies;
}

function sanitizeId(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'project';
}
