import { ProjectAnalysis } from "../../../types";
import { escapeHtml, truncatePath } from "../converters/strings";

export function getAnalysisText(analysis: ProjectAnalysis): string {
    const lines: string[] = [];
    
    lines.push(`Project: ${analysis.projectInfo.name}`);
    lines.push(`Analysis Date: ${new Date().toLocaleString()}`);
    lines.push('');
    
    lines.push('=== LANGUAGES ===');
    lines.push(analysis.languages.join(', ') || '');
    lines.push('');
    
    lines.push('=== FRONTEND ===');
    lines.push(`Framework: ${analysis.frontend.framework}`);
    if (analysis.frontend.version) lines.push(`Version: ${analysis.frontend.version}`);
    if (analysis.frontend.buildTool) lines.push(`Build Tool: ${analysis.frontend.buildTool}`);
    if (analysis.frontend.cssFramework) lines.push(`CSS: ${analysis.frontend.cssFramework}`);
    lines.push('');
    
    lines.push('=== BACKEND ===');
    lines.push(`Framework: ${analysis.backend.framework}`);
    if (analysis.backend.runtime) lines.push(`Runtime: ${analysis.backend.runtime}`);
    if (analysis.backend.database && analysis.backend.database.length > 0) lines.push(`Database: ${analysis.backend.database.join(', ')}`);
    if (analysis.backend.orm) lines.push(`ORM: ${analysis.backend.orm}`);
    lines.push('');
    
    lines.push('=== TESTING ===');
    lines.push(`Frameworks: ${analysis.testing.frameworks ? analysis.testing.frameworks.join(', ') : ''}`);
    lines.push(`E2E Tools: ${analysis.testing.e2eTools ? analysis.testing.e2eTools.join(', ') : ''}`);
    lines.push(`Assertion: ${analysis.testing.assertionLibraries ? analysis.testing.assertionLibraries.join(', ') : ''}`);
    lines.push('');
    
    lines.push('=== DEPENDENCIES ===');
    lines.push(`Production: ${analysis.dependencies.classified.production.length}`);
    lines.push(`Development: ${analysis.dependencies.classified.development.length}`);
    lines.push('');
    
    lines.push('=== STRUCTURE ===');
    lines.push(`Source: ${analysis.fileStructure.sourceDirectories.join(', ')}`);
    lines.push(`Tests: ${analysis.fileStructure.testDirectories.join(', ')}`);
    lines.push(`Config Files: ${analysis.fileStructure.configFiles.length}`);

    return lines.join('\n');
}

export function renderActionsSection(analysis: ProjectAnalysis): string {
        return `
        <div class="section">
            <div class="section-header">
                <h2>Actions <span class="toggle-icon">▼</span></h2>
            </div>
            <div class="section-content">
                <div class="action-grid">
                    <div class="action-btn generate-readme-btn">
                        <div class="action-icon">📄</div>
                        <div class="action-text">
                            <div class="action-title">Generate README</div>
                            <div class="action-description">Create comprehensive documentation</div>
                        </div>
                    </div>
                    
                    <div class="action-btn refresh-btn">
                        <div class="action-icon">🔄</div>
                        <div class="action-text">
                            <div class="action-title">Refresh Analysis</div>
                            <div class="action-description">Update with latest changes</div>
                        </div>
                    </div>
                    
                    <div class="action-btn copy-analysis-btn copy-btn" data-text="${getAnalysisText(analysis)}">
                        <div class="action-icon">📋</div>
                        <div class="action-text">
                            <div class="action-title">Copy Analysis</div>
                            <div class="action-description">Copy as plain text</div>
                        </div>
                    </div>
                </div>
                
                <div class="project-info">
                    <h3>Project Information</h3>
                    <div class="info-grid">
                        ${analysis.projectInfo.version ? `
                            <div class="info-item">
                                <span class="info-label">Version:</span>
                                <span class="info-value">${analysis.projectInfo.version}</span>
                            </div>
                        ` : ''}
                        
                        ${analysis.projectInfo.license ? `
                            <div class="info-item">
                                <span class="info-label">License:</span>
                                <span class="info-value">${analysis.projectInfo.license}</span>
                            </div>
                        ` : ''}
                        
                        ${analysis.projectInfo.author ? `
                            <div class="info-item">
                                <span class="info-label">Author:</span>
                                <span class="info-value">${escapeHtml(analysis.projectInfo.author)}</span>
                            </div>
                        ` : ''}
                        
                        ${analysis.projectInfo.repository ? `
                            <div class="info-item">
                                <span class="info-label">Repository:</span>
                                <span class="info-value">
                                    <a href="${analysis.projectInfo.repository}" target="_blank">
                                        ${escapeHtml(truncatePath(analysis.projectInfo.repository))}
                                    </a>
                                </span>
                            </div>
                        ` : ''}
                        
                        <div class="info-item">
                            <span class="info-label">Has TypeScript:</span>
                            <span class="info-value ${analysis.projectInfo.hasTypeScript ? 'yes' : 'no'}">
                                ${analysis.projectInfo.hasTypeScript ? 'Yes' : 'No'}
                            </span>
                        </div>
                        
                        <div class="info-item">
                            <span class="info-label">Has Tests:</span>
                            <span class="info-value ${analysis.projectInfo.hasTests ? 'yes' : 'no'}">
                                ${analysis.projectInfo.hasTests ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }