precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;
uniform float agentCount;
uniform float sensorDistance;

// Boolean effect toggles
uniform bool enableAgents;   // Enable agent movement
uniform bool enableWaves;    // Enable wave patterns
uniform bool enableColor;    // Enable color variation
uniform bool enablePulse;    // Enable pulsing intensity

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    float pattern = 0.0;
    
    // Generate agent movement patterns
    if (enableAgents) {
        for (int i = 0; i < 3; i++) {
            float angle = float(i) * 6.2831853 / 3.0;
            vec2 center = vec2(0.5) + vec2(cos(angle), sin(angle)) * 0.3;
            float dist = length(uv - center);
            float wave = sin(dist * 20.0 - time * 2.0) * exp(-dist * 3.0);
            pattern += wave * 0.3;
        }
    }
    
    // Add wave patterns
    if (enableWaves) {
        pattern += sin(uv.x * 15.0 + time * 1.5) * 0.2;
        pattern += sin(uv.y * 12.0 + time * 1.2) * 0.2;
    }
    
    // Apply pulsing if enabled
    if (enablePulse) {
        pattern *= 0.5 + 0.5 * sin(time * 2.5);
    }
    
    // Create color
    vec3 color;
    if (enableColor) {
        color = vec3(
            pattern * 0.6 + 0.4,
            pattern * 0.4 + 0.6,
            pattern * 0.8 + 0.2
        );
    } else {
        color = vec3(pattern * 0.5 + 0.5);
    }
    
    gl_FragColor = vec4(color, opacity);
}


