/**
 * RGLR GNRTR - Main Entry Point
 * This is the clean modular entry point for the RGLR GNRTR application. It initializes the application
 * when the DOM is ready, creates the main App instance, and makes it globally available for debugging.
 * This file serves as the bridge between the HTML page and the modular architecture, handling the
 * initial setup and error handling for the entire application.
 */

import { App } from './core/App.js';

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new App();
        
        // Make app globally available for debugging
        window.app = app;
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
}); 