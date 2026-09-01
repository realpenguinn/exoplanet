# Phase 3.5 (Complete): Perspective-Dependent Galactic Color Grading

This is the finished version of what got cut off earlier — the previous draft stopped mid-sentence at the `midplaneCloseness` placeholder and never actually wired it, never delivered the core-bloom task, and never gave you a checkup matrix. This version is complete and ready to paste into Antigravity as-is. It modifies `MilkyWay.ts`, `galaxy.vert.glsl`, and `galaxy.frag.glsl` from Phase 3 in place.

One honesty note before the spec, so you're not surprised later: "exact clone" isn't literally achievable for the Milky Way specifically — no telescope has ever photographed it from outside, so there is no ground-truth image to match pixel-for-pixel. What follows is the standard approach used by planetarium software and NASA/ESA visualizations: a scientifically-constrained procedural galaxy whose *behavior* under camera movement matches how real spiral galaxies actually look from different angles (using edge-on spirals like NGC 891 as the physical reference for how dust reddening and midplane darkening behave). That's what makes it read as "real" rather than "a random particle cloud" — consistency of light physics under camera movement, not a fixed texture.

---

## Phase Objective

Give every particle in the galaxy mesh a color that responds correctly to two independent, physically-motivated factors, recomputed every frame as the camera moves:

1. **View-angle dust reddening/darkening** — face-on views show clean, blue-white spiral arms; edge-on views redden and darken along the midplane exactly like a real edge-on spiral photograph.
2. **Core-proximity bloom** — particles near the galactic center glow warm and bright regardless of viewing angle, since this is intrinsic stellar density/brightness, not a viewing artifact.

```
                    +-------------------------------------------------+
                    |     PERSPECTIVE-DEPENDENT COLOR PIPELINE         |
                    +-----------------------+---------------------------+
                                            |
               +----------------------------+----------------------------+
               v                            v                            v
+-----------------------------+ +-----------------------------+ +-----------------------------+
|  VIEW-ANGLE GRAZING FACTOR  | |  MIDPLANE DUST-LANE DARKEN  | |  CORE-PROXIMITY BLOOM        |
|  (camera-relative, per-frame)| |  (world-space Y, per-vertex)| |  (world-space radius, angle- |
|                              | |                              | |   independent)               |
+-----------------------------+ +-----------------------------+ +-----------------------------+
```

---

## Task 3.5.1: Pass World-Space Height and Camera Position Into the Shader

The missing piece from before: `midplaneCloseness` needs the particle's **world-space Y** (height above/below the galactic disk plane, where `y = 0` is the midplane) computed *after* rotation, not the raw attribute — because the galaxy rotates over time (`uTime`-driven), a particle's height relative to the disk plane doesn't change from rotation (rotation is around the Y axis), but its rotated X/Z position does, and we need both. Also pass the actual camera world position in as a uniform rather than trying to reconstruct it from `modelViewMatrix`, which is unreliable once additive blending and instancing are involved.

Update `MilkyWayGalaxy` in `src/graphics/galaxy/MilkyWay.ts` to feed the camera position uniform every frame:

```typescript
// Add to the constructor's uniforms block:
uniforms: {
  uTime: { value: 0 },
  uSizeMultiplier: { value: window.devicePixelRatio > 1 ? 1.4 : 1.8 },
  uCameraPosition: { value: new THREE.Vector3() }
},

// Add a new method, called once per frame from AppController's animate() loop,
// right alongside the existing galaxy.update(delta) call:
public updateCameraPosition(camera: THREE.PerspectiveCamera): void {
  this.material.uniforms.uCameraPosition.value.copy(camera.position);
}
```

In `AppController.ts`'s `animate()` method (Phase 7, Task 7.2), add the call immediately after `this.galaxy.update(delta)`:

```typescript
this.galaxy.update(delta);
this.galaxy.updateCameraPosition(this.camera); // NEW — required for Phase 3.5 color grading
```

---

## Task 3.5.2: Complete Vertex Shader — World-Space Position & Grazing Factor

Full, finished replacement for `src/assets/shaders/galaxy.vert.glsl`:

```glsl
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

    // World-space position, needed for both the grazing-angle calc and the
    // midplane/core calcs below. modelMatrix accounts for any group-level
    // transform applied to the galaxy mesh (there currently isn't one, but
    // this makes the shader correct even if one is added later).
    vec4 worldPosition = modelMatrix * vec4(rotatedPosition, 1.0);

    vec4 mvPosition = modelViewMatrix * vec4(rotatedPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // --- Grazing factor: how edge-on is the current view? ---
    // viewDir points FROM this particle's world position TOWARD the camera.
    vec3 viewDir = normalize(uCameraPosition - worldPosition.xyz);
    // If the view direction is nearly horizontal (viewDir.y close to 0),
    // the camera is looking edge-on through the disk. If viewDir.y is close
    // to +-1, the camera is looking straight down/up at the disk (face-on).
    vGrazingFactor = 1.0 - abs(viewDir.y);

    // --- Midplane closeness: is THIS PARTICLE near y=0? ---
    // The galactic disk's characteristic scale height is on the order of a
    // few scene units at this project's SCENE_DISTANCE_SCALE (Phase 2, Task 2.2).
    // A particle at y=0 gets 1.0; falls off smoothly to 0.0 by y=+-3.0.
    vMidplaneCloseness = 1.0 - clamp(abs(rotatedPosition.y) / 3.0, 0.0, 1.0);

    // --- Core proximity: angle-independent distance-based glow ---
    float distFromCenter = length(rotatedPosition);
    vCoreProximity = 1.0 - clamp(distFromCenter / 20.0, 0.0, 1.0);

    vDistToCamera = -mvPosition.z;
    gl_PointSize = (aScale * uSizeMultiplier) * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);
}
```

---

## Task 3.5.3: Complete Fragment Shader — Reddening, Midplane Darkening & Core Bloom

Full, finished replacement for `src/assets/shaders/galaxy.frag.glsl`. This is where the three varyings computed above actually get applied to the final pixel color:

```glsl
varying vec3 vColor;
varying float vDistToCamera;
varying float vGrazingFactor;
varying float vMidplaneCloseness;
varying float vCoreProximity;

void main() {
    // Circular point-sprite mask (unchanged from Phase 3).
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float intensity = exp(-dist * 8.0) + 0.3 * exp(-dist * 2.0);
    intensity = clamp(intensity, 0.0, 1.0);

    // --- Step 1: View-dependent dust reddening ---
    // Interstellar dust preferentially scatters blue light, so light that
    // travels a longer path through the dust lane (edge-on views) arrives
    // redder. This shifts color WITHOUT changing brightness yet.
    vec3 dustReddenedColor = vColor * vec3(1.15, 0.92, 0.78);

    // Reddening only matters where there IS dust to travel through: near the
    // midplane. A particle sitting well above/below the disk (vMidplaneCloseness
    // near 0) shows almost no reddening even at a fully edge-on angle, because
    // there's no dust lane at that height to travel through.
    float reddeningStrength = vGrazingFactor * vMidplaneCloseness;
    vec3 gradedColor = mix(vColor, dustReddenedColor, reddeningStrength);

    // --- Step 2: Midplane extinction darkening ---
    // Real edge-on spirals (e.g. NGC 891) show a visibly DARK lane cutting
    // across the disk — not just a color shift, an actual brightness drop,
    // because dust absorbs light outright, not just scatters it red.
    // This only bites when BOTH conditions hold: edge-on AND near the plane.
    float extinctionDarkening = reddeningStrength * 0.45;
    gradedColor *= (1.0 - extinctionDarkening);

    // --- Step 3: Core-proximity bloom ---
    // Independent of viewing angle — the galactic core is intrinsically
    // bright and warm (dense old stellar population) from every direction.
    vec3 coreGlowColor = vec3(1.0, 0.85, 0.65);
    gradedColor = mix(gradedColor, coreGlowColor, vCoreProximity * 0.5);
    float coreBrightnessBoost = 1.0 + vCoreProximity * 0.6;

    gl_FragColor = vec4(gradedColor * 1.3 * coreBrightnessBoost, intensity * 0.95);
}
```

### Why this specific ordering matters

Reddening is applied before darkening, and both are gated by `vMidplaneCloseness` — this is deliberate and matches the real physical picture: a photon is reddened *and* dimmed by passing through the same dust, so both effects should scale off the same underlying "how much dust did this light pass through" term (`reddeningStrength`), not two independently-tuned factors that could drift out of sync as you tweak them later. The core bloom is applied last and is explicitly *not* multiplied by `vGrazingFactor` or `vMidplaneCloseness` — the bulge glows from every angle, which is what makes the core read correctly whether you're looking at the galaxy face-on or edge-on.

---

## Task 3.5.4: Sanity-Check Reference Angles

Before wiring this into the full camera-fly system, verify these three camera positions produce visually distinct, physically sensible results — do this manually in the dev build before trusting the shader math:

| Camera position (scene units) | Expected look |
|---|---|
| `(0, 140, 0)` looking straight down (`viewDir.y ≈ -1`) | Fully face-on. `vGrazingFactor ≈ 0`. Spiral arms crisp and blue/cyan, core warm but not reddened, no visible dust lane as a dark band. |
| `(140, 0, 0)` looking straight in along the disk plane (`viewDir.y ≈ 0`) | Fully edge-on. `vGrazingFactor ≈ 1`. A visible warm-red darkened band should cut across the disk at `y=0`; particles above/below that band stay comparatively blue and bright. |
| `(0, 3, 0)` very close to the core, angle arbitrary | `vCoreProximity ≈ 1` regardless of the other two factors — should read as a warm, bright bloom overwhelming the local dust/reddening terms. |

If the edge-on case doesn't show a visibly darker band at the midplane compared to particles 5+ units above/below it, the most common bug is that `rotatedPosition.y` was swapped for the *unrotated* `position.y` somewhere, or `MATH_POOL`/`uCameraPosition` isn't actually being updated per-frame (check Task 3.5.1's `updateCameraPosition` call is really wired into `animate()`, not just defined).

---

## Phase 3.5 Checkup & Quality Gate Verification

```
[Phase 3.5 Checkup Matrix]
---------------------------------------------------------------------------------
ID       Verification Task                          Condition / Threshold          Status
---------------------------------------------------------------------------------
P3.5-C1  Camera Uniform Wired Per-Frame              uCameraPosition changes every  [PENDING]
                                                      frame, not just on init
P3.5-C2  Face-On Reference Angle                     vGrazingFactor < 0.1 at        [PENDING]
                                                      camera (0,140,0) looking down
P3.5-C3  Edge-On Reference Angle                     vGrazingFactor > 0.9 at        [PENDING]
                                                      camera (140,0,0) looking along
                                                      the disk plane
P3.5-C4  Visible Midplane Darkening                  Edge-on render shows measurably[PENDING]
                                                      lower pixel brightness at y=0
                                                      band vs y=+-5 band (screenshot
                                                      diff test)
P3.5-C5  Core Bloom Angle-Independence                vCoreProximity-driven color    [PENDING]
                                                      shift is identical at 3+
                                                      camera angles at same distance
                                                      from center
P3.5-C6  No Reddening Without Dust Proximity           A particle with                [PENDING]
                                                      vMidplaneCloseness ≈ 0 shows
                                                      negligible reddening even at
                                                      vGrazingFactor ≈ 1
P3.5-C7  Frame Budget Preserved                       Adding this shader work does   [PENDING]
                                                      not drop FPS below the Phase 0/
                                                      Phase 8 60 FPS budget
---------------------------------------------------------------------------------
```

Verification approach for `P3.5-C4` (visible midplane darkening) since it's the one claim that's genuinely hard to unit-test and needs a visual check: render the galaxy from the edge-on reference angle in Task 3.5.4, take a screenshot, sample average pixel luminance in a thin horizontal strip at screen-center (the midplane) versus a strip offset well above it, and assert the midplane strip is measurably darker (e.g., >15% lower average luminance). This can be scripted with Playwright's screenshot + a small Node-side pixel-sampling script, or checked manually and recorded in the phase sign-off note — either is acceptable, but it must actually be looked at, not assumed from the shader math alone.
