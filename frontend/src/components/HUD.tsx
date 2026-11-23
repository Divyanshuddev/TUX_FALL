'use client';

import React from 'react';
import { CapturedItem } from '@/types/game';
import {
  Volume2,
  VolumeX,
  Zap,
  Shield,
  Layers,
  Terminal,
  Cpu,
  Monitor,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { sound } from '@/lib/audio';

interface HUDProps {
  altitude: number;
  speed: number;
  score: number;
  combo: number;
  stability: number; // 0 - 100
  empCharge: number; // 0 - 100
  capturedItems: CapturedItem[];
  isMuted: boolean;
  onToggleMute: () => void;
  onForceLand: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  altitude,
  speed,
  score,
  combo,
  stability,
  empCharge,
  capturedItems,
  isMuted,
  onToggleMute,
  onForceLand,
}) => {
  // Check which layers have been fulfilled
  const hasKernel = capturedItems.some(i => i.category === 'kernel_arch');
  const hasInit = capturedItems.some(i => i.category === 'init_system');
  const hasDistro = capturedItems.some(i => i.category === 'distro');
  const hasDisplayDE = capturedItems.some(i => i.category === 'window_de');
  const toolsCount = capturedItems.filter(i => i.category === 'core_tools').length;
  const hazardsCount = capturedItems.filter(i => i.category === 'hazard').length;

  const altitudePercent = Math.max(0, Math.min(100, ((10000 - altitude) / 10000) * 100));

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none p-2 sm:p-4 md:p-6 flex flex-col justify-between h-full z-20">
      {/* Top telemetry & Layer checklist group */}
      <div className="flex flex-col gap-2">
        {/* Top telemetry bar */}
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          {/* Left: Altitude & Speed */}
          <div className="flex flex-col gap-1.5 sm:gap-2 pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 p-2 sm:p-3 rounded-xl shadow-lg shadow-cyan-950/40">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-cyan-400">Altitude</span>
              <span className="font-mono text-base sm:text-xl md:text-2xl font-bold text-white tracking-tight">
                {Math.max(0, Math.round(altitude)).toLocaleString()} <span className="text-xs sm:text-sm font-normal text-slate-400">m</span>
              </span>
            </div>

            {/* Altitude progress bar */}
            <div className="w-28 sm:w-44 md:w-56 h-1.5 sm:h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${altitudePercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono text-slate-400 mt-0.5">
              <span className="hidden sm:inline">Stratosphere</span>
              <span className="text-cyan-300 font-semibold">{Math.round(speed)} km/h</span>
              <span className="hidden sm:inline">Glacier</span>
            </div>
          </div>

          {/* Center: System Stability & Combo */}
          <div className="flex flex-col items-center gap-1 pointer-events-auto">
            {/* Combo badge */}
            {combo > 1 && (
              <div className="animate-bounce bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 px-2 sm:px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-black tracking-wider shadow-lg shadow-amber-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                <span>{combo}x COMBO</span>
              </div>
            )}

            {/* System Stability */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-2 sm:gap-3 shadow-lg">
              <Shield className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stability > 50 ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`} />
              <div className="flex flex-col">
                <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  <span className="hidden sm:inline">Kernel Integrity</span>
                  <span className="sm:hidden">Integrity</span>
                  <span className={stability > 50 ? 'text-emerald-400 font-bold ml-1.5' : 'text-rose-400 font-bold ml-1.5'}>
                    {Math.round(stability)}%
                  </span>
                </div>
                <div className="w-16 sm:w-28 md:w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all duration-300 ${
                      stability > 60
                        ? 'bg-emerald-400'
                        : stability > 30
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${stability}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Score & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl text-right shadow-lg">
              <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-cyan-400">Score</div>
              <div className="font-mono text-base sm:text-xl md:text-2xl font-bold text-cyan-300">
                {score.toLocaleString()}
              </div>
            </div>

            {/* Audio toggle button */}
            <button
              onClick={onToggleMute}
              className="p-2 sm:p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/60 rounded-xl transition backdrop-blur-md"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {/* Layer Checklist HUD (Floating horizontal pill) */}
        <div className="self-center pointer-events-auto bg-slate-900/85 backdrop-blur-lg border border-slate-700/70 px-2 sm:px-4 py-1 sm:py-2 rounded-2xl shadow-2xl flex items-center gap-1.5 sm:gap-3 md:gap-5 flex-wrap justify-center">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase text-slate-400 hidden sm:inline tracking-wider">
            Architecture Stack:
          </span>

          {/* Slot 1: Kernel */}
          <div className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-mono transition ${
            hasKernel ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800/60 text-slate-500 border border-slate-700/30'
          }`}>
            <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Kernel</span>
            {hasKernel ? <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" /> : <span className="text-[9px] sm:text-[10px] opacity-40">0/1</span>}
          </div>

          {/* Slot 2: Init */}
          <div className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-mono transition ${
            hasInit ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800/60 text-slate-500 border border-slate-700/30'
          }`}>
            <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Init</span>
            {hasInit ? <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" /> : <span className="text-[9px] sm:text-[10px] opacity-40">0/1</span>}
          </div>

          {/* Slot 3: Distro */}
          <div className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-mono transition ${
            hasDistro ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800/60 text-slate-500 border border-slate-700/30'
          }`}>
            <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Distro</span>
            {hasDistro ? <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-400" /> : <span className="text-[9px] sm:text-[10px] opacity-40">0/1</span>}
          </div>

          {/* Slot 4: Display / DE */}
          <div className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-mono transition ${
            hasDisplayDE ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' : 'bg-slate-800/60 text-slate-500 border border-slate-700/30'
          }`}>
            <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Display/DE</span>
            <span className="sm:hidden">DE</span>
            {hasDisplayDE ? <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-400" /> : <span className="text-[9px] sm:text-[10px] opacity-40">0/1</span>}
          </div>

          {/* Slot 5: Tools */}
          <div className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-mono transition ${
            toolsCount >= 2 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800/60 text-slate-400 border border-slate-700/30'
          }`}>
            <Terminal className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Tools</span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400">({toolsCount})</span>
          </div>

          {/* Hazard warning count */}
          {hazardsCount > 0 && (
            <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-mono bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse">
              <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Bloat: {hazardsCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls reminder & EMP Burst status (Desktop/Tablet only) */}
      <div className="hidden sm:flex items-end justify-between gap-4">
        {/* Controls hint */}
        <div className="hidden md:flex items-center gap-3 bg-slate-900/70 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px]">◀</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px]">▶</kbd> Glide
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-300">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px]">▼</kbd> Dive
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-300">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px]">▲</kbd> Parachute Slow
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-300">
            <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px]">SPACE</kbd> EMP Bash
          </span>
        </div>

        {/* EMP Burst Meter */}
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-3.5 py-2 rounded-xl">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono uppercase text-cyan-400">EMP Bash Surge</span>
            <div className="w-24 md:w-32 h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5">
              <div
                className={`h-full transition-all duration-200 ${
                  empCharge >= 100 ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-600'
                }`}
                style={{ width: `${empCharge}%` }}
              />
            </div>
          </div>
          <span className={`text-xs font-mono font-bold ${empCharge >= 100 ? 'text-cyan-300' : 'text-slate-500'}`}>
            {empCharge >= 100 ? 'READY' : `${Math.round(empCharge)}%`}
          </span>
        </div>
      </div>
    </div>
  );
};
