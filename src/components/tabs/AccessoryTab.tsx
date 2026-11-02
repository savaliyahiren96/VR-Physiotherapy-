import React, { useState } from 'react';
import { JointDefinition } from '../../types/biomechanics';

interface AccessoryTabProps {
  joint: JointDefinition;
  onTriggerGlideAnimation: (vector: [number, number, number] | null) => void;
  activeGlideId: string | null;
  setActiveGlideId: (id: string | null) => void;
}

export const AccessoryTab: React.FC<AccessoryTabProps> = ({
  joint,
  onTriggerGlideAnimation,
  activeGlideId,
  setActiveGlideId,
}) => {
  const [activeMaitlandGrade, setActiveMaitlandGrade] = useState<number>(1);
  const [activeKaltenbornGrade, setActiveKaltenbornGrade] = useState<number>(1);

  const handleShowIn3D = (glideId: string, vector: [number, number, number]) => {
    if (activeGlideId === glideId) {
      // Toggle off
      setActiveGlideId(null);
      onTriggerGlideAnimation(null);
    } else {
      setActiveGlideId(glideId);
      onTriggerGlideAnimation(vector);
    }
  };

  return (
    <div className="space-y-4 text-slate-100 text-sm">
      {/* 3D Enlargement Notice */}
      <div className="bg-amber-950/40 border border-amber-600/70 p-2.5 rounded text-xs text-amber-200 flex items-center gap-2">
        <span className="text-amber-400 font-bold text-sm">ⓘ</span>
        <span>
          <strong>Educational Notice:</strong> 3D accessory glide animations are <strong>greatly enlarged</strong> for visual clarity (actual physiological joint translatory glides measure only 2 to 5 mm).
        </span>
      </div>

      {/* Convex-Concave Rule & Capsular Pattern */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 space-y-2">
        <div>
          <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide block">
            Kaltenborn Convex-Concave Rule
          </span>
          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
            {joint.convexConcaveRule}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <span className="text-xs uppercase font-bold text-[#20b2aa] tracking-wide block">
            Cyriax Capsular Pattern
          </span>
          <p className="text-xs text-slate-200 mt-1">
            <strong>Proportional loss of movement:</strong> {joint.capsularPattern}
          </p>
        </div>
      </div>

      {/* Maitland and Kaltenborn Mobilization Grading Systems */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 space-y-3">
        <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide block">
          Mobilization Grading Systems
        </span>

        {/* Maitland Oscillatory Grades */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-white">Maitland Oscillatory Grades:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveMaitlandGrade(g)}
                  className={`text-[10px] w-6 h-5 rounded font-bold transition-colors cursor-pointer ${
                    activeMaitlandGrade === g
                      ? 'bg-[#20b2aa] text-[#0b132b]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {g === 5 ? 'V' : ['I', 'II', 'III', 'IV'][g - 1]}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[11px] bg-[#070e22] p-2 rounded text-slate-300 border border-slate-800">
            {activeMaitlandGrade === 1 && 'Grade I: Small amplitude rhythmic oscillations at the beginning of the available range (for pain relief and neurophysiological inhibition).'}
            {activeMaitlandGrade === 2 && 'Grade II: Large amplitude rhythmic oscillations within the range, not reaching pathological limit (for pain relief and synovial fluid agitation).'}
            {activeMaitlandGrade === 3 && 'Grade III: Large amplitude rhythmic oscillations up to and into the pathological resistance / tissue limit (for increasing joint mobility).'}
            {activeMaitlandGrade === 4 && 'Grade IV: Small amplitude rhythmic oscillations at the end of the available range into tissue resistance (stretching tight capsule).'}
            {activeMaitlandGrade === 5 && 'Grade V (Manipulation): High-velocity, low-amplitude (HVLA) thrust technique at the anatomical limit (breaks intra-articular adhesions).'}
          </div>
        </div>

        {/* Kaltenborn Sustained Translatory Grades */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-white">Kaltenborn Sustained Traction Grades:</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveKaltenbornGrade(g)}
                  className={`text-[10px] px-2 h-5 rounded font-bold transition-colors cursor-pointer ${
                    activeKaltenbornGrade === g
                      ? 'bg-[#d4af37] text-[#0b132b]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Grade {['I', 'II', 'III'][g - 1]}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[11px] bg-[#070e22] p-2 rounded text-slate-300 border border-slate-800">
            {activeKaltenbornGrade === 1 && 'Grade I ("Loosen / Piccolo traction"): Extremely small traction force that nullifies compressive joint surface pressure without separating surfaces. Relieves acute pain.'}
            {activeKaltenbornGrade === 2 && 'Grade II ("Tighten / Take up slack"): Sustained translatory traction or glide taking up the periarticular tissue slack up to the tissue transition zone.'}
            {activeKaltenbornGrade === 3 && 'Grade III ("Stretch"): Sustained traction or glide applied beyond the transition zone into joint end-feel resistance to remodel capsular collagen.'}
          </div>
        </div>
      </div>

      {/* List of Joint Accessory Glides */}
      <div className="space-y-2">
        <span className="text-xs uppercase font-bold text-slate-400 block">
          Accessory Translatory Glides for {joint.name}
        </span>

        {joint.accessoryGlides.map((glide) => {
          const isActive = activeGlideId === glide.id;
          return (
            <div
              key={glide.id}
              className={`p-3 rounded-md border transition-all ${
                isActive
                  ? 'bg-[#12234f] border-[#fbbf24] shadow'
                  : 'bg-[#0b1633] border-slate-700/80 hover:border-teal-500/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{glide.name}</h4>
                  <div className="text-xs text-[#20b2aa] font-semibold mt-0.5">
                    Restores: {glide.indication}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleShowIn3D(glide.id, glide.directionVector)}
                  className={`text-xs px-2.5 py-1 rounded font-bold border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-red-900/80 hover:bg-red-800 text-red-200 border-red-500'
                      : 'bg-[#20b2aa] hover:bg-[#14b8a6] text-[#0b132b] border-[#fbbf24]'
                  }`}
                >
                  {isActive ? 'Reset 3D' : 'Show in 3D'}
                </button>
              </div>

              <div className="mt-2 text-xs text-slate-300 space-y-1">
                <div>
                  <strong className="text-slate-400">Patient Position:</strong> {glide.patientPosition}
                </div>
                <div>
                  <strong className="text-slate-400">Technique:</strong> {glide.technique}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
