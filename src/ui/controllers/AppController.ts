import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
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
import { logger } from '../../observability/logger';
import { ExoplanetSystem, RawExoplanetRecord } from '../../types/astronomy';
import rawCatalogData from '../../assets/data/exoplanet_catalog.json';

export class CosmoScanApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;
  private smaaPass!: SMAAPass;
  private controls: OrbitControls;
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
  private prefersReducedMotion = false;
  private lastTransitState = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    const canvas3d = document.getElementById('canvas3d') as HTMLCanvasElement;
    if (!canvas3d) throw new Error('Missing #canvas3d element in DOM');

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.camera.position.set(0, 140, 170);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);

    // 1. 4K WebGL2 Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas3d,
      powerPreference: 'high-performance',
      antialias: false, // Handled downstream by SMAAPass
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

    // Selective Coronal Bloom (Tamed strength & threshold to prevent blowout)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width * 0.5, height * 0.5),
      0.35,  // Reduced from 1.45 -> prevents massive overexposure
      0.3,   // Reduced radius from 0.55 -> tighter coronal halo
      0.98   // Raised threshold from 0.88 -> only extreme HDR highlights bloom
    );
    this.composer.addPass(this.bloomPass);

    // 4K SMAA Subpixel Anti-Aliasing
    this.smaaPass = new SMAAPass(width * dpr, height * dpr);
    this.composer.addPass(this.smaaPass);

    // Color Management & Tone Mapping Pass
    this.composer.addPass(new OutputPass());

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 700;

    // Detect hardware tier for particle budget
    const gl = this.renderer.getContext();
    const tierConfig = detectParticleTier(gl);
    logger.info('Graphics', `Selected Particle Tier: ${tierConfig.tier} (${tierConfig.particleBudget} stars)`);

    this.galaxy = new MilkyWayGalaxy(tierConfig.particleBudget);
    this.scene.add(this.galaxy.mesh);

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

    // Instanced Clickable Target Nodes Layer
    this.targetNodes = new TargetNodes(this.exoplanetData);
    this.scene.add(this.targetNodes.instancedMesh);

    const elCounter = document.getElementById('totalLoadedStars');
    if (elCounter) elCounter.textContent = `${this.exoplanetData.length.toLocaleString()} Indexed Hosts`;

    // Default target: Select Kepler-186 f if available, or first record
    const defaultTarget = this.exoplanetData.find((s) => s.planetName.toLowerCase().includes('kepler-186 f')) || this.exoplanetData[0];
    if (defaultTarget) {
      this.selectTarget(defaultTarget);
    }
  }

  public selectTarget(system: ExoplanetSystem): void {
    this.currentSystem = system;
    this.systemRenderer.loadSystem(system);

    const targetPos = new THREE.Vector3(
      system.coordinates.galacticX,
      system.coordinates.galacticY,
      system.coordinates.galacticZ
    );
    const cameraDest = targetPos.clone().add(new THREE.Vector3(12, 8, 14));
    const flightDuration = this.prefersReducedMotion ? 0.15 : 1.8;

    this.cameraController.flyTo(cameraDest, targetPos, flightDuration);
    this.updateHUD(system);
  }

  private updateHUD(system: ExoplanetSystem): void {
    const setTxt = (id: string, txt: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt('badgeTargetName', system.planetName.toUpperCase());
    setTxt('badgeTargetType', `(${system.stellarPhysics.spectralType} Main Sequence)`);
    setTxt('targetStarName', `Host Star: ${system.hostName}`);
    setTxt('valDistEarth', `${system.coordinates.distanceLy.toFixed(1)} ly (${system.coordinates.distancePc.toFixed(1)} pc)`);
    setTxt('valTeff', `${system.stellarPhysics.teffKelvin.toFixed(0)} K`);
    setTxt('valStarRad', `${system.stellarPhysics.radiusSolar.toFixed(2)} R☉`);

    setTxt('valPlanetName', system.planetName);
    setTxt('valDistStar', `${system.planetaryPhysics.semiMajorAxisAU.toFixed(3)} AU`);
    setTxt('valPeriod', `${system.planetaryPhysics.periodDays.toFixed(2)} Days`);
    setTxt('valPlanetRad', `${system.planetaryPhysics.radiusEarth.toFixed(2)} R⊕`);
    setTxt('valTransitDepth', `${system.planetaryPhysics.transitDepthPercent.toFixed(3)}%`);

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
    if (densityEl) densityEl.textContent = `${verdict.astrophysicalMetrics.densityEstimateGcm3.toFixed(2)} g/cm³`;
    if (irradianceEl) irradianceEl.textContent = `${verdict.astrophysicalMetrics.stellarIrradianceRelative.toFixed(2)}x Earth`;
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
        this.cameraController.flyTo(new THREE.Vector3(0, 140, 170), new THREE.Vector3(0, 0, 0), this.prefersReducedMotion ? 0.15 : 1.8);
      });
    }

    // Canvas click raycasting for TargetNodes
    const canvas3d = document.getElementById('canvas3d');
    if (canvas3d) {
      canvas3d.addEventListener('pointerdown', (e: MouseEvent) => {
        if (!this.targetNodes) return;
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.targetNodes.instancedMesh);
        if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
          const sys = this.targetNodes.getSystemAtIndex(intersects[0].instanceId);
          if (sys) this.selectTarget(sys);
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

  // 60 FPS Master Render Loop with Post-Processing Pipeline
  private animate = (): void => {
    requestAnimationFrame(this.animate);

    // Delta clamping: Max 0.1s prevents physics integration explosions
    const delta = Math.min(this.clock.getDelta(), 0.1);

    try {
      this.galaxy.update(delta);
      this.galaxy.updateCameraPosition(this.camera);
      this.cameraController.update(delta);
      const { isTransiting, flux } = this.systemRenderer.update(delta);

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
