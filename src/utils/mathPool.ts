import * as THREE from 'three';

/**
 * 60 FPS Zero-Allocation Register Pool
 * Prevents Garbage Collection (GC) pauses by reusing static vectors, matrices, and colors
 * across mathematical subroutines in the animation loop.
 */
export class MathPool {
  public static readonly v1 = new THREE.Vector3();
  public static readonly v2 = new THREE.Vector3();
  public static readonly v3 = new THREE.Vector3();
  public static readonly m1 = new THREE.Matrix4();
  public static readonly q1 = new THREE.Quaternion();
  public static readonly col1 = new THREE.Color();
  public static readonly col2 = new THREE.Color();
}
