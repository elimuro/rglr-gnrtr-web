precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;

// Exposed parameters
uniform float cellCount;     // Number of cells [4..20]
uniform float animSpeed;     // Animation speed [0..2]
uniform float cellSize;      // Cell size variation [0.5..2.0]
uniform float edgeWidth;     // Edge thickness [0..0.2]
uniform float colorVariation; // Color variation [0..1]

// Boolean effect toggles
uniform bool enableAnimation; // Enable cell animation
uniform bool enableEdges;    // Enable edge highlighting
uniform bool enableColorVariation; // Enable color variation over time
uniform bool enablePulse;    // Enable pulsing intensity

varying vec2 vUv;

vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 uv = vUv;
    
    // Remap parameters
    float cells = mix(4.0, 20.0, clamp(cellCount, 0.0, 1.0));
    float speed = mix(0.0, 2.0, clamp(animSpeed, 0.0, 1.0));
    float size = mix(0.5, 2.0, clamp(cellSize, 0.0, 1.0));
    float edge = mix(0.0, 0.2, clamp(edgeWidth, 0.0, 1.0));
    
    // Scale UV for cell density
    vec2 scaledUV = uv * cells;
    
    // Find closest cell centers
    vec2 gridPos = floor(scaledUV);
    vec2 localPos = fract(scaledUV);
    
    float minDist = 2.0;
    float secondMinDist = 2.0;
    vec2 closestPoint;
    
    // Check surrounding cells
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 cellCenter = neighbor + gridPos;
            
            // Animate cell centers
            vec2 offset = hash22(cellCenter) * size;
            if (enableAnimation) {
                offset += 0.3 * sin(time * speed + cellCenter.x * 2.0 + cellCenter.y * 3.0);
            }
            
            vec2 cellPos = neighbor + 0.5 + offset * 0.4;
            float dist = length(localPos - cellPos);
            
            if (dist < minDist) {
                secondMinDist = minDist;
                minDist = dist;
                closestPoint = cellCenter;
            } else if (dist < secondMinDist) {
                secondMinDist = dist;
            }
        }
    }
    
    // Create Voronoi pattern
    float voronoi = minDist;
    float edges = secondMinDist - minDist;
    
    // Color based on cell ID
    vec2 cellId = closestPoint;
    float cellHash = fract(sin(dot(cellId, vec2(127.1, 311.7))) * 43758.5453);
    
    // Create color variation
    float hue = cellHash;
    if (enableColorVariation) {
        hue += colorVariation * time * 0.1;
    }
    float sat = 0.6 + 0.4 * sin(cellHash * 6.28 + time * 0.5);
    float val = 0.7 + 0.3 * cos(cellHash * 12.56 + time * 0.3);
    
    // Apply pulsing if enabled
    if (enablePulse) {
        val *= 0.5 + 0.5 * sin(time * 2.5);
    }
    
    vec3 cellColor = hsv2rgb(vec3(hue, sat, val));
    
    // Add edge highlighting
    if (enableEdges && edge > 0.0) {
        float edgeMask = smoothstep(0.0, edge, edges);
        cellColor = mix(vec3(1.0), cellColor, edgeMask);
    }
    
    gl_FragColor = vec4(cellColor, opacity);
}
