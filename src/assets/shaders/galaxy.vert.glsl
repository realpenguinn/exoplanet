attribute float aScale;
attribute vec3 aColor;

varying vec3 vColor;
varying float vDistToCamera;
varying float vGrazingFactor;     // 0.0 = face-on view, 1.0 = edge-on view
varying float vMidplaneCloseness; // 1.0 = sitting exactly on the disk plane (y=0), 0.0 = far above/below
varying float vCoreProximity;     // 1.0 = at galactic center, 0.0 = far from center

uniform float uTime;
uniform float uSizeMultiplier;
uniform vec3 uCameraPosition;

void main() {
    vColor = aColor;

    // Differential galactic rotation: inner orbits rotate faster than outer orbits.
    float r = length(position.xz);
    float vRot = 0.0004 * (1.0 / (1.0 + r * 0.02));
    float angle = uTime * vRot;

    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 rotatedXZ = rot * position.xz;
    vec3 rotatedPosition = vec3(rotatedXZ.x, position.y, rotatedXZ.y);

    // World-space position, needed for both grazing-angle and midplane/core calculations
    vec4 worldPosition = modelMatrix * vec4(rotatedPosition, 1.0);

    vec4 mvPosition = modelViewMatrix * vec4(rotatedPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // --- Grazing factor: how edge-on is the current view? ---
    vec3 viewDir = normalize(uCameraPosition - worldPosition.xyz);
    // If viewDir.y close to 0, looking edge-on through disk. If viewDir.y is +-1, looking face-on.
    vGrazingFactor = 1.0 - abs(viewDir.y);

    // --- Midplane closeness: is THIS PARTICLE near y=0? ---
    // A particle at y=0 gets 1.0; falls off smoothly to 0.0 by y=+-3.0 scene units.
    vMidplaneCloseness = 1.0 - clamp(abs(rotatedPosition.y) / 3.0, 0.0, 1.0);

    // --- Core proximity: angle-independent distance-based glow ---
    float distFromCenter = length(rotatedPosition);
    vCoreProximity = 1.0 - clamp(distFromCenter / 20.0, 0.0, 1.0);

    vDistToCamera = -mvPosition.z;
    gl_PointSize = (aScale * uSizeMultiplier) * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);
}
