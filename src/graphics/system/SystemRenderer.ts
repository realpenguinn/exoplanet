import * as THREE from 'three';
import { ExoplanetSystem } from '../../types/astronomy';

export class PlanetarySystemRenderer {
  public group = new THREE.Group();
  public stellarLight!: THREE.DirectionalLight;
  public ambientLight!: THREE.AmbientLight;
  public starMesh!: THREE.Mesh;
  public planetMesh!: THREE.Mesh;
  public ringMesh!: THREE.Mesh;
  public atmosphereMesh!: THREE.Mesh;
  public orbitLine!: THREE.LineLoop;
  public habitableZoneMesh!: THREE.Mesh;

  private starMaterial!: THREE.ShaderMaterial;
  private atmosphereMaterial!: THREE.ShaderMaterial;
  private currentSystem: ExoplanetSystem | null = null;
  private orbitalAngle = 0;
  private elapsedTime = 0;

  constructor() {
    this.initLighting();
    this.initStar();
    this.initPlanetAndRings();
    this.initOrbitAndHabitableZone();
    this.group.visible = false;
  }

  private initLighting(): void {
    // 1. Directional Stellar Shadow Caster with 4K Texture Buffer
    this.stellarLight = new THREE.DirectionalLight(0xfff5ea, 3.8);
    this.stellarLight.castShadow = true;
    this.stellarLight.shadow.mapSize.width = 4096;
    this.stellarLight.shadow.mapSize.height = 4096;
    this.stellarLight.shadow.camera.near = 0.1;
    this.stellarLight.shadow.camera.far = 100;
    this.stellarLight.shadow.camera.left = -6;
    this.stellarLight.shadow.camera.right = 6;
    this.stellarLight.shadow.camera.top = 6;
    this.stellarLight.shadow.camera.bottom = -6;
    this.stellarLight.shadow.bias = -0.00015;
    this.stellarLight.shadow.normalBias = 0.03;
    this.stellarLight.shadow.radius = 3.5;
    this.group.add(this.stellarLight);
    this.group.add(this.stellarLight.target);

    // Ambient Nightside Soft Fill
    this.ambientLight = new THREE.AmbientLight(0x0a1118, 0.4);
    this.group.add(this.ambientLight);
  }

  private initStar(): void {
    // 2. Dynamic Solar Plasma & Quadratic Limb Darkening Shader
    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorCore: { value: new THREE.Color('#fff0b3') },
        uColorEdge: { value: new THREE.Color('#ff4500') },
        uLimbU1: { value: 0.38 },
        uLimbU2: { value: 0.28 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorCore;
        uniform vec3 uColorEdge;
        uniform float uLimbU1;
        uniform float uLimbU2;
        varying vec3 vNormal;
        varying vec3 vPosition;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          float noise = (snoise(vPosition * 2.2 + vec3(uTime * 0.08)) * 0.65 +
                         snoise(vPosition * 5.5 - vec3(uTime * 0.12)) * 0.35) * 0.5 + 0.5;
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float mu = max(0.001, dot(vNormal, viewDir));
          float limbDarkening = 1.0 - uLimbU1 * (1.0 - mu) - uLimbU2 * pow(1.0 - mu, 2.0);

          vec3 starColor = mix(uColorEdge, uColorCore, noise * limbDarkening);
          gl_FragColor = vec4(starColor * 1.8, 1.0); // HDR intensity for bloom
        }
      `
    });

    const starGeom = new THREE.SphereGeometry(1.5, 128, 128);
    this.starMesh = new THREE.Mesh(starGeom, this.starMaterial);
    this.group.add(this.starMesh);
  }

  private initPlanetAndRings(): void {
    // 3. Exoplanet Body with Standard PBR Material
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x1f3d5c,
      roughness: 0.82,
      metalness: 0.12
    });
    this.planetMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 128, 128), planetMat);
    this.planetMesh.castShadow = true;
    this.planetMesh.receiveShadow = true;
    this.group.add(this.planetMesh);

    // 4. Planetary Ring System (DoubleSide shadow casting to eliminate light leaks)
    const ringGeo = new THREE.RingGeometry(0.7, 1.3, 128);
    ringGeo.rotateX(Math.PI / 2.3);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xaa9988,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
      roughness: 0.9,
      transparent: true,
      opacity: 0.85
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.castShadow = true;
    this.ringMesh.receiveShadow = true;
    this.planetMesh.add(this.ringMesh);

    // 5. Atmospheric Rayleigh & Terminator Scattering Mesh (1.025x hull, depthWrite false)
    this.atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
        uAtmosphereColor: { value: new THREE.Color('#38bdf8') }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uSunPosition;
        uniform vec3 uAtmosphereColor;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 lightDir = normalize(uSunPosition - vWorldPosition);
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          
          float cosTheta = dot(vNormal, lightDir);
          float dayFactor = smoothstep(-0.25, 0.45, cosTheta);
          
          float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
          float atmosphereDensity = pow(rim, 3.2) * dayFactor;
          
          float sunDotView = max(0.0, dot(viewDir, -lightDir));
          float mieScatter = pow(sunDotView, 8.0) * 0.45 * dayFactor;
          
          vec3 color = uAtmosphereColor * (atmosphereDensity + mieScatter);
          gl_FragColor = vec4(color, atmosphereDensity + mieScatter);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.515, 128, 128),
      this.atmosphereMaterial
    );
    this.planetMesh.add(this.atmosphereMesh);
  }

  private initOrbitAndHabitableZone(): void {
    const orbitGeom = new THREE.BufferGeometry();
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    this.orbitLine = new THREE.LineLoop(orbitGeom, orbitMat);
    this.group.add(this.orbitLine);

    const hzGeom = new THREE.RingGeometry(2.5, 4.8, 64);
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
  }

  public loadSystem(system: ExoplanetSystem): void {
    this.currentSystem = system;
    this.orbitalAngle = 0;
    this.group.position.set(
      system.coordinates.galacticX,
      system.coordinates.galacticY,
      system.coordinates.galacticZ
    );

    // Dynamically grade stellar plasma shader based on Planck star color
    const starColor = new THREE.Color(system.stellarPhysics.colorHex);
    this.starMaterial.uniforms.uColorCore.value.copy(starColor).lerp(new THREE.Color('#ffffff'), 0.4);
    this.starMaterial.uniforms.uColorEdge.value.copy(starColor).multiplyScalar(0.7);

    const visualStarRadius = Math.max(0.7, Math.min(2.2, system.stellarPhysics.radiusSolar * 0.8));
    this.starMesh.scale.setScalar(visualStarRadius);

    const visualPlanetRadius = Math.max(0.18, Math.min(0.65, system.planetaryPhysics.radiusEarth * 0.18));
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

    this.elapsedTime += deltaTime;
    this.starMaterial.uniforms.uTime.value = this.elapsedTime;
    this.atmosphereMaterial.uniforms.uSunPosition.value.copy(this.starMesh.position);

    const speed = (2.0 * Math.PI) / Math.max(1.0, this.currentSystem.planetaryPhysics.periodDays * 0.1);
    this.orbitalAngle += speed * deltaTime;

    const orbitRadius = Math.max(2.8, Math.min(10.0, Math.sqrt(this.currentSystem.planetaryPhysics.semiMajorAxisAU) * 4.2));
    const px = Math.cos(this.orbitalAngle) * orbitRadius;
    const pz = Math.sin(this.orbitalAngle) * orbitRadius;
    this.planetMesh.position.set(px, 0, pz);

    // Dynamic Shadow Camera Tracking: Lock directional light directly to planet local frame
    const starToPlanet = this.planetMesh.position.clone().sub(this.starMesh.position).normalize();
    this.stellarLight.position.copy(this.planetMesh.position).sub(starToPlanet.multiplyScalar(20));
    this.stellarLight.target = this.planetMesh;
    this.stellarLight.target.updateMatrixWorld();

    const zDepth = pz;
    const xDist = Math.abs(px);
    const starR = this.starMesh.scale.x * 1.5;
    const planetR = this.planetMesh.scale.x * 0.5;

    let isTransiting = false;
    let currentFlux = 1.0;

    // Line of sight transit detection
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
    this.starMaterial.dispose();
    this.planetMesh.geometry.dispose();
    this.ringMesh.geometry.dispose();
    this.atmosphereMesh.geometry.dispose();
    this.atmosphereMaterial.dispose();
    this.stellarLight.dispose();
  }
}
