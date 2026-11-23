import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from models import LeaderboardEntry, EvaluationResult

DB_PATH = os.path.join(os.path.dirname(__file__), "tuxfall.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leaderboard (
            id TEXT PRIMARY KEY,
            player_name TEXT NOT NULL,
            total_score INTEGER NOT NULL,
            accuracy_percentage REAL NOT NULL,
            rank_title TEXT NOT NULL,
            distro TEXT NOT NULL,
            desktop_env TEXT NOT NULL,
            system_status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS runs (
            id TEXT PRIMARY KEY,
            player_name TEXT NOT NULL,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()

    # Seed sample records if empty
    cursor.execute("SELECT COUNT(*) FROM leaderboard")
    count = cursor.fetchone()[0]
    if count == 0:
        sample_entries = [
            ("seed-1", "LinusTux", 4850, 98.5, "Grandmaster Linux Architect", "Debian GNU/Linux", "GNOME 47", "ROCK_SOLID", "2026-11-20T12:00:00Z"),
            ("seed-2", "ArchBoi42", 4420, 95.0, "Supreme Unix Ricer", "Arch Linux", "Hyprland", "ELITE_RICER", "2026-11-21T14:30:00Z"),
            ("seed-3", "NixSnowFlake", 4180, 96.2, "Declarative Nix Overlord", "NixOS", "Sway", "DECLARATIVE_BEAST", "2026-11-22T09:15:00Z"),
            ("seed-4", "AlpineMicro", 3650, 91.0, "Senior Linux Systems Engineer", "Alpine Linux", "Headless TTY", "MINIMAL_CONTAINER", "2026-11-22T19:40:00Z"),
            ("seed-5", "PenguinPilot", 2890, 78.4, "Certified SysAdmin", "Fedora Workstation", "KDE Plasma 6", "STABLE", "2026-11-23T11:00:00Z"),
        ]
        cursor.executemany("""
            INSERT INTO leaderboard (id, player_name, total_score, accuracy_percentage, rank_title, distro, desktop_env, system_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_entries)
        conn.commit()
    conn.close()

def save_run(result: EvaluationResult):
    conn = get_connection()
    cursor = conn.cursor()

    # Extract primary distro and DE
    distro_layer = next((l for l in result.architecture_layers if l.layer_level == 3), None)
    distro_name = distro_layer.chosen_items[0] if distro_layer and distro_layer.chosen_items else "Custom / None"

    de_layer = next((l for l in result.architecture_layers if l.layer_level == 4), None)
    de_name = de_layer.chosen_items[0] if de_layer and de_layer.chosen_items else "Headless"

    cursor.execute("""
        INSERT INTO leaderboard (id, player_name, total_score, accuracy_percentage, rank_title, distro, desktop_env, system_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        result.id,
        result.player_name,
        result.total_score,
        result.accuracy_percentage,
        result.rank_title,
        distro_name,
        de_name,
        result.system_status,
        result.created_at
    ))

    cursor.execute("""
        INSERT INTO runs (id, player_name, data_json, created_at)
        VALUES (?, ?, ?, ?)
    """, (
        result.id,
        result.player_name,
        result.model_dump_json(),
        result.created_at
    ))

    conn.commit()
    conn.close()

def get_leaderboard(limit: int = 20) -> List[LeaderboardEntry]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, player_name, total_score, accuracy_percentage, rank_title, distro, desktop_env, system_status, created_at
        FROM leaderboard
        ORDER BY total_score DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [
        LeaderboardEntry(
            id=row["id"],
            player_name=row["player_name"],
            total_score=row["total_score"],
            accuracy_percentage=row["accuracy_percentage"],
            rank_title=row["rank_title"],
            distro=row["distro"],
            desktop_env=row["desktop_env"],
            system_status=row["system_status"],
            created_at=row["created_at"]
        )
        for row in rows
    ]

def get_run_details(run_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM runs WHERE id = ?", (run_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return json.loads(row["data_json"])
    return None
