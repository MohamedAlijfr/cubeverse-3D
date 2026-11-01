/**
 * Subtle on-screen touch D-Pad for tablet/mobile devices.
 * Styled in low-occlusion transparent aesthetic with tactile active state.
 */

import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Layers } from 'lucide-react';
import { MoveDirection } from '../game/types';

interface TouchControlsProps {
  onMove: (dir: MoveDirection) => void;
  isSplitMode: boolean;
  onSwitchCube: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  isSplitMode,
  onSwitchCube,
}) => {
  return (
    <div className="absolute right-4 bottom-24 sm:bottom-28 z-20 pointer-events-none select-none flex flex-col items-center">
      {/* Switch companion cube button if in split mode */}
      {isSplitMode && (
        <button
          onClick={onSwitchCube}
          className="mb-2 p-3 rounded-full bg-purple-950/80 border border-purple-500/80 text-purple-300 pointer-events-auto active:scale-90 shadow-lg"
          title="Changer de cube (Tab)"
        >
          <Layers className="w-5 h-5" />
        </button>
      )}

      {/* D-Pad cross */}
      <div className="grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-slate-950/40 border border-slate-700/50 backdrop-none pointer-events-auto">
        <div />
        <button
          onClick={() => onMove('UP')}
          className="w-12 h-12 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 active:bg-cyan-600 active:text-white flex items-center justify-center transition-all shadow-md active:scale-95"
          aria-label="Move Up"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div />

        <button
          onClick={() => onMove('LEFT')}
          className="w-12 h-12 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 active:bg-cyan-600 active:text-white flex items-center justify-center transition-all shadow-md active:scale-95"
          aria-label="Move Left"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => onMove('DOWN')}
          className="w-12 h-12 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 active:bg-cyan-600 active:text-white flex items-center justify-center transition-all shadow-md active:scale-95"
          aria-label="Move Down"
        >
          <ArrowDown className="w-6 h-6" />
        </button>

        <button
          onClick={() => onMove('RIGHT')}
          className="w-12 h-12 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 active:bg-cyan-600 active:text-white flex items-center justify-center transition-all shadow-md active:scale-95"
          aria-label="Move Right"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
