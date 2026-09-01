import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { MilkyWayGalaxy } from '../../src/graphics/galaxy/MilkyWay';
import { detectParticleTier } from '../../src/graphics/galaxy/particleTier';

describe('MilkyWayGalaxy Particle Mesh & Shader Integrity', () => {
  it('instantiates 150,000 unique particle coordinates at default FULL tier', () => {
    const galaxy = new MilkyWayGalaxy();
    const posAttr = galaxy.mesh.geometry.getAttribute('position');
    expect(posAttr.count).toBe(150000);
    expect(posAttr.itemSize).toBe(3);
  });

  it('populates vertex color and scale buffers with valid ranges', () => {
    const galaxy = new MilkyWayGalaxy();
    const colorAttr = galaxy.mesh.geometry.getAttribute('aColor');
    const scaleAttr = galaxy.mesh.geometry.getAttribute('aScale');

    expect(colorAttr.count).toBe(150000);
    expect(scaleAttr.count).toBe(150000);

    for (let i = 0; i < 1000; i++) {
      expect(scaleAttr.getX(i)).toBeGreaterThan(0.0);
      expect(colorAttr.getX(i)).toBeLessThanOrEqual(1.5);
    }
  });

  it('correctly adapts particle count on REDUCED (60k) and MINIMAL (20k) tiers', () => {
    const reducedGalaxy = new MilkyWayGalaxy(60000);
    expect(reducedGalaxy.mesh.geometry.getAttribute('position').count).toBe(60000);

    const minimalGalaxy = new MilkyWayGalaxy(20000);
    expect(minimalGalaxy.mesh.geometry.getAttribute('position').count).toBe(20000);
  });

  it('manages uCameraPosition uniform for Phase 3.5 color grading', () => {
    const galaxy = new MilkyWayGalaxy();
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 140, 0);

    galaxy.updateCameraPosition(camera);
    const uPos = (galaxy.mesh.material as THREE.ShaderMaterial).uniforms.uCameraPosition.value;
    expect(uPos.y).toBe(140);
    expect(uPos.x).toBe(0);
    expect(uPos.z).toBe(0);
  });

  it('detects default tier when GL context is not provided', () => {
    const tierConfig = detectParticleTier(null);
    expect(tierConfig.particleBudget).toBeGreaterThanOrEqual(60000);
  });
});
