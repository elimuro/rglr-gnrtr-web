/**
 * MIDI Constants
 * 
 * Centralizes MIDI-related constants, ranges, and configuration values
 * used throughout the MIDI system including MIDIEventHandler.js, midi-controls.js,
 * and midi-manager.js.
 * 
 * These constants eliminate hardcoded MIDI values and provide standardized
 * MIDI protocol constants for consistent behavior across the application.
 */

export const MIDI_CONSTANTS = {
  /**
   * MIDI Value Ranges
   * Standard MIDI protocol value ranges for different message types
   */
  ranges: {
    controllers: { min: 0, max: 127 },  // Connected to: MIDIEventHandler.js controller validation
                                        // Purpose: Valid range for MIDI controller numbers (CC)
    channels: { min: 0, max: 15 },      // Connected to: MIDIEventHandler.js channel validation
                                        // Purpose: Valid MIDI channel range (0-15, displayed as 1-16)
    notes: { min: 0, max: 127 },        // Connected to: MIDIEventHandler.js note validation
                                        // Purpose: Valid MIDI note number range (C-1 to G9)
    velocity: { min: 0, max: 127 },     // Connected to: MIDIEventHandler.js velocity validation
                                        // Purpose: Valid MIDI note velocity range
    pitchBend: { min: 0, max: 16383 },  // Connected to: pitch bend message handling
                                        // Purpose: 14-bit pitch bend range (0-16383)
    programChange: { min: 0, max: 127 }, // Connected to: program change handling
                                        // Purpose: Valid program/patch number range
    aftertouch: { min: 0, max: 127 }    // Connected to: aftertouch message handling
                                        // Purpose: Valid aftertouch pressure range
  },

  /**
   * Default MIDI Configuration
   * Default values for MIDI system initialization
   */
  defaults: {
    channel: 0,           // Connected to: midi-manager.js default channel setup
                          // Purpose: Default MIDI channel (channel 1 in user terms)
    velocity: 64,         // Purpose: Default note velocity (medium velocity)
    program: 0,           // Purpose: Default program/patch number
    controller: 1,        // Purpose: Default controller number (modulation wheel)
    note: 60,             // Purpose: Default note (Middle C)
    tempo: 120,           // Connected to: MIDI clock tempo initialization
                          // Purpose: Default MIDI tempo in BPM
    division: 24          // Connected to: MIDI clock division (24 PPQ standard)
                          // Purpose: MIDI clock pulses per quarter note
  },

  /**
   * MIDI Message Types
   * Constants for different types of MIDI messages
   */
  messageTypes: {
    noteOff: 0x80,        // Connected to: MIDIEventHandler.js message parsing
                          // Purpose: MIDI note off message type
    noteOn: 0x90,         // Connected to: MIDIEventHandler.js message parsing
                          // Purpose: MIDI note on message type
    aftertouch: 0xA0,     // Connected to: MIDIEventHandler.js message parsing
                          // Purpose: Polyphonic aftertouch message type
    controlChange: 0xB0,  // Connected to: MIDIEventHandler.js message parsing
                          // Purpose: Control change (CC) message type
    programChange: 0xC0,  // Connected to: MIDIEventHandler.js message parsing
                          // Purpose: Program change message type
    channelPressure: 0xD0, // Connected to: MIDIEventHandler.js message parsing
                          // Purpose: Channel pressure (aftertouch) message type
    pitchBend: 0xE0,      // Connected to: MIDIEventHandler.js message parsing
                          // Purpose: Pitch bend message type
    systemExclusive: 0xF0, // Connected to: system exclusive message handling
                          // Purpose: System exclusive message type
    midiClock: 0xF8,      // Connected to: MIDIClockManager.js clock handling
                          // Purpose: MIDI timing clock message
    midiStart: 0xFA,      // Connected to: MIDIClockManager.js transport control
                          // Purpose: MIDI start message
    midiContinue: 0xFB,   // Connected to: MIDIClockManager.js transport control
                          // Purpose: MIDI continue message
    midiStop: 0xFC        // Connected to: MIDIClockManager.js transport control
                          // Purpose: MIDI stop message
  },

  /**
   * Standard MIDI Controller Numbers
   * Common MIDI CC numbers for standard controllers
   */
  controllers: {
    modulation: 1,        // Connected to: midi-controls.js modulation mapping
                          // Purpose: Modulation wheel controller
    breath: 2,            // Purpose: Breath controller
    volume: 7,            // Connected to: volume control mapping
                          // Purpose: Channel volume controller
    balance: 8,           // Purpose: Balance controller
    pan: 10,              // Connected to: panning control mapping
                          // Purpose: Pan controller
    expression: 11,       // Connected to: expression control mapping
                          // Purpose: Expression controller
    sustain: 64,          // Connected to: sustain pedal handling
                          // Purpose: Sustain pedal controller
    portamento: 65,       // Purpose: Portamento on/off controller
    sostenuto: 66,        // Purpose: Sostenuto pedal controller
    softPedal: 67,        // Purpose: Soft pedal controller
    filter: 74,           // Connected to: filter control mapping
                          // Purpose: Filter cutoff controller
    resonance: 71,        // Connected to: resonance control mapping
                          // Purpose: Filter resonance controller
    attack: 73,           // Connected to: envelope control mapping
                          // Purpose: Attack time controller
    release: 72,          // Connected to: envelope control mapping
                          // Purpose: Release time controller
    allSoundOff: 120,     // Connected to: panic/reset functionality
                          // Purpose: All sound off message
    resetControllers: 121, // Connected to: controller reset functionality
                          // Purpose: Reset all controllers message
    allNotesOff: 123      // Connected to: panic/reset functionality
                          // Purpose: All notes off message
  },

  /**
   * MIDI Clock Configuration
   * Constants for MIDI clock and timing synchronization
   */
  clock: {
    pulsesPerQuarterNote: 24,  // Connected to: MIDIClockManager.js timing calculations
                               // Purpose: Standard MIDI clock resolution (24 PPQ)
    pulsesPerSixteenthNote: 6, // Connected to: subdivision timing calculations
                               // Purpose: MIDI clock pulses per 16th note
    pulsesPerEighthNote: 12,   // Connected to: subdivision timing calculations
                               // Purpose: MIDI clock pulses per 8th note
    pulsesPerBar: 96,          // Connected to: MIDIClockManager.js bar calculations (4/4 time)
                               // Purpose: MIDI clock pulses per bar (4 * 24 = 96 for 4/4 time)
    minTempo: 20,              // Connected to: MIDIClockManager.js tempo validation
                               // Purpose: Minimum valid MIDI tempo
    maxTempo: 300,             // Connected to: MIDIClockManager.js tempo validation
                               // Purpose: Maximum valid MIDI tempo
    defaultTempo: 120,         // Connected to: MIDIClockManager.js initialization
                               // Purpose: Default MIDI clock tempo
    clockTimeout: 1000,        // Connected to: MIDIClockManager.js timeout detection
                               // Purpose: Timeout for detecting stopped MIDI clock (ms)
    syncTolerance: 50          // Connected to: MIDIClockManager.js sync detection
                               // Purpose: Tolerance for MIDI clock synchronization (ms)
  },

  /**
   * MIDI Device Configuration
   * Constants for MIDI device handling and identification
   */
  devices: {
    maxInputs: 16,            // Connected to: midi-manager.js device enumeration
                              // Purpose: Maximum number of MIDI input devices to handle
    maxOutputs: 16,           // Connected to: midi-manager.js device enumeration
                              // Purpose: Maximum number of MIDI output devices to handle
    connectionTimeout: 5000,   // Connected to: device connection handling
                              // Purpose: Timeout for MIDI device connection attempts (ms)
    reconnectDelay: 2000,     // Connected to: device reconnection logic
                              // Purpose: Delay before attempting device reconnection (ms)
    maxReconnectAttempts: 3,  // Connected to: device reconnection logic
                              // Purpose: Maximum number of reconnection attempts
    devicePollInterval: 1000  // Connected to: device status polling
                              // Purpose: Interval for checking device status (ms)
  },

  /**
   * MIDI Mapping Configuration
   * Constants for parameter mapping and control assignments
   */
  mapping: {
    defaultMappingMode: 'absolute', // Connected to: midi-controls.js mapping mode
                                    // Purpose: Default mode for MIDI parameter mapping
    relativeSensitivity: 1.0,       // Connected to: relative mapping calculations
                                    // Purpose: Sensitivity for relative MIDI mappings
    accelerationCurve: 2.0,         // Connected to: accelerated mapping calculations
                                    // Purpose: Acceleration curve for velocity-sensitive mappings
    deadZone: 2,                    // Connected to: MIDI input filtering
                                    // Purpose: Dead zone for MIDI controller inputs (prevents jitter)
    smoothingFactor: 0.1,           // Connected to: MIDI value smoothing
                                    // Purpose: Smoothing factor for MIDI parameter changes
    quantizeThreshold: 8,           // Connected to: MIDI value quantization
                                    // Purpose: Threshold for quantizing MIDI values
    maxMappings: 128,               // Connected to: midi-controls.js mapping limits
                                    // Purpose: Maximum number of simultaneous MIDI mappings
    learningTimeout: 10000          // Connected to: MIDI learn functionality
                                    // Purpose: Timeout for MIDI learn mode (ms)
  },

  /**
   * Note Names and Numbers
   * Mapping between MIDI note numbers and note names
   */
  notes: {
    names: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    middleC: 60,                    // Connected to: note display and reference
                                    // Purpose: MIDI note number for Middle C
    a440: 69,                       // Connected to: tuning reference
                                    // Purpose: MIDI note number for A440 (concert pitch)
    octaveSize: 12,                 // Connected to: note calculations
                                    // Purpose: Number of semitones in an octave
    lowestNote: 0,                  // Purpose: Lowest possible MIDI note (C-1)
    highestNote: 127                // Purpose: Highest possible MIDI note (G9)
  },

  /**
   * MIDI Status and Error Codes
   * Constants for MIDI system status and error handling
   */
  status: {
    connected: 'connected',         // Connected to: device status tracking
                                    // Purpose: MIDI device connected status
    disconnected: 'disconnected',   // Connected to: device status tracking
                                    // Purpose: MIDI device disconnected status
    error: 'error',                 // Connected to: error handling
                                    // Purpose: MIDI system error status
    learning: 'learning',           // Connected to: MIDI learn mode
                                    // Purpose: MIDI learn mode active status
    mapping: 'mapping',             // Connected to: mapping mode
                                    // Purpose: MIDI mapping mode active status
    syncing: 'syncing',             // Connected to: clock synchronization
                                    // Purpose: MIDI clock synchronization status
    ready: 'ready'                  // Connected to: system initialization
                                    // Purpose: MIDI system ready status
  },

  /**
   * Performance and Optimization
   * Constants for MIDI performance optimization
   */
  performance: {
    maxEventsPerFrame: 100,         // Connected to: MIDI event processing limits
                                    // Purpose: Maximum MIDI events to process per animation frame
    eventBufferSize: 1000,          // Connected to: MIDI event buffering
                                    // Purpose: Size of MIDI event buffer
    highResolutionTimer: true,      // Connected to: timing precision
                                    // Purpose: Use high-resolution timer for MIDI timing
    priorityMessages: [0x90, 0x80, 0xB0], // Connected to: message prioritization
                                    // Purpose: High-priority MIDI message types (note on/off, CC)
    throttleInterval: 16,           // Connected to: event throttling (60 FPS)
                                    // Purpose: Minimum interval between processed events (ms)
    maxLatency: 20                  // Connected to: latency monitoring
                                    // Purpose: Maximum acceptable MIDI latency (ms)
  }
};
