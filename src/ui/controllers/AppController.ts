import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { MilkyWayGalaxy } from '../../graphics/galaxy/MilkyWay';
import { TargetNodes } from '../../graphics/galaxy/TargetNodes';
import { PlanetarySystemRenderer } from '../../graphics/system/SystemRenderer';
import { CinematicCameraController } from '../../graphics/camera/CameraController';
import { LightCurveGraph } from '../components/LightCurveGraph';
import { SearchIndexEngine } from '../../core/data/SearchIndex';
import { ScientificVerdictEngine } from '../../core/physics/VerdictEngine';
import { CoordinateTransformer } from '../../core/astronomy/coordinates';
import { detectParticleTier } from '../../graphics/galaxy/particleTier';
import { PerformanceSampler } from '../../observability/perfSampler';
import { soundSynth } from '../../audio/SoundSynthesizer';
import { logger } from '../../observability/logger';
import { ExoplanetSystem, RawExoplanetRecord } from '../../types/astronomy';
import rawCatalogData from '../../assets/data/exoplanet_catalog.json';

// Film Grain & Vignette Cinematic Shader
const FilmVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec2 coord = (vUv - 0.5) * 2.0;
      float vignette = 1.0 - dot(coord, coord) * 0.20;
      float grain = (fract(sin(dot(vUv, vec2(12.9898, 78.233)) + uTime * 0.08) * 43758.5453) - 0.5) * 0.022;
      gl_FragColor = vec4(tex.rgb * vignette + grain, tex.a);
    }
  `
};

// Subtle Edge Chromatic Aberration Shader
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    uOffset: { value: 0.0012 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uOffset;
    varying vec2 vUv;

    void main() {
      float r = texture2D(tDiffuse, vUv + vec2(uOffset, 0.0)).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - vec2(uOffset, 0.0)).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `
};

export class CosmoScanApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;
  private filmVignettePass!: ShaderPass;
  private chromaticPass!: ShaderPass;
  private smaaPass!: SMAAPass;
  private controls!: OrbitControls;
  private galaxyGroup = new THREE.Group();
  private galaxy: MilkyWayGalaxy;
  private targetNodes: TargetNodes | null = null;
  private systemRenderer: PlanetarySystemRenderer;
  private cameraController: CinematicCameraController;
  private lightCurve: LightCurveGraph;
  private searchIndex = new SearchIndexEngine();
  private perfSampler = new PerformanceSampler();
  private exoplanetData: ExoplanetSystem[] = [];
  private currentSystem: ExoplanetSystem | null = null;
  private clock = new THREE.Clock();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private lastTransitState = false;
  private prefersReducedMotion = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    const canvas3d = document.getElementById('canvas3d') as HTMLCanvasElement;
    if (!canvas3d) throw new Error('Missing #canvas3d element in DOM');

    this.scene = new THREE.Scene();
    // Depth perception: subtle cosmic depth fog across vast interstellar distances
    this.scene.fog = new THREE.FogExp2(0x030712, 0.0012);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
    // Homepage zoomed in close to the galaxy so it fills the screen with its glowing core & spiral arms
    this.camera.position.set(0, 48, 64);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);

    // 1. 4K WebGL2 Renderer Setup with Native MSAA Antialiasing
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas3d,
      powerPreference: 'high-performance',
      antialias: true, // Native MSAA on canvas for razor-sharp edges
      stencil: false,
      depth: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setClearColor(0x030712, 1.0); // Deep cosmic black
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 4K Soft Shadow Mapping Pipeline
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = true;

    // 2. 16-bit Float Post-Processing Target & Composer Pipeline
    const renderTarget = new THREE.WebGLRenderTarget(width * dpr, height * dpr, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.SRGBColorSpace
    });

    this.composer = new EffectComposer(this.renderer, renderTarget);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // Selective Coronal Bloom - subtle and controlled to prevent washing out the star & planet
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width * 0.5, height * 0.5),
      0.18,  // Clean, subtle bloom strength
      0.22,  // Tight radius
      0.97   // High luminance cutoff
    );
    this.composer.addPass(this.bloomPass);

    // Subtle Edge Chromatic Aberration Pass
    this.chromaticPass = new ShaderPass(ChromaticAberrationShader);
    this.composer.addPass(this.chromaticPass);

    // Cinematic Film Grain & Vignette Pass
    this.filmVignettePass = new ShaderPass(FilmVignetteShader);
    this.composer.addPass(this.filmVignettePass);

    // 4K SMAA Subpixel Anti-Aliasing
    this.smaaPass = new SMAAPass(width * dpr, height * dpr);
    this.composer.addPass(this.smaaPass);

    // Color Management & Tone Mapping Pass
    this.composer.addPass(new OutputPass());

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0, 0);
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 1200;

    // Detect hardware tier for particle budget
    const gl = this.renderer.getContext();
    const tierConfig = detectParticleTier(gl);
    logger.info('Graphics', `Selected Particle Tier: ${tierConfig.tier} (${tierConfig.particleBudget} stars)`);

    // Galactic Parent Group: rotates smoothly in real time
    this.scene.add(this.galaxyGroup);

    this.galaxy = new MilkyWayGalaxy(tierConfig.particleBudget);
    this.galaxyGroup.add(this.galaxy.mesh);

    this.systemRenderer = new PlanetarySystemRenderer();
    this.scene.add(this.systemRenderer.group);

    this.cameraController = new CinematicCameraController(this.camera, this.controls);

    const transitCanvas = document.getElementById('transitCanvas') as HTMLCanvasElement;
    if (!transitCanvas) throw new Error('Missing #transitCanvas element in DOM');
    this.lightCurve = new LightCurveGraph(transitCanvas);

    this.loadCatalog();
    this.bindEvents();
    this.animate();
  }

  private loadCatalog(): void {
    const rawRecords = rawCatalogData as RawExoplanetRecord[];
    this.exoplanetData = rawRecords.map((r, i) => CoordinateTransformer.transformRecord(r, i));
    this.searchIndex.indexSystems(this.exoplanetData);

    // Instanced Clickable Target Nodes Layer with Selection Ring attached to rotating galaxy
    this.targetNodes = new TargetNodes(this.exoplanetData);
    this.galaxyGroup.add(this.targetNodes.instancedMesh);
    this.galaxyGroup.add(this.targetNodes.selectionRing);

    const elCounter = document.getElementById('totalLoadedStars');
    if (elCounter) elCounter.textContent = `${this.exoplanetData.length.toLocaleString()} Indexed Hosts`;

    // Default target: Select Kepler-186 f if available, or first record
    const defaultTarget = this.exoplanetData.find((s) => s.planetName.toLowerCase().includes('kepler-186 f')) || this.exoplanetData[0];
    if (defaultTarget) {
      this.currentSystem = defaultTarget;
      this.systemRenderer.loadSystem(defaultTarget);
      this.systemRenderer.group.visible = false; // Start in clean galactic macro view
      this.targetNodes?.setSelection(defaultTarget);
      this.updateHUD(defaultTarget);
    }
  }

  public selectTarget(system: ExoplanetSystem): void {
    this.currentSystem = system;
    this.systemRenderer.loadSystem(system);
    this.systemRenderer.group.visible = true;

    // Keep the cluster/stars visible when zoomed in: surrounding stars twinkle in the cosmic background!
    if (this.targetNodes) {
      this.targetNodes.instancedMesh.visible = true;
      this.targetNodes.setSelection(system);
      this.targetNodes.selectionRing.visible = true;
    }

    // Spatial sound chime
    soundSynth.playTargetSelect(this.mouse.x);

    const localTargetPos = new THREE.Vector3(
      system.coordinates.galacticX,
      system.coordinates.galacticY,
      system.coordinates.galacticZ
    );
    const worldTargetPos = localTargetPos.clone().applyMatrix4(this.galaxyGroup.matrixWorld);
    this.systemRenderer.group.position.copy(worldTargetPos);

    // Zoom right up to the host star and revolving planet
    const cameraDest = worldTargetPos.clone().add(new THREE.Vector3(3.8, 1.8, 4.2));
    const flightDuration = this.prefersReducedMotion ? 0.15 : 1.8;

    this.cameraController.flyTo(cameraDest, worldTargetPos, flightDuration);
    this.updateHUD(system);

    // HUD Glitch Transition Pulse
    const hudContainer = document.querySelector('.hud-container');
    if (hudContainer) {
      hudContainer.classList.add('hud-glitch-active');
      setTimeout(() => hudContainer.classList.remove('hud-glitch-active'), 180);
    }
  }

  /**
   * Smooth animated number roll-up for telemetry data
   */
  private animateValue(id: string, start: number, end: number, duration: number, decimals: number, suffix = ''): void {
    const obj = document.getElementById(id);
    if (!obj) return;
    if (this.prefersReducedMotion) {
      obj.textContent = `${end.toFixed(decimals)}${suffix}`;
      return;
    }
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = Math.min((now - startTime) / duration, 1.0);
      const current = start + (end - start) * (1 - Math.pow(1 - elapsed, 3)); // ease-out cubic
      obj.textContent = `${current.toFixed(decimals)}${suffix}`;
      if (elapsed < 1.0) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  private updateHUD(system: ExoplanetSystem): void {
    const setTxt = (id: string, txt: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt('badgeTargetName', system.planetName.toUpperCase());
    setTxt('badgeTargetType', `(${system.stellarPhysics.spectralType} Main Sequence)`);
    setTxt('targetStarName', `Host Star: ${system.hostName}`);

    // Rolling animated metrics
    this.animateValue('valDistEarth', 0, system.coordinates.distanceLy, 700, 1, ` ly (${system.coordinates.distancePc.toFixed(1)} pc)`);
    this.animateValue('valTeff', 0, system.stellarPhysics.teffKelvin, 700, 0, ' K');
    this.animateValue('valStarRad', 0, system.stellarPhysics.radiusSolar, 700, 2, ' R☉');

    setTxt('valPlanetName', system.planetName);
    this.animateValue('valDistStar', 0, system.planetaryPhysics.semiMajorAxisAU, 700, 3, ' AU');
    this.animateValue('valPeriod', 0, system.planetaryPhysics.periodDays, 700, 2, ' Days');
    this.animateValue('valPlanetRad', 0, system.planetaryPhysics.radiusEarth, 700, 2, ' R⊕');
    this.animateValue('valTransitDepth', 0, system.planetaryPhysics.transitDepthPercent, 700, 3, '%');

    const verdict = ScientificVerdictEngine.evaluateSystem(system);
    const titleEl = document.getElementById('verdictTitle');
    const descEl = document.getElementById('verdictDesc');
    const disclosureEl = document.getElementById('verdictDisclosure');
    const densityEl = document.getElementById('valDensity');
    const irradianceEl = document.getElementById('valIrradiance');

    if (titleEl) {
      titleEl.textContent = verdict.headline;
      titleEl.style.color = verdict.badgeColor;
    }
    if (descEl) descEl.textContent = verdict.description;
    if (disclosureEl) disclosureEl.textContent = verdict.calculationDisclosure;

    if (densityEl) this.animateValue('valDensity', 0, verdict.astrophysicalMetrics.densityEstimateGcm3, 700, 2, ' g/cm³');
    if (irradianceEl) this.animateValue('valIrradiance', 0, verdict.astrophysicalMetrics.stellarIrradianceRelative, 700, 2, 'x Earth');
  }

  public resetGalaxyView(): void {
    soundSynth.init();
    const flightDuration = this.prefersReducedMotion ? 0.15 : 1.8;
    this.cameraController.flyTo(new THREE.Vector3(0, 48, 64), new THREE.Vector3(0, 0, 0), flightDuration);
    this.systemRenderer.group.visible = false;
    if (this.targetNodes) {
      this.targetNodes.instancedMesh.visible = true;
      this.targetNodes.selectionRing.visible = false;
    }

    const setTxt = (id: string, txt: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt('badgeTargetName', 'MILKY WAY GALAXY');
    setTxt('badgeTargetType', '(BARRED SPIRAL SBb)');
    setTxt('targetStarName', 'Galactic Center: Sagittarius A*');

    setTxt('valDistEarth', '26,700 ly (8.18 kpc)');
    setTxt('valTeff', 'N/A (Galactic Core)');
    setTxt('valStarRad', '4.3M M☉');
    setTxt('valPlanetName', 'Galactic Overview');
    setTxt('valDistStar', '0.00 AU');
    setTxt('valPeriod', '240 Myr');
    setTxt('valPlanetRad', '100,000 ly Disk');
    setTxt('valTransitDepth', '0.00%');

    const titleEl = document.getElementById('verdictTitle');
    const descEl = document.getElementById('verdictDesc');
    const disclosureEl = document.getElementById('verdictDisclosure');
    if (titleEl) {
      titleEl.textContent = 'Milky Way Galaxy View';
      titleEl.style.color = '#38bdf8';
    }
    if (descEl) descEl.textContent = 'Tap on any highlighted exoplanet system to zoom in. Travel between the stars anytime.';
    if (disclosureEl) disclosureEl.textContent = 'Active view: 500,000 Star GPU Point Cloud & 4,600+ Exoplanet Hosts.';
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(dpr);

      this.composer.setSize(width, height);
      this.bloomPass.resolution.set(width * 0.5, height * 0.5);

      this.lightCurve.resize();
    });

    // Reset View Button
    const btnResetView = document.getElementById('btnResetView');
    if (btnResetView) {
      btnResetView.addEventListener('click', () => {
        this.resetGalaxyView();
      });
    }

    // Canvas pointer raycasting for hover styling and target selection
    const canvas3d = document.getElementById('canvas3d');
    if (canvas3d) {
      let pointerStartX = 0;
      let pointerStartY = 0;

      canvas3d.addEventListener('pointermove', (e: PointerEvent) => {
        this.cameraController.resetIdleTimer();
        if (!this.targetNodes) return;
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObject(this.targetNodes.instancedMesh);
        if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
          canvas3d.style.cursor = 'pointer';
        } else {
          canvas3d.style.cursor = 'default';
        }
      });

      canvas3d.addEventListener('pointerdown', (e: PointerEvent) => {
        if (e.button !== 0) return;
        pointerStartX = e.clientX;
        pointerStartY = e.clientY;
        soundSynth.init();
        this.cameraController.resetIdleTimer();
      });

      canvas3d.addEventListener('pointerup', (e: PointerEvent) => {
        if (e.button !== 0) return;
        const dx = e.clientX - pointerStartX;
        const dy = e.clientY - pointerStartY;
        const dragDist = Math.hypot(dx, dy);

        // Only process tap/click if user didn't drag/orbit the camera (> 7px)
        if (dragDist > 7) return;

        if (!this.targetNodes) return;
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObject(this.targetNodes.instancedMesh);
        if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
          const sys = this.targetNodes.getSystemAtIndex(intersects[0].instanceId);
          if (sys) this.selectTarget(sys);
        } else if (this.systemRenderer.group.visible) {
          // If clicked in empty space while in close-up, return smoothly to galactic overview
          this.resetGalaxyView();
        }
      });
    }

    // Accessible Search Autocomplete Combobox
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const searchResults = document.getElementById('searchResults') as HTMLDivElement;

    if (searchInput && searchResults) {
      searchInput.setAttribute('role', 'combobox');
      searchInput.setAttribute('aria-expanded', 'false');
      searchResults.setAttribute('role', 'listbox');

      searchInput.addEventListener('input', (e) => {
        soundSynth.init();
        const target = e.target as HTMLInputElement;
        const matches = this.searchIndex.search(target.value);

        searchResults.innerHTML = '';
        searchInput.setAttribute('aria-expanded', matches.length > 0 ? 'true' : 'false');

        if (matches.length > 0) {
          searchResults.style.display = 'block';
          matches.forEach((m) => {
            const item = document.createElement('div');
            item.className = 'search-item';
            item.setAttribute('role', 'option');
            item.tabIndex = 0;
            item.textContent = `${m.planetName} (${m.hostName})`;
            const select = () => {
              this.selectTarget(m);
              searchResults.style.display = 'none';
              searchInput.value = m.planetName;
            };
            item.onclick = select;
            item.onkeydown = (evt) => {
              if (evt.key === 'Enter' || evt.key === ' ') select();
            };
            searchResults.appendChild(item);
          });
        } else {
          searchResults.style.display = 'none';
        }
      });

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target as Node) && !searchResults.contains(e.target as Node)) {
          searchResults.style.display = 'none';
          searchInput.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  // 60 FPS Master Render Loop with Adaptive Post-Processing Pipeline
  private animate = (): void => {
    requestAnimationFrame(this.animate);

    // Delta clamping: Max 0.1s prevents physics integration explosions
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    try {
      // Majestic galactic rotation: smooth, real-time rotation visible to the user
      const rotationSpeed = this.systemRenderer.group.visible ? 0.003 : 0.038;
      this.galaxyGroup.rotation.y += delta * rotationSpeed;

      this.galaxy.update(delta);
      this.galaxy.updateCameraPosition(this.camera);
      this.cameraController.update(delta);
      this.targetNodes?.update(delta, this.camera);

      // Keep active planetary system anchored to its rotating host star in world space
      if (this.currentSystem && this.systemRenderer.group.visible) {
        const localTargetPos = new THREE.Vector3(
          this.currentSystem.coordinates.galacticX,
          this.currentSystem.coordinates.galacticY,
          this.currentSystem.coordinates.galacticZ
        );
        this.systemRenderer.group.position.copy(localTargetPos.applyMatrix4(this.galaxyGroup.matrixWorld));
      }

      // Only show high-detail planetary system meshes (revolving planets, star surface) when close
      const camTargetDist = this.camera.position.distanceTo(this.systemRenderer.group.position);
      this.systemRenderer.group.visible = camTargetDist < 60.0;

      // DO NOT make the cluster disappear when zoomed in — surrounding stars stay visible in space!
      if (this.targetNodes) {
        this.targetNodes.instancedMesh.visible = true;
      }

      const { isTransiting, flux } = this.systemRenderer.update(delta, this.camera);

      // Web Audio Sonification & Ambient Atmosphere
      const distToCore = this.camera.position.length();
      soundSynth.updateDronePitch(distToCore);
      soundSynth.setTransitModulation(isTransiting);

      if (this.currentSystem) {
        this.lightCurve.pushFlux(flux, this.currentSystem.planetaryPhysics.transitDepthPercent);
        this.lightCurve.render(isTransiting);

        // Accessibility: announce transit state flip via aria-live
        if (isTransiting !== this.lastTransitState) {
          this.lastTransitState = isTransiting;
          const liveEl = document.getElementById('liveFluxAnnouncement');
          if (liveEl) {
            liveEl.textContent = isTransiting
              ? `Transit in progress for ${this.currentSystem.planetName}: flux dip ${((1 - flux) * 100).toFixed(3)}%`
              : `Transit egress complete for ${this.currentSystem.planetName}: starlight normalized`;
          }
        }
      }

      this.controls.update();

      // Dynamic Context-Aware Bloom Curve
      // Subtle, controlled bloom: tight coronal glow without washing out star surface or planet
      const bloomFactor = THREE.MathUtils.clamp((130.0 - camTargetDist) / 100.0, 0.0, 1.0);
      this.bloomPass.strength = THREE.MathUtils.lerp(0.12, 0.22, bloomFactor);

      // Update Film Grain Shader Time Uniform
      this.filmVignettePass.uniforms.uTime.value = elapsedTime;

      // Post-Processing Cinematic Render Pass
      this.composer.render();

      // Real-time 60 FPS Telemetry
      const fps = this.perfSampler.sample();
      const fpsEl = document.getElementById('fpsCounter');
      if (fpsEl) fpsEl.textContent = `${fps} FPS`;
    } catch (err) {
      logger.error('RenderLoop', 'Exception caught inside frame render loop', { error: String(err) });
    }
  };
}
