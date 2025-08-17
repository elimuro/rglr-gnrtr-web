precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;

// Exposed parameters (0..1 sliders in UI)
uniform float scaleParam;   // remapped to [8, 24]
uniform float speedParam;   // remapped to [0.5, 3.0]
uniform float contrastParam; // remapped to [0.8, 2.0]
uniform vec2 warp;          // remapped to [-0.4, 0.4]

varying vec2 vUv;

void main() {
    // Centered UV for nicer transforms
    vec2 uv = vUv - 0.5;

    // Remap normalized UI params to useful ranges
    float scale = mix(8.0, 24.0, clamp(scaleParam, 0.0, 1.0));
    float speed = mix(0.5, 3.0, clamp(speedParam, 0.0, 1.0));
    float contrast = mix(0.8, 2.0, clamp(contrastParam, 0.0, 1.0));
    vec2 w = (clamp(warp, 0.0, 1.0) - 0.5) * 0.8; // [-0.4, 0.4]

    // Mild UV warp for motion
    vec2 p = uv;
    p += vec2(
        sin((uv.y + w.y) * scale + time * speed),
        cos((uv.x + w.x) * scale - time * speed)
    ) * 0.05;

    // Interfering wave pattern
    float a = sin((p.x + p.y) * scale + time * speed);
    float b = cos((p.x - p.y) * (scale * 0.8) - time * speed * 1.2);
    float pattern = a * b;

    // Normalize to 0..1 and apply simple contrast curve
    pattern = 0.5 + 0.5 * pattern;
    pattern = pow(pattern, contrast);

    // Add a subtle color shift field
    vec3 field = vec3(
        0.5 + 0.5 * sin(6.2831 * (p.x) + time * 0.2),
        0.5 + 0.5 * sin(6.2831 * (p.y) + time * 0.15),
        0.5 + 0.5 * sin(6.2831 * (p.x + p.y) + time * 0.1)
    );

    vec3 color = mix(field, vec3(pattern), 0.6);
    gl_FragColor = vec4(color, opacity);
}


