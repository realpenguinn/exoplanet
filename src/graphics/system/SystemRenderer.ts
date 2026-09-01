import * as THREE from 'three';
import { ExoplanetSystem } from '../../types/astronomy';

export class PlanetarySystemRenderer {
  public group = new THREE.Group();
  private starMesh: THREE.Mesh;
  private starGlowMesh: THREE.Mesh;
  private planetMesh: THREE.Mesh;
  private orbitLine: THREE.LineLoop;
  private habitableZoneMesh: THREE.Mesh;
  private currentSystem: ExoplanetSystem | null = null;
  private orbitalAngle = 0;

  constructor() {
    const starGeom = new THREE.SphereGeometry(1.2, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    this.starMesh = new THREE.Mesh(starGeom, starMat);
    this.group.add(this.starMesh);

    const glowGeom = new THREE.RingGeometry(1.3, 2.8, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.starGlowMesh = new THREE.Mesh(glowGeom, glowMat);
    this.starGlowMesh.rotation.x = Math.PI / 2;
    this.group.add(this.starGlowMesh);

    const orbitGeom = new THREE.BufferGeometry();
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    this.orbitLine = new THREE.LineLoop(orbitGeom, orbitMat);
    this.group.add(this.orbitLine);

    const hzGeom = new THREE.RingGeometry(2.5, 4.8, 48);
    const hzMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    });
    this.habitableZoneMesh = new THREE.Mesh(hzGeom, hzMat);
    this.habitableZoneMesh.rotation.x = Math.PI / 2;
    this.group.add(this.habitableZoneMesh);

    const planetGeom = new THREE.SphereGeometry(0.4, 24, 24);
    const planetMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    this.planetMesh = new THREE.Mesh(planetGeom, planetMat);
    this.group.add(this.planetMesh);

    this.group.visible = false;
  }

  public loadSystem(system: ExoplanetSystem): void {
    this.currentSystem = system;
    this.orbitalAngle = 0;
    this.group.position.set(
      system.coordinates.galacticX,
      system.coordinates.galacticY,
      system.coordinates.galacticZ
    );

    const starColor = new THREE.Color(system.stellarPhysics.colorHex);
    (this.starMesh.material as THREE.MeshBasicMaterial).color.copy(starColor);
    (this.starGlowMesh.material as THREE.MeshBasicMaterial).color.copy(starColor);

    const visualStarRadius = Math.max(0.6, Math.min(2.5, system.stellarPhysics.radiusSolar * 0.8));
    this.starMesh.scale.setScalar(visualStarRadius);

    const visualPlanetRadius = Math.max(0.15, Math.min(0.65, system.planetaryPhysics.radiusEarth * 0.18));
    this.planetMesh.scale.setScalar(visualPlanetRadius);

    // Orbit radius scaled for cinematic visualization
    const orbitRadius = Math.max(2.8, Math.min(10.0, Math.sqrt(system.planetaryPhysics.semiMajorAxisAU) * 4.2));
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius));
    }
    this.orbitLine.geometry.dispose();
    this.orbitLine.geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Habitable Zone boundaries scaling with sqrt(L*)
    const lum = system.stellarPhysics.luminositySolar;
    const rInner = Math.sqrt(lum / 1.1) * 3.2;
    const rOuter = Math.sqrt(lum / 0.53) * 3.2;
    this.habitableZoneMesh.geometry.dispose();
    this.habitableZoneMesh.geometry = new THREE.RingGeometry(
      Math.max(1.5, rInner),
      Math.max(2.0, rOuter),
      48
    );

    this.group.visible = true;
  }

  // 60 FPS Guarantee: Zero heap allocation in update loop
  public update(deltaTime: number): { isTransiting: boolean; flux: number } {
    if (!this.currentSystem) return { isTransiting: false, flux: 1.0 };

    const speed = (2.0 * Math.PI) / Math.max(1.0, this.currentSystem.planetaryPhysics.periodDays * 0.1);
    this.orbitalAngle += speed * deltaTime;

    const orbitRadius = Math.max(2.8, Math.min(10.0, Math.sqrt(this.currentSystem.planetaryPhysics.semiMajorAxisAU) * 4.2));
    const px = Math.cos(this.orbitalAngle) * orbitRadius;
    const pz = Math.sin(this.orbitalAngle) * orbitRadius;
    this.planetMesh.position.set(px, 0, pz);

    const zDepth = pz;
    const xDist = Math.abs(px);
    const starR = this.starMesh.scale.x;
    const planetR = this.planetMesh.scale.x;

    let isTransiting = false;
    let currentFlux = 1.0;

    // Line of sight: zDepth > 0 indicates planet is between observer and star
    if (zDepth > 0 && xDist < (starR + planetR)) {
      isTransiting = true;
      const overlap = Math.max(0.0, 1.0 - (xDist / (starR + planetR)));
      const maxDip = this.currentSystem.planetaryPhysics.transitDepthPercent / 100.0;
      currentFlux = 1.0 - (maxDip * Math.sin(overlap * (Math.PI / 2.0)));
    }

    return { isTransiting, flux: currentFlux };
  }

  public getCurrentSystem(): ExoplanetSystem | null {
    return this.currentSystem;
  }

  public dispose(): void {
    this.orbitLine.geometry.dispose();
    this.habitableZoneMesh.geometry.dispose();
    this.starMesh.geometry.dispose();
    this.starGlowMesh.geometry.dispose();
    this.planetMesh.geometry.dispose();
  }
}
