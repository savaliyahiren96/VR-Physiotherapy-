import {
  MovementCategory,
  PatientAssessmentRecord,
} from '../types/clinicalAssessment';

export interface MovementTemplateMeta {
  id: string;
  name: string;
  category: MovementCategory;
  primaryJoint: string;
  cameraViewRecommendation: 'Anterior' | 'Posterior' | 'Lateral (Sagittal)' | 'Oblique';
  normalRangeOrCriteria: string;
  commonAbnormalities: string[];
  recommendedTests: string[];
  rehabProtocols: {
    mobility: string[];
    strengthening: string[];
    neuromuscular: string[];
    balance: string[];
    functional: string[];
  };
  sampleDemonstrations: {
    title: string;
    description: string;
    defaultAngle: number;
    initialMarkers: { name: string; x: number; y: number }[];
  }[];
}

export const CLINICAL_MOVEMENT_TEMPLATES: MovementTemplateMeta[] = [
  // ==========================================
  // LOWER LIMB MOVEMENTS
  // ==========================================
  {
    id: 'squat',
    name: 'Bilateral Squat',
    category: 'Lower Limb',
    primaryJoint: 'Knee & Hip',
    cameraViewRecommendation: 'Anterior',
    normalRangeOrCriteria: 'Knee flexion 90°–110°, neutral femoral-tibial alignment, upright trunk parallel to tibial angle',
    commonAbnormalities: [
      'Dynamic Knee Valgus (medial collapse)',
      'Excessive Forward Trunk Lean',
      'Asymmetrical Weight-Bearing / Pelvic Shift',
      'Early Heel Rise (Limited Ankle Dorsiflexion)',
    ],
    recommendedTests: [
      'Weight-Bearing Lunge Test (Ankle Dorsiflexion)',
      'Single-Leg Squat Test',
      'Ober Test (IT Band / TFL tightness)',
      'Thomas Test (Hip Flexor Tightness)',
    ],
    rehabProtocols: {
      mobility: ['Gastroc-Soleus Wall Stretch (3x30s)', 'Half-Kneeling Hip Flexor Mobilization (3x10 reps)'],
      strengthening: ['Banded Goblet Squats (3x10)', 'Gluteus Medius Side-Lying Clamshells (3x15)'],
      neuromuscular: ['Visual Biofeedback Squats with Resistance Loop', 'Tempo Eccentric Squats (4-2-1)'],
      balance: ['Bilateral Balance Board Squats', 'Single-Leg Stance Balance (3x30s)'],
      functional: ['Box Squat Retraining with Tactile Cues', 'Sit-to-Stand Speed Training'],
    },
    sampleDemonstrations: [
      {
        title: 'Bilateral Squat - Neutral Execution',
        description: 'Symmetrical bilateral squat to 90° with preserved knee tracking over 2nd toe.',
        defaultAngle: 90,
        initialMarkers: [
          { name: 'Right Hip (ASIS/Greater Trochanter)', x: 44, y: 35 },
          { name: 'Right Knee Center (Lateral Epicondyle)', x: 40, y: 60 },
          { name: 'Right Ankle (Lateral Malleolus)', x: 40, y: 88 },
        ],
      },
    ],
  },
  {
    id: 'single_leg_squat',
    name: 'Single-Leg Squat',
    category: 'Lower Limb',
    primaryJoint: 'Knee & Hip',
    cameraViewRecommendation: 'Anterior',
    normalRangeOrCriteria: 'Knee flexion 60°–70°, pelvis level (no Trendelenburg drop), knee aligned over 2nd ray of foot',
    commonAbnormalities: [
      'Dynamic Knee Valgus with Hip Adduction',
      'Contralateral Pelvic Drop (Trendelenburg sign)',
      'Trunk Lateral Lean over Stance Limb',
      'Loss of Dynamic Balance / Foot Pronation',
    ],
    recommendedTests: [
      'Trendelenburg Test (Gluteus Medius)',
      'Ober Test',
      'Navicular Drop Test',
      'Star Excursion Balance Test (SEBT)',
    ],
    rehabProtocols: {
      mobility: ['Hip Adductor Foam Rolling', 'Ankle Joint Dorsiflexion Mobilization'],
      strengthening: ['Single-Leg Romanian Deadlift (3x10)', 'Lateral Band Walks (3x15m)'],
      neuromuscular: ['Mirror Feedback Single-Leg Squat with Laser Pointer', 'Step-Down Retraining'],
      balance: ['Single-Leg Stance on Foam Pad with Eyes Closed', 'Y-Balance Test Practice'],
      functional: ['Controlled Step-Down from 15cm Box', 'Single-Leg Deceleration Decels'],
    },
    sampleDemonstrations: [
      {
        title: 'Single-Leg Squat - Dynamic Knee Valgus',
        description: 'Single-leg squat demonstrating medial knee deviation and contralateral pelvic drop.',
        defaultAngle: 65,
        initialMarkers: [
          { name: 'Hip (ASIS)', x: 48, y: 30 },
          { name: 'Knee Axis (Medially Deviated)', x: 44, y: 58 },
          { name: 'Ankle (Lateral Malleolus)', x: 48, y: 88 },
        ],
      },
    ],
  },
  {
    id: 'walking_gait',
    name: 'Walking (Gait Analysis)',
    category: 'Lower Limb',
    primaryJoint: 'Hip, Knee & Ankle',
    cameraViewRecommendation: 'Lateral (Sagittal)',
    normalRangeOrCriteria: 'Heel strike at 0° knee, midstance knee flexion 15°–20°, push-off ankle plantarflexion 20°',
    commonAbnormalities: [
      'Reduced Knee Flexion in Swing Phase',
      'Lack of Heel Strike (Forefoot Initial Contact)',
      'Excessive Anterior Pelvic Tilt',
      'Genu Recurvatum (Knee Hyperextension in Stance)',
    ],
    recommendedTests: [
      '10-Meter Walk Test (Gait Velocity)',
      'Dynamic Gait Index (DGI)',
      'Hamstrings 90-90 Test',
      'Silfverskiöld Test (Gastrocnemius vs Soleus)',
    ],
    rehabProtocols: {
      mobility: ['Calf Stretch with Slant Board', 'Kneeling Psoas Stretch'],
      strengthening: ['Tibialis Anterior Dorsiflexion with Band', 'Terminal Knee Extension (TKE) with Tubing'],
      neuromuscular: ['Metronome Cadence Retraining', 'Over-Ground High-Stepping Drills'],
      balance: ['Tandem Gait Walking', 'Heel-to-Toe Walking on Line'],
      functional: ['Treadmill Gait Re-education with Mirror', 'Incline Treadmill Walking'],
    },
    sampleDemonstrations: [
      {
        title: 'Gait Midstance Sagittal View',
        description: 'Sagittal view of right lower limb at midstance showing 15° physiological knee flexion.',
        defaultAngle: 18,
        initialMarkers: [
          { name: 'Greater Trochanter', x: 50, y: 32 },
          { name: 'Knee Lateral Epicondyle', x: 50, y: 60 },
          { name: 'Lateral Malleolus', x: 52, y: 88 },
        ],
      },
    ],
  },
  {
    id: 'sit_to_stand',
    name: 'Sit-to-Stand',
    category: 'Lower Limb',
    primaryJoint: 'Knee & Hip',
    cameraViewRecommendation: 'Lateral (Sagittal)',
    normalRangeOrCriteria: 'Smooth trunk flexion (forward momentum) followed by coordinated knee/hip extension without upper limb push',
    commonAbnormalities: [
      'Asymmetrical Weight Distribution (favoring sound limb)',
      'Lack of Forward Trunk Flexion (Plopping down)',
      'Dynamic Knee Valgus during Ascent',
      'Need for Hand Armrest Assistance',
    ],
    recommendedTests: [
      '30-Second Chair Stand Test',
      'Five Times Sit-to-Stand (FTSTS)',
      'Quadriceps MMT Grade',
    ],
    rehabProtocols: {
      mobility: ['Thoracic Extension Mobilization', 'Ankle Dorsiflexion Mobility'],
      strengthening: ['Chair Squats without Hands (3x12)', 'Step-Ups onto Low Platform (3x10)'],
      neuromuscular: ['Nose-Over-Toes Momentum Training', 'Dual-Task Sit-to-Stand'],
      balance: ['Perturbation Training in Standing', 'Perturbation Recovery Drills'],
      functional: ['Progression to Variable Height Chairs', 'Car Transfer Simulation'],
    },
    sampleDemonstrations: [
      {
        title: 'Sit-to-Stand - Forward Momentum Phase',
        description: 'Patient transitioning forward over feet with 90° knee angle.',
        defaultAngle: 90,
        initialMarkers: [
          { name: 'Greater Trochanter', x: 42, y: 55 },
          { name: 'Knee Joint Axis', x: 58, y: 56 },
          { name: 'Lateral Malleolus', x: 58, y: 88 },
        ],
      },
    ],
  },
  {
    id: 'step_up_down',
    name: 'Step-Up and Step-Down',
    category: 'Lower Limb',
    primaryJoint: 'Knee & Ankle',
    cameraViewRecommendation: 'Anterior',
    normalRangeOrCriteria: 'Controlled eccentric lowering of opposite heel without pelvic drop or stance knee medial collapse',
    commonAbnormalities: [
      'Knee Medial Collapse (Dynamic Valgus)',
      'Pelvic Lateral Drop',
      'Rapid Uncontrolled Heel Drop',
      'Forward Trunk Pitch',
    ],
    recommendedTests: ['Y-Balance Test', 'Functional Movement Screen (FMS) Hurdle Step', 'Gluteus Medius MMT'],
    rehabProtocols: {
      mobility: ['Calf Eccentric Heel Drops on Step', 'Hip Flexor Stretch'],
      strengthening: ['Step-Downs with Forward Reach (3x10)', 'Monster Walks with Miniband (3x15)'],
      neuromuscular: ['Slow Eccentric Step-Downs with 3s Count', 'Laser Pointer Target Tracking'],
      balance: ['Single-Leg Balance on Airex Pad', 'Unstable Surface Step-Up'],
      functional: ['Stair Ascent and Descent Re-education', 'Curtain Step Agility'],
    },
    sampleDemonstrations: [
      {
        title: 'Step-Down Eccentric Lowering',
        description: 'Controlled lowering from 20cm step testing stance knee eccentric stability.',
        defaultAngle: 45,
        initialMarkers: [
          { name: 'Stance Hip (ASIS)', x: 45, y: 30 },
          { name: 'Stance Knee', x: 45, y: 56 },
          { name: 'Stance Ankle', x: 45, y: 84 },
        ],
      },
    ],
  },
  {
    id: 'single_leg_stance',
    name: 'Single-Leg Stance',
    category: 'Lower Limb',
    primaryJoint: 'Hip & Ankle Complex',
    cameraViewRecommendation: 'Anterior',
    normalRangeOrCriteria: 'Maintain stable unassisted balance for >= 30 seconds with level pelvis and minimal postural sway',
    commonAbnormalities: [
      'Positive Trendelenburg Sign (contralateral pelvic drop)',
      'Compensated Trendelenburg (excessive trunk lateral tilt over stance limb)',
      'Excessive Ankle Strategy / Tibialis Anterior Hyperactivity',
      'Frequent Ground Touchdowns',
    ],
    recommendedTests: ['Trendelenburg Sign Test', 'Modified Romberg Test', 'Single-Leg Eyes Closed Balance'],
    rehabProtocols: {
      mobility: ['Hip Joint Capsule Distraction', 'Ankle Mobilization'],
      strengthening: ['Isometric Gluteus Medius Wall Press (3x30s)', 'Side Planks with Leg Lift'],
      neuromuscular: ['Eyes-Open to Eyes-Closed Balance Progression', 'Head Turns in Single-Leg Stance'],
      balance: ['Single-Leg Balance on Foam/BOSU with Ball Toss', 'Single-Leg Clock Reaches'],
      functional: ['Single-Leg Stance with Contralateral Hip Swings', 'Functional Reach Test'],
    },
    sampleDemonstrations: [
      {
        title: 'Single-Leg Stance - Trendelenburg Observation',
        description: 'Single-leg stance observing pelvic horizontal alignment and trunk stability.',
        defaultAngle: 0,
        initialMarkers: [
          { name: 'Stance Hip (ASIS)', x: 48, y: 32 },
          { name: 'Stance Knee Axis', x: 48, y: 60 },
          { name: 'Stance Ankle Axis', x: 48, y: 88 },
        ],
      },
    ],
  },
  {
    id: 'jump_landing',
    name: 'Jumping and Landing (Drop Vertical Jump)',
    category: 'Lower Limb',
    primaryJoint: 'Knee & Hip Complex',
    cameraViewRecommendation: 'Anterior',
    normalRangeOrCriteria: 'Symmetrical shock absorption with hip/knee flexion > 60°, feet shoulder-width, zero knee valgus collapse',
    commonAbnormalities: [
      'High-Risk Dynamic Knee Valgus Collapse (ACL injury risk)',
      'Stiff-Leg Landing (Knee Flexion < 30°)',
      'Asymmetrical Ground Contact Force',
      'Lack of Ankle Dorsiflexion Shock Attenuation',
    ],
    recommendedTests: ['Landing Error Scoring System (LESS)', 'Triple Hop Test for Distance', 'Single-Leg Drop Jump'],
    rehabProtocols: {
      mobility: ['Hip Capsule Stretch', 'Ankle Dorsiflexion Mobility with Band'],
      strengthening: ['Eccentric Hamstrings (Nordic Curls)', 'Trap Bar Deadlifts for Posterior Chain'],
      neuromuscular: ['Soft-Landing Audio Biofeedback ("Land like a feather")', 'Drop-Jump to Freeze Drills'],
      balance: ['Single-Leg Landing Stabilization Holds', 'Lateral Bounding with Freeze'],
      functional: ['Box Jumps with Depth Rebounds', 'Sport-Specific Cutting & Deceleration Drills'],
    },
    sampleDemonstrations: [
      {
        title: 'Drop Vertical Jump - Peak Impact Phase',
        description: 'Landing phase assessing shock attenuation and knee frontal plane stability.',
        defaultAngle: 75,
        initialMarkers: [
          { name: 'Hip Center', x: 48, y: 35 },
          { name: 'Knee Center', x: 46, y: 62 },
          { name: 'Ankle Center', x: 48, y: 88 },
        ],
      },
    ],
  },

  // ==========================================
  // UPPER LIMB MOVEMENTS
  // ==========================================
  {
    id: 'shoulder_abduction_motion',
    name: 'Shoulder Abduction',
    category: 'Upper Limb',
    primaryJoint: 'Glenohumeral & Scapulothoracic',
    cameraViewRecommendation: 'Anterior',
    normalRangeOrCriteria: '0° – 180° with smooth scapulohumeral rhythm (2:1 ratio after 30°) without shoulder hike',
    commonAbnormalities: [
      'Early Scapular Shrug / Upper Trapezius Substitution',
      'Painful Arc between 60° and 120° (Subacromial Impingement)',
      'Trunk Lateral Flexion Compensation',
      'Inability to achieve terminal 180° overhead reach',
    ],
    recommendedTests: [
      'Neer Impingement Test',
      'Hawkins-Kennedy Test',
      'Empty Can (Jobe) Test (Supraspinatus)',
      'Scapular Assistance Test (SAT)',
    ],
    rehabProtocols: {
      mobility: ['Pectoralis Minor Doorway Stretch', 'Sleeper Stretch for Posterior Capsule'],
      strengthening: ['Prone Y-T-W Scapular Retraction', 'Serratus Anterior Wall Slides with Foam Roller'],
      neuromuscular: ['Rhythmic Stabilizations in 90° Abduction', 'Scapular Clock Exercises'],
      balance: ['Quadruped Weight Shifts on Hands', 'Push-Up Plus on Incline'],
      functional: ['Overhead Shelf Reaching Tasks', 'Theraband Overhead Pull-Aparts'],
    },
    sampleDemonstrations: [
      {
        title: 'Shoulder Abduction at 90°',
        description: 'Coronal view of shoulder abduction assessing scapulohumeral rhythm and impingement arc.',
        defaultAngle: 90,
        initialMarkers: [
          { name: 'Thorax / Sternal Notch', x: 38, y: 25 },
          { name: 'Acromion / Glenohumeral Axis', x: 45, y: 28 },
          { name: 'Lateral Epicondyle of Humerus', x: 68, y: 28 },
        ],
      },
    ],
  },
  {
    id: 'shoulder_flexion_motion',
    name: 'Shoulder Flexion',
    category: 'Upper Limb',
    primaryJoint: 'Glenohumeral Joint',
    cameraViewRecommendation: 'Lateral (Sagittal)',
    normalRangeOrCriteria: '0° – 180° in sagittal plane without lumbar hyperextension or rib flare',
    commonAbnormalities: [
      'Lumbar Spine Hyperextension Compensation',
      'Early Thoracic Extension / Rib Flare',
      'Winging of Medial Scapula Border',
      'Limited Terminal Elevation (< 150°)',
    ],
    recommendedTests: ['Speed Test (Biceps Tendon)', 'Scapular Reposition Test', 'Latissimus Dorsi Length Test'],
    rehabProtocols: {
      mobility: ['Latissimus Dorsi Foam Rolling', 'Thoracic Spine Extension on Foam Roller'],
      strengthening: ['Anterior Deltoid Dumbbell Raises', 'Serratus Anterior Punch Drills'],
      neuromuscular: ['Posterior Pelvic Tilt Wall Slides (maintaining flat lumbar spine)'],
      balance: ['Plank on Forearms with Shoulder Taps'],
      functional: ['Overhead Functional Lifting Re-education'],
    },
    sampleDemonstrations: [
      {
        title: 'Shoulder Flexion Sagittal View',
        description: 'Sagittal view measuring overhead flexion angle and spinal alignment.',
        defaultAngle: 120,
        initialMarkers: [
          { name: 'Mid-Axillary Thorax Reference', x: 45, y: 45 },
          { name: 'Greater Tubercle (Fulcrum)', x: 45, y: 28 },
          { name: 'Lateral Epicondyle', x: 60, y: 15 },
        ],
      },
    ],
  },
  {
    id: 'elbow_flexion_motion',
    name: 'Elbow Flexion',
    category: 'Upper Limb',
    primaryJoint: 'Humeroulnar & Humeroradial',
    cameraViewRecommendation: 'Lateral (Sagittal)',
    normalRangeOrCriteria: '0° – 150° (soft tissue approximation end-feel)',
    commonAbnormalities: [
      'Shoulder Flexion Substitution',
      'Forearm Pronation Substitution for Biceps Weakness',
      'Flexion Contracture (> 10° extension lag)',
      'Painful Click in Terminal Range',
    ],
    recommendedTests: ['Biceps MMT in Supination', 'Brachialis MMT in Pronation', 'Cozen Test (Lateral Epicondylalgia)'],
    rehabProtocols: {
      mobility: ['Triceps and Posterior Capsule Stretch', 'Elbow Low-Load Long-Duration Extension Hangs'],
      strengthening: ['Biceps Dumbbell Curls in Three Positions (Supinated, Neutral, Pronated)'],
      neuromuscular: ['Controlled Eccentric Elbow Lowering (5s tempo)'],
      balance: ['Closed-Chain Push-Up Hold on Swiss Ball'],
      functional: ['Hand-to-Mouth & Hand-to-Head Feeding Activities'],
    },
    sampleDemonstrations: [
      {
        title: 'Elbow Flexion 90° with 2 kg Load',
        description: 'Standard clinical seated elbow flexion test at 90° with hand dumbbell load.',
        defaultAngle: 90,
        initialMarkers: [
          { name: 'Acromion / Proximal Humerus', x: 45, y: 28 },
          { name: 'Lateral Epicondyle (Elbow Fulcrum)', x: 47, y: 55 },
          { name: 'Radial Styloid (Wrist)', x: 70, y: 55 },
        ],
      },
    ],
  },
  {
    id: 'reaching_functional',
    name: 'Reaching Activities (Forward & Overhead)',
    category: 'Upper Limb',
    primaryJoint: 'Multi-joint Upper Extremity Chain',
    cameraViewRecommendation: 'Lateral (Sagittal)',
    normalRangeOrCriteria: 'Coordinated scapulohumeral elevation, elbow extension, and wrist neutral alignment without trunk forward lean',
    commonAbnormalities: [
      'Excessive Trunk Lean Forward to compensate for restricted reach',
      'Lack of Terminal Elbow Extension',
      'Shoulder Internal Rotation & Scapular Anterior Tilt',
      'Tremor or Dysmetria on Target Approach',
    ],
    recommendedTests: ['Functional Reach Test (FRT)', 'Action Research Arm Test (ARAT)', 'Nine-Hole Peg Test'],
    rehabProtocols: {
      mobility: ['Pectoralis Major Stretch', 'Biceps Tendon Stretch'],
      strengthening: ['Reach and Retrieve with Weighted Objects', 'Theraband PNF D2 Flexion Pattern'],
      neuromuscular: ['Target-Directed Pointing Tasks with Visual Constraints'],
      balance: ['Reach at Limits of Stability in Standing'],
      functional: ['Cup Stacking & Shelf Reaching Drills'],
    },
    sampleDemonstrations: [
      {
        title: 'Forward Functional Reach',
        description: 'Multi-joint reaching activity assessing trunk compensation and upper limb extension.',
        defaultAngle: 95,
        initialMarkers: [
          { name: 'Trunk Midline', x: 38, y: 40 },
          { name: 'Shoulder Joint', x: 45, y: 30 },
          { name: 'Fingertip Reach Point', x: 75, y: 30 },
        ],
      },
    ],
  },

  // ==========================================
  // POSTURAL ASSESSMENT
  // ==========================================
  {
    id: 'posture_anterior',
    name: 'Postural Assessment (Anterior View)',
    category: 'Postural Assessment',
    primaryJoint: 'Whole Body Kinetic Alignment',
    cameraViewRecommendation: 'Anterior',
    normalRangeOrCriteria: 'Head upright, level shoulders (acromioclavicular heights), level iliac crests/ASIS, symmetrical patellae, neutral foot arches',
    commonAbnormalities: [
      'Head Tilt or Rotation',
      'Shoulder Height Asymmetry (Elevated dominant shoulder)',
      'Pelvic Lateral Tilt (Leg length discrepancy or scoliosis)',
      'Genu Valgum ("Knock Knees") or Genu Varum ("Bow Legs")',
      'Bilateral Foot Pronation / Flat Arches (Pes Planus)',
    ],
    recommendedTests: ['Apparent & True Leg Length Measurement', 'Adam Forward Bend Test', 'Navicular Drop Test'],
    rehabProtocols: {
      mobility: ['Upper Trapezius and Levator Scapulae Stretches', 'Quadratus Lumborum Stretch'],
      strengthening: ['Lower Trapezius and Rhomboid Retraction', 'Short Foot Exercise (Intrinsic Foot Muscles)'],
      neuromuscular: ['Mirror Visual Postural Alignment Retraining', 'Plumb-Line Self-Correction'],
      balance: ['Static Standing Postural Sway Reduction'],
      functional: ['Ergonomic Workstation Alignment & Posture Pacing'],
    },
    sampleDemonstrations: [
      {
        title: 'Anterior Standing Postural Screen',
        description: 'Full body anterior view assessing shoulder level, pelvic tilt, and knee frontal alignment.',
        defaultAngle: 0,
        initialMarkers: [
          { name: 'Sternal Notch / Head', x: 50, y: 15 },
          { name: 'Pelvis Midpoint (Pubis)', x: 50, y: 45 },
          { name: 'Mid-Ankles Center', x: 50, y: 88 },
        ],
      },
    ],
  },
  {
    id: 'posture_lateral',
    name: 'Postural Assessment (Lateral View)',
    category: 'Postural Assessment',
    primaryJoint: 'Spine & Sagittal Pelvic Alignment',
    cameraViewRecommendation: 'Lateral (Sagittal)',
    normalRangeOrCriteria: 'Plumb line passes through external auditory meatus, acromion, greater trochanter, anterior to knee axis, and anterior to lateral malleolus',
    commonAbnormalities: [
      'Forward Head Posture (Craniovertebral angle < 50°)',
      'Excessive Thoracic Kyphosis ("Dowager Hump")',
      'Excessive Lumbar Lordosis with Anterior Pelvic Tilt',
      'Flat Back Syndrome (Loss of physiological lordosis)',
      'Genu Recurvatum (Knee hyperextension)',
    ],
    recommendedTests: ['Craniovertebral Angle Measurement', 'Incline Pelvic Tilt Angle (Inclinometer)', 'Pec Minor Length Test'],
    rehabProtocols: {
      mobility: ['Suboccipital Release', 'Chest Foam Roller Opener', 'Hip Flexor Stretching'],
      strengthening: ['Deep Cervical Flexor (Chin Tucks) (3x10s holds)', 'Posterior Pelvic Tilts (Core Hollow)'],
      neuromuscular: ['Wall Posture Alignment Checks', 'Scapular Posterior Tilting Drills'],
      balance: ['Wobble Board Balance with Upright Spine'],
      functional: ['Ergonomic Seating & Lumbar Roll Retraining'],
    },
    sampleDemonstrations: [
      {
        title: 'Lateral Posture Plumb Line Screen',
        description: 'Sagittal view assessing forward head, kyphosis, lordosis, and knee hyperextension.',
        defaultAngle: 0,
        initialMarkers: [
          { name: 'External Auditory Meatus (Ear)', x: 52, y: 15 },
          { name: 'Greater Trochanter', x: 49, y: 50 },
          { name: 'Lateral Malleolus', x: 50, y: 88 },
        ],
      },
    ],
  },
];
