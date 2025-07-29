import { App } from './core/App.js';

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing RGLR GNRTR with modular architecture...');
    
    try {
        const app = new App();
        console.log('Application initialized successfully');
        
        // Make app globally available for debugging
        window.app = app;
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
}); 