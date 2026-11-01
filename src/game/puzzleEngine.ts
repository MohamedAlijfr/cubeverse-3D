/**
 * Core mathematical rules and game state engine for Cubiverse 3D.
 */

import {
  BlockOrientation,
  GameSnapshot,
  LevelData,
  MoveDirection,
  SingleBlockState,
  SplitBlockState,
  TileType,
} from './types';

export interface MoveResult {
  valid: boolean;
  fell: boolean;
  fallReason?: 'VOID' | 'FRAGILE';
  won: boolean;
  splitTriggered: boolean;
  fusedTriggered: boolean;
  switchesActivated: string[]; // bridgeIds affected
  pivotPoint: [number, number, number];
  rollAxis: 'X' | 'Z';
  rollAngle: number;
}

export class PuzzleEngine {
  public currentLevel: LevelData;
  public blockMode: 'SINGLE' | 'SPLIT' = 'SINGLE';
  public single: SingleBlockState;
  public split: SplitBlockState;
  public bridgesState: Record<string, boolean> = {};
  public fragileBroken: Set<string> = new Set();
  public movesCount: number = 0;
  private history: GameSnapshot[] = [];

  constructor(level: LevelData) {
    this.currentLevel = level;
    this.single = {
      x: level.startPos.x,
      z: level.startPos.z,
      orientation: level.startOrientation || 'STANDING',
    };
    this.split = {
      cubeA: { x: level.startPos.x, z: level.startPos.z },
      cubeB: { x: level.startPos.x, z: level.startPos.z },
      activeCube: 0,
    };
    this.initLevelState();
  }

  public initLevelState() {
    this.blockMode = 'SINGLE';
    this.single = {
      x: this.currentLevel.startPos.x,
      z: this.currentLevel.startPos.z,
      orientation: this.currentLevel.startOrientation || 'STANDING',
    };
    this.split = {
      cubeA: { x: this.currentLevel.startPos.x, z: this.currentLevel.startPos.z },
      cubeB: { x: this.currentLevel.startPos.x, z: this.currentLevel.startPos.z },
      activeCube: 0,
    };
    this.movesCount = 0;
    this.fragileBroken.clear();
    this.history = [];

    // Initialize bridges
    this.bridgesState = {};
    if (this.currentLevel.bridges) {
      for (const b of this.currentLevel.bridges) {
        this.bridgesState[b.bridgeId] = b.defaultOpen;
      }
    }
  }

  public saveSnapshot() {
    this.history.push({
      blockMode: this.blockMode,
      single: { ...this.single },
      split: {
        cubeA: { ...this.split.cubeA },
        cubeB: { ...this.split.cubeB },
        activeCube: this.split.activeCube,
      },
      bridgesState: { ...this.bridgesState },
      fragileBroken: Array.from(this.fragileBroken),
      collectedKeys: [],
      movesCount: this.movesCount,
    });
  }

  public undo(): boolean {
    if (this.history.length === 0) return false;
    const prev = this.history.pop()!;
    this.blockMode = prev.blockMode;
    this.single = { ...prev.single };
    this.split = {
      cubeA: { ...prev.split.cubeA },
      cubeB: { ...prev.split.cubeB },
      activeCube: prev.split.activeCube,
    };
    this.bridgesState = { ...prev.bridgesState };
    this.fragileBroken = new Set(prev.fragileBroken);
    this.movesCount = prev.movesCount;
    return true;
  }

  public canUndo(): boolean {
    return this.history.length > 0;
  }

  public switchActiveCube() {
    if (this.blockMode === 'SPLIT') {
      this.split.activeCube = this.split.activeCube === 0 ? 1 : 0;
    }
  }

  /**
   * Get all grid coordinates currently occupied by the block.
   */
  public getOccupiedCells(): { x: number; z: number }[] {
    if (this.blockMode === 'SPLIT') {
      const active = this.split.activeCube === 0 ? this.split.cubeA : this.split.cubeB;
      return [{ x: active.x, z: active.z }];
    }

    const { x, z, orientation } = this.single;
    if (orientation === 'STANDING') {
      return [{ x, z }];
    } else if (orientation === 'HORIZONTAL_X') {
      return [{ x, z }, { x: x + 1, z }];
    } else {
      return [{ x, z }, { x, z: z + 1 }];
    }
  }

  /**
   * Execute a move in one of 4 cardinal directions.
   */
  public executeMove(dir: MoveDirection): MoveResult {
    this.saveSnapshot();
    this.movesCount++;

    if (this.blockMode === 'SPLIT') {
      return this.executeSplitMove(dir);
    } else {
      return this.executeSingleMove(dir);
    }
  }

  private executeSingleMove(dir: MoveDirection): MoveResult {
    const { x, z, orientation } = this.single;
    let nextX = x;
    let nextZ = z;
    let nextOrientation: BlockOrientation = orientation;

    let pivotX = x;
    let pivotZ = z;
    let rollAxis: 'X' | 'Z' = 'X';
    let rollAngle = Math.PI / 2;

    if (orientation === 'STANDING') {
      if (dir === 'RIGHT') {
        nextX = x + 1;
        nextZ = z;
        nextOrientation = 'HORIZONTAL_X';
        pivotX = x + 0.5;
        pivotZ = z;
        rollAxis = 'Z';
        rollAngle = -Math.PI / 2;
      } else if (dir === 'LEFT') {
        nextX = x - 2;
        nextZ = z;
        nextOrientation = 'HORIZONTAL_X';
        pivotX = x - 0.5;
        pivotZ = z;
        rollAxis = 'Z';
        rollAngle = Math.PI / 2;
      } else if (dir === 'UP') {
        nextX = x;
        nextZ = z - 2;
        nextOrientation = 'HORIZONTAL_Z';
        pivotX = x;
        pivotZ = z - 0.5;
        rollAxis = 'X';
        rollAngle = -Math.PI / 2;
      } else if (dir === 'DOWN') {
        nextX = x;
        nextZ = z + 1;
        nextOrientation = 'HORIZONTAL_Z';
        pivotX = x;
        pivotZ = z + 0.5;
        rollAxis = 'X';
        rollAngle = Math.PI / 2;
      }
    } else if (orientation === 'HORIZONTAL_X') {
      if (dir === 'RIGHT') {
        nextX = x + 2;
        nextZ = z;
        nextOrientation = 'STANDING';
        pivotX = x + 1.5;
        pivotZ = z;
        rollAxis = 'Z';
        rollAngle = -Math.PI / 2;
      } else if (dir === 'LEFT') {
        nextX = x - 1;
        nextZ = z;
        nextOrientation = 'STANDING';
        pivotX = x - 0.5;
        pivotZ = z;
        rollAxis = 'Z';
        rollAngle = Math.PI / 2;
      } else if (dir === 'UP') {
        nextX = x;
        nextZ = z - 1;
        nextOrientation = 'HORIZONTAL_X';
        pivotX = x + 0.5;
        pivotZ = z - 0.5;
        rollAxis = 'X';
        rollAngle = -Math.PI / 2;
      } else if (dir === 'DOWN') {
        nextX = x;
        nextZ = z + 1;
        nextOrientation = 'HORIZONTAL_X';
        pivotX = x + 0.5;
        pivotZ = z + 0.5;
        rollAxis = 'X';
        rollAngle = Math.PI / 2;
      }
    } else if (orientation === 'HORIZONTAL_Z') {
      if (dir === 'RIGHT') {
        nextX = x + 1;
        nextZ = z;
        nextOrientation = 'HORIZONTAL_Z';
        pivotX = x + 0.5;
        pivotZ = z + 0.5;
        rollAxis = 'Z';
        rollAngle = -Math.PI / 2;
      } else if (dir === 'LEFT') {
        nextX = x - 1;
        nextZ = z;
        nextOrientation = 'HORIZONTAL_Z';
        pivotX = x - 0.5;
        pivotZ = z + 0.5;
        rollAxis = 'Z';
        rollAngle = Math.PI / 2;
      } else if (dir === 'UP') {
        nextX = x;
        nextZ = z - 1;
        nextOrientation = 'STANDING';
        pivotX = x;
        pivotZ = z - 0.5;
        rollAxis = 'X';
        rollAngle = -Math.PI / 2;
      } else if (dir === 'DOWN') {
        nextX = x;
        nextZ = z + 2;
        nextOrientation = 'STANDING';
        pivotX = x;
        pivotZ = z + 1.5;
        rollAxis = 'X';
        rollAngle = Math.PI / 2;
      }
    }

    this.single.x = nextX;
    this.single.z = nextZ;
    this.single.orientation = nextOrientation;

    // Check cells occupied
    const occupied = this.getOccupiedCells();

    // 1. Check falling off edges / void
    let fell = false;
    let fallReason: 'VOID' | 'FRAGILE' | undefined = undefined;

    for (const cell of occupied) {
      const tile = this.getTileAt(cell.x, cell.z);
      if (tile === TileType.VOID) {
        fell = true;
        fallReason = 'VOID';
        break;
      }
    }

    // 2. Check fragile tile
    if (!fell && nextOrientation === 'STANDING') {
      const tile = this.getTileAt(nextX, nextZ);
      if (tile === TileType.FRAGILE) {
        fell = true;
        fallReason = 'FRAGILE';
        this.fragileBroken.add(`${nextX},${nextZ}`);
      }
    }

    if (fell) {
      return {
        valid: false,
        fell: true,
        fallReason,
        won: false,
        splitTriggered: false,
        fusedTriggered: false,
        switchesActivated: [],
        pivotPoint: [pivotX, 0, pivotZ],
        rollAxis,
        rollAngle,
      };
    }

    // 3. Check Split portal
    let splitTriggered = false;
    if (nextOrientation === 'STANDING' && this.currentLevel.splits) {
      for (const sp of this.currentLevel.splits) {
        if (sp.x === nextX && sp.z === nextZ) {
          splitTriggered = true;
          this.blockMode = 'SPLIT';
          this.split.cubeA = { ...sp.spawnA };
          this.split.cubeB = { ...sp.spawnB };
          this.split.activeCube = 0;
          break;
        }
      }
    }

    // 4. Check Switches
    const switchesActivated: string[] = [];
    if (!splitTriggered && this.currentLevel.switches) {
      for (const sw of this.currentLevel.switches) {
        const hitsSwitch = occupied.some((c) => c.x === sw.x && c.z === sw.z);
        if (hitsSwitch) {
          if (!sw.isHeavy || nextOrientation === 'STANDING') {
            this.bridgesState[sw.targetBridgeId] = !this.bridgesState[sw.targetBridgeId];
            switchesActivated.push(sw.targetBridgeId);
          }
        }
      }
    }

    // 5. Check Goal
    let won = false;
    if (nextOrientation === 'STANDING') {
      const tile = this.getTileAt(nextX, nextZ);
      if (tile === TileType.GOAL) {
        won = true;
      }
    }

    return {
      valid: true,
      fell: false,
      won,
      splitTriggered,
      fusedTriggered: false,
      switchesActivated,
      pivotPoint: [pivotX, 0, pivotZ],
      rollAxis,
      rollAngle,
    };
  }

  private executeSplitMove(dir: MoveDirection): MoveResult {
    const active = this.split.activeCube === 0 ? this.split.cubeA : this.split.cubeB;
    const inactive = this.split.activeCube === 0 ? this.split.cubeB : this.split.cubeA;

    let nextX = active.x;
    let nextZ = active.z;
    let pivotX = active.x;
    let pivotZ = active.z;
    let rollAxis: 'X' | 'Z' = 'X';
    let rollAngle = Math.PI / 2;

    if (dir === 'RIGHT') {
      nextX += 1;
      pivotX += 0.5;
      rollAxis = 'Z';
      rollAngle = -Math.PI / 2;
    } else if (dir === 'LEFT') {
      nextX -= 1;
      pivotX -= 0.5;
      rollAxis = 'Z';
      rollAngle = Math.PI / 2;
    } else if (dir === 'UP') {
      nextZ -= 1;
      pivotZ -= 0.5;
      rollAxis = 'X';
      rollAngle = -Math.PI / 2;
    } else if (dir === 'DOWN') {
      nextZ += 1;
      pivotZ += 0.5;
      rollAxis = 'X';
      rollAngle = Math.PI / 2;
    }

    active.x = nextX;
    active.z = nextZ;

    // Check falling
    const tile = this.getTileAt(nextX, nextZ);
    if (tile === TileType.VOID) {
      return {
        valid: false,
        fell: true,
        fallReason: 'VOID',
        won: false,
        splitTriggered: false,
        fusedTriggered: false,
        switchesActivated: [],
        pivotPoint: [pivotX, 0, pivotZ],
        rollAxis,
        rollAngle,
      };
    }

    // Check switches
    const switchesActivated: string[] = [];
    if (this.currentLevel.switches) {
      for (const sw of this.currentLevel.switches) {
        if (sw.x === nextX && sw.z === nextZ && !sw.isHeavy) {
          this.bridgesState[sw.targetBridgeId] = !this.bridgesState[sw.targetBridgeId];
          switchesActivated.push(sw.targetBridgeId);
        }
      }
    }

    // Check Fusion
    let fusedTriggered = false;
    const dx = Math.abs(active.x - inactive.x);
    const dz = Math.abs(active.z - inactive.z);

    if ((dx === 1 && dz === 0) || (dx === 0 && dz === 1)) {
      fusedTriggered = true;
      this.blockMode = 'SINGLE';
      if (dx === 1) {
        this.single = {
          x: Math.min(active.x, inactive.x),
          z: active.z,
          orientation: 'HORIZONTAL_X',
        };
      } else {
        this.single = {
          x: active.x,
          z: Math.min(active.z, inactive.z),
          orientation: 'HORIZONTAL_Z',
        };
      }
    }

    return {
      valid: true,
      fell: false,
      won: false,
      splitTriggered: false,
      fusedTriggered,
      switchesActivated,
      pivotPoint: [pivotX, 0, pivotZ],
      rollAxis,
      rollAngle,
    };
  }

  /**
   * Determine tile type considering broken fragile tiles and bridge open/closed state.
   */
  public getTileAt(x: number, z: number): TileType {
    if (z < 0 || z >= this.currentLevel.grid.length || x < 0 || x >= this.currentLevel.grid[z].length) {
      return TileType.VOID;
    }

    const raw = this.currentLevel.grid[z][x];
    if (raw === 0) return TileType.VOID;

    // Check fragile broken
    if (this.fragileBroken.has(`${x},${z}`)) {
      return TileType.VOID;
    }

    // Check bridges
    if (raw === TileType.BRIDGE && this.currentLevel.bridges) {
      for (const b of this.currentLevel.bridges) {
        const isThisBridge = b.tiles.some((t) => t.x === x && t.z === z);
        if (isThisBridge) {
          return this.bridgesState[b.bridgeId] ? TileType.BRIDGE : TileType.VOID;
        }
      }
    }

    return raw as TileType;
  }
}
