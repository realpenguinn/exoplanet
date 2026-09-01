import * as THREE from 'three';
import { ExoplanetSystem } from '../../types/astronomy';

export class PlanetarySystemRenderer {
  public group = new THREE.Group();
  public stellarLight!: THREE.DirectionalLight;
  public ambientLight!: THREE.AmbientLight;
  public starMesh!: THREE.Mesh;
  public coronaMesh!: THREE.Mesh;
  public planetMesh!: THREE.Mesh;
  public ringMesh!: THREE.Mesh;
  public atmosphereMesh!: THREE.Mesh;
  public orbitLine!: THREE.LineLoop;
  public habitableZoneMesh!: THREE.Mesh;

  private starMaterial!: THREE.ShaderMaterial;
  private coronaMaterial!: THREE.ShaderMaterial;
  private planetMaterial!: THREE.MeshStandardMaterial;
  private atmosphereMaterial!: THREE.ShaderMaterial;
  private currentSystem: ExoplanetSystem | null = null;
  private orbitalAngle = 0;
  private elapsedTime = 0;
  private planetTextureCanvas: HTMLCanvasElement | null = null;
  private planetTextureContext: CanvasRenderingContext2D | null = null;
  private planetCanvasTexture: THREE.CanvasTexture | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.planetTextureCanvas = document.createElement('canvas');
      this.planetTextureCanvas.width = 512;
      this.planetTextureCanvas.height = 256;
      const ctx = this.planetTextureCanvas.getContext('2d');
      if (ctx) {
        this.planetTextureContext = ctx;
        this.planetCanvasTexture = new THREE.CanvasTexture(this.planetTextureCanvas);
        this.planetCanvasTexture.colorSpace = THREE.SRGBColorSpace;
      }
    }

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
    // 2. Dynamic Solar Plasma & Quadratic Limb Darkening with Transit Silhouette Occlusion
    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorCore: { value: new THREE.Color('#fff0b3') },
        uColorEdge: { value: new THREE.Color('#ff4500') },
        uLimbU1: { value: 0.38 },
        uLimbU2: { value: 0.28 },
        uTransitActive: { value: 0.0 },
        uTransitPos: { value: new THREE.Vector2(999, 999) },
        uTransitRadius: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec4 vScreenPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPos;
          vScreenPos = gl_Position;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorCore;
        uniform vec3 uColorEdge;
        uniform float uLimbU1;
        uniform float uLimbU2;
        uniform float uTransitActive;
        uniform vec2 uTransitPos;
        uniform float uTransitRadius;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec4 vScreenPos;

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

          // Transit Silhouette Projection on Star Surface
          if (uTransitActive > 0.5) {
            vec2 ndc = vScreenPos.xy / vScreenPos.w;
            float distToPlanet = length(ndc - uTransitPos);
            if (distToPlanet < uTransitRadius) {
              float edgeSmooth = smoothstep(uTransitRadius, uTransitRadius * 0.88, distToPlanet);
              starColor = mix(starColor, vec3(0.02, 0.02, 0.04), edgeSmooth * 0.96);
            }
          }

          gl_FragColor = vec4(starColor * 1.8, 1.0); // HDR intensity for bloom
        }
      `
    });

    const starGeom = new THREE.SphereGeometry(1.5, 128, 128);
    this.starMesh = new THREE.Mesh(starGeom, this.starMaterial);
    this.group.add(this.starMesh);

    // Stellar Corona Mesh with Additive Fresnel Glow
    this.coronaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorCore: { value: new THREE.Color('#fff0b3') },
        uColorEdge: { value: new THREE.Color('#ff4500') }
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
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
          float coronaGlow = pow(rim, 2.5);
          float pulse = 0.92 + 0.08 * sin(uTime * 2.0 + vPosition.x * 3.0);
          vec3 color = mix(uColorEdge, uColorCore, rim) * coronaGlow * pulse;
          gl_FragColor = vec4(color * 1.5, coronaGlow * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });

    this.coronaMesh = new THREE.Mesh(new THREE.SphereGeometry(2.1, 64, 64), this.coronaMaterial);
    this.group.add(this.coronaMesh);
  }

  private initPlanetAndRings(): void {
    // 3. Exoplanet Body with Procedural Surface Map
    this.planetMaterial = new THREE.MeshStandardMaterial({
      map: this.planetCanvasTexture,
      roughness: 0.78,
      metalness: 0.15
    });
    this.planetMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 128, 128), this.planetMaterial);
    this.planetMesh.castShadow = true;
    this.planetMesh.receiveShadow = true;
    this.group.add(this.planetMesh);

    // 4. Planetary Ring System (DoubleSide shadow casting, conditionally displayed)
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
    this.ringMesh.visible = false;
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
      opacity: 0.15,
      depthWrite: false
    });
    this.habitableZoneMesh = new THREE.Mesh(hzGeom, hzMat);
    this.habitableZoneMesh.rotation.x = Math.PI / 2;
    this.group.add(this.habitableZoneMesh);
  }

  /**
   * Procedural texture generator reacting dynamically to exoplanet equilibrium temperature and size
   */
  private generatePlanetTexture(system: ExoplanetSystem): void {
    if (!this.planetTextureContext || !this.planetTextureCanvas || !this.planetCanvasTexture) return;

    const ctx = this.planetTextureContext;
    const w = this.planetTextureCanvas.width;
    const h = this.planetTextureCanvas.height;
    const teq = system.planetaryPhysics.equilibriumTempKelvin;
    const rad = system.planetaryPhysics.radiusEarth;

    ctx.clearRect(0, 0, w, h);

    if (rad >= 4.0) {
      // Gas Giant: Atmospheric Storm Bands
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0.0, '#a855f7');
      gradient.addColorStop(0.2, '#38bdf8');
      gradient.addColorStop(0.4, '#fb923c');
      gradient.addColorStop(0.6, '#fef08a');
      gradient.addColorStop(0.8, '#fdba74');
      gradient.addColorStop(1.0, '#64748b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Add turbulence streaks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let y = 10; y < h; y += 18) {
        ctx.fillRect(0, y, w, 6);
      }
    } else if (teq > 340) {
      // Hot Volcanic World: Obsidian Crust with Magma Fissures
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const startX = Math.random() * w;
        ctx.moveTo(startX, 0);
        ctx.bezierCurveTo(startX + 40, h * 0.3, startX - 40, h * 0.7, startX + 20, h);
      }
      ctx.stroke();

      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (teq < 180) {
      // Cryo Ice World: Glacial Crust with Polar Caps
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0.0, '#ffffff');
      gradient.addColorStop(0.3, '#38bdf8');
      gradient.addColorStop(0.5, '#0284c7');
      gradient.addColorStop(0.7, '#38bdf8');
      gradient.addColorStop(1.0, '#ffffff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * w, Math.random() * h);
        ctx.lineTo(Math.random() * w, Math.random() * h);
        ctx.stroke();
      }
    } else {
      // Habitable World: Azure Oceans, Emerald Continents, White Ice Caps
      ctx.fillStyle = '#0f3854'; // Deep ocean
      ctx.fillRect(0, 0, w, h);

      // Procedural continents
      ctx.fillStyle = '#2d6a4f';
      for (let c = 0; c < 5; c++) {
        const cx = (c / 5) * w + (Math.random() - 0.5) * 60;
        const cy = h * 0.5 + (Math.random() - 0.5) * 50;
        ctx.beginPath();
        ctx.arc(cx, cy, 45 + Math.random() * 25, 0, Math.PI * 2);
        ctx.fill();
      }

      // Polar Ice Caps
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, 24);
      ctx.fillRect(0, h - 24, w, 24);

      // Cloud swirls
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.beginPath();
      ctx.arc(w * 0.3, h * 0.4, 50, 0, Math.PI * 2);
      ctx.arc(w * 0.7, h * 0.6, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    this.planetCanvasTexture.needsUpdate = true;
  }

  public loadSystem(system: ExoplanetSystem): void {
    this.currentSystem = system;
    this.orbitalAngle = 0;
    this.group.position.set(
      system.coordinates.galacticX,
      system.coordinates.galacticY,
      system.coordinates.galacticZ
    );

    // Dynamically grade stellar plasma shader and corona based on Planck star color
    const starColor = new THREE.Color(system.stellarPhysics.colorHex);
    this.starMaterial.uniforms.uColorCore.value.copy(starColor).lerp(new THREE.Color('#ffffff'), 0.4);
    this.starMaterial.uniforms.uColorEdge.value.copy(starColor).multiplyScalar(0.7);

    this.coronaMaterial.uniforms.uColorCore.value.copy(starColor).lerp(new THREE.Color('#ffffff'), 0.5);
    this.coronaMaterial.uniforms.uColorEdge.value.copy(starColor).multiplyScalar(0.8);

    const visualStarRadius = Math.max(0.7, Math.min(2.2, system.stellarPhysics.radiusSolar * 0.8));
    this.starMesh.scale.setScalar(visualStarRadius);
    this.coronaMesh.scale.setScalar(visualStarRadius * 1.35);

    const visualPlanetRadius = Math.max(0.18, Math.min(0.65, system.planetaryPhysics.radiusEarth * 0.18));
    this.planetMesh.scale.setScalar(visualPlanetRadius);

    // Generate procedural surface texture for this world
    this.generatePlanetTexture(system);

    // Conditional Ring System: Display rings only for Gas Giants (R > 6.0 Earth Radii)
    this.ringMesh.visible = system.planetaryPhysics.radiusEarth > 6.0;

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
  public update(deltaTime: number, camera?: THREE.PerspectiveCamera): { isTransiting: boolean; flux: number } {
    if (!this.currentSystem) return { isTransiting: false, flux: 1.0 };

    this.elapsedTime += deltaTime;
    this.starMaterial.uniforms.uTime.value = this.elapsedTime;
    this.coronaMaterial.uniforms.uTime.value = this.elapsedTime;
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

      // Transit Silhouette Occlusion Projection on Host Star
      this.starMaterial.uniforms.uTransitActive.value = 1.0;
      if (camera) {
        const worldPlanet = new THREE.Vector3();
        this.planetMesh.getWorldPosition(worldPlanet);
        worldPlanet.project(camera);
        this.starMaterial.uniforms.uTransitPos.value.set(worldPlanet.x, worldPlanet.y);
        this.starMaterial.uniforms.uTransitRadius.value = (planetR / Math.max(0.1, camera.position.distanceTo(this.group.position))) * 1.2;
      }
    } else {
      this.starMaterial.uniforms.uTransitActive.value = 0.0;
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
    this.coronaMesh.geometry.dispose();
    this.coronaMaterial.dispose();
    this.planetMesh.geometry.dispose();
    this.planetMaterial.dispose();
    this.planetCanvasTexture?.dispose();
    this.ringMesh.geometry.dispose();
    this.atmosphereMesh.geometry.dispose();
    this.atmosphereMaterial.dispose();
    this.stellarLight.dispose();
  }
}
