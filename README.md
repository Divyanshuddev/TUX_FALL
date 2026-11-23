# 🐧 Tux Fall: Linux Architecture Skyfall Game

> **A retro + modern + minimal Linux game** built with **Next.js (App Router)**, **Anime.js**, and a **FastAPI** backend.
> Guide Tux falling through snow and blizzard skies, capture authentic Linux system specifications, distributions, window environments, and default tools, and synthesize a cohesive Linux system architecture to earn high scores and rank on the SysAdmin Hall of Fame!

---

## 🎮 Game Concept & Mechanics

1. **The Skyfall**:
   - Tux free-falls from **10,000 meters** (Stratosphere) through icy blizzard flurries and cyber aurora ribbons down to the **0 meter Glacier Runway**.
   - **Controls**:
     - ◀ / ▶ (**Arrow Left / Right** or `A` / `D`): Steer & glide laterally with bank tilt.
     - ▼ (**Arrow Down** or `S`): **Streamlined Dive** (faster descent, higher risk, score multiplier).
     - ▲ (**Arrow Up** or `W`): **Parachute Air-Brake** (slow glide for precision item positioning).
     - `SPACEBAR`: **EMP / Bash Shockwave** (blades away Windows bloatware hazards and pulls nearby Linux components).
     - **On-Screen Mobile D-Pad**: Full touch controls for mobile & tablet gameplay.

2. **The 5 Linux Architectural Layers to Capture**:
   - 🟩 **Layer 1: Kernel & Hardware Architecture** (10,000m – 7,000m)
     - *Linux 6.12 LTS Monolithic Kernel*, *Linux-Zen Gaming Kernel*, *eBPF Subsystem*, *x86_64-v3 Arch*, *RISC-V 64 Open Hardware*, *OpenZFS Driver*.
   - 🟨 **Layer 2: Init Systems & Service Supervision** (7,000m – 5,000m)
     - *systemd (PID 1)*, *OpenRC Supervisor*, *runit UNIX Daemon*, *SysVinit*.
   - 🟦 **Layer 3: Linux Distributions** (5,000m – 3,000m)
     - *Arch Linux*, *Debian GNU/Linux*, *Fedora Workstation*, *NixOS Declarative*, *Alpine Linux*, *Gentoo*, *Void Linux*.
   - 🟪 **Layer 4: Window / Desktop Environments & Display Servers** (3,000m – 1,500m)
     - *Wayland Display Protocol*, *X11 / Xorg*, *Hyprland Dynamic Compositor*, *GNOME 47*, *KDE Plasma 6*, *i3wm*, *Sway*.
   - 🟧 **Layer 5: Core Linux Tools & Utilities** (1,500m – 0m)
     - *GNU Bash 5.2*, *Zsh + Starship*, *GNU Core Utilities*, *Neovim*, *grep + sed + awk*, *curl HTTP/3*, *btop / htop*, *tmux*, *Git*, *PipeWire*.

3. **Hazards (Non-Linux Bloat to Dodge!)**:
   - `regedit.exe (Registry Bloat)` (-150 pts)
   - `BSoD Stop Code Crash Bug` (-200 pts)
   - `Cortana Telemetry Daemon` (-120 pts)
   - `Kernel Panic Ring-0 Trap` (-250 pts)

---

## 🏛️ Post-Game Linux System Architecture Evaluation

When Tux lands at 0m, the backend evaluates your captured items across the 5 architectural layers:
- **Accuracy Percentage (0% – 100%)**:
  - Tests whether you have a complete, cohesive, and bootable Linux operating system.
  - Detects missing kernel (halting CPU), competing inits (PID 1 race condition), or distro hopping collisions.
- **Architectural Synergies & Badges**:
  - 🎨 **The Ultimate Unix Ricer**: Arch Linux + Hyprland + Wayland + Neovim (+500 pts)
  - 🛡️ **Rock-Solid Enterprise Workstation**: Debian/Fedora + systemd + GNOME/KDE + Coreutils (+450 pts)
  - ❄️ **Pure Declarative Nirvana**: NixOS + Wayland/Sway + Neovim + Git (+550 pts)
  - 📦 **Micro Alpine Fortress**: Alpine Linux + OpenRC + lightweight utils (+480 pts)
  - 🧙 **Classic UNIX Purist**: Void/Gentoo + runit/OpenRC + i3wm + X11 + tmux (+520 pts)
  - ⚙️ **Master SysAdmin Toolchain**: grep/sed/awk + curl + btop + tmux + git (+420 pts)
- **Simulated Linux Boot Log (`dmesg` / `journalctl`)**:
  - Animated boot logs showing the exact initialization sequence of your synthesized operating system.
- **Blueprint Export**:
  - One-click export of your custom Linux system structure as JSON.

---

## 🎨 Theme: Retro + Modern + Minimal

- **Minimalist Cyber-Glacier Aesthetic**: Deep slate/navy glacier tones (`#070b14`), icy cyan highlights (`#38bdf8`), amber/emerald accents.
- **CRT Scanlines & Phosphor Vignette**: Toggleable retro scanline effect.
- **Anime.js Animations**:
  - Staggered layer building animations in the architecture stack.
  - Number roll-up animations for scores and accuracy.
  - Tux victory landing animation.
  - Hero menu entrance effects.
- **Procedural 8-bit Web Audio Synthesizer**:
  - Pure HTML5 Web Audio API chiptune sound effects: Jump blips, pickup chimes, combo sparkles, EMP lasers, boot chimes, and fanfare.

---

## 🚀 Running the Project

### Services:
- **Frontend (Next.js)**: `http://localhost:3000`
- **Backend API (FastAPI)**: `http://localhost:8000`
- **Interactive API Docs (Swagger UI)**: `http://localhost:8000/docs`

### Quick Start Script:
```bash
./start.sh
```

### Manual Commands:
1. **FastAPI Backend**:
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Next.js Frontend**:
   ```bash
   cd frontend
   npm run dev  # or npm start for production
   ```
