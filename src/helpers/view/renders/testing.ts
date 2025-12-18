import { ProjectAnalysis } from "../../../types";
import { escapeHtml } from "../converters/strings";

export function renderTestingSection(analysis: ProjectAnalysis): string {
        const testing = analysis.testing;
        
        if (testing.frameworks && testing.frameworks.length === 0 && testing.e2eTools && testing.e2eTools.length === 0) {
            return `
            <div class="section">
                <div class="section-header">
                    <h2>Testing <span class="toggle-icon">▼</span></h2>
                </div>
                <div class="section-content">
                    <div class="empty-state">
                        <p>No testing tools detected.</p>
                    </div>
                </div>
            </div>
            `;
        }

        return `
        <div class="section">
            <div class="section-header">
                <h2>Testing <span class="toggle-icon">▼</span></h2>
            </div>
            <div class="section-content">
                <div class="testing-grid">
                    ${testing.frameworks && testing.frameworks.length > 0 ? `
                        <div class="testing-category">
                            <h3>Testing Frameworks</h3>
                            <div class="tool-list">
                                ${testing.frameworks.map(fw => `
                                    <div class="tool-item">
                                        <span class="tool-icon">🧪</span>
                                        <span class="tool-name">${escapeHtml(fw)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${testing.e2eTools && testing.e2eTools.length > 0 ? `
                        <div class="testing-category">
                            <h3>E2E Testing</h3>
                            <div class="tool-list">
                                ${testing.e2eTools.map(tool => `
                                    <div class="tool-item">
                                        <span class="tool-icon">🌐</span>
                                        <span class="tool-name">${escapeHtml(tool)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${testing.assertionLibraries && testing.assertionLibraries.length > 0 ? `
                        <div class="testing-category">
                            <h3>Assertion Libraries</h3>
                            <div class="tool-list">
                                ${testing.assertionLibraries.map(lib => `
                                    <div class="tool-item">
                                        <span class="tool-icon">✓</span>
                                        <span class="tool-name">${escapeHtml(lib)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${testing.mockingLibraries && testing.mockingLibraries.length > 0 ? `
                        <div class="testing-category">
                            <h3>Mocking Libraries</h3>
                            <div class="tool-list">
                                ${testing.mockingLibraries.map(lib => `
                                    <div class="tool-item">
                                        <span class="tool-icon">🎭</span>
                                        <span class="tool-name">${escapeHtml(lib)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                ${testing.testStructure && testing.testStructure.testDirectory ? `
                    <div class="test-structure">
                        <h3>Test Structure</h3>
                        <div class="structure-details">
                            <div class="structure-item">
                                <span class="structure-label">Test Directory:</span>
                                <span class="structure-value file-link" data-path="${testing.testStructure.testDirectory}">
                                    ${escapeHtml(testing.testStructure.testDirectory)}
                                </span>
                            </div>
                            ${testing.testStructure.fixtureDirectory ? `
                                <div class="structure-item">
                                    <span class="structure-label">Fixtures:</span>
                                    <span class="structure-value file-link" data-path="${testing.testStructure.fixtureDirectory}">
                                        ${escapeHtml(testing.testStructure.fixtureDirectory)}
                                    </span>
                                </div>
                            ` : ''}
                            ${testing.testStructure.mockDirectory ? `
                                <div class="structure-item">
                                    <span class="structure-label">Mocks:</span>
                                    <span class="structure-value file-link" data-path="${testing.testStructure.mockDirectory}">
                                        ${escapeHtml(testing.testStructure.mockDirectory)}
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                ${testing.features && testing.features.hasCIIntegration ? `
                    <div class="info-box">
                        <strong>CI Integration:</strong> Testing is integrated with CI/CD pipeline.
                    </div>
                ` : ''}
            </div>
        </div>
        `;
    }