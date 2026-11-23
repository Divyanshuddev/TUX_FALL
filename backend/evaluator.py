import uuid
import datetime
from typing import List, Dict, Any
from models import (
    CapturedItemInput,
    EvaluationRequest,
    EvaluationResult,
    ArchitectureSlot,
    LayerCategory
)
from data import LINUX_COMPONENT_MAP, SYNERGY_RULES

def evaluate_linux_architecture(request: EvaluationRequest) -> EvaluationResult:
    captured = request.captured_items
    captured_ids = [item.id for item in captured]
    unique_ids = set(captured_ids)

    # Group items by layer
    layer1_items = [item for item in captured if item.category == LayerCategory.KERNEL_ARCH.value]
    layer2_items = [item for item in captured if item.category == LayerCategory.INIT_SYSTEM.value]
    layer3_items = [item for item in captured if item.category == LayerCategory.DISTRO.value]
    layer4_items = [item for item in captured if item.category == LayerCategory.WINDOW_DE.value]
    layer5_items = [item for item in captured if item.category == LayerCategory.CORE_TOOLS.value]
    hazards = [item for item in captured if item.category == LayerCategory.HAZARD.value]

    base_item_score = sum(item.points for item in captured if item.category != LayerCategory.HAZARD.value)
    hazard_penalty = sum(abs(item.points) for item in hazards)
    combo_bonus = request.max_combo * 45

    warnings_and_conflicts: List[str] = []
    hazards_caught = [item.name for item in hazards]

    architecture_layers: List[ArchitectureSlot] = []
    arch_score = 0
    max_possible_arch = 1500

    # 1. Evaluate Layer 1: Kernel & HW Architecture (Weight: 350 pts)
    kernel_present = any("kernel" in item.id for item in layer1_items)
    hw_present = any("arch-" in item.id for item in layer1_items) or len(layer1_items) > 1

    if kernel_present and hw_present:
        status1 = "OPTIMAL"
        score1 = 350
        desc1 = "Valid Linux kernel linked to target architecture. Ring 0 initialization verified."
    elif kernel_present:
        status1 = "OPTIMAL"
        score1 = 300
        desc1 = "Kernel present. Defaulting to generic x86_64 host instructions."
    elif len(layer1_items) > 0:
        status1 = "SUBOPTIMAL"
        score1 = 150
        desc1 = "Hardware modules present, but no primary Linux kernel binary found."
        warnings_and_conflicts.append("Missing primary kernel binary: Bootloader has no vmlinuz image to decompress.")
    else:
        status1 = "MISSING"
        score1 = 0
        desc1 = "CRITICAL: No Kernel or Hardware architecture caught. CPU enters halt state."
        warnings_and_conflicts.append("Fatal: Kernel Missing. System cannot boot into protected mode.")

    arch_score += score1
    architecture_layers.append(ArchitectureSlot(
        layer_level=1,
        layer_name="Kernel & Hardware Layer",
        is_fulfilled=kernel_present,
        status=status1,
        chosen_items=[item.name for item in layer1_items],
        description=desc1,
        score_awarded=score1,
        max_points=350
    ))

    # 2. Evaluate Layer 2: Init System (Weight: 250 pts)
    unique_inits = set(item.id for item in layer2_items)
    if len(unique_inits) == 1:
        status2 = "OPTIMAL"
        score2 = 250
        desc2 = f"Clean PID 1 initialization using {layer2_items[0].name}. Deterministic runlevel targets."
    elif len(unique_inits) > 1:
        status2 = "CONFLICT"
        score2 = 120
        desc2 = "Multiple competing init systems caught! PID 1 contention risk detected."
        warnings_and_conflicts.append(f"Init Conflict: {', '.join([item.name for item in layer2_items])} are competing for PID 1.")
    else:
        status2 = "MISSING"
        score2 = 0
        desc2 = "No Init System caught. Kernel boots into emergency single-user shell /bin/sh."
        warnings_and_conflicts.append("Missing Init System: No service supervision or daemon lifecycle.")

    arch_score += score2
    architecture_layers.append(ArchitectureSlot(
        layer_level=2,
        layer_name="Init & Service Layer",
        is_fulfilled=len(unique_inits) > 0,
        status=status2,
        chosen_items=[item.name for item in layer2_items],
        description=desc2,
        score_awarded=score2,
        max_points=250
    ))

    # 3. Evaluate Layer 3: Distribution Base (Weight: 350 pts)
    unique_distros = set(item.id for item in layer3_items)
    if len(unique_distros) == 1:
        status3 = "OPTIMAL"
        score3 = 350
        desc3 = f"Cohesive root filesystem and package repository provided by {layer3_items[0].name}."
    elif len(unique_distros) == 2:
        status3 = "SUBOPTIMAL"
        score3 = 200
        desc3 = "Dual distro packages mixed. Requires Bedrock Linux strata or multi-lib chroots."
        warnings_and_conflicts.append("Distro Hybridization: Multiple package managers detected.")
    elif len(unique_distros) > 2:
        status3 = "CONFLICT"
        score3 = 100
        desc3 = "Severe Distro Hopping! Conflicting shared libraries and package database collisions."
        warnings_and_conflicts.append("Distro Hopping Alert: 3+ distributions captured causing library hell.")
    else:
        status3 = "MISSING"
        score3 = 0
        desc3 = "No Distribution selected. Linux From Scratch (LFS) raw rootfs unpopulated."
        warnings_and_conflicts.append("Missing Distro: No standard base filesystem hierarchy (FHS).")

    arch_score += score3
    architecture_layers.append(ArchitectureSlot(
        layer_level=3,
        layer_name="Distribution Base",
        is_fulfilled=len(unique_distros) > 0,
        status=status3,
        chosen_items=[item.name for item in layer3_items],
        description=desc3,
        score_awarded=score3,
        max_points=350
    ))

    # 4. Evaluate Layer 4: Display Server & Window/Desktop Environment (Weight: 250 pts)
    has_display_protocol = any(item.id in ["display-wayland", "display-x11"] for item in layer4_items)
    has_de_or_wm = any(item.id.startswith("de-") for item in layer4_items)

    if has_display_protocol and has_de_or_wm:
        status4 = "OPTIMAL"
        score4 = 250
        desc4 = "Complete graphical pipeline: Display protocol linked to Window Manager / Desktop Shell."
    elif has_de_or_wm:
        status4 = "SUBOPTIMAL"
        score4 = 200
        desc4 = "Window manager present. Rendering via fallback virtual framebuffer socket."
    elif has_display_protocol:
        status4 = "SUBOPTIMAL"
        score4 = 150
        desc4 = "Display server running, but no Window Manager or Desktop Environment active (blank root window)."
    elif len(layer4_items) == 0:
        status4 = "OPTIMAL"  # Headless server is a totally valid Linux architecture!
        score4 = 180
        desc4 = "Headless Server / TTY Architecture. Minimalist zero-overhead pure terminal operation."
    else:
        status4 = "SUBOPTIMAL"
        score4 = 120
        desc4 = "Partial GUI setup."

    arch_score += score4
    architecture_layers.append(ArchitectureSlot(
        layer_level=4,
        layer_name="Display Server & Desktop / WM",
        is_fulfilled=len(layer4_items) > 0 or True,
        status=status4,
        chosen_items=[item.name for item in layer4_items] if layer4_items else ["Headless TTY Console"],
        description=desc4,
        score_awarded=score4,
        max_points=250
    ))

    # 5. Evaluate Layer 5: Default Tools & Utilities (Weight: 300 pts)
    has_shell = any(item.id in ["tool-bash", "tool-zsh-starship"] for item in layer5_items)
    has_coreutils = any(item.id == "tool-coreutils" for item in layer5_items)
    num_tools = len(layer5_items)

    if has_shell and has_coreutils and num_tools >= 4:
        status5 = "OPTIMAL"
        score5 = 300
        desc5 = "Powerhouse CLI environment: Interactive shell, POSIX coreutils, and advanced developer suite."
    elif has_shell and num_tools >= 2:
        status5 = "OPTIMAL"
        score5 = 250
        desc5 = "Solid toolchain configured with responsive command line and essential utilities."
    elif num_tools >= 1:
        status5 = "SUBOPTIMAL"
        score5 = 150
        desc5 = "Sparse userland toolchain. Basic command execution available."
    else:
        status5 = "MISSING"
        score5 = 0
        desc5 = "Missing core utilities! No interactive shell or file manipulation commands."
        warnings_and_conflicts.append("Missing Shell & Utilities: Userland is inaccessible.")

    arch_score += score5
    architecture_layers.append(ArchitectureSlot(
        layer_level=5,
        layer_name="Core Utilities & Shell Suite",
        is_fulfilled=num_tools > 0,
        status=status5,
        chosen_items=[item.name for item in layer5_items],
        description=desc5,
        score_awarded=score5,
        max_points=300
    ))

    # Evaluate Architectural Synergies
    synergies_detected: List[Dict[str, Any]] = []
    synergy_bonus = 0

    for rule in SYNERGY_RULES:
        is_match = True

        if "required_ids" in rule:
            for req_id in rule["required_ids"]:
                if req_id not in unique_ids:
                    is_match = False
                    break

        if is_match and "required_any_distro" in rule:
            if not any(req_distro in unique_ids for req_distro in rule["required_any_distro"]):
                is_match = False

        if is_match and "required_any_de" in rule:
            if not any(req_de in unique_ids for req_de in rule["required_any_de"]):
                is_match = False

        if is_match and "required_any_init" in rule:
            if not any(req_init in unique_ids for req_init in rule["required_any_init"]):
                is_match = False

        if is_match:
            synergies_detected.append({
                "id": rule["id"],
                "title": rule["title"],
                "description": rule["description"],
                "badge": rule["badge"],
                "bonus_points": rule["bonus_points"]
            })
            synergy_bonus += rule["bonus_points"]

    # Calculate Accuracy Percentage
    # Penalized heavily if hazards are present or crucial layers missing
    accuracy_ratio = arch_score / max_possible_arch
    if hazards:
        accuracy_ratio -= len(hazards) * 0.12
    if not kernel_present:
        accuracy_ratio -= 0.35
    if len(layer2_items) == 0:
        accuracy_ratio -= 0.15
    if len(layer3_items) == 0:
        accuracy_ratio -= 0.15

    accuracy_percentage = max(5.0, min(100.0, round(accuracy_ratio * 100, 1)))

    total_score = max(0, base_item_score + arch_score + synergy_bonus + combo_bonus - hazard_penalty)

    # Determine System Status
    if len(hazards) >= 3 or not kernel_present:
        system_status = "KERNEL_PANIC"
    elif "distro-arch" in unique_ids and "de-hyprland" in unique_ids:
        system_status = "ELITE_RICER"
    elif "distro-nixos" in unique_ids:
        system_status = "DECLARATIVE_BEAST"
    elif "distro-alpine" in unique_ids:
        system_status = "MINIMAL_CONTAINER"
    elif accuracy_percentage >= 85:
        system_status = "ROCK_SOLID"
    elif accuracy_percentage >= 60:
        system_status = "STABLE"
    else:
        system_status = "UNSTABLE"

    # Determine Rank Title
    if system_status == "KERNEL_PANIC":
        rank_title = "Kernel Panic Survivor"
    elif accuracy_percentage >= 95 and total_score >= 3500:
        rank_title = "Grandmaster Linux Architect"
    elif "distro-arch" in unique_ids and "de-hyprland" in unique_ids:
        rank_title = "Supreme Unix Ricer"
    elif "distro-nixos" in unique_ids:
        rank_title = "Declarative Nix Overlord"
    elif accuracy_percentage >= 85:
        rank_title = "Senior Linux Systems Engineer"
    elif accuracy_percentage >= 70:
        rank_title = "Certified SysAdmin"
    elif len(unique_distros) >= 3:
        rank_title = "Compulsive Distro Hopper"
    else:
        rank_title = "Kernel Explorer"

    # Generate Linux Boot Log (simulated dmesg / journalctl)
    boot_log: List[str] = [
        "[  0.000000] Booting Linux on bare-metal snow glacier...",
        f"[  0.004120] Linux version 6.12.0-tuxfall (tux@snowdrop) (gcc 14.2) #1 SMP PREEMPT_DYNAMIC",
        f"[  0.012543] Command line: BOOT_IMAGE=/vmlinuz-linux root=UUID=7f8b2c45 ro quiet splash",
    ]

    if layer1_items:
        for it in layer1_items:
            boot_log.append(f"[  0.045192] kernel: [OK] Initialized subsystem: {it.name}")
    else:
        boot_log.append("[  0.045192] kernel: [EMERGENCY] No kernel modules detected! Running minimal firmware stub.")

    if hazards:
        for haz in hazards:
            boot_log.append(f"[  0.089214] kernel: [CORRUPT] Alien signature detected: {haz.name}! Address space poisoned.")

    if layer2_items:
        init_name = layer2_items[0].name
        boot_log.append(f"[  0.152431] system: Reached target Basic System. Handing over to {init_name} [PID 1].")
    else:
        boot_log.append("[  0.152431] system: [WARNING] No init daemon. Falling back to single-user /bin/sh shell.")

    if layer3_items:
        boot_log.append(f"[  0.280145] distro: Mounting rootfs with {layer3_items[0].name} system tree.")

    if layer4_items:
        boot_log.append(f"[  0.412980] display: Graphical target initialized -> {', '.join([it.name for it in layer4_items])}")
    else:
        boot_log.append("[  0.412980] display: Multi-user target reached (Headless TTY virtual console /dev/tty1).")

    if layer5_items:
        boot_log.append(f"[  0.550124] userland: Loaded user profile for 'tux'. Shell & tools ready: {', '.join([it.name for it in layer5_items[:4]])}")

    boot_log.append(f"[  0.620000] system: Architecture Status = {system_status} (Accuracy: {accuracy_percentage}% | Score: {total_score})")

    result_id = str(uuid.uuid4())[:8]
    created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

    return EvaluationResult(
        id=result_id,
        player_name=request.player_name or "TuxExplorer",
        base_item_score=base_item_score,
        architecture_score=arch_score,
        synergy_bonus=synergy_bonus,
        hazard_penalty=hazard_penalty,
        combo_bonus=combo_bonus,
        total_score=total_score,
        accuracy_percentage=accuracy_percentage,
        rank_title=rank_title,
        system_status=system_status,
        architecture_layers=architecture_layers,
        synergies=synergies_detected,
        warnings_and_conflicts=warnings_and_conflicts,
        hazards_caught=hazards_caught,
        boot_log=boot_log,
        created_at=created_at
    )
