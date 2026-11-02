import React, { useState } from 'react';

interface ExerciseModel {
  id: string;
  name: string;
  description: string;
  kneeAngleDeg: number;
  ankleAngleDeg: number;
  quadricepsForceN: number;
  plantarflexorForceN: number;
  kneeTorqueNm: number;
  ankleTorqueNm: number;
  groundReactionForceN: number;
  biomechanicalInsight: string;
  leverClassExplanation: string;
}

export const ClosedChainTab: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<string>('squat');
  const [depthPercent, setDepthPercent] = useState<number>(50); // 0 to 100%

  const exercises: ExerciseModel[] = [
    {
      id: 'squat',
      name: 'Bilateral Squat (Closed Kinetic Chain)',
      description: 'Feet fixed to ground, center of mass translates vertically. Distal segment (foot) fixed, femur and tibia rotate simultaneously.',
      kneeAngleDeg: Math.round(20 + (depthPercent / 100) * 80), // 20° to 100° flexion
      ankleAngleDeg: Math.round(5 + (depthPercent / 100) * 20), // 5° to 25° dorsiflexion
      kneeTorqueNm: Number((45 + (depthPercent / 100) * 115).toFixed(1)), // Up to ~160 N·m
      ankleTorqueNm: Number((30 + (depthPercent / 100) * 65).toFixed(1)),
      quadricepsForceN: Math.round(1100 + (depthPercent / 100) * 2600), // Up to 3700 N
      plantarflexorForceN: Math.round(600 + (depthPercent / 100) * 1200),
      groundReactionForceN: 588, // ~60 kg body weight shared across legs (or per leg)
      biomechanicalInsight: 'In closed kinetic chain squatting, co-contraction of hamstrings and quadriceps significantly reduces anterior tibial shear force compared to seated open-chain knee extension. The posterior pull of the hamstrings neutralizes the anterior cruciate ligament (ACL) strain!',
      leverClassExplanation: 'Converts the lower extremity into a system of interdependent multi-articular levers. The ground reaction force vector passes between the knee and hip, causing concurrent knee flexion torque and hip flexion torque that must be balanced simultaneously by quadriceps and gluteus maximus.',
    },
    {
      id: 'step_up',
      name: 'Unilateral Step-Up (Closed Kinetic Chain)',
      description: 'Single limb supporting full body mass ascending a 20 cm step. Requires maximal unilateral hip and knee extensor recruitment.',
      kneeAngleDeg: Math.round(30 + (depthPercent / 100) * 50),
      ankleAngleDeg: Math.round(10 + (depthPercent / 100) * 15),
      kneeTorqueNm: Number((70 + (depthPercent / 100) * 110).toFixed(1)),
      ankleTorqueNm: Number((45 + (depthPercent / 100) * 75).toFixed(1)),
      quadricepsForceN: Math.round(1800 + (depthPercent / 100) * 2400),
      plantarflexorForceN: Math.round(1000 + (depthPercent / 100) * 1100),
      groundReactionForceN: 680,
      biomechanicalInsight: 'Demands tremendous eccentric-concentric transition. Requires intense frontal plane stabilization from the Gluteus Medius to prevent contralateral Trendelenburg pelvic drop while ascending.',
      leverClassExplanation: 'Unilateral stance shifts the fulcrum directly over the supporting foot. Mechanical advantage favors joint stability and functional proprioceptive loading over single-joint isolation.',
    },
    {
      id: 'heel_raise',
      name: 'Standing Bilateral Heel Raise (Closed Kinetic Chain)',
      description: 'Classic physiological 2nd Class Lever: Metatarsophalangeal joints act as fulcrum, body weight falls through talus, effort applied at calcaneus.',
      kneeAngleDeg: 0,
      ankleAngleDeg: Math.round(10 + (depthPercent / 100) * 35), // Plantarflexion
      kneeTorqueNm: 15,
      ankleTorqueNm: Number((80 + (depthPercent / 100) * 90).toFixed(1)),
      quadricepsForceN: 200,
      plantarflexorForceN: Math.round(2100 + (depthPercent / 100) * 1900), // Soleus & Gastrocnemius
      groundReactionForceN: 588,
      biomechanicalInsight: 'The foot acts as a rigid lever due to the Windlass mechanism (plantar fascia tightening as toes extend). The soleus generates massive compressive forces to stabilize the tibiofibular mortise against talar rotation.',
      leverClassExplanation: '2nd Class Lever (Load between Fulcrum and Effort). Effort arm (Achilles to MTP joints) is longer than load arm (Talus to MTP joints), producing a mechanical advantage MA > 1.0! This allows a 60 kg person to hoist their full weight on their toes effortlessly.',
    },
  ];

  const current = exercises.find((e) => e.id === selectedExercise) || exercises[0];

  return (
    <div className="space-y-4 text-slate-100 text-sm">
      {/* Exercise Selector */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80">
        <label className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide block mb-2">
          Select Closed-Chain Weight-Bearing Task
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedExercise(ex.id)}
              className={`p-2 rounded text-xs font-semibold border transition-colors cursor-pointer text-center ${
                selectedExercise === ex.id
                  ? 'bg-[#20b2aa] text-[#0b132b] border-[#fbbf24] shadow'
                  : 'bg-[#132247] text-slate-300 border-slate-700 hover:bg-[#1a2d5e]'
              }`}
            >
              {ex.name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Task Depth / Range Slider */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-medium">Task Depth & Joint Angle:</span>
          <span className="font-bold text-[#fbbf24]">
            Knee: {current.kneeAngleDeg}° | Ankle: {current.ankleAngleDeg}°
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={depthPercent}
          onChange={(e) => setDepthPercent(parseInt(e.target.value))}
          className="w-full accent-[#20b2aa] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Initial Contact / Neutral</span>
          <span>50% Mid-Phase</span>
          <span>Maximum Terminal Depth</span>
        </div>
      </div>

      {/* Real-time Closed-Chain Torques & Forces */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#0b1633] p-2.5 rounded border border-slate-700/80">
          <span className="text-[10px] uppercase text-slate-400 block">Knee External Flexion Torque</span>
          <div className="text-lg font-bold text-[#fbbf24]">
            {current.kneeTorqueNm} <span className="text-xs font-normal">N·m</span>
          </div>
          <div className="text-[10px] text-teal-300 mt-0.5">
            Quadriceps Force: <strong>{current.quadricepsForceN} N</strong>
          </div>
        </div>

        <div className="bg-[#0b1633] p-2.5 rounded border border-slate-700/80">
          <span className="text-[10px] uppercase text-slate-400 block">Ankle Plantarflexion Torque</span>
          <div className="text-lg font-bold text-[#fbbf24]">
            {current.ankleTorqueNm} <span className="text-xs font-normal">N·m</span>
          </div>
          <div className="text-[10px] text-teal-300 mt-0.5">
            Triceps Surae Force: <strong>{current.plantarflexorForceN} N</strong>
          </div>
        </div>
      </div>

      {/* Open-Chain vs Closed-Chain Comparative Analysis */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 space-y-2">
        <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide block">
          Open-Chain vs Closed-Chain Biomechanical Contrast
        </span>

        <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 text-xs">
          <strong className="text-[#20b2aa] block mb-1">Lever Mechanics & Ground Reaction Force:</strong>
          <p className="text-slate-300 leading-relaxed text-[11px]">{current.leverClassExplanation}</p>
        </div>

        <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 text-xs">
          <strong className="text-amber-300 block mb-1">Joint Stability & Co-Contraction:</strong>
          <p className="text-slate-300 leading-relaxed text-[11px]">{current.biomechanicalInsight}</p>
        </div>
      </div>
    </div>
  );
};
