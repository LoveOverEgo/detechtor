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