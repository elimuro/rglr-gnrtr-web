precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;
uniform float agentCount;
uniform float trailDecay;
uniform float sensorDistance;

// Boolean effect toggles
uniform bool enableBranches; // Enable branching patterns
uniform bool enableDetail;   // Enable detail noise
uniform bool enableColor;    // Enable color variation
uniform bool enablePulse;    // Enable pulsing intensity

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    float pattern = 0.0;
    
    // Generate branching patterns
    if (enableBranches) {
        for (int i = 0; i < 5; i++) {
            float angle = float(i) * 6.2831853 / 5.0;
            vec2 offset = vec2(cos(angle), sin(angle)) * 0.1;
            float branch = sin(uv.x * 20.0 + time * 0.5 + angle) *
                          sin(uv.y * 20.0 + time * 0.3 + angle);
            pattern += branch * 0.2;
        }
    }
    
    // Add detail noise
    if (enableDetail) {
        pattern += sin(uv.x * 50.0 + time * 0.2) * 0.1;
        pattern += sin(uv.y * 30.0 + time * 0.4) * 0.1;
    }
    
    // Apply pulsing if enabled
    if (enablePulse) {
        pattern *= 0.5 + 0.5 * sin(time * 2.0);
    }
    
    // Create color
    vec3 color;
    if (enableColor) {
        color = vec3(
            pattern * 0.5 + 0.5,
            pattern * 0.3 + 0.7,
            pattern * 0.7 + 0.3
        );
    } else {
        color = vec3(pattern * 0.5 + 0.5);
    }
    
    gl_FragColor = vec4(color, opacity);
}


