/**
 * Three.js 3D Viewport Renderer for Cubiverse 3D.
 * Follows all architectural, visual realism, PBR, and software-WebGL guidelines.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BlockMeshFactory } from './blockMesh';
import { TextureLibrary } from './proceduralTextures';
import { PuzzleEngine } from './puzzleEngine';
import { LevelData, TileType } from './types';

// Pre-allocated math objects to guarantee zero GC during render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _quatA = new THREE.Quaternion();
const _quatB = new THREE.Quaternion();

export class GameSceneRenderer {
  public domElement: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  public isSoftwareGl: boolean;

  private textureLib: TextureLibrary;
  private puzzleEngine: PuzzleEngine;
  private tilesGroup: THREE.Group = new THREE.Group();
  private blockGroup: THREE.Group = new THREE.Group();
  private ghostGroup: THREE.Group = new THREE.Group();
  private splitA: THREE.Group | null = null;
  private splitB: THREE.Group | null = null;
  private goalBeaconMesh: THREE.Group | null = null;
  private particles: {
    mesh: THREE.Points;
    velocities: THREE.Vector3[];
    lifespans: number[];
    maxLife: number;
  }[] = [];

  private isAnimatingRoll: boolean = false;
  private rollProgress: number = 0;
  private rollPivot: THREE.Vector3 = new THREE.Vector3();
  private rollAxisVec: THREE.Vector3 = new THREE.Vector3();
  private rollTargetAngle: number = 0;
  private rollStartQuat: THREE.Quaternion = new THREE.Quaternion();
  private rollStartPos: THREE.Vector3 = new THREE.Vector3();
  private currentRollCallback: (() => void) | null = null;

  private isFalling: boolean = false;
  private fallVelocityY: number = 0;
  private fallRotationSpeed: number = 0;

  private frameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  private cameraTarget: THREE.Vector3 = new THREE.Vector3();
  private cameraSmoothTarget: THREE.Vector3 = new THREE.Vector3();
  private isCinematicPanning: boolean = false;

  constructor(mountContainer: HTMLElement, puzzleEngine: PuzzleEngine) {
    this.domElement = mountContainer;
    this.puzzleEngine = puzzleEngine;

    // 1. Detect software WebGL from GPU renderer string
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(mountContainer.clientWidth, mountContainer.clientHeight);

    mountContainer.appendChild(this.renderer.domElement);

    // 3. Setup Scene, Camera & Background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070b14);
    this.scene.fog = new THREE.FogExp2(0x070b14, 0.025);

    const aspect = mountContainer.clientWidth / mountContainer.clientHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000);
    this.camera.position.set(10, 16, 16);

    // 4. OrbitControls with smooth damping
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Stay above ground
    this.controls.minDistance = 6;
    this.controls.maxDistance = 45;

    // 5. Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Texture Library & Anisotropy
    this.textureLib = TextureLibrary.getInstance();
    this.textureLib.applyAnisotropy(this.renderer.capabilities.getMaxAnisotropy());

    // 7. Lighting Rig
    this.setupLighting();

    // 8. Add Groups
    this.scene.add(this.tilesGroup);
    this.scene.add(this.blockGroup);
    this.scene.add(this.ghostGroup);

    // 9. Floating space backdrop particles & celestial void ring
    this.setupCosmicBackdrop();

    // 10. Build initial level
    this.buildLevelWorld(puzzleEngine.currentLevel);

    // 11. Pre-warm shaders
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // 12. Start animation loop
    this.startLoop();
  }

  private setupLighting() {
    // Key Directional Light with soft shadows
    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    keyLight.position.set(14, 25, 12);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 60;
    const d = 16;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // Fill Hemisphere light: cool sky vs dark obsidian reflection
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 0.9);
    this.scene.add(hemiLight);

    // Rim/Backlight for striking edge highlights
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(-15, 10, -15);
    this.scene.add(rimLight);
  }

  private setupCosmicBackdrop() {
    // Floating stardust particles in the cosmic abyss
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40 - 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      const isCyan = Math.random() > 0.4;
      colors[i * 3] = isCyan ? 0.3 : 0.8;
      colors[i * 3 + 1] = isCyan ? 0.8 : 0.6;
      colors[i * 3 + 2] = 1.0;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });

    const starPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(starPoints);
  }

  public setCinematicPan(active: boolean) {
    this.isCinematicPanning = active;
  }

  public buildLevelWorld(level: LevelData) {
    // Clear existing tiles
    while (this.tilesGroup.children.length > 0) {
      const child = this.tilesGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      this.tilesGroup.remove(child);
    }

    // Calculate grid center to center the island
    const rows = level.grid.length;
    const cols = level.grid[0].length;
    const centerX = cols / 2 - 0.5;
    const centerZ = rows / 2 - 0.5;

    this.cameraTarget.set(centerX, 0, centerZ);
    this.controls.target.copy(this.cameraTarget);

    // Build floor tiles
    const tileGeo = new THREE.BoxGeometry(0.96, 0.28, 0.96);
    const bridgeGeo = new THREE.BoxGeometry(0.96, 0.12, 0.96);

    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        const type = level.grid[z][x];
        if (type === TileType.VOID) continue;

        let mat: THREE.Material;
        let isBridge = false;

        if (type === TileType.GOAL) {
          mat = new THREE.MeshStandardMaterial({
            map: this.textureLib.goalTexture,
            roughness: 0.2,
            metalness: 0.7,
            emissive: 0x10b981,
            emissiveIntensity: 0.6,
          });
          // Add 3D beacon pillar to goal
          this.createGoalBeacon(x, z);
        } else if (type === TileType.SOFT_SWITCH) {
          mat = new THREE.MeshStandardMaterial({
            map: this.textureLib.softSwitchTexture,
            roughness: 0.3,
            metalness: 0.6,
            emissive: 0x0284c7,
            emissiveIntensity: 0.5,
          });
        } else if (type === TileType.HEAVY_SWITCH) {
          mat = new THREE.MeshStandardMaterial({
            map: this.textureLib.heavySwitchTexture,
            roughness: 0.3,
            metalness: 0.6,
            emissive: 0xbe185d,
            emissiveIntensity: 0.5,
          });
        } else if (type === TileType.FRAGILE) {
          mat = new THREE.MeshStandardMaterial({
            map: this.textureLib.fragileTileTexture,
            roughness: 0.5,
            metalness: 0.3,
            emissive: 0xea580c,
            emissiveIntensity: 0.4,
          });
        } else if (type === TileType.SPLIT) {
          mat = new THREE.MeshStandardMaterial({
            map: this.textureLib.splitTexture,
            roughness: 0.3,
            metalness: 0.6,
            emissive: 0x7e22ce,
            emissiveIntensity: 0.6,
          });
        } else if (type === TileType.BRIDGE) {
          isBridge = true;
          mat = new THREE.MeshStandardMaterial({
            map: this.textureLib.bridgeTexture,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.9,
            emissive: 0x0ea5e9,
            emissiveIntensity: 0.8,
          });
        } else {
          // Normal stone tile
          mat = new THREE.MeshStandardMaterial({
            map: this.textureLib.normalTileTexture,
            roughness: 0.75,
            metalness: 0.2,
          });
        }

        const mesh = new THREE.Mesh(isBridge ? bridgeGeo : tileGeo, mat);
        mesh.position.set(x, isBridge ? -0.08 : -0.14, z);
        mesh.castShadow = !this.isSoftwareGl;
        mesh.receiveShadow = !this.isSoftwareGl;
        mesh.name = `tile_${x}_${z}`;
        mesh.userData = { x, z, type, isBridge };

        // Hide bridge if closed initially
        if (isBridge && level.bridges) {
          const isOpen = this.puzzleEngine.bridgesState[level.bridges[0]?.bridgeId];
          mesh.visible = !!isOpen;
        }

        this.tilesGroup.add(mesh);

        // Subtle island under-pedestal for aesthetic 3D floating island silhouette
        if (!isBridge && (x === 1 || x === cols - 2 || z === 1 || z === rows - 2) && Math.random() > 0.6) {
          const depthRockGeo = new THREE.ConeGeometry(0.35, 1.2, 5);
          const rockMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.9,
            metalness: 0.1,
          });
          const rockMesh = new THREE.Mesh(depthRockGeo, rockMat);
          rockMesh.position.set(x, -0.85, z);
          rockMesh.rotation.x = Math.PI;
          this.tilesGroup.add(rockMesh);
        }
      }
    }

    // Contact shadow plane beneath the floating island
    const shadowGeo = new THREE.PlaneGeometry(cols + 6, rows + 6);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(centerX, -1.8, centerZ);
    this.tilesGroup.add(shadowPlane);

    // Refresh block mesh state
    this.updateBlockMeshes();
  }

  private createGoalBeacon(x: number, z: number) {
    const beaconGroup = new THREE.Group();
    beaconGroup.name = 'goal_beacon';

    // Glowing column of light (cylinder)
    const beamGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 3, 0);
    beaconGroup.add(beam);

    // Floating pulsing aura ring
    const ringGeo = new THREE.TorusGeometry(0.5, 0.03, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      emissive: 0x10b981,
      emissiveIntensity: 1.2,
      roughness: 0.1,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.25, 0);
    beaconGroup.add(ring);

    beaconGroup.position.set(x, 0, z);
    this.tilesGroup.add(beaconGroup);
    this.goalBeaconMesh = beaconGroup;
  }

  /**
   * Synchronize 3D meshes with current block position & orientation.
   */
  public updateBlockMeshes() {
    // Clear block group
    while (this.blockGroup.children.length > 0) {
      this.blockGroup.remove(this.blockGroup.children[0]);
    }

    if (this.puzzleEngine.blockMode === 'SINGLE') {
      const monolith = BlockMeshFactory.createMonolith(this.textureLib);
      const { x, z, orientation } = this.puzzleEngine.single;

      if (orientation === 'STANDING') {
        monolith.position.set(x, 0, z);
        monolith.rotation.set(0, 0, 0);
      } else if (orientation === 'HORIZONTAL_X') {
        // Rotated 90 degrees around Z axis, lying across x and x+1
        monolith.position.set(x + 1, 0, z);
        monolith.rotation.set(0, 0, -Math.PI / 2);
      } else if (orientation === 'HORIZONTAL_Z') {
        // Rotated 90 degrees around X axis, lying across z and z+1
        monolith.position.set(x, 0, z);
        monolith.rotation.set(Math.PI / 2, 0, 0);
      }

      this.blockGroup.add(monolith);
      this.splitA = null;
      this.splitB = null;
    } else {
      // Split mode: Two 1x1 companion cubes
      const cubeA = BlockMeshFactory.createCompanionCube(0x38bdf8, 0x0284c7, this.textureLib);
      cubeA.position.set(this.puzzleEngine.split.cubeA.x, 0, this.puzzleEngine.split.cubeA.z);
      this.blockGroup.add(cubeA);
      this.splitA = cubeA;

      const cubeB = BlockMeshFactory.createCompanionCube(0xa855f7, 0x7e22ce, this.textureLib);
      cubeB.position.set(this.puzzleEngine.split.cubeB.x, 0, this.puzzleEngine.split.cubeB.z);
      this.blockGroup.add(cubeB);
      this.splitB = cubeB;
    }

    // Update bridge visibility based on state
    this.updateBridges();
  }

  /**
   * Display or update rival ghost monolith during multiplayer races.
   */
  public updateOpponentGhost(pos?: { x: number; z: number; orientation: string }) {
    while (this.ghostGroup.children.length > 0) {
      const child = this.ghostGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      this.ghostGroup.remove(child);
    }

    if (!pos) return;

    // Holographic ghost material
    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7, // Translucent purple / neon
      emissive: 0x9333ea,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2,
      wireframe: false,
    });

    const isStanding = pos.orientation === 'STANDING';
    const isX = pos.orientation === 'HORIZONTAL_X';
    const geo = isStanding
      ? new THREE.BoxGeometry(0.9, 1.9, 0.9)
      : isX
      ? new THREE.BoxGeometry(1.9, 0.9, 0.9)
      : new THREE.BoxGeometry(0.9, 0.9, 1.9);

    const ghostMesh = new THREE.Mesh(geo, ghostMat);

    if (isStanding) {
      ghostMesh.position.set(pos.x, 1.0, pos.z);
    } else if (isX) {
      ghostMesh.position.set(pos.x + 0.5, 0.5, pos.z);
    } else {
      ghostMesh.position.set(pos.x, 0.5, pos.z + 0.5);
    }

    this.ghostGroup.add(ghostMesh);
  }

  public clearOpponentGhost() {
    while (this.ghostGroup.children.length > 0) {
      this.ghostGroup.remove(this.ghostGroup.children[0]);
    }
  }

  public updateBridges() {
    this.tilesGroup.traverse((child) => {
      if (child.userData?.isBridge && this.puzzleEngine.currentLevel.bridges) {
        const { x, z } = child.userData;
        const bridge = this.puzzleEngine.currentLevel.bridges.find((b) =>
          b.tiles.some((t) => t.x === x && t.z === z)
        );
        if (bridge) {
          const isOpen = this.puzzleEngine.bridgesState[bridge.bridgeId];
          child.visible = !!isOpen;
        }
      }
    });
  }

  /**
   * Smooth physics-based rolling animation.
   */
  public animateRoll(
    pivot: [number, number, number],
    axis: 'X' | 'Z',
    angle: number,
    onComplete: () => void
  ) {
    this.isAnimatingRoll = true;
    this.rollProgress = 0;
    this.rollPivot.set(pivot[0], pivot[1], pivot[2]);
    this.rollAxisVec.set(axis === 'X' ? 1 : 0, 0, axis === 'Z' ? 1 : 0);
    this.rollTargetAngle = angle;
    this.currentRollCallback = onComplete;

    const blockMesh = this.blockGroup.children[0];
    if (blockMesh) {
      this.rollStartPos.copy(blockMesh.position);
      this.rollStartQuat.copy(blockMesh.quaternion);
    }
  }

  /**
   * Trigger falling into abyss animation when stepping onto void.
   */
  public triggerFall(onComplete: () => void) {
    this.isFalling = true;
    this.fallVelocityY = 0;
    this.fallRotationSpeed = 0.05;

    setTimeout(() => {
      this.isFalling = false;
      onComplete();
    }, 1100);
  }

  /**
   * Spawn 3D victory or impact particle burst.
   */
  public spawnParticleBurst(x: number, y: number, z: number, colorHex: number, count: number = 40) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];
    const lifespans: number[] = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      const vy = Math.random() * 5 + 2;

      velocities.push(
        new THREE.Vector3(Math.cos(angle) * speed, vy, Math.sin(angle) * speed)
      );
      lifespans.push(0);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.16,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Points(geo, mat);
    this.scene.add(mesh);
    this.particles.push({
      mesh,
      velocities,
      lifespans,
      maxLife: 1.2,
    });
  }

  /**
   * Camera View Preset: Isometric / Top-Down / Hero Close-up
   */
  public setCameraView(preset: 'ISO' | 'TOP' | 'HERO') {
    const target = this.controls.target;
    if (preset === 'ISO') {
      this.camera.position.set(target.x + 10, target.y + 14, target.z + 12);
    } else if (preset === 'TOP') {
      this.camera.position.set(target.x, target.y + 22, target.z + 0.1);
    } else if (preset === 'HERO') {
      this.camera.position.set(target.x + 6, target.y + 7, target.z + 7);
    }
    this.camera.lookAt(target);
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
  }

  private startLoop() {
    const tick = () => {
      const dt = Math.min(this.clock.getDelta(), 0.05);

      this.updateSimulation(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();

    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateSimulation(dt: number) {
    // 1. Controls update
    this.controls.update();

    // 2. Cinematic title screen camera pan
    if (this.isCinematicPanning) {
      const time = this.clock.getElapsedTime();
      const radius = 16;
      this.camera.position.x = this.controls.target.x + Math.sin(time * 0.25) * radius;
      this.camera.position.z = this.controls.target.z + Math.cos(time * 0.25) * radius;
      this.camera.position.y = this.controls.target.y + 11 + Math.sin(time * 0.4) * 2;
      this.camera.lookAt(this.controls.target);
    }

    // 3. Goal beacon pulse animation
    if (this.goalBeaconMesh) {
      const time = this.clock.getElapsedTime();
      const ring = this.goalBeaconMesh.children[1];
      if (ring) {
        ring.position.y = 0.25 + Math.sin(time * 3) * 0.15;
        ring.rotation.z += dt * 0.8;
      }
    }

    // 4. Rolling animation interpolation
    if (this.isAnimatingRoll) {
      this.rollProgress += dt * 5.2; // ~0.19 sec roll speed for snappy feedback

      if (this.rollProgress >= 1.0) {
        this.rollProgress = 1.0;
        this.isAnimatingRoll = false;

        this.updateBlockMeshes();
        if (this.currentRollCallback) {
          const cb = this.currentRollCallback;
          this.currentRollCallback = null;
          cb();
        }
      } else {
        // S-curve smoothstep easing
        const t = this.rollProgress;
        const eased = t * t * (3 - 2 * t);
        const currentAngle = this.rollTargetAngle * eased;

        const blockMesh = this.blockGroup.children[0];
        if (blockMesh) {
          // Rotate mesh position and orientation around rollPivot
          _quatA.setFromAxisAngle(this.rollAxisVec, currentAngle);

          // Relative position from pivot
          _vec3A.copy(this.rollStartPos).sub(this.rollPivot);
          _vec3A.applyQuaternion(_quatA);
          blockMesh.position.copy(this.rollPivot).add(_vec3A);

          blockMesh.quaternion.multiplyQuaternions(_quatA, this.rollStartQuat);
        }
      }
    }

    // 5. Falling into abyss physics
    if (this.isFalling) {
      this.fallVelocityY += 28 * dt; // Gravity
      this.fallRotationSpeed += dt * 2;

      this.blockGroup.children.forEach((mesh) => {
        mesh.position.y -= this.fallVelocityY * dt;
        mesh.rotation.x += this.fallRotationSpeed * dt;
        mesh.rotation.z += this.fallRotationSpeed * 0.7 * dt;
      });
    }

    // 6. Particle update & cleanup
    for (let pIdx = this.particles.length - 1; pIdx >= 0; pIdx--) {
      const pGroup = this.particles[pIdx];
      const positions = pGroup.mesh.geometry.attributes.position.array as Float32Array;
      let allDead = true;

      for (let i = 0; i < pGroup.lifespans.length; i++) {
        pGroup.lifespans[i] += dt;
        if (pGroup.lifespans[i] < pGroup.maxLife) {
          allDead = false;
          // Apply velocity and gravity
          pGroup.velocities[i].y -= 9.8 * dt;
          positions[i * 3] += pGroup.velocities[i].x * dt;
          positions[i * 3 + 1] += pGroup.velocities[i].y * dt;
          positions[i * 3 + 2] += pGroup.velocities[i].z * dt;
        }
      }

      pGroup.mesh.geometry.attributes.position.needsUpdate = true;
      const progress = pGroup.lifespans[0] / pGroup.maxLife;
      (pGroup.mesh.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - progress);

      if (allDead) {
        this.scene.remove(pGroup.mesh);
        pGroup.mesh.geometry.dispose();
        (pGroup.mesh.material as THREE.Material).dispose();
        this.particles.splice(pIdx, 1);
      }
    }
  }

  public dispose() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      clearTimeout(this.frameId);
    }
    this.controls.dispose();
    this.renderer.dispose();
  }
}
