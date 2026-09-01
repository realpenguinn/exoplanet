import * as THREE from 'three';
import { ExoplanetSystem } from '../../types/astronomy';

export class TargetNodes {
  public instancedMesh: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private systemIndexMap: ExoplanetSystem[] = [];

  constructor(systems: ExoplanetSystem[]) {
    this.systemIndexMap = systems;
    const count = systems.length;

    // Lightweight billboard geometry for target markers
    const geometry = new THREE.SphereGeometry(0.25, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    this.instancedMesh.name = 'TargetNodesInstancedMesh';

    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const sys = systems[i];
      this.dummy.position.set(
        sys.coordinates.galacticX,
        sys.coordinates.galacticY,
        sys.coordinates.galacticZ
      );
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

      // Color based on host star Planck temperature
      color.set(sys.stellarPhysics.colorHex);
      this.instancedMesh.setColorAt(i, color);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  public getSystemAtIndex(index: number): ExoplanetSystem | undefined {
    return this.systemIndexMap[index];
  }

  public dispose(): void {
    this.instancedMesh.geometry.dispose();
    (this.instancedMesh.material as THREE.Material).dispose();
  }
}
