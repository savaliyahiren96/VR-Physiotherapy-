import React from 'react';
import { MovementDefinition } from '../../types/biomechanics';

interface GoniometryTabProps {
  movement: MovementDefinition;
  showLandmarks: boolean;
  setShowLandmarks: (show: boolean) => void;
}

export const GoniometryTab: React.FC<GoniometryTabProps> = ({
  movement,
  showLandmarks,
  setShowLandmarks,
}) => {
  const goni = movement.goniometry;

  return (
    <div className="space-y-4 text-slate-100 text-sm">
      {/* 3D Landmarks Toggle Banner */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-[#fbbf24]/50 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide block">
            3D Anatomical Landmarks Overlay
          </span>
          <p className="text-xs text-slate-300 mt-0.5">
            Visualize bony fulcrum and palpation reference points directly on the 3D model
          </p>
        </div>
        <button
          onClick={() => setShowLandmarks(!showLandmarks)}
          className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors cursor-pointer ${
            showLandmarks
              ? 'bg-[#fbbf24] text-[#0b132b] border-[#d4af37] shadow'
              : 'bg-[#132247] text-slate-200 border-slate-700 hover:bg-[#1a2d5e]'
          }`}
        >
          {showLandmarks ? 'Hide Landmarks' : 'Highlight in 3D'}
        </button>
      </div>

      {/* Goniometer Placement Guide */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 space-y-2.5">
        <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide block">
          Clinical Goniometry Alignment (Norkin & White / AAOS)
        </span>

        <div className="space-y-2 text-xs">
          <div className="bg-[#070e22] p-2.5 rounded border border-slate-800">
            <strong className="text-[#fbbf24] block mb-0.5">Fulcrum (Axis of Goniometer):</strong>
            <p className="text-slate-200">{goni.fulcrum}</p>
          </div>

          <div className="bg-[#070e22] p-2.5 rounded border border-slate-800">
            <strong className="text-[#20b2aa] block mb-0.5">Stationary Arm:</strong>
            <p className="text-slate-200">{goni.stationaryArm}</p>
          </div>

          <div className="bg-[#070e22] p-2.5 rounded border border-slate-800">
            <strong className="text-[#20b2aa] block mb-0.5">Moving Arm:</strong>
            <p className="text-slate-200">{goni.movingArm}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#070e22] p-2 rounded border border-slate-800">
              <strong className="text-slate-400 block text-[10px]">Patient Test Position:</strong>
              <p className="text-slate-200 mt-0.5 text-xs">{goni.patientPosition}</p>
            </div>
            <div className="bg-[#070e22] p-2 rounded border border-slate-800">
              <strong className="text-slate-400 block text-[10px]">Stabilisation:</strong>
              <p className="text-slate-200 mt-0.5 text-xs">{goni.stabilization}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Muscle Testing (MMT) Daniels & Worthingham Grades 0 - 5 */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide">
            Manual Muscle Testing (MMT) Criteria
          </span>
          <span className="text-[10px] text-slate-400">Daniels & Worthingham Scale</span>
        </div>

        <div className="space-y-1.5">
          {goni.mmtGrades.map((m) => (
            <div
              key={m.grade}
              className="bg-[#070e22] p-2 rounded border border-slate-800 text-xs flex items-start gap-2.5"
            >
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  m.grade >= 4
                    ? 'bg-teal-900 text-teal-300'
                    : m.grade === 3
                    ? 'bg-amber-900 text-amber-300'
                    : 'bg-red-950 text-red-300'
                }`}
              >
                Grade {m.grade}
              </span>
              <div className="flex-1">
                <strong className="text-white text-xs block">{m.label}</strong>
                <p className="text-[11px] text-slate-300 mt-0.5">{m.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
