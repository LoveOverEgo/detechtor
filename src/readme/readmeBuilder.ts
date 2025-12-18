import { ProjectAnalysis } from '../types';
import { generateBadges, generateTableOfContents, generateInstallation, generateUsage, generateAPISection, generateContributing, generateLicense, generateContact, generateQuickStart } from './templates';

export interface ReadmeOptions {
    includeBadges?: boolean;
    includeTOC?: boolean;
    includeQuickStart?: boolean;
    includeAPI?: boolean;
    includeExamples?: boolean;
    includeContributing?: boolean;
    includeLicense?: boolean;
    includeContact?: boolean;
    theme?: 'default' | 'minimal' | 'detailed';
    language?: 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
}

export function buildReadme(analysis: ProjectAnalysis, options: ReadmeOptions = {}): string {
    const {
        includeBadges = true,
        includeTOC = true,
        includeQuickStart = true,
        includeAPI = true,
        includeExamples = true,
        includeContributing = true,
        includeLicense = true,
        includeContact = true,
        theme = 'default',
        language = 'en',
    } = options;

    const sections: string[] = [];

    // Header with project name and tagline
    sections.push(generateHeader(analysis, theme));

    // Badges
    if (includeBadges) {
        const badges = generateBadges(analysis);
        if (badges.trim()) {
            sections.push(badges);
            sections.push(''); // Empty line
        }
    }

    // Table of Contents
    if (includeTOC) {
        sections.push(generateTableOfContents(analysis, sections, options));
        sections.push(''); // Empty line
    }

    // Description
    sections.push(generateDescription(analysis));
    sections.push(''); // Empty line

    // Features
    if (analysis.projectInfo.description || analysis.languages.length > 0) {
        sections.push(generateFeatures(analysis));
        sections.push(''); // Empty line
    }

    // Quick Start
    if (includeQuickStart) {
        const quickStart = generateQuickStart(analysis);
        if (quickStart.trim()) {
            sections.push(quickStart);
            sections.push(''); // Empty line
        }
    }

    // Installation
    sections.push(generateInstallation(analysis));
    sections.push(''); // Empty line

    // Usage
    sections.push(generateUsage(analysis));
    sections.push(''); // Empty line

    // API Documentation
    if (includeAPI && (analysis.backend.framework !== 'Unknown' || analysis.frontend.framework !== 'Unknown')) {
        const apiSection = generateAPISection(analysis);
        if (apiSection.trim()) {
            sections.push(apiSection);
            sections.push(''); // Empty line
        }
    }

    // Examples
    if (includeExamples) {
        const examples = generateExamples(analysis);
        if (examples.trim()) {
            sections.push(examples);
            sections.push(''); // Empty line
        }
    }

    // Project Structure
    sections.push(generateProjectStructure(analysis));
    sections.push(''); // Empty line

    // Technologies Used
    sections.push(generateTechnologies(analysis));
    sections.push(''); // Empty line

    // Testing
    if (analysis.testing.frameworks && analysis.testing.frameworks.length > 0) {
        sections.push(generateTestingSection(analysis));
        sections.push(''); // Empty line
    }

    // Contributing
    if (includeContributing) {
        const contributing = generateContributing(analysis);
        if (contributing.trim()) {
            sections.push(contributing);
            sections.push(''); // Empty line
        }
    }

    // License
    if (includeLicense) {
        const license = generateLicense(analysis);
        if (license.trim()) {
            sections.push(license);
            sections.push(''); // Empty line
        }
    }

    // Contact & Support
    if (includeContact) {
        const contact = generateContact(analysis);
        if (contact.trim()) {
            sections.push(contact);
        }
    }

    // Footer
    sections.push(generateFooter(analysis));

    // Apply theme-specific formatting
    return formatReadme(sections, theme);
}

function generateHeader(analysis: ProjectAnalysis, theme: string): string {
    const name = analysis.projectInfo.name || 'Project Name';
    const description = analysis.projectInfo.description || 'A well-structured project with modern technologies';
    
    let header = '';
    
    switch (theme) {
        case 'minimal':
            header = `# ${name}\n\n${description}\n`;
            break;
        case 'detailed':
            header = `# ${name}\n\n> ${description}\n\n`;
            if (analysis.projectInfo.version) {
                header += `**Version:** ${analysis.projectInfo.version}\n\n`;
            }
            break;
        default:
            header = `# ${name}\n\n${description}\n\n`;
    }
    
    return header;
}

function generateDescription(analysis: ProjectAnalysis): string {
    let description = '## 📋 Description\n\n';
    
    const languages = analysis.languages.join(', ');
    const frontend = analysis.frontend.framework !== 'Unknown' ? analysis.frontend.framework : undefined;
    const backend = analysis.backend.framework !== 'Unknown' ? analysis.backend.framework : undefined;
    
    description += 'This project is ';
    
    if (frontend && backend) {
        description += `a full-stack application built with **${frontend}** on the frontend and **${backend}** on the backend. `;
    } else if (frontend) {
        description += `a frontend application built with **${frontend}**. `;
    } else if (backend) {
        description += `a backend application built with **${backend}**. `;
    } else {
        description += `a software project `;
    }
    
    description += `Written primarily in **${languages}**, it follows modern development practices and includes comprehensive tooling for development, testing, and deployment.\n\n`;
    
    // Add key features based on analysis
    const keyFeatures: string[] = [];
    
    if (analysis.projectInfo.hasTypeScript) {
        keyFeatures.push('TypeScript for type safety');
    }
    
    if (analysis.testing.frameworks && analysis.testing.frameworks.length > 0) {
        keyFeatures.push('Comprehensive testing setup');
    }
    
    if (analysis.projectInfo.hasLinting) {
        keyFeatures.push('Code quality tools (ESLint/Prettier)');
    }
    
    if (analysis.projectInfo.hasCI) {
        keyFeatures.push('Continuous Integration/Deployment');
    }
    
    if (analysis.projectInfo.hasDocker) {
        keyFeatures.push('Docker support');
    }
    
    if (keyFeatures.length > 0) {
        description += '**Key Features:**\n';
        keyFeatures.forEach(feature => {
            description += `- ✅ ${feature}\n`;
        });
    }
    
    return description;
}

function generateFeatures(analysis: ProjectAnalysis): string {
    const features: string[] = [];
    
    // Add framework-specific features
    if (analysis.frontend.framework !== 'Unknown') {
        features.push(`**${analysis.frontend.framework}** - Modern frontend framework`);
        if (analysis.frontend.hasRouter) {
            features.push('**Routing** - Client-side routing enabled');
        }
        if (analysis.frontend.hasStateManagement) {
            features.push('**State Management** - Centralized state management');
        }
        if (analysis.frontend.cssFramework) {
            features.push(`**${analysis.frontend.cssFramework}** - CSS framework/styling`);
        }
    }
    
    if (analysis.backend.framework !== 'Unknown') {
        features.push(`**${analysis.backend.framework}** - Robust backend framework`);
        if (analysis.backend.database && analysis.backend.database.length > 0) {
            features.push(`**${analysis.backend.database.join(', ')}** - Database ${analysis.backend.orm ? `with ${analysis.backend.orm}` : ''}`);
        }
        if (analysis.backend.authentication && analysis.backend.authentication.length > 0) {
            features.push(`**${analysis.backend.authentication.join(', ')}** - Authentication system`);
        }
    }
    
    // Add testing features
    if (analysis.testing.frameworks && analysis.testing.frameworks.length > 0) {
        features.push(`**${analysis.testing.frameworks.join(', ')}** - Testing framework${analysis.testing.frameworks.length > 1 ? 's' : ''}`);
        if (analysis.testing.e2eTools && analysis.testing.e2eTools.length > 0) {
            features.push(`**${analysis.testing.e2eTools.join(', ')}** - End-to-end testing`);
        }
        if (analysis.testing.coverageTools && analysis.testing.coverageTools.length > 0) {
            features.push(`**${analysis.testing.coverageTools.join(', ')}** - Code coverage`);
        }
    }
    
    if (features.length === 0) {
        return '';
    }
    
    return `## ✨ Features\n\n${features.map(f => `- ${f}`).join('\n')}\n`;
}

function generateExamples(analysis: ProjectAnalysis): string {
    const examples: string[] = [];
    
    // Frontend examples
    if (analysis.frontend.framework !== 'Unknown') {
        examples.push('### Frontend Examples');
        
        switch (analysis.frontend.framework) {
            case 'React':
                examples.push('```jsx');
                examples.push('// Example React component');
                examples.push('import React from \'react\';');
                examples.push('');
                examples.push('function App() {');
                examples.push('  return (');
                examples.push('    <div className="App">');
                examples.push('      <h1>Hello World</h1>');
                examples.push('    </div>');
                examples.push('  );');
                examples.push('}');
                examples.push('');
                examples.push('export default App;');
                examples.push('```');
                break;
                
            case 'Vue':
                examples.push('```vue');
                examples.push('<!-- Example Vue component -->');
                examples.push('<template>');
                examples.push('  <div class="app">');
                examples.push('    <h1>{{ message }}</h1>');
                examples.push('  </div>');
                examples.push('</template>');
                examples.push('');
                examples.push('<script>');
                examples.push('export default {');
                examples.push('  data() {');
                examples.push('    return {');
                examples.push('      message: \'Hello World\'');
                examples.push('    };');
                examples.push('  }');
                examples.push('};');
                examples.push('</script>');
                examples.push('```');
                break;
        }
    }
    
    // Backend examples
    if (analysis.backend.framework !== 'Unknown') {
        examples.push('### Backend Examples');
        
        switch (analysis.backend.framework) {
            case 'Express.js':
                examples.push('```javascript');
                examples.push('// Example Express.js route');
                examples.push('const express = require(\'express\');');
                examples.push('const app = express();');
                examples.push('');
                examples.push('app.get(\'/api/hello\', (req, res) => {');
                examples.push('  res.json({ message: \'Hello World\' });');
                examples.push('});');
                examples.push('');
                examples.push('const PORT = process.env.PORT || 3000;');
                examples.push('app.listen(PORT, () => {');
                examples.push('  console.log(`Server running on port ${PORT}`);');
                examples.push('});');
                examples.push('```');
                break;
                
            case 'FastAPI':
                examples.push('```python');
                examples.push('# Example FastAPI endpoint');
                examples.push('from fastapi import FastAPI');
                examples.push('');
                examples.push('app = FastAPI()');
                examples.push('');
                examples.push('@app.get("/api/hello")');
                examples.push('async def hello():');
                examples.push('    return {"message": "Hello World"}');
                examples.push('```');
                break;
        }
    }
    
    if (examples.length === 0) {
        return '';
    }
    
    return `## 📚 Examples\n\n${examples.join('\n\n')}\n`;
}

function generateProjectStructure(analysis: ProjectAnalysis): string {
    let structure = '## 🗂️ Project Structure\n\n';
    
    structure += '```\n';
    structure += `${analysis.projectInfo.name}/\n`;
    
    // Add source directories
    if (analysis.fileStructure.sourceDirectories.length > 0) {
        analysis.fileStructure.sourceDirectories.forEach(dir => {
            structure += `├── ${dir}/\n`;
            structure += `│   ├── ... (source files)\n`;
        });
    }
    
    // Add test directories
    if (analysis.fileStructure.testDirectories.length > 0) {
        analysis.fileStructure.testDirectories.forEach(dir => {
            structure += `├── ${dir}/\n`;
            structure += `│   ├── ... (test files)\n`;
        });
    }
    
    // Add config files
    if (analysis.fileStructure.configFiles.length > 0) {
        const importantConfigs = analysis.fileStructure.configFiles
            .filter(file => !file.includes('node_modules') && !file.includes('dist'))
            .slice(0, 5); // Show only top 5
        
        if (importantConfigs.length > 0) {
            structure += `├── Configuration Files:\n`;
            importantConfigs.forEach(file => {
                structure += `│   ├── ${file}\n`;
            });
        }
    }
    
    // Add build outputs
    if (analysis.fileStructure.buildOutputs.length > 0) {
        analysis.fileStructure.buildOutputs.forEach(output => {
            structure += `├── ${output}/\n`;
            structure += `│   ├── ... (build artifacts)\n`;
        });
    }
    
    // Add key files
    structure += `├── package.json\n`;
    if (analysis.projectInfo.hasTypeScript) {
        structure += `├── tsconfig.json\n`;
    }
    structure += `├── README.md\n`;
    structure += `└── ...\n`;
    structure += '```\n\n';
    
    structure += '**Key Directories:**\n';
    
    const directories: { [key: string]: string } = {};
    
    if (analysis.fileStructure.sourceDirectories.length > 0) {
        directories['Source Code'] = analysis.fileStructure.sourceDirectories.join(', ');
    }
    
    if (analysis.fileStructure.testDirectories.length > 0) {
        directories['Tests'] = analysis.fileStructure.testDirectories.join(', ');
    }
    
    if (analysis.fileStructure.buildOutputs.length > 0) {
        directories['Build Outputs'] = analysis.fileStructure.buildOutputs.join(', ');
    }
    
    Object.entries(directories).forEach(([name, dirs]) => {
        structure += `- **${name}:** ${dirs}\n`;
    });
    
    return structure;
}

function generateTechnologies(analysis: ProjectAnalysis): string {
    let technologies = '## 🛠️ Technologies Used\n\n';
    
    technologies += '### Frontend\n';
    if (analysis.frontend.framework !== 'Unknown') {
        technologies += `- **Framework:** ${analysis.frontend.framework} ${analysis.frontend.version ? `(${analysis.frontend.version})` : ''}\n`;
        if (analysis.frontend.cssFramework) {
            technologies += `- **Styling:** ${analysis.frontend.cssFramework}\n`;
        }
        if (analysis.frontend.uiLibrary) {
            technologies += `- **UI Library:** ${analysis.frontend.uiLibrary}\n`;
        }
        if (analysis.frontend.buildTool) {
            technologies += `- **Build Tool:** ${analysis.frontend.buildTool}\n`;
        }
    } else {
        technologies += '- *No major frontend framework detected*\n';
    }
    
    technologies += '\n### Backend\n';
    if (analysis.backend.framework !== 'Unknown') {
        technologies += `- **Framework:** ${analysis.backend.framework} ${analysis.backend.version ? `(${analysis.backend.version})` : ''}\n`;
        if (analysis.backend.runtime) {
            technologies += `- **Runtime:** ${analysis.backend.runtime}\n`;
        }
        if (analysis.backend.database && analysis.backend.database.length > 0) {
            technologies += `- **Database:** ${analysis.backend.database.join(', ')}\n`;
        }
        if (analysis.backend.orm) {
            technologies += `- **ORM:** ${analysis.backend.orm}\n`;
        }
        if (analysis.backend.server) {
            technologies += `- **Server:** ${analysis.backend.server}\n`;
        }
    } else {
        technologies += '- *No major backend framework detected*\n';
    }
    
    technologies += '\n### Development & Testing\n';
    technologies += `- **Languages:** ${analysis.languages.join(', ')}\n`;
    
    if (analysis.testing.frameworks && analysis.testing.frameworks.length > 0) {
        technologies += `- **Testing:** ${analysis.testing.frameworks.join(', ')}\n`;
        if (analysis.testing.e2eTools && analysis.testing.e2eTools.length > 0) {
            technologies += `- **E2E Testing:** ${analysis.testing.e2eTools.join(', ')}\n`;
        }
        if (analysis.testing.coverageTools && analysis.testing.coverageTools.length > 0) {
            technologies += `- **Coverage:** ${analysis.testing.coverageTools.join(', ')}\n`;
        }
    }

    if (analysis.dependencies.classified.production.length > 0) {
        technologies += '\n### Key Dependencies\n';
        
        // Group dependencies by category
        const categories: { [key: string]: string[] } = {};
        analysis.dependencies.classified.production.forEach(dep => {
            if (!categories[dep.category]) {
                categories[dep.category] = [];
            }
            categories[dep.category].push(dep.name);
        });
        
        // Show top categories
        const topCategories = Object.entries(categories)
            .sort(([, a], [, b]) => b.length - a.length)
            .slice(0, 5);
        
        topCategories.forEach(([category, deps]) => {
            technologies += `- **${category}:** ${deps.slice(0, 3).join(', ')}${deps.length > 3 ? `, ...` : ''}\n`;
        });
    }
    
    return technologies;
}

function generateTestingSection(analysis: ProjectAnalysis): string {
    let testing = '## 🧪 Testing\n\n';
    
    testing += 'This project includes a comprehensive testing setup:\n\n';
    
    if (analysis.testing.frameworks && analysis.testing.frameworks.length > 0) {
        testing += '### Test Frameworks\n';
        testing += analysis.testing.frameworks.map(fw => `- ${fw}`).join('\n') + '\n\n';
    }
    
    if (analysis.testing.assertionLibraries && analysis.testing.assertionLibraries.length > 0) {
        testing += '### Assertion Libraries\n';
        testing += analysis.testing.assertionLibraries.map(lib => `- ${lib}`).join('\n') + '\n\n';
    }
    
    if (analysis.testing.e2eTools && analysis.testing.e2eTools.length > 0) {
        testing += '### E2E Testing\n';
        testing += analysis.testing.e2eTools.map(tool => `- ${tool}`).join('\n') + '\n\n';
    }
    
    // Testing commands
    if (analysis.testStructure.testFilePatterns.length > 0) {
        testing += '### Running Tests\n\n';
        testing += '```bash\n';
        
        if (analysis.dependencies.packageManagers.includes('yarn')) {
            testing += '# Run unit tests\n';
            testing += 'yarn test\n\n';
            testing += '# Run tests in watch mode\n';
            testing += 'yarn test:watch\n\n';
            if (analysis.testing.e2eTools && analysis.testing.e2eTools.includes('Cypress')) {
                testing += '# Run Cypress E2E tests\n';
                testing += 'yarn cypress:open\n';
            }
        } else {
            testing += '# Run unit tests\n';
            testing += 'npm test\n\n';
            testing += '# Run tests in watch mode\n';
            testing += 'npm run test:watch\n\n';
            if (analysis.testing.e2eTools && analysis.testing.e2eTools.includes('Cypress')) {
                testing += '# Run Cypress E2E tests\n';
                testing += 'npm run cypress:open\n';
            }
        }
        
        testing += '```\n';
    }
    
    // Test structure
    if (analysis.testStructure.testDirectory) {
        testing += `\n**Test Directory:** \`${analysis.testStructure.testDirectory}/\`\n`;
        if (analysis.testStructure.testFilePatterns.length > 0) {
            testing += `**Test File Patterns:** ${analysis.testStructure.testFilePatterns.join(', ')}\n`;
        }
    }
    
    return testing;
}

function formatReadme(sections: string[], theme: string): string {
    let readme = sections.join('\n');
    
    // Apply theme-specific formatting
    switch (theme) {
        case 'minimal':
            // Remove excessive markdown formatting for minimal theme
            readme = readme
                .replace(/## 📋 Description/g, '## Description')
                .replace(/## ✨ Features/g, '## Features')
                .replace(/## 🗂️ Project Structure/g, '## Project Structure')
                .replace(/## 🛠️ Technologies Used/g, '## Technologies')
                .replace(/## 🧪 Testing/g, '## Testing')
                .replace(/## 📚 Examples/g, '## Examples')
                .replace(/## 📖 API Reference/g, '## API')
                .replace(/## 🤝 Contributing/g, '## Contributing')
                .replace(/## 📄 License/g, '## License')
                .replace(/## 📞 Contact/g, '## Contact');
            break;
            
        case 'detailed':
            // Add more decorative elements for detailed theme
            readme = readme.replace(/# /g, '# ✨ ');
            break;
    }
    
    // Ensure consistent line endings
    readme = readme.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    
    return readme.trim() + '\n';
}

function generateFooter(analysis: ProjectAnalysis): string {
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    
    return `\n---\n\n*Generated by [Detechtor](https://github.com/yourusername/detechtor) on ${date}*`;
}

// Utility function to generate README for specific frameworks
export function generateFrameworkSpecificReadme(analysis: ProjectAnalysis, framework: string): string {
    const baseOptions: ReadmeOptions = {
        includeBadges: true,
        includeTOC: true,
        includeQuickStart: true,
        includeAPI: true,
        includeExamples: true,
        includeContributing: true,
        includeLicense: true,
        includeContact: true,
        theme: 'default',
    };

    switch (framework.toLowerCase()) {
        case 'react':
            return buildReadme(analysis, {
                ...baseOptions,
                theme: 'detailed',
            });
            
        case 'vue':
            return buildReadme(analysis, {
                ...baseOptions,
                theme: 'minimal',
            });
            
        case 'express':
        case 'nestjs':
            return buildReadme(analysis, {
                ...baseOptions,
                includeExamples: true,
                includeAPI: true,
            });
            
        default:
            return buildReadme(analysis, baseOptions);
    }
}

// Function to estimate README quality score
export function estimateReadmeQuality(analysis: ProjectAnalysis): number {
    let score = 0;
    const maxScore = 100;
    
    // Check for project description
    if (analysis.projectInfo.description) score += 10;
    
    // Check for installation instructions
    if (analysis.dependencies.packageManagers.length > 0 || analysis.backend.runtime) score += 10;
    
    // Check for usage examples
    if (analysis.frontend.framework !== 'Unknown' || analysis.backend.framework !== 'Unknown') score += 10;
    
    // Check for API documentation
    if (analysis.backend.framework !== 'Unknown') score += 10;
    
    // Check for testing information
    if (analysis.testing.frameworks && analysis.testing.frameworks.length > 0) score += 10;
    
    // Check for contributing guidelines
    score += 10; // Always include
    
    // Check for license
    if (analysis.projectInfo.license) score += 10;
    
    // Check for contact information
    if (analysis.projectInfo.author || analysis.projectInfo.repository) score += 10;
    
    // Check for project structure
    if (analysis.fileStructure.sourceDirectories.length > 0) score += 10;
    
    // Check for technologies section
    score += 10; // Always include
    
    return Math.min(score, maxScore);
}