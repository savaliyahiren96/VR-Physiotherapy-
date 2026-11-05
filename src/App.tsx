import React, { useState, useEffect, useRef } from 'react';
import { JOINTS_DATA } from './data/jointsData';
import {
  JointId,
  MovementId,
  PatientPosition,
  ContractionMode,
  SpinePathologyType,
} from './types/biomechanics';
import { calculateBiomechanics } from './utils/biomechanicsEngine';
import { VRScene } from './components/3d/VRScene';
import { LoadTab } from './components/tabs/LoadTab';
import { MusclesTab } from './components/tabs/MusclesTab';
import { JointTab } from './components/tabs/JointTab';
import { AccessoryTab } from './components/tabs/AccessoryTab';
import { WeaknessTab } from './components/tabs/WeaknessTab';
import { GoniometryTab } from './components/tabs/GoniometryTab';
import { ClosedChainTab } from './components/tabs/ClosedChainTab';
import { QuizTab } from './components/tabs/QuizTab';
import { AITutorTab } from './components/tabs/AITutorTab';
import { MotionAnalysisTab } from './components/tabs/MotionAnalysisTab';
import { ExerciseLibraryTab } from './components/tabs/ExerciseLibraryTab';
import { ComparisonTab } from './components/tabs/ComparisonTab';
import { SpinePathologyTab } from './components/tabs/SpinePathologyTab';
import { SoftTissueTab } from './components/tabs/SoftTissueTab';
import { SAMPLE_PATIENTS } from './data/samplePatients';
import { playTargetReachedChime } from './utils/audioFeedback';

type TabKey =
  | 'load'
  | 'muscles'
  | 'soft_tissues'
  | 'joint'
  | 'accessory'
  | 'weakness'
  | 'goniometry'
  | 'closed_chain'
  | 'exercises'
  | 'comparison'
  | 'spine_pathology'
  | 'quiz'
  | 'ai_tutor'
  | 'motion_analysis';

export default function App() {
  // Navigation & Joint State
  const [currentJointId, setCurrentJointId] = useState<JointId>('elbow');
  const [currentMovementId, setCurrentMovementId] = useState<MovementId>('elbow_flexion');
  const [activeTab, setActiveTab] = useState<TabKey>('load');

  // Biomechanics Parameters
  const [bodyMassKg, setBodyMassKg] = useState<number>(60); // 60 kg benchmark
  const [loadKg, setLoadKg] = useState<number>(2); // 2 kg load benchmark
  const [extraResistanceNm, setExtraResistanceNm] = useState<number>(0);
  const [contractionMode, setContractionMode] = useState<ContractionMode>('holding');
  const [patientPosition, setPatientPosition] = useState<PatientPosition>('sitting');

  // Interactive 3D & Animation State
  const [angleDeg, setAngleDeg] = useState<number>(90);
  const [isPlayingRange, setIsPlayingRange] = useState<boolean>(false);
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null);
  const [selectedSoftTissueId, setSelectedSoftTissueId] = useState<string | null>(null);
  const [showLandmarks, setShowLandmarks] = useState<boolean>(false);
  const [activeAccessoryGlideVector, setActiveAccessoryGlideVector] = useState<[number, number, number] | null>(null);
  const [activeGlideId, setActiveGlideId] = useState<string | null>(null);

  // Weakness Simulation Factors (muscleId -> 0 to 1 strength)
  const [muscleStrengthFactors, setMuscleStrengthFactors] = useState<Record<string, number>>({});

  // Spine Pathology Visualization State (PIVD, Spondylolisthesis, Stenosis, DDD, Scoliosis)
  const [spinePathology, setSpinePathology] = useState<SpinePathologyType>('pivd_herniation');

  // Patient Context & Acoustic Biofeedback
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PT-1046'); // Default to Vikram Malhotra (L4-L5 PIVD)
  const [audioBiofeedback, setAudioBiofeedback] = useState<boolean>(true);
  const activePatient = SAMPLE_PATIENTS.find((p) => p.id === selectedPatientId) || SAMPLE_PATIENTS[0];

  // Active joint and movement lookup
  const currentJoint = JOINTS_DATA.find((j) => j.id === currentJointId) || JOINTS_DATA[1];
  const currentMovement =
    currentJoint.movements.find((m) => m.id === currentMovementId) || currentJoint.movements[0];

  // Acoustic chime when reaching key milestone angles
  const prevAngleRef = useRef<number>(angleDeg);
  useEffect(() => {
    if (audioBiofeedback && Math.abs(angleDeg - prevAngleRef.current) >= 1) {
      if (angleDeg === currentMovement.defaultAngle || angleDeg === currentMovement.maxAngle) {
        playTargetReachedChime();
      }
    }
    prevAngleRef.current = angleDeg;
  }, [angleDeg, audioBiofeedback, currentMovement.defaultAngle, currentMovement.maxAngle]);

  // Set default angle and position when movement changes
  const handleSelectMovement = (mId: MovementId) => {
    setCurrentMovementId(mId);
    const m = currentJoint.movements.find((mov) => mov.id === mId);
    if (m) {
      setAngleDeg(m.defaultAngle);
      setPatientPosition(m.defaultPosition);
      setSelectedMuscleId(null);
      setSelectedSoftTissueId(null);
      setActiveAccessoryGlideVector(null);
      setActiveGlideId(null);
    }
  };

  const handleSelectJoint = (jId: JointId) => {
    setCurrentJointId(jId);
    const j = JOINTS_DATA.find((joint) => joint.id === jId);
    if (j && j.movements.length > 0) {
      const firstMov = j.movements[0];
      setCurrentMovementId(firstMov.id);
      setAngleDeg(firstMov.defaultAngle);
      setPatientPosition(firstMov.defaultPosition);
      setSelectedMuscleId(null);
      setSelectedSoftTissueId(null);
      setActiveAccessoryGlideVector(null);
      setActiveGlideId(null);
      if (jId === 'spine') {
        setActiveTab('spine_pathology');
      }
    }
  };

  // Cycle to next movement (useful in VR trigger and quick shortcuts)
  const handleNextMovement = () => {
    const movIdx = currentJoint.movements.findIndex((m) => m.id === currentMovement.id);
    const nextMov = currentJoint.movements[(movIdx + 1) % currentJoint.movements.length];
    handleSelectMovement(nextMov.id);
  };

  // Cycle to next joint (useful in VR grip button)
  const handleNextJoint = () => {
    const jointIdx = JOINTS_DATA.findIndex((j) => j.id === currentJoint.id);
    const nextJoint = JOINTS_DATA[(jointIdx + 1) % JOINTS_DATA.length];
    handleSelectJoint(nextJoint.id);
  };

  // Move Through Range Animation Loop
  const playRef = useRef<{ dir: number }>({ dir: 1 });
  useEffect(() => {
    if (!isPlayingRange) return;
    const interval = setInterval(() => {
      setAngleDeg((prev) => {
        let next = prev + playRef.current.dir * 1;
        if (next >= currentMovement.maxAngle) {
          next = currentMovement.maxAngle;
          playRef.current.dir = -1;
        } else if (next <= currentMovement.minAngle) {
          next = currentMovement.minAngle;
          playRef.current.dir = 1;
        }
        return next;
      });
    }, 28);
    return () => clearInterval(interval);
  }, [isPlayingRange, currentMovement.minAngle, currentMovement.maxAngle]);

  // Compute live biomechanics summary
  const biomechanics = calculateBiomechanics({
    jointId: currentJoint.id,
    movement: currentMovement,
    angleDeg,
    bodyMassKg,
    loadKg,
    extraResistanceNm,
    contractionMode,
    patientPosition,
    muscleStrengthFactors,
  });

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#070d1e] text-slate-100 font-serif overflow-x-hidden">
      {/* Top Academic Header */}
      <header className="bg-[#0b132b] border-b border-[#20b2aa]/40 px-3 py-2 sm:px-6 sm:py-2.5 flex items-center justify-between shadow-md select-none shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#20b2aa] to-[#d4af37] flex items-center justify-center font-bold text-[#0b132b] text-base shadow">
            CA
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#fbbf24] tracking-wide leading-tight">
              ClinicaAI <span className="text-xs sm:text-sm font-normal text-teal-300">| Movement Analysis & Biomechanics</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-300">
              AI-Powered Camera Assessment, Skeletal Tracking & Clinical Prefill
            </p>
          </div>
        </div>

        {/* Rapid Joint Selector Tabs */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {JOINTS_DATA.map((j) => {
            const isSelected = j.id === currentJoint.id;
            return (
              <button
                key={j.id}
                onClick={() => handleSelectJoint(j.id)}
                className={`text-xs px-2 sm:px-3 py-1 rounded transition-colors cursor-pointer whitespace-nowrap font-sans font-semibold border ${
                  isSelected
                    ? 'bg-[#20b2aa] text-[#0b132b] border-[#fbbf24] shadow'
                    : 'bg-[#132247] text-slate-300 border-slate-700/80 hover:bg-[#1a2d5e]'
                }`}
              >
                {j.id.charAt(0).toUpperCase() + j.id.slice(1)}
              </button>
            );
          })}
        </div>
      </header>

      {/* Patient Profile & Clinical Context Bar */}
      <div className="bg-[#0c1836] border-b border-teal-500/30 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-sans shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-slate-400 font-semibold shrink-0">Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => {
              const pId = e.target.value;
              setSelectedPatientId(pId);
              const p = SAMPLE_PATIENTS.find((item) => item.id === pId);
              if (p && p.involvedJoint !== currentJointId) {
                handleSelectJoint(p.involvedJoint);
              }
            }}
            className="bg-[#14234b] text-[#fbbf24] font-bold border border-teal-500/50 rounded px-2 py-0.5 text-xs cursor-pointer focus:outline-none focus:border-amber-400"
          >
            {SAMPLE_PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id}) - {p.affectedSide} {p.involvedJoint.toUpperCase()}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-300 hidden sm:inline">
            | <strong className="text-teal-300">{activePatient.diagnosis}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-400 hidden md:inline">Goal: <span className="text-amber-200">{activePatient.goalROM}</span></span>
          <span className="px-2 py-0.5 rounded bg-teal-900/60 border border-teal-400/40 text-teal-300 font-mono text-[10px]">
            {activePatient.status}
          </span>
        </div>
      </div>

      {/* Mandatory Honesty & Academic Disclaimer Banner */}
      <div className="bg-[#08152e] border-b border-amber-600/40 px-3 py-1.5 text-[10px] sm:text-[11px] text-amber-200/90 flex flex-wrap items-center justify-between gap-1 select-none shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[#fbbf24] uppercase">Academic Disclaimer:</span>
          <span>
            Procedural 3D models are simplified educational representations, not patient radiological CT/MRI scans. Per-degree muscle forces and torque sharing are mathematical optimization model estimates (Crowninshield & Brand), not in-vivo EMG or direct load cell measurements. Not clinically validated for patient diagnosis.
          </span>
        </div>
      </div>

      {/* Movement Selection Pill Bar */}
      <div className="bg-[#0b1633] border-b border-slate-800 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[11px] text-slate-400 font-sans font-semibold uppercase tracking-wider shrink-0 mr-1">
          {currentJoint.name}:
        </span>
        {currentJoint.movements.map((mov) => {
          const isSelected = mov.id === currentMovement.id;
          return (
            <button
              key={mov.id}
              onClick={() => handleSelectMovement(mov.id)}
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer font-sans border ${
                isSelected
                  ? 'bg-[#d4af37] text-[#0b132b] font-bold border-amber-300 shadow'
                  : 'bg-[#0f1d40] text-slate-300 border-slate-700 hover:border-teal-500'
              }`}
            >
              {mov.name.replace(currentJoint.name, '').trim() || mov.name}
            </button>
          );
        })}

        {/* Quick Launch Button to Video/Photo Motion Lab and Spine Lab */}
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {currentJoint.id === 'spine' && (
            <button
              onClick={() => setActiveTab('spine_pathology')}
              className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold font-sans border border-amber-300 shadow flex items-center gap-1 cursor-pointer"
            >
              <span>🦴 Spine Pathology Lab</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('motion_analysis')}
            className="text-xs px-3 py-1 rounded-full whitespace-nowrap bg-gradient-to-r from-[#20b2aa] to-[#0d9488] hover:from-[#14b8a6] hover:to-[#0f766e] text-[#0b132b] font-bold font-sans border border-[#fbbf24] shadow flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>📷 Video/Photo Marker Lab</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Layout: Desktop 3D Left / Tabs Right, Phone 3D Top / Tabs Bottom */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 3D Lab Viewport Container */}
        <div className="w-full lg:w-1/2 xl:w-7/12 h-[340px] sm:h-[420px] lg:h-auto flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 relative shrink-0">
          <div className="flex-1 w-full h-full relative">
            <VRScene
              joint={currentJoint}
              movement={currentMovement}
              angleDeg={angleDeg}
              onAngleChange={setAngleDeg}
              onNextMovement={handleNextMovement}
              onNextJoint={handleNextJoint}
              muscleCalculations={biomechanics.muscleCalculations}
              selectedMuscleId={selectedMuscleId}
              onSelectMuscle={setSelectedMuscleId}
              selectedSoftTissueId={selectedSoftTissueId}
              onSelectSoftTissue={setSelectedSoftTissueId}
              showLandmarks={showLandmarks}
              activeAccessoryGlideVector={activeAccessoryGlideVector}
              netTorqueNm={biomechanics.netTorqueNm}
              spinePathology={spinePathology}
              jointReactionForceN={biomechanics.jointReactionForceN}
              primaryMuscleForceN={biomechanics.primaryMuscleForceN}
            />
          </div>

          {/* Range Slider & Move Through Range Controls Dock */}
          <div className="bg-[#0b132b]/95 border-t border-slate-800 p-2.5 sm:px-4 flex flex-col gap-1.5 shrink-0 z-10">
            {/* Quick 3D Spine Pathology Selector when on Spine */}
            {currentJoint.id === 'spine' && (
              <div className="bg-[#071126] p-1.5 rounded border border-teal-500/40 flex items-center justify-between gap-1.5 text-xs font-sans">
                <span className="text-slate-300 font-semibold shrink-0">3D Pathology State:</span>
                <select
                  value={spinePathology}
                  onChange={(e) => setSpinePathology(e.target.value as SpinePathologyType)}
                  className="bg-[#122247] text-[#fbbf24] font-bold border border-teal-500/50 rounded px-2 py-0.5 text-xs cursor-pointer flex-1 max-w-[280px]"
                >
                  <option value="healthy">Normal Functional Segment (L4–L5)</option>
                  <option value="pivd_herniation">💥 PIVD Disc Herniation (Sciatica)</option>
                  <option value="spondylolisthesis">⚠️ Spondylolisthesis (Pars Defect)</option>
                  <option value="spinal_stenosis">🛑 Lumbar Spinal Stenosis</option>
                  <option value="degenerative_disc">🦴 Degenerative Disc Disease (DDD)</option>
                  <option value="scoliosis">📐 Lumbar Scoliosis Deformity</option>
                </select>
                <button
                  type="button"
                  onClick={() => setActiveTab('spine_pathology')}
                  className="text-[10px] px-2 py-0.5 rounded bg-teal-900 text-teal-200 border border-teal-400 font-bold hover:bg-teal-800 cursor-pointer shrink-0"
                >
                  Pathology Lab ➔
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-xs font-sans">
              <span className="text-slate-300">
                Joint Angle: <strong className="text-[#fbbf24] text-sm">{angleDeg}°</strong>
                <span className="text-slate-400 text-[11px] ml-1">({currentMovement.normalRangeText})</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('soft_tissues')}
                  className="text-[11px] px-2 py-1 rounded font-bold border transition-colors cursor-pointer flex items-center gap-1 bg-[#042f2e] text-[#2dd4bf] border-[#0d9488] hover:bg-[#115e59]"
                  title="Open Ligament & Soft Tissue Strain Lab"
                >
                  <span>🧬 Soft Tissues</span>
                </button>
                <button
                  type="button"
                  title="Toggle Acoustic Biofeedback Chime on reaching target ROM"
                  onClick={() => {
                    const next = !audioBiofeedback;
                    setAudioBiofeedback(next);
                    if (next) playTargetReachedChime();
                  }}
                  className={`text-[11px] px-2 py-1 rounded font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                    audioBiofeedback
                      ? 'bg-teal-900/70 text-teal-300 border-teal-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <span>{audioBiofeedback ? '🔔 Biofeedback ON' : '🔕 Biofeedback OFF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlayingRange(!isPlayingRange)}
                  className={`text-xs px-3 py-1 rounded font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isPlayingRange
                      ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-300'
                      : 'bg-[#20b2aa] hover:bg-[#14b8a6] text-[#0b132b] border-[#fbbf24]'
                  }`}
                >
                  <span>{isPlayingRange ? '⏸ Pause Range' : '▶ Move Through Range'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">{currentMovement.minAngle}°</span>
              <input
                type="range"
                min={currentMovement.minAngle}
                max={currentMovement.maxAngle}
                value={angleDeg}
                onChange={(e) => setAngleDeg(parseInt(e.target.value))}
                className="flex-1 accent-[#20b2aa] cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
              <span className="text-[10px] text-slate-400 font-mono">{currentMovement.maxAngle}°</span>
            </div>
          </div>
        </div>

        {/* Tabs Control Area (Right on Desktop, Below on Phone) */}
        <div className="w-full lg:w-1/2 xl:w-5/12 flex-1 flex flex-col bg-[#081024] overflow-hidden">
          {/* Tabs Navigation Bar */}
          <div className="bg-[#0b132b] border-b border-slate-800 px-2 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            {[
              { key: 'spine_pathology', label: '🦴 Spine Pathologies' },
              { key: 'motion_analysis', label: '📷 Video & Marker Lab' },
              { key: 'load', label: 'Load & Torque' },
              { key: 'muscles', label: 'Muscles & Sharing' },
              { key: 'soft_tissues', label: '🧬 Ligaments & Soft Tissues' },
              { key: 'joint', label: 'Joint Info' },
              { key: 'accessory', label: 'Accessory Glides' },
              { key: 'weakness', label: 'Palsy Simulator' },
              { key: 'goniometry', label: 'Goniometry & MMT' },
              { key: 'closed_chain', label: 'Closed-Chain' },
              { key: 'exercises', label: 'Rehab & HEP Library' },
              { key: 'comparison', label: 'Progress Comparison' },
              { key: 'quiz', label: 'Clinical Quiz' },
              { key: 'ai_tutor', label: 'AI Clinical Tutor' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabKey)}
                  className={`text-xs px-2.5 py-1 rounded transition-colors whitespace-nowrap font-sans font-semibold border ${
                    isActive
                      ? 'bg-[#20b2aa] text-[#0b132b] font-bold border-[#fbbf24] shadow'
                      : 'bg-[#132247] text-slate-300 border-slate-700 hover:bg-[#1a2d5e]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {activeTab === 'load' && (
              <LoadTab
                joint={currentJoint}
                movement={currentMovement}
                angleDeg={angleDeg}
                bodyMassKg={bodyMassKg}
                setBodyMassKg={setBodyMassKg}
                loadKg={loadKg}
                setLoadKg={setLoadKg}
                extraResistanceNm={extraResistanceNm}
                setExtraResistanceNm={setExtraResistanceNm}
                contractionMode={contractionMode}
                setContractionMode={setContractionMode}
                patientPosition={patientPosition}
                setPatientPosition={setPatientPosition}
                biomechanics={biomechanics}
                muscleStrengthFactors={muscleStrengthFactors}
              />
            )}

            {activeTab === 'muscles' && (
              <MusclesTab
                jointId={currentJoint.id}
                movement={currentMovement}
                angleDeg={angleDeg}
                biomechanics={biomechanics}
                selectedMuscleId={selectedMuscleId}
                onSelectMuscle={setSelectedMuscleId}
                bodyMassKg={bodyMassKg}
                loadKg={loadKg}
                extraResistanceNm={extraResistanceNm}
                contractionMode={contractionMode}
                patientPosition={patientPosition}
                muscleStrengthFactors={muscleStrengthFactors}
              />
            )}

            {activeTab === 'soft_tissues' && (
              <SoftTissueTab
                joint={currentJoint}
                movement={currentMovement}
                angleDeg={angleDeg}
                onSelectSoftTissue={setSelectedSoftTissueId}
                selectedSoftTissueId={selectedSoftTissueId}
              />
            )}

            {activeTab === 'joint' && (
              <JointTab joint={currentJoint} movement={currentMovement} />
            )}

            {activeTab === 'accessory' && (
              <AccessoryTab
                joint={currentJoint}
                onTriggerGlideAnimation={setActiveAccessoryGlideVector}
                activeGlideId={activeGlideId}
                setActiveGlideId={setActiveGlideId}
              />
            )}

            {activeTab === 'weakness' && (
              <WeaknessTab
                movement={currentMovement}
                muscleStrengthFactors={muscleStrengthFactors}
                setMuscleStrengthFactors={setMuscleStrengthFactors}
                biomechanics={biomechanics}
              />
            )}

            {activeTab === 'goniometry' && (
              <GoniometryTab
                movement={currentMovement}
                showLandmarks={showLandmarks}
                setShowLandmarks={setShowLandmarks}
              />
            )}

            {activeTab === 'closed_chain' && <ClosedChainTab />}

            {activeTab === 'exercises' && (
              <ExerciseLibraryTab
                currentJointId={currentJoint.id}
                patientName={activePatient.name}
              />
            )}

            {activeTab === 'spine_pathology' && (
              <SpinePathologyTab
                currentPathology={spinePathology}
                onSelectPathology={setSpinePathology}
                angleDeg={angleDeg}
                bodyMassKg={bodyMassKg}
                loadKg={loadKg}
              />
            )}

            {activeTab === 'comparison' && <ComparisonTab />}

            {activeTab === 'quiz' && (
              <QuizTab
                onSelectMuscle={setSelectedMuscleId}
                setShowLandmarks={setShowLandmarks}
              />
            )}

            {activeTab === 'motion_analysis' && (
              <MotionAnalysisTab
                joint={currentJoint}
                movement={currentMovement}
                currentAngleDeg={angleDeg}
                onApplyAngleToModel={setAngleDeg}
                biomechanics={biomechanics}
              />
            )}

            {activeTab === 'ai_tutor' && (
              <AITutorTab
                joint={currentJoint}
                movement={currentMovement}
                angleDeg={angleDeg}
                loadKg={loadKg}
                selectedMuscleId={selectedMuscleId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
