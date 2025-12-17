import { ProjectAnalysis } from "../../../analyzers";
import { escapeHtml } from "../converters/strings";

export function renderSummaryCards(analysis: ProjectAnalysis): string {
    const frameworks = analysis?.testing.frameworks ?? [];
    const e2eTools = analysis?.testing.e2eTools ?? [];
    const cards = [
        {
            title: 'Languages',
            value: analysis?.languages.length || 0,
            icon: '💻',
            color: '#4CAF50',
            description: analysis?.languages.join(', ') || 'None detected'
        },
        {
            title: 'Dependencies',
            value: analysis!.dependencies.production.length + analysis!.dependencies.development.length,
            icon: '📦',
            color: '#2196F3',
            description: `${analysis!.dependencies.production.length} production, ${analysis!.dependencies.development.length} dev`
        },
        {
            title: 'Testing Tools',
            value: frameworks.length + e2eTools.length,
            icon: '🧪',
            color: '#FF9800',
            description: `${frameworks.length} frameworks, ${e2eTools.length} E2E tools`
        },
        {
            title: 'Files Analyzed',
            value: analysis!.fileStructure.configFiles.length + 
                   analysis!.fileStructure.sourceDirectories.length,
            icon: '📄',
            color: '#9C27B0',
            description: 'Configuration and source files'
        }
    ];
    
    return `
        <div class="summary-cards">
            ${cards.map(card => `
                <div class="card" style="border-left-color: ${card.color}">
                    <div class="card-icon" style="background-color: ${card.color}20; color: ${card.color}">
                        ${card.icon}
                    </div>
                    <div class="card-content">
                        <div class="card-title">${card.title}</div>
                        <div class="card-value">${card.value}</div>
                        <div class="card-description">${escapeHtml(card.description)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}