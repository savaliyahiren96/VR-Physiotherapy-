import React from 'react';
import { JointDefinition, MovementDefinition } from '../../types/biomechanics';

interface JointTabProps {
  joint: JointDefinition;
  movement: MovementDefinition;
}

export const JointTab: React.FC<JointTabProps> = ({ joint, movement }) => {
  return (
    <div className="space-y-4 text-slate-100 text-sm">
      {/* Joint Structural Anatomy Header */}
      <div className="bg-[#0b1633] p-3.5 rounded-md border border-slate-700/80">
        <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide block mb-1">
          Joint Classification & Arthrokinematics
        </span>
        <h3 className="text-base font-bold text-white mb-2">{joint.name}</h3>
        <p className="text-xs text-slate-300 leading-relaxed">{joint.jointType}</p>
      </div>

      {/* Plane, Axis, and AAOS Normal Range */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#0b1633] p-3 rounded border border-slate-700/80">
          <span className="text-[10px] uppercase text-slate-400 font-bold block">Plane and Axis</span>
          <p className="text-slate-200 mt-1 font-medium">{movement.planeAndAxis}</p>
        </div>
        <div className="bg-[#0b1633] p-3 rounded border border-slate-700/80">
          <span className="text-[10px] uppercase text-slate-400 font-bold block">Normal Range (AAOS)</span>
          <p className="text-emerald-400 mt-1 font-bold text-sm">{movement.normalRangeText}</p>
        </div>
      </div>

      {/* Physiological and Pathological End-Feels */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 space-y-2">
        <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide block">
          End-Feel Characteristics (Magee / Cyriax)
        </span>
        <div className="bg-[#070e22] p-2.5 rounded border border-slate-800">
          <span className="text-xs font-bold text-[#20b2aa]">Normal Physiological End-Feel:</span>
          <p className="text-xs text-slate-300 mt-0.5">{movement.endFeel.normal}</p>
        </div>
        <div className="bg-[#070e22] p-2.5 rounded border border-slate-800">
          <span className="text-xs font-bold text-amber-400">Pathological End-Feel:</span>
          <p className="text-xs text-slate-300 mt-0.5">{movement.endFeel.pathological}</p>
        </div>
      </div>

      {/* Close-Packed & Resting (Loose-Packed) Positions */}
      <div className="space-y-2 text-xs">
        <div className="bg-[#0b1633] p-3 rounded border border-slate-700/80">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="font-bold text-amber-300 uppercase tracking-wide">Close-Packed Position</span>
          </div>
          <p className="text-slate-200 leading-relaxed">{joint.closePackedPosition}</p>
          <p className="text-[11px] text-slate-400 mt-1 italic">
            Articular surfaces maximal congruency; capsule and major ligaments taut; joint volume minimal; optimal for weight-bearing stability.
          </p>
        </div>

        <div className="bg-[#0b1633] p-3 rounded border border-slate-700/80">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#20b2aa]"></span>
            <span className="font-bold text-[#20b2aa] uppercase tracking-wide">Resting / Open-Packed Position</span>
          </div>
          <p className="text-slate-200 leading-relaxed">{joint.restingPosition}</p>
          <p className="text-[11px] text-slate-400 mt-1 italic">
            Articular surfaces minimally congruent; capsule and ligaments lax; maximum joint volume; ideal position for joint mobilization and traction.
          </p>
        </div>
      </div>

      {/* Arthrokinematics: Convex-Concave Rule & Joint Glide Summary */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80">
        <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide block mb-1">
          Joint Arthrokinematics (Kaltenborn Rule)
        </span>
        <p className="text-xs text-slate-200 leading-relaxed">{joint.convexConcaveRule}</p>
      </div>
    </div>
  );
};
