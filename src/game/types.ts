/**
 * Types and interfaces for Cubiverse 3D puzzle engine.
 */

export enum TileType {
  VOID = 0,
  NORMAL = 1,
  GOAL = 2,
  SOFT_SWITCH = 3,
  HEAVY_SWITCH = 4,
  FRAGILE = 5,
  SPLIT = 6,
  BRIDGE = 7,
  ROTATOR = 8,
  CRYSTAL_KEY = 9,
  FORCEFIELD = 10,
}

export type BlockOrientation = 'STANDING' | 'HORIZONTAL_X' | 'HORIZONTAL_Z';

export interface SingleBlockState {
  orientation: BlockOrientation;
  x: number;
  z: number;
}

export interface SplitBlockState {
  cubeA: { x: number; z: number };
  cubeB: { x: number; z: number };
  activeCube: 0 | 1;
}

export type MoveDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface BridgeLink {
  bridgeId: string;
  tiles: { x: number; z: number }[];
  defaultOpen: boolean;
}

export interface SwitchLink {
  x: number;
  z: number;
  targetBridgeId: string;
  isHeavy?: boolean;
  behavior?: 'TOGGLE' | 'OPEN_ONLY' | 'CLOSE_ONLY';
}

export interface SplitConfig {
  x: number;
  z: number;
  spawnA: { x: number; z: number };
  spawnB: { x: number; z: number };
}

export interface RotatorConfig {
  x: number;
  z: number;
  centerX: number;
  centerZ: number;
  radius: number; // radius of rotated area (e.g. 1 for 3x3)
}

export interface LevelData {
  id: number;
  name: string;
  nameFr: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile' | 'Expert';
  descriptionFr: string;
  grid: number[][]; // [row z][col x]
  startPos: { x: number; z: number };
  startOrientation?: BlockOrientation;
  parMoves: [number, number, number]; // [3 stars max moves, 2 stars max moves, 1 star max moves]
  bridges?: BridgeLink[];
  switches?: SwitchLink[];
  splits?: SplitConfig[];
  rotators?: RotatorConfig[];
  crystalKeys?: { x: number; z: number; id: string }[];
  forcefields?: { x: number; z: number; keyId: string }[];
  hintFr?: string;
  theme?: 'ASTRAL' | 'EMBER' | 'CRYSTAL' | 'NIGHT_NEON' | 'ANCIENT_GOLD';
}

export interface GameSnapshot {
  blockMode: 'SINGLE' | 'SPLIT';
  single: SingleBlockState;
  split: SplitBlockState;
  bridgesState: Record<string, boolean>; // bridgeId -> isOpen
  fragileBroken: string[]; // Set of "x,z" coordinates
  collectedKeys: string[];
  movesCount: number;
}
