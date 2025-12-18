
export interface ProjectAnalysis {
    projectId?: string;
    rootPath?: string;
    projectTypeHints?: string[];
    components: ComponentAnalysis[];
    languages: string[];
    frontend: FrontendAnalysis;
    backend: BackendAnalysis;
    testing: TestingAnalysis;
    dependencies: DependencyAnalysis;
    projectInfo: ProjectInfo;
    fileStructure: ProjectFileStructure;
    testStructure: {
        testDirectory: string[];
        testFilePatterns: string[]; 
    };
    timestamps: {
        analysisDate: string;
        projectLastModified?: string;
    };
}

export interface ComponentAnalysis {
    id: string;
    kind: ComponentKind;
    name?: string;
    rootPath: string;
    languages: string[];
    packageManagers: string[];
    hasLockFile: boolean;
    dependencies?: DependencyAnalysis;
    testing?: TestingAnalysis;
    fileStructure?: ProjectFileStructure;
    frontend?: FrontendAnalysis;
    backend?: BackendAnalysis;
    technologies: TechnologyDescriptor[];
}

export type ComponentKind = 'frontend' | 'backend' | 'service' | 'library' | 'unknown';

export type TechnologyKind =
    | 'framework'
    | 'runtime'
    | 'meta-framework'
    | 'build-tool'
    | 'css'
    | 'ui'
    | 'database'
    | 'orm'
    | 'service'
    | 'testing'
    | 'other';

export interface TechnologyDescriptor {
    name: string;
    version?: string;
    kind: TechnologyKind;
}

export interface FrontendAnalysis {
    framework: Framework;
    frameworks?: Framework[];
    hasRouter: boolean;
    hasStateManagement: boolean;
    buildTool?: string;
    buildToolVersion?: string;
    cssFramework?: string;
    cssPreprocessor?: string;
    uiLibrary?: string;
    iconsLibrary?: string;
    formLibrary?: string;
    chartLibrary?: string;
    internationalization?: string;
    metaFrameworks: string[];
    features: {
        hasTypeScript: boolean;
        hasJSX: boolean;
        hasSSR: boolean;
        hasStaticSite: boolean;
        hasPWA: boolean;
        hasMobile: boolean;
        hasDesktop: boolean;
        hasTesting: boolean;
        hasStorybook: boolean;
        hasLinting: boolean;
        hasFormatting: boolean;
    };
    configFiles: string[];
    entryPoints: string[];
    sourceDirectories: string[];
    testDirectories: string[];
}

export interface Framework {
    name: string;
    version?: string;
    server?: string;
    hasRouter?: boolean;
    hasStateManagement?: boolean;
}

export interface BackendAnalysis {
    framework: Framework;
    frameworks?: Framework[];
    runtime?: string;
    runtimes?: string[];
    servers?: string[];
    database: string[];
    orm?: string;
    server?: string;
    authentication?: string[];
    caching?: string[];
    messaging?: string[];
    search?: string[];
    monitoring?: string[];
    features: {
        hasGraphQL: boolean;
        hasREST: boolean;
        hasWebSockets: boolean;
        hasMicroservices: boolean;
        hasQueue: boolean;
        hasCronJobs: boolean;
        hasFileUpload: boolean;
        hasValidation: boolean;
        hasTesting: boolean;
        hasDocumentation: boolean;
    };
    deployment: {
        hasDocker: boolean;
        hasKubernetes: boolean;
        hasCI: boolean;
        cloudProvider?: string;
    };
    configFiles: string[];
    entryPoints: string[];
    apiRoutes: string[];
    models: string[];
}

export interface ProjectInfo {
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
}

export interface ProjectFileStructure {
    entryPoints: string[];
    configFiles: string[];
    testDirectories: string[];
    sourceDirectories: string[];
    buildOutputs: string[];
}

export interface Dependency {
    name: string;
    version: string;
    category: string;
    description?: string;
    license?: string;
    repository?: string;
    homepage?: string;
    dependencies?: string[];
    peerDependencies?: string[];
    devDependencies?: string[];
    optionalDependencies?: string[];
}

export interface ClassifiedDependencies {
    production: Dependency[];
    development: Dependency[];
    peer: Dependency[];
    optional: Dependency[];
    all: Dependency[];
}

export interface DependencyAnalysis {
    classified: ClassifiedDependencies;
    packageManagers: string[];
    hasLockFile: boolean;
    totalDependencies: number;
    uniqueCategories: Set<string>;
    riskAssessment: {
        outdatedCount: number;
        deprecatedCount: number;
        unlicensedCount: number;
        largeSizeCount: number;
    };
}

export interface TestingAnalysis {
    frameworks: string[];
    coverageTools: string[];
    e2eTools: string[];
    assertionLibraries: string[];
    mockingLibraries: string[];
    snapshotTesting: boolean;
    visualTesting: boolean;
    performanceTesting: boolean;
    securityTesting: boolean;
    testStructure: {
        testDirectory: string;
        testFilePatterns: string[];
        fixtureDirectory?: string;
        mockDirectory?: string;
        snapshotDirectory?: string;
    };
    configFiles: string[];
    scripts: {
        test?: string;
        testWatch?: string;
        testCoverage?: string;
        testE2E?: string;
        testUnit?: string;
        testIntegration?: string;
    };
    languages: string[];
    features: {
        hasParallelTesting: boolean;
        hasCIIntegration: boolean;
        hasReporters: boolean;
        hasWatchMode: boolean;
        hasDebugging: boolean;
        hasIsolation: boolean;
    };
}
