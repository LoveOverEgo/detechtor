import * as fs from 'fs/promises';
import * as path from 'path';

export async function analyzeProjectStructure(projectPath: string) {
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