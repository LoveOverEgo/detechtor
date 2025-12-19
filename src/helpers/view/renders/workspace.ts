import { WorkspaceAnalysis } from "../../../types";
import { escapeHtml } from "../converters/strings";

export function renderWorkspaceSummary(
    workspace: WorkspaceAnalysis | undefined,
    selectedProjectId?: string
): string {
    if (!workspace || workspace.projects.length <= 1) {
        return '';
    }

    const projectCount = workspace.summary.projectCount;
    const frontendList = workspace.summary.frontendComponents ?? [];
    const backendList = workspace.summary.backendComponents ?? [];
    const selectedComponents = [...frontendList, ...backendList].filter(item => item.projectId === selectedProjectId);
    const options = workspace.roots.map(root => {
        const isSelected = root.id === selectedProjectId ? 'selected' : '';
        const hints = root.typeHints.length ? ` (${root.typeHints.join(', ')})` : '';
        return `<option value="${escapeHtml(root.id)}" ${isSelected}>${escapeHtml(root.name)}${escapeHtml(hints)}</option>`;
    }).join('');

    const renderComponentList = (items: typeof frontendList) => {
        if (items.length === 0) {
            return '<div class="workspace-summary__empty">None detected</div>';
        }
        return `
            <ul class="workspace-summary__list">
                ${items.map(item => `
                    <li class="workspace-summary__item ${item.projectId === selectedProjectId ? 'is-selected' : ''}"
                        data-kind="${escapeHtml(item.kind)}"
                        data-frameworks="${escapeHtml((item.frameworks ?? []).join(',').toLowerCase())}">
                        <span class="workspace-summary__badge">${escapeHtml(item.name)}</span>
                        ${item.frameworks && item.frameworks.length > 0 ? `
                            <div class="workspace-summary__frameworks">
                                ${item.frameworks.map(framework => `
                                    <span class="workspace-summary__framework-tag">${escapeHtml(framework)}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                        <button class="workspace-summary__select" data-project-id="${escapeHtml(item.projectId)}">
                            ${escapeHtml(item.rootPath)}
                        </button>
                    </li>
                `).join('')}
            </ul>
        `;
    };

    return `
    <section class="workspace-summary">
        <div class="workspace-summary__header">
            <div class="workspace-summary__title">Workspace Projects</div>
            <div class="workspace-summary__meta">${projectCount} project${projectCount !== 1 ? 's' : ''}</div>
        </div>
        <div class="workspace-summary__controls">
            <label class="workspace-summary__label" for="projectSelect">Active project</label>
            <select id="projectSelect" class="project-select">
                ${options}
            </select>
        </div>
        ${frontendList.length === 0 && backendList.length === 0 ? `
            <div class="workspace-summary__empty-state">
                No frontend or backend components detected in this workspace.
            </div>
        ` : `
        <div class="workspace-summary__filters">
            <label class="workspace-summary__filter">
                <input type="checkbox" class="workspace-filter-kind" data-kind="frontend" checked>
                Frontend
            </label>
            <label class="workspace-summary__filter">
                <input type="checkbox" class="workspace-filter-kind" data-kind="backend" checked>
                Backend
            </label>
            <input type="text" class="workspace-filter-framework" placeholder="Filter by framework">
            <button type="button" class="workspace-filter-reset">Reset</button>
            <span class="workspace-filter-status">Filters: none</span>
        </div>
        ${selectedComponents.length > 0 ? `
            <div class="workspace-summary__group workspace-summary__selected">
                <div class="workspace-summary__group-title">Selected Project <span class="workspace-group-count" data-kind="selected">(${selectedComponents.length})</span></div>
                ${renderComponentList(selectedComponents)}
            </div>
        ` : ''}
        <div class="workspace-summary__groups">
            <div class="workspace-summary__group">
                <div class="workspace-summary__group-title">Frontends (${frontendList.length}) <span class="workspace-group-count" data-kind="frontend" data-total="${frontendList.length}">(0/${frontendList.length})</span></div>
                ${renderComponentList(frontendList)}
            </div>
            <div class="workspace-summary__group">
                <div class="workspace-summary__group-title">Backends (${backendList.length}) <span class="workspace-group-count" data-kind="backend" data-total="${backendList.length}">(0/${backendList.length})</span></div>
                ${renderComponentList(backendList)}
            </div>
        </div>
        `}
    </section>
    `;
}
