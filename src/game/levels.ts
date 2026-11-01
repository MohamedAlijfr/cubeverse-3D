/**
 * Handcrafted puzzle levels for Cubiverse 3D with progressive difficulty curve.
 * 0 = VOID, 1 = NORMAL, 2 = GOAL, 3 = SOFT_SWITCH, 4 = HEAVY_SWITCH,
 * 5 = FRAGILE, 6 = SPLIT, 7 = BRIDGE (closed by default)
 */

import { LevelData, TileType } from './types';

export const LEVELS: LevelData[] = [
  // Niveau 1 : Initiation aux mouvements et à la verticalité
  {
    id: 1,
    name: 'First Steps',
    nameFr: 'Les Premiers Pas',
    difficulty: 'Facile',
    descriptionFr: 'Faites rouler le monolithe jusqu\'au portail. Vous devez arriver DEBOUT sur l\'objectif.',
    startPos: { x: 1, z: 1 },
    startOrientation: 'STANDING',
    parMoves: [7, 10, 14],
    theme: 'ASTRAL',
    hintFr: 'Roulez vers la droite puis vers le bas. N\'oubliez pas que le bloc occupe 2 cases lorsqu\'il est couché.',
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 1, 1, 2, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },

  // Niveau 2 : L'Interrupteur Souple & Pont Énergétique
  {
    id: 2,
    name: 'Soft Switch',
    nameFr: "L'Interrupteur Souple",
    difficulty: 'Facile',
    descriptionFr: 'Activez l\'interrupteur circulaire pour déployer le pont d\'énergie vers l\'autre rive.',
    startPos: { x: 1, z: 2 },
    startOrientation: 'STANDING',
    parMoves: [12, 16, 22],
    theme: 'ASTRAL',
    hintFr: 'N\'importe quelle face du bloc peut activer l\'interrupteur circulaire.',
    bridges: [
      {
        bridgeId: 'b1',
        defaultOpen: false,
        tiles: [{ x: 4, z: 2 }, { x: 5, z: 2 }],
      },
    ],
    switches: [
      {
        x: 2,
        z: 4,
        targetBridgeId: 'b1',
        isHeavy: false,
        behavior: 'TOGGLE',
      },
    ],
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
      [0, 1, 1, 1, 7, 7, 1, 1, 2, 0],
      [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
      [0, 1, 3, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },

  // Niveau 3 : La Dalle de Pression Lourde
  {
    id: 3,
    name: 'Heavy Pressure Plate',
    nameFr: 'La Dalle Lourde',
    difficulty: 'Moyen',
    descriptionFr: 'L\'interrupteur en losange requiert toute la masse du monolithe : vous devez atterrir DEBOUT dessus !',
    startPos: { x: 1, z: 1 },
    startOrientation: 'STANDING',
    parMoves: [16, 22, 30],
    theme: 'ANCIENT_GOLD',
    hintFr: 'Planifiez vos rotations pour que le bloc retombe exactement à la verticale sur la dalle losange.',
    bridges: [
      {
        bridgeId: 'b1',
        defaultOpen: false,
        tiles: [{ x: 5, z: 2 }, { x: 5, z: 3 }],
      },
    ],
    switches: [
      {
        x: 2,
        z: 4,
        targetBridgeId: 'b1',
        isHeavy: true,
        behavior: 'TOGGLE',
      },
    ],
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 7, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 7, 1, 2, 1, 0],
      [0, 1, 4, 1, 0, 0, 1, 1, 1, 0],
      [0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },

  // Niveau 4 : Le Verre d'Obsidienne Fissuré (Dalles Fragiles)
  {
    id: 4,
    name: 'Fragile Obsidian',
    nameFr: 'Terres Fragiles',
    difficulty: 'Moyen',
    descriptionFr: 'Les dalles orange craquelées ne supportent pas le bloc debout ! Traversez-les uniquement couché.',
    startPos: { x: 1, z: 1 },
    startOrientation: 'STANDING',
    parMoves: [14, 19, 26],
    theme: 'EMBER',
    hintFr: 'Si vous vous dressez à la verticale sur une dalle fissurée, elle s\'effondre. Répartissez votre poids à l\'horizontale.',
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 5, 5, 1, 1, 1, 0],
      [0, 0, 1, 1, 5, 5, 1, 2, 1, 0],
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },

  // Niveau 5 : La Scission Quantique (Dual Cubes)
  {
    id: 5,
    name: 'Quantum Split',
    nameFr: 'La Scission Quantique',
    difficulty: 'Difficile',
    descriptionFr: 'Atterrissez debout sur le téléporteur pour séparer le monolithe en deux cubes indépendants (Touche Tab pour basculer).',
    startPos: { x: 1, z: 2 },
    startOrientation: 'STANDING',
    parMoves: [24, 32, 45],
    theme: 'CRYSTAL',
    hintFr: 'Chaque cube peut activer un interrupteur. Rapprochez les deux cubes pour les fusionner à nouveau.',
    bridges: [
      {
        bridgeId: 'b1',
        defaultOpen: false,
        tiles: [{ x: 5, z: 1 }, { x: 5, z: 2 }],
      },
      {
        bridgeId: 'b2',
        defaultOpen: false,
        tiles: [{ x: 5, z: 3 }, { x: 5, z: 4 }],
      },
    ],
    switches: [
      {
        x: 4,
        z: 0,
        targetBridgeId: 'b1',
        isHeavy: false,
        behavior: 'TOGGLE',
      },
      {
        x: 4,
        z: 5,
        targetBridgeId: 'b2',
        isHeavy: false,
        behavior: 'TOGGLE',
      },
    ],
    splits: [
      {
        x: 2,
        z: 2,
        spawnA: { x: 3, z: 1 },
        spawnB: { x: 3, z: 4 },
      },
    ],
    grid: [
      [0, 0, 0, 0, 3, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 7, 1, 1, 1, 0],
      [0, 1, 6, 1, 0, 7, 1, 2, 1, 0],
      [0, 1, 1, 1, 0, 7, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 7, 0, 0, 0, 0],
      [0, 0, 0, 0, 3, 0, 0, 0, 0, 0],
    ],
  },

  // Niveau 6 : Les Ponts Jumeaux & Double Bascule
  {
    id: 6,
    name: 'Twin Bridges',
    nameFr: 'Les Ponts Jumeaux',
    difficulty: 'Difficile',
    descriptionFr: 'Certains interrupteurs ouvrent un pont tout en refermant l\'autre. Coordonnez vos traversées.',
    startPos: { x: 1, z: 2 },
    startOrientation: 'STANDING',
    parMoves: [22, 29, 40],
    theme: 'NIGHT_NEON',
    hintFr: 'Vous devez faire un détour pour réactiver le pont de sortie depuis la plate-forme intermédiaire.',
    bridges: [
      {
        bridgeId: 'b1',
        defaultOpen: true,
        tiles: [{ x: 3, z: 2 }],
      },
      {
        bridgeId: 'b2',
        defaultOpen: false,
        tiles: [{ x: 6, z: 2 }],
      },
    ],
    switches: [
      {
        x: 4,
        z: 0,
        targetBridgeId: 'b1',
        isHeavy: false,
        behavior: 'TOGGLE',
      },
      {
        x: 5,
        z: 4,
        targetBridgeId: 'b2',
        isHeavy: true,
        behavior: 'TOGGLE',
      },
    ],
    grid: [
      [0, 0, 0, 0, 3, 0, 0, 0, 0],
      [0, 1, 1, 0, 1, 1, 0, 1, 1],
      [0, 1, 1, 7, 1, 1, 7, 1, 2],
      [0, 1, 1, 0, 1, 1, 0, 1, 1],
      [0, 0, 0, 0, 0, 4, 0, 0, 0],
    ],
  },

  // Niveau 7 : L'Enclave Étroite & Dalles Fissurées
  {
    id: 7,
    name: 'Narrow Peril',
    nameFr: 'Péril Suspendu',
    difficulty: 'Difficile',
    descriptionFr: 'Un chemin en lacets bordé de gouffres et de dalles fragiles. Tout faux pas est fatal.',
    startPos: { x: 1, z: 1 },
    startOrientation: 'STANDING',
    parMoves: [20, 27, 38],
    theme: 'EMBER',
    hintFr: 'Prenez le virage à angle droit en vous relevant sur les dalles solides pour changer l\'axe de roulement.',
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 5, 5, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 5, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 5, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },

  // Niveau 8 : Le Sanctuaire des Dualités
  {
    id: 8,
    name: 'Sanctuary of Duality',
    nameFr: 'Sanctuaire des Dualités',
    difficulty: 'Expert',
    descriptionFr: 'Combinez scission quantique, dalles de verre fragiles et dalles de pression lourdes.',
    startPos: { x: 1, z: 2 },
    startOrientation: 'STANDING',
    parMoves: [32, 42, 60],
    theme: 'CRYSTAL',
    hintFr: 'Séparez vos cubes pour envoyer un éclaireur sur la dalle d\'interrupteur éloignée pendant que l\'autre traverse le passage étroit.',
    bridges: [
      {
        bridgeId: 'b1',
        defaultOpen: false,
        tiles: [{ x: 5, z: 2 }, { x: 6, z: 2 }],
      },
    ],
    switches: [
      {
        x: 4,
        z: 4,
        targetBridgeId: 'b1',
        isHeavy: false,
        behavior: 'TOGGLE',
      },
    ],
    splits: [
      {
        x: 2,
        z: 2,
        spawnA: { x: 1, z: 1 },
        spawnB: { x: 3, z: 3 },
      },
    ],
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 0, 0, 0, 0, 1, 1, 0],
      [0, 1, 6, 1, 1, 7, 7, 1, 2, 0],
      [0, 0, 1, 1, 1, 0, 0, 1, 1, 0],
      [0, 0, 0, 0, 3, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },

  // Niveau 9 : Le Dédale du Labyrinthe Astral
  {
    id: 9,
    name: 'Astral Labyrinth',
    nameFr: 'Le Labyrinthe Astral',
    difficulty: 'Expert',
    descriptionFr: 'Un réseau complexe d\'interrupteurs croisés et de zones d\'accostage millimétrées.',
    startPos: { x: 1, z: 3 },
    startOrientation: 'STANDING',
    parMoves: [34, 46, 65],
    theme: 'ANCIENT_GOLD',
    hintFr: 'Plusieurs fausses pistes mènent à des impasses de parité. Calculez vos virages 3 coups à l\'avance.',
    bridges: [
      {
        bridgeId: 'b1',
        defaultOpen: false,
        tiles: [{ x: 3, z: 2 }],
      },
      {
        bridgeId: 'b2',
        defaultOpen: false,
        tiles: [{ x: 6, z: 3 }],
      },
    ],
    switches: [
      {
        x: 2,
        z: 1,
        targetBridgeId: 'b1',
        isHeavy: false,
        behavior: 'TOGGLE',
      },
      {
        x: 5,
        z: 1,
        targetBridgeId: 'b2',
        isHeavy: true,
        behavior: 'TOGGLE',
      },
    ],
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 3, 1, 0, 4, 1, 1, 0, 0],
      [0, 1, 1, 7, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 7, 1, 2, 0],
      [0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },

  // Niveau 10 : L'Épreuve du Grand Architecte (Climax Final)
  {
    id: 10,
    name: 'The Grand Architect',
    nameFr: "L'Épreuve de l'Architecte",
    difficulty: 'Expert',
    descriptionFr: 'Le test ultime des maîtres de l\'espace : synchronisation quantique, dalles fragiles et triple pont.',
    startPos: { x: 1, z: 2 },
    startOrientation: 'STANDING',
    parMoves: [42, 56, 80],
    theme: 'ASTRAL',
    hintFr: 'Activez la dalle de pression intermédiaire avant de scinder les cubes pour préparer le chemin de retour.',
    bridges: [
      {
        bridgeId: 'b1',
        defaultOpen: false,
        tiles: [{ x: 4, z: 2 }, { x: 4, z: 3 }],
      },
      {
        bridgeId: 'b2',
        defaultOpen: false,
        tiles: [{ x: 7, z: 2 }],
      },
    ],
    switches: [
      {
        x: 3,
        z: 4,
        targetBridgeId: 'b1',
        isHeavy: true,
        behavior: 'TOGGLE',
      },
      {
        x: 6,
        z: 0,
        targetBridgeId: 'b2',
        isHeavy: false,
        behavior: 'TOGGLE',
      },
    ],
    splits: [
      {
        x: 2,
        z: 2,
        spawnA: { x: 1, z: 1 },
        spawnB: { x: 3, z: 1 },
      },
    ],
    grid: [
      [0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
      [0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0],
      [0, 1, 6, 1, 7, 1, 1, 7, 1, 1, 2],
      [0, 1, 1, 1, 7, 5, 5, 1, 1, 1, 0],
      [0, 0, 1, 4, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
];
