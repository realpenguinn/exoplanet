import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CinematicCameraController {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isAnimating = false;
  private startPosition = new THREE.Vector3();
  private targetPosition = new THREE.Vector3();
  private startLookAt = new THREE.Vector3();
  private targetLookAt = new THREE.Vector3();
  private animationProgress = 0;
  private animationDuration = 1.8;

  constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    this.camera = camera;
    this.controls = controls;
  }

  public flyTo(destination: THREE.Vector3, lookAtTarget: THREE.Vector3, duration = 1.8): void {
    this.startPosition.copy(this.camera.position);
    this.targetPosition.copy(destination);
    this.startLookAt.copy(this.controls.target);
    this.targetLookAt.copy(lookAtTarget);

    this.animationDuration = duration;
    this.animationProgress = 0;
    this.isAnimating = true;
    this.controls.enabled = false;
  }

  public update(deltaTime: number): void {
    if (!this.isAnimating) return;

    this.animationProgress += deltaTime / this.animationDuration;

    if (this.animationProgress >= 1.0) {
      this.animationProgress = 1.0;
      this.isAnimating = false;
      this.camera.position.copy(this.targetPosition);
      this.controls.target.copy(this.targetLookAt);
      this.controls.enabled = true;
      return;
    }

    // Smoothstep ease-in-out interpolation: 3t^2 - 2t^3
    const t = this.animationProgress;
    const smoothT = t * t * (3 - 2 * t);

    this.camera.position.lerpVectors(this.startPosition, this.targetPosition, smoothT);
    this.controls.target.lerpVectors(this.startLookAt, this.targetLookAt, smoothT);
  }

  public isCurrentlyAnimating(): boolean {
    return this.isAnimating;
  }

  public getAnimationProgress(): number {
    return this.animationProgress;
  }
}
