import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MilkyWayGalaxy } from '../../src/graphics/galaxy/MilkyWay';
import { PlanetarySystemRenderer } from '../../src/graphics/system/SystemRenderer';
import { CinematicCameraController } from '../../src/graphics/camera/CameraController';
import { LightCurveGraph } from '../../src/ui/components/LightCurveGraph';
import { SearchIndexEngine } from '../../src/core/data/SearchIndex';
import { CoordinateTransformer } from '../../src/core/astronomy/coordinates';
import { ScientificVerdictEngine } from '../../src/core/physics/VerdictEngine';
import { RawExoplanetRecord } from '../../src/types/astronomy';
import rawCatalogData from '../../src/assets/data/exoplanet_catalog.json';

function createMockCanvas(): HTMLCanvasElement {
  return {
    width: 400,
    height: 150,
    getBoundingClientRect: () => ({ width: 400, height: 150, top: 0, left: 0, right: 400, bottom: 150, x: 0, y: 0 }),
    getContext: () => ({
      scale: () => {}, fillRect: () => {}, beginPath: () => {},
      moveTo: () => {}, lineTo: () => {}, stroke: () => {},
      fillText: () => {}, arc: () => {}, fill: () => {}
    })
  } as unknown as HTMLCanvasElement;
}

describe('CosmoScan PRD Core User Journeys E2E Integration', () => {
  const rawRecords = rawCatalogData as RawExoplanetRecord[];
  const dataset = rawRecords.slice(0, 100).map((r, i) => CoordinateTransformer.transformRecord(r, i));

  it('Journey 1: Macro Galaxy View loads with 150,000 particles at 60 FPS profile', () => {
    const galaxy = new MilkyWayGalaxy(150000);
    expect(galaxy.mesh.geometry.getAttribute('position').count).toBe(150000);
    galaxy.update(0.016); // 1 frame at 60 FPS
  });

  it('Journey 2: Search for target planet and initiate camera flight within 2.0s budget', () => {
    const index = new SearchIndexEngine();
    index.indexSystems(dataset);

    const matches = index.search('Kepler', 1);
    expect(matches.length).toBe(1);

    const target = matches[0];
    const camera = new THREE.PerspectiveCamera();
    const controls = { target: new THREE.Vector3(), enabled: true } as unknown as OrbitControls;
    const camController = new CinematicCameraController(camera, controls);

    const targetPos = new THREE.Vector3(
      target.coordinates.galacticX,
      target.coordinates.galacticY,
      target.coordinates.galacticZ
    );
    camController.flyTo(targetPos.clone().add(new THREE.Vector3(12, 8, 14)), targetPos, 1.8);
    expect(camController.isCurrentlyAnimating()).toBe(true);

    // After 1.8s flight, target position is reached
    camController.update(1.85);
    expect(camController.isCurrentlyAnimating()).toBe(false);
  });

  it('Journey 3: Orbit revolution triggers transit photometry and updates light curve', () => {
    const system = dataset[0];
    const sysRenderer = new PlanetarySystemRenderer();
    sysRenderer.loadSystem(system);

    const lightCurve = new LightCurveGraph(createMockCanvas());

    let transitOccurred = false;
    for (let frame = 0; frame < 60; frame++) {
      const { isTransiting, flux } = sysRenderer.update(0.1);
      lightCurve.pushFlux(flux, system.planetaryPhysics.transitDepthPercent);
      lightCurve.render(isTransiting);

      if (isTransiting) {
        transitOccurred = true;
        expect(flux).toBeLessThan(1.0);
      }
    }
    expect(transitOccurred).toBe(true);
  });

  it('Journey 4: Plain-language astrobiological verdict with formula disclosure', () => {
    const system = dataset[0];
    const verdict = ScientificVerdictEngine.evaluateSystem(system);

    expect(verdict.headline).toBeTruthy();
    expect(verdict.description).toBeTruthy();
    expect(verdict.calculationDisclosure).toBeTruthy();
    expect(verdict.badgeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});
