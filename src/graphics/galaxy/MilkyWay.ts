import * as THREE from 'three';
import vertexShader from '../../assets/shaders/galaxy.vert.glsl';
import fragmentShader from '../../assets/shaders/galaxy.frag.glsl';

export class MilkyWayGalaxy {
  public mesh: THREE.Points;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.BufferGeometry;
  private totalStars: number;

  constructor(particleBudget = 150000) {
    this.totalStars = particleBudget;
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSizeMultiplier: { value: typeof window !== 'undefined' && window.devicePixelRatio > 1 ? 1.4 : 1.8 },
        uCameraPosition: { value: new THREE.Vector3() }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.buildMorphology();
    this.mesh = new THREE.Points(this.geometry, this.material);
    // Background galaxy is always rendered to prevent pop-in during rotation
    this.mesh.frustumCulled = false;
  }

  private buildMorphology(): void {
    const N = this.totalStars;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const scales = new Float32Array(N);

    const cCore = new THREE.Color(0xffeedd);
    const cBar = new THREE.Color(0xffaa55);
    const cArmBlue = new THREE.Color(0x66bbff);
    const cArmCyan = new THREE.Color(0x22eeff);
    const cDust = new THREE.Color(0xaa2266);

    let p = 0;

    // Sized relative to particle budget
    const nCore = Math.round(N * (25000 / 150000));
    const nBar = Math.round(N * (35000 / 150000));
    const nArms = Math.round(N * (75000 / 150000));

    // 1. Central Bulge & Sgr A* Core
    for (let i = 0; i < nCore && p < N; i++) {
      const r = Math.pow(Math.random(), 2.5) * 16.0;
      const th = Math.random() * Math.PI * 2;
      const ph = (Math.random() - 0.5) * Math.PI;

      positions[p * 3] = r * Math.cos(th) * Math.cos(ph);
      positions[p * 3 + 1] = r * Math.sin(ph) * 0.7;
      positions[p * 3 + 2] = r * Math.sin(th) * Math.cos(ph);

      const mixed = cCore.clone().lerp(cBar, Math.random() * 0.6);
      colors[p * 3] = mixed.r;
      colors[p * 3 + 1] = mixed.g;
      colors[p * 3 + 2] = mixed.b;
      scales[p] = Math.random() * 1.6 + 0.8;
      p++;
    }

    // 2. Triaxial Galactic Bar - Inclination 27 degrees
    const barAngleRad = (27.0 * Math.PI) / 180.0;
    const cosBar = Math.cos(barAngleRad);
    const sinBar = Math.sin(barAngleRad);

    for (let i = 0; i < nBar && p < N; i++) {
      const length = (Math.random() - 0.5) * 38.0;
      const width = (Math.random() - 0.5) * 8.0 * (1.0 - Math.abs(length) / 25.0);
      const height = (Math.random() - 0.5) * 5.0 * (1.0 - Math.abs(length) / 25.0);

      const rx = length * cosBar - width * sinBar;
      const rz = length * sinBar + width * cosBar;

      positions[p * 3] = rx;
      positions[p * 3 + 1] = height;
      positions[p * 3 + 2] = rz;

      const mixed = cBar.clone().lerp(cCore, Math.random() * 0.4);
      colors[p * 3] = mixed.r;
      colors[p * 3 + 1] = mixed.g;
      colors[p * 3 + 2] = mixed.b;
      scales[p] = Math.random() * 1.3 + 0.6;
      p++;
    }

    // 3. 4-Arm Logarithmic Spiral Geometry (Pitch 13 degrees)
    const armCount = 4;
    const pitchAngle = (13.0 * Math.PI) / 180.0;
    const tanPitch = Math.tan(pitchAngle);

    for (let i = 0; i < nArms && p < N; i++) {
      const armIndex = i % armCount;
      const armOffset = (armIndex * 2.0 * Math.PI) / armCount;
      const r = 10.0 + Math.pow(Math.random(), 1.6) * 85.0;
      const theta = Math.log(r / 10.0) / tanPitch + armOffset;

      const dispersion = (Math.random() - 0.5) * (r * 0.22);
      const finalAngle = theta + dispersion / r;

      const x = r * Math.cos(finalAngle);
      const z = r * Math.sin(finalAngle);
      const scaleHeight = (r * 0.05 + 1.2) * (Math.random() - 0.5) * (Math.random() - 0.5) * 4.0;

      positions[p * 3] = x;
      positions[p * 3 + 1] = scaleHeight;
      positions[p * 3 + 2] = z;

      let col: THREE.Color;
      if (i % 6 === 0) {
        col = cDust;
      } else {
        col = cArmBlue.clone().lerp(cArmCyan, Math.random() * 0.5);
      }

      colors[p * 3] = col.r;
      colors[p * 3 + 1] = col.g;
      colors[p * 3 + 2] = col.b;
      scales[p] = Math.random() * 1.2 + 0.4;
      p++;
    }

    // 4. Outer Halo & Globular Clusters
    while (p < N) {
      const r = 25.0 + Math.random() * 95.0;
      const th = Math.random() * Math.PI * 2;
      const ph = (Math.random() - 0.5) * Math.PI;

      positions[p * 3] = r * Math.cos(th) * Math.cos(ph);
      positions[p * 3 + 1] = r * Math.sin(ph) * 0.35;
      positions[p * 3 + 2] = r * Math.sin(th) * Math.cos(ph);

      colors[p * 3] = 0.75;
      colors[p * 3 + 1] = 0.75;
      colors[p * 3 + 2] = 0.85;
      scales[p] = Math.random() * 0.8 + 0.3;
      p++;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  }

  public update(deltaTime: number): void {
    this.material.uniforms.uTime.value += deltaTime;
  }

  // Phase 3.5 Perspective Color Grading: streaming camera position every frame
  public updateCameraPosition(camera: THREE.PerspectiveCamera): void {
    this.material.uniforms.uCameraPosition.value.copy(camera.position);
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
