import { ProjectAnalysis } from "../../../types";
import { escapeHtml } from "../converters/strings";

export function renderLanguagesSection(analysis: ProjectAnalysis): string {
        const languages = analysis.languages;
        
        if (languages.length === 0) {
            return `
            <div class="section">
                <div class="section-header">
                    <h2>Languages <span class="toggle-icon">▼</span></h2>
                </div>
                <div class="section-content">
                    <div class="empty-state">
                        <p>No programming languages detected.</p>
                    </div>
                </div>
            </div>
            `;
        }

        const languageIcons: { [key: string]: string } = {
            'JavaScript': '⚡',
            'TypeScript': '📘',
            'Python': '🐍',
            'Java': '☕',
            'Go': '🐹',
            'Rust': '🦀',
            'C++': '⚙️',
            'C#': '🎯',
            'PHP': '🐘',
            'Ruby': '💎',
            'Swift': '🐦',
            'Kotlin': '🅱️',
            'HTML': '🌐',
            'CSS': '🎨',
            'SCSS': '🎨',
            'SASS': '🎨',
            'SQL': '🗄️',
            'Shell': '🐚'
        };

        return `
        <div class="section">
            <div class="section-header">
                <h2>Languages <span class="toggle-icon">▼</span></h2>
            </div>
            <div class="section-content">
                <div class="language-grid">
                    ${languages.map(lang => `
                        <div class="language-item">
                            <div class="language-icon">${languageIcons[lang] || '📝'}</div>
                            <div class="language-name">${escapeHtml(lang)}</div>
                            ${analysis.projectInfo.hasTypeScript && lang === 'TypeScript' ? 
                                '<span class="badge badge-info">Primary</span>' : ''}
                        </div>
                    `).join('')}
                </div>
                ${analysis.projectInfo.hasTypeScript ? `
                    <div class="info-box">
                        <strong>TypeScript detected!</strong> This project uses TypeScript for type safety.
                    </div>
                ` : ''}
            </div>
        </div>
        `;
    }