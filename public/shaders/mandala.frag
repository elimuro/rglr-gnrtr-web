precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;

// Exposed parameters
uniform float complexity;    // Pattern complexity [2..8]
uniform float pulseSpeed;    // Pulse animation speed [0..3]
uniform float innerRadius;   // Inner radius [0.1..0.8]
uniform float brightness;    // Overall brightness [0.2..2.0]
uniform float colorCycle;    // Color cycling [0..1]

// Boolean effect toggles
uniform bool enablePulse;    // Enable pulse animation
uniform bool enableColorCycle; // Enable color cycling
uniform bool enableInnerRadius; // Enable inner radius cutoff
uniform bool enableFadeEdges; // Enable edge fading

varying vec2 vUv;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 uv = vUv - 0.5;
    float aspect = resolution.x / resolution.y;
    uv.x *= aspect;
    
    // Remap parameters
    float comp = mix(2.0, 8.0, clamp(complexity, 0.0, 1.0));
    float pulse = mix(0.0, 3.0, clamp(pulseSpeed, 0.0, 1.0));
    float innerR = mix(0.1, 0.8, clamp(innerRadius, 0.0, 1.0));
    float bright = mix(0.2, 2.0, clamp(brightness, 0.0, 1.0));
    
    // Polar coordinates
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    
    // Mandala pattern
    float mandala = 0.0;
    
    // Multiple layers of patterns
    for (float i = 1.0; i <= 6.0; i++) {
        if (i > comp) break;
        
        float layerAngle = angle * i;
        float layerRadius = radius * (1.0 + 0.2 * i);
        
        // Petal-like shapes
        float petals = sin(layerAngle);
        if (enablePulse) {
            petals += time * pulse * 0.5;
        }
        petals = petals * 0.5 + 0.5;
        
        // Radial waves
        float waves = sin(layerRadius * 10.0);
        if (enablePulse) {
            waves -= time * pulse;
        }
        waves = waves * 0.5 + 0.5;
        
        // Combine patterns with different weights
        float layer = petals * waves * (1.0 / i);
        
        // Apply inner radius cutoff
        if (enableInnerRadius) {
            layer *= smoothstep(innerR, innerR + 0.1, radius);
        }
        
        // Fade out at edges
        if (enableFadeEdges) {
            layer *= 1.0 - smoothstep(0.4, 0.5, radius);
        }
        
        mandala += layer;
    }
    
    // Normalize and enhance
    mandala = clamp(mandala * bright, 0.0, 1.0);
    
    // Color with cycling hue
    float hue = radius * 2.0 + angle * 0.1;
    if (enableColorCycle) {
        hue += colorCycle * time * 0.2;
    }
    float sat = 0.7 + 0.3 * sin(time * 0.3);
    float val = mandala;
    
    vec3 color = hsv2rgb(vec3(hue, sat, val));
    
    gl_FragColor = vec4(color, opacity);
}
