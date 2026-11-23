'use client';

import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '@/types/game';
import { getApiUrl } from '@/lib/api';
import { Trophy, X, RefreshCw, Award, Shield, User } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/leaderboard'));
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      } else {
        // Fallback local high scores
        setEntries([
          {
            id: 'seed-1',
            player_name: 'LinusTux',
            total_score: 4850,
            accuracy_percentage: 98.5,
            rank_title: 'Grandmaster Linux Architect',
            distro: 'Debian GNU/Linux',
            desktop_env: 'GNOME 47',
            system_status: 'ROCK_SOLID',
            created_at: '2026-11-20T12:00:00Z',
          },
          {
            id: 'seed-2',
            player_name: 'ArchBoi42',
            total_score: 4420,
            accuracy_percentage: 95.0,
            rank_title: 'Supreme Unix Ricer',
            distro: 'Arch Linux',
            desktop_env: 'Hyprland',
            system_status: 'ELITE_RICER',
            created_at: '2026-11-21T14:30:00Z',
          },
          {
            id: 'seed-3',
            player_name: 'NixSnowFlake',
            total_score: 4180,
            accuracy_percentage: 96.2,
            rank_title: 'Declarative Nix Overlord',
            distro: 'NixOS',
            desktop_env: 'Sway',
            system_status: 'DECLARATIVE_BEAST',
            created_at: '2026-11-22T09:15:00Z',
          },
        ]);
      }
    } catch {
      // Local fallback
      setEntries([
        {
          id: 'seed-1',
          player_name: 'LinusTux',
          total_score: 4850,
          accuracy_percentage: 98.5,
          rank_title: 'Grandmaster Linux Architect',
          distro: 'Debian GNU/Linux',
          desktop_env: 'GNOME 47',
          system_status: 'ROCK_SOLID',
          created_at: '2026-11-20T12:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono text-white">SysAdmin Hall of Fame</h2>
              <p className="text-xs text-slate-400">Top synthesized Linux architectures and skyfall records</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="p-5 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-mono text-xs">
              No flight records found. Be the first to build a Linux architecture!
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {entries.map((entry, index) => {
                const isTop3 = index < 3;
                return (
                  <div
                    key={entry.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition ${
                      index === 0
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : index === 1
                        ? 'bg-slate-800/80 border-slate-600'
                        : index === 2
                        ? 'bg-amber-900/20 border-amber-700/40'
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                        index === 0
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40'
                          : index === 1
                          ? 'bg-slate-300 text-slate-950'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        #{index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-white">
                            {entry.player_name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {entry.distro} + {entry.desktop_env}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-400 mt-0.5 block">
                          {entry.rank_title}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="font-mono font-extrabold text-base text-cyan-300">
                        {entry.total_score.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                      </span>
                      <span className="text-xs font-mono text-emerald-400">
                        {entry.accuracy_percentage}% Accuracy
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
