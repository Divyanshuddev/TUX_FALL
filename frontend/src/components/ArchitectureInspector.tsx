'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EvaluationResult } from '@/types/game';
import {
  animateArchitectureStack,
  animateScoreCountUp,
  animateTuxLanding
} from '@/lib/anime-effects';
import confetti from 'canvas-confetti';
import {
  Cpu,
  Layers,
  Compass,
  Monitor,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  Award,
  Zap,
  Download,
  RotateCcw,
  Trophy,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';

interface ArchitectureInspectorProps {
  result: EvaluationResult;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
  onViewCodex: () => void;
}

export const ArchitectureInspector: React.FC<ArchitectureInspectorProps> = ({
  result,
  onPlayAgain,
  onViewLeaderboard,
  onViewCodex,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const totalScoreRef = useRef<HTMLSpanElement | null>(null);
  const accuracyRef = useRef<HTMLSpanElement | null>(null);

  const [activeTab, setActiveTab] = useState<'stack' | 'terminal' | 'synergies'>('stack');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Launch Anime.js timeline for layer animations
    if (containerRef.current) {
      animateArchitectureStack(containerRef.current);
      animateTuxLanding('.tux-victory-mascot');
    }

    // Number roll-up animations
    if (totalScoreRef.current) {
      animateScoreCountUp(totalScoreRef.current, result.total_score, 1200);
    }
    if (accuracyRef.current) {
      animateScoreCountUp(accuracyRef.current, result.accuracy_percentage, 1000, '', '%');
    }

    // Fire confetti for high accuracy
    if (result.accuracy_percentage >= 80) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#34d399', '#fbbf24', '#a855f7'],
      });
    }
  }, [result]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPTIMAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> OPTIMAL</span>;
      case 'SUBOPTIMAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> PARTIAL</span>;
      case 'CONFLICT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"><XCircle className="w-3 h-3" /> CONFLICT</span>;
      case 'MISSING':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-rose-400 border border-rose-500/30 flex items-center gap-1"><XCircle className="w-3 h-3" /> MISSING</span>;
    }
  };

  const getLayerIcon = (level: number) => {
    switch (level) {
      case 1: return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 2: return <Layers className="w-4 h-4 text-amber-400" />;
      case 3: return <Compass className="w-4 h-4 text-indigo-400" />;
      case 4: return <Monitor className="w-4 h-4 text-pink-400" />;
      case 5: return <Terminal className="w-4 h-4 text-emerald-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `linux-sysarch-${result.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-nordic-darkest text-slate-100 py-8 px-4 md:px-8 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header telemetry summary */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Tux victory graphic & Rank Title */}
        <div className="flex items-center gap-5">
          <div className="tux-victory-mascot w-20 h-20 md:w-24 md:h-24 bg-slate-950 border-2 border-cyan-500/40 rounded-2xl flex items-center justify-center p-3 shadow-lg shadow-cyan-950/60 relative">
            {/* Vector Tux Icon */}
            <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow">
              <ellipse cx="50" cy="60" rx="36" ry="46" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <ellipse cx="50" cy="68" rx="24" ry="34" fill="#f8fafc" />
              <ellipse cx="38" cy="40" rx="6" ry="8" fill="#ffffff" />
              <ellipse cx="62" cy="40" rx="6" ry="8" fill="#ffffff" />
              <circle cx="39" cy="40" r="3.5" fill="#0284c7" />
              <circle cx="61" cy="40" r="3.5" fill="#0284c7" />
              <polygon points="42,48 58,48 50,60" fill="#fbbf24" />
              <ellipse cx="32" cy="106" rx="12" ry="7" fill="#f59e0b" />
              <ellipse cx="68" cy="106" rx="12" ry="7" fill="#f59e0b" />
              <rect x="26" y="52" width="48" height="10" rx="4" fill="#ef4444" />
            </svg>
            <span className="absolute -bottom-2 -right-2 bg-cyan-500 text-slate-950 text-[10px] font-mono font-black px-1.5 py-0.5 rounded">
              LND
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">Descent Complete</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">Architect: {result.player_name}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              {result.rank_title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold tracking-wide ${
                result.system_status === 'ROCK_SOLID'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : result.system_status === 'ELITE_RICER'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : result.system_status === 'DECLARATIVE_BEAST'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : result.system_status === 'MINIMAL_CONTAINER'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : result.system_status === 'KERNEL_PANIC'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}>
                SYS_STATUS: {result.system_status}
              </span>
            </div>
          </div>
        </div>

        {/* Scores & Accuracy Pill Cards */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-around md:justify-end">
          {/* Accuracy Score */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col items-center min-w-[120px]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Architecture Accuracy</span>
            <span ref={accuracyRef} className="text-2xl md:text-3xl font-mono font-bold text-cyan-400 mt-0.5">
              {result.accuracy_percentage}%
            </span>
            <span className="text-[10px] font-mono text-slate-400 mt-1">Linux Spec Fit</span>
          </div>

          {/* Total Points */}
          <div className="bg-slate-950/70 border border-cyan-500/40 p-4 rounded-xl flex flex-col items-center min-w-[130px] glow-cyan">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">Total Score</span>
            <span ref={totalScoreRef} className="text-2xl md:text-3xl font-mono font-extrabold text-white mt-0.5">
              {result.total_score.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 mt-1">+{result.synergy_bonus} Synergy</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs between Architecture Stack, Terminal Boot Log, and Synergies */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('stack')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
              activeTab === 'stack'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Architecture Stack (5 Layers)</span>
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
              activeTab === 'terminal'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Simulated Boot Log (dmesg)</span>
          </button>
          <button
            onClick={() => setActiveTab('synergies')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
              activeTab === 'synergies'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Synergies ({result.synergies.length})</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={downloadJson}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 transition flex items-center gap-1.5"
            title="Download JSON Blueprint"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{copied ? 'Downloaded' : 'Export'}</span>
          </button>
          <button
            onClick={onViewLeaderboard}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-amber-400 transition flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>
          <button
            onClick={onPlayAgain}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-500/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Drop Again</span>
          </button>
        </div>
      </div>

      {/* TAB 1: THE 5-LAYER LINUX SYSTEM STRUCTURE */}
      {activeTab === 'stack' && (
        <div className="flex flex-col gap-3">
          <div className="text-xs font-mono text-slate-400 mb-1 flex items-center justify-between">
            <span>Synthesized Linux System Architecture (Hierarchical Stack from Ring 0 to Userland):</span>
            <span className="text-cyan-400">Score Impact: +{result.architecture_score} / 1500 max</span>
          </div>

          {/* Render layers in architectural order: Layer 5 (Top/Userland) down to Layer 1 (Bottom/Kernel) */}
          {[...result.architecture_layers]
            .sort((a, b) => b.layer_level - a.layer_level)
            .map((layer) => (
              <div
                key={layer.layer_level}
                className="arch-layer-card bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg relative overflow-hidden"
              >
                {/* Level indicator bar */}
                <div
                  className={`absolute left-0 inset-y-0 w-1.5 ${
                    layer.status === 'OPTIMAL'
                      ? 'bg-emerald-400'
                      : layer.status === 'SUBOPTIMAL'
                      ? 'bg-amber-400'
                      : layer.status === 'CONFLICT'
                      ? 'bg-rose-400'
                      : 'bg-rose-600'
                  }`}
                />

                <div className="flex items-start md:items-center gap-4 pl-2">
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                    {getLayerIcon(layer.layer_level)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase text-slate-400">
                        Layer {layer.layer_level}:
                      </span>
                      <h3 className="font-mono text-sm md:text-base font-bold text-white">
                        {layer.layer_name}
                      </h3>
                      {getStatusBadge(layer.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      {layer.description}
                    </p>
                  </div>
                </div>

                {/* Captured Items chips for this layer */}
                <div className="flex flex-col md:items-end gap-1.5 pl-2 md:pl-0">
                  <div className="flex flex-wrap gap-1.5 justify-start md:justify-end">
                    {layer.chosen_items && layer.chosen_items.length > 0 ? (
                      layer.chosen_items.map((itemName, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 rounded-lg"
                        >
                          {itemName}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-mono text-rose-400 italic">None Captured (Halt state)</span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    +{layer.score_awarded} / {layer.max_points} pts
                  </span>
                </div>
              </div>
            ))}

          {/* Warnings & System Conflicts Section */}
          {(result.warnings_and_conflicts.length > 0 || result.hazards_caught.length > 0) && (
            <div className="mt-4 p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Architecture Diagnostics & Integrity Warnings:</span>
              </div>
              <ul className="space-y-1 pl-6 list-disc text-xs font-mono text-rose-200">
                {result.warnings_and_conflicts.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
                {result.hazards_caught.map((haz, i) => (
                  <li key={`haz-${i}`} className="text-rose-400">
                    Caught System Hazard: {haz} (-{result.hazard_penalty} pts penalty)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SIMULATED LINUX BOOT LOG */}
      {activeTab === 'terminal' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl font-mono text-xs overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-slate-400 ml-2">journalctl -b 0 --kernel --no-pager</span>
            </div>
            <span className="text-slate-500 text-[10px]">PREEMPT_DYNAMIC x86_64</span>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-1.5 text-slate-300 pr-2">
            {result.boot_log.map((line, idx) => {
              const isOk = line.includes('[OK]');
              const isWarning = line.includes('[WARNING]');
              const isError = line.includes('[EMERGENCY]') || line.includes('[CORRUPT]');

              return (
                <div key={idx} className="flex gap-2 leading-relaxed">
                  <span className="text-slate-500 shrink-0">{line.substring(0, 12)}</span>
                  <span className={
                    isError
                      ? 'text-rose-400 font-bold'
                      : isWarning
                      ? 'text-amber-300'
                      : isOk
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }>
                    {line.substring(12)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SYNERGIES & COMBOS */}
      {activeTab === 'synergies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.synergies.length > 0 ? (
            result.synergies.map((syn) => (
              <div
                key={syn.id}
                className="synergy-badge bg-slate-900/90 border border-cyan-500/40 p-5 rounded-2xl flex flex-col justify-between gap-3 shadow-lg shadow-cyan-950/30"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {syn.badge}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-extrabold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                      +{syn.bonus_points} PTS
                    </span>
                  </div>
                  <h3 className="font-mono text-base font-bold text-white mt-2">
                    {syn.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {syn.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 font-mono text-xs">
              No architectural synergies unlocked on this descent flight. Try pairing Arch + Hyprland + Neovim or Debian + systemd + Coreutils on your next run!
            </div>
          )}
        </div>
      )}

      {/* Bottom CTA bar */}
      <div className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs font-mono text-slate-400">
        <button
          onClick={onViewCodex}
          className="hover:text-cyan-300 underline underline-offset-4 transition"
        >
          📖 Open Linux Architecture Codex & Distro Guide
        </button>

        <div className="flex items-center gap-3">
          <span>Flight ID: <span className="text-slate-300">{result.id}</span></span>
        </div>
      </div>
    </div>
  );
};
