precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;

// Exposed parameters
uniform float scale;         // Noise scale [1..20]
uniform float speed;         // Animation speed [0..2]
uniform float contrast;      // Contrast [0.5..2.0]

// Boolean effect toggles
uniform bool enableAnimation; // Enable noise animation
uniform bool enableColor;    // Enable color variation
uniform bool enablePulse;    // Enable pulsing intensity

varying vec2 vUv;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    vec2 uv = vUv;
    
    // Remap parameters
    float noiseScale = mix(1.0, 20.0, clamp(scale, 0.0, 1.0));
    float animSpeed = mix(0.0, 2.0, clamp(speed, 0.0, 1.0));
    float contrastLevel = mix(0.5, 2.0, clamp(contrast, 0.0, 1.0));
    
    // Generate noise
    vec2 noiseUV = uv * noiseScale;
    if (enableAnimation) {
        noiseUV += time * animSpeed;
    }
    float noise = smoothNoise(noiseUV);
    
    // Apply contrast
    noise = pow(noise, contrastLevel);
    
    // Apply pulsing if enabled
    if (enablePulse) {
        noise *= 0.5 + 0.5 * sin(time * 3.0);
    }
    
    // Create color
    vec3 color;
    if (enableColor) {
        color = vec3(
            smoothNoise(noiseUV + vec2(0.1, 0.0)),
            smoothNoise(noiseUV + vec2(0.0, 0.1)),
            smoothNoise(noiseUV + vec2(0.1, 0.1))
        );
    } else {
        color = vec3(noise);
    }
    
    gl_FragColor = vec4(color, opacity);
}


