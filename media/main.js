const vscode = acquireVsCodeApi();

// Handle generate README button
document.querySelectorAll('.generate-readme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        vscode.postMessage({
            command: 'generateReadme'
        });
    });
});

// Handle refresh button
document.querySelectorAll('.refresh-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        vscode.postMessage({
            command: 'refreshAnalysis'
        });
    });
});

// Handle project selector
document.querySelectorAll('.project-select').forEach(select => {
    select.addEventListener('change', (e) => {
        const projectId = e.target.value;
        if (projectId) {
            vscode.postMessage({
                command: 'selectProject',
                projectId: projectId
            });
        }
    });
});

// Handle workspace summary quick selects
document.querySelectorAll('.workspace-summary__select').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const projectId = e.currentTarget.getAttribute('data-project-id');
        if (projectId) {
            vscode.postMessage({
                command: 'selectProject',
                projectId: projectId
            });
        }
    });
});

// Workspace summary filters (persisted)
const savedState = vscode.getState() || {};
const workspaceFilters = {
    frontend: true,
    backend: true,
    framework: '',
    ...(savedState.workspaceFilters || {})
};

const saveWorkspaceFilters = () => {
    vscode.setState({
        ...savedState,
        workspaceFilters: { ...workspaceFilters }
    });
};

const updateWorkspaceFilters = () => {
    const items = document.querySelectorAll('.workspace-summary__item');
    const query = workspaceFilters.framework.trim().toLowerCase();
    const status = document.querySelector('.workspace-filter-status');
    const groupCounts = {
        frontend: 0,
        backend: 0,
        selected: 0
    };
    let visibleCount = 0;

    items.forEach(item => {
        const kind = item.getAttribute('data-kind');
        const frameworks = item.getAttribute('data-frameworks') || '';
        const matchKind = (kind === 'frontend' && workspaceFilters.frontend) ||
            (kind === 'backend' && workspaceFilters.backend);
        const matchFramework = !query || frameworks.includes(query);

        const isVisible = matchKind && matchFramework;
        item.style.display = isVisible ? '' : 'none';
        if (isVisible) {
            visibleCount += 1;
            if (kind && Object.prototype.hasOwnProperty.call(groupCounts, kind)) {
                groupCounts[kind] += 1;
            }
        }
    });

    if (status) {
        const tokens = [];
        if (!workspaceFilters.frontend) tokens.push('no frontend');
        if (!workspaceFilters.backend) tokens.push('no backend');
        if (query) tokens.push(`framework: ${query}`);
        const label = tokens.length ? `Filters: ${tokens.join(', ')}` : 'Filters: none';
        status.textContent = `${label} (${visibleCount})`;
    }

    document.querySelectorAll('.workspace-group-count').forEach(el => {
        const kind = el.getAttribute('data-kind');
        if (!kind) {
            return;
        }
        if (kind === 'selected') {
            return;
        }
        if (Object.prototype.hasOwnProperty.call(groupCounts, kind)) {
            const totalAttr = el.getAttribute('data-total');
            const total = totalAttr ? Number(totalAttr) : groupCounts[kind];
            el.textContent = `(${groupCounts[kind]}/${total})`;
        }
    });

    const selectedItems = document.querySelectorAll('.workspace-summary__selected .workspace-summary__item');
    let selectedVisible = 0;
    selectedItems.forEach(item => {
        if (item.style.display !== 'none') {
            selectedVisible += 1;
        }
    });
    groupCounts.selected = selectedVisible;
    const selectedTotal = selectedItems.length;
    document.querySelectorAll('.workspace-summary__selected .workspace-group-count').forEach(el => {
        el.textContent = `(${groupCounts.selected}/${selectedTotal})`;
    });
};

document.querySelectorAll('.workspace-filter-kind').forEach(input => {
    const kind = input.getAttribute('data-kind');
    if (kind && Object.prototype.hasOwnProperty.call(workspaceFilters, kind)) {
        input.checked = workspaceFilters[kind];
    }
    input.addEventListener('change', (e) => {
        const kind = e.currentTarget.getAttribute('data-kind');
        if (kind) {
            workspaceFilters[kind] = e.currentTarget.checked;
            saveWorkspaceFilters();
            updateWorkspaceFilters();
        }
    });
});

const frameworkFilterInput = document.querySelector('.workspace-filter-framework');
if (frameworkFilterInput) {
    frameworkFilterInput.value = workspaceFilters.framework || '';
    frameworkFilterInput.addEventListener('input', (e) => {
        workspaceFilters.framework = e.currentTarget.value || '';
        saveWorkspaceFilters();
        updateWorkspaceFilters();
    });
}

const resetButton = document.querySelector('.workspace-filter-reset');
if (resetButton) {
    resetButton.addEventListener('click', () => {
        workspaceFilters.frontend = true;
        workspaceFilters.backend = true;
        workspaceFilters.framework = '';
        document.querySelectorAll('.workspace-filter-kind').forEach(input => {
            input.checked = true;
        });
        if (frameworkFilterInput) {
            frameworkFilterInput.value = '';
        }
        saveWorkspaceFilters();
        updateWorkspaceFilters();
    });
}

updateWorkspaceFilters();

// Handle copy buttons
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const text = e.target.getAttribute('data-text');
        if (text) {
            vscode.postMessage({
                command: 'copyToClipboard',
                text: text
            });
        }
    });
});

// Handle file links
document.querySelectorAll('.file-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const filePath = e.target.getAttribute('data-path');
        if (filePath) {
            vscode.postMessage({
                command: 'openFile',
                path: filePath
            });
        }
    });
});

// Handle expand/collapse sections
document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', (e) => {
        const section = e.target.closest('.section');
        const content = section.querySelector('.section-content');
        const toggleIcon = section.querySelector('.toggle-icon');

        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggleIcon.textContent = '▼';
            section.classList.remove('collapsed');
        } else {
            content.style.display = 'none';
            toggleIcon.textContent = '▶';
            section.classList.add('collapsed');
        }
    });
});

// Initialize tooltips
document.querySelectorAll('[data-tooltip]').forEach(element => {
    element.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = e.target.getAttribute('data-tooltip');
        document.body.appendChild(tooltip);

        const rect = e.target.getBoundingClientRect();
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
        tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';

        e.target.tooltipElement = tooltip;
    });

    element.addEventListener('mouseleave', (e) => {
        if (e.target.tooltipElement) {
            e.target.tooltipElement.remove();
            delete e.target.tooltipElement;
        }
    });
});

// Handle search functionality
const searchInput = document.querySelector('.search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const sections = document.querySelectorAll('.section-content');

        sections.forEach(section => {
            const text = section.textContent.toLowerCase();
            const parentSection = section.closest('.section');

            if (text.includes(searchTerm)) {
                parentSection.style.display = 'block';
                // Highlight matches
                highlightMatches(section, searchTerm);
            } else {
                parentSection.style.display = 'none';
            }
        });
    });
}

function highlightMatches(element, searchTerm) {
    if (!searchTerm) return;

    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
    );

    const nodes = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.textContent.toLowerCase().includes(searchTerm)) {
            nodes.push(node);
        }
    }

    nodes.forEach(node => {
        const span = document.createElement('span');
        span.className = 'highlight';
        span.textContent = node.textContent;
        node.parentNode.replaceChild(span, node);
    });
}

// Virtualized dependency list rendering
const ROW_HEIGHT = 32;
const OVERSCAN = 5;

document.querySelectorAll('.dependency-list.virtualized').forEach(initVirtualizedDeps);

function initVirtualizedDeps(container) {
    const raw = container.getAttribute('data-deps');
    if (!raw) return;

    const deps = JSON.parse(raw);
    const spacer = container.querySelector('.dep-spacer');
    const viewport = container.querySelector('.dep-viewport');

    spacer.style.height = `${deps.length * ROW_HEIGHT}px`;

    const visibleCount =
        Math.ceil(container.clientHeight / ROW_HEIGHT) + OVERSCAN;

    function render() {
        const scrollTop = container.scrollTop;
        const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
        const end = Math.min(deps.length, start + visibleCount);

        viewport.style.transform = `translateY(${start * ROW_HEIGHT}px)`;

        viewport.innerHTML = deps
            .slice(start, end)
            .map(renderDependencyRow)
            .join('');

        wireDepEvents(viewport);
    }

    container.addEventListener('scroll', render);
    render();
}

function renderDependencyRow(dep) {
    return `
        <div class="dependency-item">
            <span class="dependency-name" data-tooltip="${dep.name}@${dep.version}">
                ${escapeHtml(dep.name)}
            </span>
            <span class="dependency-version">
                ${escapeHtml(dep.version)}
            </span>
            ${
                dep.category
                    ? `<span class="dependency-category-tag">
                        ${escapeHtml(dep.category)}
                        </span>`
                    : ''
            }
        </div>
    `;
}

function wireDepEvents(root) {
    root.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mouseenter', showTooltip);
        el.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = e.target.getAttribute('data-tooltip');
    document.body.appendChild(tooltip);

    const rect = e.target.getBoundingClientRect();
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
    tooltip.style.left = `${rect.left}px`;

    e.target._tooltip = tooltip;
}

function hideTooltip(e) {
    if (e.target._tooltip) {
        e.target._tooltip.remove();
        delete e.target._tooltip;
    }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
