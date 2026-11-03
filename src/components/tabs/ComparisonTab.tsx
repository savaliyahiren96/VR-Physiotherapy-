import React, { useState } from 'react';

interface ComparisonSession {
  id: string;
  sessionName: string;
  date: string;
  measuredAngleDeg: number;
  contralateralAngleDeg: number;
  symmetryPercent: number;
  netTorqueNm: number;
  mmtGrade: number;
  abnormalitiesObserved: string[];
  clinicalStatus: string;
}

export const ComparisonTab: React.FC = () => {
  const [baselineSession, setBaselineSession] = useState<ComparisonSession>({
    id: 'base_1',
    sessionName: 'Baseline Initial Evaluation (Week 0)',
    date: '2026-09-15',
    measuredAngleDeg: 65,
    contralateralAngleDeg: 90,
    symmetryPercent: 72,
    netTorqueNm: 4.8,
    mmtGrade: 3,
    abnormalitiesObserved: [
      'Severe Dynamic Knee Valgus during single-leg loading',
      'Contralateral Pelvic Drop (Positive Trendelenburg Sign)',
      'Excessive Forward Trunk Lean',
    ],
    clinicalStatus: 'Acute functional deficit; significant motor control and hip abductor weakness.',
  });

  const [followupSession, setFollowupSession] = useState<ComparisonSession>({
    id: 'follow_1',
    sessionName: 'Follow-Up Evaluation (Week 6 Post-Rehab)',
    date: '2026-10-28',
    measuredAngleDeg: 92,
    contralateralAngleDeg: 90,
    symmetryPercent: 96,
    netTorqueNm: 8.2,
    mmtGrade: 5,
    abnormalitiesObserved: [
      'Minimal dynamic knee valgus under high fatigue only',
      'Pelvic drop resolved; pelvis level in frontal plane',
    ],
    clinicalStatus: 'Marked functional restoration; patient demonstrates robust neuromuscular stability.',
  });

  // Calculate delta progress metrics
  const deltaAngle = followupSession.measuredAngleDeg - baselineSession.measuredAngleDeg;
  const deltaSymmetry = followupSession.symmetryPercent - baselineSession.symmetryPercent;
  const deltaTorque = followupSession.netTorqueNm - baselineSession.netTorqueNm;
  const deltaMmt = followupSession.mmtGrade - baselineSession.mmtGrade;

  // Clinical Discharge Readiness Index (0 - 100%)
  const dischargeScore = Math.min(100, Math.round((followupSession.symmetryPercent * 0.4) + (followupSession.mmtGrade * 10) + ((followupSession.measuredAngleDeg / 90) * 20)));

  return (
    <div className="space-y-4 text-slate-100 text-sm font-sans">
      {/* Header Banner */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-[#20b2aa]/40 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide block">
            ClinicaAI Longitudinal Progress & Session Comparison Tool
          </span>
          <p className="text-xs text-slate-300 mt-0.5">
            Compare Baseline initial assessment against Post-Intervention follow-ups to measure clinical outcome metrics.
          </p>
        </div>

        <div className="bg-teal-950 px-3 py-1 rounded border border-teal-600 flex items-center gap-2">
          <span className="text-[10px] uppercase text-slate-400 font-bold">Discharge Readiness:</span>
          <span className="text-sm font-bold text-teal-300">{dischargeScore}%</span>
        </div>
      </div>

      {/* Progress Delta Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-[#0b1633] p-2.5 rounded border border-slate-700/80">
          <span className="text-[10px] text-slate-400 block font-semibold">Δ Active Range of Motion</span>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-1">
            <span>+{deltaAngle}°</span>
            <span className="text-xs text-slate-400 font-normal">({baselineSession.measuredAngleDeg}° → {followupSession.measuredAngleDeg}°)</span>
          </div>
          <div className="text-[10px] text-teal-300 mt-0.5">Significant ROM Gain</div>
        </div>

        <div className="bg-[#0b1633] p-2.5 rounded border border-slate-700/80">
          <span className="text-[10px] text-slate-400 block font-semibold">Δ Bilateral Symmetry</span>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-1">
            <span>+{deltaSymmetry}%</span>
            <span className="text-xs text-slate-400 font-normal">({baselineSession.symmetryPercent}% → {followupSession.symmetryPercent}%)</span>
          </div>
          <div className="text-[10px] text-teal-300 mt-0.5">Near-Symmetrical Index</div>
        </div>

        <div className="bg-[#0b1633] p-2.5 rounded border border-slate-700/80">
          <span className="text-[10px] text-slate-400 block font-semibold">Δ Peak Torque Capacity</span>
          <div className="text-lg font-bold text-[#fbbf24] flex items-center gap-1">
            <span>+{deltaTorque.toFixed(1)} N·m</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">+{((deltaTorque / baselineSession.netTorqueNm) * 100).toFixed(0)}% Force Increase</div>
        </div>

        <div className="bg-[#0b1633] p-2.5 rounded border border-slate-700/80">
          <span className="text-[10px] text-slate-400 block font-semibold">Δ MMT Manual Grade</span>
          <div className="text-lg font-bold text-amber-300 flex items-center gap-1">
            <span>+{deltaMmt} Grade</span>
            <span className="text-xs text-slate-400 font-normal">(Grade {baselineSession.mmtGrade} → Grade {followupSession.mmtGrade})</span>
          </div>
          <div className="text-[10px] text-teal-300 mt-0.5">Full Strength Restored</div>
        </div>
      </div>

      {/* Side-by-Side Assessment Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Baseline Session */}
        <div className="bg-[#0b1633] p-3.5 rounded border border-amber-600/60 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-[10px] bg-amber-950 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-700 uppercase">
                Baseline Session
              </span>
              <h4 className="text-sm font-bold text-white mt-1">{baselineSession.sessionName}</h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">{baselineSession.date}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-[#070e22] p-2 rounded border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">Measured Joint Angle:</span>
              <strong className="text-amber-300 text-sm">{baselineSession.measuredAngleDeg}°</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">L/R Symmetry:</span>
              <strong className="text-amber-300 text-sm">{baselineSession.symmetryPercent}%</strong>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Observed Abnormalities:</span>
            <ul className="list-disc pl-4 text-slate-300 space-y-0.5">
              {baselineSession.abnormalitiesObserved.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-400 italic bg-[#070e22] p-2 rounded border border-slate-800">
            {baselineSession.clinicalStatus}
          </p>
        </div>

        {/* Follow-Up Session */}
        <div className="bg-[#0b1633] p-3.5 rounded border border-teal-500/80 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-[10px] bg-teal-950 text-teal-300 font-bold px-2 py-0.5 rounded border border-teal-700 uppercase">
                Follow-Up Evaluation
              </span>
              <h4 className="text-sm font-bold text-white mt-1">{followupSession.sessionName}</h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">{followupSession.date}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-[#070e22] p-2 rounded border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">Measured Joint Angle:</span>
              <strong className="text-teal-300 text-sm">{followupSession.measuredAngleDeg}°</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">L/R Symmetry:</span>
              <strong className="text-teal-300 text-sm">{followupSession.symmetryPercent}%</strong>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Current Status & Resolution:</span>
            <ul className="list-disc pl-4 text-slate-200 space-y-0.5">
              {followupSession.abnormalitiesObserved.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-teal-200 italic bg-[#070e22] p-2 rounded border border-slate-800">
            {followupSession.clinicalStatus}
          </p>
        </div>
      </div>

      {/* Progress Narrative & Clinician Decision Summary */}
      <div className="bg-[#0b1633] p-3.5 rounded border border-slate-700/80 space-y-2 text-xs">
        <h4 className="font-bold text-[#fbbf24] uppercase text-xs">Attending Physiotherapist Progress Recommendation</h4>
        <p className="text-slate-300 leading-relaxed">
          The patient has made substantial progress following 6 weeks of targeted gluteus medius strengthening, neuromuscular biofeedback squats, and single-leg eccentric step-downs. Dynamic knee valgus during single-leg descent has been rectified from severe collapse to near-neutral trajectory with symmetry rising from 72% to 96%. Patient is cleared to advance to Phase III return-to-running and plyometric deceleration training.
        </p>
        <div className="flex justify-end pt-1">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-[#20b2aa] hover:bg-[#14b8a6] text-[#0b132b] font-bold rounded cursor-pointer"
          >
            🖨 Export Comparative Progress Note
          </button>
        </div>
      </div>
    </div>
  );
};
