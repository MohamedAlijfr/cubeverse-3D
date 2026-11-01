/**
 * Victory Celebration Modal for Cubiverse 3D.
 * Computes stars, displays move efficiency rating, and offers instant next level CTA.
 */

import React from 'react';
import { Star, Trophy, ArrowRight, RotateCcw, Grid } from 'lucide-react';
import { soundFx } from '../game/audio';
import { LevelData } from '../game/types';

interface VictoryModalProps {
  level: LevelData;
  moves: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLevelSelect: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  moves,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onOpenLevelSelect,
}) => {
  // Compute stars:
  const starsEarned =
    moves <= level.parMoves[0]
      ? 3
      : moves <= level.parMoves[1]
      ? 2
      : moves <= level.parMoves[2]
      ? 1
      : 1;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-none select-none">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-2xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(6,182,212,0.3)] animate-in fade-in zoom-in duration-300">
        {/* Trophy Header */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-inner">
          <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
          Niveau Complété !
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
          {level.nameFr}
        </h2>

        {/* Stars Award Display */}
        <div className="flex items-center justify-center gap-2 my-5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`p-2 rounded-xl border transition-all duration-500 ${
                s <= starsEarned
                  ? 'bg-amber-950/50 border-amber-500/80 text-amber-400 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-600'
              }`}
            >
              <Star
                className={`w-7 h-7 ${s <= starsEarned ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
              />
            </div>
          ))}
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-left mb-6 font-mono">
          <div>
            <div className="text-[11px] text-slate-400 uppercase">Coups Réalisés</div>
            <div className="text-xl font-bold text-white tabular-nums">{moves} coups</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase">Objectif 3 Étoiles</div>
            <div className="text-xl font-bold text-cyan-300 tabular-nums">
              &le; {level.parMoves[0]} coups
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col gap-2.5">
          {hasNextLevel ? (
            <button
              onClick={() => {
                soundFx.playClick();
                onNextLevel();
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>NIVEAU SUIVANT (ENTRÉE)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="py-3 px-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-sm font-bold">
              Félicitations ! Vous avez conquis tous les mondes de Cubiverse 3D !
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                onReplay();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Rejouer (R)</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                onOpenLevelSelect();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Grid className="w-4 h-4 text-cyan-400" />
              <span>Niveaux</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
