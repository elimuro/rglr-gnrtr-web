precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;
uniform float trailDecay;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    float pattern = 0.0;
    float chem1 = sin(uv.x * 25.0 + time * 0.8) * 0.5 + 0.5;
    float chem2 = sin(uv.y * 20.0 + time * 0.6) * 0.5 + 0.5;
    pattern = chem1 * chem2;
    pattern += sin(uv.x * 40.0 + time * 0.4) * 0.3;
    pattern += sin(uv.y * 35.0 + time * 0.5) * 0.3;
    float spots = sin(uv.x * 60.0 + time * 0.3) * sin(uv.y * 45.0 + time * 0.4);
    pattern += spots * 0.2;
    vec3 color = vec3(pattern * 0.5 + 0.5);
    gl_FragColor = vec4(color, opacity);
}


