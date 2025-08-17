precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;

// Simple test parameters for blend mode testing
uniform float colorShift;    // [0..1] - shifts through rainbow colors
uniform float pattern;       // [0..1] - changes pattern type
uniform float intensity;     // [0..1] - brightness multiplier

varying vec2 vUv;

void main() {
    // Centered UV coordinates
    vec2 uv = vUv - 0.5;
    
    // Create different test patterns based on the pattern parameter
    float patternValue = 0.0;
    
    if (pattern < 0.25) {
        // Radial gradient
        patternValue = length(uv);
    } else if (pattern < 0.5) {
        // Horizontal stripes
        patternValue = sin(uv.y * 20.0 + time) * 0.5 + 0.5;
    } else if (pattern < 0.75) {
        // Checkerboard
        vec2 grid = floor(uv * 10.0);
        patternValue = mod(grid.x + grid.y, 2.0);
    } else {
        // Circular waves
        patternValue = sin(length(uv) * 15.0 - time * 3.0) * 0.5 + 0.5;
    }
    
    // Create rainbow colors based on colorShift
    float hue = colorShift + patternValue * 0.5;
    vec3 color = vec3(
        sin(hue * 6.28318) * 0.5 + 0.5,
        sin((hue + 0.33) * 6.28318) * 0.5 + 0.5,
        sin((hue + 0.66) * 6.28318) * 0.5 + 0.5
    );
    
    // Apply intensity
    color *= mix(0.3, 1.0, intensity);
    
    gl_FragColor = vec4(color, opacity);
}
