export type LayerCategory =
  | 'kernel_arch'
  | 'init_system'
  | 'distro'
  | 'window_de'
  | 'core_tools'
  | 'hazard';

export interface LinuxComponent {
  id: string;
  name: string;
  category: LayerCategory;
  layer_level: number;
  layer_name: string;
  description: string;
  tag: string;
  points: number;
  rarity: 'common' | 'rare' | 'legendary' | 'hazard';
  color: string;
  icon: string;
  synergy_tags: string[];
}

export interface CapturedItem {
  id: string;
  name: string;
  category: LayerCategory;
  layer_level: number;
  captured_at_altitude: number;
  points: number;
  color: string;
}

export interface ArchitectureSlot {
  layer_level: number;
  layer_name: string;
  is_fulfilled: boolean;
  status: 'OPTIMAL' | 'MISSING' | 'CONFLICT' | 'SUBOPTIMAL' | 'SURPLUS';
  chosen_items: string[];
  description: string;
  score_awarded: number;
  max_points: number;
}

export interface SynergyItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  bonus_points: number;
}

export interface EvaluationResult {
  id: string;
  player_name: string;
  base_item_score: number;
  architecture_score: number;
  synergy_bonus: number;
  hazard_penalty: number;
  combo_bonus: number;
  total_score: number;
  accuracy_percentage: number;
  rank_title: string;
  system_status: 'ROCK_SOLID' | 'ELITE_RICER' | 'DECLARATIVE_BEAST' | 'MINIMAL_CONTAINER' | 'STABLE' | 'UNSTABLE' | 'KERNEL_PANIC';
  architecture_layers: ArchitectureSlot[];
  synergies: SynergyItem[];
  warnings_and_conflicts: string[];
  hazards_caught: string[];
  boot_log: string[];
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  total_score: number;
  accuracy_percentage: number;
  rank_title: string;
  distro: string;
  desktop_env: string;
  system_status: string;
  created_at: string;
}

export type GameStatus = 'MENU' | 'PLAYING' | 'LANDED' | 'EVALUATING' | 'RESULT' | 'LEADERBOARD' | 'CODEX';
