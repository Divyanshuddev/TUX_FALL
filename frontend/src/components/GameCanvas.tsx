'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LinuxComponent, CapturedItem } from '@/types/game';
import { FALLBACK_LINUX_ITEMS } from '@/lib/constants';
import { sound } from '@/lib/audio';
import { HUD } from './HUD';
import { ArrowLeft, ArrowRight, ArrowDown, ArrowUp, Zap } from 'lucide-react';

interface GameCanvasProps {
  availableItems: LinuxComponent[];
  playerName: string;
  onGameComplete: (captured: CapturedItem[], altitude: number, maxCombo: number, duration: number) => void;
  onExitToMenu: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

interface GameItemInstance {
  id: string;
  component: LinuxComponent;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  boxW: number;
  boxH: number;
  collected: boolean;
  pulsePhase: number;
}

interface Snowflake {
  x: number;
  y: number;
  speed: number;
  radius: number;
  alpha: number;
  drift: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  availableItems = FALLBACK_LINUX_ITEMS,
  playerName,
  onGameComplete,
  onExitToMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state references
  const itemsPool = availableItems.length > 0 ? availableItems : FALLBACK_LINUX_ITEMS;

  const [score, setScore] = useState(0);
  const [altitude, setAltitude] = useState(10000);
  const [speed, setSpeed] = useState(80);
  const [combo, setCombo] = useState(1);
  const [stability, setStability] = useState(100);
  const [empCharge, setEmpCharge] = useState(100);
  const [captured, setCaptured] = useState<CapturedItem[]>([]);
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  // Controls state
  const keysRef = useRef<{
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    space: boolean;
  }>({
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
  });

  // Game loop mutable references
  const stateRef = useRef({
    tux: {
      x: 0,
      y: 0,
      targetX: 0,
      vx: 0,
      tilt: 0,
      diving: false,
      braking: false,
      scarfPhase: 0,
      width: 44,
      height: 54,
    },
    altitude: 10000,
    speed: 80,
    score: 0,
    combo: 1,
    maxCombo: 1,
    stability: 100,
    empCharge: 100,
    captured: [] as CapturedItem[],
    items: [] as GameItemInstance[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    snowflakes: [] as Snowflake[],
    shake: 0,
    empRadius: 0,
    isLanded: false,
    startTime: Date.now(),
    lastSpawnAlt: 10000,
  });

  const nextTextId = useRef(1);

  // Sound mute toggle
  const toggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = true;
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.up = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.down = true;
      if (e.code === 'Space') {
        e.preventDefault();
        triggerEmp();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // EMP Burst trigger
  const triggerEmp = useCallback(() => {
    const s = stateRef.current;
    if (s.empCharge >= 100 && !s.isLanded) {
      s.empCharge = 0;
      s.empRadius = 1;
      sound.playEmp();

      // Clear hazards and pull items
      s.items.forEach((item) => {
        const dx = item.x - s.tux.x;
        const dy = item.y - s.tux.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 350) {
          if (item.component.category === 'hazard') {
            // Blast hazard away
            item.collected = true;
            for (let i = 0; i < 12; i++) {
              s.particles.push({
                x: item.x,
                y: item.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color: '#ef4444',
                alpha: 1,
                life: 0,
                maxLife: 25,
              });
            }
          } else {
            // Magnetize toward Tux
            item.vx = -dx * 0.15;
            item.vy = -dy * 0.15;
          }
        }
      });
    }
  }, []);

  // Main canvas animation and physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stateRef.current.tux.x = canvas.width / 2;
      stateRef.current.tux.y = canvas.height * 0.32;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize snowflakes
    const flakes: Snowflake[] = [];
    for (let i = 0; i < 120; i++) {
      flakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 3 + 2,
        radius: Math.random() * 2.2 + 0.8,
        alpha: Math.random() * 0.7 + 0.3,
        drift: (Math.random() - 0.5) * 1.5,
      });
    }
    stateRef.current.snowflakes = flakes;

    // Helper to spawn items according to altitude zone
    const spawnItem = (canvasWidth: number, canvasHeight: number) => {
      const s = stateRef.current;
      const alt = s.altitude;

      // Filter available candidates by altitude suitability
      let candidates: LinuxComponent[] = [];

      if (alt > 7000) {
        // High altitude: Layer 1 (Kernel & HW) + hazards + some tools
        candidates = itemsPool.filter(i => i.layer_level === 1 || i.layer_level === 5 || i.category === 'hazard');
      } else if (alt > 4500) {
        // Mid-high altitude: Layer 2 (Init) & Layer 3 (Distros)
        candidates = itemsPool.filter(i => i.layer_level === 2 || i.layer_level === 3 || i.category === 'hazard');
      } else if (alt > 2000) {
        // Mid-low altitude: Layer 4 (Display/DE) & Distros
        candidates = itemsPool.filter(i => i.layer_level === 4 || i.layer_level === 3 || i.layer_level === 5 || i.category === 'hazard');
      } else {
        // Low altitude: Layer 5 (Tools) & missing components
        candidates = itemsPool.filter(i => i.layer_level === 5 || i.layer_level === 4 || i.category === 'hazard');
      }

      if (candidates.length === 0) candidates = itemsPool;

      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      const safeMargin = Math.max(120, Math.min(canvasWidth * 0.25, 160));
      const x = Math.random() * (canvasWidth - safeMargin * 2) + safeMargin;
      const y = canvasHeight + 50; // Spawns from bottom, flows upward

      // Sizing for responsive large side bricks
      const boxW = 190;
      const boxH = 48;

      s.items.push({
        id: `${chosen.id}-${Date.now()}-${Math.random()}`,
        component: chosen,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.6,
        vy: 0,
        radius: 36,
        boxW,
        boxH,
        collected: false,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    };

    // Game loop
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const s = stateRef.current;
      const keys = keysRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // 1. TUX PHYSICS & CONTROLS (Gentle, controlled skyfall pace)
      const tux = s.tux;

      // Diving / Braking / Lateral movement
      tux.diving = keys.down;
      tux.braking = keys.up;

      // Slower, smoother falling speed
      let targetSpeed = 80;
      if (tux.diving) targetSpeed = 150;
      if (tux.braking) targetSpeed = 40;
      s.speed += (targetSpeed - s.speed) * dt * 3.5;

      // Altitude descent (smoother flight through the blizzard)
      if (!s.isLanded) {
        const altLoss = s.speed * dt * 1.5;
        s.altitude = Math.max(0, s.altitude - altLoss);

        // Check landing condition
        if (s.altitude <= 0) {
          s.altitude = 0;
          s.isLanded = true;
          sound.playFanfare();

          const duration = (Date.now() - s.startTime) / 1000;
          setTimeout(() => {
            onGameComplete(s.captured, 0, s.maxCombo, duration);
          }, 1800);
        }
      }

      // Lateral steering with inertia & tilt
      const accel = tux.diving ? 750 : 600;
      if (keys.left) {
        tux.vx -= accel * dt;
        tux.tilt += (-0.35 - tux.tilt) * dt * 8;
      } else if (keys.right) {
        tux.vx += accel * dt;
        tux.tilt += (0.35 - tux.tilt) * dt * 8;
      } else {
        tux.vx *= Math.pow(0.1, dt);
        tux.tilt += (0 - tux.tilt) * dt * 7;
      }

      tux.x += tux.vx * dt;
      // Clamp Tux in bounds
      const padding = 35;
      if (tux.x < padding) {
        tux.x = padding;
        tux.vx = 0;
      }
      if (tux.x > w - padding) {
        tux.x = w - padding;
        tux.vx = 0;
      }

      tux.scarfPhase += dt * (s.speed / 20);

      // Charge EMP over time
      if (s.empCharge < 100 && !s.isLanded) {
        s.empCharge = Math.min(100, s.empCharge + dt * 10);
      }

      // EMP shockwave expansion
      if (s.empRadius > 0) {
        s.empRadius += dt * 700;
        if (s.empRadius > 500) {
          s.empRadius = 0;
        }
      }

      // Spawning items dynamically (Calibrated for comfortable descent)
      if (!s.isLanded && s.altitude > 80) {
        if (s.lastSpawnAlt - s.altitude > 90) {
          spawnItem(w, h);
          s.lastSpawnAlt = s.altitude;
        }
      }

      // Update items position (Gentle, controlled upward flow)
      const upwardSpeed = (s.speed / 60) * 68;
      s.items.forEach((item) => {
        item.pulsePhase += dt * 3.5;
        item.x += item.vx;
        item.y -= upwardSpeed * dt;

        // Subtle lateral drift
        item.vx *= 0.98;

        // Check SMASH collision with Tux
        if (!item.collected && !s.isLanded) {
          const halfW = (item.boxW || 190) / 2;
          const halfH = (item.boxH || 48) / 2;
          const dx = Math.abs(item.x - tux.x);
          const dy = Math.abs(item.y - tux.y);

          // Hit / Smash condition with large side brick
          if (dx < halfW + 18 && dy < halfH + 22) {
            item.collected = true;

            if (item.component.category === 'hazard') {
              // Smashed into a hazard!
              s.shake = 18;
              s.combo = 1;
              s.stability = Math.max(10, s.stability - 20);
              sound.playHazard();

              // Add floating damage text
              s.floatingTexts.push({
                id: nextTextId.current++,
                x: item.x,
                y: item.y - 10,
                text: `${item.component.points} PTS [BLOAT CRASH]`,
                color: '#ef4444',
                alpha: 1,
              });

              // Explode hazard debris
              for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = Math.random() * 7 + 2;
                s.particles.push({
                  x: item.x,
                  y: item.y,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd - 1,
                  size: Math.random() * 4 + 2,
                  color: '#ef4444',
                  alpha: 1,
                  life: 0,
                  maxLife: 25,
                });
              }

              s.captured.push({
                id: item.component.id,
                name: item.component.name,
                category: item.component.category,
                layer_level: item.component.layer_level,
                captured_at_altitude: s.altitude,
                points: item.component.points,
                color: item.component.color,
              });
            } else {
              // SMASH LINUX BRICK!
              s.shake = Math.max(s.shake, 6);
              sound.playSmash(item.component.rarity);
              s.combo++;
              if (s.combo > s.maxCombo) s.maxCombo = s.combo;

              if (s.combo % 3 === 0) {
                sound.playCombo();
              }

              // Base points * combo multiplier
              const earned = Math.round(item.component.points * (1 + (s.combo - 1) * 0.15));
              s.score += earned;

              // Restore a bit of integrity
              s.stability = Math.min(100, s.stability + 3);

              // Add floating smash score text
              s.floatingTexts.push({
                id: nextTextId.current++,
                x: item.x,
                y: item.y - 12,
                text: `+${earned} ${item.component.name}`,
                color: item.component.color,
                alpha: 1,
              });

              // Explode 26 brick shards outwards on smash!
              for (let i = 0; i < 26; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = Math.random() * 8 + 3;
                s.particles.push({
                  x: item.x + (Math.random() - 0.5) * (item.boxW || 190) * 0.5,
                  y: item.y + (Math.random() - 0.5) * (item.boxH || 48) * 0.5,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd - 2,
                  size: Math.random() * 5 + 3,
                  color: item.component.color,
                  alpha: 1,
                  life: 0,
                  maxLife: 35,
                });
              }

              s.captured.push({
                id: item.component.id,
                name: item.component.name,
                category: item.component.category,
                layer_level: item.component.layer_level,
                captured_at_altitude: s.altitude,
                points: item.component.points,
                color: item.component.color,
              });
            }
          }
        }
      });

      // Filter out-of-screen and collected items
      s.items = s.items.filter((item) => item.y > -80 && !item.collected);

      // Update particles
      s.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;
      });
      s.particles = s.particles.filter((p) => p.life < p.maxLife);

      // Update floating texts
      s.floatingTexts.forEach((ft) => {
        ft.y -= 45 * dt;
        ft.alpha -= 0.65 * dt;
      });
      s.floatingTexts = s.floatingTexts.filter((ft) => ft.alpha > 0);

      // Update snowflakes
      s.snowflakes.forEach((f) => {
        f.y -= (upwardSpeed * 0.4 + f.speed * 20) * dt;
        f.x += f.drift;
        if (f.y < 0) {
          f.y = h + 10;
          f.x = Math.random() * w;
        }
      });

      // Screen shake decay
      if (s.shake > 0) {
        s.shake *= 0.88;
        if (s.shake < 0.2) s.shake = 0;
      }

      // Sync state to React HUD every ~6 frames
      if (Math.random() < 0.16) {
        setScore(s.score);
        setAltitude(s.altitude);
        setSpeed(s.speed);
        setCombo(s.combo);
        setStability(s.stability);
        setEmpCharge(s.empCharge);
        setCaptured([...s.captured]);
      }

      // 2. RENDERING CANVAS
      ctx.save();

      // Apply screen shake
      if (s.shake > 0) {
        ctx.translate(
          (Math.random() - 0.5) * s.shake * 2,
          (Math.random() - 0.5) * s.shake * 2
        );
      }

      // Background gradient based on altitude
      // 10k: Deep space blue -> 5k: Blizzard midnight -> 0k: Glacier ice ground
      const altProgress = 1 - s.altitude / 10000;
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (altProgress < 0.5) {
        bgGrad.addColorStop(0, '#040711');
        bgGrad.addColorStop(0.5, '#091122');
        bgGrad.addColorStop(1, '#0e1d38');
      } else {
        bgGrad.addColorStop(0, '#091122');
        bgGrad.addColorStop(0.6, '#0f2442');
        bgGrad.addColorStop(1, '#1e3a5f');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Render Aurora Borealis wave in upper/mid atmosphere
      if (s.altitude > 1500) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        const auroraGrad = ctx.createLinearGradient(0, 0, w, 0);
        auroraGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        auroraGrad.addColorStop(0.3, 'rgba(20, 184, 166, 0.5)');
        auroraGrad.addColorStop(0.7, 'rgba(139, 92, 246, 0.4)');
        auroraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = auroraGrad;

        ctx.beginPath();
        const timeOffset = currentTime * 0.001;
        ctx.moveTo(0, h * 0.2);
        for (let x = 0; x <= w; x += 30) {
          const y = h * 0.2 + Math.sin(x * 0.005 + timeOffset) * 40 + Math.cos(x * 0.01 + timeOffset * 1.5) * 20;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h * 0.5);
        ctx.lineTo(0, h * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Render Glacier Mountain Silhouettes near bottom
      const mountainAlt = Math.max(0, 2500 - s.altitude) / 2500;
      if (mountainAlt > 0) {
        ctx.save();
        ctx.globalAlpha = mountainAlt * 0.7;
        ctx.fillStyle = '#0a1628';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, h - 80 * mountainAlt);
        ctx.lineTo(w * 0.25, h - 180 * mountainAlt);
        ctx.lineTo(w * 0.5, h - 110 * mountainAlt);
        ctx.lineTo(w * 0.75, h - 220 * mountainAlt);
        ctx.lineTo(w, h - 90 * mountainAlt);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        // Glacier ice rim highlights
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // Render Landing Runway when altitude < 500m
      if (s.altitude < 600) {
        const groundY = h * (0.85 + (s.altitude / 600) * 0.35);
        ctx.save();
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, groundY, w, h - groundY);

        // Neon runway guide lights
        ctx.fillStyle = '#38bdf8';
        for (let rx = 50; rx < w; rx += 70) {
          ctx.beginPath();
          ctx.arc(rx, groundY + 8, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Render Snowflakes (Parallax blizzard)
      ctx.save();
      s.snowflakes.forEach((f) => {
        ctx.fillStyle = `rgba(240, 249, 255, ${f.alpha})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Render EMP Shockwave if active
      if (s.empRadius > 0) {
        ctx.save();
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(tux.x, tux.y, s.empRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Render Falling Linux Items (Responsive Large Smash Bricks)
      s.items.forEach((item) => {
        const comp = item.component;
        const isHazard = comp.category === 'hazard';

        // 1. Calculate responsive font size and box dimensions
        const maxScreenW = Math.max(180, Math.min(340, w - 36));

        // Start with large punchy font
        let titleFontSize = 13.5;
        ctx.font = `bold ${titleFontSize}px "JetBrains Mono", monospace`;
        let titleMetrics = ctx.measureText(comp.name);

        // Dynamically scale down font if text is exceptionally long, guaranteeing it fits inside maxScreenW
        while (titleMetrics.width + 44 > maxScreenW && titleFontSize > 9.5) {
          titleFontSize -= 0.5;
          ctx.font = `bold ${titleFontSize}px "JetBrains Mono", monospace`;
          titleMetrics = ctx.measureText(comp.name);
        }

        const subtitleText = `${comp.tag} • ${comp.points > 0 ? '+' : ''}${comp.points} PTS`;
        const subFontSize = Math.max(8.5, Math.min(10, titleFontSize - 3));
        ctx.font = `bold ${subFontSize}px "JetBrains Mono", monospace`;
        const subMetrics = ctx.measureText(subtitleText);

        // Box width dynamically wraps whichever text line is wider, with generous horizontal padding
        const maxTextWidth = Math.max(titleMetrics.width, subMetrics.width);
        const boxW = Math.min(maxScreenW, Math.max(175, Math.ceil(maxTextWidth + 44)));
        const boxH = Math.max(48, Math.ceil(titleFontSize * 2 + 18));
        const radius = 10;
        item.boxW = boxW;
        item.boxH = boxH;

        // Keep brick strictly inside canvas viewport bounds so it never clips off screen
        const halfW = boxW / 2;
        if (item.x - halfW < 12) item.x = halfW + 12;
        if (item.x + halfW > w - 12) item.x = w - halfW - 12;

        ctx.save();
        ctx.translate(item.x, item.y);

        // Outer glow
        ctx.shadowColor = comp.color;
        ctx.shadowBlur = isHazard ? 18 : 14;

        // Background capsule (Large Arcade Brick with cyber gradient)
        const bgGrad = ctx.createLinearGradient(0, -boxH / 2, 0, boxH / 2);
        if (isHazard) {
          bgGrad.addColorStop(0, 'rgba(115, 18, 18, 0.95)');
          bgGrad.addColorStop(1, 'rgba(55, 8, 8, 0.95)');
        } else {
          bgGrad.addColorStop(0, 'rgba(18, 28, 48, 0.96)');
          bgGrad.addColorStop(1, 'rgba(8, 14, 25, 0.96)');
        }
        ctx.fillStyle = bgGrad;
        ctx.strokeStyle = comp.color;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, radius);
        ctx.fill();
        ctx.stroke();

        // Left accent indicator stripe
        ctx.fillStyle = comp.color;
        ctx.beginPath();
        ctx.roundRect(-boxW / 2 + 4, -boxH / 2 + 7, 4, boxH - 14, 2);
        ctx.fill();

        // Large Title Text (Centered, perfectly inside the box)
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${titleFontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(comp.name, 2, -boxH * 0.16);

        // Subtitle: Tag and points badge (Centered, inside the box)
        ctx.shadowBlur = 0;
        ctx.fillStyle = comp.color;
        ctx.font = `bold ${subFontSize}px "JetBrains Mono", monospace`;
        ctx.fillText(subtitleText, 2, boxH * 0.22);

        ctx.restore();
      });

      // Render Particles
      s.particles.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Tux character
      ctx.save();
      ctx.translate(tux.x, tux.y);
      ctx.rotate(tux.tilt);

      // Tux Speed Trail lines when diving
      if (tux.diving) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, -30);
        ctx.lineTo(-16, -60);
        ctx.moveTo(16, -30);
        ctx.lineTo(16, -60);
        ctx.stroke();
      }

      // Parachute / Air brake canvas effect when holding Up
      if (tux.braking) {
        ctx.strokeStyle = '#38bdf8';
        ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -45, 36, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Suspension lines to Tux
        ctx.beginPath();
        ctx.moveTo(-36, -45);
        ctx.lineTo(0, -10);
        ctx.moveTo(36, -45);
        ctx.lineTo(0, -10);
        ctx.stroke();
      }

      // 1. Tux Body (Dark Nordic Penguin)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 27, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 2. Tux White Belly
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(0, 4, 13, 19, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Flipper Wings
      const wingAngle = tux.diving ? 0.2 : tux.braking ? 0.9 : 0.5;
      // Left Wing
      ctx.save();
      ctx.translate(-17, -2);
      ctx.rotate(-wingAngle);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 14, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // Right Wing
      ctx.save();
      ctx.translate(17, -2);
      ctx.rotate(wingAngle);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 14, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // 4. Tux Feet
      ctx.fillStyle = '#f59e0b';
      // Left foot
      ctx.beginPath();
      ctx.ellipse(-8, 26, 6, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Right foot
      ctx.beginPath();
      ctx.ellipse(8, 26, 6, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // 5. Tux Eyes (Determined aviator gaze)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6, -11, 4, 0, Math.PI * 2);
      ctx.arc(6, -11, 4, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(-5.5, -10.5, 2.2, 0, Math.PI * 2);
      ctx.arc(6.5, -10.5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 6. Tux Beak (Yellow/Orange)
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-6, -6);
      ctx.lineTo(6, -6);
      ctx.lineTo(0, 1);
      ctx.closePath();
      ctx.fill();

      // 7. Winter Flying Scarf (Fluttering in the blizzard wind!)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(-14, -7, 28, 6, 3);
      ctx.fill();

      // Scarf tails waving
      const tailWave1 = Math.sin(tux.scarfPhase) * 6;
      const tailWave2 = Math.cos(tux.scarfPhase * 1.3) * 6;
      ctx.beginPath();
      ctx.moveTo(10, -5);
      ctx.quadraticCurveTo(18 + tailWave1, -18, 24 + tailWave2, -32);
      ctx.lineTo(19 + tailWave2, -32);
      ctx.quadraticCurveTo(14 + tailWave1, -16, 8, -3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Render Floating Texts (+Points, Bloat warnings)
      s.floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 8;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [itemsPool, onGameComplete, triggerEmp]);

  // Zero-lag mobile touch/pointer listener generator
  const createButtonListeners = (dir: 'left' | 'right' | 'up' | 'down') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
      keysRef.current[dir] = true;
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      keysRef.current[dir] = false;
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      keysRef.current[dir] = false;
    },
    onPointerLeave: () => {
      keysRef.current[dir] = false;
    },
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      keysRef.current[dir] = true;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      keysRef.current[dir] = false;
    },
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
    },
  });

  const handleForceLand = () => {
    const s = stateRef.current;
    if (!s.isLanded) {
      s.altitude = 0;
      s.isLanded = true;
      sound.playFanfare();
      const duration = (Date.now() - s.startTime) / 1000;
      onGameComplete(s.captured, 0, s.maxCombo, duration);
    }
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] overflow-hidden bg-nordic-darkest select-none touch-none">
      {/* Game Canvas with touch fallback */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full cursor-none touch-none select-none"
      />

      {/* Floating HUD */}
      <HUD
        altitude={altitude}
        speed={speed}
        score={score}
        combo={combo}
        stability={stability}
        empCharge={empCharge}
        capturedItems={captured}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onForceLand={handleForceLand}
      />

      {/* Mobile Arcade Controller (Prominent Arrows for Mobile Gameplay) */}
      <div className="absolute bottom-5 inset-x-3 sm:inset-x-6 flex justify-between items-end select-none touch-none z-30 pointer-events-none pb-safe">
        {/* Left Cluster: Dedicated Steering Arrows (Left & Right) */}
        <div className="flex items-center gap-2.5 sm:gap-3 pointer-events-auto bg-slate-950/75 p-2 sm:p-2.5 rounded-3xl border border-cyan-500/30 backdrop-blur-md shadow-2xl">
          {/* Steer Left Arrow */}
          <button
            {...createButtonListeners('left')}
            className="w-16 h-16 sm:w-18 sm:h-18 bg-slate-900/95 active:bg-cyan-500/40 border-2 border-cyan-500/60 active:border-cyan-300 rounded-2xl flex flex-col items-center justify-center text-cyan-300 active:scale-90 transition-transform shadow-lg shadow-cyan-950/60 select-none touch-none"
            aria-label="Steer Left"
          >
            <ArrowLeft className="w-8 h-8 stroke-[2.5]" />
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase mt-0.5 text-cyan-400">
              LEFT
            </span>
          </button>

          {/* Steer Right Arrow */}
          <button
            {...createButtonListeners('right')}
            className="w-16 h-16 sm:w-18 sm:h-18 bg-slate-900/95 active:bg-cyan-500/40 border-2 border-cyan-500/60 active:border-cyan-300 rounded-2xl flex flex-col items-center justify-center text-cyan-300 active:scale-90 transition-transform shadow-lg shadow-cyan-950/60 select-none touch-none"
            aria-label="Steer Right"
          >
            <ArrowRight className="w-8 h-8 stroke-[2.5]" />
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase mt-0.5 text-cyan-400">
              RIGHT
            </span>
          </button>
        </div>

        {/* Right Cluster: Up (Slow Glide), Down (Speed Dive Smash), EMP Burst */}
        <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto bg-slate-950/75 p-2 sm:p-2.5 rounded-3xl border border-slate-700/60 backdrop-blur-md shadow-2xl">
          {/* EMP Shockwave Burst Button */}
          <button
            onClick={triggerEmp}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center transition-all select-none touch-none active:scale-90 ${
              empCharge >= 100
                ? 'bg-gradient-to-br from-cyan-500 to-teal-400 text-slate-950 border-2 border-cyan-300 shadow-lg shadow-cyan-400/50 animate-pulse'
                : 'bg-slate-900/80 text-slate-500 border border-slate-700/50'
            }`}
            aria-label="EMP Shockwave"
          >
            <Zap className="w-6 h-6 fill-current" />
            <span className="text-[8px] font-mono font-black tracking-wider uppercase mt-0.5">
              {empCharge >= 100 ? 'EMP' : `${Math.round(empCharge)}%`}
            </span>
          </button>

          {/* Slow / Parachute Up Arrow */}
          <button
            {...createButtonListeners('up')}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-900/95 active:bg-sky-500/30 border-2 border-slate-700 active:border-sky-400 rounded-2xl flex flex-col items-center justify-center text-slate-200 active:scale-90 transition-transform select-none touch-none"
            aria-label="Slow Parachute"
          >
            <ArrowUp className="w-6 h-6 stroke-[2.5]" />
            <span className="text-[8px] font-mono font-bold tracking-wider uppercase mt-0.5 text-slate-400">
              SLOW
            </span>
          </button>

          {/* Dive / Smash Down Arrow */}
          <button
            {...createButtonListeners('down')}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-900/95 active:bg-amber-500/30 border-2 border-slate-700 active:border-amber-400 rounded-2xl flex flex-col items-center justify-center text-slate-200 active:scale-90 transition-transform select-none touch-none"
            aria-label="Dive Smash"
          >
            <ArrowDown className="w-6 h-6 stroke-[2.5]" />
            <span className="text-[8px] font-mono font-bold tracking-wider uppercase mt-0.5 text-slate-400">
              DIVE
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
