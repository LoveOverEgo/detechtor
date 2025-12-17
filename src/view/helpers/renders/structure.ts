import { ProjectAnalysis } from "../../../analyzers";
import { escapeHtml, truncatePath } from "../converters/strings";


export function renderProjectStructureSection(analysis: ProjectAnalysis): string {
        const structure = analysis.fileStructure;
        
        return `
        <div class="section">
            <div class="section-header">
                <h2>Project Structure <span class="toggle-icon">▼</span></h2>
            </div>
            <div class="section-content">
                <div class="structure-grid">
                    ${structure.sourceDirectories.length > 0 ? `
                        <div class="structure-category">
                            <h3>Source Directories</h3>
                            <div class="directory-list">
                                ${structure.sourceDirectories.map(dir => `
                                    <div class="directory-item">
                                        <span class="directory-icon">📁</span>
                                        <span class="directory-name file-link" data-path="${dir}">
                                            ${escapeHtml(dir)}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${structure.testDirectories.length > 0 ? `
                        <div class="structure-category">
                            <h3>Test Directories</h3>
                            <div class="directory-list">
                                ${structure.testDirectories.map(dir => `
                                    <div class="directory-item">
                                        <span class="directory-icon">🧪</span>
                                        <span class="directory-name file-link" data-path="${dir}">
                                            ${escapeHtml(dir)}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${structure.buildOutputs.length > 0 ? `
                        <div class="structure-category">
                            <h3>Build Outputs</h3>
                            <div class="directory-list">
                                ${structure.buildOutputs.map(dir => `
                                    <div class="directory-item">
                                        <span class="directory-icon">📦</span>
                                        <span class="directory-name file-link" data-path="${dir}">
                                            ${escapeHtml(dir)}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                ${structure.configFiles.length > 0 ? `
                    <div class="config-files">
                        <h3>Configuration Files</h3>
                        <div class="file-grid">
                            ${structure.configFiles.slice(0, 10).map(file => `
                                <div class="file-item">
                                    <span class="file-icon">⚙️</span>
                                    <span class="file-name file-link" data-path="${file}">
                                        ${escapeHtml(file.split('/').pop() || file)}
                                    </span>
                                    <span class="file-path" data-tooltip="${file}">${escapeHtml(truncatePath(file))}</span>
                                </div>
                            `).join('')}
                            ${structure.configFiles.length > 10 ? `
                                <div class="more-files">
                                    + ${structure.configFiles.length - 10} more config files...
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
        `;
    }