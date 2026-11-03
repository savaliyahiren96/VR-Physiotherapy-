import { JointId } from './biomechanics';

export interface ExerciseItem {
  id: string;
  name: string;
  jointId: JointId;
  category: 'Mobility & Stretching' | 'Strengthening' | 'Neuromuscular & Motor Control' | 'Balance & Proprioception' | 'Functional Retraining';
  targetMuscles: string[];
  equipmentNeeded: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  indications: string[];
  contraindications: string[];
  dosageDefault: {
    sets: number;
    reps: string;
    holdSeconds?: number;
    frequency: string;
  };
  techniqueInstructions: string[];
  clinicalCues: string[];
  progression: string;
  regression: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  diagnosis: string;
  involvedJoint: JointId;
  affectedSide: 'Right' | 'Left' | 'Bilateral';
  onsetDate: string;
  physiotherapist: string;
  goalROM: string;
  status: 'Initial Assessment' | 'Active Rehabilitation' | 'Pre-Discharge' | 'Discharged';
}

export interface GaitPhaseBreakdown {
  phaseName: string;
  percentOfGaitCycle: string;
  normalHipAngleDeg: number;
  normalKneeAngleDeg: number;
  normalAnkleAngleDeg: number;
  criticalMuscleAction: string;
  clinicalSignificance: string;
}
