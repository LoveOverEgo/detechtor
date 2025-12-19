import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { Framework, FrontendAnalysis } from '../../../types/index';

export async function detectFrontend(projectPath: string): Promise<FrontendAnalysis> {
    const analysis: FrontendAnalysis = {
        framework: { name: 'Unknown' },
        hasRouter: false,
        hasStateManagement: false,
        frameworks: [],
        metaFrameworks: [],
        features: {
            hasTypeScript: false,
            hasJSX: false,
            hasSSR: false,
            hasStaticSite: false,
            hasPWA: false,
            hasMobile: false,
            hasDesktop: false,
            hasTesting: false,
            hasStorybook: false,
            hasLinting: false,
            hasFormatting: false,
        },
        configFiles: [],
        entryPoints: [],
        sourceDirectories: [],
        testDirectories: [],
    };

    try {
        const packageJson = await readPackageJson(projectPath);
        if (packageJson) {
            // Phase 2: Detect framework from dependencies
            const frameworkDetection = detectFrameworkFromDependencies(packageJson);
            Object.assign(analysis, frameworkDetection);

            // Phase 3: Detect meta frameworks (Next.js, Nuxt, etc.)
            const metaFrameworks = detectMetaFrameworks(packageJson);
            analysis.metaFrameworks = metaFrameworks;

            // Phase 4: Detect additional features
            const features = detectFeaturesFromDependencies(packageJson);
            Object.assign(analysis.features, features);
        }

        // Phase 5: Analyze project structure
        const structureAnalysis = await analyzeProjectStructure(projectPath);
        Object.assign(analysis, structureAnalysis);

        // Phase 6: Check configuration files
        const configAnalysis = await analyzeConfigFiles(projectPath, analysis.framework);
        Object.assign(analysis, configAnalysis);

        // Phase 7: Detect CSS framework and preprocessor
        const cssAnalysis = await detectCssFramework(projectPath, packageJson);
        analysis.cssFramework = cssAnalysis.cssFramework;
        analysis.cssPreprocessor = cssAnalysis.cssPreprocessor;
        analysis.uiLibrary = cssAnalysis.uiLibrary;

        // Phase 8: Detect additional libraries
        const libraryAnalysis = await detectAdditionalLibraries(projectPath, packageJson);
        Object.assign(analysis, libraryAnalysis);

        // Phase 9: Verify framework by file patterns
        const verification = await verifyFrameworkByFiles(projectPath, analysis.framework);
        if (verification.framework?.name && verification.framework.name !== 'Unknown') {
            analysis.framework = pickPrimaryFramework(
                [verification.framework, ...(analysis.frameworks ?? [])]
            ) ?? verification.framework;
            analysis.frameworks = mergeFrameworks(analysis.frameworks ?? [], [verification.framework]);
        }

        analysis.features.hasJSX = verification.features!.hasJSX || analysis.features.hasJSX;
        analysis.features.hasTypeScript = verification.features!.hasTypeScript || analysis.features.hasTypeScript;

        // Phase 10: Detect build tools
        const buildToolAnalysis = await detectBuildTools(projectPath, packageJson);
        analysis.buildTool = buildToolAnalysis.buildTool;
        analysis.buildToolVersion = buildToolAnalysis.version;

        if (analysis.framework?.name && analysis.framework.name !== 'Unknown' && (!analysis.frameworks || analysis.frameworks.length === 0)) {
            analysis.frameworks = [analysis.framework];
        }

        return analysis;
    } catch (error) {
        console.error('Error detecting frontend framework:', error);
        return analysis;
    }
}

export async function readPackageJson(projectPath: string): Promise<any> {
    try {
        const packageJsonPath = path.join(projectPath, 'package.json');
        const content = await fs.readFile(packageJsonPath, 'utf8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

function detectFrameworkFromDependencies(packageJson: any): Partial<FrontendAnalysis> {
    const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
    };

    const result: Partial<FrontendAnalysis> = {
        framework: { name: 'Unknown' },
        hasRouter: false,
        hasStateManagement: false,
        frameworks: [],
    };

    const frameworks = detectFrameworksFromDependencies(deps);
    result.frameworks = frameworks;
    const primary = pickPrimaryFramework(frameworks);
    if (primary) {
        result.framework = primary;
    }

    result.hasRouter = Boolean(
        deps['react-router'] ||
        deps['react-router-dom'] ||
        deps['vue-router'] ||
        deps['svelte-routing'] ||
        deps['@sveltejs/kit'] ||
        deps['preact-router'] ||
        deps['@solidjs/router'] ||
        deps['@angular/router']
    );

    result.hasStateManagement = Boolean(
        deps['redux'] ||
        deps['mobx'] ||
        deps['zustand'] ||
        deps['recoil'] ||
        deps['vuex'] ||
        deps['pinia'] ||
        deps['@ngrx/store'] ||
        deps['ngxs']
    );

    return result;
}

function detectFrameworksFromDependencies(deps: Record<string, string>): Framework[] {
    const frameworks: Framework[] = [];

    if (deps['react'] || deps['react-dom']) {
        frameworks.push({ name: 'React', version: deps['react'] || deps['react-dom'] });
    }
    if (deps['vue'] || deps['@vue/runtime-dom']) {
        frameworks.push({ name: 'Vue', version: deps['vue'] || deps['@vue/runtime-dom'] });
    }
    if (deps['@angular/core']) {
        frameworks.push({ name: 'Angular', version: deps['@angular/core'] });
    }
    if (deps['svelte'] || deps['svelte/store']) {
        frameworks.push({ name: 'Svelte', version: deps['svelte'] });
    }
    if (deps['preact']) {
        frameworks.push({ name: 'Preact', version: deps['preact'] });
    }
    if (deps['solid-js']) {
        frameworks.push({ name: 'SolidJS', version: deps['solid-js'] });
    }
    if (deps['lit'] || deps['lit-element']) {
        frameworks.push({ name: 'Lit', version: deps['lit'] || deps['lit-element'] });
    }
    if (deps['alpinejs']) {
        frameworks.push({ name: 'Alpine.js', version: deps['alpinejs'] });
    }
    if (deps['jquery']) {
        frameworks.push({ name: 'jQuery', version: deps['jquery'] });
    }

    return frameworks;
}

function pickPrimaryFramework(frameworks: Framework[]): Framework | undefined {
    if (!frameworks.length) {
        return undefined;
    }

    const priority = [
        'React',
        'Vue',
        'Angular',
        'Svelte',
        'Preact',
        'SolidJS',
        'Lit',
        'Alpine.js',
        'jQuery',
    ];

    for (const name of priority) {
        const match = frameworks.find(framework => framework.name === name);
        if (match) {
            return match;
        }
    }

    return frameworks[0];
}

function mergeFrameworks(existing: Framework[], incoming: Framework[]): Framework[] {
    const merged = [...existing];
    for (const framework of incoming) {
        if (!framework?.name) {
            continue;
        }
        if (!merged.some(item => item.name === framework.name)) {
            merged.push(framework);
        }
    }
    return merged;
}

function detectMetaFrameworks(packageJson: any): string[] {
    const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
    };

    const metaFrameworks: string[] = [];

    // React meta frameworks
    if (deps['next']) {
        metaFrameworks.push('Next.js');
    }
    if (deps['gatsby']) {
        metaFrameworks.push('Gatsby');
    }
    if (deps['remix']) {
        metaFrameworks.push('Remix');
    }
    if (deps['vite'] && deps['react']) {
        metaFrameworks.push('Vite + React');
    }

    // Vue meta frameworks
    if (deps['nuxt'] || deps['nuxt3']) {
        metaFrameworks.push('Nuxt.js');
    }
    if (deps['vite'] && deps['vue']) {
        metaFrameworks.push('Vite + Vue');
    }
    if (deps['quasar']) {
        metaFrameworks.push('Quasar');
    }

    // Svelte meta frameworks
    if (deps['@sveltejs/kit']) {
        metaFrameworks.push('SvelteKit');
    }
    if (deps['vite'] && deps['svelte']) {
        metaFrameworks.push('Vite + Svelte');
    }

    // Angular is typically standalone, but check for Universal
    if (deps['@angular/platform-server']) {
        metaFrameworks.push('Angular Universal');
    }

    // Static site generators
    if (deps['astro']) {
        metaFrameworks.push('Astro');
    }
    if (deps['eleventy']) {
        metaFrameworks.push('Eleventy');
    }
    if (deps['vuepress']) {
        metaFrameworks.push('VuePress');
    }

    return metaFrameworks;
}

function detectFeaturesFromDependencies(packageJson: any): Partial<FrontendAnalysis['features']> {
    const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
    };

    const features: Partial<FrontendAnalysis['features']> = {
        hasTypeScript: Boolean(deps['typescript'] || deps['ts-node']),
        hasJSX: Boolean(deps['react'] || deps['preact'] || deps['solid-js']),
        hasSSR: Boolean(
            deps['next'] || 
            deps['nuxt'] || 
            deps['@sveltejs/kit'] ||
            deps['@angular/platform-server']
        ),
        hasStaticSite: Boolean(
            deps['gatsby'] || 
            deps['astro'] || 
            deps['eleventy'] ||
            deps['vuepress']
        ),
        hasPWA: Boolean(
            deps['workbox-webpack-plugin'] || 
            deps['@angular/pwa'] ||
            deps['@vue/cli-plugin-pwa']
        ),
        hasMobile: Boolean(
            deps['react-native'] ||
            deps['@ionic/react'] ||
            deps['@capacitor/core']
        ),
        hasDesktop: Boolean(
            deps['electron'] ||
            deps['tauri'] ||
            deps['@neutralinojs/neu']
        ),
        hasTesting: Boolean(
            deps['jest'] ||
            deps['vitest'] ||
            deps['mocha'] ||
            deps['cypress'] ||
            deps['playwright'] ||
            deps['@testing-library/react'] ||
            deps['@testing-library/vue'] ||
            deps['@testing-library/angular'] ||
            deps['@testing-library/svelte']
        ),
        hasStorybook: Boolean(
            deps['storybook'] ||
            deps['@storybook/react'] ||
            deps['@storybook/vue'] ||
            deps['@storybook/angular'] ||
            deps['@storybook/svelte']
        ),
        hasLinting: Boolean(
            deps['eslint'] ||
            deps['@typescript-eslint/eslint-plugin'] ||
            deps['stylelint']
        ),
        hasFormatting: Boolean(deps['prettier']),
    };

    return features;
}

async function analyzeProjectStructure(projectPath: string): Promise<Partial<FrontendAnalysis>> {
    const result: Partial<FrontendAnalysis> = {
        entryPoints: [],
        sourceDirectories: [],
        testDirectories: [],
    };

    try {
        const entries = await fs.readdir(projectPath, { withFileTypes: true });

        // Common frontend source directories
        const sourceDirs = ['src', 'app', 'components', 'pages', 'views', 'lib', 'utils'];
        const testDirs = ['tests', 'test', '__tests__', 'cypress', 'e2e', 'spec'];
        const entryFiles = ['index', 'main', 'app'];

        for (const entry of entries) {
            const name = entry.name;
            
            if (entry.isDirectory()) {
                if (sourceDirs.some(dir => dir.toLowerCase() === name.toLowerCase())) {
                    result.sourceDirectories!.push(name);
                }
                if (testDirs.some(dir => dir.toLowerCase() === name.toLowerCase())) {
                    result.testDirectories!.push(name);
                }
            } else {
                const ext = path.extname(name).toLowerCase();
                const baseName = path.basename(name, ext);
                
                if (entryFiles.includes(baseName.toLowerCase()) && 
                    ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'].includes(ext)) {
                    result.entryPoints!.push(name);
                }
            }
        }

        // If no entry points found, look deeper
        if (result.entryPoints!.length === 0) {
            const potentialEntries = await glob('**/index.{js,jsx,ts,tsx,vue,svelte}', {
                cwd: projectPath,
                ignore: ['node_modules/**', 'dist/**', 'build/**'],
                maxDepth: 3,
            });
            result.entryPoints = potentialEntries.slice(0, 5); // Limit to 5
        }

        // Check for React/Vue/Svelte component patterns
        const componentPatterns = {
            react: await glob('**/*.{jsx,tsx}', { cwd: projectPath, maxDepth: 3 }),
            vue: await glob('**/*.vue', { cwd: projectPath, maxDepth: 3 }),
            svelte: await glob('**/*.svelte', { cwd: projectPath, maxDepth: 3 }),
            angular: await glob('**/*.component.{ts,js}', { cwd: projectPath, maxDepth: 3 }),
        };

        // Update framework based on component patterns
        if (componentPatterns.react.length > 0 && result.framework?.name === 'Unknown') {
            result.framework = { name: 'React' };
        } else if (componentPatterns.vue.length > 0 && result.framework?.name === 'Unknown') {
            result.framework = { name: 'Vue' };
        } else if (componentPatterns.svelte.length > 0 && result.framework?.name === 'Unknown') {
            result.framework = { name: 'Svelte' };
        } else if (componentPatterns.angular.length > 0 && result.framework?.name === 'Unknown') {
            result.framework = { name: 'Angular' };
        }

    } catch (error) {
        console.error('Error analyzing project structure:', error);
    }

    return result;
}

async function analyzeConfigFiles(projectPath: string, framework: FrontendAnalysis['framework']): Promise<Partial<FrontendAnalysis>> {
    const result: Partial<FrontendAnalysis> = {
        configFiles: [],
    };

    const configPatterns = [
        // Framework specific
        'next.config.*',
        'nuxt.config.*',
        'svelte.config.*',
        'angular.json',
        'vue.config.*',
        
        // Build tools
        'vite.config.*',
        'webpack.config.*',
        'rollup.config.*',
        'parcel.config.*',
        
        // TypeScript
        'tsconfig.json',
        'tsconfig.*.json',
        
        // Testing
        'jest.config.*',
        'vitest.config.*',
        'cypress.config.*',
        'playwright.config.*',
        
        // Linting & Formatting
        '.eslintrc*',
        '.prettierrc*',
        'stylelint.config.*',
        
        // Other
        '.babelrc*',
        'postcss.config.*',
        'tailwind.config.*',
    ];

    try {
        for (const pattern of configPatterns) {
            const files = await glob(pattern, {
                cwd: projectPath,
                ignore: ['node_modules/**', 'dist/**', 'build/**'],
                nodir: true,
            });
            result.configFiles!.push(...files);
        }

        // Detect SSR from config files
        if (!result.features) result.features = {hasSSR: false, hasStaticSite: false} as any;
        
        result.features!.hasSSR = result.features!.hasSSR || 
            result.configFiles!.some(file => 
                file.includes('next.config') || 
                file.includes('nuxt.config') ||
                file.includes('svelte.config')
            );

        // Detect static site generation
        result.features!.hasStaticSite = result.features!.hasStaticSite ||
            result.configFiles!.some(file => 
                file.includes('gatsby-config') ||
                file.includes('astro.config')
            );

    } catch (error) {
        console.error('Error analyzing config files:', error);
    }

    return result;
}

async function detectCssFramework(projectPath: string, packageJson: any): Promise<Partial<FrontendAnalysis>> {
    const deps = {
        ...packageJson?.dependencies || {},
        ...packageJson?.devDependencies || {},
    };

    const result: Partial<FrontendAnalysis> = {};

    // CSS Frameworks
    if (deps['tailwindcss']) {
        result.cssFramework = 'Tailwind CSS';
    } else if (deps['bootstrap']) {
        result.cssFramework = 'Bootstrap';
    } else if (deps['foundation-sites']) {
        result.cssFramework = 'Foundation';
    } else if (deps['bulma']) {
        result.cssFramework = 'Bulma';
    } else if (deps['material-ui'] || deps['@mui/material']) {
        result.cssFramework = 'Material-UI';
    } else if (deps['antd']) {
        result.cssFramework = 'Ant Design';
    } else if (deps['chakra-ui']) {
        result.cssFramework = 'Chakra UI';
    }

    // CSS Preprocessors
    if (deps['sass'] || deps['node-sass']) {
        result.cssPreprocessor = 'Sass';
    } else if (deps['less']) {
        result.cssPreprocessor = 'Less';
    } else if (deps['stylus']) {
        result.cssPreprocessor = 'Stylus';
    }

    // CSS-in-JS
    if (deps['styled-components']) {
        result.uiLibrary = 'Styled Components';
    } else if (deps['emotion']) {
        result.uiLibrary = 'Emotion';
    } else if (deps['@emotion/react']) {
        result.uiLibrary = 'Emotion (React)';
    }

    // Check for CSS framework config files
    try {
        const cssConfigs = await glob('**/*tailwind*.{js,ts,json}', { cwd: projectPath, maxDepth: 2 });
        if (cssConfigs.length > 0 && !result.cssFramework) {
            result.cssFramework = 'Tailwind CSS';
        }
    } catch {
        // Ignore errors
    }

    return result;
}

async function detectAdditionalLibraries(projectPath: string, packageJson: any): Promise<Partial<FrontendAnalysis>> {
    const deps = {
        ...packageJson?.dependencies || {},
        ...packageJson?.devDependencies || {},
    };

    const result: Partial<FrontendAnalysis> = {};

    // Icon libraries
    if (deps['@fortawesome/fontawesome-free'] || deps['@fortawesome/react-fontawesome']) {
        result.iconsLibrary = 'Font Awesome';
    } else if (deps['react-icons']) {
        result.iconsLibrary = 'React Icons';
    } else if (deps['@tabler/icons']) {
        result.iconsLibrary = 'Tabler Icons';
    } else if (deps['lucide-react'] || deps['lucide-vue']) {
        result.iconsLibrary = 'Lucide Icons';
    }

    // Form libraries
    if (deps['formik'] || deps['react-hook-form']) {
        result.formLibrary = 'Formik or React Hook Form';
    } else if (deps['vee-validate']) {
        result.formLibrary = 'VeeValidate';
    } else if (deps['@angular/forms']) {
        result.formLibrary = 'Angular Forms';
    }

    // Chart libraries
    if (deps['chart.js'] || deps['react-chartjs-2']) {
        result.chartLibrary = 'Chart.js';
    } else if (deps['recharts']) {
        result.chartLibrary = 'Recharts';
    } else if (deps['victory']) {
        result.chartLibrary = 'Victory';
    } else if (deps['apexcharts']) {
        result.chartLibrary = 'ApexCharts';
    }

    // Internationalization
    if (deps['react-i18next']) {
        result.internationalization = 'i18next';
    } else if (deps['vue-i18n']) {
        result.internationalization = 'Vue I18n';
    } else if (deps['@angular/localize']) {
        result.internationalization = 'Angular i18n';
    } else if (deps['svelte-i18n']) {
        result.internationalization = 'Svelte i18n';
    }

    return result;
}

async function verifyFrameworkByFiles(projectPath: string, currentFramework: FrontendAnalysis['framework']): Promise<Partial<FrontendAnalysis>> {
    const result: Partial<FrontendAnalysis> = {};

    try {
        // Check for framework-specific file patterns
        const checks = [
            {
                framework: 'React',
                patterns: ['**/*.{jsx,tsx}', '**/.react/**'],
                minFiles: 1,
            },
            {
                framework: 'Vue',
                patterns: ['**/*.vue', '**/.vue/**'],
                minFiles: 1,
            },
            {
                framework: 'Svelte',
                patterns: ['**/*.svelte', '**/.svelte/**'],
                minFiles: 1,
            },
            {
                framework: 'Angular',
                patterns: ['**/*.component.{ts,js}', '**/angular.json'],
                minFiles: 1,
            },
        ];

        for (const check of checks) {
            let fileCount = 0;
            for (const pattern of check.patterns) {
                const files = await glob(pattern, {
                    cwd: projectPath,
                    ignore: ['node_modules/**', 'dist/**', 'build/**'],
                    maxDepth: 4,
                });
                fileCount += files.length;
            }

            if (fileCount >= check.minFiles) {
                result.framework = { name: check.framework };
                break;
            }
        }

        // initialize features if not present
        result.features = result.features ?? {hasJSX: false, hasTypeScript: false} as any;

        // Check for JSX/TSX files
        const jsxFiles = await glob('**/*.{jsx,tsx}', {
            cwd: projectPath,
            ignore: ['node_modules/**'],
            maxDepth: 3,
        });

        
        // Check for TypeScript
        const tsFiles = await glob('**/*.{ts,tsx}', {
            cwd: projectPath,
            ignore: ['node_modules/**'],
            maxDepth: 3,
        });

        result.features!.hasJSX = jsxFiles.length > 0;
        result.features!.hasTypeScript = tsFiles.length > 0;

    } catch (error) {
        console.error('Error verifying framework by files:', error);
    }

    return result;
}

async function detectBuildTools(projectPath: string, packageJson: any): Promise<{ buildTool?: string; version?: string }> {
    const deps = {
        ...packageJson?.dependencies || {},
        ...packageJson?.devDependencies || {},
    };

    const result: { buildTool?: string; version?: string } = {};

    // Check build tools in dependencies
    if (deps['vite']) {
        result.buildTool = 'Vite';
        result.version = deps['vite'];
    } else if (deps['webpack']) {
        result.buildTool = 'Webpack';
        result.version = deps['webpack'];
    } else if (deps['rollup']) {
        result.buildTool = 'Rollup';
        result.version = deps['rollup'];
    } else if (deps['parcel']) {
        result.buildTool = 'Parcel';
        result.version = deps['parcel'];
    } else if (deps['esbuild']) {
        result.buildTool = 'esbuild';
        result.version = deps['esbuild'];
    } else if (deps['snowpack']) {
        result.buildTool = 'Snowpack';
        result.version = deps['snowpack'];
    }

    // Check for build tool config files
    try {
        const buildConfigs = await glob('**/*vite*.{js,ts,json}', { cwd: projectPath, maxDepth: 2 });
        if (buildConfigs.length > 0 && !result.buildTool) {
            result.buildTool = 'Vite';
        }
    } catch {
        // Ignore errors
    }

    return result;
}

// Utility functions for external use
export async function detectReactVersion(projectPath: string): Promise<string | undefined> {
    try {
        const packageJson = await readPackageJson(projectPath);
        if (packageJson) {
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            return deps['react'];
        }
    } catch {
        // Ignore errors
    }
    return undefined;
}

export async function detectVueVersion(projectPath: string): Promise<string | undefined> {
    try {
        const packageJson = await readPackageJson(projectPath);
        if (packageJson) {
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            return deps['vue'] || deps['@vue/runtime-dom'];
        }
    } catch {
        // Ignore errors
    }
    return undefined;
}

export async function hasSinglePageApplication(projectPath: string): Promise<boolean> {
    try {
        // Check for common SPA patterns
        const patterns = [
            '**/index.html',
            '**/*.html',
            '**/public/index.html',
            '**/src/index.{js,ts,jsx,tsx}',
        ];

        for (const pattern of patterns) {
            const files = await glob(pattern, {
                cwd: projectPath,
                ignore: ['node_modules/**'],
                maxDepth: 3,
            });
            if (files.length > 0) {
                return true;
            }
        }
    } catch {
        // Ignore errors
    }
    return false;
}

export async function getComponentCount(projectPath: string): Promise<number> {
    try {
        const patterns = [
            '**/*.{jsx,tsx}',
            '**/*.vue',
            '**/*.svelte',
            '**/*.component.{ts,js}',
        ];

        let count = 0;
        for (const pattern of patterns) {
            const files = await glob(pattern, {
                cwd: projectPath,
                ignore: ['node_modules/**', 'dist/**', 'build/**'],
                maxDepth: 5,
            });
            count += files.length;
        }
        return count;
    } catch {
        return 0;
    }
}
