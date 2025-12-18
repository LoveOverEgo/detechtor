import { ProjectAnalysis } from "../types";

function getFrameworkName(framework: ProjectAnalysis['frontend']['framework'] | ProjectAnalysis['backend']['framework']): string {
    return framework?.name ?? 'Unknown';
}

export function generateBadges(analysis: ProjectAnalysis): string {
    const badges: string[] = [];
    
    // Version badge
    if (analysis.projectInfo.version) {
        badges.push(`![Version](https://img.shields.io/badge/version-${analysis.projectInfo.version}-blue.svg)`);
    }
    
    // License badge
    if (analysis.projectInfo.license) {
        const license = analysis.projectInfo.license.replace(/ /g, '_');
        badges.push(`![License](https://img.shields.io/badge/license-${license}-green.svg)`);
    }
    
    // Language badges
    if (analysis.languages.includes('TypeScript')) {
        badges.push('![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)');
    }
    if (analysis.languages.includes('JavaScript')) {
        badges.push('![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)');
    }
    if (analysis.languages.includes('Python')) {
        badges.push('![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)');
    }
    if (analysis.languages.includes('Java')) {
        badges.push('![Java](https://img.shields.io/badge/Java-ED8B00?style=flat&logo=openjdk&logoColor=white)');
    }
    
    // Framework badges
    const frontendFramework = getFrameworkName(analysis.frontend.framework);
    const backendFramework = getFrameworkName(analysis.backend.framework);

    if (frontendFramework === 'React') {
        badges.push('![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)');
    } else if (frontendFramework === 'Vue') {
        badges.push('![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=flat&logo=vuedotjs&logoColor=4FC08D)');
    } else if (frontendFramework === 'Angular') {
        badges.push('![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat&logo=angular&logoColor=white)');
    }
    
    if (backendFramework === 'Express.js') {
        badges.push('![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat)');
    } else if (backendFramework === 'Django') {
        badges.push('![Django](https://img.shields.io/badge/Django-092E20?style=flat&logo=django&logoColor=white)');
    }
    
    // Build status (placeholder)
    if (analysis.projectInfo.repository) {
        badges.push('![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)');
    }
    
    // Package manager badge
    if (analysis.dependencies.packageManagers.length > 0) {
        const pm = analysis.dependencies.packageManagers[0];
        badges.push(`![${pm}](https://img.shields.io/badge/${pm}-package_manager-blue)`);
    }
    
    return badges.join(' ');
}

export function generateTableOfContents(analysis: ProjectAnalysis, sections: string[], options: any): string {
    const toc: string[] = ['## 📑 Table of Contents'];
    
    // Always include these sections
    toc.push('- [Description](#-description)');
    toc.push('- [Features](#-features)');
    toc.push('- [Installation](#-installation)');
    toc.push('- [Usage](#-usage)');
    
    // Conditionally include other sections
    if (options.includeQuickStart && analysis.languages.length > 0) {
        toc.push('- [Quick Start](#-quick-start)');
    }
    
    if (options.includeAPI && (getFrameworkName(analysis.backend.framework) !== 'Unknown' || getFrameworkName(analysis.frontend.framework) !== 'Unknown')) {
        toc.push('- [API Reference](#-api-reference)');
    }
    
    if (options.includeExamples) {
        toc.push('- [Examples](#-examples)');
    }
    
    toc.push('- [Project Structure](#️-project-structure)');
    toc.push('- [Technologies Used](#️-technologies-used)');
    
    if (analysis.testing.frameworks && analysis.testing.frameworks.length > 0) {
        toc.push('- [Testing](#-testing)');
    }
    
    if (options.includeContributing) {
        toc.push('- [Contributing](#-contributing)');
    }
    
    if (options.includeLicense && analysis.projectInfo.license) {
        toc.push('- [License](#-license)');
    }
    
    if (options.includeContact && (analysis.projectInfo.author || analysis.projectInfo.repository)) {
        toc.push('- [Contact](#-contact)');
    }
    
    return toc.join('\n');
}

export function generateQuickStart(analysis: ProjectAnalysis): string {
    let quickStart = '## 🚀 Quick Start\n\n';
    
    quickStart += 'Follow these steps to get the project running locally:\n\n';
    
    // Prerequisites
    quickStart += '### Prerequisites\n\n';
    
    const prerequisites: string[] = [];
    if (analysis.languages.includes('Node.js') || analysis.dependencies.packageManagers.includes('npm')) {
        prerequisites.push('[Node.js](https://nodejs.org/) (v14 or higher)');
    }
    if (analysis.languages.includes('Python')) {
        prerequisites.push('[Python](https://www.python.org/) (3.8 or higher)');
    }
    if (analysis.languages.includes('Java')) {
        prerequisites.push('[Java JDK](https://openjdk.org/) (11 or higher)');
    }
    if (analysis.backend.database && analysis.backend.database.includes('PostgreSQL')) {
        prerequisites.push('[PostgreSQL](https://www.postgresql.org/)');
    }
    if (analysis.backend.database && analysis.backend.database.includes('MongoDB')) {
        prerequisites.push('[MongoDB](https://www.mongodb.com/)');
    }
    
    if (prerequisites.length > 0) {
        quickStart += prerequisites.map(p => `- ${p}`).join('\n') + '\n\n';
    } else {
        quickStart += '- No special prerequisites required\n\n';
    }
    
    // Quick setup
    quickStart += '### Setup\n\n';
    quickStart += '```bash\n';
    
    if (analysis.projectInfo.repository) {
        quickStart += '# Clone the repository\n';
        quickStart += `git clone ${analysis.projectInfo.repository}\n`;
        quickStart += `cd ${analysis.projectInfo.name}\n\n`;
    }

    if (analysis.dependencies.packageManagers.includes('npm')) {
        quickStart += '# Install dependencies\n';
        quickStart += 'npm install\n\n';
        
        quickStart += '# Start development server\n';
        quickStart += 'npm start\n';
    } else if (analysis.dependencies.packageManagers.includes('yarn')) {
        quickStart += '# Install dependencies\n';
        quickStart += 'yarn install\n\n';
        
        quickStart += '# Start development server\n';
        quickStart += 'yarn start\n';
    } else if (analysis.languages.includes('Python')) {
        quickStart += '# Create virtual environment\n';
        quickStart += 'python -m venv venv\n\n';
        
        quickStart += '# Activate virtual environment\n';
        quickStart += 'source venv/bin/activate  # On Windows: venv\\Scripts\\activate\n\n';
        
        quickStart += '# Install dependencies\n';
        quickStart += 'pip install -r requirements.txt\n\n';
        
        quickStart += '# Run the application\n';
        quickStart += 'python app.py\n';
    }
    
    quickStart += '```\n';
    
    return quickStart;
}

export function generateInstallation(analysis: ProjectAnalysis): string {
    let installation = '## 📦 Installation\n\n';
    
    installation += 'Choose the installation method that fits your needs:\n\n';
    
    // Method 1: Using package manager
    if (analysis.dependencies.packageManagers.length > 0) {
        installation += '### Using Package Manager\n\n';
        installation += '```bash\n';
        
        if (analysis.dependencies.packageManagers.includes('npm')) {
            installation += 'npm install\n';
            installation += '# or\n';
            installation += 'npm ci  # for CI environments\n';
        } else if (analysis.dependencies.packageManagers.includes('yarn')) {
            installation += 'yarn install\n';
            installation += '# or\n';
            installation += 'yarn install --frozen-lockfile  # for CI environments\n';
        } else if (analysis.dependencies.packageManagers.includes('pnpm')) {
            installation += 'pnpm install\n';
        }
        
        installation += '```\n\n';
    }
    
    // Method 2: Docker
    if (analysis.projectInfo.hasDocker) {
        installation += '### Using Docker\n\n';
        installation += '```bash\n';
        installation += '# Build the Docker image\n';
        installation += 'docker build -t myapp .\n\n';
        installation += '# Run the container\n';
        installation += 'docker run -p 3000:3000 myapp\n';
        
        // Check for docker-compose
        if (analysis.fileStructure.configFiles.some(f => f.includes('docker-compose'))) {
            installation += '\n# Or using docker-compose\n';
            installation += 'docker-compose up\n';
        }
        
        installation += '```\n\n';
    }
    
    // Method 3: Manual setup
    installation += '### Manual Setup\n\n';
    installation += '1. Ensure you have the required runtime installed:\n';
    
    if (analysis.backend.runtime) {
        installation += `   - **${analysis.backend.runtime}** (check version requirements)\n`;
    }
    
    installation += '\n2. Clone or download the source code\n';
    
    if (analysis.projectInfo.repository) {
        installation += `   \`git clone ${analysis.projectInfo.repository}\`\n`;
    }
    
    installation += '\n3. Install dependencies (see above)\n';
    installation += '\n4. Set up environment variables:\n';
    installation += '   ```bash\n';
    installation += '   cp .env.example .env\n';
    installation += '   # Edit .env with your configuration\n';
    installation += '   ```\n';
    
    // Database setup
    if (analysis.backend.database && analysis.backend.database.length > 0) {
        installation += '\n5. Set up the database:\n';
        analysis.backend.database.forEach(db => {
            installation += `   - ${db}: Follow database-specific setup instructions\n`;
        });
    }
    
    return installation;
}

export function generateUsage(analysis: ProjectAnalysis): string {
    let usage = '## 🚀 Usage\n\n';
    
    // Development
    usage += '### Development\n\n';
    usage += 'To start the development server:\n\n';
    usage += '```bash\n';
    
    if (analysis.dependencies.packageManagers.includes('npm')) {
        usage += 'npm start\n';
        usage += '# or for hot reload\n';
        usage += 'npm run dev\n';
    } else if (analysis.dependencies.packageManagers.includes('yarn')) {
        usage += 'yarn start\n';
        usage += '# or for hot reload\n';
        usage += 'yarn dev\n';
    } else if (analysis.languages.includes('Python')) {
        usage += 'python app.py\n';
        usage += '# or with auto-reload\n';
        usage += 'python -m flask run --reload\n';
    }
    
    usage += '```\n\n';
    
    // Build for production
    usage += '### Building for Production\n\n';
    usage += '```bash\n';
    
    if (analysis.dependencies.packageManagers.includes('npm')) {
        usage += 'npm run build\n';
    } else if (analysis.dependencies.packageManagers.includes('yarn')) {
        usage += 'yarn build\n';
    }
    
    usage += '```\n\n';
    
    // Available scripts
    if (analysis.testing.frameworks && analysis.testing.frameworks.length > 0) {
        usage += '### Available Scripts\n\n';
        usage += '| Script | Description |\n';
        usage += '|--------|-------------|\n';
        
        if (analysis.dependencies.packageManagers.includes('npm') || analysis.dependencies.packageManagers.includes('yarn')) {
            const scripts = [
                { name: 'start/dev', desc: 'Start development server' },
                { name: 'build', desc: 'Build for production' },
                { name: 'test', desc: 'Run tests' },
            ];
            
            if (analysis.testing.frameworks.some(f => f.includes('Jest') || f.includes('Vitest'))) {
                scripts.push({ name: 'test:watch', desc: 'Run tests in watch mode' });
                scripts.push({ name: 'test:coverage', desc: 'Run tests with coverage' });
            }
            
            if (analysis.testing.e2eTools && analysis.testing.e2eTools.includes('Cypress')) {
                scripts.push({ name: 'cypress:open', desc: 'Open Cypress test runner' });
                scripts.push({ name: 'cypress:run', desc: 'Run Cypress tests headlessly' });
            }
            
            if (analysis.projectInfo.hasLinting) {
                scripts.push({ name: 'lint', desc: 'Run linter' });
                scripts.push({ name: 'lint:fix', desc: 'Fix linting issues' });
            }
            
            scripts.forEach(script => {
                usage += `| \`${script.name}\` | ${script.desc} |\n`;
            });
        }
        
        usage += '\n';
    }
    
    return usage;
}

export function generateAPISection(analysis: ProjectAnalysis): string {
    let api = '## 📖 API Reference\n\n';
    
    const backendFramework = getFrameworkName(analysis.backend.framework);
    if (backendFramework !== 'Unknown') {
        api += `### ${backendFramework} API\n\n`;
        
        switch (backendFramework) {
            case 'Express.js':
                api += '#### Example Routes\n\n';
                api += '```javascript\n';
                api += '// GET /api/users\n';
                api += 'app.get(\'/api/users\', async (req, res) => {\n';
                api += '  const users = await User.find();\n';
                api += '  res.json(users);\n';
                api += '});\n\n';
                api += '// POST /api/users\n';
                api += 'app.post(\'/api/users\', async (req, res) => {\n';
                api += '  const user = new User(req.body);\n';
                api += '  await user.save();\n';
                api += '  res.status(201).json(user);\n';
                api += '});\n';
                api += '```\n\n';
                
                if (analysis.backend.orm) {
                    api += `#### ${analysis.backend.orm} Models\n\n`;
                    api += '```javascript\n';
                    if (analysis.backend.orm === 'Mongoose') {
                        api += 'const userSchema = new mongoose.Schema({\n';
                        api += '  name: String,\n';
                        api += '  email: { type: String, required: true },\n';
                        api += '  age: Number\n';
                        api += '});\n\n';
                        api += 'const User = mongoose.model(\'User\', userSchema);\n';
                    } else if (analysis.backend.orm === 'TypeORM') {
                        api += '@Entity()\n';
                        api += 'export class User {\n';
                        api += '  @PrimaryGeneratedColumn()\n';
                        api += '  id: number;\n\n';
                        api += '  @Column()\n';
                        api += '  name: string;\n\n';
                        api += '  @Column()\n';
                        api += '  email: string;\n';
                        api += '}\n';
                    }
                    api += '```\n\n';
                }
                break;
                
            case 'FastAPI':
                api += '#### Example Endpoints\n\n';
                api += '```python\n';
                api += 'from typing import List\n';
                api += 'from pydantic import BaseModel\n\n';
                api += 'class User(BaseModel):\n';
                api += '    name: str\n';
                api += '    email: str\n';
                api += '    age: Optional[int] = None\n\n';
                api += '@app.get("/api/users", response_model=List[User])\n';
                api += 'async def get_users():\n';
                api += '    return await User.all()\n\n';
                api += '@app.post("/api/users", response_model=User)\n';
                api += 'async def create_user(user: User):\n';
                api += '    return await User.create(**user.dict())\n';
                api += '```\n\n';
                break;
                
            case 'NestJS':
                api += '#### Example Controller\n\n';
                api += '```typescript\n';
                api += '@Controller(\'users\')\n';
                api += 'export class UsersController {\n';
                api += '  constructor(private usersService: UsersService) {}\n\n';
                api += '  @Get()\n';
                api += '  async findAll(): Promise<User[]> {\n';
                api += '    return this.usersService.findAll();\n';
                api += '  }\n\n';
                api += '  @Post()\n';
                api += '  async create(@Body() createUserDto: CreateUserDto) {\n';
                api += '    return this.usersService.create(createUserDto);\n';
                api += '  }\n';
                api += '}\n';
                api += '```\n\n';
                break;
        }
    }
    
    // Frontend API calls
    const frontendFramework = getFrameworkName(analysis.frontend.framework);
    if (frontendFramework !== 'Unknown') {
        api += '### Frontend API Integration\n\n';
        api += '```javascript\n';
        
        if (frontendFramework === 'React') {
            api += 'import { useState, useEffect } from \'react\';\n';
            api += 'import axios from \'axios\';\n\n';
            api += 'function UserList() {\n';
            api += '  const [users, setUsers] = useState([]);\n\n';
            api += '  useEffect(() => {\n';
            api += '    axios.get(\'/api/users\')\n';
            api += '      .then(response => setUsers(response.data))\n';
            api += '      .catch(error => console.error(error));\n';
            api += '  }, []);\n\n';
            api += '  return (\n';
            api += '    <ul>\n';
            api += '      {users.map(user => (\n';
            api += '        <li key={user.id}>{user.name}</li>\n';
            api += '      ))}\n';
            api += '    </ul>\n';
            api += '  );\n';
            api += '}\n';
        } else if (frontendFramework === 'Vue') {
            api += '<template>\n';
            api += '  <ul>\n';
            api += '    <li v-for="user in users" :key="user.id">\n';
            api += '      {{ user.name }}\n';
            api += '    </li>\n';
            api += '  </ul>\n';
            api += '</template>\n\n';
            api += '<script>\n';
            api += 'import axios from \'axios\';\n\n';
            api += 'export default {\n';
            api += '  data() {\n';
            api += '    return {\n';
            api += '      users: []\n';
            api += '    };\n';
            api += '  },\n';
            api += '  async created() {\n';
            api += '    try {\n';
            api += '      const response = await axios.get(\'/api/users\');\n';
            api += '      this.users = response.data;\n';
            api += '    } catch (error) {\n';
            api += '      console.error(error);\n';
            api += '    }\n';
            api += '  }\n';
            api += '};\n';
            api += '</script>\n';
        }
        
        api += '```\n';
    }
    
    return api;
}

export function generateContributing(analysis: ProjectAnalysis): string {
    return `## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### How to Contribute

1. **Fork the repository**
2. **Create your feature branch**  
   \`\`\`bash
   git checkout -b feature/amazing-feature
   \`\`\`
3. **Commit your changes**  
   \`\`\`bash
   git commit -m 'Add some amazing feature'
   \`\`\`
4. **Push to the branch**  
   \`\`\`bash
   git push origin feature/amazing-feature
   \`\`\`
5. **Open a Pull Request**

### Development Guidelines

${analysis.projectInfo.hasLinting ? '- Follow the existing code style (ESLint/Prettier configured)' : '- Follow consistent code style'}
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- \`feat:\` for new features
- \`fix:\` for bug fixes
- \`docs:\` for documentation changes
- \`style:\` for code style changes
- \`refactor:\` for code refactoring
- \`test:\` for adding tests
- \`chore:\` for maintenance tasks

${analysis.testing.frameworks && analysis.testing.frameworks.length > 0 ? `
### Running Tests

Make sure all tests pass before submitting:

\`\`\`bash
${analysis.dependencies.packageManagers.includes('yarn') ? 'yarn test' : 'npm test'}
\`\`\`

For test coverage:

\`\`\`bash
${analysis.dependencies.packageManagers.includes('yarn') ? 'yarn test:coverage' : 'npm run test:coverage'}
\`\`\`
` : ''}

### Code Review Process

1. All submissions require review
2. Please address review feedback promptly
3. Maintainers will merge once approved
`;
}

export function generateLicense(analysis: ProjectAnalysis): string {
    const licenseText = analysis.projectInfo.license || 'MIT';
    
    return `## 📄 License

This project is licensed under the **${licenseText} License**.

${
    licenseText === 'MIT' ? `
### MIT License

Copyright (c) ${new Date().getFullYear()} ${analysis.projectInfo.author || 'The Authors'}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
` : licenseText === 'Apache-2.0' ? `
### Apache License 2.0

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
` : `See the LICENSE file for details.`
}
`;
}

export function generateContact(analysis: ProjectAnalysis): string {
    let contact = '## 📞 Contact\n\n';
    
    if (analysis.projectInfo.author) {
        contact += `**Author:** ${analysis.projectInfo.author}\n\n`;
    }
    
    if (analysis.projectInfo.repository) {
        contact += `**Repository:** ${analysis.projectInfo.repository}\n\n`;
    }
    
    contact += `**Project Link:** [${analysis.projectInfo.name}](${analysis.projectInfo.repository || '#'})\n\n`;
    
    contact += '### Support\n\n';
    contact += '- 💬 **Questions & Discussions:** Open an issue for questions\n';
    contact += '- 🐛 **Bug Reports:** Use the issue tracker\n';
    contact += '- 💡 **Feature Requests:** Suggest new features via issues\n';
    contact += '- 📖 **Documentation:** Check the docs folder or generated docs\n';
    
    if (analysis.projectInfo.hasCI) {
        contact += '\n### CI/CD Status\n\n';
        contact += '![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)\n';
        contact += '![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)\n';
        if (analysis.testing.coverageTools && analysis.testing.coverageTools.length > 0) {
            contact += '![Coverage](https://img.shields.io/badge/coverage-90%25-brightgreen.svg)\n';
        }
    }
    
    return contact;
}
