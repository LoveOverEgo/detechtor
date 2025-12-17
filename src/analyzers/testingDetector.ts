import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

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

export async function detectTestingTools(projectPath: string): Promise<TestingAnalysis> {
    const analysis: TestingAnalysis = {
        frameworks: [],
        coverageTools: [],
        e2eTools: [],
        assertionLibraries: [],
        mockingLibraries: [],
        snapshotTesting: false,
        visualTesting: false,
        performanceTesting: false,
        securityTesting: false,
        testStructure: {
            testDirectory: '',
            testFilePatterns: [],
        },
        configFiles: [],
        scripts: {},
        languages: [],
        features: {
            hasParallelTesting: false,
            hasCIIntegration: false,
            hasReporters: false,
            hasWatchMode: false,
            hasDebugging: false,
            hasIsolation: false,
        },
    };

    try {
        // Phase 1: Detect from package.json dependencies and scripts
        const packageAnalysis = await analyzePackageJson(projectPath);
        Object.assign(analysis, packageAnalysis);

        // Phase 2: Detect from configuration files
        const configAnalysis = await analyzeConfigFiles(projectPath);
        analysis.configFiles = configAnalysis.configFiles;
        analysis.features = { ...analysis.features, ...configAnalysis.features };

        // Phase 3: Analyze test directory structure
        const structureAnalysis = await analyzeTestStructure(projectPath);
        analysis.testStructure = { ...analysis.testStructure, ...structureAnalysis };

        // Phase 4: Detect from test file patterns
        const fileAnalysis = await analyzeTestFiles(projectPath, analysis.frameworks);
        Object.assign(analysis, fileAnalysis);

        // Phase 5: Detect languages used in tests
        analysis.languages = await detectTestLanguages(projectPath);

        // Phase 6: Detect additional testing features
        const featureAnalysis = await detectTestingFeatures(projectPath, analysis.frameworks);
        Object.assign(analysis, featureAnalysis);

        // Phase 7: Clean up and deduplicate
        analysis.frameworks = [...new Set(analysis.frameworks)];
        analysis.coverageTools = [...new Set(analysis.coverageTools)];
        analysis.e2eTools = [...new Set(analysis.e2eTools)];
        analysis.assertionLibraries = [...new Set(analysis.assertionLibraries)];
        analysis.mockingLibraries = [...new Set(analysis.mockingLibraries)];

        return analysis;
    } catch (error) {
        console.error('Error detecting testing tools:', error);
        return analysis;
    }
}

async function analyzePackageJson(projectPath: string): Promise<Partial<TestingAnalysis>> {
    const result: Partial<TestingAnalysis> = {
        frameworks: [],
        coverageTools: [],
        e2eTools: [],
        assertionLibraries: [],
        mockingLibraries: [],
        scripts: {},
    };

    try {
        const packageJson = await readPackageJson(projectPath);
        if (!packageJson) return result;

        const deps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };

        // Unit Testing Frameworks
        if (deps['jest']) {
            result.frameworks!.push('Jest');
            result.snapshotTesting = true;
        }
        if (deps['vitest']) {
            result.frameworks!.push('Vitest');
        }
        if (deps['mocha']) {
            result.frameworks!.push('Mocha');
        }
        if (deps['jasmine']) {
            result.frameworks!.push('Jasmine');
        }
        if (deps['ava']) {
            result.frameworks!.push('AVA');
        }
        if (deps['tape']) {
            result.frameworks!.push('Tape');
        }
        if (deps['qunit']) {
            result.frameworks!.push('QUnit');
        }
        if (deps['pytest']) {
            result.frameworks!.push('pytest');
        }
        if (deps['unittest']) {
            result.frameworks!.push('unittest');
        }
        if (deps['junit']) {
            result.frameworks!.push('JUnit');
        }
        if (deps['testng']) {
            result.frameworks!.push('TestNG');
        }

        // React/Vue/Angular Testing Libraries
        if (deps['@testing-library/react'] || deps['@testing-library/react-hooks']) {
            result.frameworks!.push('React Testing Library');
        }
        if (deps['@testing-library/vue']) {
            result.frameworks!.push('Vue Testing Library');
        }
        if (deps['@testing-library/angular']) {
            result.frameworks!.push('Angular Testing Library');
        }
        if (deps['@testing-library/svelte']) {
            result.frameworks!.push('Svelte Testing Library');
        }
        if (deps['enzyme']) {
            result.frameworks!.push('Enzyme');
        }

        // Assertion Libraries
        if (deps['chai']) {
            result.assertionLibraries!.push('Chai');
        }
        if (deps['assert']) {
            result.assertionLibraries!.push('Node.js assert');
        }
        if (deps['power-assert']) {
            result.assertionLibraries!.push('Power Assert');
        }
        if (deps['should']) {
            result.assertionLibraries!.push('Should.js');
        }
        if (deps['expect']) {
            result.assertionLibraries!.push('Expect.js');
        }

        // Mocking Libraries
        if (deps['sinon']) {
            result.mockingLibraries!.push('Sinon.js');
        }
        if (deps['nock']) {
            result.mockingLibraries!.push('Nock');
        }
        if (deps['jest-mock'] || deps['@jest/mock']) {
            result.mockingLibraries!.push('Jest Mocks');
        }
        if (deps['testdouble']) {
            result.mockingLibraries!.push('TestDouble');
        }
        if (deps['mock-fs']) {
            result.mockingLibraries!.push('mock-fs');
        }

        // E2E Testing Tools
        if (deps['cypress']) {
            result.e2eTools!.push('Cypress');
            result.visualTesting = true;
        }
        if (deps['playwright']) {
            result.e2eTools!.push('Playwright');
        }
        if (deps['puppeteer']) {
            result.e2eTools!.push('Puppeteer');
        }
        if (deps['selenium-webdriver']) {
            result.e2eTools!.push('Selenium');
        }
        if (deps['testcafe']) {
            result.e2eTools!.push('TestCafe');
        }
        if (deps['nightwatch']) {
            result.e2eTools!.push('Nightwatch.js');
        }
        if (deps['webdriverio']) {
            result.e2eTools!.push('WebdriverIO');
        }
        if (deps['protractor']) {
            result.e2eTools!.push('Protractor');
        }

        // Coverage Tools
        if (deps['istanbul'] || deps['nyc']) {
            result.coverageTools!.push('Istanbul/NYC');
        }
        if (deps['c8']) {
            result.coverageTools!.push('c8');
        }
        if (deps['@vitest/coverage-v8'] || deps['@vitest/coverage-istanbul']) {
            result.coverageTools!.push('Vitest Coverage');
        }
        if (deps['coverage']) {
            result.coverageTools!.push('coverage.py');
        }
        if (deps['jacoco']) {
            result.coverageTools!.push('JaCoCo');
        }

        // Performance Testing
        if (deps['autocannon'] || deps['wrk']) {
            result.performanceTesting = true;
        }
        if (deps['artillery']) {
            result.performanceTesting = true;
            result.frameworks!.push('Artillery');
        }
        if (deps['k6']) {
            result.performanceTesting = true;
            result.frameworks!.push('k6');
        }

        // Security Testing
        if (deps['snyk'] || deps['npm-audit']) {
            result.securityTesting = true;
        }
        if (deps['owasp-zap'] || deps['zap-api-scan']) {
            result.securityTesting = true;
        }

        // Snapshot Testing (additional)
        if (deps['jest-serializer-vue'] || deps['jest-serializer-html']) {
            result.snapshotTesting = true;
        }

        // Visual Testing
        if (deps['loki'] || deps['storybook']) {
            result.visualTesting = true;
        }
        if (deps['reg-suit'] || deps['backstopjs']) {
            result.visualTesting = true;
        }
        if (deps['applitools'] || deps['percy']) {
            result.visualTesting = true;
        }

        // Extract test scripts
        if (packageJson.scripts) {
            const scripts = packageJson.scripts;
            result.scripts = {
                test: scripts.test,
                testWatch: scripts['test:watch'] || scripts['test-watch'],
                testCoverage: scripts['test:coverage'] || scripts['test-coverage'] || scripts.coverage,
                testE2E: scripts['test:e2e'] || scripts['test-e2e'] || scripts.e2e,
                testUnit: scripts['test:unit'] || scripts['test-unit'] || scripts.unit,
                testIntegration: scripts['test:integration'] || scripts['test-integration'] || scripts.integration,
            };
        }

    } catch (error) {
        console.error('Error analyzing package.json:', error);
    }

    return result;
}

async function analyzeConfigFiles(projectPath: string): Promise<{ configFiles: string[]; features: Partial<TestingAnalysis['features']> }> {
    const result = {
        configFiles: [] as string[],
        features: {
            hasParallelTesting: false,
            hasCIIntegration: false,
            hasReporters: false,
            hasWatchMode: false,
            hasDebugging: false,
            hasIsolation: false,
        } as Partial<TestingAnalysis['features']>,
    };

    const configPatterns = [
        // Jest
        'jest.config.*',
        'jest.*.js',
        'jest.*.json',
        'jest.*.ts',
        
        // Vitest
        'vitest.config.*',
        
        // Mocha
        '.mocharc.*',
        'mocha.*.js',
        
        // Cypress
        'cypress.config.*',
        'cypress.json',
        'cypress/cypress.*',
        
        // Playwright
        'playwright.config.*',
        
        // Puppeteer
        'puppeteer.config.*',
        
        // Other
        'karma.conf.*',
        'protractor.conf.*',
        '.nycrc',
        '.nycrc.*',
        'istanbul.*.yml',
        '.testcaferc.*',
        'nightwatch.conf.*',
        'nightwatch.json',
        
        // Coverage
        '.coveragerc',
        'coverage.*.yml',
        
        // CI Integration
        '.github/workflows/*test*.yml',
        '.gitlab-ci.yml',
        '.travis.yml',
        'azure-pipelines.yml',
        'jenkinsfile',
    ];

    try {
        for (const pattern of configPatterns) {
            const files = await glob(pattern, {
                cwd: projectPath,
                ignore: ['node_modules/**', 'dist/**', 'build/**'],
                nodir: true,
                maxDepth: 3,
            });
            result.configFiles.push(...files);
        }

        // Analyze config files for features
        for (const configFile of result.configFiles.slice(0, 5)) { // Limit to 5 files
            try {
                const content = await fs.readFile(path.join(projectPath, configFile), 'utf8');
                
                // Check for parallel testing
                if (content.includes('maxWorkers') || content.includes('maxConcurrency') || 
                    content.includes('parallel') || content.includes('workers')) {
                    result.features.hasParallelTesting = true;
                }
                
                // Check for reporters
                if (content.includes('reporters') || content.includes('reporter')) {
                    result.features.hasReporters = true;
                }
                
                // Check for watch mode
                if (content.includes('watch') || content.includes('watchAll')) {
                    result.features.hasWatchMode = true;
                }
                
                // Check for debugging
                if (content.includes('inspect') || content.includes('debug') || content.includes('inspect-brk')) {
                    result.features.hasDebugging = true;
                }
                
                // Check for isolation
                if (content.includes('isolate') || content.includes('sandbox') || content.includes('runInNewContext')) {
                    result.features.hasIsolation = true;
                }
                
                // Check for CI integration
                if (configFile.includes('.github') || configFile.includes('.gitlab') || 
                    configFile.includes('.travis') || configFile.includes('azure')) {
                    result.features.hasCIIntegration = true;
                }
            } catch {
                // Can't read config file
            }
        }

    } catch (error) {
        console.error('Error analyzing config files:', error);
    }

    return result;
}

async function analyzeTestStructure(projectPath: string): Promise<Partial<TestingAnalysis['testStructure']>> {
    const result: Partial<TestingAnalysis['testStructure']> = {
        testDirectory: '',
        testFilePatterns: [],
        fixtureDirectory: undefined,
        mockDirectory: undefined,
        snapshotDirectory: undefined,
    };

    const commonTestDirs = [
        'test',
        'tests',
        '__tests__',
        'spec',
        'specs',
        'e2e',
        'cypress',
        '__spec__',
    ];

    const commonFixtureDirs = [
        'fixtures',
        '__fixtures__',
        'test/fixtures',
        'tests/fixtures',
        'cypress/fixtures',
    ];

    const commonMockDirs = [
        '__mocks__',
        'mocks',
        'test/mocks',
        'tests/mocks',
    ];

    const commonSnapshotDirs = [
        '__snapshots__',
        'snapshots',
        'test/snapshots',
        'tests/snapshots',
    ];

    try {
        // Find test directory
        for (const testDir of commonTestDirs) {
            try {
                await fs.access(path.join(projectPath, testDir));
                result.testDirectory = testDir;
                break;
            } catch {
                // Directory doesn't exist
            }
        }

        // If no standard test directory found, check for nested test directories
        if (!result.testDirectory) {
            const nestedTestDirs = await glob('**/{test,tests,__tests__,spec,specs}', {
                cwd: projectPath,
                ignore: ['node_modules/**', 'dist/**', 'build/**'],
                maxDepth: 3,
            });
            if (nestedTestDirs.length > 0) {
                result.testDirectory = nestedTestDirs[0];
            }
        }

        // Find fixture directory
        for (const fixtureDir of commonFixtureDirs) {
            try {
                await fs.access(path.join(projectPath, fixtureDir));
                result.fixtureDirectory = fixtureDir;
                break;
            } catch {
                // Directory doesn't exist
            }
        }

        // Find mock directory
        for (const mockDir of commonMockDirs) {
            try {
                await fs.access(path.join(projectPath, mockDir));
                result.mockDirectory = mockDir;
                break;
            } catch {
                // Directory doesn't exist
            }
        }

        // Find snapshot directory
        for (const snapshotDir of commonSnapshotDirs) {
            try {
                await fs.access(path.join(projectPath, snapshotDir));
                result.snapshotDirectory = snapshotDir;
                break;
            } catch {
                // Directory doesn't exist
            }
        }

        // Detect test file patterns
        const testFilePatterns = [
            '**/*.test.{js,jsx,ts,tsx}',
            '**/*.spec.{js,jsx,ts,tsx}',
            '**/*Test.{js,jsx,ts,tsx}',
            '**/*Spec.{js,jsx,ts,tsx}',
            '**/test/**/*.{js,jsx,ts,tsx}',
            '**/tests/**/*.{js,jsx,ts,tsx}',
            '**/__tests__/**/*.{js,jsx,ts,tsx}',
        ];

        const foundPatterns = new Set<string>();
        for (const pattern of testFilePatterns) {
            const files = await glob(pattern, {
                cwd: projectPath,
                ignore: ['node_modules/**', 'dist/**', 'build/**'],
                maxDepth: 4,
            });
            if (files.length > 0) {
                // Extract pattern from filename
                const sampleFile = files[0];
                if (sampleFile.includes('.test.')) {
                    foundPatterns.add('*.test.{js,jsx,ts,tsx}');
                } else if (sampleFile.includes('.spec.')) {
                    foundPatterns.add('*.spec.{js,jsx,ts,tsx}');
                } else if (sampleFile.includes('Test.')) {
                    foundPatterns.add('*Test.{js,jsx,ts,tsx}');
                } else if (sampleFile.includes('Spec.')) {
                    foundPatterns.add('*Spec.{js,jsx,ts,tsx}');
                } else if (sampleFile.includes('/test/')) {
                    foundPatterns.add('**/test/**/*.{js,jsx,ts,tsx}');
                } else if (sampleFile.includes('/tests/')) {
                    foundPatterns.add('**/tests/**/*.{js,jsx,ts,tsx}');
                } else if (sampleFile.includes('/__tests__/')) {
                    foundPatterns.add('**/__tests__/**/*.{js,jsx,ts,tsx}');
                }
            }
        }

        result.testFilePatterns = Array.from(foundPatterns);

    } catch (error) {
        console.error('Error analyzing test structure:', error);
    }

    return result;
}

async function analyzeTestFiles(projectPath: string, knownFrameworks: string[]): Promise<Partial<TestingAnalysis>> {
    const result: Partial<TestingAnalysis> = {
        snapshotTesting: false,
        visualTesting: false,
        performanceTesting: false,
        securityTesting: false,
    };

    try {
        // Get some test files to analyze
        const testFiles = await glob('**/*.{test,spec}.{js,jsx,ts,tsx}', {
            cwd: projectPath,
            ignore: ['node_modules/**', 'dist/**', 'build/**'],
            maxDepth: 4,
            nodir: true,
        });

        // Sample up to 10 test files
        const sampleFiles = testFiles.slice(0, 10);
        for (const file of sampleFiles) {
            try {
                const content = await fs.readFile(path.join(projectPath, file), 'utf8');
                
                // Check for snapshot testing
                if (content.includes('.toMatchSnapshot') || 
                    content.includes('.toMatchInlineSnapshot') ||
                    content.includes('snapshot') ||
                    content.includes('__snapshots__')) {
                    result.snapshotTesting = true;
                }
                
                // Check for visual testing
                if (content.includes('cy.screenshot') || 
                    content.includes('page.screenshot') ||
                    content.includes('visual') ||
                    content.includes('percy') ||
                    content.includes('applitools')) {
                    result.visualTesting = true;
                }
                
                // Check for performance testing
                if (content.includes('performance') || 
                    content.includes('benchmark') ||
                    content.includes('load') ||
                    content.includes('stress')) {
                    result.performanceTesting = true;
                }
                
                // Check for security testing
                if (content.includes('security') || 
                    content.includes('vulnerability') ||
                    content.includes('audit') ||
                    content.includes('xss') ||
                    content.includes('injection')) {
                    result.securityTesting = true;
                }
                
                // Check for framework-specific imports
                if (content.includes('@testing-library/') && !knownFrameworks.includes('Testing Library')) {
                    if (content.includes('@testing-library/react')) {
                        result.frameworks = [...(result.frameworks || []), 'React Testing Library'];
                    } else if (content.includes('@testing-library/vue')) {
                        result.frameworks = [...(result.frameworks || []), 'Vue Testing Library'];
                    }
                }
                
                // Check for assertion libraries in imports
                if (content.includes('from \'chai\'') || content.includes('from "chai"')) {
                    result.assertionLibraries = [...(result.assertionLibraries || []), 'Chai'];
                }
                if (content.includes('from \'sinon\'') || content.includes('from "sinon"')) {
                    result.mockingLibraries = [...(result.mockingLibraries || []), 'Sinon.js'];
                }
                
            } catch {
                // Can't read file
            }
        }

        // Check for snapshot files
        const snapshotFiles = await glob('**/*.snap', {
            cwd: projectPath,
            ignore: ['node_modules/**', 'dist/**', 'build/**'],
            maxDepth: 4,
        });
        if (snapshotFiles.length > 0) {
            result.snapshotTesting = true;
        }

        // Check for visual regression files
        const visualTestFiles = await glob('**/*.{png,jpg,jpeg,gif,webp}', {
            cwd: projectPath,
            ignore: ['node_modules/**', 'dist/**', 'build/**', 'src/**', 'assets/**'],
            maxDepth: 4,
        });
        // Filter for potential visual test files (often in specific directories)
        const visualTestDirs = ['__images__', 'visual', 'screenshots', 'baseline', 'comparison'];
        const hasVisualTests = visualTestFiles.some(file => 
            visualTestDirs.some(dir => file.includes(dir))
        );
        if (hasVisualTests) {
            result.visualTesting = true;
        }

    } catch (error) {
        console.error('Error analyzing test files:', error);
    }

    return result;
}

async function detectTestLanguages(projectPath: string): Promise<string[]> {
    const languages = new Set<string>();
    
    try {
        // Look for test files in various languages
        const patterns = [
            { pattern: '**/*.{test,spec}.{js,jsx}', language: 'JavaScript' },
            { pattern: '**/*.{test,spec}.{ts,tsx}', language: 'TypeScript' },
            { pattern: '**/*_{test,spec}.py', language: 'Python' },
            { pattern: '**/*Test.java', language: 'Java' },
            { pattern: '**/*_test.go', language: 'Go' },
            { pattern: '**/*.{test,spec}.rb', language: 'Ruby' },
            { pattern: '**/*.{test,spec}.php', language: 'PHP' },
            { pattern: '**/*.{test,spec}.cs', language: 'C#' },
        ];

        for (const { pattern, language } of patterns) {
            const files = await glob(pattern, {
                cwd: projectPath,
                ignore: ['node_modules/**', 'dist/**', 'build/**', 'vendor/**'],
                maxDepth: 4,
                nodir: true,
            });
            if (files.length > 0) {
                languages.add(language);
            }
        }

        // Check Cypress tests (usually in JavaScript/TypeScript)
        const cypressFiles = await glob('cypress/**/*.{js,ts}', {
            cwd: projectPath,
            nodir: true,
        });
        if (cypressFiles.length > 0) {
            languages.add('JavaScript/TypeScript');
        }

        // Check Playwright tests
        const playwrightFiles = await glob('**/*.spec.{js,ts}', {
            cwd: projectPath,
            ignore: ['node_modules/**'],
            nodir: true,
        });
        if (playwrightFiles.length > 0 && !languages.has('JavaScript') && !languages.has('TypeScript')) {
            languages.add('JavaScript/TypeScript');
        }

    } catch (error) {
        console.error('Error detecting test languages:', error);
    }

    return Array.from(languages);
}

async function detectTestingFeatures(projectPath: string, frameworks: string[]): Promise<Partial<TestingAnalysis>> {
    const result: Partial<TestingAnalysis> = {
        features: {
            hasParallelTesting: false,
            hasCIIntegration: false,
            hasReporters: false,
            hasWatchMode: false,
            hasDebugging: false,
            hasIsolation: false,
        },
    };

    try {
        // Check for parallel testing indicators
        if (frameworks.includes('Jest')) {
            // Jest has parallel testing by default
            result.features!.hasParallelTesting = true;
        }
        
        if (frameworks.includes('Vitest')) {
            // Vitest also supports parallel testing
            result.features!.hasParallelTesting = true;
        }

        // Check for CI integration
        const ciFiles = await glob('**/.github/workflows/*.yml', {
            cwd: projectPath,
            nodir: true,
            maxDepth: 3,
        });
        if (ciFiles.length > 0) {
            // Check if any CI file mentions testing
            for (const ciFile of ciFiles.slice(0, 3)) {
                try {
                    const content = await fs.readFile(path.join(projectPath, ciFile), 'utf8');
                    if (content.includes('test') || content.includes('Test') || 
                        content.includes('jest') || content.includes('mocha')) {
                        result.features!.hasCIIntegration = true;
                        break;
                    }
                } catch {
                    // Can't read file
                }
            }
        }

        // Check for test reporters
        const configFiles = await glob('**/*config*.{js,ts,json}', {
            cwd: projectPath,
            ignore: ['node_modules/**'],
            nodir: true,
            maxDepth: 2,
        });
        
        for (const configFile of configFiles.slice(0, 5)) {
            try {
                const content = await fs.readFile(path.join(projectPath, configFile), 'utf8');
                if (content.includes('reporter') || content.includes('reporters')) {
                    result.features!.hasReporters = true;
                }
                if (content.includes('watch') || content.includes('watchAll')) {
                    result.features!.hasWatchMode = true;
                }
                if (content.includes('inspect') || content.includes('debug')) {
                    result.features!.hasDebugging = true;
                }
                if (content.includes('isolate') || content.includes('sandbox')) {
                    result.features!.hasIsolation = true;
                }
            } catch {
                // Can't read file
            }
        }

        // Check for debugging configurations in package.json scripts
        try {
            const packageJson = await readPackageJson(projectPath);
            if (packageJson?.scripts) {
                const scripts = Object.values(packageJson.scripts).join(' ');
                if (scripts.includes('--inspect') || scripts.includes('--debug') || 
                    scripts.includes('inspect-brk')) {
                    result.features!.hasDebugging = true;
                }
                if (scripts.includes('--watch') || scripts.includes('watchAll')) {
                    result.features!.hasWatchMode = true;
                }
            }
        } catch {
            // Can't read package.json
        }

    } catch (error) {
        console.error('Error detecting testing features:', error);
    }

    return result;
}

// Utility function to check if project has tests
export async function hasTests(projectPath: string): Promise<boolean> {
    try {
        const patterns = [
            '**/*.{test,spec}.{js,jsx,ts,tsx}',
            '**/test/**/*.{js,jsx,ts,tsx}',
            '**/tests/**/*.{js,jsx,ts,tsx}',
            '**/__tests__/**/*.{js,jsx,ts,tsx}',
            'cypress/**/*.{js,ts}',
            '**/*Test.java',
            '**/*_test.go',
            '**/*_{test,spec}.py',
        ];

        for (const pattern of patterns) {
            const files = await glob(pattern, {
                cwd: projectPath,
                ignore: ['node_modules/**', 'dist/**', 'build/**'],
                maxDepth: 4,
                nodir: true,
            });
            if (files.length > 0) {
                return true;
            }
        }

        return false;
    } catch {
        return false;
    }
}

// Utility function to get test count
export async function getTestCount(projectPath: string): Promise<number> {
    try {
        const patterns = [
            '**/*.{test,spec}.{js,jsx,ts,tsx}',
            '**/test/**/*.{js,jsx,ts,tsx}',
            '**/tests/**/*.{js,jsx,ts,tsx}',
            '**/__tests__/**/*.{js,jsx,ts,tsx}',
        ];

        let total = 0;
        for (const pattern of patterns) {
            const files = await glob(pattern, {
                cwd: projectPath,
                ignore: ['node_modules/**', 'dist/**', 'build/**'],
                maxDepth: 4,
                nodir: true,
            });
            total += files.length;
        }

        return total;
    } catch {
        return 0;
    }
}

// Utility function to detect test runners from scripts
export async function detectTestRunner(projectPath: string): Promise<string | undefined> {
    try {
        const packageJson = await readPackageJson(projectPath);
        if (!packageJson?.scripts?.test) return undefined;

        const testScript = packageJson.scripts.test.toLowerCase();
        
        if (testScript.includes('jest')) return 'jest';
        if (testScript.includes('vitest')) return 'vitest';
        if (testScript.includes('mocha')) return 'mocha';
        if (testScript.includes('cypress')) return 'cypress';
        if (testScript.includes('playwright')) return 'playwright';
        if (testScript.includes('pytest')) return 'pytest';
        if (testScript.includes('npm test') || testScript.includes('npm run test')) {
            // Default npm test, need to check dependencies
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            if (deps['jest']) return 'jest';
            if (deps['vitest']) return 'vitest';
            if (deps['mocha']) return 'mocha';
        }
        
        return undefined;
    } catch {
        return undefined;
    }
}

async function readPackageJson(projectPath: string): Promise<any> {
    try {
        const packageJsonPath = path.join(projectPath, 'package.json');
        const content = await fs.readFile(packageJsonPath, 'utf8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}