import { ProjectAnalysis } from "../../../types";
import { escapeHtml } from "../converters/strings";

export function renderFrameworksSection(analysis: ProjectAnalysis): string {
        const frontend = analysis.frontend;
        const backend = analysis.backend;
        const hasFrontend = frontend.framework?.name !== 'Unknown';
        const hasBackend = backend.framework?.name !== 'Unknown';
        const frontendFrameworks = (frontend.frameworks && frontend.frameworks.length > 0)
            ? frontend.frameworks
            : (hasFrontend ? [frontend.framework] : []);
        const backendFrameworks = (backend.frameworks && backend.frameworks.length > 0)
            ? backend.frameworks
            : (hasBackend ? [backend.framework] : []);

        if (!hasFrontend && !hasBackend) {
            return `
            <div class="section">
                <div class="section-header">
                    <h2>Frameworks <span class="toggle-icon">▼</span></h2>
                </div>
                <div class="section-content">
                    <div class="empty-state">
                        <p>No major frameworks detected.</p>
                    </div>
                </div>
            </div>
            `;
        }

        return `
        <div class="section">
            <div class="section-header">
                <h2>Frameworks <span class="toggle-icon">▼</span></h2>
            </div>
            <div class="section-content">
                <div class="framework-grid">
                    ${hasFrontend ? `
                        <div class="framework-card">
                            <div class="framework-header">
                                <h3>Frontend</h3>
                                <span class="badge badge-frontend">Web</span>
                            </div>
                            <div class="framework-details">
                                <div class="framework-name">${escapeHtml(frontend.framework.name)}</div>
                                ${frontend.framework.version ? `<div class="framework-version">v${escapeHtml(frontend.framework.version)}</div>` : ''}
                                ${frontendFrameworks.length > 1 ? `
                                    <div class="framework-feature">
                                        <span class="feature-label">Also:</span>
                                        <span class="feature-value">${frontendFrameworks.slice(1).map(framework =>
                                            escapeHtml(framework.name)
                                        ).join(', ')}</span>
                                    </div>
                                ` : ''}
                                
                                ${frontend.buildTool ? `
                                    <div class="framework-feature">
                                        <span class="feature-label">Build Tool:</span>
                                        <span class="feature-value">${escapeHtml(frontend.buildTool)}</span>
                                    </div>
                                ` : ''}
                                
                                ${frontend.cssFramework ? `
                                    <div class="framework-feature">
                                        <span class="feature-label">CSS Framework:</span>
                                        <span class="feature-value">${escapeHtml(frontend.cssFramework)}</span>
                                    </div>
                                ` : ''}
                                
                                ${analysis.dependencies.packageManagers ? `
                                    <div class="framework-feature">
                                        <span class="feature-label">Package Manager:</span>
                                        <span class="feature-value">${escapeHtml(analysis.dependencies.packageManagers[0])}</span>
                                    </div>
                                ` : ''}
                                
                                <div class="framework-features">
                                    ${frontend.hasRouter ? '<span class="feature-tag">Routing</span>' : ''}
                                    ${frontend.hasStateManagement ? '<span class="feature-tag">State Management</span>' : ''}
                                    ${frontend.metaFrameworks && frontend.metaFrameworks.length > 0 ? frontend.metaFrameworks.map(mf => 
                                        `<span class="feature-tag">${escapeHtml(mf)}</span>`
                                    ).join('') : ''}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${hasBackend ? `
                        <div class="framework-card">
                            <div class="framework-header">
                                <h3>Backend</h3>
                                <span class="badge badge-backend">Server</span>
                            </div>
                            <div class="framework-details">
                                <div class="framework-name">${escapeHtml(backend.framework.name)}</div>
                                ${backend.framework.version ? `<div class="framework-version">v${escapeHtml(backend.framework.version)}</div>` : ''}
                                ${backendFrameworks.length > 1 ? `
                                    <div class="framework-feature">
                                        <span class="feature-label">Also:</span>
                                        <span class="feature-value">${backendFrameworks.slice(1).map(framework =>
                                            escapeHtml(framework.name)
                                        ).join(', ')}</span>
                                    </div>
                                ` : ''}
                                
                                ${backend.runtime ? `
                                    <div class="framework-feature">
                                        <span class="feature-label">Runtime:</span>
                                        <span class="feature-value">${escapeHtml(backend.runtime)}</span>
                                    </div>
                                ` : ''}
                                
                                ${backend.runtimes && backend.runtimes.length > 1 ? `
                                    <div class="framework-feature">
                                        <span class="feature-label">Also:</span>
                                        <span class="feature-value">${backend.runtimes.slice(1).map(runtime =>
                                            escapeHtml(runtime)
                                        ).join(', ')}</span>
                                    </div>
                                ` : ''}
                                
                                ${backend.server ? `
                                    <div class="framework-feature">
                                        <span class="feature-label">Server:</span>
                                        <span class="feature-value">${escapeHtml(backend.server)}</span>
                                    </div>
                                ` : ''}
                                
                                ${backend.database && backend.database.length > 0 ? `
                                    <div class="framework-feature">
                                        <span class="feature-label">Database:</span>
                                        <span class="feature-value">${escapeHtml(backend.database.join(', '))}</span>
                                    </div>
                                ` : ''}
                                
                                ${backend.orm ? `
                                    <div class="framework-feature">
                                        <span class="feature-label">ORM:</span>
                                        <span class="feature-value">${escapeHtml(backend.orm)}</span>
                                    </div>
                                ` : ''}
                                
                                <div class="framework-features">
                                    ${backend.authentication && backend.authentication.length > 0 ? 
                                        backend.authentication.map(auth => 
                                            `<span class="feature-tag">${escapeHtml(auth)}</span>`
                                        ).join('') : ''}
                                    ${backend.caching && backend.caching.length > 0 ? 
                                        backend.caching.map(cache => 
                                            `<span class="feature-tag">${escapeHtml(cache)}</span>`
                                        ).join('') : ''}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
        `;
    }
