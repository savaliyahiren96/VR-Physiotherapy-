import React, { useState } from 'react';
import {
  JointDefinition,
  MovementDefinition,
  SoftTissueCalculatedState,
} from '../../types/biomechanics';
import {
  calculateSoftTissueStates,
  generateSoftTissueDegreeCurve,
  getImpingementZones,
} from '../../utils/softTissueEngine';

interface SoftTissueTabProps {
  joint: JointDefinition;
  movement: MovementDefinition;
  angleDeg: number;
  onSelectSoftTissue?: (tissueId: string) => void;
  selectedSoftTissueId?: string | null;
}

export const SoftTissueTab: React.FC<SoftTissueTabProps> = ({
  joint,
  movement,
  angleDeg,
  onSelectSoftTissue,
  selectedSoftTissueId,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedTissueForChart, setSelectedTissueForChart] = useState<string>('');

  // Calculate live states for current angle
  const calculatedStates: SoftTissueCalculatedState[] = calculateSoftTissueStates(
    joint.id,
    movement.id,
    angleDeg
  );

  // Impingement zones for current movement
  const impingementZones = getImpingementZones(joint.id, movement.id);
  const activeZone = impingementZones.find(
    (z) => angleDeg >= z.startDeg && angleDeg <= z.endDeg
  );

  // Filtered list
  const filteredTissues = calculatedStates.filter((cs) => {
    if (filterType === 'all') return true;
    return cs.tissue.type === filterType;
  });

  const activeChartTissueId = selectedTissueForChart || (filteredTissues[0]?.tissue.id ?? '');
  const activeChartTissue = calculatedStates.find((cs) => cs.tissue.id === activeChartTissueId)?.tissue;
  const degreeCurve = activeChartTissue
    ? generateSoftTissueDegreeCurve(joint.id, movement, activeChartTissue.id)
    : [];

  return (
    <div className="flex flex-col gap-3 font-serif text-slate-100">
      {/* Header & Impingement Alert Banner */}
      <div className="bg-[#0b1633] p-3 rounded-lg border border-teal-500/40 shadow flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧬</span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#fbbf24] tracking-wide">
                Non-Contractile Soft Tissue & Ligament Kinematics
              </h2>
              <p className="text-[11px] text-slate-300 font-sans">
                Ligaments, Joint Capsules, Labra, Menisci, Bursae & Neural Tract Strain at {angleDeg}°
              </p>
            </div>
          </div>

          <div className="text-right font-sans">
            <span className="text-xs text-slate-400">Current ROM:</span>
            <span className="text-base font-bold text-[#fbbf24] font-mono ml-1.5">{angleDeg}°</span>
          </div>
        </div>

        {/* Dynamic Impingement / Vulnerability Zone Alert */}
        {activeZone ? (
          <div className="p-2.5 rounded bg-red-950/70 border border-red-500/80 text-xs font-sans flex items-start gap-2 shadow-inner">
            <span className="text-base text-red-400 font-bold">⚠</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-300 uppercase tracking-wide">
                  Active Clinical Zone: {activeZone.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-900 text-red-100 font-mono">
                  {activeZone.rangeText}
                </span>
              </div>
              <p className="text-red-200/90 text-[11px] mt-0.5 leading-snug">
                {activeZone.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2 rounded bg-[#071126] border border-teal-500/30 text-[11px] font-sans text-teal-300 flex items-center justify-between">
            <span>✔ Joint is operating outside acute impingement painful arcs at {angleDeg}°.</span>
            <span className="text-slate-400 font-mono">Normal Capsuloligamentous Kinematics</span>
          </div>
        )}
      </div>

      {/* Filter Tabs by Soft Tissue Type */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-sans text-xs pb-0.5">
        {[
          { key: 'all', label: 'All Soft Tissues' },
          { key: 'ligament', label: 'Ligaments' },
          { key: 'meniscus', label: 'Menisci & Cartilage' },
          { key: 'fibrocartilage_labrum', label: 'Labrum' },
          { key: 'bursa', label: 'Bursae' },
          { key: 'nerve_tract', label: 'Nerve Tracts' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer whitespace-nowrap font-semibold border ${
              filterType === tab.key
                ? 'bg-[#20b2aa] text-[#0b132b] font-bold border-[#fbbf24] shadow'
                : 'bg-[#101b38] text-slate-300 border-slate-700 hover:bg-[#182852]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Live Per-Degree Soft Tissue Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-sans">
        {filteredTissues.map((cs) => {
          const isSelected = selectedSoftTissueId === cs.tissue.id || activeChartTissueId === cs.tissue.id;
          return (
            <div
              key={cs.tissue.id}
              onClick={() => {
                setSelectedTissueForChart(cs.tissue.id);
                onSelectSoftTissue?.(cs.tissue.id);
              }}
              className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-[#12244a] to-[#0c1836] border-[#fbbf24] shadow-md ring-1 ring-amber-400/40'
                  : 'bg-[#0a142e] border-slate-700/70 hover:border-teal-500/60 hover:bg-[#0e1c3e]'
              }`}
            >
              <div>
                {/* Header: Name and State Badge */}
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-100 leading-tight">
                      {cs.tissue.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono capitalize">
                      {cs.tissue.type.replace('_', ' ')}
                    </span>
                  </div>

                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-bold font-mono whitespace-nowrap border"
                    style={{
                      color: cs.colorHex,
                      borderColor: `${cs.colorHex}66`,
                      backgroundColor: `${cs.colorHex}15`,
                    }}
                  >
                    ● {cs.state}
                  </span>
                </div>

                {/* Strain Progress Bar */}
                <div className="my-2 bg-[#070e20] p-2 rounded border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-semibold">Tensile Strain at {angleDeg}°:</span>
                    <span className="font-mono font-bold" style={{ color: cs.colorHex }}>
                      {cs.strainPercent}%{' '}
                      <span className="text-[10px] text-slate-400">/ max {cs.tissue.maxPhysiologicalStrainPercent}%</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-200"
                      style={{
                        width: `${Math.min(100, (cs.strainPercent / cs.tissue.maxPhysiologicalStrainPercent) * 100)}%`,
                        backgroundColor: cs.colorHex,
                      }}
                    ></div>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Slack (0%)</span>
                    <span>Restraint Contribution: <strong className="text-teal-300 font-mono">{cs.biomechanicalRestraintShare}%</strong></span>
                    <span>Max ({cs.tissue.maxPhysiologicalStrainPercent}%)</span>
                  </div>
                </div>

                {/* Dynamic Tension Description at this exact degree */}
                <p className="text-[11px] text-slate-300 leading-snug mb-2 italic">
                  "{cs.tensionDescription}"
                </p>
              </div>

              {/* Bottom Clinical Metadata & Tests */}
              <div className="pt-2 border-t border-slate-700/60 flex flex-col gap-1 text-[10px]">
                <div className="text-slate-300">
                  <strong className="text-teal-300">Orthopedic Tests:</strong>{' '}
                  {cs.tissue.clinicalTests.join(' • ')}
                </div>
                <div className="text-slate-400">
                  <strong className="text-amber-300">Injury Mechanism:</strong> {cs.tissue.injuryMechanism}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Strain vs Joint Angle Curve */}
      {activeChartTissue && (
        <div className="bg-[#0b1429] p-3 rounded-lg border border-teal-500/40 flex flex-col gap-2 font-sans">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#fbbf24]">
                Strain Curve Across Range: <span className="text-teal-300">{activeChartTissue.name}</span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Visualizing tensile strain (%) vs. Joint Angle (θ) from {movement.minAngle}° to {movement.maxAngle}°
              </p>
            </div>

            <select
              value={activeChartTissue.id}
              onChange={(e) => setSelectedTissueForChart(e.target.value)}
              className="bg-[#122247] text-amber-200 font-bold border border-teal-500/50 rounded px-2 py-0.5 text-xs cursor-pointer focus:outline-none"
            >
              {calculatedStates.map((cs) => (
                <option key={cs.tissue.id} value={cs.tissue.id}>
                  {cs.tissue.name}
                </option>
              ))}
            </select>
          </div>

          {/* SVG Range Curve */}
          <div className="relative w-full h-44 bg-[#070e20] rounded border border-slate-800 p-2 select-none">
            {(() => {
              const width = 600;
              const height = 150;
              const minAngle = movement.minAngle;
              const maxAngle = movement.maxAngle;
              const angleSpan = maxAngle - minAngle || 1;
              const maxStrain = Math.max(10, activeChartTissue.maxPhysiologicalStrainPercent * 1.25);

              // Map points to SVG coordinates
              const points = degreeCurve.map((pt) => {
                const x = ((pt.degree - minAngle) / angleSpan) * (width - 60) + 40;
                const y = height - 25 - (pt.strainPercent / maxStrain) * (height - 45);
                return `${x},${y}`;
              });

              // Current angle x position
              const currentX = ((angleDeg - minAngle) / angleSpan) * (width - 60) + 40;
              const currentY = height - 25 - (
                (calculatedStates.find((cs) => cs.tissue.id === activeChartTissue.id)?.strainPercent ?? 0) / maxStrain
              ) * (height - 45);

              return (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                  {/* Grid lines */}
                  <line x1="40" y1="15" x2={width - 20} y2="15" stroke="#334155" strokeDasharray="3 3" />
                  <line x1="40" y1="65" x2={width - 20} y2="65" stroke="#334155" strokeDasharray="3 3" />
                  <line x1="40" y1={height - 25} x2={width - 20} y2={height - 25} stroke="#64748b" />
                  <line x1="40" y1="10" x2="40" y2={height - 25} stroke="#64748b" />

                  {/* Y Axis Labels */}
                  <text x="35" y="20" fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {Math.round(maxStrain)}%
                  </text>
                  <text x="35" y="70" fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {Math.round(maxStrain / 2)}%
                  </text>
                  <text x="35" y={height - 23} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">
                    0%
                  </text>

                  {/* Physiological Failure Line */}
                  <line
                    x1="40"
                    y1={height - 25 - (activeChartTissue.maxPhysiologicalStrainPercent / maxStrain) * (height - 45)}
                    x2={width - 20}
                    y2={height - 25 - (activeChartTissue.maxPhysiologicalStrainPercent / maxStrain) * (height - 45)}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                  />
                  <text
                    x={width - 25}
                    y={height - 29 - (activeChartTissue.maxPhysiologicalStrainPercent / maxStrain) * (height - 45)}
                    fill="#ef4444"
                    fontSize="9"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    Max Strain ({activeChartTissue.maxPhysiologicalStrainPercent}%)
                  </text>

                  {/* X Axis Labels */}
                  <text x="40" y={height - 8} fill="#94a3b8" fontSize="10" textAnchor="start" fontFamily="monospace">
                    {minAngle}°
                  </text>
                  <text x={width - 20} y={height - 8} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {maxAngle}°
                  </text>

                  {/* Strain Curve Line */}
                  <polyline
                    fill="none"
                    stroke="#20b2aa"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points.join(' ')}
                  />

                  {/* Current Angle Indicator Vertical Line */}
                  <line
                    x1={currentX}
                    y1="10"
                    x2={currentX}
                    y2={height - 25}
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                  />

                  {/* Current Point Dot */}
                  <circle cx={currentX} cy={currentY} r="5" fill="#fbbf24" stroke="#0b1429" strokeWidth="2" />
                </svg>
              );
            })()}
          </div>

          {/* Legend and Interpretation */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-300 pt-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]"></span> Slack (&lt;1.5%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6]"></span> Low Tension
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> Moderately Taut
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span> Impinged / Failure Risk (&gt;7.5%)
              </span>
            </div>
            <span className="text-[#fbbf24] font-mono">
              Current: {angleDeg}° • {calculatedStates.find((cs) => cs.tissue.id === activeChartTissue.id)?.strainPercent}% Strain
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
