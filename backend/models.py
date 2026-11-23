from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class LayerCategory(str, Enum):
    KERNEL_ARCH = "kernel_arch"
    INIT_SYSTEM = "init_system"
    DISTRO = "distro"
    WINDOW_DE = "window_de"
    CORE_TOOLS = "core_tools"
    HAZARD = "hazard"

class LinuxComponent(BaseModel):
    id: str
    name: str
    category: LayerCategory
    layer_level: int  # 1: Kernel & HW, 2: Init, 3: Distro, 4: Window/DE, 5: Core Tools, -1: Hazard
    layer_name: str
    description: str
    tag: str
    points: int
    rarity: str = "common"  # common, rare, legendary, hazard
    color: str
    icon: str
    synergy_tags: List[str] = []

class CapturedItemInput(BaseModel):
    id: str
    name: str
    category: str
    layer_level: int
    captured_at_altitude: float
    points: int

class EvaluationRequest(BaseModel):
    player_name: str = "TuxExplorer"
    captured_items: List[CapturedItemInput]
    survival_time_sec: float
    max_combo: int = 0
    final_altitude: float = 0.0

class ArchitectureSlot(BaseModel):
    layer_level: int
    layer_name: str
    is_fulfilled: bool
    status: str  # "OPTIMAL", "MISSING", "CONFLICT", "SUBOPTIMAL", "SURPLUS"
    chosen_items: List[str]
    description: str
    score_awarded: int
    max_points: int

class EvaluationResult(BaseModel):
    id: str
    player_name: str
    base_item_score: int
    architecture_score: int
    synergy_bonus: int
    hazard_penalty: int
    combo_bonus: int
    total_score: int
    accuracy_percentage: float
    rank_title: str
    system_status: str  # "ROCK_SOLID", "ELITE_RICER", "DECLARATIVE_BEAST", "MINIMAL_CONTAINER", "UNSTABLE", "KERNEL_PANIC"
    architecture_layers: List[ArchitectureSlot]
    synergies: List[Dict[str, Any]]
    warnings_and_conflicts: List[str]
    hazards_caught: List[str]
    boot_log: List[str]
    created_at: str

class LeaderboardEntry(BaseModel):
    id: str
    player_name: str
    total_score: int
    accuracy_percentage: float
    rank_title: str
    distro: str
    desktop_env: str
    system_status: str
    created_at: str
