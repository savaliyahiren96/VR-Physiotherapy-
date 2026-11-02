/**
 * ClinicaAI Clinical Assessment, Movement Recognition & Biomechanical Prefill Types
 */

export type MovementCategory = 'Lower Limb' | 'Upper Limb' | 'Postural Assessment';

export type MovementPhase =
  | 'Initial Setup / Neutral'
  | 'Eccentric Descent'
  | 'Transition / Bottom Turnaround'
  | 'Concentric Ascent'
  | 'Terminal Stance / Lockout'
  | 'Heel Strike'
  | 'Loading Response'
  | 'Midstance'
  | 'Terminal Stance'
  | 'Pre-Swing'
  | 'Swing Phase';

export interface SkeletonLandmark {
  id: string;
  name: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  visibility: number; // 0 to 1
  jointGroup: 'head' | 'torso' | 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg';
}

export interface SkeletonBone {
  fromId: string;
  toId: string;
  label?: string;
}

export interface MovementAbnormality {
  id: string;
  name: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  confidence: number; // 0 to 1
  observedEvidence: string;
  contributingFactors: string[];
  affectedSegment: 'Trunk' | 'Pelvis' | 'Hip' | 'Knee' | 'Ankle' | 'Foot' | 'Shoulder' | 'Elbow';
}

export type FieldSource = 'AI Generated' | 'Video Observed' | 'Clinician Confirmed' | 'Manually Edited';

export interface AssessmentField<T = string | number> {
  value: T;
  source: FieldSource;
  confidence?: number;
  notes?: string;
}

export interface MovementIdentificationData {
  movementName: AssessmentField<string>;
  category: MovementCategory;
  confidence: number;
  cameraView: 'Anterior' | 'Posterior' | 'Lateral (Sagittal)' | 'Oblique';
  repetitionCount: AssessmentField<number>;
  durationSeconds: AssessmentField<number>;
  cadenceOrSpeed: AssessmentField<string>;
  activePhases: AssessmentField<string>;
  leftRightSymmetryPercent: AssessmentField<number>;
}

export interface BiomechanicalAssessmentData {
  trunkAlignment: AssessmentField<string>;
  pelvicMovement: AssessmentField<string>;
  hipMechanics: AssessmentField<string>;
  kneeMechanics: AssessmentField<string>;
  ankleMechanics: AssessmentField<string>;
  footPosture: AssessmentField<string>;
  segmentalCoordination: AssessmentField<string>;
  weightBearingSymmetry: AssessmentField<string>;
  dynamicStability: AssessmentField<string>;
  measuredPrimaryAngleDeg: AssessmentField<number>;
  contralateralAngleDeg?: AssessmentField<number>;
}

export interface ClinicalFindingsData {
  observedAbnormalities: MovementAbnormality[];
  functionalLimitations: AssessmentField<string>;
  possibleContributingFactors: AssessmentField<string>;
  compensatoryStrategies: AssessmentField<string>;
  recommendedPhysicalTests: AssessmentField<string[]>;
  estimatedMmtGrade: AssessmentField<number>;
}

export interface RehabilitationRecommendationsData {
  mobilityExercises: AssessmentField<string[]>;
  strengtheningExercises: AssessmentField<string[]>;
  neuromuscularTraining: AssessmentField<string[]>;
  balanceProprioception: AssessmentField<string[]>;
  gaitOrFunctionalRetraining: AssessmentField<string[]>;
  patientEducation: AssessmentField<string>;
}

export interface PatientAssessmentRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  movementName: string;
  category: MovementCategory;
  identification: MovementIdentificationData;
  biomechanics: BiomechanicalAssessmentData;
  findings: ClinicalFindingsData;
  rehabilitation: RehabilitationRecommendationsData;
  clinicianNotes: string;
  status: 'Draft (AI Prefilled)' | 'Clinician Approved' | 'Archived';
  approvedBy?: string;
  videoThumbnailUrl?: string;
}
