import React from 'react';
import {
  MovementDefinition,
  BiomechanicalSummary,
} from '../../types/biomechanics';
import { NERVE_PALSY_PRESETS } from '../../data/jointsData';

interface WeaknessTabProps {
  movement: MovementDefinition;
  muscleStrengthFactors: Record<string, number>;
  setMuscleStrengthFactors: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  biomechanics: BiomechanicalSummary;
}

export const WeaknessTab: React.FC<WeaknessTabProps> = ({
  movement,
  muscleStrengthFactors,
  setMuscleStrengthFactors,
  biomechanics,
}) => {
  const handlePresetSelect = (presetId: string) => {
    const preset = NERVE_PALSY_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setMuscleStrengthFactors(preset.weakenedMuscles);
  };

  const handleSliderChange = (muscleId: string, val: number) => {
    setMuscleStrengthFactors((prev) => ({
      ...prev,
      [muscleId]: val / 100,
    }));
  };

  const handleReset = () => {
    setMuscleStrengthFactors({});
  };

  return (
    <div className="space-y-4 text-slate-100 text-sm">
      {/* Educational Notice Banner */}
      <div className="bg-amber-950/40 border border-amber-600/70 p-2.5 rounded text-xs text-amber-200">
        <strong>Teaching Simulation Notice:</strong> This pathological simulation models motor unit loss for biomechanical education only, not for clinical diagnosis or prognosis in living patients.
      </div>

      {/* Torque Deficit Warning Banner */}
      {biomechanics.isCapacityExceeded && (
        <div className="bg-red-950/80 border-2 border-red-500 p-3 rounded-md text-red-200 space-y-1 animate-pulse">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
            </svg>
            <strong className="text-sm font-bold text-red-300">
              Biomechanical Failure: Torque Deficit ({biomechanics.capacityDeficitNm.toFixed(1)} N·m)
            </strong>
          </div>
          <p className="text-xs">
            Remaining active muscles lack sufficient isometric torque capacity to overcome external gravitational torque and held load at this angle. The limb would drop without external support!
          </p>
        </div>
      )}

      {/* Nerve Palsy Presets */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide">
            Clinical Nerve Palsy Presets
          </span>
          <button
            onClick={handleReset}
            className="text-[11px] text-[#20b2aa] hover:underline cursor-pointer"
          >
            Reset All to 100%
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {NERVE_PALSY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              className="text-left p-2 rounded bg-[#070e22] hover:bg-[#132247] border border-slate-800 hover:border-teal-500 transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-slate-200">{preset.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Individual Muscle Strength Sliders */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 space-y-3">
        <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide block">
          Individual Muscle Contractility & Strength
        </span>
        <p className="text-xs text-slate-300">
          Reduce strength or toggle off individual synergists to witness real-time quadratic force redistribution:
        </p>

        {movement.muscles.map((muscle) => {
          const currentFactor = muscleStrengthFactors[muscle.id] !== undefined
            ? muscleStrengthFactors[muscle.id]
            : 1.0;
          const percent = Math.round(currentFactor * 100);
          const isParalyzed = percent === 0;

          return (
            <div key={muscle.id} className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{muscle.name}</span>
                  <span className="text-[10px] text-slate-400 ml-1.5">({muscle.role})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs font-bold ${isParalyzed ? 'text-red-400' : 'text-teal-300'}`}>
                    {percent}%
                  </span>
                  <button
                    onClick={() => handleSliderChange(muscle.id, isParalyzed ? 100 : 0)}
                    className={`text-[10px] px-2 py-0.5 rounded cursor-pointer font-semibold ${
                      isParalyzed ? 'bg-red-900 text-red-200' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isParalyzed ? 'Turn On' : 'Paralyze (0%)'}
                  </button>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={percent}
                onChange={(e) => handleSliderChange(muscle.id, parseInt(e.target.value))}
                className="w-full accent-[#20b2aa] cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0% (Denervated)</span>
                <span>Fmax: {(muscle.peakForceN * currentFactor).toFixed(0)} N / {muscle.peakForceN} N</span>
                <span>100% (Normal)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
