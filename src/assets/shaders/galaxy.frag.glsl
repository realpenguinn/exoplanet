varying vec3 vColor;
varying float vDistToCamera;
varying float vGrazingFactor;
varying float vMidplaneCloseness;
varying float vCoreProximity;

void main() {
    // Circular point-sprite mask
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float intensity = exp(-dist * 8.0) + 0.3 * exp(-dist * 2.0);
    intensity = clamp(intensity, 0.0, 1.0);

    // --- Step 1: View-dependent dust reddening ---
    // Interstellar dust preferentially scatters blue light, so light traveling edge-on arrives redder.
    vec3 dustReddenedColor = vColor * vec3(1.15, 0.92, 0.78);

    // Reddening only applies where there is midplane dust
    float reddeningStrength = vGrazingFactor * vMidplaneCloseness;
    vec3 gradedColor = mix(vColor, dustReddenedColor, reddeningStrength);

    // --- Step 2: Midplane extinction darkening ---
    // Edge-on spirals show an absorption dust lane cutting through y=0.
    float extinctionDarkening = reddeningStrength * 0.45;
    gradedColor *= (1.0 - extinctionDarkening);

    // --- Step 3: Core-proximity bloom ---
    // Intrinsic stellar core luminosity from old stars — angle-independent.
    vec3 coreGlowColor = vec3(1.0, 0.85, 0.65);
    gradedColor = mix(gradedColor, coreGlowColor, vCoreProximity * 0.5);
    float coreBrightnessBoost = 1.0 + vCoreProximity * 0.6;

    gl_FragColor = vec4(gradedColor * 1.3 * coreBrightnessBoost, intensity * 0.95);
}
