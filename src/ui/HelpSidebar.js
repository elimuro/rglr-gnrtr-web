// HelpSidebar Component - Reusable navigation for all help files
class HelpSidebar {
    constructor(currentPage, pageSections = []) {
        this.currentPage = currentPage;
        this.pageSections = pageSections;
        this.helpPages = [
            { id: 'help.html', title: '← Main Help', icon: '🏠' },
            { id: 'general-setup-help.html', title: 'General Setup', icon: '🔧' },
            { id: 'parameters-help.html', title: 'Parameters Reference', icon: '📊' },
            { id: 'animations-help.html', title: 'Animation Types', icon: '🎬' },
            { id: 'presets-scenes-help.html', title: 'Presets & Scenes', icon: '💾' },
            { id: 'p5-layer-help.html', title: 'P5 Layer Guide', icon: '🎨' }
        ];
    }

    // Generate the complete sidebar HTML
    generate() {
        return `
            <div class="help-sidebar">
                ${this.generatePageNavigation()}
                ${this.generateSectionNavigation()}
                ${this.generateHelpPagesNavigation()}
            </div>
        `;
    }

    // Generate page-specific navigation
    generatePageNavigation() {
        if (this.pageSections.length === 0) return '';
        
        const sections = this.pageSections.map(section => {
            const isActive = section.id === this.getCurrentSection();
            return `<a href="#${section.id}" class="nav-item ${isActive ? 'active' : ''}">${section.title}</a>`;
        }).join('');

        return `
            <h3 class="nav-section-title">${this.getPageTitle()} Navigation</h3>
            <div class="nav-section">
                ${sections}
            </div>
        `;
    }

    // Generate section navigation (if page has sections)
    generateSectionNavigation() {
        if (this.pageSections.length === 0) return '';
        
        return `
            <div class="nav-section">
                <h4 class="nav-section-title">Page Sections</h4>
                ${this.pageSections.map(section => 
                    `<a href="#${section.id}" class="nav-item">${section.title}</a>`
                ).join('')}
            </div>
        `;
    }

    // Generate navigation to other help pages
    generateHelpPagesNavigation() {
        const otherPages = this.helpPages.filter(page => page.id !== this.currentPage);
        
        return `
            <div class="nav-section">
                <h4 class="nav-section-title">Other Help Pages</h4>
                ${otherPages.map(page => 
                    `<a href="${page.id}" class="nav-item">${page.icon} ${page.title}</a>`
                ).join('')}
            </div>
        `;
    }

    // Get the current page title
    getPageTitle() {
        const pageTitles = {
            'help.html': 'Main Help',
            'general-setup-help.html': 'Setup Guide',
            'parameters-help.html': 'Parameters Reference',
            'animations-help.html': 'Animation Types',
            'presets-scenes-help.html': 'Presets & Scenes',
            'p5-layer-help.html': 'P5 Layer Guide'
        };
        return pageTitles[this.currentPage] || 'Help';
    }

    // Get current section from URL hash
    getCurrentSection() {
        return window.location.hash.slice(1) || '';
    }

    // Initialize the sidebar (call this after DOM is loaded)
    init() {
        // Add click handlers for smooth scrolling
        document.querySelectorAll('.help-sidebar a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                    // Update active state
                    this.updateActiveSection(targetId);
                }
            });
        });

        // Update active section on scroll
        window.addEventListener('scroll', () => {
            this.updateActiveSectionOnScroll();
        });

        // Set initial active section
        this.updateActiveSection(this.getCurrentSection());
    }

    // Update active section based on scroll position
    updateActiveSectionOnScroll() {
        const sections = this.pageSections.map(s => s.id);
        let currentSection = '';

        for (let i = sections.length - 1; i >= 0; i--) {
            const section = document.getElementById(sections[i]);
            if (section && section.offsetTop <= window.pageYOffset + 100) {
                currentSection = sections[i];
                break;
            }
        }

        if (currentSection !== this.getCurrentSection()) {
            this.updateActiveSection(currentSection);
        }
    }

    // Update active section styling
    updateActiveSection(sectionId) {
        // Remove active class from all nav items
        document.querySelectorAll('.help-sidebar .nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current section
        if (sectionId) {
            const activeLink = document.querySelector(`.help-sidebar a[href="#${sectionId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HelpSidebar;
}
