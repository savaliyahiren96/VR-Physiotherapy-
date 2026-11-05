import {
  JointId,
  MovementId,
  MovementDefinition,
  SoftTissueDefinition,
  SoftTissueCalculatedState,
  SoftTissueMechanicalState,
} from '../types/biomechanics';
import { SOFT_TISSUES_DATA } from '../data/softTissueData';

/**
 * Mathematical & Biomechanical Calculation Engine for Non-Contractile Soft Tissues
 * Computes per-degree strain, physiological tension state, color mapping, and clinical vulnerability.
 */

export function calculateSoftTissueStates(
  jointId: JointId,
  movementId: MovementId,
  angleDeg: number
): SoftTissueCalculatedState[] {
  const tissues = SOFT_TISSUES_DATA.filter((t) => t.jointId === jointId);

  return tissues.map((tissue) => {
    const strainPercent = computeTissueStrain(tissue, movementId, angleDeg);
    const { state, colorHex, isClinicallyVulnerable } = evaluateMechanicalState(tissue, strainPercent, movementId, angleDeg);
    const tensionDescription = generateTensionDescription(tissue, state, strainPercent, angleDeg, movementId);

    // Approximate passive restraint share (normalized relative to max capacity)
    const restraintScore = Math.min(100, Math.round((strainPercent / tissue.maxPhysiologicalStrainPercent) * 100));

    return {
      tissue,
      strainPercent: Math.round(strainPercent * 10) / 10,
      state,
      colorHex,
      tensionDescription,
      isClinicallyVulnerable,
      biomechanicalRestraintShare: restraintScore,
    };
  });
}

/**
 * Computes physiological strain (%) at a given joint angle.
 */
function computeTissueStrain(
  tissue: SoftTissueDefinition,
  movementId: MovementId,
  angleDeg: number
): number {
  const { peakTensionAngleDeg, slackAngleDeg, maxPhysiologicalStrainPercent } = tissue;
  const baseRestStrain = 0.5; // Baseline resting pretension in vivo (~0.5%)

  // 1. Shoulder Specific Kinematics
  if (tissue.id === 'sh_subacromial_bursa') {
    // Neer's Painful Arc: compression peaks between 60° and 120° of abduction
    if (movementId === 'shoulder_abduction' || movementId === 'shoulder_flexion') {
      if (angleDeg >= 60 && angleDeg <= 120) {
        // Bell curve peaking at 90°
        const dist = Math.abs(angleDeg - 90);
        return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * Math.cos((dist / 30) * (Math.PI / 2));
      }
      return baseRestStrain + 0.8;
    }
  }

  if (tissue.id === 'sh_ighl_anterior') {
    if (movementId === 'shoulder_abduction') {
      // Stretches progressively as abduction increases, hammock effect at 90°+
      const ratio = Math.min(1, Math.max(0, angleDeg / 90));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * Math.pow(ratio, 1.4);
    }
    if (movementId === 'shoulder_lateral_rotation') {
      const ratio = Math.min(1, Math.max(0, angleDeg / 90));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * ratio;
    }
  }

  // 2. Knee Specific Kinematics
  if (tissue.id === 'knee_acl_pl') {
    // Posterolateral ACL bundle: maximally taut at full extension (0°), slacks in flexion
    if (movementId === 'knee_flexion') {
      const ratio = Math.min(1, Math.max(0, (120 - angleDeg) / 120));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * Math.pow(ratio, 2.0);
    }
    if (movementId === 'knee_extension') {
      // Approaching 0° extension increases strain
      const ratio = Math.min(1, Math.max(0, (135 - angleDeg) / 135));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * Math.pow(ratio, 2.0);
    }
  }

  if (tissue.id === 'knee_acl_am') {
    // Anteromedial ACL bundle: peaks around 60°-90° flexion
    if (movementId === 'knee_flexion') {
      const dist = Math.abs(angleDeg - 75);
      const factor = Math.max(0, 1 - dist / 75);
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * factor;
    }
  }

  if (tissue.id === 'knee_pcl_al') {
    // PCL Anterolateral bundle: peaks at 90° flexion
    if (movementId === 'knee_flexion') {
      const ratio = Math.min(1, Math.max(0, angleDeg / 90));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * ratio;
    }
  }

  if (tissue.id === 'knee_medial_meniscus') {
    // Posterior horn compression rises in flexion (>90°)
    if (movementId === 'knee_flexion') {
      const ratio = Math.min(1, Math.max(0, angleDeg / 135));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * Math.pow(ratio, 1.8);
    }
  }

  // 3. Elbow Specific Kinematics
  if (tissue.id === 'el_ulnar_nerve_tract') {
    // Cubital tunnel traction strain increases with flexion
    if (movementId === 'elbow_flexion') {
      const ratio = Math.min(1, Math.max(0, angleDeg / 135));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * Math.pow(ratio, 1.3);
    }
  }

  if (tissue.id === 'el_ucl_anterior') {
    if (movementId === 'elbow_flexion') {
      const dist = Math.abs(angleDeg - 90);
      const factor = Math.max(0.2, 1 - dist / 110);
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * factor;
    }
  }

  // 4. Ankle Specific Kinematics
  if (tissue.id === 'ank_atfl') {
    if (movementId === 'ankle_plantarflexion') {
      const ratio = Math.min(1, Math.max(0, angleDeg / 50));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * Math.pow(ratio, 1.5);
    }
    if (movementId === 'foot_inversion') {
      const ratio = Math.min(1, Math.max(0, angleDeg / 35));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * ratio;
    }
    if (movementId === 'ankle_dorsiflexion') {
      return baseRestStrain; // Slacks in dorsiflexion
    }
  }

  if (tissue.id === 'ank_cfl') {
    if (movementId === 'ankle_dorsiflexion') {
      const ratio = Math.min(1, Math.max(0, angleDeg / 20));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * ratio;
    }
    if (movementId === 'foot_inversion') {
      const ratio = Math.min(1, Math.max(0, angleDeg / 35));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * ratio;
    }
  }

  // 5. Spine Specific Kinematics
  if (tissue.id === 'sp_all') {
    if (movementId === 'spine_extension') {
      const ratio = Math.min(1, Math.max(0, angleDeg / 25));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * ratio;
    }
    if (movementId === 'spine_flexion') {
      return baseRestStrain; // Slacks in flexion
    }
  }

  if (tissue.id === 'sp_pll' || tissue.id === 'sp_supraspinous_interspinous' || tissue.id === 'sp_annulus_posterior') {
    if (movementId === 'spine_flexion') {
      const ratio = Math.min(1, Math.max(0, angleDeg / 60));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * Math.pow(ratio, 1.4);
    }
  }

  if (tissue.id === 'sp_ligamentum_flavum') {
    if (movementId === 'spine_flexion') {
      const ratio = Math.min(1, Math.max(0, angleDeg / 60));
      return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * ratio; // Stretched taut
    }
    if (movementId === 'spine_extension') {
      // In extension, it buckles into canal (low tensile strain, but high canal narrowing impingement)
      return baseRestStrain + 1.2;
    }
  }

  // 6. Generic Angular Interpolation
  const totalRange = Math.abs(peakTensionAngleDeg - slackAngleDeg) || 45;
  const distFromPeak = Math.abs(angleDeg - peakTensionAngleDeg);
  const factor = Math.max(0, Math.min(1, 1 - distFromPeak / totalRange));

  return baseRestStrain + (maxPhysiologicalStrainPercent - baseRestStrain) * factor;
}

/**
 * Determines physiological state, color, and vulnerability flags.
 */
function evaluateMechanicalState(
  tissue: SoftTissueDefinition,
  strainPercent: number,
  movementId: MovementId,
  angleDeg: number
): { state: SoftTissueMechanicalState; colorHex: string; isClinicallyVulnerable: boolean } {
  // Impingement condition for bursa in painful arc
  if (tissue.type === 'bursa' && strainPercent > 5.5) {
    return {
      state: 'Impinged / Compressed',
      colorHex: '#ef4444', // Red
      isClinicallyVulnerable: true,
    };
  }

  // Extreme micro-failure threshold
  if (strainPercent >= 7.5) {
    return {
      state: 'Vulnerable / Micro-Failure Risk',
      colorHex: '#dc2626', // Deep Red
      isClinicallyVulnerable: true,
    };
  }

  if (strainPercent >= 5.8) {
    return {
      state: 'Maximally Taut / Restraining',
      colorHex: '#f97316', // Orange
      isClinicallyVulnerable: strainPercent > 6.8,
    };
  }

  if (strainPercent >= 3.2) {
    return {
      state: 'Moderately Taut',
      colorHex: '#f59e0b', // Gold / Amber
      isClinicallyVulnerable: false,
    };
  }

  if (strainPercent >= 1.4) {
    return {
      state: 'Low Tension',
      colorHex: '#14b8a6', // Teal
      isClinicallyVulnerable: false,
    };
  }

  return {
    state: 'Slack / Relaxed',
    colorHex: '#06b6d4', // Cyan
    isClinicallyVulnerable: false,
  };
}

/**
 * Generates natural language biomechanical description for this degree.
 */
function generateTensionDescription(
  tissue: SoftTissueDefinition,
  state: SoftTissueMechanicalState,
  strainPercent: number,
  angleDeg: number,
  movementId: MovementId
): string {
  if (state === 'Impinged / Compressed') {
    return `Actively pinched and compressed under the coracoacromial arch at ${angleDeg}° (Neer’s Painful Arc threshold). Microvascular ischemia occurs with repetitive loading.`;
  }
  if (state === 'Vulnerable / Micro-Failure Risk') {
    return `Reaching physiological limit (${strainPercent}% strain). Collagen fibers fully recruited; vulnerable to sprain or plastic deformation under rapid load.`;
  }
  if (state === 'Maximally Taut / Restraining') {
    return `Under high passive tension; acting as primary mechanical stabilizer restraining joint translation at ${angleDeg}°.`;
  }
  if (state === 'Moderately Taut') {
    return `Physiological tension band active; fibers uncrimped and sharing stabilizing load.`;
  }
  if (state === 'Low Tension') {
    return `Fibers relaxed with baseline crimp; secondary stabilizer contribution.`;
  }
  return `Slack and redundant at ${angleDeg}°; offers minimal mechanical resistance to this motion.`;
}

/**
 * Generates full degree-by-degree curve for visualization and data export.
 */
export function generateSoftTissueDegreeCurve(
  jointId: JointId,
  movement: MovementDefinition,
  tissueId: string
): { degree: number; strainPercent: number; state: SoftTissueMechanicalState; colorHex: string }[] {
  const tissue = SOFT_TISSUES_DATA.find((t) => t.id === tissueId);
  if (!tissue) return [];

  const curve: { degree: number; strainPercent: number; state: SoftTissueMechanicalState; colorHex: string }[] = [];
  const min = movement.minAngle;
  const max = movement.maxAngle;

  for (let deg = min; deg <= max; deg += 1) {
    const strainPercent = computeTissueStrain(tissue, movement.id, deg);
    const { state, colorHex } = evaluateMechanicalState(tissue, strainPercent, movement.id, deg);
    curve.push({
      degree: deg,
      strainPercent: Math.round(strainPercent * 10) / 10,
      state,
      colorHex,
    });
  }

  return curve;
}

/**
 * Checks for clinical impingement / vulnerability zones for the joint.
 */
export function getImpingementZones(
  jointId: JointId,
  movementId: MovementId
): { title: string; rangeText: string; startDeg: number; endDeg: number; severity: 'Warning' | 'High Risk'; description: string }[] {
  const zones: { title: string; rangeText: string; startDeg: number; endDeg: number; severity: 'Warning' | 'High Risk'; description: string }[] = [];

  if (jointId === 'shoulder' && (movementId === 'shoulder_abduction' || movementId === 'shoulder_flexion')) {
    zones.push({
      title: 'Neer’s Subacromial Painful Arc',
      rangeText: '60° – 120° Abduction',
      startDeg: 60,
      endDeg: 120,
      severity: 'Warning',
      description: 'Subacromial bursa and supraspinatus tendon compressed against anterior inferior acromion and coracoacromial ligament.',
    });
  }

  if (jointId === 'knee' && movementId === 'knee_flexion') {
    zones.push({
      title: 'Deep Meniscal Horn Pinch Zone',
      rangeText: '110° – 135° Flexion',
      startDeg: 110,
      endDeg: 135,
      severity: 'Warning',
      description: 'Posterior horns of medial and lateral menisci compressed under femoral condyles in deep squatting posture.',
    });
  }

  if (jointId === 'knee' && movementId === 'knee_extension') {
    zones.push({
      title: 'ACL Terminal Hyperextension Shear',
      rangeText: '0° – 15° Extension',
      startDeg: 0,
      endDeg: 15,
      severity: 'High Risk',
      description: 'Posterolateral ACL bundle maximally taut; anterior tibial translation forces and screw-home rotation strain peak.',
    });
  }

  if (jointId === 'ankle' && movementId === 'ankle_plantarflexion') {
    zones.push({
      title: 'ATFL Vulnerability Zone',
      rangeText: '30° – 50° Plantarflexion',
      startDeg: 30,
      endDeg: 50,
      severity: 'High Risk',
      description: 'Anterior Talofibular Ligament oriented parallel to long axis of fibula; vulnerable to inversion rupture.',
    });
  }

  if (jointId === 'spine' && movementId === 'spine_flexion') {
    zones.push({
      title: 'Posterior Tension Band Plastic Strain Zone',
      rangeText: '45° – 60° Flexion',
      startDeg: 45,
      endDeg: 60,
      severity: 'Warning',
      description: 'Supraspinous and interspinous ligaments sustain peak tensile strain; flexion-relaxation silencing shifts entire load to passive tissues.',
    });
  }

  return zones;
}
