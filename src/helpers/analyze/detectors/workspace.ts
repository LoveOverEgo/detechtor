import * as path from 'path';
import { glob } from 'glob';
import { detectPackageManager } from './dependency';
import { WorkspaceProjectRoot } from '../../../types/interfaces/WorkspaceAnalysis.interface';

const MANIFEST_PATTERNS = [
    '**/package.json',
    '**/requirements.txt',
    '**/pyproject.toml',
    '**/Cargo.toml',
    '**/composer.json',
    '**/pom.xml',
    '**/build.gradle',
    '**/go.mod',
];

const IGNORE_PATTERNS = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/out/**',
    '**/.next/**',
    '**/.nuxt/**',
    '**/vendor/**',
];

function inferTypeHints(rootPath: string): string[] {
    const hints = new Set<string>();
    const normalized = rootPath.replace(/\\/g, '/').toLowerCase();

    if (normalized.includes('/client') || normalized.includes('/frontend') || normalized.includes('/web') || normalized.includes('/ui')) {
        hints.add('frontend');
    }

    if (normalized.includes('/server') || normalized.includes('/backend') || normalized.includes('/api')) {
        hints.add('backend');
    }

    if (normalized.includes('/service') || normalized.includes('/services')) {
        hints.add('service');
    }

    return Array.from(hints);
}

export async function detectWorkspaceProjects(workspacePath: string): Promise<WorkspaceProjectRoot[]> {
    const roots = new Map<string, Set<string>>();

    for (const pattern of MANIFEST_PATTERNS) {
        const files = await glob(pattern, {
            cwd: workspacePath,
            nodir: true,
            ignore: IGNORE_PATTERNS,
            dot: false,
        });

        for (const file of files) {
            const absolutePath = path.join(workspacePath, file);
            const rootDir = path.dirname(absolutePath);
            const existing = roots.get(rootDir) ?? new Set<string>();
            existing.add(file);
            roots.set(rootDir, existing);
        }
    }

    if (roots.size === 0) {
        roots.set(workspacePath, new Set());
    }

    const sortedRoots = Array.from(roots.entries()).sort(([a], [b]) => a.localeCompare(b));
    const results: WorkspaceProjectRoot[] = [];

    for (const [rootPath, manifestFiles] of sortedRoots) {
        const packageInfo = await detectPackageManager(rootPath);
        results.push({
            id: `proj-${String(results.length + 1).padStart(3, '0')}`,
            rootPath,
            name: path.basename(rootPath),
            manifestFiles: Array.from(manifestFiles).sort(),
            packageManagers: packageInfo.packageManagers,
            hasLockFile: packageInfo.hasLockFile,
            typeHints: inferTypeHints(rootPath),
        });
    }

    return results;
}
