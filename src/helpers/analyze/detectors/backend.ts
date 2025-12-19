import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { BackendAnalysis, Framework } from '../../../types/index';

function createBackendAnalysisBase(): BackendAnalysis {
    return {
        framework: { name: 'Unknown' },
        database: [],
        authentication: [],
        caching: [],
        messaging: [],
        search: [],
        monitoring: [],
        features: {
            hasGraphQL: false,
            hasREST: false,
            hasWebSockets: false,
            hasMicroservices: false,
            hasQueue: false,
            hasCronJobs: false,
            hasFileUpload: false,
            hasValidation: false,
            hasTesting: false,
            hasDocumentation: false,
        },
        deployment: {
            hasDocker: false,
            hasKubernetes: false,
            hasCI: false,
        },
        configFiles: [],
        entryPoints: [],
        apiRoutes: [],
        models: [],
        frameworks: [],
        runtimes: [],
        servers: [],
    };
}

function mergeBackendAnalysis(target: BackendAnalysis, source: Partial<BackendAnalysis>): void {
    if (source.framework && source.framework.name && source.framework.name !== 'Unknown') {
        target.framework = source.framework;
        if (!target.frameworks?.some(fw => fw.name === source.framework!.name)) {
            target.frameworks = target.frameworks ?? [];
            target.frameworks.push(source.framework);
        }
        if (source.framework.server && !target.server) {
            target.server = source.framework.server;
        }
    }

    if (source.frameworks?.length) {
        target.frameworks = target.frameworks ?? [];
        source.frameworks.forEach(framework => {
            if (!framework?.name || framework.name === 'Unknown') {
                return;
            }
            if (!target.frameworks!.some(existing => existing.name === framework.name)) {
                target.frameworks!.push(framework);
            }
        });
    }

    if (source.runtime) {
        target.runtime = source.runtime;
        target.runtimes = target.runtimes ?? [];
        if (!target.runtimes.includes(source.runtime)) {
            target.runtimes.push(source.runtime);
        }
    }

    if (source.runtimes?.length) {
        target.runtimes = target.runtimes ?? [];
        source.runtimes.forEach(runtime => {
            if (!target.runtimes!.includes(runtime)) {
                target.runtimes!.push(runtime);
            }
        });
    }

    if (source.server) {
        target.server = source.server;
        target.servers = target.servers ?? [];
        if (!target.servers.includes(source.server)) {
            target.servers.push(source.server);
        }
    }

    if (source.servers?.length) {
        target.servers = target.servers ?? [];
        source.servers.forEach(server => {
            if (!target.servers!.includes(server)) {
                target.servers!.push(server);
            }
        });
    }

    mergeList(target.database, source.database);
    mergeList(target.authentication, source.authentication);
    mergeList(target.caching, source.caching);
    mergeList(target.messaging, source.messaging);
    mergeList(target.search, source.search);
    mergeList(target.monitoring, source.monitoring);
    mergeList(target.configFiles, source.configFiles);
    mergeList(target.entryPoints, source.entryPoints);
    mergeList(target.apiRoutes, source.apiRoutes);
    mergeList(target.models, source.models);

    if (source.features) {
        target.features.hasGraphQL ||= source.features.hasGraphQL;
        target.features.hasREST ||= source.features.hasREST;
        target.features.hasWebSockets ||= source.features.hasWebSockets;
        target.features.hasMicroservices ||= source.features.hasMicroservices;
        target.features.hasQueue ||= source.features.hasQueue;
        target.features.hasCronJobs ||= source.features.hasCronJobs;
        target.features.hasFileUpload ||= source.features.hasFileUpload;
        target.features.hasValidation ||= source.features.hasValidation;
        target.features.hasTesting ||= source.features.hasTesting;
        target.features.hasDocumentation ||= source.features.hasDocumentation;
    }

    if (source.deployment) {
        target.deployment.hasDocker ||= source.deployment.hasDocker;
        target.deployment.hasKubernetes ||= source.deployment.hasKubernetes;
        target.deployment.hasCI ||= source.deployment.hasCI;
        if (!target.deployment.cloudProvider && source.deployment.cloudProvider) {
            target.deployment.cloudProvider = source.deployment.cloudProvider;
        }
    }

    if (source.orm) {
        target.orm = source.orm;
    }
}

function mergeList(target: string[] | undefined, source: string[] | undefined): void {
    if (!source || source.length === 0) {
        return;
    }
    if (!target) {
        return;
    }
    source.forEach(item => {
        if (!target.includes(item)) {
            target.push(item);
        }
    });
}

export async function detectBackend(projectPath: string): Promise<BackendAnalysis> {
    const analysis = createBackendAnalysisBase();

    try {
        // Phase 1: Detect runtime and framework
        const runtimeDetection = await detectRuntimeAndFramework(projectPath);
        mergeBackendAnalysis(analysis, runtimeDetection);

        // Phase 2: Analyze package/dependency files
        const dependencyAnalysis = await analyzeDependencies(projectPath, analysis.runtime, analysis.framework?.name);
        mergeBackendAnalysis(analysis, dependencyAnalysis);

        // Phase 3: Detect databases and ORMs
        const databaseAnalysis = await detectDatabasesAndORMs(projectPath);
        mergeBackendAnalysis(analysis, databaseAnalysis);

        // Phase 4: Analyze project structure
        const structureAnalysis = await analyzeBackendStructure(projectPath);
        mergeBackendAnalysis(analysis, structureAnalysis);

        // Phase 5: Detect additional services
        const servicesAnalysis = await detectAdditionalServices(projectPath);
        mergeBackendAnalysis(analysis, servicesAnalysis);

        // Phase 6: Detect deployment configuration
        const deploymentAnalysis = await detectDeploymentConfig(projectPath);
        mergeBackendAnalysis(analysis, { deployment: deploymentAnalysis });

        // Phase 7: Verify by file patterns
        const verification = await verifyBackendByFiles(projectPath);
        mergeBackendAnalysis(analysis, verification);

        // Phase 8: Detect API patterns
        const apiAnalysis = await detectAPIPatterns(projectPath);
        mergeBackendAnalysis(analysis, { features: apiAnalysis });

        return analysis;
    } catch (error) {
        console.error('Error detecting backend framework:', error);
        return analysis;
    }
}

async function detectRuntimeAndFramework(projectPath: string): Promise<Partial<BackendAnalysis>> {
    const result: Partial<BackendAnalysis> = {};

    const runtimeChecks = [
        { files: ['package.json'], runtime: 'Node.js' },
        { files: ['requirements.txt', 'pyproject.toml', 'setup.py'], runtime: 'Python' },
        { files: ['pom.xml', 'build.gradle', 'build.sbt'], runtime: 'Java' },
        { files: ['go.mod', 'go.sum'], runtime: 'Go' },
        { files: ['Cargo.toml', 'Cargo.lock'], runtime: 'Rust' },
        { files: ['composer.json', 'composer.lock'], runtime: 'PHP' },
        { files: ['Gemfile', 'Gemfile.lock'], runtime: 'Ruby' },
        { files: ['*.csproj', '*.sln', '*.fsproj'], runtime: '.NET' },
    ];

    const runtimes = await detectRuntimes(projectPath, runtimeChecks);
    if (runtimes.length > 0) {
        result.runtimes = runtimes;
        result.runtime = pickPrimaryRuntime(runtimes);
    }

    if (result.runtime) {
        const frameworkDetection = await detectFrameworkByRuntime(projectPath, result.runtime);
        if (frameworkDetection.primary) {
            result.framework = frameworkDetection.primary;
        }
        if (frameworkDetection.frameworks && frameworkDetection.frameworks.length > 0) {
            result.frameworks = frameworkDetection.frameworks;
        }
    }

    return result;
}

async function detectRuntimes(
    projectPath: string,
    runtimeChecks: { files: string[]; runtime: string }[]
): Promise<string[]> {
    const found = new Set<string>();

    for (const check of runtimeChecks) {
        for (const filePattern of check.files) {
            try {
                const files = await glob(filePattern, { cwd: projectPath, nodir: true });
                if (files.length > 0) {
                    found.add(check.runtime);
                    break;
                }
            } catch {
                // Continue checking
            }
        }
    }

    return Array.from(found);
}

function pickPrimaryRuntime(runtimes: string[]): string {
    const priority = [
        'Node.js',
        'Python',
        'Java',
        'Go',
        'Rust',
        'PHP',
        'Ruby',
        '.NET',
    ];

    for (const runtime of priority) {
        if (runtimes.includes(runtime)) {
            return runtime;
        }
    }

    return runtimes[0];
}

async function detectFrameworkByRuntime(
    projectPath: string,
    runtime: string
): Promise<{ primary?: Framework; frameworks?: Framework[] }> {
    let primary: Framework | undefined;
    let frameworks: Framework[] = [];

    switch (runtime) {
        case 'Node.js':
            frameworks = await detectNodeFrameworks(projectPath);
            primary = pickPrimaryFramework(frameworks);
            break;

        case 'Python':
            primary = await detectPythonFramework(projectPath);
            frameworks = primary ? [primary] : [];
            break;

        case 'Java':
            primary = await detectJavaFramework(projectPath);
            frameworks = primary ? [primary] : [];
            break;

        case 'Go':
            primary = await detectGoFramework(projectPath);
            frameworks = primary ? [primary] : [];
            break;

        case 'Rust':
            primary = await detectRustFramework(projectPath);
            frameworks = primary ? [primary] : [];
            break;

        case 'PHP':
            primary = await detectPHPFramework(projectPath);
            frameworks = primary ? [primary] : [];
            break;

        case 'Ruby':
            primary = await detectRubyFramework(projectPath);
            frameworks = primary ? [primary] : [];
            break;

        case '.NET':
            primary = await detectDotNetFramework(projectPath);
            frameworks = primary ? [primary] : [];
            break;
    }

    return { primary, frameworks };
}

async function detectNodeFrameworks(projectPath: string): Promise<Framework[]> {
    let frameworks: Framework[] = [];

    try {
        const packageJson = await readPackageJson(projectPath);
        if (!packageJson) return frameworks;

        const deps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };

        if (deps['express']) {
            frameworks.push({ name: 'Express.js', version: deps['express'], server: 'Express' });
        }
        if (deps['koa']) {
            frameworks.push({ name: 'Koa', version: deps['koa'], server: 'Koa' });
        }
        if (deps['fastify']) {
            frameworks.push({ name: 'Fastify', version: deps['fastify'], server: 'Fastify' });
        }
        if (deps['@nestjs/core']) {
            frameworks.push({ name: 'NestJS', version: deps['@nestjs/core'], server: 'Express/Fastify' });
        }
        if (deps['@hapi/hapi']) {
            frameworks.push({ name: 'Hapi', version: deps['@hapi/hapi'], server: 'Hapi' });
        }
        if (deps['sails']) {
            frameworks.push({ name: 'Sails.js', version: deps['sails'], server: 'Express' });
        }
        if (deps['meteor']) {
            frameworks.push({ name: 'Meteor', version: deps['meteor'] });
        }
        if (deps['@adonisjs/core']) {
            frameworks.push({ name: 'AdonisJS', version: deps['@adonisjs/core'], server: 'Adonis' });
        }
        if (deps['@loopback/core']) {
            frameworks.push({ name: 'LoopBack', version: deps['@loopback/core'], server: 'Express' });
        }

        // Check for serverless
        if ((deps['serverless'] || deps['@serverless/framework']) && frameworks.length > 0) {
            frameworks = frameworks.map(framework => ({
                ...framework,
                server: framework.server ?? 'Serverless',
            }));
        }

        // Check for TypeScript backend
        if (deps['typescript'] && frameworks.length > 0) {
            frameworks = frameworks.map(framework => ({
                ...framework,
                name: framework.name.includes('(TypeScript)') ? framework.name : `${framework.name} (TypeScript)`,
            }));
        }

    } catch (error) {
        console.error('Error detecting Node.js framework:', error);
    }

    return frameworks;
}

function pickPrimaryFramework(frameworks: Framework[]): Framework | undefined {
    if (!frameworks.length) {
        return undefined;
    }

    const priority = [
        'NestJS',
        'Express.js',
        'Fastify',
        'Koa',
        'Hapi',
        'Sails.js',
        'AdonisJS',
        'LoopBack',
        'Meteor',
    ];

    for (const name of priority) {
        const match = frameworks.find(framework => framework.name === name || framework.name.startsWith(`${name} `));
        if (match) {
            return match;
        }
    }

    return frameworks[0];
}

async function detectPythonFramework(projectPath: string): Promise<BackendAnalysis['framework'] | undefined> {
    const result: BackendAnalysis['framework'] = { name: 'Unknown' };
    
    try {
        // Check requirements.txt
        const requirementsPath = path.join(projectPath, 'requirements.txt');
        try {
            const content = await fs.readFile(requirementsPath, 'utf8');
            const lines = content.split('\n').map(line => line.trim().toLowerCase());
            
            // Django
            if (lines.some(line => line.startsWith('django') || line.includes('django=='))) {
                result.name = 'Django';
                const djangoLine = lines.find(line => line.startsWith('django'));
                if (djangoLine) {
                    const versionMatch = djangoLine.match(/django[=<>]=?([\d.]+)/);
                    result.version = versionMatch ? versionMatch[1] : undefined;
                }
                result.server = 'Django';
            }
            // Flask
            else if (lines.some(line => line.startsWith('flask') || line.includes('flask=='))) {
                result.name = 'Flask';
                const flaskLine = lines.find(line => line.startsWith('flask'));
                if (flaskLine) {
                    const versionMatch = flaskLine.match(/flask[=<>]=?([\d.]+)/);
                    result.version = versionMatch ? versionMatch[1] : undefined;
                }
                result.server = 'Werkzeug';
            }
            // FastAPI
            else if (lines.some(line => line.startsWith('fastapi') || line.includes('fastapi=='))) {
                result.name = 'FastAPI';
                const fastapiLine = lines.find(line => line.startsWith('fastapi'));
                if (fastapiLine) {
                    const versionMatch = fastapiLine.match(/fastapi[=<>]=?([\d.]+)/);
                    result.version = versionMatch ? versionMatch[1] : undefined;
                }
                result.server = 'Uvicorn';
            }
            // Pyramid
            else if (lines.some(line => line.startsWith('pyramid') || line.includes('pyramid=='))) {
                result.name = 'Pyramid';
                result.server = 'Pyramid';
            }
            // Tornado
            else if (lines.some(line => line.startsWith('tornado') || line.includes('tornado=='))) {
                result.name = 'Tornado';
                result.server = 'Tornado';
            }
        } catch {
            // requirements.txt not found or can't be read
        }

        // Check pyproject.toml
        const pyprojectPath = path.join(projectPath, 'pyproject.toml');
        try {
            const content = await fs.readFile(pyprojectPath, 'utf8');
            if (content.includes('[tool.poetry]')) {
                // Poetry project
                if (content.includes('django') || content.includes('flask') || content.includes('fastapi')) {
                    // Framework would have been detected from dependencies
                }
            }
        } catch {
            // pyproject.toml not found
        }

        // Check for Django-specific files
        const djangoFiles = await glob('**/manage.py', { cwd: projectPath, nodir: true });
        if (djangoFiles.length > 0 && result.name === 'Unknown') {
            result.name = 'Django';
            result.server = 'Django';
        }

        // Check for Flask-specific files
        const flaskFiles = await glob('**/app.py', { cwd: projectPath, nodir: true });
        if (flaskFiles.length > 0 && result.name === 'Unknown') {
            // Check if it's actually a Flask app
            try {
                const appContent = await fs.readFile(path.join(projectPath, flaskFiles[0]), 'utf8');
                if (appContent.includes('Flask') || appContent.includes('from flask import')) {
                    result.name = 'Flask';
                    result.server = 'Werkzeug';
                }
            } catch {
                // Can't read file
            }
        }

    } catch (error) {
        console.error('Error detecting Python framework:', error);
    }

    return result.name === 'Unknown' ? undefined : result;
}

async function detectJavaFramework(projectPath: string): Promise<BackendAnalysis['framework'] | undefined> {
    const result: BackendAnalysis['framework'] = { name: 'Unknown' };
    
    try {
        // Check for Maven pom.xml
        const pomPath = path.join(projectPath, 'pom.xml');
        try {
            const content = await fs.readFile(pomPath, 'utf8');
            
            // Spring Boot
            if (content.includes('spring-boot-starter-web') || 
                content.includes('org.springframework.boot')) {
                result.name = 'Spring Boot';
                result.server = 'Tomcat/Netty';
                
                // Try to extract version
                const versionMatch = content.match(/<version>([\d.]+)<\/version>/);
                if (versionMatch) {
                    result.version = versionMatch[1];
                }
            }
            // Jakarta EE / Java EE
            else if (content.includes('jakarta') || content.includes('javax')) {
                result.name = 'Jakarta EE';
                result.server = 'Jakarta EE Server';
            }
            // Micronaut
            else if (content.includes('micronaut')) {
                result.name = 'Micronaut';
                result.server = 'Netty';
            }
            // Quarkus
            else if (content.includes('quarkus')) {
                result.name = 'Quarkus';
                result.server = 'Netty/Vert.x';
            }
            // Play Framework
            else if (content.includes('play-framework')) {
                result.name = 'Play Framework';
                result.server = 'Netty';
            }
            // Vert.x
            else if (content.includes('vertx')) {
                result.name = 'Vert.x';
                result.server = 'Vert.x';
            }
        } catch {
            // pom.xml not found
        }

        // Check for Gradle build.gradle
        const gradlePath = path.join(projectPath, 'build.gradle');
        try {
            const content = await fs.readFile(gradlePath, 'utf8');
            
            if (content.includes('spring-boot') && result.name === 'Unknown') {
                result.name = 'Spring Boot';
                result.server = 'Tomcat/Netty';
            }
        } catch {
            // build.gradle not found
        }

    } catch (error) {
        console.error('Error detecting Java framework:', error);
    }

    return result.name === 'Unknown' ? undefined : result;
}

async function detectGoFramework(projectPath: string): Promise<BackendAnalysis['framework'] | undefined> {
    const result: BackendAnalysis['framework'] = { name: 'Unknown' };
    
    try {
        // Check go.mod for dependencies
        const goModPath = path.join(projectPath, 'go.mod');
        try {
            const content = await fs.readFile(goModPath, 'utf8');
            
            // Gin
            if (content.includes('github.com/gin-gonic/gin')) {
                result.name = 'Gin';
                result.server = 'Gin';
            }
            // Echo
            else if (content.includes('github.com/labstack/echo')) {
                result.name = 'Echo';
                result.server = 'Echo';
            }
            // Gorilla Mux
            else if (content.includes('github.com/gorilla/mux')) {
                result.name = 'Gorilla Mux';
                result.server = 'net/http';
            }
            // Fiber
            else if (content.includes('github.com/gofiber/fiber')) {
                result.name = 'Fiber';
                result.server = 'Fiber';
            }
            // Beego
            else if (content.includes('github.com/astaxie/beego')) {
                result.name = 'Beego';
                result.server = 'Beego';
            }
            // Revel
            else if (content.includes('github.com/revel/revel')) {
                result.name = 'Revel';
                result.server = 'Revel';
            }
            // Standard library
            else if (content.includes('net/http') && result.name === 'Unknown') {
                result.name = 'net/http';
                result.server = 'net/http';
            }
        } catch {
            // go.mod not found
        }

        // Check main.go for imports
        const mainFiles = await glob('**/main.go', { cwd: projectPath, nodir: true });
        if (mainFiles.length > 0 && result.name === 'Unknown') {
            try {
                const mainContent = await fs.readFile(path.join(projectPath, mainFiles[0]), 'utf8');
                if (mainContent.includes('gin')) {
                    result.name = 'Gin';
                    result.server = 'Gin';
                } else if (mainContent.includes('echo')) {
                    result.name = 'Echo';
                    result.server = 'Echo';
                }
            } catch {
                // Can't read file
            }
        }

    } catch (error) {
        console.error('Error detecting Go framework:', error);
    }

    return result.name === 'Unknown' ? undefined : result;
}

async function detectRustFramework(projectPath: string): Promise<BackendAnalysis['framework'] | undefined> {
    const result: BackendAnalysis['framework'] = { name: 'Unknown' };
    
    try {
        // Check Cargo.toml for dependencies
        const cargoPath = path.join(projectPath, 'Cargo.toml');
        try {
            const content = await fs.readFile(cargoPath, 'utf8');
            
            // Actix-web
            if (content.includes('actix-web')) {
                result.name = 'Actix-web';
                result.server = 'Actix';
            }
            // Rocket
            else if (content.includes('rocket')) {
                result.name = 'Rocket';
                result.server = 'Rocket';
            }
            // Warp
            else if (content.includes('warp')) {
                result.name = 'Warp';
                result.server = 'Warp';
            }
            // Axum
            else if (content.includes('axum')) {
                result.name = 'Axum';
                result.server = 'Tower';
            }
            // Tide
            else if (content.includes('tide')) {
                result.name = 'Tide';
                result.server = 'Tide';
            }
        } catch {
            // Cargo.toml not found
        }

    } catch (error) {
        console.error('Error detecting Rust framework:', error);
    }

    return result.name === 'Unknown' ? undefined : result;
}

async function detectPHPFramework(projectPath: string): Promise<BackendAnalysis['framework'] | undefined> {
    const result: BackendAnalysis['framework'] = { name: 'Unknown' };
    
    try {
        // Check composer.json
        const composerPath = path.join(projectPath, 'composer.json');
        try {
            const content = await fs.readFile(composerPath, 'utf8');
            const composer = JSON.parse(content);
            const deps = {
                ...composer.require,
                ...composer['require-dev'],
            };

            // Laravel
            if (deps['laravel/framework']) {
                result.name = 'Laravel';
                result.version = deps['laravel/framework'];
                result.server = 'Apache/Nginx';
            }
            // Symfony
            else if (deps['symfony/symfony'] || deps['symfony/framework-bundle']) {
                result.name = 'Symfony';
                result.server = 'Apache/Nginx';
            }
            // CodeIgniter
            else if (deps['codeigniter/framework']) {
                result.name = 'CodeIgniter';
                result.server = 'Apache/Nginx';
            }
            // Slim
            else if (deps['slim/slim']) {
                result.name = 'Slim';
                result.server = 'Apache/Nginx';
            }
            // Laminas (formerly Zend)
            else if (deps['laminas/laminas-mvc']) {
                result.name = 'Laminas';
                result.server = 'Apache/Nginx';
            }
            // Yii
            else if (deps['yiisoft/yii2']) {
                result.name = 'Yii';
                result.server = 'Apache/Nginx';
            }
            // CakePHP
            else if (deps['cakephp/cakephp']) {
                result.name = 'CakePHP';
                result.server = 'Apache/Nginx';
            }
        } catch {
            // composer.json not found
        }

        // Check for framework-specific files
        const laravelFiles = await glob('**/artisan', { cwd: projectPath, nodir: true });
        if (laravelFiles.length > 0 && result.name === 'Unknown') {
            result.name = 'Laravel';
            result.server = 'Apache/Nginx';
        }

        const symfonyFiles = await glob('**/bin/console', { cwd: projectPath, nodir: true });
        if (symfonyFiles.length > 0 && result.name === 'Unknown') {
            result.name = 'Symfony';
            result.server = 'Apache/Nginx';
        }

    } catch (error) {
        console.error('Error detecting PHP framework:', error);
    }

    return result.name === 'Unknown' ? undefined : result;
}

async function detectRubyFramework(projectPath: string): Promise<BackendAnalysis['framework'] | undefined> {
    const result: BackendAnalysis['framework'] = { name: 'Unknown' };
    
    try {
        // Check Gemfile
        const gemfilePath = path.join(projectPath, 'Gemfile');
        try {
            const content = await fs.readFile(gemfilePath, 'utf8');
            
            // Ruby on Rails
            if (content.includes('rails')) {
                result.name = 'Ruby on Rails';
                result.server = 'Puma/Passenger';
            }
            // Sinatra
            else if (content.includes('sinatra')) {
                result.name = 'Sinatra';
                result.server = 'WEBrick/Puma';
            }
            // Hanami
            else if (content.includes('hanami')) {
                result.name = 'Hanami';
                result.server = 'Puma';
            }
            // Padrino
            else if (content.includes('padrino')) {
                result.name = 'Padrino';
                result.server = 'Puma';
            }
        } catch {
            // Gemfile not found
        }

        // Check for Rails-specific files
        const railsFiles = await glob('**/bin/rails', { cwd: projectPath, nodir: true });
        if (railsFiles.length > 0 && result.name === 'Unknown') {
            result.name = 'Ruby on Rails';
            result.server = 'Puma/Passenger';
        }

    } catch (error) {
        console.error('Error detecting Ruby framework:', error);
    }

    return result.name === 'Unknown' ? undefined : result;
}

async function detectDotNetFramework(projectPath: string): Promise<BackendAnalysis['framework'] | undefined> {
    const result: BackendAnalysis['framework'] = { name: 'Unknown' };
    
    try {
        // Check for .csproj files
        const csprojFiles = await glob('**/*.csproj', { cwd: projectPath, nodir: true });
        if (csprojFiles.length > 0) {
            result.name = 'ASP.NET Core';
            result.server = 'Kestrel';
            
            // Check which version of .NET
            try {
                const csprojContent = await fs.readFile(path.join(projectPath, csprojFiles[0]), 'utf8');
                if (csprojContent.includes('net8.0')) {
                    result.version = '8.0';
                } else if (csprojContent.includes('net7.0')) {
                    result.version = '7.0';
                } else if (csprojContent.includes('net6.0')) {
                    result.version = '6.0';
                } else if (csprojContent.includes('net5.0')) {
                    result.version = '5.0';
                } else if (csprojContent.includes('netcoreapp')) {
                    result.version = 'Core';
                }
            } catch {
                // Can't read csproj file
            }
        }

        // Check for older .NET Framework
        const webConfigFiles = await glob('**/Web.config', { cwd: projectPath, nodir: true });
        if (webConfigFiles.length > 0 && result.name === 'Unknown') {
            result.name = 'ASP.NET';
            result.server = 'IIS';
        }

    } catch (error) {
        console.error('Error detecting .NET framework:', error);
    }

    return result.name === 'Unknown' ? undefined : result;
}

async function analyzeDependencies(
    projectPath: string,
    runtime?: string,
    frameworkName?: string
): Promise<Partial<BackendAnalysis>> {
    const result: Partial<BackendAnalysis> = {
        authentication: [],
        caching: [],
        messaging: [],
        search: [],
        monitoring: [],
        features: {
            hasGraphQL: false,
            hasREST: false,
            hasWebSockets: false,
            hasMicroservices: false,
            hasQueue: false,
            hasCronJobs: false,
            hasFileUpload: false,
            hasValidation: false,
            hasTesting: false,
            hasDocumentation: false,
        },
    };

    try {
        let deps: Record<string, string> = {};

        const frameworkLabel = frameworkName ?? '';
        const isNodeRuntime = runtime === 'Node.js';
        const isNodeFramework = ['Express', 'NestJS', 'Koa', 'Fastify'].some(name => frameworkLabel.includes(name));

        if (isNodeRuntime || isNodeFramework) {
            const packageJson = await readPackageJson(projectPath);
            if (packageJson) {
                deps = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies,
                };
            }
        }

        if (deps['passport'] || deps['jsonwebtoken'] || deps['bcrypt']) {
            result.authentication!.push('JWT/Passport');
        }
        if (deps['auth0']) {
            result.authentication!.push('Auth0');
        }
        if (deps['firebase-admin']) {
            result.authentication!.push('Firebase');
        }
        if (deps['@azure/msal-node']) {
            result.authentication!.push('Azure AD');
        }

        if (deps['redis'] || deps['ioredis']) {
            result.caching!.push('Redis');
        }
        if (deps['memcached']) {
            result.caching!.push('Memcached');
        }
        if (deps['node-cache'] || deps['memory-cache']) {
            result.caching!.push('In-memory');
        }

        if (deps['bull'] || deps['bullmq']) {
            result.messaging!.push('Bull (Redis)');
        }
        if (deps['amqplib'] || deps['rhea']) {
            result.messaging!.push('RabbitMQ');
        }
        if (deps['kafkajs']) {
            result.messaging!.push('Kafka');
        }
        if (deps['sqs-consumer'] || deps['@aws-sdk/client-sqs']) {
            result.messaging!.push('AWS SQS');
        }

        if (deps['@elastic/elasticsearch']) {
            result.search!.push('Elasticsearch');
        }
        if (deps['algoliasearch']) {
            result.search!.push('Algolia');
        }

        if (deps['winston'] || deps['pino']) {
            result.monitoring!.push('Structured Logging');
        }
        if (deps['prom-client']) {
            result.monitoring!.push('Prometheus');
        }
        if (deps['@opentelemetry/api']) {
            result.monitoring!.push('OpenTelemetry');
        }
        if (deps['sentry']) {
            result.monitoring!.push('Sentry');
        }

        if (deps['graphql'] || deps['apollo-server']) {
            result.features!.hasGraphQL = true;
        }

        if (deps['socket.io'] || deps['ws']) {
            result.features!.hasWebSockets = true;
        }

        if (deps['jest'] || deps['mocha'] || deps['chai'] || deps['supertest']) {
            result.features!.hasTesting = true;
        }

    } catch (error) {
        console.error('Error analyzing dependencies:', error);
    }

    return result;
}

async function detectDatabasesAndORMs(projectPath: string): Promise<Partial<BackendAnalysis>> {
    const databases: string[] = [];
    let orm: string | undefined;

    try {
        // Read package.json for Node.js projects
        const packageJson = await readPackageJson(projectPath);
        if (packageJson) {
            const deps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };

            // Databases
            if (deps['mongoose']) {
                databases.push('MongoDB');
                orm = 'Mongoose';
            }
            if (deps['typeorm']) {
                databases.push('PostgreSQL/MySQL/SQLite');
                orm = 'TypeORM';
            }
            if (deps['sequelize']) {
                databases.push('PostgreSQL/MySQL/MariaDB/SQLite');
                orm = 'Sequelize';
            }
            if (deps['prisma']) {
                databases.push('PostgreSQL/MySQL/SQLite/MongoDB');
                orm = 'Prisma';
            }
            if (deps['redis'] || deps['ioredis']) {
                databases.push('Redis');
            }
            if (deps['@elastic/elasticsearch']) {
                databases.push('Elasticsearch');
            }
            if (deps['mysql2'] || deps['mysql']) {
                databases.push('MySQL');
            }
            if (deps['pg'] || deps['postgres']) {
                databases.push('PostgreSQL');
            }
            if (deps['sqlite3']) {
                databases.push('SQLite');
            }
            if (deps['mongodb']) {
                databases.push('MongoDB');
            }
            if (deps['cassandra-driver']) {
                databases.push('Cassandra');
            }
        }

        // Check for Python databases
        const requirementsPath = path.join(projectPath, 'requirements.txt');
        try {
            const content = await fs.readFile(requirementsPath, 'utf8');
            if (content.includes('django.db') || content.includes('psycopg2') || content.includes('mysqlclient')) {
                databases.push('PostgreSQL/MySQL');
                orm = 'Django ORM';
            }
            if (content.includes('sqlalchemy')) {
                orm = 'SQLAlchemy';
            }
            if (content.includes('pymongo')) {
                databases.push('MongoDB');
            }
            if (content.includes('redis')) {
                databases.push('Redis');
            }
        } catch {
            // requirements.txt not found
        }

        // Check for environment variables or config files
        const envFiles = await glob('**/.env*', { cwd: projectPath, nodir: true });
        for (const envFile of envFiles.slice(0, 3)) {
            try {
                const content = await fs.readFile(path.join(projectPath, envFile), 'utf8');
                const dbPatterns = [
                    { pattern: /DATABASE_URL|DB_CONNECTION/i, type: 'Database' },
                    { pattern: /MONGO|MONGODB/i, type: 'MongoDB' },
                    { pattern: /POSTGRES/i, type: 'PostgreSQL' },
                    { pattern: /MYSQL/i, type: 'MySQL' },
                    { pattern: /REDIS/i, type: 'Redis' },
                ];
                
                for (const pattern of dbPatterns) {
                    if (pattern.pattern.test(content) && !databases.includes(pattern.type)) {
                        databases.push(pattern.type);
                    }
                }
            } catch {
                // Can't read env file
            }
        }

    } catch (error) {
        console.error('Error detecting databases:', error);
    }

    return {
        database: [...new Set(databases)],
        orm,
    };
}

async function analyzeBackendStructure(projectPath: string): Promise<Partial<BackendAnalysis>> {
    const result: Partial<BackendAnalysis> = {
        entryPoints: [],
        apiRoutes: [],
        models: [],
    };

    try {
        // Common backend entry points
        const entryPatterns = [
            '**/index.{js,ts}',
            '**/app.{js,ts}',
            '**/server.{js,ts}',
            '**/main.{go,rs,py,java}',
            '**/Program.cs',
            '**/application.rb',
        ];

        for (const pattern of entryPatterns) {
            const files = await glob(pattern, {
                cwd: projectPath,
                ignore: ['node_modules/**', 'dist/**', 'build/**', 'vendor/**'],
                maxDepth: 3,
            });
            result.entryPoints!.push(...files.slice(0, 5)); // Limit to 5
        }

        // API routes/controllers
        const routePatterns = [
            '**/routes/**/*.{js,ts}',
            '**/controllers/**/*.{js,ts,py,java,cs,rb}',
            '**/api/**/*.{js,ts,py,java,cs,rb}',
        ];

        for (const pattern of routePatterns) {
            const files = await glob(pattern, {
                cwd: projectPath,
                ignore: ['node_modules/**', 'dist/**', 'build/**', 'vendor/**'],
                maxDepth: 4,
            });
            result.apiRoutes!.push(...files.slice(0, 10)); // Limit to 10
        }

        // Models/Entities
        const modelPatterns = [
            '**/models/**/*.{js,ts,py,java,cs,rb}',
            '**/entities/**/*.{js,ts,py,java,cs,rb}',
            '**/schemas/**/*.{js,ts,py,java,cs,rb}',
        ];

        for (const pattern of modelPatterns) {
            const files = await glob(pattern, {
                cwd: projectPath,
                ignore: ['node_modules/**', 'dist/**', 'build/**', 'vendor/**'],
                maxDepth: 4,
            });
            result.models!.push(...files.slice(0, 10)); // Limit to 10
        }

        // Remove duplicates
        result.entryPoints = [...new Set(result.entryPoints)];
        result.apiRoutes = [...new Set(result.apiRoutes)];
        result.models = [...new Set(result.models)];

    } catch (error) {
        console.error('Error analyzing backend structure:', error);
    }

    return result;
}

async function detectAdditionalServices(projectPath: string): Promise<Partial<BackendAnalysis>> {
    const result: Partial<BackendAnalysis> = {};

    try {
        // Check for configuration files of various services
        const configChecks = [
            // Email services
            { pattern: '**/mail.config.*', service: 'Email Service' },
            { pattern: '**/smtp.config.*', service: 'SMTP' },
            
            // File storage
            { pattern: '**/s3.config.*', service: 'AWS S3' },
            { pattern: '**/storage.config.*', service: 'Cloud Storage' },
            
            // Payment
            { pattern: '**/stripe.config.*', service: 'Stripe' },
            { pattern: '**/paypal.config.*', service: 'PayPal' },
            
            // Social auth
            { pattern: '**/oauth.config.*', service: 'OAuth' },
            { pattern: '**/social.config.*', service: 'Social Login' },
        ];

        const detectedServices = new Set<string>();
        for (const check of configChecks) {
            const files = await glob(check.pattern, { cwd: projectPath, nodir: true, maxDepth: 3 });
            if (files.length > 0) {
                detectedServices.add(check.service);
            }
        }

        // Check for AWS/Cloud provider configuration
        const awsFiles = await glob('**/aws*.{js,ts,json}', { cwd: projectPath, nodir: true, maxDepth: 2 });
        const gcpFiles = await glob('**/gcp*.{js,ts,json}', { cwd: projectPath, nodir: true, maxDepth: 2 });
        const azureFiles = await glob('**/azure*.{js,ts,json}', { cwd: projectPath, nodir: true, maxDepth: 2 });

        if (awsFiles.length > 0) {
            detectedServices.add('AWS Services');
        }
        if (gcpFiles.length > 0) {
            detectedServices.add('Google Cloud Services');
        }
        if (azureFiles.length > 0) {
            detectedServices.add('Azure Services');
        }

        // Convert to arrays
        if (detectedServices.size > 0) {
            // We'll add these to appropriate arrays in the analysis
        }

    } catch (error) {
        console.error('Error detecting additional services:', error);
    }

    return result;
}

async function detectDeploymentConfig(projectPath: string): Promise<BackendAnalysis['deployment']> {
    const deployment: BackendAnalysis['deployment'] = {
        hasDocker: false,
        hasKubernetes: false,
        hasCI: false,
    };

    try {
        // Check for Docker
        const dockerFiles = await glob('**/Dockerfile*', { cwd: projectPath, nodir: true });
        const dockerComposeFiles = await glob('**/docker-compose*.yml', { cwd: projectPath, nodir: true });
        deployment.hasDocker = dockerFiles.length > 0 || dockerComposeFiles.length > 0;

        // Check for Kubernetes
        const k8sFiles = await glob('**/*.yaml', { cwd: projectPath, nodir: true, maxDepth: 2 });
        deployment.hasKubernetes = k8sFiles.some(file => 
            file.includes('deployment') || 
            file.includes('service') || 
            file.includes('configmap') ||
            file.includes('ingress')
        );

        // Check for CI/CD
        const ciFiles = await glob('**/.github/workflows/*.yml', { cwd: projectPath, nodir: true });
        const gitlabCi = await glob('**/.gitlab-ci.yml', { cwd: projectPath, nodir: true });
        const jenkinsFiles = await glob('**/Jenkinsfile', { cwd: projectPath, nodir: true });
        deployment.hasCI = ciFiles.length > 0 || gitlabCi.length > 0 || jenkinsFiles.length > 0;

        // Check for cloud provider configs
        const cloudChecks = [
            { pattern: '**/serverless.yml', provider: 'AWS' },
            { pattern: '**/serverless.yaml', provider: 'AWS' },
            { pattern: '**/app.yaml', provider: 'Google Cloud' },
            { pattern: '**/appengine/**', provider: 'Google Cloud' },
            { pattern: '**/azure-pipelines.yml', provider: 'Azure' },
        ];

        for (const check of cloudChecks) {
            const files = await glob(check.pattern, { cwd: projectPath, nodir: true, maxDepth: 3 });
            if (files.length > 0) {
                deployment.cloudProvider = check.provider;
                break;
            }
        }

    } catch (error) {
        console.error('Error detecting deployment config:', error);
    }

    return deployment;
}

async function verifyBackendByFiles(projectPath: string): Promise<Partial<BackendAnalysis>> {
    const result: Partial<BackendAnalysis> = {
        features: {
            hasGraphQL: false,
            hasREST: false,
            hasWebSockets: false,
            hasMicroservices: false,
            hasQueue: false,
            hasCronJobs: false,
            hasFileUpload: false,
            hasValidation: false,
            hasTesting: false,
            hasDocumentation: false,
        },
    };

    try {
        // Check for REST API patterns
        const restFiles = await glob('**/*{route,controller,api}*.{js,ts,py,java,cs,rb}', {
            cwd: projectPath,
            ignore: ['node_modules/**', 'dist/**', 'build/**', 'vendor/**'],
            maxDepth: 4,
        });
        result.features!.hasREST = restFiles.length > 0;

        // Check for GraphQL
        const graphqlFiles = await glob('**/*.{graphql,gql}', { cwd: projectPath, nodir: true, maxDepth: 3 });
        const graphqlResolvers = await glob('**/resolvers/**/*.{js,ts}', { cwd: projectPath, nodir: true, maxDepth: 4 });
        result.features!.hasGraphQL = graphqlFiles.length > 0 || graphqlResolvers.length > 0;

        // Check for WebSocket files
        const websocketFiles = await glob('**/*socket*.{js,ts}', { cwd: projectPath, nodir: true, maxDepth: 3 });
        result.features!.hasWebSockets = websocketFiles.length > 0;

        // Check for microservices patterns
        const microserviceFiles = await glob('**/services/**/*.{js,ts}', { cwd: projectPath, nodir: true, maxDepth: 4 });
        result.features!.hasMicroservices = microserviceFiles.length > 5; // Arbitrary threshold

        // Check for queue/worker files
        const queueFiles = await glob('**/*{worker,job,queue,task}*.{js,ts,py}', { cwd: projectPath, nodir: true, maxDepth: 3 });
        result.features!.hasQueue = queueFiles.length > 0;

        // Check for cron job files
        const cronFiles = await glob('**/*{cron,schedule,task}*.{js,ts,py}', { cwd: projectPath, nodir: true, maxDepth: 3 });
        result.features!.hasCronJobs = cronFiles.length > 0;

        // Check for file upload handling
        const uploadFiles = await glob('**/*{upload,file,storage}*.{js,ts,py}', { cwd: projectPath, nodir: true, maxDepth: 3 });
        result.features!.hasFileUpload = uploadFiles.length > 0;

        // Check for validation
        const validationFiles = await glob('**/*{validat,schema}*.{js,ts,py}', { cwd: projectPath, nodir: true, maxDepth: 3 });
        result.features!.hasValidation = validationFiles.length > 0;

        // Check for tests
        const testFiles = await glob('**/*.{test,spec}.{js,ts,py,java,cs,rb}', { cwd: projectPath, nodir: true, maxDepth: 4 });
        result.features!.hasTesting = testFiles.length > 0;

        // Check for documentation
        const docsFiles = await glob('**/docs/**', { cwd: projectPath, nodir: false, maxDepth: 3 });
        const readmeFiles = await glob('**/README*', { cwd: projectPath, nodir: true, maxDepth: 2 });
        result.features!.hasDocumentation = docsFiles.length > 0 || readmeFiles.length > 0;

    } catch (error) {
        console.error('Error verifying backend by files:', error);
    }

    return result;
}

async function detectAPIPatterns(projectPath: string): Promise<BackendAnalysis['features']> {
    const features = {} as BackendAnalysis['features'];

    try {
        // Sample a few API files to detect patterns
        const apiFiles = await glob('**/*.{js,ts,py}', {
            cwd: projectPath,
            ignore: ['node_modules/**', 'dist/**', 'build/**', 'vendor/**'],
            maxDepth: 4,
        });

        // Sample up to 10 files
        const sampleFiles = apiFiles.slice(0, 10);
        for (const file of sampleFiles) {
            try {
                const content = await fs.readFile(path.join(projectPath, file), 'utf8');
                
                // Detect REST patterns
                if (content.match(/app\.(get|post|put|delete|patch)/) ||
                    content.match(/router\.(get|post|put|delete|patch)/) ||
                    content.match(/@(Get|Post|Put|Delete|Patch)/)) {
                    features.hasREST = true;
                }

                // Detect GraphQL patterns
                if (content.includes('GraphQL') || content.includes('gql`') || content.includes('type Query') || content.includes('type Mutation')) {
                    features.hasGraphQL = true;
                }

                // Detect WebSocket patterns
                if (content.includes('WebSocket') || content.includes('socket.io') || content.includes('ws.')) {
                    features.hasWebSockets = true;
                }

                if (features.hasREST && features.hasGraphQL && features.hasWebSockets) {
                    break; // Found all patterns
                }
            } catch {
                // Can't read file
            }
        }

    } catch (error) {
        console.error('Error detecting API patterns:', error);
    }

    return features;
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
