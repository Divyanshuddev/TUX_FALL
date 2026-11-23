'use client';

import React, { useState } from 'react';
import { LinuxComponent } from '@/types/game';
import { FALLBACK_LINUX_ITEMS } from '@/lib/constants';
import {
  X,
  Search,
  Cpu,
  Layers,
  Compass,
  Monitor,
  Terminal,
  AlertTriangle,
  Info
} from 'lucide-react';

interface CodexModalProps {
  items: LinuxComponent[];
  isOpen: boolean;
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({
  items = FALLBACK_LINUX_ITEMS,
  isOpen,
  onClose,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  if (!isOpen) return null;

  const catalog = items.length > 0 ? items : FALLBACK_LINUX_ITEMS;

  const filteredItems = catalog.filter((item) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'kernel' && item.layer_level === 1) ||
      (filter === 'init' && item.layer_level === 2) ||
      (filter === 'distro' && item.layer_level === 3) ||
      (filter === 'display' && item.layer_level === 4) ||
      (filter === 'tools' && item.layer_level === 5) ||
      (filter === 'hazards' && item.category === 'hazard');

    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.tag.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono text-white">Linux Architecture Manual & Codex</h2>
              <p className="text-xs text-slate-400">All components available during Tux's skyfall descent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar and search */}
        <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-950/40">
          {/* Category filter tabs */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'kernel', label: '1: Kernel & HW' },
              { id: 'init', label: '2: Init Daemons' },
              { id: 'distro', label: '3: Distros' },
              { id: 'display', label: '4: Display & DE' },
              { id: 'tools', label: '5: Core Tools' },
              { id: 'hazards', label: 'Hazards' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                  filter === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search components..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Component cards list */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const isHazard = item.category === 'hazard';
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition ${
                  isHazard
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <h3 className="font-mono text-sm font-bold text-white">{item.name}</h3>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      isHazard
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {item.points > 0 ? `+${item.points}` : item.points} PTS
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                    {item.layer_name}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">[{item.tag}]</span>
                </div>

                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
