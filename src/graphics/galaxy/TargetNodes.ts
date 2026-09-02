import * as THREE from 'three';
import { ExoplanetSystem } from '../../types/astronomy';

export class TargetNodes {
  public instancedMesh: THREE.InstancedMesh;
  public selectionRing: THREE.Mesh;
  private dummy = new THREE.Object3D();
  private systemIndexMap: ExoplanetSystem[] = [];
  private ringMaterial: THREE.MeshBasicMaterial;
  private pulseTime = 0;

  constructor(systems: ExoplanetSystem[]) {
    this.systemIndexMap = systems;
    const count = systems.length;

    // Needle-sharp diamond star markers calibrated for vast interstellar exploration
    const geometry = new THREE.SphereGeometry(0.04, 10, 10);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.90,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    this.instancedMesh.name = 'TargetNodesInstancedMesh';

    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const sys = systems[i];

      // Physical apparent angular size: nearer & larger stars appear prominent, yet pin-sharp
      const distPc = Math.max(5.0, sys.coordinates.distancePc);
      const starRad = Math.max(0.2, Math.min(3.0, sys.stellarPhysics.radiusSolar));
      const angularSize = starRad / (distPc / 1000.0); // R* / d in kpc
      const starScale = Math.max(0.35, Math.min(1.5, 0.8 * Math.sqrt(angularSize) + 0.4));

      this.dummy.position.set(
        sys.coordinates.galacticX,
        sys.coordinates.galacticY,
        sys.coordinates.galacticZ
      );
      this.dummy.scale.setScalar(starScale);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

      // Habitability Class Color Coding
      switch (sys.planetaryPhysics.habitableZoneClass) {
        case 'OPTIMAL_HABITABLE':
          color.set('#10b981'); // Emerald Green
          break;
        case 'TOO_HOT':
          color.set('#f43f5e'); // Rose Pink
          break;
        case 'TOO_COLD':
          color.set('#06b6d4'); // Cyan Blue
          break;
        default:
          color.set('#94a3b8'); // Slate Gray for Gas Giants
          break;
      }
      this.instancedMesh.setColorAt(i, color);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    // Pulsing Selection Ring for Active Target
    const ringGeom = new THREE.RingGeometry(0.5, 0.72, 32);
    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.selectionRing = new THREE.Mesh(ringGeom, this.ringMaterial);
    this.selectionRing.visible = false;
  }

  public setSelection(system: ExoplanetSystem): void {
    this.selectionRing.position.set(
      system.coordinates.galacticX,
      system.coordinates.galacticY,
      system.coordinates.galacticZ
    );
    this.selectionRing.visible = true;
  }

  public update(deltaTime: number, camera?: THREE.Camera): void {
    if (!this.selectionRing.visible) return;

    this.pulseTime += deltaTime;
    const pulseScale = 1.0 + 0.25 * Math.sin(this.pulseTime * 4.0);
    this.selectionRing.scale.setScalar(pulseScale);

    this.ringMaterial.opacity = 0.5 + 0.35 * Math.cos(this.pulseTime * 4.0);

    if (camera) {
      this.selectionRing.quaternion.copy(camera.quaternion);
    }
  }

  public getSystemAtIndex(index: number): ExoplanetSystem | undefined {
    return this.systemIndexMap[index];
  }

  public dispose(): void {
    this.instancedMesh.geometry.dispose();
    (this.instancedMesh.material as THREE.Material).dispose();
    this.selectionRing.geometry.dispose();
    this.ringMaterial.dispose();
  }
}
