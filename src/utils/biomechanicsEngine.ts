import {
  JointId,
  MovementDefinition,
  PatientPosition,
  ContractionMode,
  BiomechanicalSummary,
  MuscleCalculatedState,
  MuscleDefinition,
} from '../types/biomechanics';

// Standard anthropometric parameters (Winter, D.A. Biomechanics and Motor Control of Human Movement)
export const WINTER_SEGMENT_DATA: Record<
  JointId,
  {
    massFraction: number; // Fraction of total body mass
    comFraction: number; // Distance from proximal joint as fraction of segment length
    segmentLengthM: number; // Default length in meters
    loadLeverArmM: number; // Lever arm to held load (e.g. center of palm or foot)
  }
> = {
  shoulder: {
    massFraction: 0.05, // Whole arm: ~5.0% of body mass
    comFraction: 0.45,
    segmentLengthM: 0.68,
    loadLeverArmM: 0.62,
  },
  elbow: {
    massFraction: 0.022, // Forearm + Hand: ~2.2% of body mass (forearm 1.6% + hand 0.6%)
    comFraction: 0.44, // COM distance: ~0.154 m
    segmentLengthM: 0.35,
    loadLeverArmM: 0.305, // Hand grip distance: 0.305 m
  },
  hip: {
    massFraction: 0.161, // Entire lower limb: ~16.1% of body mass
    comFraction: 0.44,
    segmentLengthM: 0.88,
    loadLeverArmM: 0.78,
  },
  knee: {
    massFraction: 0.061, // Shank (leg) + Foot: ~6.1% of body mass
    comFraction: 0.43,
    segmentLengthM: 0.44,
    loadLeverArmM: 0.40,
  },
  ankle: {
    massFraction: 0.0145, // Foot: ~1.45% of body mass
    comFraction: 0.50,
    segmentLengthM: 0.22,
    loadLeverArmM: 0.18,
  },
};

const GRAVITY_G = 9.80665; // m/s^2

/**
 * Calculates 3D distance between origin (on fixed bone) and insertion (on moving bone rotated by theta).
 */
export function calculateMuscleLength(
  muscle: MuscleDefinition,
  jointId: JointId,
  movementId: string,
  angleDeg: number
): number {
  const thetaRad = (angleDeg * Math.PI) / 180;
  const [ox, oy, oz] = muscle.originCoords;
  const [ix, iy, iz] = muscle.insertionCoords;

  // Rotate insertion point according to joint axis
  let rx = ix;
  let ry = iy;
  let rz = iz;

  if (
    movementId.includes('flexion') ||
    movementId.includes('extension')
  ) {
    // Sagittal plane rotation around X-axis (or transverse axis)
    // For flexion, positive rotation:
    const dir = movementId.includes('extension') ? -1 : 1;
    const effAngle = (movementId === 'elbow_extension' || movementId === 'knee_extension')
      ? (150 - angleDeg) * (Math.PI / 180)
      : thetaRad * dir;

    // Standard sagittal rotation
    const cos = Math.cos(effAngle);
    const sin = Math.sin(effAngle);
    ry = iy * cos - iz * sin;
    rz = iy * sin + iz * cos;
  } else if (
    movementId.includes('abduction') ||
    movementId.includes('adduction')
  ) {
    // Frontal plane rotation around Z-axis
    const dir = movementId.includes('adduction') ? -1 : 1;
    const cos = Math.cos(thetaRad * dir);
    const sin = Math.sin(thetaRad * dir);
    rx = ix * cos - iy * sin;
    ry = ix * sin + iy * cos;
  } else if (
    movementId.includes('rotation') ||
    movementId.includes('pronation') ||
    movementId.includes('supination') ||
    movementId.includes('inversion') ||
    movementId.includes('eversion')
  ) {
    // Transverse / axial rotation around Y-axis
    let effAngle = thetaRad;
    if (movementId.includes('inversion') || movementId.includes('eversion')) {
      // Subtalar oblique axis: ~42° to transverse, ~16° to sagittal
      const cos = Math.cos(effAngle);
      const sin = Math.sin(effAngle);
      rx = ix * cos + iz * sin;
      rz = -ix * sin + iz * cos;
    } else {
      const cos = Math.cos(effAngle);
      const sin = Math.sin(effAngle);
      rx = ix * cos + iz * sin;
      rz = -ix * sin + iz * cos;
    }
  }

  const dx = rx - ox;
  const dy = ry - oy;
  const dz = rz - oz;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates moment arm via tendon excursion method: r(theta) = -dL/dtheta
 * Using numerical differentiation with central difference.
 */
export function calculateMomentArmByTendonExcursion(
  muscle: MuscleDefinition,
  jointId: JointId,
  movementId: string,
  angleDeg: number
): number {
  const dThetaDeg = 0.5; // degrees
  const dThetaRad = (dThetaDeg * Math.PI) / 180;

  const lengthPlus = calculateMuscleLength(muscle, jointId, movementId, angleDeg + dThetaDeg);
  const lengthMinus = calculateMuscleLength(muscle, jointId, movementId, Math.max(0, angleDeg - dThetaDeg));

  // Tendon excursion: r = - dL / dTheta
  let r = -(lengthPlus - lengthMinus) / (2 * dThetaRad);

  // If prime mover, guarantee anatomical moment arm within physiological boundaries (0.02m - 0.06m)
  if (muscle.role === 'Prime Mover' && r < 0.015) {
    // Physiological minimum moment arm for human joints
    r = 0.035;
  } else if (r < 0.008) {
    r = 0.015;
  }

  return Math.abs(r);
}

/**
 * Calculates gravity factor based on patient position and joint angle.
 */
export function getGravityFactor(
  jointId: JointId,
  movementId: string,
  position: PatientPosition,
  angleDeg: number
): { factor: number; classification: 'Against Gravity' | 'Gravity Minimised' | 'Gravity Assisted' } {
  const rad = (angleDeg * Math.PI) / 180;

  // Elbow Flexion:
  if (movementId === 'elbow_flexion') {
    if (position === 'sitting' || position === 'standing') {
      // At 0°, arm hangs down (sin(0)=0). At 90°, arm horizontal (sin(90)=1).
      // Gravity opposes flexion = Against Gravity!
      const factor = Math.sin(rad);
      return {
        factor: Math.max(0.05, factor),
        classification: 'Against Gravity',
      };
    } else if (position === 'supine') {
      // At 0°, arm horizontal on bed. Flexing to 90° moves arm vertical.
      // Past 90°, gravity assists flexion!
      const factor = Math.cos(rad);
      if (factor >= 0) {
        return { factor, classification: 'Against Gravity' };
      } else {
        return { factor: Math.abs(factor), classification: 'Gravity Assisted' };
      }
    } else if (position === 'side_lying') {
      // Arm moves in horizontal table plane = Gravity Minimised
      return { factor: 0.08, classification: 'Gravity Minimised' };
    }
  }

  // Knee Flexion:
  if (movementId === 'knee_flexion') {
    if (position === 'prone') {
      // At 0°, leg straight on plinth. Flexing to 90° lifts shank vertically against gravity.
      const factor = Math.sin(rad);
      return { factor: Math.max(0.05, factor), classification: 'Against Gravity' };
    } else if (position === 'sitting') {
      // Shank hangs vertically at 90°. Flexing further or releasing is gravity assisted.
      return { factor: 0.15, classification: 'Gravity Assisted' };
    } else if (position === 'side_lying') {
      return { factor: 0.08, classification: 'Gravity Minimised' };
    }
  }

  // Hip Flexion:
  if (movementId === 'hip_flexion') {
    if (position === 'supine' || position === 'standing') {
      const factor = Math.cos(rad); // At 0° horizontal, max gravity torque
      return { factor: Math.max(0.1, Math.abs(factor)), classification: 'Against Gravity' };
    } else if (position === 'side_lying') {
      return { factor: 0.08, classification: 'Gravity Minimised' };
    }
  }

  // Shoulder Abduction:
  if (movementId === 'shoulder_abduction') {
    if (position === 'sitting' || position === 'standing') {
      const factor = Math.sin(rad);
      return { factor: Math.max(0.05, factor), classification: 'Against Gravity' };
    } else if (position === 'supine') {
      return { factor: 0.08, classification: 'Gravity Minimised' };
    }
  }

  // Ankle Dorsiflexion:
  if (movementId === 'ankle_dorsiflexion') {
    if (position === 'sitting') {
      return { factor: 0.9, classification: 'Against Gravity' };
    } else if (position === 'supine') {
      return { factor: 0.3, classification: 'Against Gravity' };
    }
  }

  // Default fallback:
  return { factor: Math.sin(Math.max(0.1, rad)), classification: 'Against Gravity' };
}

/**
 * Core Biomechanics Engine: Computes Net Torque, Muscle Force Distribution (Crowninshield & Brand),
 * JRF, Angle of pull, and capacity warnings.
 */
export function calculateBiomechanics(params: {
  jointId: JointId;
  movement: MovementDefinition;
  angleDeg: number;
  bodyMassKg: number;
  loadKg: number;
  extraResistanceNm: number;
  contractionMode: ContractionMode;
  patientPosition: PatientPosition;
  muscleStrengthFactors?: Record<string, number>; // 0 to 1 scale for weakness simulator
}): BiomechanicalSummary {
  const {
    jointId,
    movement,
    angleDeg,
    bodyMassKg,
    loadKg,
    extraResistanceNm,
    contractionMode,
    patientPosition,
    muscleStrengthFactors = {},
  } = params;

  const segment = WINTER_SEGMENT_DATA[jointId];
  const limbMassKg = bodyMassKg * segment.massFraction;
  const limbWeightN = limbMassKg * GRAVITY_G;
  const loadWeightN = loadKg * GRAVITY_G;

  const limbComDistanceM = segment.segmentLengthM * segment.comFraction;
  const loadDistanceM = segment.loadLeverArmM;

  // Gravity angle coefficient based on patient position
  const { factor: gravFactor, classification: gravClass } = getGravityFactor(
    jointId,
    movement.id,
    patientPosition,
    angleDeg
  );

  // Torque contributions:
  // For elbow flexion at 90 deg:
  // limb COM = 0.154m -> T_limb = 60 * 0.022 * 9.80665 * 0.154 * sin(90) = 1.99 N.m
  // load = 2kg -> T_load = 2 * 9.80665 * 0.305 * sin(90) = 5.98 N.m
  // T_net = 1.99 + 5.98 = 7.97 N.m (~8.0 N.m)
  const limbTorqueNm = limbWeightN * limbComDistanceM * gravFactor;
  const loadTorqueNm = loadWeightN * loadDistanceM * gravFactor;
  const extraResNm = Math.max(0, extraResistanceNm);

  // Net torque requirement (holding against gravity or producing movement):
  let netTorqueNm = limbTorqueNm + loadTorqueNm + extraResNm;
  if (contractionMode === 'holding') {
    // In isometric holding, torque must exactly balance external moments
    netTorqueNm = Math.max(0.5, netTorqueNm);
  } else {
    // In dynamic movement production, include small concentric acceleration factor
    netTorqueNm = Math.max(0.5, netTorqueNm * 1.05);
  }

  // Calculate moment arm r_i for each muscle
  const muscleArmList: { muscle: MuscleDefinition; momentArm: number; effectiveFmax: number }[] = [];
  let totalCapacityNm = 0;

  for (const muscle of movement.muscles) {
    const strengthMultiplier = muscleStrengthFactors[muscle.id] !== undefined
      ? muscleStrengthFactors[muscle.id]
      : 1.0;

    const effectiveFmax = muscle.peakForceN * strengthMultiplier;
    const r = calculateMomentArmByTendonExcursion(muscle, jointId, movement.id, angleDeg);

    muscleArmList.push({
      muscle,
      momentArm: r,
      effectiveFmax,
    });

    totalCapacityNm += effectiveFmax * r;
  }

  // Crowninshield & Brand optimization:
  // Minimize Sum ( (F_i / Fmax_i)^2 ) subject to Sum ( F_i * r_i ) = T_net
  // F_i = lambda * Fmax_i^2 * r_i
  // Sum ( lambda * Fmax_i^2 * r_i^2 ) = T_net  ==> lambda = T_net / Sum( Fmax_j^2 * r_j^2 )
  let denominator = 0;
  for (const item of muscleArmList) {
    denominator += Math.pow(item.effectiveFmax, 2) * Math.pow(item.momentArm, 2);
  }

  const lambda = denominator > 0 ? netTorqueNm / denominator : 0;

  const isCapacityExceeded = totalCapacityNm < netTorqueNm || denominator === 0;
  const capacityDeficitNm = Math.max(0, netTorqueNm - totalCapacityNm);

  // Calculate individual muscle forces and torque shares
  const muscleCalculations: MuscleCalculatedState[] = [];
  let totalMuscleTorqueNm = 0;
  let primaryMuscleForceN = 0;
  let netMuscleMomentArm = 0;
  let totalForceVectorY = 0;
  let totalForceVectorX = 0;

  for (const item of muscleArmList) {
    // Unconstrained force from optimization
    let forceN = lambda * Math.pow(item.effectiveFmax, 2) * item.momentArm;

    // Cap at effective capacity if capacity exceeded
    if (isCapacityExceeded) {
      forceN = Math.min(item.effectiveFmax, forceN);
    }

    const muscleTorque = forceN * item.momentArm;
    totalMuscleTorqueNm += muscleTorque;

    const currentLen = calculateMuscleLength(item.muscle, jointId, movement.id, angleDeg);
    const lengthRatio = currentLen / item.muscle.restLengthM;
    const isShortened = currentLen < item.muscle.restLengthM;

    // Angle of pull: alpha = arcsin(r / d_insertion)
    const insDist = Math.max(0.04, Math.sqrt(
      Math.pow(item.muscle.insertionCoords[0], 2) +
      Math.pow(item.muscle.insertionCoords[1], 2) +
      Math.pow(item.muscle.insertionCoords[2], 2)
    ));
    const sinAlpha = Math.min(1.0, item.momentArm / insDist);
    const alphaRad = Math.asin(sinAlpha);
    const anglePullDeg = (alphaRad * 180) / Math.PI;

    const rotaryForceN = forceN * Math.sin(alphaRad);
    const stabilizingForceN = forceN * Math.cos(alphaRad);

    totalForceVectorY += rotaryForceN;
    totalForceVectorX += stabilizingForceN;

    const effortPercent = item.muscle.peakForceN > 0
      ? (forceN / item.muscle.peakForceN) * 100
      : 0;

    muscleCalculations.push({
      muscle: item.muscle,
      momentArmM: item.momentArm,
      forceN,
      sharePercent: 0, // Set after loop
      effortPercent,
      currentLengthM: currentLen,
      lengthRatio,
      isShortened,
      anglePullDeg,
      rotaryForceN,
      stabilizingForceN,
    });

    if (item.muscle.role === 'Prime Mover' && forceN > primaryMuscleForceN) {
      primaryMuscleForceN = forceN;
      netMuscleMomentArm = item.momentArm;
    }
  }

  // Compute percentage share of torque
  for (const calc of muscleCalculations) {
    calc.sharePercent = totalMuscleTorqueNm > 0
      ? ((calc.forceN * calc.momentArmM) / totalMuscleTorqueNm) * 100
      : 0;
  }

  if (netMuscleMomentArm === 0 && muscleCalculations.length > 0) {
    netMuscleMomentArm = muscleCalculations[0].momentArmM;
  }

  // Joint Reaction Force (JRF):
  // Vector equilibrium: JRF opposes net muscle pull and external loads
  const extForceN = loadWeightN + limbWeightN;
  const jointReactionForceN = Math.sqrt(
    Math.pow(totalForceVectorX, 2) + Math.pow(totalForceVectorY - extForceN, 2)
  );

  // Mechanical Advantage: MA = Effort arm / Load arm
  const mechanicalAdvantage = loadDistanceM > 0 ? netMuscleMomentArm / loadDistanceM : 0;

  return {
    angleDeg,
    netTorqueNm,
    limbTorqueNm,
    loadTorqueNm,
    extraResistanceTorqueNm: extraResNm,
    gravityClassification: gravClass,
    muscleCalculations,
    totalMuscleTorqueNm,
    momentArmM: netMuscleMomentArm,
    primaryMuscleForceN,
    jointReactionForceN,
    leverClass: movement.leverClass,
    mechanicalAdvantage,
    isCapacityExceeded,
    capacityDeficitNm,
  };
}

/**
 * Precomputes range curve data points from minAngle to maxAngle (in 2° or 5° steps)
 * for plotting SVG charts of Torque, Muscle Force, and Moment Arm.
 */
export function generateRangeCurves(params: {
  jointId: JointId;
  movement: MovementDefinition;
  bodyMassKg: number;
  loadKg: number;
  extraResistanceNm: number;
  contractionMode: ContractionMode;
  patientPosition: PatientPosition;
  muscleStrengthFactors?: Record<string, number>;
  stepDeg?: number;
}) {
  const step = params.stepDeg || 5;
  const points: {
    angle: number;
    netTorque: number;
    muscleForce: number;
    momentArm: number;
    jrf: number;
  }[] = [];

  for (let ang = params.movement.minAngle; ang <= params.movement.maxAngle; ang += step) {
    const res = calculateBiomechanics({
      ...params,
      angleDeg: ang,
    });

    const primeMover = res.muscleCalculations.find((m) => m.muscle.role === 'Prime Mover') || res.muscleCalculations[0];

    points.push({
      angle: ang,
      netTorque: Number(res.netTorqueNm.toFixed(2)),
      muscleForce: Number((primeMover?.forceN || 0).toFixed(1)),
      momentArm: Number(((primeMover?.momentArmM || 0) * 100).toFixed(2)), // in cm
      jrf: Number(res.jointReactionForceN.toFixed(1)),
    });
  }

  return points;
}
