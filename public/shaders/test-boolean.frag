precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;

// Boolean parameters for testing MIDI note mapping
uniform bool enableWarp;      // Enable UV warping
uniform bool enableNoise;     // Enable noise effect
uniform bool enableColorShift; // Enable color shifting
uniform bool enablePulse;     // Enable pulsing effect

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    
    // Apply warping if enabled
    if (enableWarp) {
        uv += 0.1 * sin(uv * 10.0 + time) * cos(uv * 8.0 - time * 0.5);
    }
    
    // Apply noise if enabled
    float noise = 0.0;
    if (enableNoise) {
        noise = sin(uv.x * 100.0 + time) * sin(uv.y * 100.0 + time) * 0.1;
    }
    
    // Apply color shift if enabled
    vec3 color = vec3(0.5);
    if (enableColorShift) {
        color = vec3(
            0.5 + 0.5 * sin(time + uv.x * 6.28),
            0.5 + 0.5 * sin(time + uv.y * 6.28 + 2.094),
            0.5 + 0.5 * sin(time + (uv.x + uv.y) * 6.28 + 4.188)
        );
    }
    
    // Apply pulsing if enabled
    float pulse = 1.0;
    if (enablePulse) {
        pulse = 0.5 + 0.5 * sin(time * 2.0);
    }
    
    // Combine effects
    color += noise;
    color *= pulse;
    
    gl_FragColor = vec4(color, opacity);
}
