precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;

// Exposed parameters
uniform float segments;      // Number of kaleidoscope segments [3..12]
uniform float rotation;      // Rotation speed [-2..2]
uniform float zoom;          // Zoom level [0.1..3.0]
uniform float colorShift;    // Color shifting [0..1]
uniform float symmetry;      // Symmetry intensity [0..1]

varying vec2 vUv;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    
    // Remap parameters to useful ranges
    float segs = mix(3.0, 12.0, clamp(segments, 0.0, 1.0));
    float rotSpeed = mix(-2.0, 2.0, clamp(rotation, 0.0, 1.0));
    float zoomLevel = mix(0.1, 3.0, clamp(zoom, 0.0, 1.0));
    
    // Convert to polar coordinates
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    
    // Apply rotation
    angle += time * rotSpeed;
    
    // Create kaleidoscope effect
    angle = mod(angle, 2.0 * 3.14159 / segs);
    if (mod(floor(angle / (3.14159 / segs)), 2.0) == 1.0) {
        angle = (3.14159 / segs) - mod(angle, 3.14159 / segs);
    }
    
    // Apply symmetry
    angle = mix(angle, abs(angle), clamp(symmetry, 0.0, 1.0));
    
    // Convert back to cartesian with zoom
    vec2 pos = vec2(cos(angle), sin(angle)) * radius * zoomLevel;
    
    // Create pattern
    float pattern1 = sin(pos.x * 8.0 + time * 0.5) * cos(pos.y * 8.0 + time * 0.3);
    float pattern2 = sin(length(pos) * 15.0 - time * 2.0);
    float combined = pattern1 * pattern2;
    
    // Color mapping with hue shift
    float hue = combined * 0.5 + 0.5 + colorShift * time * 0.1;
    float sat = 0.8;
    float val = 0.5 + 0.5 * combined;
    
    vec3 color = hsv2rgb(vec3(hue, sat, val));
    
    gl_FragColor = vec4(color, opacity);
}
