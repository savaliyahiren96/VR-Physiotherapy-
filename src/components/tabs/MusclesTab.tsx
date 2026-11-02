import React, { useState } from 'react';
import {
  MovementDefinition,
  BiomechanicalSummary,
} from '../../types/biomechanics';
import { calculateBiomechanics } from '../../utils/biomechanicsEngine';

interface MusclesTabProps {
  jointId: any;
  movement: MovementDefinition;
  angleDeg: number;
  biomechanics: BiomechanicalSummary;
  selectedMuscleId: string | null;
  onSelectMuscle: (muscleId: string) => void;
  bodyMassKg: number;
  loadKg: number;
  extraResistanceNm: number;
  contractionMode: any;
  patientPosition: any;
  muscleStrengthFactors: Record<string, number>;
}

export const MusclesTab: React.FC<MusclesTabProps> = ({
  jointId,
  movement,
  angleDeg,
  biomechanics,
  selectedMuscleId,
  onSelectMuscle,
  bodyMassKg,
  loadKg,
  extraResistanceNm,
  contractionMode,
  patientPosition,
  muscleStrengthFactors,
}) => {
  const [showFullDegreeTable, setShowFullDegreeTable] = useState<boolean>(false);
  const [degreeStep, setDegreeStep] = useState<number>(5); // default step for inspection table

  // Precalculate involvement heatmap across range (in 5° steps)
  const heatmapSteps: { angle: number; muscles: { id: string; effort: number }[] }[] = [];
  for (let a = movement.minAngle; a <= movement.maxAngle; a += 5) {
    const res = calculateBiomechanics({
      jointId,
      movement,
      angleDeg: a,
      bodyMassKg,
      loadKg,
      extraResistanceNm,
      contractionMode,
      patientPosition,
      muscleStrengthFactors,
    });
    heatmapSteps.push({
      angle: a,
      muscles: res.muscleCalculations.map((m) => ({ id: m.muscle.id, effort: m.effortPercent })),
    });
  }

  // Precalculate degree-by-degree rows for the inspection table
  const tableRows: {
    angle: number;
    torque: number;
    muscles: { name: string; force: number; share: number; arm: number }[];
  }[] = [];

  const rowStep = showFullDegreeTable ? 1 : degreeStep;
  const maxTableRows = showFullDegreeTable ? movement.maxAngle - movement.minAngle + 1 : 25;

  for (let a = movement.minAngle; a <= movement.maxAngle; a += rowStep) {
    if (tableRows.length >= maxTableRows) break;
    const res = calculateBiomechanics({
      jointId,
      movement,
      angleDeg: a,
      bodyMassKg,
      loadKg,
      extraResistanceNm,
      contractionMode,
      patientPosition,
      muscleStrengthFactors,
    });

    tableRows.push({
      angle: a,
      torque: res.netTorqueNm,
      muscles: res.muscleCalculations.map((c) => ({
        name: c.muscle.name,
        force: c.forceN,
        share: c.sharePercent,
        arm: c.momentArmM * 100,
      })),
    });
  }

  return (
    <div className="space-y-4 text-slate-100 text-sm">
      {/* Crowninshield & Brand Formula Header */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-[#20b2aa]/40">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide">
            Biomechanical Force Sharing (Crowninshield & Brand 1981)
          </span>
          <span className="text-[11px] bg-teal-900/60 text-teal-300 px-2 py-0.5 rounded border border-teal-700">
            Minimising Effort: F = λ · Fmax² · r
          </span>
        </div>
        <div className="text-xs text-slate-300 mt-1">
          Force is partitioned by solving Lagrange multiplier <strong className="text-amber-300">λ = T_net / Σ(Fmax² · r²)</strong>, ensuring all muscle torques add up precisely to required net torque (<strong>{biomechanics.totalMuscleTorqueNm.toFixed(2)} N·m = {biomechanics.netTorqueNm.toFixed(2)} N·m</strong>).
        </div>
      </div>

      {/* Muscle List with Real-time Optimization Values */}
      <div className="space-y-2.5">
        <div className="text-xs uppercase font-bold text-slate-400">
          Muscles Acting in {movement.name} (At {angleDeg}°)
        </div>

        {biomechanics.muscleCalculations.map((item) => {
          const isSelected = selectedMuscleId === item.muscle.id;
          const isPrime = item.muscle.role === 'Prime Mover';

          return (
            <div
              key={item.muscle.id}
              onClick={() => onSelectMuscle(item.muscle.id)}
              className={`p-3 rounded-md border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#12234f] border-[#fbbf24] shadow-md ring-1 ring-[#fbbf24]'
                  : 'bg-[#0b1633] border-slate-700/80 hover:border-teal-500/70 hover:bg-[#0f1d40]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        isPrime ? 'bg-[#20b2aa]/30 text-[#20b2aa] border border-[#20b2aa]/50' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {item.muscle.role}
                    </span>
                    <strong className="text-white text-sm">{item.muscle.name}</strong>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    <span className="text-[#fbbf24]">Nerve:</span> {item.muscle.nerveRoot}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-[#fbbf24]">
                    {item.forceN.toFixed(1)} <span className="text-xs font-normal">N</span>
                  </div>
                  <div className="text-[11px] text-teal-300">
                    {item.sharePercent.toFixed(1)}% of torque
                  </div>
                </div>
              </div>

              {/* Anatomy: Origin & Insertion */}
              <div className="mt-2 text-[11px] bg-[#070e22] p-2 rounded text-slate-300 space-y-0.5 border border-slate-800">
                <div>
                  <strong className="text-slate-400">Origin:</strong> {item.muscle.origin}
                </div>
                <div>
                  <strong className="text-slate-400">Insertion:</strong> {item.muscle.insertion}
                </div>
              </div>

              {/* Moment Arm & Isometric Peak Force Reference */}
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px]">
                <div className="bg-[#132247] p-1.5 rounded">
                  <span className="text-slate-400 block text-[10px]">Tendon Excursion r</span>
                  <span className="font-semibold text-slate-200">{(item.momentArmM * 100).toFixed(2)} cm</span>
                </div>
                <div className="bg-[#132247] p-1.5 rounded">
                  <span className="text-slate-400 block text-[10px]">Fmax (Peak Isometric)</span>
                  <span className="font-semibold text-slate-200">
                    {item.muscle.peakForceN} N {item.muscle.isVerified ? '✓' : '(Est.)'}
                  </span>
                </div>
                <div className="bg-[#132247] p-1.5 rounded">
                  <span className="text-slate-400 block text-[10px]">Effort (% Fmax)</span>
                  <span className={`font-semibold ${item.effortPercent > 80 ? 'text-red-400' : 'text-teal-300'}`}>
                    {item.effortPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Published Source Citation */}
              <div className="mt-1.5 text-[10px] text-slate-400 italic">
                Source: {item.muscle.sourceCitation}
              </div>
            </div>
          );
        })}
      </div>

      {/* Colour Map of Involvement Across the Range */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80">
        <div className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide mb-1">
          Involvement Heatmap Across Range ({movement.minAngle}° to {movement.maxAngle}°)
        </div>
        <div className="text-[11px] text-slate-300 mb-2">
          Muscle effort intensity (0% to 100% of peak isometric capacity) across joint range:
        </div>

        <div className="space-y-2">
          {movement.muscles.map((muscle) => (
            <div key={muscle.id} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-200">{muscle.name}</span>
                <span className="text-slate-400 text-[10px]">{muscle.role}</span>
              </div>
              <div className="grid grid-cols-12 gap-0.5 h-4 bg-slate-900 rounded overflow-hidden">
                {heatmapSteps.slice(0, 12).map((step, idx) => {
                  const mEff = step.muscles.find((m) => m.id === muscle.id)?.effort || 0;
                  // Color scale: Teal (low effort) -> Amber -> Red (high effort)
                  const hue = Math.max(0, 160 - (mEff / 100) * 160);
                  const bg = `hsl(${hue}, 85%, ${mEff > 5 ? '40%' : '18%'})`;
                  return (
                    <div
                      key={idx}
                      style={{ backgroundColor: bg }}
                      title={`${step.angle}°: ${mEff.toFixed(1)}% effort`}
                      className="h-full flex items-center justify-center text-[8px] text-white font-mono"
                    >
                      {mEff > 40 ? `${Math.round(mEff)}` : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>{movement.minAngle}°</span>
          <span>Joint Angle</span>
          <span>{movement.maxAngle}°</span>
        </div>
      </div>

      {/* Degree-by-Degree Table */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide">
            Degree-by-Degree Biomechanics Table
          </span>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowFullDegreeTable(!showFullDegreeTable)}
              className="text-xs px-2 py-0.5 bg-[#132247] hover:bg-[#1a2d5e] text-teal-300 rounded border border-teal-600/50 cursor-pointer"
            >
              {showFullDegreeTable ? 'Show 5° Step Table' : 'Show 1° Interval Table'}
            </button>
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto border border-slate-700 rounded">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#070e22] text-[#fbbf24] sticky top-0 border-b border-slate-700 text-[10px] uppercase">
              <tr>
                <th className="p-1.5">Angle</th>
                <th className="p-1.5">Net Torque</th>
                {movement.muscles.map((m) => (
                  <th key={m.id} className="p-1.5">{m.name.split(' ')[0]} Force</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-[11px]">
              {tableRows.map((row) => {
                const isCurrent = Math.abs(row.angle - angleDeg) < 1;
                return (
                  <tr
                    key={row.angle}
                    className={isCurrent ? 'bg-[#20b2aa]/25 font-bold text-white' : 'hover:bg-slate-800/40 text-slate-200'}
                  >
                    <td className="p-1.5 text-amber-300">{row.angle}°</td>
                    <td className="p-1.5">{row.torque.toFixed(2)} N·m</td>
                    {row.muscles.map((m, idx) => (
                      <td key={idx} className="p-1.5">
                        {m.force.toFixed(1)} N <span className="text-[10px] text-slate-400">({m.share.toFixed(0)}%)</span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
