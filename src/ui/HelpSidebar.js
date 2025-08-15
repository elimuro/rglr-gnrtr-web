/**
 * HelpSidebar.js - Navigation component for help pages
 * Provides a sidebar navigation system for help documentation
 */

export class HelpSidebar {
    constructor(currentPage, sections = []) {
        this.currentPage = currentPage;
        this.sections = sections;
        this.sidebar = null;
    }

    generate() {
        const helpPages = [
            { name: 'Main Help', url: 'help.html', icon: '🎵' },
            { name: 'General Setup', url: 'general-setup-help.html', icon: '🔧' },
            { name: 'Parameters', url: 'parameters-help.html', icon: '📊' },
            { name: 'Animations', url: 'animations-help.html', icon: '🎬' },
            { name: 'Presets & Scenes', url: 'presets-scenes-help.html', icon: '💾' },
            { name: 'P5 Layer', url: 'p5-layer-help.html', icon: '🎨' }
        ];

        let sidebarHTML = `
            <div class="help-sidebar">
                <div class="nav-section">
                    <div class="nav-section-title">📚 Help Pages</div>
                    ${helpPages.map(page => {
                        const isActive = this.currentPage === page.url;
                        return `
                            <a href="${page.url}" class="nav-item ${isActive ? 'active' : ''}" target="_blank">
                                ${page.icon} ${page.name}
                            </a>
                        `;
                    }).join('')}
                </div>
        `;

        if (this.sections.length > 0) {
            sidebarHTML += `
                <div class="nav-section">
                    <div class="nav-section-title">📖 Page Sections</div>
                    ${this.sections.map(section => {
                        return `
                            <a href="#${section.id}" class="nav-item">
                                ${section.title}
                            </a>
                        `;
                    }).join('')}
                </div>
            `;
        }

        sidebarHTML += '</div>';
        return sidebarHTML;
    }

    init() {
        // Add smooth scrolling for anchor links
        const anchorLinks = document.querySelectorAll('.nav-item[href^="#"]');
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}
