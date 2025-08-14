/**
 * DrawerManager.js - UI Drawer Management
 * This module handles all drawer-related functionality including opening, closing,
 * positioning, and state management for the application's drawer interface.
 * Extracted from App.js to improve modularity and separation of concerns.
 */

export class DrawerManager {
    constructor(app) {
        this.app = app;
        this.currentDrawer = null;
        this.drawerContainer = null;
        this.domCache = app.domCache;
        
        // Drawer button IDs
        this.drawerButtons = [
            'drawer-connect',
            'drawer-mapping',
            'drawer-scene-management',
            'drawer-midi-activity'
        ];
    }

    /**
     * Initialize drawer functionality
     */
    setupDrawers() {
        // Get drawer container
        this.drawerContainer = this.domCache.getElement('midi-drawer-container');
        
        if (!this.drawerContainer) {
            console.error('Drawer container not found');
            return;
        }
        
        // Ensure drawer is hidden initially
        this.hideDrawerContainer();
        
        // Set up drawer button event listeners
        this.setupDrawerButtonListeners();
        
        // Set up global event listeners
        this.setupGlobalEventListeners();
        
        // Set up MIDI activity tracking
        this.setupMIDIActivityTracking();
        
        // Set up connection button event handlers
        this.setupConnectionButtonHandlers();
        
        // Set up mapping drawer tabs
        this.setupMappingTabs();
        
        // Set up connect drawer tabs
        this.setupConnectTabs();
    }

    /**
     * Set up drawer button event listeners
     */
    setupDrawerButtonListeners() {
        this.drawerButtons.forEach(buttonId => {
            const button = this.domCache.getElement(buttonId);
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleDrawer(buttonId.replace('drawer-', ''));
                });
            } else {
                console.warn(`Drawer button not found: ${buttonId}`);
            }
        });
    }

    /**
     * Set up global event listeners for drawer behavior
     */
    setupGlobalEventListeners() {
        // Close drawer when clicking outside
        document.addEventListener('click', (e) => {
            if (this.currentDrawer) {
                // Check if the click is within the drawer container or on drawer-related elements
                const isWithinDrawer = this.drawerContainer.contains(e.target);
                const clickedDrawerButton = e.target.closest('[id^="drawer-"]');
                const clickedInteractiveElement = e.target.closest('[data-drawer-interactive]');
                
                // Only close drawer if clicking outside AND not on any interactive drawer elements
                if (!isWithinDrawer && !clickedDrawerButton && !clickedInteractiveElement) {
                    this.closeDrawer();
                }
            }
        });
        
        // Close drawer on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentDrawer) {
                this.closeDrawer();
            }
        });
        
        // Handle window resize for drawer positioning
        window.addEventListener('resize', () => {
            if (this.currentDrawer) {
                // Re-apply the current drawer positioning based on new screen size
                this.toggleDrawer(this.currentDrawer);
            }
        });
    }

    /**
     * Set up MIDI activity tracking
     */
    setupMIDIActivityTracking() {
        // MIDI activity tracking state
        this.midiActivityState = {
            messages: [],
            maxMessages: 100,
            isPaused: false,
            filterClock: true, // Default to filtering clock messages
            messageCounts: {
                cc: 0,
                note: 0,
                pitch: 0,
                system: 0
            },
            lastActivity: null,
            messageRate: 0,
            rateTimer: null
        };

        // Set up MIDI activity drawer controls
        this.setupMIDIActivityControls();
        
        // Start periodic updates for MIDI activity rate
        setInterval(() => {
            this.updateMIDIActivityRate();
            this.updateMIDIActivityStats();
        }, 1000);
    }

    /**
     * Set up MIDI activity controls
     */
    setupMIDIActivityControls() {
        // Clear button
        const clearButton = this.domCache.getElement('midi-activity-clear');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearMIDIActivity();
            });
        }

        // Pause/Resume button
        const pauseButton = this.domCache.getElement('midi-activity-pause');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                this.toggleMIDIActivityPause();
            });
        }

        // Filter clock messages checkbox
        const filterClockCheckbox = this.domCache.getElement('midi-activity-filter-clock');
        if (filterClockCheckbox) {
            filterClockCheckbox.addEventListener('change', (e) => {
                this.midiActivityState.filterClock = e.target.checked;
            });
        }
    }

    /**
     * Toggle drawer open/close
     * @param {string} drawerName - Name of the drawer to toggle
     */
    toggleDrawer(drawerName) {
        const contentId = `drawer-${drawerName}-content`;
        const content = this.domCache.getElement(contentId);
        
        if (!content) {
            console.error(`Drawer content not found: ${contentId}`);
            return;
        }
        
        // If clicking the same drawer, close it
        if (this.currentDrawer === drawerName) {
            this.closeDrawer();
            return;
        }
        
        // Close any open drawer first
        this.closeDrawer();
        
        // Show the new drawer
        this.currentDrawer = drawerName;
        content.classList.add('active');
        
        // Handle mobile vs desktop positioning
        this.positionDrawer(drawerName);
        
        // Remove hidden class when opening drawer
        this.drawerContainer.classList.remove('drawer-hidden');
        
        // Add staggered animation delays to drawer content elements
        this.addStaggeredAnimations(content);
        
        // Update button states
        this.updateDrawerButtonStates(drawerName);
        
        // Check connection status for mapping drawers
        this.checkDrawerConnectionStatus(drawerName);
    }

    /**
     * Position drawer based on screen size and drawer type
     * @param {string} drawerName - Name of the drawer
     */
    positionDrawer(drawerName) {
        if (window.innerWidth <= 768) {
            // On mobile, position the drawer to slide up from the bottom
            this.drawerContainer.style.position = 'fixed';
            this.drawerContainer.style.bottom = '0';
            this.drawerContainer.style.left = '0';
            this.drawerContainer.style.right = '0';
            this.drawerContainer.style.top = 'auto';
            this.drawerContainer.style.zIndex = '45';
            this.drawerContainer.classList.remove('translate-y-full');
            this.drawerContainer.classList.add('open');
        } else {
            // On desktop, let CSS handle the positioning
            this.drawerContainer.classList.remove('-translate-y-full');
            this.drawerContainer.classList.add('open');
            
            // Add specific class for drawer positioning
            this.updateDrawerPositionClasses(drawerName);
        }
    }

    /**
     * Update drawer position classes
     * @param {string} drawerName - Name of the drawer
     */
    updateDrawerPositionClasses(drawerName) {
        // Remove all drawer-specific classes first
        this.drawerContainer.classList.remove('connect-drawer', 'audio-interface-drawer', 'midi-activity-drawer');
        
        // Add appropriate class based on drawer type
        switch (drawerName) {
            case 'connect':
                this.drawerContainer.classList.add('connect-drawer');
                break;
            case 'audio-interface':
                this.drawerContainer.classList.add('audio-interface-drawer');
                break;
            case 'midi-activity':
                this.drawerContainer.classList.add('midi-activity-drawer');
                break;
        }
    }

    /**
     * Close the currently open drawer
     */
    closeDrawer() {
        if (this.currentDrawer) {
            const contentId = `drawer-${this.currentDrawer}-content`;
            const content = this.domCache.getElement(contentId);
            
            if (content) {
                content.classList.remove('active');
            }
            
            this.hideDrawerContainer();
            this.currentDrawer = null;
            
            // Remove drawer-specific classes
            this.drawerContainer.classList.remove('connect-drawer', 'audio-interface-drawer', 'midi-activity-drawer');
            
            // Reset all button states
            this.updateDrawerButtonStates(null);
        }
    }

    /**
     * Hide the drawer container
     */
    hideDrawerContainer() {
        // Handle mobile vs desktop positioning
        if (window.innerWidth <= 768) {
            // On mobile, reset the positioning and hide
            this.drawerContainer.style.position = '';
            this.drawerContainer.style.top = '';
            this.drawerContainer.style.bottom = '';
            this.drawerContainer.style.left = '';
            this.drawerContainer.style.right = '';
            this.drawerContainer.style.zIndex = '';
            this.drawerContainer.classList.add('translate-y-full');
            this.drawerContainer.classList.remove('open');
        } else {
            // On desktop, let CSS handle the positioning
            this.drawerContainer.classList.add('-translate-y-full');
            this.drawerContainer.classList.remove('open');
        }
        
        // Add a hidden class to completely remove it from layout when not active
        this.drawerContainer.classList.add('drawer-hidden');
    }

    /**
     * Check connection status for specific drawer
     * @param {string} drawerName - Name of the drawer
     */
    checkDrawerConnectionStatus(drawerName) {
        switch (drawerName) {
            case 'connect':
                // Connect drawer doesn't need connection status checking
                break;
            case 'mapping':
                // Check all mapping tab connection statuses
                this.checkMIDIConnectionStatus('cc-midi-connection-status', 'cc-controls-container');
                this.checkMIDIConnectionStatus('note-midi-connection-status', 'note-controls-container');
                this.checkAudioConnectionStatus('audio-mapping-connection-status', 'audio-mapping-controls-container');
                break;
            case 'cc-mapping':
                this.checkMIDIConnectionStatus('cc-midi-connection-status', 'cc-controls-container');
                break;
            case 'note-controls':
                this.checkMIDIConnectionStatus('note-midi-connection-status', 'note-controls-container');
                break;
            case 'audio-mapping':
                this.checkAudioConnectionStatus('audio-mapping-connection-status', 'audio-mapping-controls-container');
                break;
        }
    }

    /**
     * Check MIDI connection status
     * @param {string} statusElementId - ID of the status element
     * @param {string} controlsContainerId - ID of the controls container
     */
    checkMIDIConnectionStatus(statusElementId, controlsContainerId) {
        const statusElement = this.domCache.getElement(statusElementId);
        const controlsContainer = this.domCache.getElement(controlsContainerId);
        
        if (!statusElement || !controlsContainer) return;
        
        const isMIDIConnected = this.app.midiManager && this.app.midiManager.isConnected;
        
        if (!isMIDIConnected) {
            statusElement.classList.remove('hidden');
            controlsContainer.classList.add('opacity-50');
        } else {
            statusElement.classList.add('hidden');
            controlsContainer.classList.remove('opacity-50');
        }
    }

    /**
     * Check audio connection status
     * @param {string} statusElementId - ID of the status element
     * @param {string} controlsContainerId - ID of the controls container
     */
    checkAudioConnectionStatus(statusElementId, controlsContainerId) {
        const statusElement = this.domCache.getElement(statusElementId);
        const controlsContainer = this.domCache.getElement(controlsContainerId);
        
        if (!statusElement || !controlsContainer) return;
        
        const isAudioConnected = this.app.audioManager && this.app.audioManager.isListening;
        
        if (!isAudioConnected) {
            statusElement.classList.remove('hidden');
            controlsContainer.classList.add('opacity-50');
        } else {
            statusElement.classList.add('hidden');
            controlsContainer.classList.remove('opacity-50');
        }
    }

    /**
     * Add staggered animations to drawer content
     * @param {HTMLElement} content - The drawer content element
     */
    addStaggeredAnimations(content) {
        // Get all animatable elements in the drawer content
        const animatableElements = content.querySelectorAll('button, input, select, .midi-control, label, h3');
        
        animatableElements.forEach((element, index) => {
            // Set CSS custom property for animation delay
            element.style.setProperty('--animation-order', index);
        });
    }

    /**
     * Update drawer button states
     * @param {string|null} activeDrawer - Name of the active drawer or null
     */
    updateDrawerButtonStates(activeDrawer) {
        this.drawerButtons.forEach(buttonId => {
            const button = this.domCache.getElement(buttonId);
            if (button) {
                const drawerName = buttonId.replace('drawer-', '');
                const isActive = drawerName === activeDrawer;
                
                // Remove all state classes
                button.classList.remove(
                    'bg-midi-green', 'bg-opacity-20', 'text-midi-green', 'border-midi-green',
                    'bg-black', 'bg-opacity-30', 'text-white', 'border-gray-600'
                );
                
                // Add appropriate classes
                if (isActive) {
                    button.classList.add('bg-midi-green', 'bg-opacity-20', 'text-midi-green', 'border-midi-green');
                } else {
                    button.classList.add('bg-black', 'bg-opacity-30', 'text-white', 'border-gray-600');
                }
            }
        });
    }

    /**
     * Add MIDI activity message
     * @param {string} message - The MIDI activity message
     * @param {string} category - The message category
     */
    addMIDIActivityMessage(message, category) {
        if (this.midiActivityState.isPaused) {
            return;
        }

        // Filter clock messages if enabled
        if (this.midiActivityState.filterClock && category === 'clock') {
            return;
        }

        const timestamp = new Date();
        const activityMessage = {
            message,
            category,
            timestamp,
            id: Date.now() + Math.random()
        };

        this.midiActivityState.messages.unshift(activityMessage);
        this.midiActivityState.lastActivity = timestamp;

        // Update message counts
        if (this.midiActivityState.messageCounts.hasOwnProperty(category)) {
            this.midiActivityState.messageCounts[category]++;
        }

        // Limit messages
        if (this.midiActivityState.messages.length > this.midiActivityState.maxMessages) {
            this.midiActivityState.messages.pop();
        }

        // Update UI
        this.updateMIDIActivityDisplay();
    }

    /**
     * Update MIDI activity display
     */
    updateMIDIActivityDisplay() {
        const activityStream = this.domCache.getElement('midi-activity-stream');
        if (!activityStream) return;

        // Clear existing content
        activityStream.innerHTML = '';

        // Add messages
        this.midiActivityState.messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = `text-xs p-1 border-b border-gray-700 ${this.getMessageCategoryClass(msg.category)}`;
            messageElement.textContent = `${msg.timestamp.toLocaleTimeString()} - ${msg.message}`;
            activityStream.appendChild(messageElement);
        });

        // Update message counts
        this.updateMIDIActivityCounts();
    }

    /**
     * Get CSS class for message category
     * @param {string} category - Message category
     * @returns {string} CSS class
     */
    getMessageCategoryClass(category) {
        switch (category) {
            case 'cc': return 'text-blue-400';
            case 'note': return 'text-green-400';
            case 'pitch': return 'text-yellow-400';
            case 'system': return 'text-purple-400';
            case 'clock': return 'text-gray-400';
            default: return 'text-white';
        }
    }

    /**
     * Update MIDI activity counts
     */
    updateMIDIActivityCounts() {
        const counts = this.midiActivityState.messageCounts;
        
        // Update count displays
        const ccCount = this.domCache.getElement('midi-cc-count');
        const noteCount = this.domCache.getElement('midi-note-count');
        const pitchCount = this.domCache.getElement('midi-pitch-count');
        const systemCount = this.domCache.getElement('midi-system-count');

        if (ccCount) ccCount.textContent = counts.cc;
        if (noteCount) noteCount.textContent = counts.note;
        if (pitchCount) pitchCount.textContent = counts.pitch;
        if (systemCount) systemCount.textContent = counts.system;
    }

    /**
     * Update MIDI activity rate
     */
    updateMIDIActivityRate() {
        const now = Date.now();
        const oneSecondAgo = now - 1000;
        
        // Count messages in the last second
        const recentMessages = this.midiActivityState.messages.filter(msg => 
            msg.timestamp.getTime() > oneSecondAgo
        );
        
        this.midiActivityState.messageRate = recentMessages.length;
        
        // Update rate display
        const rateElement = this.domCache.getElement('midi-activity-rate');
        if (rateElement) {
            rateElement.textContent = `${this.midiActivityState.messageRate} msg/s`;
        }
    }

    /**
     * Update MIDI activity stats
     */
    updateMIDIActivityStats() {
        const lastActivity = this.domCache.getElement('midi-activity-last');
        if (lastActivity && this.midiActivityState.lastActivity) {
            const timeSince = Date.now() - this.midiActivityState.lastActivity.getTime();
            const seconds = Math.floor(timeSince / 1000);
            lastActivity.textContent = `${seconds}s ago`;
        }
    }

    /**
     * Clear MIDI activity
     */
    clearMIDIActivity() {
        this.midiActivityState.messages = [];
        this.midiActivityState.messageCounts = {
            cc: 0,
            note: 0,
            pitch: 0,
            system: 0
        };
        this.midiActivityState.lastActivity = null;
        this.midiActivityState.messageRate = 0;
        
        this.updateMIDIActivityDisplay();
    }

    /**
     * Toggle MIDI activity pause
     */
    toggleMIDIActivityPause() {
        this.midiActivityState.isPaused = !this.midiActivityState.isPaused;
        
        const pauseButton = this.domCache.getElement('midi-activity-pause');
        if (pauseButton) {
            pauseButton.textContent = this.midiActivityState.isPaused ? 'Resume' : 'Pause';
        }
    }

    /**
     * Get current drawer name
     * @returns {string|null} Current drawer name or null
     */
    getCurrentDrawer() {
        return this.currentDrawer;
    }

    /**
     * Check if a drawer is open
     * @param {string} drawerName - Name of the drawer to check
     * @returns {boolean} True if the drawer is open
     */
    isDrawerOpen(drawerName) {
        return this.currentDrawer === drawerName;
    }

    /**
     * Check if any drawer is open
     * @returns {boolean} True if any drawer is open
     */
    isAnyDrawerOpen() {
        return this.currentDrawer !== null;
    }

    /**
     * Set up connection button event handlers
     */
    setupConnectionButtonHandlers() {
        // MIDI connection buttons
        const ccConnectButton = this.domCache.getElement('cc-connect-midi');
        const noteConnectButton = this.domCache.getElement('note-connect-midi');
        
        if (ccConnectButton) {
            ccConnectButton.addEventListener('click', () => {
                // Open the connect drawer to help user connect MIDI
                this.toggleDrawer('connect');
            });
        }
        
        if (noteConnectButton) {
            noteConnectButton.addEventListener('click', () => {
                // Open the connect drawer to help user connect MIDI
                this.toggleDrawer('connect');
            });
        }
        
        // Audio connection button
        const audioConnectButton = this.domCache.getElement('audio-mapping-connect-audio');
        
        if (audioConnectButton) {
            audioConnectButton.addEventListener('click', () => {
                // Open the connect drawer to help user connect audio
                this.toggleDrawer('connect');
            });
        }
    }

    /**
     * Set up connect drawer tabs
     */
    setupConnectTabs() {
        const tabs = ['connect-midi', 'connect-audio'];
        const sections = ['connect-midi-section', 'connect-audio-section'];
        
        tabs.forEach((tab, index) => {
            const tabButton = this.domCache.getElement(`tab-${tab}`);
            const section = this.domCache.getElement(sections[index]);
            
            if (tabButton && section) {
                tabButton.addEventListener('click', () => {
                    this.switchConnectTab(tab);
                });
            }
        });
        
        // Start with MIDI tab active
        this.switchConnectTab('connect-midi');
    }
    
    /**
     * Switch connect tab
     */
    switchConnectTab(activeTab) {
        const tabs = ['connect-midi', 'connect-audio'];
        const sections = ['connect-midi-section', 'connect-audio-section'];
        
        tabs.forEach((tab, index) => {
            const tabButton = this.domCache.getElement(`tab-${tab}`);
            const section = this.domCache.getElement(sections[index]);
            
            if (tabButton && section) {
                if (tab === activeTab) {
                    tabButton.classList.add('active');
                    section.classList.add('active');
                    section.classList.remove('hidden');
                } else {
                    tabButton.classList.remove('active');
                    section.classList.remove('active');
                    section.classList.add('hidden');
                }
            }
        });
    }
    
    /**
     * Set up mapping drawer tabs
     */
    setupMappingTabs() {
        const tabs = ['cc', 'note', 'audio'];
        const sections = ['cc-mapping-section', 'note-mapping-section', 'audio-mapping-section'];
        
        tabs.forEach((tab, index) => {
            const tabButton = this.domCache.getElement(`tab-${tab}`);
            const section = this.domCache.getElement(sections[index]);
            
            if (tabButton && section) {
                tabButton.addEventListener('click', () => {
                    this.switchMappingTab(tab);
                });
            }
        });
        
        // Start with CC tab active
        this.switchMappingTab('cc');
    }
    
    /**
     * Switch mapping tab
     */
    switchMappingTab(activeTab) {
        const tabs = ['cc', 'note', 'audio'];
        const sections = ['cc-mapping-section', 'note-mapping-section', 'audio-mapping-section'];
        
        tabs.forEach((tab, index) => {
            const tabButton = this.domCache.getElement(`tab-${tab}`);
            const section = this.domCache.getElement(sections[index]);
            
            if (tabButton && section) {
                if (tab === activeTab) {
                    tabButton.classList.add('active');
                    section.classList.add('active');
                    section.classList.remove('hidden');
                } else {
                    tabButton.classList.remove('active');
                    section.classList.remove('active');
                    section.classList.add('hidden');
                }
            }
        });
    }

    /**
     * Clean up event listeners and state
     */
    destroy() {
        // Clear intervals
        if (this.midiActivityState.rateTimer) {
            clearInterval(this.midiActivityState.rateTimer);
        }
        
        // Close any open drawer
        this.closeDrawer();
        
        // Reset state
        this.currentDrawer = null;
        this.drawerContainer = null;
    }
}
