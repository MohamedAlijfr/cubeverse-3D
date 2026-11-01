/**
 * Procedural Composite 3D Models for Cubiverse 3D.
 * Enforces the Three.js skill directive:
 * - 3–12 distinct procedural parts across primary silhouette, secondary read, and accent details.
 * - Varied roughness (>= 0.25 delta) & metalness between materials.
 * - Bottom-center pivot so it sits flush with tiles.
 */

import * as THREE from 'three';
import { TextureLibrary } from './proceduralTextures';

export class BlockMeshFactory {
  /**
   * Creates a composite 1x1x2 monolith group (pivoted at bottom-center [0, 0, 0]).
   * In standing mode: height is 2.0 (Y from 0 to 2), width is 1.0 (X from -0.5 to 0.5), depth is 1.0 (Z from -0.5 to 0.5).
   */
  public static createMonolith(textureLib: TextureLibrary): THREE.Group {
    const group = new THREE.Group();
    group.name = 'hero_monolith';

    // Materials with realistic PBR properties and contrasting roughness/metalness
    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.15,
      map: textureLib.monolithTexture,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Polished bronze / gold
      roughness: 0.2,  // Difference > 0.25 from obsidian
      metalness: 0.95,
    });

    const glowCoreMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan pulse
      emissive: 0x0891b2,
      emissiveIntensity: 1.4,
      roughness: 0.1,
      metalness: 0.3,
    });

    const runeAccentMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.6,
    });

    // PART 1: Lower beveled segment (Y: 0.02 to 0.98)
    const lowerGeo = createRoundedBoxGeometry(0.96, 0.96, 0.96, 0.05, 3);
    const lowerMesh = new THREE.Mesh(lowerGeo, obsidianMat);
    lowerMesh.position.set(0, 0.5, 0);
    lowerMesh.castShadow = true;
    lowerMesh.receiveShadow = true;
    group.add(lowerMesh);

    // PART 2: Upper beveled segment (Y: 1.02 to 1.98)
    const upperGeo = createRoundedBoxGeometry(0.96, 0.96, 0.96, 0.05, 3);
    const upperMesh = new THREE.Mesh(upperGeo, obsidianMat);
    upperMesh.position.set(0, 1.5, 0);
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    group.add(upperMesh);

    // PART 3: Central glowing energy conduit seam between lower and upper segments (Y: 1.0)
    const seamGeo = new THREE.BoxGeometry(0.88, 0.06, 0.88);
    const seamMesh = new THREE.Mesh(seamGeo, glowCoreMat);
    seamMesh.position.set(0, 1.0, 0);
    group.add(seamMesh);

    // PART 4: Polished brass corner brackets on all 8 outer corners
    const bracketGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const cornerPositions = [
      // Bottom 4 corners
      [-0.46, 0.06, -0.46],
      [0.46, 0.06, -0.46],
      [-0.46, 0.06, 0.46],
      [0.46, 0.06, 0.46],
      // Top 4 corners
      [-0.46, 1.94, -0.46],
      [0.46, 1.94, -0.46],
      [-0.46, 1.94, 0.46],
      [0.46, 1.94, 0.46],
    ];

    cornerPositions.forEach((pos) => {
      const bracket = new THREE.Mesh(bracketGeo, brassMat);
      bracket.position.set(pos[0], pos[1], pos[2]);
      bracket.castShadow = true;
      group.add(bracket);
    });

    // PART 5: Center waist girdle band (Reinforcement ring)
    const ringShape = new THREE.Shape();
    ringShape.moveTo(-0.5, -0.5);
    ringShape.lineTo(0.5, -0.5);
    ringShape.lineTo(0.5, 0.5);
    ringShape.lineTo(-0.5, 0.5);
    ringShape.closePath();

    const ringHole = new THREE.Path();
    ringHole.moveTo(-0.46, -0.46);
    ringHole.lineTo(0.46, -0.46);
    ringHole.lineTo(0.46, 0.46);
    ringHole.lineTo(-0.46, 0.46);
    ringHole.closePath();
    ringShape.holes.push(ringHole);

    const ringGeo = new THREE.ExtrudeGeometry(ringShape, {
      depth: 0.08,
      bevelEnabled: false,
    });
    ringGeo.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, brassMat);
    ringMesh.position.set(0, 1.04, 0);
    group.add(ringMesh);

    // PART 6: Apex runic beacon gem
    const apexGeo = new THREE.ConeGeometry(0.08, 0.14, 4);
    const apexMesh = new THREE.Mesh(apexGeo, glowCoreMat);
    apexMesh.position.set(0, 2.05, 0);
    apexMesh.rotation.y = Math.PI / 4;
    group.add(apexMesh);

    // PART 7: Internal light source for ambient glow
    const innerLight = new THREE.PointLight(0x06b6d4, 1.2, 3);
    innerLight.position.set(0, 1.0, 0);
    group.add(innerLight);

    return group;
  }

  /**
   * Creates a composite 1x1x1 companion cube for split mode.
   */
  public static createCompanionCube(
    accentColor: number,
    emissiveColor: number,
    textureLib: TextureLibrary
  ): THREE.Group {
    const group = new THREE.Group();

    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
      metalness: 0.2,
      map: textureLib.monolithTexture,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.9,
    });

    const coreGlowMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: emissiveColor,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.4,
    });

    // 1. Core cube
    const bodyGeo = createRoundedBoxGeometry(0.94, 0.94, 0.94, 0.04, 3);
    const body = new THREE.Mesh(bodyGeo, obsidianMat);
    body.position.set(0, 0.5, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // 2. Corner caps (8 corners)
    const capGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    [
      [-0.44, 0.05, -0.44], [0.44, 0.05, -0.44],
      [-0.44, 0.05, 0.44], [0.44, 0.05, 0.44],
      [-0.44, 0.95, -0.44], [0.44, 0.95, -0.44],
      [-0.44, 0.95, 0.44], [0.44, 0.95, 0.44],
    ].forEach((pos) => {
      const cap = new THREE.Mesh(capGeo, brassMat);
      cap.position.set(pos[0], pos[1], pos[2]);
      group.add(cap);
    });

    // 3. Central glowing rune on top face
    const gemGeo = new THREE.OctahedronGeometry(0.12);
    const gem = new THREE.Mesh(gemGeo, coreGlowMat);
    gem.position.set(0, 0.99, 0);
    group.add(gem);

    // 4. Subtle point light
    const ptLight = new THREE.PointLight(accentColor, 1.0, 2);
    ptLight.position.set(0, 0.5, 0);
    group.add(ptLight);

    return group;
  }
}

/**
 * Procedural helper to create beveled rounded box geometry without external loaders.
 */
function createRoundedBoxGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  smoothness: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const eps = 0.00001;
  const radiusMinus = radius - eps;
  const w = width / 2;
  const h = height / 2;

  shape.absarc(w - radius, h - radius, radiusMinus, 0, Math.PI / 2, false);
  shape.absarc(-w + radius, h - radius, radiusMinus, Math.PI / 2, Math.PI, false);
  shape.absarc(-w + radius, -h + radius, radiusMinus, Math.PI, (Math.PI * 3) / 2, false);
  shape.absarc(w - radius, -h + radius, radiusMinus, (Math.PI * 3) / 2, Math.PI * 2, false);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - radius * 2,
    bevelEnabled: true,
    bevelSegments: smoothness,
    steps: 1,
    bevelSize: radiusMinus,
    bevelThickness: radius,
  });

  geometry.center();
  return geometry;
}
