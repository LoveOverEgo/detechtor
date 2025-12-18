import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Check if the given project path exists.
 * @param projectPath folder path
 */
export async function pathExists(projectPath: string): Promise<void> {
    try {
        await fs.access(projectPath);
    } catch {
        throw new Error(`Project path does not exist: ${projectPath}`);
    }
}


export async function scanForConfigFiles(projectPath: string): Promise<string[]> {
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

export async function findFiles(dir: string, pattern: string): Promise<string[]> {
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