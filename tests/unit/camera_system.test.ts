import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CinematicCameraController } from '../../src/graphics/camera/CameraController';
import { PlanetarySystemRenderer } from '../../src/graphics/system/SystemRenderer';
import { CoordinateTransformer } from '../../src/core/astronomy/coordinates';
import { RawExoplanetRecord } from '../../src/types/astronomy';

// Minimal mock dom element for OrbitControls in Node environment
const mockDomElement = {
  style: { touchAction: '' },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  getRootNode: () => ({ addEventListener: () => {}, removeEventListener: () => {} })
} as unknown as HTMLElement;

describe('CinematicCameraController & PlanetarySystemRenderer', () => {
  const mockKepler186f: RawExoplanetRecord = {
    pl_name: 'Kepler-186 f',
    hostname: 'Kepler-186',
    ra: 298.65,
    dec: 44.62,
    sy_dist: 178.5,
    pl_rade: 1.17,
    pl_orbper: 129.944,
    pl_trandep: 0.05,
    st_teff: 3788,
    st_rad: 0.52
  };

  it('interpolates camera flight with smoothstep curve and terminates cleanly', () => {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 100, 100);
    const controls = new OrbitControls(camera, mockDomElement);

    const controller = new CinematicCameraController(camera, controls);
    const dest = new THREE.Vector3(25, 10, 15);
    const target = new THREE.Vector3(25, 0, 15);

    controller.flyTo(dest, target, 1.0);
    expect(controller.isCurrentlyAnimating()).toBe(true);

    // Halfway update (0.5s)
    controller.update(0.5);
    expect(controller.isCurrentlyAnimating()).toBe(true);
    // Smoothstep: 3*(0.5)^2 - 2*(0.5)^3 = 3*0.25 - 2*0.125 = 0.75 - 0.25 = 0.5
    expect(controller.getAnimationProgress()).toBeCloseTo(0.5, 2);

    // Completion update (0.6s more -> 1.1s total)
    controller.update(0.6);
    expect(controller.isCurrentlyAnimating()).toBe(false);
    expect(camera.position.x).toBeCloseTo(dest.x, 2);
    expect(camera.position.y).toBeCloseTo(dest.y, 2);
    expect(camera.position.z).toBeCloseTo(dest.z, 2);
  });

  it('renders planetary system and detects photometric transit when planet crosses star', () => {
    const system = CoordinateTransformer.transformRecord(mockKepler186f, 0);
    const renderer = new PlanetarySystemRenderer();
    renderer.loadSystem(system);

    expect(renderer.group.visible).toBe(true);
    expect(renderer.group.position.x).toBeCloseTo(system.coordinates.galacticX, 2);

    // Advance orbits over multiple steps to simulate planetary revolution
    let detectedTransit = false;
    for (let t = 0; t < 100; t++) {
      const state = renderer.update(0.1);
      if (state.isTransiting) {
        detectedTransit = true;
        expect(state.flux).toBeLessThan(1.0);
        expect(state.flux).toBeGreaterThan(0.9);
        break;
      }
    }
    expect(detectedTransit).toBe(true);
    renderer.dispose();
  });
});
