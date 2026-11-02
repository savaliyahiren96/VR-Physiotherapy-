/**
 * Biomechanical & Anatomical Type Definitions for VR AI Physiotherapy
 */

export type JointId = 'shoulder' | 'elbow' | 'hip' | 'knee' | 'ankle';

export type MovementId =
  // Shoulder
  | 'shoulder_flexion'
  | 'shoulder_extension'
  | 'shoulder_abduction'
  | 'shoulder_adduction'
  | 'shoulder_medial_rotation'
  | 'shoulder_lateral_rotation'
  // Elbow & Forearm
  | 'elbow_flexion'
  | 'elbow_extension'
  | 'forearm_pronation'
  | 'forearm_supination'
  // Hip
  | 'hip_flexion'
  | 'hip_extension'
  | 'hip_abduction'
  | 'hip_adduction'
  | 'hip_medial_rotation'
  | 'hip_lateral_rotation'
  // Knee
  | 'knee_flexion'
  | 'knee_extension'
  // Ankle & Foot
  | 'ankle_dorsiflexion'
  | 'ankle_plantarflexion'
  | 'foot_inversion'
  | 'foot_eversion';

export type PatientPosition = 'standing' | 'sitting' | 'supine' | 'prone' | 'side_lying';

export type ContractionMode = 'producing' | 'holding';

export type LeverClass = '1st Class' | '2nd Class' | '3rd Class';

export interface MuscleDefinition {
  id: string;
  name: string;
  role: 'Prime Mover' | 'Synergist';
  origin: string;
  insertion: string;
  nerveRoot: string;
  peakForceN: number; // Published Fmax in Newtons
  sourceCitation: string;
  isVerified: boolean;
  // Relative coordinates in 3D for procedural bone origin & insertion
  originCoords: [number, number, number];
  insertionCoords: [number, number, number];
  // Rest length (m)
  restLengthM: number;
}

export interface AccessoryGlide {
  id: string;
  name: string;
  indication: string;
  patientPosition: string;
  technique: string;
  directionVector: [number, number, number]; // Direction for 3D animation
}

export interface MMTGrade {
  grade: number;
  label: string;
  description: string;
}

export interface GoniometryGuide {
  fulcrum: string;
  stationaryArm: string;
  movingArm: string;
  patientPosition: string;
  stabilization: string;
  normalAaosRange: string;
  landmarks: { name: string; position: [number, number, number] }[];
  mmtGrades: MMTGrade[];
}

export interface MovementDefinition {
  id: MovementId;
  name: string;
  minAngle: number;
  maxAngle: number;
  normalRangeText: string;
  defaultAngle: number;
  planeAndAxis: string;
  leverClass: LeverClass;
  endFeel: {
    normal: string;
    pathological: string;
  };
  muscles: MuscleDefinition[];
  goniometry: GoniometryGuide;
  validPositions: PatientPosition[];
  defaultPosition: PatientPosition;
}

export interface JointDefinition {
  id: JointId;
  name: string;
  jointType: string;
  closePackedPosition: string;
  restingPosition: string;
  capsularPattern: string;
  convexConcaveRule: string;
  movements: MovementDefinition[];
  accessoryGlides: AccessoryGlide[];
}

export interface MuscleCalculatedState {
  muscle: MuscleDefinition;
  momentArmM: number;
  forceN: number;
  sharePercent: number;
  effortPercent: number; // Force / Fmax
  currentLengthM: number;
  lengthRatio: number; // currentLength / restLength
  isShortened: boolean;
  anglePullDeg: number;
  rotaryForceN: number;
  stabilizingForceN: number;
}

export interface BiomechanicalSummary {
  angleDeg: number;
  netTorqueNm: number;
  limbTorqueNm: number;
  loadTorqueNm: number;
  extraResistanceTorqueNm: number;
  gravityClassification: 'Against Gravity' | 'Gravity Minimised' | 'Gravity Assisted';
  muscleCalculations: MuscleCalculatedState[];
  totalMuscleTorqueNm: number;
  momentArmM: number; // Net effective moment arm
  primaryMuscleForceN: number;
  jointReactionForceN: number;
  leverClass: LeverClass;
  mechanicalAdvantage: number;
  isCapacityExceeded: boolean;
  capacityDeficitNm: number;
}

export interface NervePalsyPreset {
  id: string;
  name: string;
  description: string;
  weakenedMuscles: Record<string, number>; // muscleId -> strength ratio (0 to 1)
}
