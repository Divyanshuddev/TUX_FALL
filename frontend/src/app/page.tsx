'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GameCanvas } from '@/components/GameCanvas';
import { ArchitectureInspector } from '@/components/ArchitectureInspector';
import { LeaderboardModal } from '@/components/LeaderboardModal';
import { CodexModal } from '@/components/CodexModal';
import { LinuxComponent, CapturedItem, EvaluationResult, GameStatus } from '@/types/game';
import { FALLBACK_LINUX_ITEMS } from '@/lib/constants';
import { sound } from '@/lib/audio';
import { animateHeroEntrance } from '@/lib/anime-effects';
import { getApiUrl } from '@/lib/api';
import {
  Play,
  Trophy,
  BookOpen,
  Terminal,
  Shield,
  Layers,
  Cpu,
  Monitor,
  Zap,
  Volume2,
  VolumeX,
  Tv,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function Home() {
  const [gameStatus, setGameStatus] = useState<GameStatus>('MENU');
  const [playerName, setPlayerName] = useState('TuxArchitect');
  const [availableItems, setAvailableItems] = useState<LinuxComponent[]>(FALLBACK_LINUX_ITEMS);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Modals & UI Toggles
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [enableCrt, setEnableCrt] = useState(true);
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  const heroRef = useRef<HTMLDivElement | null>(null);

  // Fetch components from FastAPI backend
  useEffect(() => {
    fetch(getApiUrl('/api/items'))
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Using fallback items');
      })
      .then((data: LinuxComponent[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableItems(data);
        }
      })
      .catch(() => {
        // Fallback already preloaded
      });
  }, []);

  // Anime.js hero entrance animation
  useEffect(() => {
    if (gameStatus === 'MENU' && heroRef.current) {
      animateHeroEntrance('.hero-container');
    }
  }, [gameStatus]);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Launch game
  const handleStartGame = () => {
    sound.playBoot();
    setGameStatus('PLAYING');
  };

  // Handle game finish & evaluate Linux architecture
  const handleGameComplete = async (
    captured: CapturedItem[],
    altitude: number,
    maxCombo: number,
    duration: number
  ) => {
    setGameStatus('EVALUATING');
    setIsEvaluating(true);

    const payload = {
      player_name: playerName || 'TuxArchitect',
      captured_items: captured.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        layer_level: c.layer_level,
        captured_at_altitude: c.captured_at_altitude,
        points: c.points,
      })),
      survival_time_sec: duration,
      max_combo: maxCombo,
      final_altitude: altitude,
    };

    try {
      const response = await fetch(getApiUrl('/api/evaluate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result: EvaluationResult = await response.json();
        setEvaluationResult(result);
        setGameStatus('RESULT');
      } else {
        throw new Error('API evaluation returned status ' + response.status);
      }
    } catch {
      // Fallback client-side evaluation if backend is not available
      const fallbackResult = generateClientSideEvaluation(payload, captured);
      setEvaluationResult(fallbackResult);
      setGameStatus('RESULT');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Client-side fallback evaluator
  const generateClientSideEvaluation = (
    payload: { player_name: string; max_combo: number },
    captured: CapturedItem[]
  ): EvaluationResult => {
    const layer1 = captured.filter((i) => i.layer_level === 1);
    const layer2 = captured.filter((i) => i.layer_level === 2);
    const layer3 = captured.filter((i) => i.layer_level === 3);
    const layer4 = captured.filter((i) => i.layer_level === 4);
    const layer5 = captured.filter((i) => i.layer_level === 5);
    const hazards = captured.filter((i) => i.category === 'hazard');

    const baseScore = captured
      .filter((i) => i.category !== 'hazard')
      .reduce((sum, item) => sum + item.points, 0);

    const hazardPenalty = hazards.reduce((sum, item) => sum + Math.abs(item.points), 0);
    const comboBonus = payload.max_combo * 45;

    const kernelPresent = layer1.some((i) => i.id.includes('kernel'));
    const initPresent = layer2.length > 0;
    const distroPresent = layer3.length > 0;

    let archScore = 0;
    if (kernelPresent) archScore += 350;
    if (initPresent) archScore += 250;
    if (distroPresent) archScore += 350;
    if (layer4.length > 0) archScore += 250;
    if (layer5.length >= 2) archScore += 300;

    let accuracy = Math.round((archScore / 1500) * 100);
    if (hazards.length > 0) accuracy = Math.max(10, accuracy - hazards.length * 15);

    const total = Math.max(0, baseScore + archScore + comboBonus - hazardPenalty);

    return {
      id: Math.random().toString(36).substring(2, 9),
      player_name: payload.player_name,
      base_item_score: baseScore,
      architecture_score: archScore,
      synergy_bonus: 450,
      hazard_penalty: hazardPenalty,
      combo_bonus: comboBonus,
      total_score: total,
      accuracy_percentage: accuracy,
      rank_title: accuracy > 90 ? 'Grandmaster Linux Architect' : 'Senior Systems Engineer',
      system_status: accuracy > 85 ? 'ROCK_SOLID' : 'STABLE',
      architecture_layers: [
        {
          layer_level: 1,
          layer_name: 'Kernel & Hardware Spec',
          is_fulfilled: kernelPresent,
          status: kernelPresent ? 'OPTIMAL' : 'MISSING',
          chosen_items: layer1.map((i) => i.name),
          description: kernelPresent ? 'Primary Linux kernel verified.' : 'No kernel found.',
          score_awarded: kernelPresent ? 350 : 0,
          max_points: 350,
        },
        {
          layer_level: 2,
          layer_name: 'Init & Service Layer',
          is_fulfilled: initPresent,
          status: initPresent ? 'OPTIMAL' : 'MISSING',
          chosen_items: layer2.map((i) => i.name),
          description: initPresent ? 'PID 1 active.' : 'No init system.',
          score_awarded: initPresent ? 250 : 0,
          max_points: 250,
        },
        {
          layer_level: 3,
          layer_name: 'Distribution Base',
          is_fulfilled: distroPresent,
          status: distroPresent ? 'OPTIMAL' : 'MISSING',
          chosen_items: layer3.map((i) => i.name),
          description: distroPresent ? 'Base rootfs mounted.' : 'No distribution.',
          score_awarded: distroPresent ? 350 : 0,
          max_points: 350,
        },
        {
          layer_level: 4,
          layer_name: 'Display Server & Desktop / WM',
          is_fulfilled: layer4.length > 0,
          status: layer4.length > 0 ? 'OPTIMAL' : 'SUBOPTIMAL',
          chosen_items: layer4.map((i) => i.name),
          description: layer4.length > 0 ? 'Graphical pipeline ready.' : 'Headless mode.',
          score_awarded: layer4.length > 0 ? 250 : 180,
          max_points: 250,
        },
        {
          layer_level: 5,
          layer_name: 'Core Utilities & Shell Suite',
          is_fulfilled: layer5.length > 0,
          status: layer5.length >= 2 ? 'OPTIMAL' : 'SUBOPTIMAL',
          chosen_items: layer5.map((i) => i.name),
          description: 'Userland shell and utilities loaded.',
          score_awarded: layer5.length >= 2 ? 300 : 150,
          max_points: 300,
        },
      ],
      synergies: [
        {
          id: 'syn-1',
          title: 'Cohesive Linux Architecture',
          description: 'Assembled working pipeline from Ring 0 to userland shell.',
          badge: '🛡️ SOLID BUILD',
          bonus_points: 450,
        },
      ],
      warnings_and_conflicts: [],
      hazards_caught: hazards.map((h) => h.name),
      boot_log: [
        '[  0.000000] Booting Linux kernel on bare-metal snow glacier...',
        '[  0.041000] Initialized memory subsystem and page tables.',
        `[  0.180000] Reached multi-user graphical target. User logged in as ${payload.player_name}.`,
      ],
      created_at: new Date().toISOString(),
    };
  };

  return (
    <main className="min-h-screen bg-nordic-darkest text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Retro CRT Scanline & Phosphor Vignette Overlays */}
      {enableCrt && (
        <>
          <div className="crt-overlay" />
          <div className="crt-vignette" />
        </>
      )}

      {/* Persistent Retro Top Bar (Desktop or Menu/Result) */}
      <header className={`border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 py-2.5 items-center justify-between text-xs font-mono z-40 ${gameStatus === 'PLAYING' ? 'hidden sm:flex' : 'flex'}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>TUX_FALL v1.0.0</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">
            ARCH: x86_64 / RISC-V • KERNEL: 6.12 LTS
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setEnableCrt(!enableCrt)}
            className={`px-2 py-1 rounded text-[11px] transition flex items-center gap-1 ${
              enableCrt
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle CRT Scanlines"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden md:inline">CRT {enableCrt ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-1.5 text-slate-400 hover:text-cyan-400 transition"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowLeaderboard(true)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 rounded transition flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scores</span>
          </button>

          <button
            onClick={() => setShowCodex(true)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 rounded transition flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Codex</span>
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT: State machine */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* VIEW 1: HERO / START SCREEN */}
        {gameStatus === 'MENU' && (
          <div
            ref={heroRef}
            className="hero-container flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto my-auto"
          >
            {/* Tux Vector Mascot Animated Hero */}
            <div className="hero-tux relative mb-6">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500/50 rounded-3xl p-4 shadow-2xl shadow-cyan-950/80 flex items-center justify-center glow-cyan relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />
                {/* SVG Tux Mascot with Aviator Goggles & Red Scarf */}
                <svg viewBox="0 0 100 120" className="w-full h-full relative z-10">
                  <ellipse cx="50" cy="62" rx="36" ry="46" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
                  <ellipse cx="50" cy="70" rx="24" ry="34" fill="#f8fafc" />
                  <ellipse cx="38" cy="42" rx="6" ry="8" fill="#ffffff" />
                  <ellipse cx="62" cy="42" rx="6" ry="8" fill="#ffffff" />
                  <circle cx="39" cy="42" r="3.5" fill="#0284c7" />
                  <circle cx="61" cy="42" r="3.5" fill="#0284c7" />
                  <polygon points="42,50 58,50 50,62" fill="#fbbf24" />
                  <ellipse cx="32" cy="108" rx="12" ry="7" fill="#f59e0b" />
                  <ellipse cx="68" cy="108" rx="12" ry="7" fill="#f59e0b" />
                  {/* Fluttering Red Winter Flying Scarf */}
                  <rect x="25" y="54" width="50" height="10" rx="4" fill="#ef4444" />
                  <polygon points="62,60 78,74 72,78 58,62" fill="#dc2626" />
                </svg>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 text-[10px] font-mono font-black px-2 py-0.5 rounded-full shadow-lg">
                10,000m DROP
              </div>
            </div>

            {/* Title & Tagline */}
            <div className="hero-fade">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Retro + Modern Minimalist Linux Game</span>
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-mono tracking-tight text-white uppercase text-shadow-glow">
                TUX <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">FALL</span>
              </h1>
              <p className="mt-4 text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                Free-fall Tux through the icy blizzards of the Linux sky. Capture authentic Linux system specifications, distributions, window environments, and default tools. Synthesize a cohesive system structure to maximize your architect score!
              </p>
            </div>

            {/* Player name input */}
            <div className="hero-fade mt-6 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mx-auto">
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-cyan-400">
                  user@
                </span>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={18}
                  placeholder="Enter architect callsign..."
                  className="w-full pl-16 pr-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                />
              </div>

              <button
                onClick={handleStartGame}
                className="w-full sm:w-auto px-8 py-2.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-mono font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>DROP TUX</span>
              </button>
            </div>

            {/* How to play & 5 Layers Guide Pill */}
            <div className="hero-fade mt-10 grid grid-cols-2 sm:grid-cols-5 gap-2.5 w-full text-left font-mono">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-1">
                <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> L1: Kernel & HW
                </span>
                <span className="text-xs text-slate-300">Linux 6.12, eBPF, RISC-V, x86_64</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-1">
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> L2: Init Daemons
                </span>
                <span className="text-xs text-slate-300">systemd, OpenRC, runit</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-1">
                <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> L3: Distro Base
                </span>
                <span className="text-xs text-slate-300">Arch, Debian, Fedora, NixOS, Alpine</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-1">
                <span className="text-[10px] text-pink-400 flex items-center gap-1">
                  <Monitor className="w-3 h-3" /> L4: Window/DE
                </span>
                <span className="text-xs text-slate-300">Wayland, Hyprland, GNOME, KDE, i3</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> L5: Core Tools
                </span>
                <span className="text-xs text-slate-300">Bash, Zsh, Neovim, Coreutils, Curl</span>
              </div>
            </div>

            {/* Controls summary footer */}
            <div className="hero-fade mt-6 text-xs font-mono text-slate-500 flex items-center gap-3">
              <span>Arrow Keys: Glide & Dive</span>
              <span>•</span>
              <span>Space: EMP Shockwave</span>
              <span>•</span>
              <span>Avoid Windows Bloatware Hazards!</span>
            </div>
          </div>
        )}

        {/* VIEW 2: ACTIVE GAME CANVAS */}
        {gameStatus === 'PLAYING' && (
          <GameCanvas
            availableItems={availableItems}
            playerName={playerName}
            onGameComplete={handleGameComplete}
            onExitToMenu={() => setGameStatus('MENU')}
          />
        )}

        {/* VIEW 3: EVALUATING TRANSITION SPINNER */}
        {gameStatus === 'EVALUATING' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
            <h2 className="text-xl font-mono font-bold text-white">Synthesizing Linux Architecture...</h2>
            <p className="text-xs font-mono text-slate-400 mt-2">
              Validating Ring 0 Kernel hooks, Init service targets, distro tree, and userland binaries...
            </p>
          </div>
        )}

        {/* VIEW 4: POST-GAME LINUX ARCHITECTURE INSPECTOR & SCORING */}
        {gameStatus === 'RESULT' && evaluationResult && (
          <ArchitectureInspector
            result={evaluationResult}
            onPlayAgain={() => {
              setGameStatus('PLAYING');
              sound.playBoot();
            }}
            onViewLeaderboard={() => setShowLeaderboard(true)}
            onViewCodex={() => setShowCodex(true)}
          />
        )}
      </div>

      {/* MODALS */}
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <CodexModal items={availableItems} isOpen={showCodex} onClose={() => setShowCodex(false)} />
    </main>
  );
}
