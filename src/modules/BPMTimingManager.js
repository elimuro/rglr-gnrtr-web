/**
 * BPMTimingManager.js - Musical Time Calculations and BPM Management
 * This module provides musical time calculations and works with the existing MIDIClockManager
 * to provide BPM-based timing for animations and effects.
 */

export class BPMTimingManager {
    constructor(bpm = 120) {
        this.bpm = bpm;
        
        // Musical division mapping (in beats)
        this.divisionMap = {
            // Note divisions
            '64th': 0.0625,   // 1/16 beat
            '32nd': 0.125,    // 1/8 beat
            '16th': 0.25,     // 1/4 beat
            '8th': 0.5,       // 1/2 beat
            'quarter': 1,      // 1 beat
            'half': 2,         // 2 beats
            'whole': 4,        // 4 beats
            // Bar divisions (assuming 4/4 time)
            '1bar': 4,         // 1 bar = 4 beats
            '2bars': 8,        // 2 bars = 8 beats
            '4bars': 16,       // 4 bars = 16 beats
            '8bars': 32        // 8 bars = 32 beats
        };
        
        // Bar length mapping (in beats, assuming 4/4 time)
        this.barLengthMap = {
            1: 4,   // 1 bar = 4 beats
            2: 8,   // 2 bars = 8 beats
            4: 16,  // 4 bars = 16 beats
            8: 32   // 8 bars = 32 beats
        };
    }

    /**
     * Set the global BPM
     */
    setBPM(bpm) {
        this.bpm = Math.max(1, Math.min(300, bpm)); // Clamp between 1-300 BPM
    }

    /**
     * Get the current BPM
     */
    getBPM() {
        return this.bpm;
    }

    /**
     * Get time interval for a musical division
     * @param {string} division - Musical division ('32nd', '16th', '8th', 'quarter', 'half', 'whole')
     * @param {number} barLength - Number of bars (optional, defaults to 1)
     * @returns {number} Time in seconds
     */
    getTimeForDivision(division, barLength = 1) {
        const secondsPerBeat = 60 / this.bpm;
        const divisionBeats = this.divisionMap[division] || 1;
        const totalBeats = divisionBeats * barLength;
        return totalBeats * secondsPerBeat;
    }

    /**
     * Get time interval for a bar length
     * @param {number} barLength - Number of bars (1, 2, 4, 8)
     * @returns {number} Time in seconds
     */
    getTimeForBarLength(barLength) {
        const secondsPerBeat = 60 / this.bpm;
        const beatsPerBar = 4; // Assuming 4/4 time
        const totalBeats = barLength * beatsPerBar;
        return totalBeats * secondsPerBeat;
    }

    /**
     * Convert animation time to musical position
     * @param {number} animationTime - Time in seconds
     * @returns {object} Musical position {bar, beat, division}
     */
    getMusicalPosition(animationTime) {
        const secondsPerBeat = 60 / this.bpm;
        const totalBeats = animationTime / secondsPerBeat;
        const bar = Math.floor(totalBeats / 4) + 1; // Assuming 4/4 time
        const beat = (Math.floor(totalBeats) % 4) + 1;
        const division = (totalBeats % 1) * 8; // 8 divisions per beat (32nd notes)
        
        return {
            bar: bar,
            beat: beat,
            division: Math.floor(division)
        };
    }

    /**
     * Get available divisions in logical order (fastest to slowest)
     */
    getAvailableDivisions() {
        return [
            '64th', '32nd', '16th', '8th', 'quarter', 'half', 'whole',
            '1bar', '2bars', '4bars', '8bars'
        ];
    }

    /**
     * Get division beats for a given division
     * @param {string} division - Musical division
     * @returns {number} Number of beats
     */
    getDivisionBeats(division) {
        return this.divisionMap[division] || 1;
    }

    /**
     * Get available bar lengths
     */
    getAvailableBarLengths() {
        return Object.keys(this.barLengthMap).map(Number);
    }

    /**
     * Get division name for display
     */
    getDivisionDisplayName(division) {
        const nameMap = {
            '64th': '64th',
            '32nd': '32nd',
            '16th': '16th', 
            '8th': '8th',
            'quarter': 'Quarter',
            'half': 'Half',
            'whole': 'Whole'
        };
        return nameMap[division] || division;
    }

    /**
     * Get musical notation symbol for division
     */
    getDivisionSymbol(division) {
        const symbolMap = {
            '64th': '♬',
            '32nd': '♬',
            '16th': '♪',
            '8th': '♪',
            'quarter': '♩',
            'half': '𝅗𝅥',
            'whole': '𝅝'
        };
        return symbolMap[division] || '♩';
    }

    /**
     * Check if a time point aligns with a musical division
     * @param {number} time - Time in seconds
     * @param {string} division - Musical division to check against
     * @param {number} tolerance - Tolerance in seconds (default 0.01)
     * @returns {boolean} True if aligned
     */
    isAlignedWithDivision(time, division, tolerance = 0.01) {
        const divisionTime = this.getTimeForDivision(division);
        const position = time % divisionTime;
        return position < tolerance || position > (divisionTime - tolerance);
    }

    /**
     * Get the next sync point for a division
     * @param {number} currentTime - Current time in seconds
     * @param {string} division - Musical division
     * @returns {number} Time of next sync point
     */
    getNextSyncPoint(currentTime, division) {
        const divisionTime = this.getTimeForDivision(division);
        const currentPosition = currentTime % divisionTime;
        return currentTime + (divisionTime - currentPosition);
    }
} 