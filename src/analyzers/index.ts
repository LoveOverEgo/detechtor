import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { detectLanguages } from './languageDetector';
import { detectFrontend } from './frontendDetector';
import { detectBackend } from './backendDetector';
import { detectTestingTools, TestingAnalysis } from './testingDetector';
import { classifyDependencies } from './dependencyClassifier';

export interface ProjectAnalysis {
    languages: string[];
    frontend: {
        framework: string;
        version?: string;
        buildTool?: string;
        packageManager?: string;
        hasRouter?: boolean;
        hasStateManagement?: boolean;
        cssFramework?: string;
        uiLibrary?: string;
        metaFrameworks?: string[];
    };
    backend: {
        framework: string;
        version?: string;
        runtime?: string;
        database?: string[];
        authentication?: string[];
        orm?: string;
        server?: string;
        caching?: string[];
    };
    testing: TestingAnalysis | Partial<TestingAnalysis>;
    dependencies: {
        production: Array<{ name: string; version: string; category: string }>;
        development: Array<{ name: string; version: string; category: string }>;
        peer: Array<{ name: string; version: string; category: string }>;
        optional: Array<{ name: string; version: string; category: string }>;
    };
    projectInfo: {
        name: string;
        version?: string;
        description?: string;
        license?: string;
        author?: string;
        repository?: string;
        mainEntry?: string;
        hasTypeScript: boolean;
        hasTests: boolean;
        hasLinting: boolean;
        hasCI: boolean;
        hasDocker: boolean;
        hasDocumentation: boolean;
    };
    fileStructure: {
        entryPoints: string[];
        configFiles: string[];
        testDirectories: string[];
        sourceDirectories: string[];
        buildOutputs: string[];
    };
    testStructure: {
        testDirectory: string[];
        testFilePatterns: string[]; 
    };
    timestamps: {
        analysisDate: string;
        projectLastModified?: string;
    };
}

export async function analyzeProject(
    projectPath: string,
    progress?: vscode.Progress<{ message?: string; increment?: number }>,
    token?: vscode.CancellationToken
): Promise<ProjectAnalysis> {
    const analysis: Partial<ProjectAnalysis> = {
        languages: [],
        frontend: { framework: 'Unknown' },
        backend: { framework: 'Unknown' },
        testing: { frameworks: [], coverageTools: [], e2eTools: [], assertionLibraries: [] },
        dependencies: { production: [], development: [], peer: [], optional: [] },
        projectInfo: {
            name: path.basename(projectPath),
            hasTypeScript: false,
            hasTests: false,
            hasLinting: false,
            hasCI: false,
            hasDocker: false,
            hasDocumentation: false,
        },
        fileStructure: {
            entryPoints: [],
            configFiles: [],
            testDirectories: [],
            sourceDirectories: [],
            buildOutputs: [],
        },
        timestamps: {
            analysisDate: new Date().toISOString(),
        },
    };

    try {
        // Check if project path exists
        try {
            await fs.access(projectPath);
        } catch {
            throw new Error(`Project path does not exist: ${projectPath}`);
        }

        // Get project last modified date
        const stats = await fs.stat(projectPath);
        analysis.timestamps!.projectLastModified = stats.mtime.toISOString();

        // Phase 1: Language Detection
        if (token?.isCancellationRequested) return analysis as ProjectAnalysis;
        progress?.report({ message: 'Detecting programming languages...', increment: 10 });
        analysis.languages = await detectLanguages(projectPath);
        analysis.projectInfo!.hasTypeScript = analysis.languages.includes('TypeScript');

        // Phase 2: Configuration Files Analysis
        if (token?.isCancellationRequested) return analysis as ProjectAnalysis;
        progress?.report({ message: 'Scanning configuration files...', increment: 20 });
        
        const configFiles = await scanForConfigFiles(projectPath);
        analysis.fileStructure!.configFiles = configFiles;
        
        // Check for various project configurations
        analysis.projectInfo!.hasLinting = configFiles.some(file => 
            file.includes('eslint') || file.includes('.prettierrc') || file.includes('.stylelintrc')
        );
        
        analysis.projectInfo!.hasCI = configFiles.some(file => 
            file.includes('.github/workflows') || 
            file.includes('.gitlab-ci.yml') || 
            file.includes('.travis.yml') ||
            file.includes('azure-pipelines.yml')
        );
        
        analysis.projectInfo!.hasDocker = configFiles.some(file => 
            file.includes('Dockerfile') || file.includes('docker-compose')
        );

        // Phase 3: Package Manager Detection
        if (token?.isCancellationRequested) return analysis as ProjectAnalysis;
        progress?.report({ message: 'Analyzing package manager...', increment: 25 });
        
        const packageManagers = await detectPackageManager(projectPath);
        if (packageManagers.length > 0) {
            analysis.frontend!.packageManager = packageManagers[0];
        }

        // Phase 4: Framework Detection (Parallel)
        if (token?.isCancellationRequested) return analysis as ProjectAnalysis;
        progress?.report({ message: 'Detecting frameworks...', increment: 40 });
        
        const [frontendAnalysis, backendAnalysis] = await Promise.all([
            detectFrontend(projectPath),
            detectBackend(projectPath),
        ]);
        
        analysis.frontend = { ...analysis.frontend, ...frontendAnalysis };
        analysis.backend = { ...analysis.backend, ...backendAnalysis };

        // Phase 5: Testing Tools Detection
        if (token?.isCancellationRequested) return analysis as ProjectAnalysis;
        progress?.report({ message: 'Identifying testing tools...', increment: 60 });
        
        const testingAnalysis = await detectTestingTools(projectPath);
        analysis.testing = testingAnalysis;
        analysis.projectInfo!.hasTests = 
            testingAnalysis.frameworks.length > 0 || 
            testingAnalysis.e2eTools.length > 0;

        // Phase 6: Dependency Classification
        if (token?.isCancellationRequested) return analysis as ProjectAnalysis;
        progress?.report({ message: 'Classifying dependencies...', increment: 75 });
        
        const dependencies = await classifyDependencies(projectPath);
        analysis.dependencies = dependencies;

        // Phase 7: Project Structure Analysis
        if (token?.isCancellationRequested) return analysis as ProjectAnalysis;
        progress?.report({ message: 'Analyzing project structure...', increment: 85 });
        
        const structure = await analyzeProjectStructure(projectPath);
        Object.assign(analysis.fileStructure!, structure);

        // Phase 8: Documentation Detection
        if (token?.isCancellationRequested) return analysis as ProjectAnalysis;
        progress?.report({ message: 'Checking for documentation...', increment: 95 });
        
        analysis.projectInfo!.hasDocumentation = await hasDocumentation(projectPath);

        // Phase 9: Metadata Extraction
        if (token?.isCancellationRequested) return analysis as ProjectAnalysis;
        progress?.report({ message: 'Extracting project metadata...', increment: 98 });
        
        const metadata = await extractProjectMetadata(projectPath);
        Object.assign(analysis.projectInfo!, metadata);

        progress?.report({ message: 'Analysis complete!', increment: 100 });

    } catch (error) {
        console.error('Error during project analysis:', error);
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Analysis error: ${error.message}`);
        }
    }

    return analysis as ProjectAnalysis;
}

// Helper Functions
async function scanForConfigFiles(projectPath: string): Promise<string[]> {
    const configPatterns = [
        'package.json',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        'tsconfig.json',
        'webpack.config.*',
        'vite.config.*',
        'next.config.*',
        'nuxt.config.*',
        '.eslintrc*',
        '.prettierrc*',
        '.babelrc*',
        'postcss.config.*',
        'tailwind.config.*',
        'docker-compose.*',
        'Dockerfile*',
        '.github/workflows/*',
        '.gitlab-ci.yml',
        '.travis.yml',
        'requirements.txt',
        'pyproject.toml',
        'Cargo.toml',
        'go.mod',
        'composer.json',
        'pom.xml',
        'build.gradle',
        'gradle.properties',
    ];

    const foundFiles: string[] = [];
    
    for (const pattern of configPatterns) {
        try {
            const files = await findFiles(projectPath, pattern);
            foundFiles.push(...files.map(f => path.relative(projectPath, f)));
        } catch (error) {
            // Pattern not found, continue
        }
    }
    
    return foundFiles;
}

async function detectPackageManager(projectPath: string): Promise<string[]> {
    const managers: string[] = [];
    
    const checks = [
        { file: 'package-lock.json', manager: 'npm' },
        { file: 'yarn.lock', manager: 'yarn' },
        { file: 'pnpm-lock.yaml', manager: 'pnpm' },
        { file: 'bun.lockb', manager: 'bun' },
        { file: 'requirements.txt', manager: 'pip' },
        { file: 'Cargo.lock', manager: 'cargo' },
        { file: 'go.mod', manager: 'go' },
        { file: 'composer.lock', manager: 'composer' },
    ];
    
    for (const check of checks) {
        try {
            await fs.access(path.join(projectPath, check.file));
            managers.push(check.manager);
        } catch {
            // File doesn't exist
        }
    }
    
    return managers;
}

async function analyzeProjectStructure(projectPath: string) {
    const structure = {
        entryPoints: [] as string[],
        configFiles: [] as string[],
        testDirectories: [] as string[],
        sourceDirectories: [] as string[],
        buildOutputs: [] as string[],
    };
    
    try {
        const entries = await fs.readdir(projectPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(projectPath, entry.name);
            const relativePath = path.relative(projectPath, fullPath);
            
            if (entry.isDirectory()) {
                if (entry.name.match(/^(src|lib|app|components|pages)$/i)) {
                    structure.sourceDirectories.push(relativePath);
                }
                if (entry.name.match(/^(test|tests|__tests__|spec|specs|cypress|e2e)$/i)) {
                    structure.testDirectories.push(relativePath);
                }
                if (entry.name.match(/^(dist|build|out|public|static)$/i)) {
                    structure.buildOutputs.push(relativePath);
                }
            } else {
                if (entry.name.match(/^(index|main|app)\.(js|ts|jsx|tsx|vue|svelte)$/)) {
                    structure.entryPoints.push(relativePath);
                }
            }
        }
    } catch (error) {
        console.error('Error analyzing project structure:', error);
    }
    
    return structure;
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

async function findFiles(dir: string, pattern: string): Promise<string[]> {
    const files: string[] = [];
    
    async function walk(currentPath: string) {
        try {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                
                if (entry.isDirectory()) {
                    // Skip node_modules and other large directories
                    if (!['node_modules', '.git', '.next', '.nuxt', 'dist', 'build'].includes(entry.name)) {
                        await walk(fullPath);
                    }
                } else if (entry.name.match(new RegExp(pattern.replace('*', '.*')))) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Directory might not be accessible
        }
    }
    
    await walk(dir);
    return files;
}