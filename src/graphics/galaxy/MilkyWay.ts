import * as THREE from 'three';

export class MilkyWayGalaxy {
  public mesh: THREE.Points;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.BufferGeometry;
  private totalStars: number;

  constructor(particleBudget = 500000) {
    this.totalStars = particleBudget;
    this.geometry = new THREE.BufferGeometry();

    this.material = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float aTwinkle;
        uniform float uTime;
        uniform vec3 uCameraPosition;
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          vColor = color;
          vTwinkle = aTwinkle;

          // Differential galactic rotation: inner stars rotate faster than outer stars
          float r = length(position.xz);
          float omega = 0.08 / (1.0 + r * 0.12);
          float angle = omega * uTime * 0.15;
          float cosA = cos(angle);
          float sinA = sin(angle);

          vec3 rotatedPos = vec3(
            position.x * cosA - position.z * sinA,
            position.y,
            position.x * sinA + position.z * cosA
          );

          vec4 mvPosition = modelViewMatrix * vec4(rotatedPos, 1.0);
          gl_PointSize = size * (45.0 / -mvPosition.z); // Fine star pinpoints without chalky overlapping
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;
        uniform float uTime;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float d = length(coord);
          if (d > 0.5) discard;

          // Procedural cross diffraction spikes for brilliant stars
          float spike = max(0.0, 1.0 - abs(coord.x * coord.y) * 80.0) * 0.20;
          float core = exp(-18.0 * d * d);

          // Living stellar twinkle / scintillation
          float twinkle = 0.90 + 0.10 * sin(uTime * 3.5 + vTwinkle);

          // Calibrated additive alpha for 500k points (luminous without blowout)
          float alpha = (core * 0.14 + spike * 0.22) * twinkle;
          gl_FragColor = vec4(vColor * 0.9, alpha);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uCameraPosition: { value: new THREE.Vector3() }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending // Calibrated Additive Blending for realistic galactic glow
    });

    this.buildMorphology();
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false;
  }

  private buildMorphology(): void {
    const N = this.totalStars;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    const twinkles = new Float32Array(N);

    const ARMS = 4;
    const PITCH_ANGLE = 0.2269; // 13 degrees pitch in radians

    const spectralPalette = [
      new THREE.Color('#9bb0ff'), // O/B Blue Giants
      new THREE.Color('#ffffff'), // A/F White Stars
      new THREE.Color('#ffe599'), // G Solar Stars
      new THREE.Color('#ffb380'), // K Orange Dwarfs
      new THREE.Color('#ff6b6b')  // M Red Dwarfs
    ];

    const bulgeCount = Math.floor(N * 0.25);

    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      twinkles[i] = Math.random() * Math.PI * 2.0;

      if (i < bulgeCount) {
        // Galactic Bulge & Triaxial Bar (Gaussian Distribution)
        const u = Math.max(1e-6, Math.random());
        const r = Math.sqrt(-2.0 * Math.log(u)) * 1.8;
        const phi = Math.random() * Math.PI * 2;

        positions[i3] = r * Math.cos(phi) * 1.8;
        positions[i3 + 1] = (Math.random() - 0.5) * 0.9 * Math.exp(-r / 2.0);
        positions[i3 + 2] = r * Math.sin(phi) * 0.8;

        // Core stars: Old, red-orange dominant
        const col = spectralPalette[3].clone().lerp(spectralPalette[2], Math.random());
        colors[i3] = col.r;
        colors[i3 + 1] = col.g;
        colors[i3 + 2] = col.b;

        // Power-law magnitude sizing: mostly faint field stars, occasional luminous stars
        const magRand = Math.random();
        sizes[i] = magRand > 0.96 ? 2.8 + Math.random() * 1.5 : 0.8 + Math.random() * 0.8;
      } else {
        // Spiral Arms with Gaussian Density Contrast
        const isInterArm = Math.random() < 0.15; // 15% diffuse inter-arm stars
        const armIdx = i % ARMS;
        const thetaOffset = (armIdx * 2 * Math.PI) / ARMS;
        const dist = Math.pow(Math.random(), 1.5) * 18.0 + 1.2;
        let spiralAngle = Math.log(dist / 1.2) / Math.tan(PITCH_ANGLE) + thetaOffset;

        if (isInterArm) {
          // Broad inter-arm background scatter
          spiralAngle += (Math.random() - 0.5) * (Math.PI / 2.0);
        }

        // Gaussian cross-sectional arm envelope (3-5x denser in arm core)
        const uScatter = Math.max(1e-5, Math.random());
        const scatterSigma = isInterArm ? 1.5 : 0.45;
        const scatter = Math.sqrt(-2.0 * Math.log(uScatter)) * scatterSigma;
        const scatterAngle = Math.random() * Math.PI * 2;

        positions[i3] = dist * Math.cos(spiralAngle) + scatter * Math.cos(scatterAngle);
        positions[i3 + 1] = (Math.random() - 0.5) * 0.45 * Math.exp(-dist / 12.0);
        positions[i3 + 2] = dist * Math.sin(spiralAngle) + scatter * Math.sin(scatterAngle);

        // Arm stars: Hot OB star forming regions along inner edges
        const specIdx = Math.floor(Math.random() * spectralPalette.length);
        const col = spectralPalette[specIdx];
        colors[i3] = col.r;
        colors[i3 + 1] = col.g;
        colors[i3 + 2] = col.b;

        // Log-normal magnitude sizing with diffraction spike triggers on supergiants
        const magRand = Math.random();
        sizes[i] = magRand > 0.97 ? 3.2 + Math.random() * 1.8 : 0.7 + Math.random() * 0.9;
      }
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkles, 1));
  }

  public update(deltaTime: number): void {
    this.material.uniforms.uTime.value += deltaTime;
  }

  public updateCameraPosition(camera: THREE.PerspectiveCamera): void {
    this.material.uniforms.uCameraPosition.value.copy(camera.position);
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
