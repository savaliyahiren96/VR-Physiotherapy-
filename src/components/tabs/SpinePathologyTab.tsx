import React, { useState } from 'react';
import { SpinePathologyType, SpinePathologyInfo } from '../../types/biomechanics';
import {
  SPINE_PATHOLOGIES,
  NACHEMSON_PRESSURE_DATA,
  NEURODYNAMIC_TESTS,
  CAUDA_EQUINA_RED_FLAGS,
} from '../../data/spinePathologyData';

interface SpinePathologyTabProps {
  currentPathology: SpinePathologyType;
  onSelectPathology: (pathology: SpinePathologyType) => void;
  angleDeg: number;
  bodyMassKg: number;
  loadKg: number;
}

export const SpinePathologyTab: React.FC<SpinePathologyTabProps> = ({
  currentPathology,
  onSelectPathology,
  angleDeg,
  bodyMassKg,
  loadKg,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pathologies' | 'nachemson' | 'neurodynamics' | 'red_flags'>('pathologies');
  
  // Interactive SLR angle state
  const [slrAngle, setSlrAngle] = useState<number>(45);
  const [isBragardActive, setIsBragardActive] = useState<boolean>(true);
  
  // Interactive Slump step state
  const [activeSlumpStep, setActiveSlumpStep] = useState<number>(3);
  
  // Red flag checklist state
  const [checkedFlags, setCheckedFlags] = useState<Record<string, boolean>>({});

  const activePathologyInfo: SpinePathologyInfo =
    SPINE_PATHOLOGIES.find((p) => p.id === currentPathology) || SPINE_PATHOLOGIES[0];

  // Dynamic intradiscal pressure calculation based on Nachemson model + current load and angle
  const baseStandingPressure = 100; // kg/cm^2
  const flexionMultiplier = 1 + (angleDeg / 60) * 1.2;
  const loadMultiplier = 1 + (loadKg / 20) * 0.9;
  const pathologyMultiplier = activePathologyInfo.intradiscalPressureMultiplier;
  const estimatedDiscPressure = Math.round(baseStandingPressure * flexionMultiplier * loadMultiplier * (pathologyMultiplier > 1 ? 1.15 : 1));

  // Compressive force estimate on L4-L5 disc (HAT ~68% body mass + load)
  const hatMass = bodyMassKg * 0.678;
  const upperBodyWeightN = hatMass * 9.81;
  const loadWeightN = loadKg * 9.81;
  // Erector spinae muscle force needed with short 5 cm moment arm
  const trunkMomentArm = 0.28 * Math.sin((Math.max(10, angleDeg) * Math.PI) / 180);
  const loadMomentArm = 0.42 * Math.sin((Math.max(10, angleDeg) * Math.PI) / 180);
  const flexorTorque = upperBodyWeightN * trunkMomentArm + loadWeightN * loadMomentArm;
  const erectorSpinaeForceN = Math.round(flexorTorque / 0.05); // 5 cm moment arm
  const compressiveForceN = Math.round(
    upperBodyWeightN * Math.cos((angleDeg * Math.PI) / 180) +
    loadWeightN * Math.cos((angleDeg * Math.PI) / 180) +
    erectorSpinaeForceN
  );

  const isNioshLimitExceeded = compressiveForceN > 3400;

  // SLR interpretation helper
  const getSlrInterpretation = (angle: number, bragard: boolean) => {
    if (angle < 35) {
      return {
        phase: 'Dural Slack Phase (0°–35°)',
        color: 'text-slate-300',
        finding: 'Nerve roots are slack within the intervertebral foramina. Pain here is rarely neurodynamic; rule out hip pathology, acute spasm, or malingering.',
      };
    } else if (angle <= 70) {
      return {
        phase: 'Maximal Sciatic Nerve Tension Phase (35°–70°)',
        color: 'text-red-400 font-bold',
        finding: `L5 and S1 nerve roots glide 2–6 mm through neural foramina over IVD. Highly positive for posterolateral disc herniation${
          bragard ? ' with classical Bragard sensitization (ankle dorsiflexion reinforces neural tension)' : ''
        }.`,
      };
    } else {
      return {
        phase: 'Hamstring & Joint Capsule Phase (> 70°)',
        color: 'text-amber-300',
        finding: 'No further dural stretch occurs. Posterior thigh discomfort at this angle represents normal hamstring muscle length tightness or sacroiliac joint stress.',
      };
    }
  };

  const slrInterp = getSlrInterpretation(slrAngle, isBragardActive);

  return (
    <div className="flex flex-col gap-3 font-serif text-slate-100">
      {/* Tab Header & Academic Title */}
      <div className="bg-[#0b1633] p-3 rounded-lg border border-teal-500/40 shadow flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🦴</span>
            <h2 className="text-sm sm:text-base font-bold text-[#fbbf24] tracking-wide">
              Spinal Biomechanics & Pathological Laboratory
            </h2>
          </div>
          <p className="text-[11px] text-slate-300 font-sans mt-0.5">
            Functional Spinal Unit (FSU L4–S1), Nachemson Pressure, Neurodynamic Tension Tests & Disc Derangement
          </p>
        </div>

        {/* 3D Model Sync Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#071126] border border-teal-400/30 text-[11px] font-sans text-teal-300 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>3D Model Synced: <strong className="text-amber-200">{activePathologyInfo.name.split('(')[0]}</strong></span>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-700/80 pb-1 font-sans text-xs overflow-x-auto no-scrollbar">
        {[
          { key: 'pathologies', label: '1. Pathologies & 3D FSU' },
          { key: 'nachemson', label: '2. Nachemson Disc Pressure' },
          { key: 'neurodynamics', label: '3. Neurodynamics (SLR & Slump)' },
          { key: 'red_flags', label: '4. Cauda Equina Red Flags' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap font-semibold border ${
              activeSubTab === tab.key
                ? 'bg-[#20b2aa] text-[#0b132b] font-bold border-[#fbbf24] shadow'
                : 'bg-[#101b38] text-slate-300 border-slate-700 hover:bg-[#182852]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: PATHOLOGIES & 3D FSU */}
      {activeSubTab === 'pathologies' && (
        <div className="flex flex-col gap-3">
          {/* Interactive Pathology Cards Selector */}
          <div>
            <label className="text-xs font-sans text-slate-300 font-bold uppercase tracking-wider mb-1.5 block">
              Select Spinal Condition to Visualize in Procedural 3D Rig:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 font-sans">
              {SPINE_PATHOLOGIES.map((p) => {
                const isSelected = p.id === currentPathology;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPathology(p.id)}
                    className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#12284d] to-[#0c1c38] border-[#fbbf24] shadow-md ring-1 ring-amber-400/50'
                        : 'bg-[#0c1630] border-slate-700/70 hover:border-teal-500/60 hover:bg-[#101e40]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-amber-200">{p.name.split('(')[0]}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                            p.shearRisk === 'Critical'
                              ? 'bg-red-950 text-red-300 border border-red-500/50'
                              : p.shearRisk === 'Severe'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                          }`}
                        >
                          {p.shearRisk} Shear
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                        {p.clinicalSignificance}
                      </p>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">{p.commonLevel}</span>
                      <span className="text-teal-300 font-semibold">{p.directionPreference} Pref.</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Pathology In-Depth Clinical Inspector */}
          <div className="bg-[#0b1429] p-3 rounded-lg border border-teal-500/40 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <div>
                <span className="text-[11px] font-sans font-semibold text-teal-400 uppercase tracking-wider">
                  Active Clinical Profile:
                </span>
                <h3 className="text-sm sm:text-base font-bold text-[#fbbf24]">
                  {activePathologyInfo.name}
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-teal-900/60 text-teal-200 border border-teal-400/40 font-mono">
                Level: {activePathologyInfo.commonLevel}
              </span>
            </div>

            {/* Pathophysiology & Biomechanical Mechanism */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-[#070e20] p-2.5 rounded border border-slate-800">
                <span className="font-bold text-amber-300 block mb-1">Clinical Significance:</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {activePathologyInfo.clinicalSignificance}
                </p>
              </div>

              <div className="bg-[#070e20] p-2.5 rounded border border-slate-800">
                <span className="font-bold text-teal-300 block mb-1">Biomechanical Mechanism:</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {activePathologyInfo.biomechanicalMechanism}
                </p>
              </div>
            </div>

            {/* Postural Responses & Special Tests */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-sans">
              <div className="bg-[#121f3d] p-2 rounded border border-red-900/40">
                <span className="font-bold text-red-300 block text-[11px]">❌ Aggravating Posture:</span>
                <p className="text-slate-200 text-[11px] mt-0.5">{activePathologyInfo.aggravatingPosture}</p>
              </div>

              <div className="bg-[#121f3d] p-2 rounded border border-emerald-900/40">
                <span className="font-bold text-emerald-300 block text-[11px]">✔ Relieving Posture:</span>
                <p className="text-slate-200 text-[11px] mt-0.5">{activePathologyInfo.relievingPosture}</p>
              </div>

              <div className="bg-[#121f3d] p-2 rounded border border-teal-900/40">
                <span className="font-bold text-teal-300 block text-[11px]">🎯 Directional Preference:</span>
                <p className="text-[#fbbf24] font-bold text-[11px] mt-0.5">{activePathologyInfo.directionPreference} Principle (McKenzie MDT)</p>
              </div>
            </div>

            {/* Diagnostic Clinical Tests List */}
            <div className="bg-[#081226] p-2.5 rounded border border-slate-700/60">
              <span className="font-bold text-slate-300 text-xs block mb-1 font-sans">
                Evidence-Based Physical Examination Tests:
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 font-sans">
                {activePathologyInfo.specialTests.map((t, idx) => (
                  <li key={idx}>
                    <strong className="text-teal-300">{t.split('(')[0]}</strong>
                    {t.includes('(') ? ` (${t.split('(').slice(1).join('(')}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: NACHEMSON INTRADISCAL PRESSURE */}
      {activeSubTab === 'nachemson' && (
        <div className="flex flex-col gap-3 font-sans">
          <div className="bg-[#0b1429] p-3 rounded-lg border border-teal-500/40 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#fbbf24]">
                  Nachemson In-Vivo Intradiscal Pressure & Spinal Load Analysis
                </h3>
                <p className="text-[11px] text-slate-300">
                  Landmark pressure transducer research at L3–L4 (Nachemson 1966, 1981; Wilke et al. 1999)
                </p>
              </div>
            </div>

            {/* Live Pressure & Compressive Force Meter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-1">
              <div className="bg-[#070e20] p-2.5 rounded border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Estimated Disc Pressure (L4–L5):</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-[#fbbf24] font-mono">{estimatedDiscPressure}</span>
                    <span className="text-xs text-slate-300">kg/cm² ({Math.round((estimatedDiscPressure / baseStandingPressure) * 100)}% of standing)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 mt-2 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      estimatedDiscPressure > 200 ? 'bg-red-500' : estimatedDiscPressure > 130 ? 'bg-amber-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.min(100, (estimatedDiscPressure / 300) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-[#070e20] p-2.5 rounded border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">L4–L5 Axial Compressive Force ($F_c$):</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-teal-300">{compressiveForceN.toLocaleString()}</span>
                    <span className="text-xs text-slate-300">N (Erector Spinae: {erectorSpinaeForceN.toLocaleString()} N)</span>
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">NIOSH Action Limit: 3,400 N</span>
                  <span className={`font-bold ${isNioshLimitExceeded ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isNioshLimitExceeded ? '⚠ Exceeds Action Limit!' : '✔ Within Safe Threshold'}
                  </span>
                </div>
              </div>
            </div>

            {/* Posture Benchmark Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="bg-[#121f3d] text-teal-300 border-b border-slate-700">
                    <th className="p-2">Posture / Activity</th>
                    <th className="p-2 font-mono">Pressure (kg/cm²)</th>
                    <th className="p-2 font-mono">% of Standing</th>
                    <th className="p-2">Shear Risk</th>
                    <th className="p-2">Biomechanical Principle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {NACHEMSON_PRESSURE_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#0c1630] transition-colors">
                      <td className="p-2 font-semibold text-slate-200">{row.posture}</td>
                      <td className="p-2 font-mono text-[#fbbf24] font-bold">{row.pressureKgCm2}</td>
                      <td className="p-2 font-mono text-slate-300">{row.relativePercent}%</td>
                      <td className="p-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono ${
                            row.shearRisk === 'Extreme'
                              ? 'bg-red-900 text-red-200'
                              : row.shearRisk === 'High'
                              ? 'bg-amber-900 text-amber-200'
                              : row.shearRisk === 'Moderate'
                              ? 'bg-yellow-900 text-yellow-200'
                              : 'bg-emerald-900 text-emerald-200'
                          }`}
                        >
                          {row.shearRisk}
                        </span>
                      </td>
                      <td className="p-2 text-slate-300 text-[10px] leading-tight">{row.biomechanicalDescription}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: NEURODYNAMIC TESTS (SLR & SLUMP) */}
      {activeSubTab === 'neurodynamics' && (
        <div className="flex flex-col gap-3 font-sans">
          {/* Straight Leg Raise (SLR) Interactive Dial */}
          <div className="bg-[#0b1429] p-3 rounded-lg border border-teal-500/40 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#fbbf24]">
                  Straight Leg Raise (SLR / Lasegue’s Test) Simulator
                </h3>
                <p className="text-[11px] text-slate-300">
                  Evaluates lumbosacral nerve root excursion (L4, L5, S1) and dural mechanosensitivity
                </p>
              </div>
              <button
                onClick={() => setIsBragardActive(!isBragardActive)}
                className={`text-xs px-2.5 py-1 rounded font-bold border transition-colors cursor-pointer ${
                  isBragardActive
                    ? 'bg-amber-600 text-white border-amber-300 shadow'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isBragardActive ? '✔ Bragard’s Sign ON' : 'Bragard’s Sign OFF'}
              </button>
            </div>

            {/* Slider Control */}
            <div className="bg-[#070e20] p-3 rounded border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">
                  Passive Hip Flexion Angle: <strong className="text-[#fbbf24] text-sm font-mono">{slrAngle}°</strong>
                </span>
                <span className={slrInterp.color}>{slrInterp.phase}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">0°</span>
                <input
                  type="range"
                  min={0}
                  max={90}
                  value={slrAngle}
                  onChange={(e) => setSlrAngle(parseInt(e.target.value))}
                  className="flex-1 accent-[#20b2aa] cursor-pointer h-2 bg-slate-700 rounded-lg"
                />
                <span className="text-[10px] text-slate-400 font-mono">90°</span>
              </div>

              {/* Dynamic Finding Card */}
              <div className="mt-2 p-2 rounded bg-[#0d1a38] border border-slate-700 text-xs">
                <span className="font-bold text-teal-300 block mb-0.5">Biomechanical & Clinical Finding:</span>
                <p className="text-slate-200 text-[11px] leading-relaxed">{slrInterp.finding}</p>
              </div>
            </div>

            {/* Cross-SLR Callout */}
            <div className="bg-[#101b3b] p-2.5 rounded border border-amber-600/50 text-xs flex items-start gap-2">
              <span className="text-amber-400 font-bold text-sm">💡</span>
              <div>
                <strong className="text-amber-300 block">Well Leg Raise / Cross-SLR Test:</strong>
                <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
                  Lifting the <em>unaffected (asymptomatic)</em> leg reproduces radicular symptoms down the <em>affected</em> leg. This occurs because bilateral nerve roots are pulled medially across the dural sac, impinging the contralateral herniated disc. Has a <strong>specificity &gt; 90%</strong> for space-occupying disc herniation (often large axillary or extruded disc).
                </p>
              </div>
            </div>
          </div>

          {/* Slump Test Multi-Stage Guide */}
          <div className="bg-[#0b1429] p-3 rounded-lg border border-teal-500/40 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-[#fbbf24] border-b border-slate-700/80 pb-1.5">
              Maitland Slump Test: 5-Stage Protocol
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
              {[
                { step: 1, name: '1. Slump', desc: 'Thoracolumbar kyphosis with neutral neck' },
                { step: 2, name: '2. Cervical', desc: 'Active neck flexion (chin to chest)' },
                { step: 3, name: '3. Knee Ext', desc: 'Active knee extension of symptomatic leg' },
                { step: 4, name: '4. Dorsiflex', desc: 'Passive ankle dorsiflexion (maximal pull)' },
                { step: 5, name: '5. Release Neck', desc: 'Structural differentiation (release neck alone)' },
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setActiveSlumpStep(s.step)}
                  className={`p-2 rounded text-left border transition-all cursor-pointer ${
                    activeSlumpStep === s.step
                      ? 'bg-[#18315b] border-teal-400 text-white shadow'
                      : 'bg-[#081024] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold text-[11px] block text-[#fbbf24]">{s.name}</span>
                  <span className="text-[10px] leading-tight block mt-0.5">{s.desc}</span>
                </button>
              ))}
            </div>

            <div className="bg-[#070e20] p-2.5 rounded border border-slate-800 text-xs">
              <span className="font-bold text-teal-300 block mb-1">
                Structural Differentiation Rule (Maitland 1986):
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                If leg or foot pain reproduced at Step 4 is <strong>relieved or significantly diminished</strong> when the patient releases neck flexion at Step 5 (while maintaining the knee straight and ankle dorsiflexed), the test is unequivocally <strong>positive for neuromeningeal tract tension</strong>. Musculoskeletal hamstring tightness would not alter with cervical spine position.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CAUDA EQUINA RED FLAGS */}
      {activeSubTab === 'red_flags' && (
        <div className="flex flex-col gap-3 font-sans">
          <div className="bg-[#1f0d14] p-3 rounded-lg border border-red-600/60 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 border-b border-red-700/60 pb-2">
              <span className="text-xl">🚨</span>
              <div>
                <h3 className="text-sm font-bold text-red-300">
                  Cauda Equina Syndrome (CES) Clinical Emergency Triage
                </h3>
                <p className="text-[11px] text-red-200/80">
                  Massive central disc prolapse compressing multiple lumbosacral nerve roots. Requires immediate same-day MRI and neurosurgical decompression within 24–48 hours to prevent permanent bladder/bowel incontinence.
                </p>
              </div>
            </div>

            {/* Checklist of 5 Critical Red Flags */}
            <div className="space-y-2">
              {CAUDA_EQUINA_RED_FLAGS.map((rf) => {
                const isChecked = checkedFlags[rf.id] || false;
                return (
                  <div
                    key={rf.id}
                    onClick={() => setCheckedFlags((prev) => ({ ...prev, [rf.id]: !isChecked }))}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isChecked
                        ? 'bg-red-950/80 border-red-500 text-white'
                        : 'bg-[#140a10] border-red-900/40 text-slate-300 hover:bg-[#1a0e16]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 accent-red-500 cursor-pointer w-4 h-4 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-red-200">{rf.flag}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/60 text-red-200 font-mono">
                          {rf.urgency}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{rf.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Emergency Action Directive */}
            <div className="bg-red-900/40 border border-red-500/80 p-2.5 rounded text-xs text-red-100 flex items-center justify-between">
              <div>
                <strong className="block font-bold">Physiotherapy Clinical Action:</strong>
                <span className="text-[11px]">If any of flags 1, 2, or 3 are present, immediately halt treatment, notify referring doctor, and transfer patient to emergency department for urgent lumbar MRI.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
