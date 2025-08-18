precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;

// Exposed parameters
uniform float frequency;     // Wave frequency [1..20]
uniform float amplitude;     // Wave amplitude [0.1..2.0]
uniform float speed;         // Animation speed [0..5]
uniform float distortion;    // UV distortion [0..1]
uniform float colorSpeed;    // Color cycling speed [0..3]

// Boolean effect toggles
uniform bool enableRadial;   // Enable radial wave effect
uniform bool enableDiagonal; // Enable diagonal wave effect
uniform bool enableColorPalette; // Enable color palette (vs grayscale)
uniform bool enablePulse;    // Enable pulsing intensity

varying vec2 vUv;

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 uv = vUv;
    
    // Remap parameters
    float freq = mix(1.0, 20.0, clamp(frequency, 0.0, 1.0));
    float amp = mix(0.1, 2.0, clamp(amplitude, 0.0, 1.0));
    float spd = mix(0.0, 5.0, clamp(speed, 0.0, 1.0));
    float dist = clamp(distortion, 0.0, 1.0);
    float colSpd = mix(0.0, 3.0, clamp(colorSpeed, 0.0, 1.0));
    
    // Apply distortion
    vec2 distortedUV = uv;
    if (dist > 0.0) {
        distortedUV += dist * 0.1 * vec2(
            sin(uv.y * 10.0 + time * spd * 0.5),
            cos(uv.x * 10.0 + time * spd * 0.3)
        );
    }
    
    // Multiple plasma waves
    float plasma = 0.0;
    
    // Wave 1: horizontal
    plasma += sin(distortedUV.x * freq + time * spd) * amp;
    
    // Wave 2: vertical
    plasma += sin(distortedUV.y * freq * 1.2 + time * spd * 0.8) * amp;
    
    // Wave 3: diagonal
    if (enableDiagonal) {
        plasma += sin((distortedUV.x + distortedUV.y) * freq * 0.8 + time * spd * 1.2) * amp;
    }
    
    // Wave 4: radial
    if (enableRadial) {
        float radius = length(distortedUV - 0.5);
        plasma += sin(radius * freq * 2.0 - time * spd * 2.0) * amp * 0.5;
    }
    
    // Normalize
    plasma = plasma * 0.25 + 0.5;
    
    // Add time-based color cycling (for palette only)
    float colorPhase = plasma + colSpd * time * 0.1;
    
    // Apply pulsing if enabled
    if (enablePulse) {
        plasma *= 0.5 + 0.5 * sin(time * 2.0);
    }
    
    // Apply color palette or grayscale
    vec3 color;
    if (enableColorPalette) {
        color = palette(colorPhase);
    } else {
        // keep grayscale in 0..1 range
        color = vec3(clamp(plasma, 0.0, 1.0));
    }
    
    gl_FragColor = vec4(color, opacity);
}
