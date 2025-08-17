precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;
uniform float agentCount;
uniform float sensorDistance;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    float pattern = 0.0;
    for (int i = 0; i < 3; i++) {
        float angle = float(i) * 6.2831853 / 3.0;
        vec2 center = vec2(0.5) + vec2(cos(angle), sin(angle)) * 0.3;
        float dist = length(uv - center);
        float wave = sin(dist * 20.0 - time * 2.0) * exp(-dist * 3.0);
        pattern += wave * 0.3;
    }
    pattern += sin(uv.x * 15.0 + time * 1.5) * 0.2;
    pattern += sin(uv.y * 12.0 + time * 1.2) * 0.2;
    vec3 color = vec3(pattern * 0.5 + 0.5);
    gl_FragColor = vec4(color, opacity);
}


