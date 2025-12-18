import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { glob } from 'glob';
import { LanguageStats } from '../../../types/index';

const defaultIgnoredPatterns = [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/.nuxt/**',
        '**/out/**',
        '**/*.min.js',
        '**/*.min.css',
        '**/package-lock.json',
        '**/yarn.lock',
        '**/.DS_Store',
];

export async function detectLanguages(projectPath: string): Promise<string[]> {
    try {
        const stats = await analyzeLanguages(projectPath);
        return rankLanguages(stats);
    } catch (error) {
        console.error('Error detecting languages:', error);
        return await fallbackDetection(projectPath);
    }
}

async function analyzeLanguages(projectPath: string): Promise<LanguageStats> {
    const stats: LanguageStats = {};
    const ignoredPatterns = vscode.workspace.getConfiguration('Detechtor.setting').get('ignoredPaths', defaultIgnoredPatterns);

    try {
        // Get all files in project
        const files = await glob('**/*', {
            cwd: projectPath,
            ignore: ignoredPatterns,
            nodir: true,
            absolute: true,
        });

        // Process files in batches to avoid memory issues
        const batchSize = 100;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            await Promise.all(
                batch.map(async (filePath) => {
                    try {
                        const ext = path.extname(filePath).toLowerCase();
                        const language = await detectLanguageByFile(filePath, ext);

                        if (language) {
                            if (!stats[language]) {
                                stats[language] = {
                                    files: 0,
                                    lines: 0,
                                    bytes: 0,
                                    extensions: new Set(),
                                };
                            }

                            const fileStats = stats[language];
                            fileStats.files++;
                            fileStats.extensions.add(ext);

                            try {
                                const content = await fs.readFile(filePath, 'utf8');
                                fileStats.lines += content.split('\n').length;
                                fileStats.bytes += Buffer.byteLength(content);
                            } catch {
                                // Can't read file, just count it
                            }
                        }
                    } catch (error) {
                        // Skip problematic files
                    }
                })
            );
        }

        // Determine primary extension for each language
        for (const language in stats) {
            const langStats = stats[language];
            if (langStats.extensions.size > 0) {
                // Try to find the most common extension
                const extensions = Array.from(langStats.extensions);
                langStats.primaryExtension = extensions[0];
                
                // Prefer certain extensions for common languages
                if (language === 'JavaScript') {
                    if (extensions.includes('.js')) langStats.primaryExtension = '.js';
                    else if (extensions.includes('.jsx')) langStats.primaryExtension = '.jsx';
                } else if (language === 'TypeScript') {
                    if (extensions.includes('.ts')) langStats.primaryExtension = '.ts';
                    else if (extensions.includes('.tsx')) langStats.primaryExtension = '.tsx';
                }
            }
        }

        return stats;
    } catch (error) {
        throw new Error(`Failed to analyze languages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function detectLanguageByFile(filePath: string, ext: string): Promise<string | null> {
    const fileName = path.basename(filePath).toLowerCase();
    
    // Check by filename first (for config files without extensions)
    if (fileName === 'dockerfile') return 'Docker';
    if (fileName === 'makefile') return 'Makefile';
    if (fileName === '.env' || fileName.startsWith('.env.')) return 'Environment Variables';
    
    // Extension-based detection
    const extensionMap: { [key: string]: string } = {
        // Web
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.mjs': 'JavaScript',
        '.cjs': 'JavaScript',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.vue': 'Vue',
        '.svelte': 'Svelte',
        
        // HTML/CSS
        '.html': 'HTML',
        '.htm': 'HTML',
        '.css': 'CSS',
        '.scss': 'SCSS',
        '.sass': 'SASS',
        '.less': 'LESS',
        '.styl': 'Stylus',
        
        // Backend
        '.py': 'Python',
        '.java': 'Java',
        '.kt': 'Kotlin',
        '.scala': 'Scala',
        '.go': 'Go',
        '.rs': 'Rust',
        '.php': 'PHP',
        '.rb': 'Ruby',
        '.cs': 'C#',
        '.fs': 'F#',
        '.swift': 'Swift',
        '.c': 'C',
        '.cpp': 'C++',
        '.h': 'C/C++ Header',
        '.hpp': 'C++ Header',
        
        // Scripting
        '.sh': 'Shell',
        '.bash': 'Bash',
        '.zsh': 'Zsh',
        '.ps1': 'PowerShell',
        '.bat': 'Batch',
        '.cmd': 'Batch',
        
        // Data & Config
        '.json': 'JSON',
        '.yaml': 'YAML',
        '.yml': 'YAML',
        '.toml': 'TOML',
        '.xml': 'XML',
        '.csv': 'CSV',
        '.md': 'Markdown',
        '.txt': 'Text',
        '.ini': 'INI',
        '.cfg': 'Configuration',
        '.conf': 'Configuration',
        
        // Database
        '.sql': 'SQL',
        '.db': 'Database',
        '.sqlite': 'SQLite',
        
        // Build/Deploy
        '.dockerfile': 'Docker',
        '.lock': 'Lock File',
        
        // Other
        '.gitignore': 'Git Ignore',
        '.editorconfig': 'EditorConfig',
        '.prettierrc': 'Prettier',
        '.eslintrc': 'ESLint',
    };

    // Special handling for files without extensions
    if (!ext) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            if (content.startsWith('#!')) {
                const shebang = content.split('\n')[0];
                if (shebang.includes('python')) return 'Python';
                if (shebang.includes('node')) return 'JavaScript';
                if (shebang.includes('bash')) return 'Bash';
                if (shebang.includes('sh')) return 'Shell';
            }
        } catch {
            // Can't read file
        }
        return null;
    }

    return extensionMap[ext] || null;
}

export function rankLanguages(stats: LanguageStats): string[] {
    if (Object.keys(stats).length === 0) {
        return [];
    }

    // Calculate scores based on multiple factors
    const languages = Object.entries(stats).map(([language, data]) => {
        let score = 0;
        
        // Factor 1: Number of files (weight: 0.4)
        score += data.files * 0.4;
        
        // Factor 2: Lines of code (weight: 0.3)
        score += Math.log(data.lines + 1) * 0.3;
        
        // Factor 3: File size in MB (weight: 0.2)
        score += (data.bytes / (1024 * 1024)) * 0.2;
        
        // Factor 4: Language priority (weight: 0.1)
        const priorityMap: { [key: string]: number } = {
            'TypeScript': 10,
            'JavaScript': 9,
            'Python': 8,
            'Java': 7,
            'Go': 7,
            'Rust': 7,
            'C++': 6,
            'C#': 6,
            'PHP': 5,
            'Ruby': 5,
            'Swift': 6,
            'Kotlin': 6,
            'HTML': 4,
            'CSS': 4,
            'SCSS': 4,
            'SASS': 4,
            'Vue': 7,
            'Svelte': 7,
        };
        
        score += (priorityMap[language] || 1) * 0.1;
        
        return { language, score, ...data };
    });

    // Sort by score descending
    languages.sort((a, b) => b.score - a.score);

    // Get top languages (max 5)
    const topLanguages = languages.slice(0, 5).map(l => l.language);

    // Ensure JavaScript/TypeScript are included if they exist
    const hasJS = languages.some(l => l.language === 'JavaScript');
    const hasTS = languages.some(l => l.language === 'TypeScript');
    
    if (hasTS && !topLanguages.includes('TypeScript')) {
        topLanguages.push('TypeScript');
    }
    if (hasJS && !topLanguages.includes('JavaScript')) {
        topLanguages.push('JavaScript');
    }

    return topLanguages;
}

async function fallbackDetection(projectPath: string): Promise<string[]> {
    const languages = new Set<string>();
    
    // Check for common configuration files
    const configChecks = [
        { file: 'package.json', language: 'JavaScript' },
        { file: 'tsconfig.json', language: 'TypeScript' },
        { file: 'requirements.txt', language: 'Python' },
        { file: 'pyproject.toml', language: 'Python' },
        { file: 'go.mod', language: 'Go' },
        { file: 'Cargo.toml', language: 'Rust' },
        { file: 'pom.xml', language: 'Java' },
        { file: 'build.gradle', language: 'Java' },
        { file: 'composer.json', language: 'PHP' },
        { file: 'Gemfile', language: 'Ruby' },
        { file: '*.csproj', language: 'C#' },
    ];

    for (const check of configChecks) {
        try {
            const files = await glob(check.file, { cwd: projectPath, nodir: true });
            if (files.length > 0) {
                languages.add(check.language);
            }
        } catch {
            // Continue checking other files
        }
    }

    // Quick scan of a few files to detect languages
    try {
        const files = await glob('*.*', { 
            cwd: projectPath, 
            nodir: true,
            ignore: ['node_modules/**', '.git/**'],
            maxDepth: 2 
        });
        
        for (const file of files.slice(0, 50)) { // Limit to 50 files
            const ext = path.extname(file).toLowerCase();
            const language = await detectLanguageByFile(file, ext);
            if (language) {
                languages.add(language);
            }
        }
    } catch (error) {
        // Couldn't scan files
    }

    return Array.from(languages);
}