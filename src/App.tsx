/**
 * Cubiverse 3D - Main Application Controller
 * Implements full-viewport Game Shell, isolated Three.js canvas mount,
 * real-time multiplayer duels with friends, and ghost block synchronization.
 */

import React, { useEffect, useRef, useState } from 'react';
import { soundFx } from './game/audio';
import { LEVELS } from './game/levels';
import { mpClient, RoomState } from './game/multiplayerClient';
import { PuzzleEngine } from './game/puzzleEngine';
import { GameSceneRenderer } from './game/renderer';
import { LevelData, MoveDirection } from './game/types';
import { GameHUD } from './components/GameHUD';
import { LevelSelectModal } from './components/LevelSelectModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { RulesModal } from './components/RulesModal';
import { TitleScreen } from './components/TitleScreen';
import { TouchControls } from './components/TouchControls';
import { VictoryModal } from './components/VictoryModal';
import { HelpCircle, X, Swords } from 'lucide-react';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GameSceneRenderer | null>(null);
  const engineRef = useRef<PuzzleEngine | null>(null);

  // Game flow states
  const [gameState, setGameState] = useState<'TITLE' | 'PLAYING' | 'VICTORY'>('TITLE');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [movesCount, setMovesCount] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Modals & Panels
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);

  // Multiplayer Room State
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem('cubiverse_player_name') || 'Explorateur';
    } catch {
      return 'Explorateur';
    }
  });
  const [opponentInfo, setOpponentInfo] = useState<{
    name: string;
    moves: number;
    finished: boolean;
  } | null>(null);
  const [reactionNotice, setReactionNotice] = useState<{ name: string; emoji: string } | null>(null);
  const raceStartTimeRef = useRef<number>(0);

  // Split mode state
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [activeCubeIndex, setActiveCubeIndex] = useState<0 | 1>(0);

  // Persistence
  const [unlockedLevelMax, setUnlockedLevelMax] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('cubiverse_unlocked');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  const [scores, setScores] = useState<Record<number, { stars: number; bestMoves: number }>>(() => {
    try {
      const saved = localStorage.getItem('cubiverse_scores');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const currentLevel: LevelData = LEVELS[currentLevelIndex] || LEVELS[0];
  const isMovingRef = useRef(false);

  // Initialize Three.js WebGL Scene once on mount & check URL query for ?room=
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const initialEngine = new PuzzleEngine(currentLevel);
    engineRef.current = initialEngine;

    const renderer = new GameSceneRenderer(canvasMountRef.current, initialEngine);
    rendererRef.current = renderer;
    renderer.setCinematicPan(true);

    const handleResize = () => {
      if (canvasMountRef.current && rendererRef.current) {
        rendererRef.current.resize(
          canvasMountRef.current.clientWidth,
          canvasMountRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);

    // Auto-detect invitation URL query parameter (?room=CODE)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        setShowMultiplayerModal(true);
      }
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      rendererRef.current = null;
      engineRef.current = null;
    };
  }, []);

  // Listen to Multiplayer events from WebSocket server
  useEffect(() => {
    const unsubUpdate = mpClient.on('room:updated', (room: RoomState) => {
      setRoomState(room);
      const opponent = room.players.find((p) => p.id !== mpClient.myId);
      if (opponent) {
        setOpponentInfo({
          name: opponent.name,
          moves: opponent.moves,
          finished: opponent.finished,
        });
      } else {
        setOpponentInfo(null);
        rendererRef.current?.clearOpponentGhost();
      }
    });

    const unsubStart = mpClient.on('race:started', (data: any) => {
      setRoomState(data.room);
      raceStartTimeRef.current = Date.now();
      const targetLvlIdx = LEVELS.findIndex((l) => l.id === data.levelId);
      if (targetLvlIdx !== -1) {
        loadLevel(targetLvlIdx);
      }
      setGameState('PLAYING');
      setShowMultiplayerModal(false);
      soundFx.playSwitch(true);
    });

    const unsubOpponentMove = mpClient.on('opponent:moved', (data: any) => {
      setOpponentInfo((prev) =>
        prev ? { ...prev, moves: data.moves } : { name: data.playerName, moves: data.moves, finished: false }
      );
      if (rendererRef.current && data.position) {
        rendererRef.current.updateOpponentGhost(data.position);
      }
    });

    const unsubFinish = mpClient.on('player:finished', (data: any) => {
      setRoomState(data.room);
      if (data.finisherId !== mpClient.myId) {
        setOpponentInfo((prev) => (prev ? { ...prev, finished: true, moves: data.moves } : null));
        soundFx.playClick();
      }
    });

    const unsubReaction = mpClient.on('room:reaction', (data: any) => {
      setReactionNotice({ name: data.playerName, emoji: data.emoji });
      soundFx.playClick();
      setTimeout(() => setReactionNotice(null), 3000);
    });

    return () => {
      unsubUpdate();
      unsubStart();
      unsubOpponentMove();
      unsubFinish();
      unsubReaction();
    };
  }, [currentLevelIndex]);

  // Handle Level Loading
  const loadLevel = (levelIndex: number) => {
    const nextLvl = LEVELS[levelIndex];
    if (!nextLvl) return;

    setCurrentLevelIndex(levelIndex);
    const engine = new PuzzleEngine(nextLvl);
    engineRef.current = engine;

    setMovesCount(0);
    setCanUndo(false);
    setIsSplitMode(false);
    setActiveCubeIndex(0);
    setShowHint(false);

    if (rendererRef.current) {
      rendererRef.current.buildLevelWorld(nextLvl);
      rendererRef.current.setCinematicPan(false);
      rendererRef.current.setCameraView('ISO');
      rendererRef.current.clearOpponentGhost();
    }
  };

  const handleStartGame = () => {
    setGameState('PLAYING');
    if (rendererRef.current) {
      rendererRef.current.setCinematicPan(false);
      rendererRef.current.setCameraView('ISO');
    }
  };

  const handleReturnToTitle = () => {
    setGameState('TITLE');
    if (rendererRef.current) {
      rendererRef.current.setCinematicPan(true);
      rendererRef.current.clearOpponentGhost();
    }
    setOpponentInfo(null);
  };

  // Execute directional move with animation, procedural sound, and live multiplayer broadcast
  const handleMove = (dir: MoveDirection) => {
    if (isMovingRef.current || gameState !== 'PLAYING' || !engineRef.current || !rendererRef.current) {
      return;
    }

    const engine = engineRef.current;
    const renderer = rendererRef.current;
    isMovingRef.current = true;

    const result = engine.executeMove(dir);

    // Audio Feedback for rolling
    soundFx.playRoll(engine.single.orientation === 'STANDING');

    // Smooth physical rolling tumble animation
    renderer.animateRoll(result.pivotPoint, result.rollAxis, result.rollAngle, () => {
      isMovingRef.current = false;
      setMovesCount(engine.movesCount);
      setCanUndo(engine.canUndo());
      setIsSplitMode(engine.blockMode === 'SPLIT');
      setActiveCubeIndex(engine.split.activeCube);

      // Broadcast move to rival in multiplayer race
      if (roomState && roomState.status === 'RACING') {
        mpClient.sendMove(engine.movesCount, {
          x: engine.single.x,
          z: engine.single.z,
          orientation: engine.single.orientation,
        });
      }

      // Handle switches
      if (result.switchesActivated.length > 0) {
        soundFx.playSwitch();
        soundFx.playBridge();
        renderer.updateBridges();
      }

      // Handle split
      if (result.splitTriggered) {
        soundFx.playSplit();
        renderer.spawnParticleBurst(engine.single.x, 0.5, engine.single.z, 0xc084fc, 50);
        renderer.updateBlockMeshes();
      }

      // Handle fusion
      if (result.fusedTriggered) {
        soundFx.playFuse();
        renderer.spawnParticleBurst(engine.single.x, 0.5, engine.single.z, 0x38bdf8, 50);
        renderer.updateBlockMeshes();
      }

      // Handle falling off / fragile break
      if (result.fell) {
        if (result.fallReason === 'FRAGILE') {
          soundFx.playFragileCrack();
          renderer.spawnParticleBurst(engine.single.x, 0, engine.single.z, 0xf97316, 40);
        }
        soundFx.playFall();
        renderer.triggerFall(() => {
          engine.initLevelState();
          renderer.buildLevelWorld(currentLevel);
          setMovesCount(0);
          setCanUndo(false);
          setIsSplitMode(false);
        });
        return;
      }

      // Handle Victory
      if (result.won) {
        soundFx.playVictory();
        renderer.spawnParticleBurst(engine.single.x, 1.5, engine.single.z, 0x34d399, 70);

        // Notify multiplayer server if racing
        if (roomState && roomState.status === 'RACING') {
          const elapsedSeconds = Math.round((Date.now() - raceStartTimeRef.current) / 1000);
          mpClient.sendFinish(engine.movesCount, elapsedSeconds);
        }

        // Record high score & unlock next level
        const currentMoves = engine.movesCount;
        const earnedStars =
          currentMoves <= currentLevel.parMoves[0]
            ? 3
            : currentMoves <= currentLevel.parMoves[1]
            ? 2
            : 1;

        const newScores = { ...scores };
        const prevScore = newScores[currentLevel.id];
        if (!prevScore || currentMoves < prevScore.bestMoves) {
          newScores[currentLevel.id] = {
            stars: Math.max(prevScore?.stars || 0, earnedStars),
            bestMoves: currentMoves,
          };
          setScores(newScores);
          try {
            localStorage.setItem('cubiverse_scores', JSON.stringify(newScores));
          } catch {
            // ignore
          }
        }

        const nextUnlock = Math.max(unlockedLevelMax, currentLevel.id + 1);
        setUnlockedLevelMax(nextUnlock);
        try {
          localStorage.setItem('cubiverse_unlocked', nextUnlock.toString());
        } catch {
          // ignore
        }

        setTimeout(() => {
          setGameState('VICTORY');
        }, 300);
      }
    });
  };

  const handleUndo = () => {
    if (!engineRef.current || !rendererRef.current) return;
    const engine = engineRef.current;
    if (engine.undo()) {
      soundFx.playUndo();
      setMovesCount(engine.movesCount);
      setCanUndo(engine.canUndo());
      setIsSplitMode(engine.blockMode === 'SPLIT');
      setActiveCubeIndex(engine.split.activeCube);
      rendererRef.current.updateBlockMeshes();
      rendererRef.current.updateBridges();

      if (roomState && roomState.status === 'RACING') {
        mpClient.sendMove(engine.movesCount, {
          x: engine.single.x,
          z: engine.single.z,
          orientation: engine.single.orientation,
        });
      }
    }
  };

  const handleRestart = () => {
    if (!engineRef.current || !rendererRef.current) return;
    engineRef.current.initLevelState();
    rendererRef.current.buildLevelWorld(currentLevel);
    setMovesCount(0);
    setCanUndo(false);
    setIsSplitMode(false);
    if (gameState === 'VICTORY') {
      setGameState('PLAYING');
    }
  };

  const handleNextLevel = () => {
    if (currentLevelIndex < LEVELS.length - 1) {
      loadLevel(currentLevelIndex + 1);
      setGameState('PLAYING');
    } else {
      setShowLevelSelect(true);
    }
  };

  const handleSwitchCube = () => {
    if (engineRef.current && isSplitMode) {
      engineRef.current.switchActiveCube();
      setActiveCubeIndex(engineRef.current.split.activeCube);
      soundFx.playSwitchCube();
    }
  };

  const handleToggleMute = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleSavePlayerName = (name: string) => {
    setPlayerName(name);
    try {
      localStorage.setItem('cubiverse_player_name', name);
    } catch {
      // ignore
    }
  };

  // Keyboard navigation & hotkeys listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (gameState === 'TITLE') {
        if (e.code === 'Space' || e.code === 'Enter') {
          soundFx.playClick();
          handleStartGame();
        }
        return;
      }

      if (gameState === 'VICTORY') {
        if (e.code === 'Enter' || e.code === 'Space') {
          soundFx.playClick();
          handleNextLevel();
        } else if (e.code === 'KeyR') {
          soundFx.playClick();
          handleRestart();
        }
        return;
      }

      // In Playing mode:
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyZ') {
        handleMove('UP');
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        handleMove('DOWN');
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
        handleMove('LEFT');
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        handleMove('RIGHT');
      } else if (e.code === 'KeyR') {
        handleRestart();
      } else if (e.code === 'KeyU') {
        handleUndo();
      } else if (e.code === 'Tab') {
        e.preventDefault();
        handleSwitchCube();
      } else if (e.code === 'KeyM') {
        handleToggleMute();
      } else if (e.code === 'Escape') {
        handleReturnToTitle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentLevelIndex, isSplitMode, canUndo]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-white font-sans">
      {/* Isolated Three.js WebGL Canvas Mount Container */}
      <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Reaction Notification in Multiplayer */}
      {reactionNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-950/90 border border-purple-400 text-white shadow-2xl animate-in zoom-in-95">
          <span className="text-2xl">{reactionNotice.emoji}</span>
          <span className="text-xs font-semibold">{reactionNotice.name} a réagi</span>
        </div>
      )}

      {/* Title Screen Overlay */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onOpenRules={() => setShowRules(true)}
          onOpenMultiplayer={() => setShowMultiplayerModal(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* In-Game HUD Overlay */}
      {gameState === 'PLAYING' && (
        <>
          <GameHUD
            level={currentLevel}
            moves={movesCount}
            bestMoves={scores[currentLevel.id]?.bestMoves ?? null}
            canUndo={canUndo}
            isMuted={isMuted}
            onUndo={handleUndo}
            onRestart={handleRestart}
            onToggleMute={handleToggleMute}
            onToggleHint={() => setShowHint(!showHint)}
            onOpenLevelSelect={() => setShowLevelSelect(true)}
            onOpenMultiplayer={() => setShowMultiplayerModal(true)}
            onReturnToTitle={handleReturnToTitle}
            onSetCameraView={(preset) => rendererRef.current?.setCameraView(preset)}
            isSplitMode={isSplitMode}
            activeCubeIndex={activeCubeIndex}
            onSwitchCube={handleSwitchCube}
            opponentInfo={opponentInfo}
            onSendReaction={(emoji) => mpClient.sendReaction(emoji)}
          />

          {/* Touch Controls (Virtual D-Pad) for Mobile/Tablet */}
          <TouchControls
            onMove={handleMove}
            isSplitMode={isSplitMode}
            onSwitchCube={handleSwitchCube}
          />

          {/* In-game Hint Card */}
          {showHint && currentLevel.hintFr && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-full max-w-md p-4 mx-auto pointer-events-auto">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900 border border-cyan-500/60 shadow-2xl animate-in fade-in slide-in-from-top-2">
                <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs sm:text-sm text-slate-200">
                  <span className="font-bold text-cyan-300 block mb-0.5">Indice Tactique :</span>
                  {currentLevel.hintFr}
                </div>
                <button
                  onClick={() => setShowHint(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Victory Modal */}
      {gameState === 'VICTORY' && (
        <VictoryModal
          level={currentLevel}
          moves={movesCount}
          hasNextLevel={currentLevelIndex < LEVELS.length - 1}
          onNextLevel={handleNextLevel}
          onReplay={handleRestart}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
        />
      )}

      {/* Multiplayer & Invite Friends Modal */}
      {showMultiplayerModal && (
        <MultiplayerModal
          roomState={roomState}
          myId={mpClient.myId}
          playerName={playerName}
          onSetPlayerName={handleSavePlayerName}
          onClose={() => setShowMultiplayerModal(false)}
        />
      )}

      {/* Level Select Modal */}
      {showLevelSelect && (
        <LevelSelectModal
          currentLevelId={currentLevel.id}
          unlockedLevelMax={unlockedLevelMax}
          completedScores={scores}
          onSelectLevel={(levelId) => {
            const idx = LEVELS.findIndex((l) => l.id === levelId);
            if (idx !== -1) {
              loadLevel(idx);
              setGameState('PLAYING');
            }
          }}
          onClose={() => setShowLevelSelect(false)}
        />
      )}

      {/* Rules & Mechanics Modal */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
