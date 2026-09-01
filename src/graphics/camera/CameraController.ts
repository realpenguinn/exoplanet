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
  private idleTimer = 0;
  private baseFov = 60;

  constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    this.camera = camera;
    this.controls = controls;
    this.baseFov = camera.fov || 60;
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
    this.idleTimer = 0;
  }

  public resetIdleTimer(): void {
    this.idleTimer = 0;
  }

  public update(deltaTime: number): void {
    if (this.isAnimating) {
      this.animationProgress += deltaTime / this.animationDuration;

      if (this.animationProgress >= 1.0) {
        this.animationProgress = 1.0;
        this.isAnimating = false;
        this.camera.position.copy(this.targetPosition);
        this.controls.target.copy(this.targetLookAt);
        this.camera.fov = this.baseFov;
        this.camera.updateProjectionMatrix();
        this.controls.enabled = true;
        return;
      }

      const t = this.animationProgress;

      // Cinematic ease-out-back curve with subtle settling overshoot
      const c1 = 0.6;
      const c3 = c1 + 1.0;
      const easeT = 1.0 + c3 * Math.pow(t - 1.0, 3) + c1 * Math.pow(t - 1.0, 2);

      this.camera.position.lerpVectors(this.startPosition, this.targetPosition, easeT);
      this.controls.target.lerpVectors(this.startLookAt, this.targetLookAt, easeT);

      // Dynamic Dolly-Zoom: Compress FOV during transit approach for cinematic depth
      const fovDip = Math.sin(Math.PI * t) * 12.0;
      this.camera.fov = this.baseFov - fovDip;
      this.camera.updateProjectionMatrix();
      return;
    }

    // Idle Auto-Rotation: Graceful orbital drift around target after 5 seconds of inactivity
    this.idleTimer += deltaTime;
    if (this.idleTimer > 5.0 && this.controls.enabled) {
      const offset = this.camera.position.clone().sub(this.controls.target);
      const angle = 0.04 * deltaTime;
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      this.camera.position.copy(this.controls.target).add(offset);
    }
  }

  public isCurrentlyAnimating(): boolean {
    return this.isAnimating;
  }

  public getAnimationProgress(): number {
    return this.animationProgress;
  }
}
