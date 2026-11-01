/**
 * Procedural texture generation for Cubiverse 3D.
 * Guarantees zero 404s, sharp grazing-angle anisotropy, and SRGBColorSpace.
 */

import * as THREE from 'three';

export class TextureLibrary {
  private static instance: TextureLibrary;
  public normalTileTexture: THREE.CanvasTexture;
  public fragileTileTexture: THREE.CanvasTexture;
  public softSwitchTexture: THREE.CanvasTexture;
  public heavySwitchTexture: THREE.CanvasTexture;
  public bridgeTexture: THREE.CanvasTexture;
  public goalTexture: THREE.CanvasTexture;
  public splitTexture: THREE.CanvasTexture;
  public monolithTexture: THREE.CanvasTexture;
  public cosmicBackgroundTexture: THREE.CanvasTexture;

  private constructor() {
    this.normalTileTexture = this.createNormalTileTexture();
    this.fragileTileTexture = this.createFragileTileTexture();
    this.softSwitchTexture = this.createSwitchTexture(false);
    this.heavySwitchTexture = this.createSwitchTexture(true);
    this.bridgeTexture = this.createBridgeTexture();
    this.goalTexture = this.createGoalTexture();
    this.splitTexture = this.createSplitTexture();
    this.monolithTexture = this.createMonolithTexture();
    this.cosmicBackgroundTexture = this.createCosmicTexture();
  }

  public static getInstance(): TextureLibrary {
    if (!TextureLibrary.instance) {
      TextureLibrary.instance = new TextureLibrary();
    }
    return TextureLibrary.instance;
  }

  public applyAnisotropy(maxAnisotropy: number) {
    const textures = [
      this.normalTileTexture,
      this.fragileTileTexture,
      this.softSwitchTexture,
      this.heavySwitchTexture,
      this.bridgeTexture,
      this.goalTexture,
      this.splitTexture,
      this.monolithTexture,
    ];
    textures.forEach((t) => {
      t.anisotropy = maxAnisotropy;
      t.needsUpdate = true;
    });
  }

  /**
   * Normal stone tile with subtle sci-fi border & central glyph.
   */
  private createNormalTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base stone gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#1c2230');
    grad.addColorStop(0.5, '#252e42');
    grad.addColorStop(1, '#181d29');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle stone flecks & micro-grain
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const r = Math.random() * 2 + 0.5;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer border bevel
    ctx.strokeStyle = '#3b4a6b';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 492, 492);

    // Inner glowing trace
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, 456, 456);

    // Center subtle geometric emblem
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 256, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Corner tech notches
    ctx.fillStyle = '#60a5fa';
    [
      [36, 36],
      [476, 36],
      [36, 476],
      [476, 476],
    ].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Fragile obsidian tile with glowing fissure cracks.
   */
  private createFragileTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark obsidian / orange glow base
    ctx.fillStyle = '#181216';
    ctx.fillRect(0, 0, 512, 512);

    // Warning amber border
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, 488, 488);

    // Draw jagged glowing crack lines across tile
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 12;

    const cracks = [
      [[40, 60], [120, 160], [200, 180], [256, 256], [340, 320], [460, 430]],
      [[256, 256], [220, 340], [160, 420], [140, 480]],
      [[200, 180], [280, 120], [380, 80], [460, 60]],
      [[340, 320], [420, 260], [480, 240]],
    ];

    cracks.forEach((pts) => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.stroke();
    });

    // Reset shadow
    ctx.shadowBlur = 0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Soft switch (circle) vs Heavy switch (diamond runic).
   */
  private createSwitchTexture(isHeavy: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Stone background
    ctx.fillStyle = '#1c2230';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#3b4a6b';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 492, 492);

    if (!isHeavy) {
      // Soft switch: glowing concentric circles
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.arc(256, 256, 150, 0, Math.PI * 2);
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(256, 256, 75, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
    } else {
      // Heavy switch: runic diamond with warning crosshairs & weight symbol
      ctx.strokeStyle = '#ec4899'; // Vibrant magenta / rose
      ctx.fillStyle = 'rgba(236, 72, 153, 0.3)';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 25;

      ctx.beginPath();
      ctx.moveTo(256, 80);
      ctx.lineTo(432, 256);
      ctx.lineTo(256, 432);
      ctx.lineTo(80, 256);
      ctx.closePath();
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.fill();

      // Center heavy weight emblem
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(256, 256, 40, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Energy bridge tile with pulsating lattice grid.
   */
  private createBridgeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Transparent holographic base
    ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
    ctx.fillRect(0, 0, 512, 512);

    // Glowing cyan grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 492);

    // Internal diamond lattice
    ctx.lineWidth = 4;
    for (let i = 64; i < 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 20);
      ctx.lineTo(512 - 20, 512 - i);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(20, i);
      ctx.lineTo(512 - i, 512 - 20);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Goal portal tile: glowing radiant concentric vortex.
   */
  private createGoalTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    // Gold / Emerald mystic beacon
    const rad = ctx.createRadialGradient(256, 256, 20, 256, 256, 240);
    rad.addColorStop(0, '#34d399');
    rad.addColorStop(0.4, '#10b981');
    rad.addColorStop(0.8, '#047857');
    rad.addColorStop(1, '#064e3b');

    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(256, 256, 210, 0, Math.PI * 2);
    ctx.fill();

    // Runic circular border
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(256, 256, 210, 0, Math.PI * 2);
    ctx.stroke();

    // Center star beacon
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(256, 256, 45, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Split portal tile.
   */
  private createSplitTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, 512, 512);

    // Dual quantum swirls (Purple / Violet)
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, 484, 484);

    // Left and right miniature icons
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(100, 180, 120, 150);
    ctx.fillRect(290, 180, 120, 150);

    ctx.strokeStyle = '#f3e8ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(100, 180, 120, 150);
    ctx.strokeRect(290, 180, 120, 150);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Hero monolith procedural skin texture with gold trimmed engravings and glowing seams.
   */
  private createMonolithTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Polished dark slate/obsidian
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Brass/Gold perimeter trim
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 18;
    ctx.strokeRect(12, 12, 488, 488);

    // Inner glowing turquoise circuit runes
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;

    ctx.strokeRect(36, 36, 440, 440);

    // Tech line glyphs
    ctx.beginPath();
    ctx.moveTo(36, 256);
    ctx.lineTo(160, 256);
    ctx.lineTo(256, 160);
    ctx.lineTo(352, 256);
    ctx.lineTo(476, 256);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(256, 36);
    ctx.lineTo(256, 160);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(256, 352);
    ctx.lineTo(256, 476);
    ctx.stroke();

    // Center rune star
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.arc(256, 256, 24, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Atmospheric cosmic background starfield with nebula clouds.
   */
  private createCosmicTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Deep cosmic space gradient
    const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 600);
    grad.addColorStop(0, '#131b2e');
    grad.addColorStop(0.5, '#0b0f19');
    grad.addColorStop(1, '#05070c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Nebula dust streaks
    for (let n = 0; n < 8; n++) {
      const cx = Math.random() * 1024;
      const cy = Math.random() * 1024;
      const r = Math.random() * 300 + 150;
      const nGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
      const isPurple = Math.random() > 0.5;
      nGrad.addColorStop(0, isPurple ? 'rgba(147, 51, 234, 0.08)' : 'rgba(56, 189, 248, 0.07)');
      nGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant stars
    for (let i = 0; i < 700; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const brightness = Math.random();
      const radius = brightness > 0.95 ? 2.5 : Math.random() * 1.5;

      ctx.fillStyle = brightness > 0.8 ? '#ffffff' : (brightness > 0.5 ? '#93c5fd' : '#cbd5e1');
      ctx.globalAlpha = Math.random() * 0.7 + 0.3;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}
