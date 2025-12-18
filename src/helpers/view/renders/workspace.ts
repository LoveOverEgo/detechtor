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
    const options = workspace.roots.map(root => {
        const isSelected = root.id === selectedProjectId ? 'selected' : '';
        const hints = root.typeHints.length ? ` (${root.typeHints.join(', ')})` : '';
        return `<option value="${escapeHtml(root.id)}" ${isSelected}>${escapeHtml(root.name)}${escapeHtml(hints)}</option>`;
    }).join('');

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
    </section>
    `;
}
