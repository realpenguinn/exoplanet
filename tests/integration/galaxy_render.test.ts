import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { MilkyWayGalaxy } from '../../src/graphics/galaxy/MilkyWay';
import { detectParticleTier } from '../../src/graphics/galaxy/particleTier';

describe('MilkyWayGalaxy 500,000 Particle Mesh & Shader Integrity', () => {
  it('instantiates 500,000 unique particle coordinates at default FULL tier', () => {
    const galaxy = new MilkyWayGalaxy();
    const posAttr = galaxy.mesh.geometry.getAttribute('position');
    expect(posAttr.count).toBe(500000);
    expect(posAttr.itemSize).toBe(3);
  });

  it('populates vertex color and size buffers with valid ranges', () => {
    const galaxy = new MilkyWayGalaxy();
    const colorAttr = galaxy.mesh.geometry.getAttribute('color');
    const sizeAttr = galaxy.mesh.geometry.getAttribute('size');

    expect(colorAttr.count).toBe(500000);
    expect(sizeAttr.count).toBe(500000);

    for (let i = 0; i < 1000; i++) {
      expect(sizeAttr.getX(i)).toBeGreaterThan(0.0);
      expect(colorAttr.getX(i)).toBeLessThanOrEqual(1.5);
    }
  });

  it('correctly adapts particle count on REDUCED (150k) and MINIMAL (50k) tiers', () => {
    const reducedGalaxy = new MilkyWayGalaxy(150000);
    expect(reducedGalaxy.mesh.geometry.getAttribute('position').count).toBe(150000);

    const minimalGalaxy = new MilkyWayGalaxy(50000);
    expect(minimalGalaxy.mesh.geometry.getAttribute('position').count).toBe(50000);
  });

  it('manages uCameraPosition uniform for perspective color grading', () => {
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
    expect(tierConfig.particleBudget).toBe(500000);
  });
});
