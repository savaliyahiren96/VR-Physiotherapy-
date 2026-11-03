import React, { useState } from 'react';
import { EXERCISE_LIBRARY } from '../../data/exerciseLibrary';
import { ExerciseItem } from '../../types/exerciseAndPatient';
import { JointId } from '../../types/biomechanics';

interface ExerciseLibraryTabProps {
  currentJointId: JointId;
  patientName: string;
}

export const ExerciseLibraryTab: React.FC<ExerciseLibraryTabProps> = ({
  currentJointId,
  patientName,
}) => {
  const [selectedJoint, setSelectedJoint] = useState<string>(currentJointId);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(EXERCISE_LIBRARY[0]);

  // Home Exercise Program (HEP) Prescribed list
  const [prescribedExercises, setPrescribedExercises] = useState<{
    item: ExerciseItem;
    sets: number;
    reps: string;
    frequency: string;
  }[]>([
    {
      item: EXERCISE_LIBRARY[0],
      sets: 3,
      reps: '15 reps',
      frequency: 'Daily (2x/day)',
    },
    {
      item: EXERCISE_LIBRARY[1],
      sets: 3,
      reps: '10 reps/leg',
      frequency: '3 days/week',
    },
  ]);

  const [showHepModal, setShowHepModal] = useState<boolean>(false);

  // Filter exercises
  const filteredExercises = EXERCISE_LIBRARY.filter((ex) => {
    const matchesJoint = selectedJoint === 'all' || ex.jointId === selectedJoint;
    const matchesCat = selectedCategory === 'All' || ex.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.targetMuscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ex.indications.some((ind) => ind.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesJoint && matchesCat && matchesQuery;
  });

  const handleAddToHep = (item: ExerciseItem) => {
    if (prescribedExercises.some((p) => p.item.id === item.id)) {
      alert('This exercise is already in the prescribed Home Exercise Program.');
      return;
    }
    setPrescribedExercises((prev) => [
      ...prev,
      {
        item,
        sets: item.dosageDefault.sets,
        reps: item.dosageDefault.reps,
        frequency: item.dosageDefault.frequency,
      },
    ]);
  };

  const handleRemoveFromHep = (id: string) => {
    setPrescribedExercises((prev) => prev.filter((p) => p.item.id !== id));
  };

  return (
    <div className="space-y-4 text-slate-100 text-sm font-sans">
      {/* Header & Prescribed Count */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-[#20b2aa]/40 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide block">
            ClinicaAI Evidence-Based Exercise & Rehabilitation Library
          </span>
          <p className="text-xs text-slate-300 mt-0.5">
            Prescribe targeted corrective exercises, customize clinical dosage, and generate patient handouts.
          </p>
        </div>

        <button
          onClick={() => setShowHepModal(true)}
          className="px-3 py-1.5 bg-[#20b2aa] hover:bg-[#14b8a6] text-[#0b132b] font-bold text-xs rounded border border-[#fbbf24] shadow flex items-center gap-1.5 cursor-pointer"
        >
          <span>📋 View Prescribed HEP Handout</span>
          <span className="bg-[#0b132b] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {prescribedExercises.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 space-y-2">
        <div className="flex flex-wrap gap-2">
          {/* Joint Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Joint:</span>
            <select
              value={selectedJoint}
              onChange={(e) => setSelectedJoint(e.target.value)}
              className="bg-[#070e22] text-xs text-slate-200 border border-slate-700 rounded px-2 py-1 cursor-pointer"
            >
              <option value="all">All Joints</option>
              <option value="knee">Knee</option>
              <option value="shoulder">Shoulder</option>
              <option value="hip">Hip</option>
              <option value="ankle">Ankle & Foot</option>
              <option value="elbow">Elbow</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Type:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#070e22] text-xs text-slate-200 border border-slate-700 rounded px-2 py-1 cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Strengthening">Strengthening</option>
              <option value="Neuromuscular & Motor Control">Neuromuscular / Motor Control</option>
              <option value="Mobility & Stretching">Mobility & Stretching</option>
              <option value="Balance & Proprioception">Balance & Proprioception</option>
            </select>
          </div>

          {/* Search Box */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercise, muscle, or condition (e.g., 'valgus', 'VMO', 'Achilles')..."
            className="flex-1 min-w-[200px] bg-[#070e22] text-xs text-slate-200 border border-slate-700 rounded px-2.5 py-1 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Two-Column Explorer: List on Left, Detail on Right */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Exercise Card List */}
        <div className="md:col-span-2 space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredExercises.map((ex) => {
            const isSelected = selectedExercise?.id === ex.id;
            const isPrescribed = prescribedExercises.some((p) => p.item.id === ex.id);

            return (
              <div
                key={ex.id}
                onClick={() => setSelectedExercise(ex)}
                className={`p-2.5 rounded border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#12234f] border-[#fbbf24] shadow'
                    : 'bg-[#0b1633] border-slate-700/80 hover:border-teal-500/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-teal-300 font-bold uppercase block">
                      {ex.category}
                    </span>
                    <strong className="text-white text-xs block mt-0.5">{ex.name}</strong>
                  </div>
                  {isPrescribed && (
                    <span className="text-[9px] bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded border border-teal-600">
                      ✓ Prescribed
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  Muscles: {ex.targetMuscles.join(', ')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Exercise Detail Card */}
        <div className="md:col-span-3 bg-[#0b1633] p-3.5 rounded border border-slate-700/80 space-y-3">
          {selectedExercise ? (
            <>
              <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-teal-950 text-teal-300 font-bold px-2 py-0.5 rounded border border-teal-700 uppercase">
                      {selectedExercise.jointId} • {selectedExercise.difficulty}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{selectedExercise.name}</h3>
                  <div className="text-xs text-[#fbbf24] font-medium mt-0.5">
                    Target Muscles: {selectedExercise.targetMuscles.join(', ')}
                  </div>
                </div>

                <button
                  onClick={() => handleAddToHep(selectedExercise)}
                  className="px-3 py-1.5 bg-[#20b2aa] hover:bg-[#14b8a6] text-[#0b132b] font-bold text-xs rounded border border-[#fbbf24] shadow cursor-pointer shrink-0"
                >
                  + Add to Patient HEP
                </button>
              </div>

              {/* Instructions */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-300 uppercase">Technique Instructions:</span>
                <ol className="list-decimal pl-4 text-xs text-slate-300 space-y-1">
                  {selectedExercise.techniqueInstructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* Clinical Cues */}
              <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-amber-300 block">Attending Physiotherapist Cues:</span>
                <div className="flex flex-wrap gap-1.5 text-xs text-slate-200">
                  {selectedExercise.clinicalCues.map((cue, i) => (
                    <span key={i} className="bg-[#0f1d40] px-2 py-0.5 rounded border border-slate-700 italic">
                      🗣 {cue}
                    </span>
                  ))}
                </div>
              </div>

              {/* Equipment & Default Dosage */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#070e22] p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">Equipment Needed:</span>
                  <span className="text-slate-200">{selectedExercise.equipmentNeeded}</span>
                </div>
                <div className="bg-[#070e22] p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">Standard Clinical Dosage:</span>
                  <span className="text-teal-300 font-semibold">
                    {selectedExercise.dosageDefault.sets} sets × {selectedExercise.dosageDefault.reps} ({selectedExercise.dosageDefault.frequency})
                  </span>
                </div>
              </div>

              {/* Progression / Regression */}
              <div className="text-xs text-slate-300 space-y-1 pt-1 border-t border-slate-800">
                <div>
                  <strong className="text-emerald-400">Progression:</strong> {selectedExercise.progression}
                </div>
                <div>
                  <strong className="text-amber-400">Regression:</strong> {selectedExercise.regression}
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center p-8">Select an exercise to inspect details.</p>
          )}
        </div>
      </div>

      {/* Home Exercise Program (HEP) Handout Modal */}
      {showHepModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0b132b] border border-[#20b2aa] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#fbbf24]">Patient Home Exercise Program (HEP) Handout</h3>
                <div className="text-xs text-slate-400">
                  Prescribed for: <strong className="text-white">{patientName}</strong> | Date: {new Date().toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => setShowHepModal(false)}
                className="text-slate-400 hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {prescribedExercises.length === 0 ? (
              <p className="text-xs text-slate-400 p-6 text-center">
                No exercises added yet. Browse the library and click "+ Add to Patient HEP".
              </p>
            ) : (
              <div className="space-y-3">
                {prescribedExercises.map((pex, index) => (
                  <div key={pex.item.id} className="bg-[#070e22] p-3 rounded border border-slate-800 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] text-teal-300 font-bold uppercase">
                          Exercise #{index + 1} • {pex.item.category}
                        </span>
                        <h4 className="text-sm font-bold text-white">{pex.item.name}</h4>
                      </div>
                      <button
                        onClick={() => handleRemoveFromHep(pex.item.id)}
                        className="text-xs text-red-400 hover:text-red-300 font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {pex.item.techniqueInstructions[0]} {pex.item.techniqueInstructions[1] || ''}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs bg-[#0b1633] p-2 rounded border border-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Sets:</span>
                        <input
                          type="number"
                          value={pex.sets}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setPrescribedExercises((prev) =>
                              prev.map((p) => (p.item.id === pex.item.id ? { ...p, sets: val } : p))
                            );
                          }}
                          className="w-14 bg-[#070e22] text-xs text-white border border-slate-700 rounded px-1.5 py-0.5"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Reps / Hold:</span>
                        <input
                          type="text"
                          value={pex.reps}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPrescribedExercises((prev) =>
                              prev.map((p) => (p.item.id === pex.item.id ? { ...p, reps: val } : p))
                            );
                          }}
                          className="w-24 bg-[#070e22] text-xs text-white border border-slate-700 rounded px-1.5 py-0.5"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Frequency:</span>
                        <input
                          type="text"
                          value={pex.frequency}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPrescribedExercises((prev) =>
                              prev.map((p) => (p.item.id === pex.item.id ? { ...p, frequency: val } : p))
                            );
                          }}
                          className="w-32 bg-[#070e22] text-xs text-white border border-slate-700 rounded px-1.5 py-0.5"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-amber-300 italic">
                      Key Reminder: {pex.item.clinicalCues[0]}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-700 pt-3">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-[#20b2aa] text-[#0b132b] font-bold text-xs rounded cursor-pointer"
              >
                🖨 Print Patient HEP Handout
              </button>
              <button
                onClick={() => setShowHepModal(false)}
                className="px-3 py-1.5 bg-[#132247] text-slate-200 text-xs rounded border border-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
