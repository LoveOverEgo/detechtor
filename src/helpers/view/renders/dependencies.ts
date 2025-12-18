import { ProjectAnalysis } from "../../../types";
import { escapeHtml } from "../converters/strings";

export function renderDependenciesSection(analysis: ProjectAnalysis): string {
        const dependencies = analysis.dependencies;
        const allDeps = dependencies.classified.all;
        
        if (allDeps.length === 0) {
            return `
            <div class="section">
                <div class="section-header">
                    <h2>Dependencies <span class="toggle-icon">▼</span></h2>
                </div>
                <div class="section-content">
                    <div class="empty-state">
                        <p>No dependencies detected.</p>
                    </div>
                </div>
            </div>
            `;
        }

        // Group dependencies by category
        const categories: { [key: string]: any[] } = {};
        allDeps.forEach(dep => {
            if (!categories[dep.category]) {
                categories[dep.category] = [];
            }
            categories[dep.category].push(dep);
        });

        // Sort categories by number of dependencies
        const sortedCategories = Object.entries(categories)
            .sort(([, a], [, b]) => b.length - a.length);

        return `
        <div class="section">
            <div class="section-header">
                <h2>Dependencies <span class="badge">${allDeps.length} total</span> <span class="toggle-icon">▼</span></h2>
            </div>
            <div class="section-content">
                <div class="dependency-stats">
                    <div class="stat-item">
                        <span class="stat-label">Production:</span>
                        <span class="stat-value">${dependencies.classified.production.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Development:</span>
                        <span class="stat-value">${dependencies.classified.development.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Peer:</span>
                        <span class="stat-value">${dependencies.classified.peer.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Optional:</span>
                        <span class="stat-value">${dependencies.classified.optional.length}</span>
                    </div>
                </div>
                
                <div class="dependency-categories">
                    ${sortedCategories.map(([category, deps]) => `
                        <div class="category-card">
                            <div class="category-header">
                                <h4>${escapeHtml(category)}</h4>
                                <span class="category-count">${deps.length}</span>
                            </div>
                            <div class="dependency-list virtualized" data-deps='${escapeHtml(JSON.stringify(deps))}'>
                                <div class="dep-spacer"></div>
                                <div class="dep-viewport"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="action-buttons">
                    <button class="btn copy-btn" data-text="${allDeps.map(d => `${d.name}@${d.version}`).join('\n')}">
                        Copy All Dependencies
                    </button>
                </div>
            </div>
        </div>
        `;
    }