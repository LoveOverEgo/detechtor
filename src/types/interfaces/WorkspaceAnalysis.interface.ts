import { ProjectAnalysis } from './ProjectAnalysis.interface';

export interface WorkspaceProjectRoot {
    id: string;
    rootPath: string;
    name: string;
    manifestFiles: string[];
    packageManagers: string[];
    hasLockFile: boolean;
    typeHints: string[];
}

export interface WorkspaceAnalysis {
    roots: WorkspaceProjectRoot[];
    projects: ProjectAnalysis[];
    summary: {
        projectCount: number;
    };
}
