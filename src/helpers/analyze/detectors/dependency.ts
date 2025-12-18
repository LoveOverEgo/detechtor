import * as fs from 'fs/promises';
import * as path from 'path';
import { ClassifiedDependencies, DependencyAnalysis, Dependency, DEPENDENCY_CATEGORIES, PACKAGE_CATEGORIES } from '../../../types/index';

export async function classifyDependencies(projectPath: string): Promise<ClassifiedDependencies> {
    try {
        const analysis = await analyzeDependencies(projectPath);
        return analysis.classified;
    } catch (error) {
        console.error('Error classifying dependencies:', error);
        return {
            production: [],
            development: [],
            peer: [],
            optional: [],
            all: [],
        };
    }
}

export async function analyzeDependencies(projectPath: string): Promise<DependencyAnalysis> {
    const classified: ClassifiedDependencies = {
        production: [],
        development: [],
        peer: [],
        optional: [],
        all: [],
    };

    const uniqueCategories = new Set<string>();
    let packageManagers: string[] = [];
    let hasLockFile = false;
    let totalDependencies = 0;

    try {
        // Detect package manager and lock files
        const lockFiles = await detectPackageManager(projectPath);
        packageManagers = lockFiles.packageManagers;
        hasLockFile = lockFiles.hasLockFile;

        // Read package.json or equivalent
        const deps = await readDependencies(projectPath);
        
        if (deps) {
            // Classify each dependency
            for (const [depName, depData] of Object.entries(deps.dependencies || {})) {
                const dependency = await createDependencyObject(depName, depData, 'production');
                classified.production.push(dependency);
                classified.all.push(dependency);
            }

            for (const [depName, depData] of Object.entries(deps.devDependencies || {})) {
                const dependency = await createDependencyObject(depName, depData, 'development');
                classified.development.push(dependency);
                classified.all.push(dependency);
            }

            for (const [depName, depData] of Object.entries(deps.peerDependencies || {})) {
                const dependency = await createDependencyObject(depName, depData, 'peer');
                classified.peer.push(dependency);
                classified.all.push(dependency);
            }

            for (const [depName, depData] of Object.entries(deps.optionalDependencies || {})) {
                const dependency = await createDependencyObject(depName, depData, 'optional');
                classified.optional.push(dependency);
                classified.all.push(dependency);
            }

            totalDependencies = classified.all.length;
            
            // Collect unique categories
            classified.all.forEach(dep => {
                if (dep.category) {
                    uniqueCategories.add(dep.category);
                }
            });
        }

        // Perform risk assessment
        const riskAssessment = await assessDependencyRisks(projectPath, classified.all);

        return {
            classified,
            packageManagers,
            hasLockFile,
            totalDependencies,
            uniqueCategories,
            riskAssessment,
        };
    } catch (error) {
        console.error('Error analyzing dependencies:', error);
        throw error;
    }
}

async function createDependencyObject(
    name: string, 
    versionData: any, 
    type: 'production' | 'development' | 'peer' | 'optional'
): Promise<Dependency> {
    const version = typeof versionData === 'string' ? versionData : JSON.stringify(versionData);
    
    // Determine category
    let category = DEPENDENCY_CATEGORIES.OTHER;
    
    // Check exact match first
    if (PACKAGE_CATEGORIES[name]) {
        category = PACKAGE_CATEGORIES[name];
    } else {
        // Check for scoped packages
        const scopedMatch = Object.keys(PACKAGE_CATEGORIES).find(key => 
            name.startsWith(key.replace('/*', ''))
        );
        if (scopedMatch) {
            category = PACKAGE_CATEGORIES[scopedMatch];
        } else {
            // Check for partial matches (for packages like @org/package)
            for (const [pkg, cat] of Object.entries(PACKAGE_CATEGORIES)) {
                if (name.includes(pkg) || name.startsWith(pkg.replace('/*', ''))) {
                    category = cat;
                    break;
                }
            }
        }
    }

    // Enhanced categorization based on package name patterns
    if (category === DEPENDENCY_CATEGORIES.OTHER) {
        category = guessCategoryFromName(name);
    }

    return {
        name,
        version,
        category,
        description: '',
        license: '',
        repository: '',
        homepage: '',
    };
}

function guessCategoryFromName(name: string): string {
    const nameLower = name.toLowerCase();
    
    // Testing
    if (nameLower.includes('test') || nameLower.includes('spec')) {
        return DEPENDENCY_CATEGORIES.TESTING;
    }
    
    // Assertion libraries
    if (nameLower.includes('assert') || nameLower.includes('expect')) {
        return DEPENDENCY_CATEGORIES.ASSERTION;
    }
    
    // Mocking
    if (nameLower.includes('mock') || nameLower.includes('stub')) {
        return DEPENDENCY_CATEGORIES.MOCKING;
    }
    
    // Type definitions
    if (nameLower.startsWith('@types/')) {
        return DEPENDENCY_CATEGORIES.TYPES;
    }
    
    // CSS
    if (nameLower.includes('css') || nameLower.includes('style')) {
        return DEPENDENCY_CATEGORIES.CSS_FRAMEWORK;
    }
    
    // UI components
    if (nameLower.includes('ui') || nameLower.includes('component')) {
        return DEPENDENCY_CATEGORIES.UI_LIBRARY;
    }
    
    // Icons
    if (nameLower.includes('icon')) {
        return DEPENDENCY_CATEGORIES.ICON_LIBRARY;
    }
    
    // Date handling
    if (nameLower.includes('date') || nameLower.includes('time')) {
        return DEPENDENCY_CATEGORIES.DATE;
    }
    
    // HTTP clients
    if (nameLower.includes('fetch') || nameLower.includes('http') || nameLower.includes('request')) {
        return DEPENDENCY_CATEGORIES.HTTP_CLIENT;
    }
    
    // Logging
    if (nameLower.includes('log')) {
        return DEPENDENCY_CATEGORIES.LOGGING;
    }
    
    // Database
    if (nameLower.includes('db') || nameLower.includes('database') || nameLower.includes('sql')) {
        return DEPENDENCY_CATEGORIES.DATABASE;
    }
    
    // Authentication
    if (nameLower.includes('auth') || nameLower.includes('jwt') || nameLower.includes('oauth')) {
        return DEPENDENCY_CATEGORIES.AUTH;
    }
    
    // Validation
    if (nameLower.includes('valid') || nameLower.includes('schema')) {
        return DEPENDENCY_CATEGORIES.VALIDATION;
    }
    
    // Build tools
    if (nameLower.includes('build') || nameLower.includes('compile')) {
        return DEPENDENCY_CATEGORIES.BUILD_TOOL;
    }
    
    // Development tools
    if (nameLower.includes('dev') || nameLower.includes('watch') || nameLower.includes('hot')) {
        return DEPENDENCY_CATEGORIES.DEVELOPMENT;
    }
    
    return DEPENDENCY_CATEGORIES.OTHER;
}

export async function detectPackageManager(projectPath: string): Promise<{ packageManagers: string[]; hasLockFile: boolean }> {
    let hasLockFile = false;
    const managers: string[] = [];
    const lockFiles = [
        { file: 'package-lock.json', manager: 'npm' },
        { file: 'yarn.lock', manager: 'yarn' },
        { file: 'pnpm-lock.yaml', manager: 'pnpm' },
        { file: 'bun.lockb', manager: 'bun' },
        { file: 'requirements.txt', manager: 'pip' },
        { file: 'Cargo.lock', manager: 'cargo' },
        { file: 'go.mod', manager: 'go' },
        { file: 'composer.lock', manager: 'composer' },
        { file: 'Gemfile.lock', manager: 'bundler' },
        { file: 'Pipfile.lock', manager: 'pipenv' },
        { file: 'poetry.lock', manager: 'poetry' },
    ];

    for (const lockFile of lockFiles) {
        try {
            await fs.access(path.join(projectPath, lockFile.file));
            managers.push(lockFile.manager);
        } catch {
            // Continue checking other lock files
        }
    }

    if (managers.length === 0) {
        // Check for package manager in package.json scripts
        try {
            const packageJsonPath = path.join(projectPath, 'package.json');
            const content = await fs.readFile(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(content);
            
            if (packageJson.scripts) {
                const scripts = Object.values(packageJson.scripts).join(' ');
                if (scripts.includes('yarn')) managers.push('yarn');
                if (scripts.includes('pnpm')) managers.push('pnpm');
                if (scripts.includes('bun')) managers.push('bun');
            }
        } catch {
            // Couldn't read package.json
        }
    } else {
        hasLockFile = true;
    }

    return { packageManagers: managers, hasLockFile};
}

export async function readDependencies(projectPath: string): Promise<any> {
    // Try different package manifest files
    const manifestFiles = [
        'package.json',
        'Cargo.toml',
        'pyproject.toml',
        'composer.json',
        'build.gradle',
        'pom.xml',
        'go.mod',
    ];

    for (const file of manifestFiles) {
        try {
            const filePath = path.join(projectPath, file);
            await fs.access(filePath);
            const content = await fs.readFile(filePath, 'utf8');
            
            if (file === 'package.json') {
                return JSON.parse(content);
            } else if (file === 'Cargo.toml') {
                return parseTomlDependencies(content, 'cargo');
            } else if (file === 'pyproject.toml') {
                return parseTomlDependencies(content, 'python');
            } else if (file === 'composer.json') {
                const composer = JSON.parse(content);
                return {
                    dependencies: composer.require,
                    devDependencies: composer['require-dev'],
                };
            }
        } catch {
            // File doesn't exist or can't be parsed
        }
    }

    return null;
}

function parseTomlDependencies(content: string, type: 'cargo' | 'python'): any {
    // Simple TOML parsing for dependencies section
    const lines = content.split('\n');
    const result: any = { dependencies: {}, devDependencies: {} };
    let inDependencies = false;
    let inDevDependencies = false;

    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('[')) {
            inDependencies = trimmed.includes('[dependencies]');
            inDevDependencies = trimmed.includes('[dev-dependencies]') || 
                               (type === 'python' && trimmed.includes('[tool.poetry.dev-dependencies]'));
        } else if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith(';')) {
            const match = trimmed.match(/^([\w\-]+)\s*=\s*["']?([^"'\s]+)["']?/);
            if (match) {
                const [_, name, version] = match;
                if (inDependencies) {
                    result.dependencies[name] = version;
                } else if (inDevDependencies) {
                    result.devDependencies[name] = version;
                }
            }
        }
    }

    return result;
}

export async function assessDependencyRisks(
    projectPath: string,
    dependencies: Dependency[]
): Promise<DependencyAnalysis['riskAssessment']> {
    const riskAssessment = {
        outdatedCount: 0,
        deprecatedCount: 0,
        unlicensedCount: 0,
        largeSizeCount: 0,
    };

    // Check for common outdated patterns
    const outdatedPatterns = [
        /^\^?0\./, // 0.x versions (unstable)
        /^\^?[0-9]+\.[0-9]+$/, // Major.minor only (could be outdated)
        /alpha|beta|rc|dev|snapshot/i, // Pre-release versions
    ];

    for (const dep of dependencies) {
        // Check for outdated version patterns
        if (outdatedPatterns.some(pattern => pattern.test(dep.version))) {
            riskAssessment.outdatedCount++;
        }

        // Check for deprecated packages (common ones)
        const deprecatedPackages = [
            'request',
            'gulp-util',
            'fsevents',
            'hoek',
            'debug',
            'minimatch',
        ];
        if (deprecatedPackages.includes(dep.name)) {
            riskAssessment.deprecatedCount++;
        }

        // Note: More comprehensive checks would require npm registry API calls
        // For now, we'll do basic pattern matching
    }

    return riskAssessment;
}

// Utility functions for external use
export function getDependencyCategories(): typeof DEPENDENCY_CATEGORIES {
    return DEPENDENCY_CATEGORIES;
}

export function getPackageCategories(): { [key: string]: string } {
    return PACKAGE_CATEGORIES;
}

export function categorizeDependency(name: string): string {
    if (PACKAGE_CATEGORIES[name]) {
        return PACKAGE_CATEGORIES[name];
    }
    return guessCategoryFromName(name);
}

export async function getDependencyTree(projectPath: string): Promise<Map<string, string[]>> {
    const tree = new Map<string, string[]>();
    
    try {
        const nodeModulesPath = path.join(projectPath, 'node_modules');
        await fs.access(nodeModulesPath);
        
        const packages = await fs.readdir(nodeModulesPath);
        
        for (const pkg of packages) {
            if (pkg.startsWith('.')) continue;
            
            const pkgPath = path.join(nodeModulesPath, pkg, 'package.json');
            try {
                const content = await fs.readFile(pkgPath, 'utf8');
                const pkgJson = JSON.parse(content);
                
                const deps = [
                    ...Object.keys(pkgJson.dependencies || {}),
                    ...Object.keys(pkgJson.peerDependencies || {}),
                ];
                
                if (deps.length > 0) {
                    tree.set(pkg, deps);
                }
            } catch {
                // Skip invalid packages
            }
        }
    } catch {
        // No node_modules directory
    }
    
    return tree;
}