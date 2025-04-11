uniform vec3 uBaseColor;
uniform vec3 uGlowColor;
uniform float uGlowIntensity;
uniform float uGlowFalloff;
uniform float uFresnelPower;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    // Normalize normal and view direction
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // Calculate Fresnel term
    float fresnel = pow(1.0 - dot(normal, viewDir), uFresnelPower);

    // Calculate glow based on Fresnel and intensity
    float glow = uGlowIntensity * fresnel;

    // Combine base color with glow color
    vec3 color = mix(uBaseColor, uGlowColor, glow);

    gl_FragColor = vec4(color, 1.0);
}
