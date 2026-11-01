/**
 * World-Matched, Low-Occlusion Game HUD for Cubiverse 3D.
 * Unobstructed playfield (>85%), perimeter status clusters, tabular-nums,
 * and collapsible bottom dock (no backdrop-filter).
 */

import React, { useState } from 'react';
import {
  RotateCcw,
  Undo2,
  HelpCircle,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Camera,
  Layers,
  Star,
  Home,
  Menu,
  Users,
  Swords,
} from 'lucide-react';
import { soundFx } from '../game/audio';
import { LevelData } from '../game/types';

interface GameHUDProps {
  level: LevelData;
  moves: number;
  bestMoves: number | null;
  canUndo: boolean;
  isMuted: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onToggleHint: () => void;
  onOpenLevelSelect: () => void;
  onOpenMultiplayer: () => void;
  onReturnToTitle: () => void;
  onSetCameraView: (preset: 'ISO' | 'TOP' | 'HERO') => void;
  isSplitMode: boolean;
  activeCubeIndex: 0 | 1;
  onSwitchCube: () => void;
  opponentInfo?: { name: string; moves: number; finished: boolean } | null;
  onSendReaction?: (emoji: string) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  level,
  moves,
  bestMoves,
  canUndo,
  isMuted,
  onUndo,
  onRestart,
  onToggleMute,
  onToggleHint,
  onOpenLevelSelect,
  onOpenMultiplayer,
  onReturnToTitle,
  onSetCameraView,
  isSplitMode,
  activeCubeIndex,
  onSwitchCube,
  opponentInfo,
  onSendReaction,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Determine current star tier according to par moves
  const currentStars =
    moves <= level.parMoves[0]
      ? 3
      : moves <= level.parMoves[1]
      ? 2
      : moves <= level.parMoves[2]
      ? 1
      : 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Perimeter Cluster */}
      <div className="flex items-start justify-between w-full pointer-events-auto">
        {/* Left: Level Spec Badge */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-white shadow-lg">
            <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider">
              Niveau {level.id}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-200 font-semibold text-sm">
              {level.nameFr}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-medium ml-1">
              {level.difficulty}
            </span>
          </div>

          {/* Quick Objective / Subtext */}
          <div className="text-[11px] text-slate-400 font-medium px-1 max-w-xs sm:max-w-md hidden sm:block">
            {level.descriptionFr}
          </div>
        </div>

        {/* Right: Perimeter Status Clusters & Actions */}
        <div className="flex items-center gap-2">
          {/* Moves & Par Stars Readout */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 shadow-lg text-white">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Coups
              </span>
              <span className="text-base font-black font-mono tabular-nums text-cyan-300 leading-none">
                {moves}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-700/80" />

            {/* Target 3-Star threshold */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Objectif
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= currentStars
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {bestMoves !== null && (
              <>
                <div className="h-6 w-px bg-slate-700/80 hidden sm:block" />
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                    Record
                  </span>
                  <span className="text-xs font-bold font-mono tabular-nums text-emerald-400 leading-none">
                    {bestMoves}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Multiplayer & Invite Friends button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenMultiplayer();
            }}
            className="p-2.5 rounded-lg bg-purple-950/90 hover:bg-purple-900 border border-purple-500/70 text-purple-200 hover:text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            title="Inviter des amis / Multijoueur"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline text-xs font-bold">Amis</span>
          </button>

          {/* Level List / Menu */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenLevelSelect();
            }}
            className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
            title="Sélecteur de niveaux"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Home / Exit */}
          <button
            onClick={() => {
              soundFx.playClick();
              onReturnToTitle();
            }}
            className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
            title="Menu Principal"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Rival Progress Banner in Multiplayer */}
      {opponentInfo && (
        <div className="mx-auto pointer-events-auto mt-2 flex items-center gap-3 px-4 py-2 rounded-xl bg-purple-950/90 border border-purple-500/80 text-purple-200 shadow-xl">
          <Swords className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-xs font-semibold">
            Rival : <strong className="text-white">{opponentInfo.name}</strong>
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-purple-900/80 border border-purple-700/70 text-purple-300 font-mono font-bold">
            {opponentInfo.moves} coups
          </span>
          {opponentInfo.finished && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/70">
              A terminé !
            </span>
          )}

          {/* Fast reaction emojis */}
          {onSendReaction && (
            <div className="flex items-center gap-1 border-l border-purple-800/80 pl-2">
              {['👏', '⚡', '🤯', '🔥'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSendReaction(emoji)}
                  className="hover:scale-125 transition-transform text-sm cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quantum Split Mode Banner (if active) */}
      {isSplitMode && (
        <div className="mx-auto pointer-events-auto mt-2">
          <button
            onClick={() => {
              soundFx.playSwitchCube();
              onSwitchCube();
            }}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-purple-950/90 border border-purple-500/70 text-purple-200 text-xs font-bold shadow-lg hover:bg-purple-900 transition-all active:scale-95 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-purple-400 animate-bounce" />
            <span>
              Cube Actif: {activeCubeIndex === 0 ? 'ALPHA (Bleu)' : 'BETA (Violet)'} — Appuyez sur [Tab] pour changer
            </span>
          </button>
        </div>
      )}

      {/* Unified Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="pointer-events-auto mx-auto flex flex-col items-center">
        {/* Dock Collapse / Expand Tab */}
        <button
          onClick={() => {
            soundFx.playClick();
            setIsDockCollapsed(!isDockCollapsed);
          }}
          className="px-3 py-1 rounded-t-lg bg-slate-900/90 hover:bg-slate-800 border-t border-x border-slate-700/80 text-slate-400 hover:text-white text-[11px] font-mono tracking-wider flex items-center gap-1 transition-all shadow-md cursor-pointer"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Afficher Contrôles (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Masquer</span>
            </>
          )}
        </button>

        {/* Dock Contents */}
        <div
          className={`flex flex-wrap items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl transition-all duration-300 ${
            isDockCollapsed ? 'hidden' : 'flex'
          }`}
          style={{ maxWidth: 'min(940px, 94vw)' }}
        >
          {/* Undo Action */}
          <button
            onClick={() => {
              if (canUndo) {
                soundFx.playUndo();
                onUndo();
              }
            }}
            disabled={!canUndo}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              canUndo
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100 cursor-pointer active:scale-95'
                : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title="Annuler le dernier coup (Touche Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Annuler (Z)</span>
          </button>

          {/* Restart Level */}
          <button
            onClick={() => {
              soundFx.playClick();
              onRestart();
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Recommencer le niveau (Touche R)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Recommencer (R)</span>
          </button>

          <div className="h-5 w-px bg-slate-700/80" />

          {/* Camera View Presets */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                soundFx.playClick();
                onSetCameraView('ISO');
              }}
              className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Vue Isométrique"
            >
              Isométrique
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onSetCameraView('TOP');
              }}
              className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Vue du Dessus (Plan)"
            >
              Dessus
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onSetCameraView('HERO');
              }}
              className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Vue Rapprochée"
            >
              Focus
            </button>
          </div>

          <div className="h-5 w-px bg-slate-700/80" />

          {/* Hint button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onToggleHint();
            }}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Indice pour ce niveau"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Indice</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              soundFx.playClick();
              onToggleMute();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};
