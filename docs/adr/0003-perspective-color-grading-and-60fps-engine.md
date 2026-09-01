# 3. Dynamic Perspective Color Grading & 60 FPS Zero-Allocation Math Loop

Date: 2026-09-02

## Status
Accepted

## Context
Rendering 150,000 Milky Way star particles and streaming transit photometry must run at a sustained 60 FPS without garbage collection stutter or thermal throttling on integrated GPUs. Furthermore, realistic galactic dust extinction requires view-dependent darkening when looking through the galactic midplane disk.

## Decision
1. Implemented custom GLSL vertex and fragment shaders calculating grazing view factor $(1 - |\hat{v}_y|)$, midplane proximity, and dust reddening.
2. Implemented `MathPool` static registers (`v1, v2, v3, m1, q1, col1`) eliminating dynamic heap allocations in `requestAnimationFrame`.
3. Restricted hardware DPR to a ceiling of 2.0.
4. Dedicated an instanced raycast target layer (`TargetNodes`) so raycasting never intersects the 150,000 background star particles.
5. Rendered real-time photometric light curves via Canvas 2D with a fixed 160-point circular ring buffer executing in $< 1.5$ms.

## Consequences
- 60 FPS sustained animation loop.
- No Garbage Collection frame drops.
- Stunning, scientifically grounded visual appearance from both macro and micro viewpoints.
