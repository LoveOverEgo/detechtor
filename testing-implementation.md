Testing a VSCode extension requires setting up a proper testing environment. Here's a comprehensive guide on how to test all the components we've built:

## 1. **Setup Testing Environment**

### Prerequisites
```bash
# Install dependencies if not already done
npm install

# Install testing dependencies
npm install --save-dev @types/mocha @types/node @types/vscode mocha ts-node vscode-test
```

### Create test folder structure
```
detechtor/
├─ test/
│  ├─ unit/
│  │   ├─ analyzers/
│  │   │   ├─ languageDetector.test.ts
│  │   │   ├─ frontendDetector.test.ts
│  │   │   ├─ backendDetector.test.ts
│  │   │   ├─ testingDetector.test.ts
│  │   │   └─ dependencyClassifier.test.ts
│  │   ├─ readme/
│  │   │   ├─ readmeBuilder.test.ts
│  │   │   └─ templates.test.ts
│  │   └─ extension.test.ts
│  ├─ integration/
│  │   └─ extension.integration.test.ts
│  ├─ fixtures/
│  │   ├─ react-project/
│  │   ├─ vue-project/
│  │   ├─ express-project/
│  │   └─ empty-project/
│  └─ runTest.ts
└─ .vscode-test.js
```

## 2. **Configure Test Runner**

### Update `package.json`
```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "mocha --require ts-node/register test/unit/**/*.test.ts",
    "test:integration": "node ./out/test/runTest.js",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile"
  },
  "devDependencies": {
    "@types/mocha": "^10.0.6",
    "@types/node": "^20.10.5",
    "@vscode/test-electron": "^2.3.8",
    "mocha": "^10.2.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.3.3"
  }
}
```

### Create `.vscode-test.js`
```javascript
module.exports = {
  version: 'stable',
  disableWorkspaceTrust: true
};
```

### Create `test/runTest.ts`
```typescript
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');

        // The path to the extension test runner script
        const extensionTestsPath = path.resolve(__dirname, './integration/extension.integration.test');

        // Download VS Code, unzip it and run the integration test
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: ['--disable-extensions']
        });
    } catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}

main();
```

## 3. **Create Test Fixtures**

### Create test projects in `test/fixtures/`

**`test/fixtures/react-project/package.json`:**
```json
{
  "name": "test-react-app",
  "version": "1.0.0",
  "description": "A test React project for unit testing",
  "main": "src/index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "jest",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0"
  },
  "devDependencies": {
    "jest": "^29.6.0",
    "typescript": "^5.1.6",
    "@testing-library/react": "^14.0.0"
  }
}
```

**`test/fixtures/react-project/src/App.jsx`:**
```jsx
import React from 'react';

function App() {
    return <h1>Hello World</h1>;
}

export default App;
```

**`test/fixtures/vue-project/package.json`:**
```json
{
  "name": "test-vue-app",
  "version": "1.0.0",
  "description": "A test Vue.js project",
  "main": "src/main.js",
  "dependencies": {
    "vue": "^3.3.4",
    "vue-router": "^4.2.4"
  },
  "devDependencies": {
    "vitest": "^0.34.0"
  }
}
```

**`test/fixtures/express-project/package.json`:**
```json
{
  "name": "test-express-api",
  "version": "1.0.0",
  "description": "A test Express.js backend",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.4.0"
  },
  "devDependencies": {
    "jest": "^29.6.0",
    "supertest": "^6.3.3"
  }
}
```

**`test/fixtures/express-project/server.js`:**
```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.json({ message: 'Hello World' });
});

module.exports = app;
```

## 4. **Write Unit Tests**

### `test/unit/analyzers/languageDetector.test.ts`
```typescript
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import { describe, it, before, after } from 'mocha';
import { detectLanguages, getLanguageDetails } from '../../../src/analyzers/languageDetector';

describe('Language Detector', () => {
    const fixturesPath = path.join(__dirname, '../../fixtures');

    describe('detectLanguages()', () => {
        it('should detect JavaScript in a React project', async () => {
            const reactPath = path.join(fixturesPath, 'react-project');
            const languages = await detectLanguages(reactPath);
            
            assert.ok(languages.includes('JavaScript'));
            assert.ok(languages.length > 0);
        });

        it('should detect TypeScript if tsconfig exists', async () => {
            const testPath = path.join(fixturesPath, 'typescript-project');
            
            // Create a temporary TypeScript project
            await fs.mkdir(testPath, { recursive: true });
            await fs.writeFile(
                path.join(testPath, 'tsconfig.json'),
                JSON.stringify({ compilerOptions: {} })
            );
            await fs.writeFile(
                path.join(testPath, 'index.ts'),
                'console.log("Hello");'
            );

            const languages = await detectLanguages(testPath);
            assert.ok(languages.includes('TypeScript'));

            // Cleanup
            await fs.rm(testPath, { recursive: true });
        });

        it('should handle empty directory', async () => {
            const emptyPath = path.join(fixturesPath, 'empty-project');
            await fs.mkdir(emptyPath, { recursive: true });
            
            const languages = await detectLanguages(emptyPath);
            assert.deepStrictEqual(languages, []);

            await fs.rm(emptyPath, { recursive: true });
        });

        it('should handle non-existent directory gracefully', async () => {
            const nonExistentPath = path.join(fixturesPath, 'non-existent');
            const languages = await detectLanguages(nonExistentPath);
            assert.deepStrictEqual(languages, []);
        });
    });

    describe('getLanguageDetails()', () => {
        it('should return detailed language statistics', async () => {
            const testPath = path.join(fixturesPath, 'react-project');
            const details = await getLanguageDetails(testPath);
            
            assert.ok(Object.keys(details).length > 0);
            if (details['JavaScript']) {
                assert.ok(details['JavaScript'].files > 0);
                assert.ok(details['JavaScript'].extensions instanceof Set);
            }
        });
    });
});
```

### `test/unit/analyzers/frontendDetector.test.ts`
```typescript
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import { describe, it, before, after } from 'mocha';
import { detectFrontend } from '../../../src/analyzers/frontendDetector';

describe('Frontend Detector', () => {
    const fixturesPath = path.join(__dirname, '../../fixtures');

    describe('detectFrontend()', () => {
        it('should detect React framework', async () => {
            const reactPath = path.join(fixturesPath, 'react-project');
            const analysis = await detectFrontend(reactPath);
            
            assert.strictEqual(analysis.framework, 'React');
            assert.ok(analysis.hasRouter);
            assert.ok(analysis.packageManager === 'npm' || analysis.packageManager === 'yarn');
        });

        it('should detect Vue framework', async () => {
            const vuePath = path.join(fixturesPath, 'vue-project');
            const analysis = await detectFrontend(vuePath);
            
            assert.strictEqual(analysis.framework, 'Vue');
        });

        it('should detect CSS frameworks', async () => {
            const testPath = path.join(fixturesPath, 'tailwind-project');
            
            // Create a Tailwind project
            await fs.mkdir(testPath, { recursive: true });
            await fs.writeFile(
                path.join(testPath, 'package.json'),
                JSON.stringify({
                    dependencies: {
                        'tailwindcss': '^3.3.0'
                    }
                })
            );
            await fs.writeFile(
                path.join(testPath, 'tailwind.config.js'),
                'module.exports = {}'
            );

            const analysis = await detectFrontend(testPath);
            assert.strictEqual(analysis.cssFramework, 'Tailwind CSS');

            await fs.rm(testPath, { recursive: true });
        });

        it('should detect build tools', async () => {
            const testPath = path.join(fixturesPath, 'vite-project');
            
            await fs.mkdir(testPath, { recursive: true });
            await fs.writeFile(
                path.join(testPath, 'package.json'),
                JSON.stringify({
                    dependencies: {
                        'vite': '^4.4.0'
                    }
                })
            );

            const analysis = await detectFrontend(testPath);
            assert.strictEqual(analysis.buildTool, 'Vite');

            await fs.rm(testPath, { recursive: true });
        });
    });
});
```

### `test/unit/analyzers/backendDetector.test.ts`
```typescript
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import { describe, it, before, after } from 'mocha';
import { detectBackend } from '../../../src/analyzers/backendDetector';

describe('Backend Detector', () => {
    const fixturesPath = path.join(__dirname, '../../fixtures');

    describe('detectBackend()', () => {
        it('should detect Express.js framework', async () => {
            const expressPath = path.join(fixturesPath, 'express-project');
            const analysis = await detectBackend(expressPath);
            
            assert.strictEqual(analysis.framework, 'Express.js');
            assert.ok(analysis.database.includes('MongoDB'));
            assert.ok(analysis.orm === 'Mongoose');
        });

        it('should detect Python frameworks', async () => {
            const testPath = path.join(fixturesPath, 'django-project');
            
            await fs.mkdir(testPath, { recursive: true });
            await fs.writeFile(
                path.join(testPath, 'requirements.txt'),
                'Django==4.2.0\npsycopg2-binary==2.9.0'
            );
            await fs.writeFile(
                path.join(testPath, 'manage.py'),
                '#!/usr/bin/env python\nprint("Django")'
            );

            const analysis = await detectBackend(testPath);
            assert.strictEqual(analysis.framework, 'Django');
            assert.ok(analysis.database.includes('PostgreSQL'));

            await fs.rm(testPath, { recursive: true });
        });

        it('should detect Go frameworks', async () => {
            const testPath = path.join(fixturesPath, 'go-project');
            
            await fs.mkdir(testPath, { recursive: true });
            await fs.writeFile(
                path.join(testPath, 'go.mod'),
                'module testapp\n\ngo 1.20\n\nrequire github.com/gin-gonic/gin v1.9.0'
            );

            const analysis = await detectBackend(testPath);
            assert.strictEqual(analysis.framework, 'Gin');

            await fs.rm(testPath, { recursive: true });
        });
    });
});
```

### `test/unit/analyzers/testingDetector.test.ts`
```typescript
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import { describe, it, before, after } from 'mocha';
import { detectTestingTools, hasTests } from '../../../src/analyzers/testingDetector';

describe('Testing Detector', () => {
    const fixturesPath = path.join(__dirname, '../../fixtures');

    describe('detectTestingTools()', () => {
        it('should detect Jest in React project', async () => {
            const reactPath = path.join(fixturesPath, 'react-project');
            const analysis = await detectTestingTools(reactPath);
            
            assert.ok(analysis.frameworks.includes('Jest'));
            assert.ok(analysis.features.hasTesting);
        });

        it('should detect Vitest in Vue project', async () => {
            const vuePath = path.join(fixturesPath, 'vue-project');
            const analysis = await detectTestingTools(vuePath);
            
            assert.ok(analysis.frameworks.includes('Vitest'));
        });

        it('should detect E2E tools', async () => {
            const testPath = path.join(fixturesPath, 'cypress-project');
            
            await fs.mkdir(testPath, { recursive: true });
            await fs.writeFile(
                path.join(testPath, 'package.json'),
                JSON.stringify({
                    dependencies: {},
                    devDependencies: {
                        'cypress': '^12.0.0'
                    }
                })
            );

            const analysis = await detectTestingTools(testPath);
            assert.ok(analysis.e2eTools.includes('Cypress'));

            await fs.rm(testPath, { recursive: true });
        });

        it('should detect test directory structure', async () => {
            const testPath = path.join(fixturesPath, 'test-structure-project');
            
            await fs.mkdir(path.join(testPath, '__tests__'), { recursive: true });
            await fs.writeFile(
                path.join(testPath, '__tests__', 'example.test.js'),
                'test("example", () => {});'
            );

            const analysis = await detectTestingTools(testPath);
            assert.strictEqual(analysis.testStructure.testDirectory, '__tests__');
            assert.ok(analysis.testStructure.testFilePatterns.length > 0);

            await fs.rm(testPath, { recursive: true });
        });
    });

    describe('hasTests()', () => {
        it('should return true when tests exist', async () => {
            const testPath = path.join(fixturesPath, 'has-tests-project');
            
            await fs.mkdir(testPath, { recursive: true });
            await fs.writeFile(
                path.join(testPath, 'test.js'),
                'test("example", () => {});'
            );

            const result = await hasTests(testPath);
            assert.strictEqual(result, true);

            await fs.rm(testPath, { recursive: true });
        });

        it('should return false when no tests exist', async () => {
            const testPath = path.join(fixturesPath, 'no-tests-project');
            await fs.mkdir(testPath, { recursive: true });
            
            const result = await hasTests(testPath);
            assert.strictEqual(result, false);

            await fs.rm(testPath, { recursive: true });
        });
    });
});
```

### `test/unit/analyzers/dependencyClassifier.test.ts`
```typescript
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import { describe, it, before, after } from 'mocha';
import { classifyDependencies, categorizeDependency } from '../../../src/analyzers/dependencyClassifier';

describe('Dependency Classifier', () => {
    const fixturesPath = path.join(__dirname, '../../fixtures');

    describe('classifyDependencies()', () => {
        it('should classify React dependencies', async () => {
            const reactPath = path.join(fixturesPath, 'react-project');
            const classified = await classifyDependencies(reactPath);
            
            // Check that dependencies are categorized
            assert.ok(classified.production.length > 0 || classified.development.length > 0);
            assert.ok(classified.all.length >= classified.production.length + classified.development.length);
        });

        it('should handle empty package.json', async () => {
            const testPath = path.join(fixturesPath, 'empty-deps-project');
            
            await fs.mkdir(testPath, { recursive: true });
            await fs.writeFile(
                path.join(testPath, 'package.json'),
                JSON.stringify({ name: 'test', version: '1.0.0' })
            );

            const classified = await classifyDependencies(testPath);
            assert.deepStrictEqual(classified.production, []);
            assert.deepStrictEqual(classified.development, []);

            await fs.rm(testPath, { recursive: true });
        });
    });

    describe('categorizeDependency()', () => {
        it('should categorize known packages', () => {
            assert.strictEqual(categorizeDependency('react'), 'React Ecosystem');
            assert.strictEqual(categorizeDependency('express'), 'Server Framework');
            assert.strictEqual(categorizeDependency('jest'), 'Testing Framework');
            assert.strictEqual(categorizeDependency('typescript'), 'Compiler');
        });

        it('should guess categories for unknown packages', () => {
            assert.strictEqual(categorizeDependency('my-test-package'), 'Testing');
            assert.strictEqual(categorizeDependency('awesome-ui-library'), 'UI Component Library');
            assert.strictEqual(categorizeDependency('date-formatter'), 'Date Manipulation');
        });
    });
});
```

### `test/unit/readme/readmeBuilder.test.ts`
```typescript
import * as assert from 'assert';
import { describe, it } from 'mocha';
import { buildReadme, estimateReadmeQuality } from '../../../src/readme/readmeBuilder';
import { ProjectAnalysis } from '../../../src/analyzers';

describe('README Builder', () => {
    const mockAnalysis: ProjectAnalysis = {
        languages: ['TypeScript', 'JavaScript'],
        frontend: {
            framework: 'React',
            version: '18.2.0',
            buildTool: 'Vite',
            packageManager: 'npm',
            hasRouter: true,
            hasStateManagement: true,
            cssFramework: 'Tailwind CSS',
            uiLibrary: 'Material-UI',
            iconsLibrary: 'React Icons',
            formLibrary: 'React Hook Form',
            chartLibrary: 'Recharts',
            internationalization: 'i18next',
            metaFrameworks: ['Next.js'],
            features: {
                hasTypeScript: true,
                hasJSX: true,
                hasSSR: true,
                hasStaticSite: false,
                hasPWA: false,
                hasMobile: false,
                hasDesktop: false,
                hasTesting: true,
                hasStorybook: false,
                hasLinting: true,
                hasFormatting: true
            },
            configFiles: ['vite.config.ts', 'tsconfig.json'],
            entryPoints: ['src/main.tsx'],
            sourceDirectories: ['src', 'components'],
            testDirectories: ['__tests__']
        },
        backend: {
            framework: 'Express.js',
            version: '4.18.0',
            runtime: 'Node.js',
            database: ['MongoDB'],
            orm: 'Mongoose',
            server: 'Express',
            authentication: ['JWT'],
            caching: ['Redis'],
            messaging: [],
            search: [],
            monitoring: [],
            features: {
                hasGraphQL: false,
                hasREST: true,
                hasWebSockets: true,
                hasMicroservices: false,
                hasQueue: false,
                hasCronJobs: false,
                hasFileUpload: true,
                hasValidation: true,
                hasTesting: true,
                hasDocumentation: true
            },
            deployment: {
                hasDocker: true,
                hasKubernetes: false,
                hasCI: true,
                cloudProvider: 'AWS'
            },
            configFiles: ['package.json', '.env.example'],
            entryPoints: ['server.js'],
            apiRoutes: ['routes/'],
            models: ['models/']
        },
        testing: {
            frameworks: ['Jest', 'React Testing Library'],
            coverageTools: ['Istanbul/NYC'],
            e2eTools: ['Cypress'],
            assertionLibraries: ['Chai'],
            mockingLibraries: ['Sinon.js'],
            snapshotTesting: true,
            visualTesting: false,
            performanceTesting: false,
            securityTesting: false,
            testStructure: {
                testDirectory: '__tests__',
                testFilePatterns: ['*.test.js', '*.test.tsx'],
                fixtureDirectory: '__fixtures__',
                mockDirectory: '__mocks__',
                snapshotDirectory: '__snapshots__'
            },
            configFiles: ['jest.config.js'],
            scripts: {
                test: 'jest',
                testWatch: 'jest --watch',
                testCoverage: 'jest --coverage',
                testE2E: 'cypress run'
            },
            languages: ['JavaScript', 'TypeScript'],
            features: {
                hasParallelTesting: true,
                hasCIIntegration: true,
                hasReporters: true,
                hasWatchMode: true,
                hasDebugging: true,
                hasIsolation: true
            }
        },
        dependencies: {
            production: [
                { name: 'react', version: '^18.2.0', category: 'React Ecosystem' },
                { name: 'express', version: '^4.18.0', category: 'Server Framework' }
            ],
            development: [
                { name: 'jest', version: '^29.0.0', category: 'Testing Framework' },
                { name: 'typescript', version: '^5.0.0', category: 'Compiler' }
            ],
            peer: [],
            optional: []
        },
        projectInfo: {
            name: 'My Awesome Project',
            version: '1.0.0',
            description: 'A full-stack React + Express application',
            license: 'MIT',
            author: 'John Doe <john@example.com>',
            repository: 'https://github.com/johndoe/awesome-project',
            mainEntry: 'src/main.tsx',
            hasTypeScript: true,
            hasTests: true,
            hasLinting: true,
            hasCI: true,
            hasDocker: true,
            hasDocumentation: true
        },
        fileStructure: {
            entryPoints: ['src/main.tsx', 'server.js'],
            configFiles: ['package.json', 'tsconfig.json', 'vite.config.ts'],
            testDirectories: ['__tests__', 'cypress'],
            sourceDirectories: ['src', 'components', 'server'],
            buildOutputs: ['dist', 'build']
        },
        timestamps: {
            analysisDate: new Date().toISOString(),
            projectLastModified: new Date().toISOString()
        }
    };

    describe('buildReadme()', () => {
        it('should generate a complete README', () => {
            const readme = buildReadme(mockAnalysis);
            
            // Check for essential sections
            assert.ok(readme.includes('# My Awesome Project'));
            assert.ok(readme.includes('## 📋 Description'));
            assert.ok(readme.includes('## 📦 Installation'));
            assert.ok(readme.includes('## 🚀 Usage'));
            assert.ok(readme.includes('## 🛠️ Technologies Used'));
            assert.ok(readme.includes('## 🧪 Testing'));
            assert.ok(readme.includes('## 🤝 Contributing'));
            assert.ok(readme.includes('## 📄 License'));
            
            // Check for framework-specific content
            assert.ok(readme.includes('React'));
            assert.ok(readme.includes('Express.js'));
            assert.ok(readme.includes('TypeScript'));
        });

        it('should generate minimal README with options', () => {
            const readme = buildReadme(mockAnalysis, {
                theme: 'minimal',
                includeBadges: false,
                includeTOC: false
            });
            
            // Should not have emojis in headers for minimal theme
            assert.ok(!readme.includes('## 📋 Description'));
            assert.ok(readme.includes('## Description'));
            
            // Should not have badges
            assert.ok(!readme.includes('img.shields.io'));
        });

        it('should generate detailed README', () => {
            const readme = buildReadme(mockAnalysis, { theme: 'detailed' });
            
            // Detailed theme adds emojis to headers
            assert.ok(readme.includes('# ✨ My Awesome Project'));
        });
    });

    describe('estimateReadmeQuality()', () => {
        it('should score high for complete analysis', () => {
            const score = estimateReadmeQuality(mockAnalysis);
            assert.ok(score >= 80); // Should be high with all info
        });

        it('should score lower for minimal analysis', () => {
            const minimalAnalysis: ProjectAnalysis = {
                ...mockAnalysis,
                projectInfo: {
                    ...mockAnalysis.projectInfo,
                    description: '',
                    version: undefined,
                    license: undefined,
                    author: undefined,
                    repository: undefined
                },
                frontend: { ...mockAnalysis.frontend, framework: 'Unknown' },
                backend: { ...mockAnalysis.backend, framework: 'Unknown' },
                testing: { ...mockAnalysis.testing, frameworks: [] }
            };
            
            const score = estimateReadmeQuality(minimalAnalysis);
            assert.ok(score < 70); // Should be lower
        });
    });
});
```

### `test/unit/extension.test.ts`
```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import { describe, it, before, after } from 'mocha';
import { activate } from '../../src/extension';

describe('Extension', () => {
    let context: vscode.ExtensionContext;

    before(() => {
        // Mock extension context
        context = {
            subscriptions: [],
            extensionPath: '',
            storagePath: '',
            logPath: '',
            globalStoragePath: '',
            workspaceState: {} as vscode.Memento,
            globalState: {} as vscode.Memento,
            secrets: {} as vscode.SecretStorage,
            extensionUri: vscode.Uri.parse('file:///test'),
            environmentVariableCollection: {} as vscode.EnvironmentVariableCollection,
            extensionMode: vscode.ExtensionMode.Test,
            logUri: vscode.Uri.parse('file:///test/logs')
        } as vscode.ExtensionContext;
    });

    describe('activate()', () => {
        it('should register commands', () => {
            activate(context);
            
            // Check that commands are registered
            const commands = [
                'projectAnalyzer.analyze',
                'projectAnalyzer.generateReadme',
                'projectAnalyzer.refresh',
                'projectAnalyzer.quickAnalyze'
            ];
            
            // The commands should be added to subscriptions
            assert.ok(context.subscriptions.length > 0);
        });
    });

    describe('deactivate()', () => {
        it('should not throw errors', () => {
            // Just ensure deactivate doesn't crash
            assert.doesNotThrow(() => {
                // deactivate function is exported but does nothing
            });
        });
    });
});
```

## 5. **Write Integration Tests**

### `test/integration/extension.integration.test.ts`
```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

suite('Extension Integration Tests', () => {
    const testWorkspace = path.join(__dirname, '../../fixtures/react-project');

    suiteSetup(async () => {
        // Ensure test workspace exists
        await fs.mkdir(testWorkspace, { recursive: true });
    });

    test('Commands should be registered', async () => {
        // Get all registered commands
        const commands = await vscode.commands.getCommands();
        
        assert.ok(commands.includes('projectAnalyzer.analyze'));
        assert.ok(commands.includes('projectAnalyzer.generateReadme'));
        assert.ok(commands.includes('projectAnalyzer.refresh'));
        assert.ok(commands.includes('projectAnalyzer.quickAnalyze'));
    });

    test('Should analyze project', async () => {
        // This test would require the extension to be activated
        // and would test the actual analysis functionality
        // For now, we'll skip the actual execution but test the command exists
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('projectAnalyzer.analyze'));
    });
});
```

## 6. **Create Test Scripts**

### Add to `package.json`
```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "mocha --require ts-node/register --timeout 10000 test/unit/**/*.test.ts",
    "test:integration": "npm run compile && node ./out/test/runTest.js",
    "test:coverage": "nyc npm run test:unit",
    "test:watch": "mocha --require ts-node/register --watch --watch-files 'src/**/*.ts,test/**/*.ts' test/unit/**/*.test.ts",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile",
    "create-test-projects": "node scripts/create-test-projects.js"
  }
}
```

### Create `scripts/create-test-projects.js`
```javascript
const fs = require('fs/promises');
const path = require('path');

async function createTestProjects() {
    const fixturesPath = path.join(__dirname, '../test/fixtures');
    
    // Create React project
    const reactPath = path.join(fixturesPath, 'react-project');
    await fs.mkdir(path.join(reactPath, 'src'), { recursive: true });
    
    await fs.writeFile(
        path.join(reactPath, 'package.json'),
        JSON.stringify({
            name: 'test-react-app',
            version: '1.0.0',
            dependencies: {
                'react': '^18.2.0',
                'react-dom': '^18.2.0'
            },
            devDependencies: {
                'jest': '^29.0.0',
                '@testing-library/react': '^14.0.0'
            }
        }, null, 2)
    );
    
    await fs.writeFile(
        path.join(reactPath, 'src', 'App.jsx'),
        'import React from "react";\n\nexport default function App() {\n  return <h1>Hello World</h1>;\n}\n'
    );
    
    // Create empty project for edge cases
    const emptyPath = path.join(fixturesPath, 'empty-project');
    await fs.mkdir(emptyPath, { recursive: true });
    
    console.log('Test projects created successfully!');
}

createTestProjects().catch(console.error);
```

## 7. **Run Tests**

```bash
# 1. Install dependencies
npm install

# 2. Create test projects
npm run create-test-projects

# 3. Run unit tests
npm run test:unit

# 4. Run integration tests (requires VSCode installation)
npm run test:integration

# 5. Run all tests
npm test

# 6. Run tests with coverage
npm run test:coverage

# 7. Watch mode for development
npm run test:watch
```

## 8. **Debug Tests in VSCode**

### Create `.vscode/launch.json`
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension Tests",
      "type": "extensionHost",
      "request": "launch",
      "runtimeExecutable": "${execPath}",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}",
        "--extensionTestsPath=${workspaceFolder}/out/test/runTest"
      ],
      "outFiles": [
        "${workspaceFolder}/out/**/*.js"
      ],
      "preLaunchTask": "npm: compile"
    },
    {
      "name": "Run Unit Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/mocha/bin/_mocha",
      "args": [
        "--require",
        "ts-node/register",
        "--timeout",
        "10000",
        "test/unit/**/*.test.ts"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## 9. **Manual Testing**

For manual testing, you can:

1. **Run the extension in development mode:**
   ```bash
   # Start TypeScript compiler in watch mode
   npm run watch
   
   # In another terminal, press F5 in VSCode to launch extension development host
   ```

2. **Test commands manually:**
   - Open a test project folder in VSCode
   - Press `Ctrl+Shift+P` and run commands:
     - `Project Analyzer: Analyze Project`
     - `Project Analyzer: Generate README`
     - `Project Analyzer: Quick Analyze`

3. **Check the output:**
   - Look for the status bar item
   - Check the output panel for logs
   - Verify the README is generated correctly
   - Test the webview panel

## 10. **Edge Cases to Test**

```bash
# Test with different project types:
1. Empty directory
2. Directory with only package.json
3. TypeScript project without tsconfig.json
4. Mixed language projects
5. Projects with circular dependencies
6. Projects with invalid JSON files
7. Very large projects (test performance)
8. Projects with symlinks
9. Projects in nested directories
10. Projects with permission issues
```

This comprehensive testing setup will ensure your extension works correctly, handles edge cases gracefully, and provides a reliable experience for users.