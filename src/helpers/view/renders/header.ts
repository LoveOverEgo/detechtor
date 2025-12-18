import { ProjectAnalysis } from "../../../types";
import { escapeHtml } from "../converters/strings";

export function renderHeader(analysis: ProjectAnalysis): string {
    const projectName = analysis?.projectInfo.name || 'Untitled Project';
    const lastModified = analysis?.timestamps.projectLastModified 
        ? new Date(analysis.timestamps.projectLastModified).toLocaleDateString()
        : 'Unknown';
    
    return `
    <header class="header">
        <div class="header-content">
            <h1>${escapeHtml(projectName)}</h1>
            <div class="header-subtitle">
                <span class="last-analyzed">Last analyzed: ${new Date().toLocaleString()}</span>
                <span class="project-modified">Project modified: ${lastModified}</span>
            </div>
            <div class="search-box">
                <input type="text" class="search-input" placeholder="Search in analysis...">
                <button class="refresh-btn" title="Refresh analysis">🔄</button>
            </div>
        </div>
    </header>
    `;
}