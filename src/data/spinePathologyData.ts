import { SpinePathologyInfo, SpinePathologyType } from '../types/biomechanics';

export interface NachemsonPostureStudy {
  posture: string;
  pressureKgCm2: number;
  relativePercent: number; // Relative to standing (100%)
  biomechanicalDescription: string;
  clinicalRecommendation: string;
  shearRisk: 'Low' | 'Moderate' | 'High' | 'Extreme';
}

export const NACHEMSON_PRESSURE_DATA: NachemsonPostureStudy[] = [
  {
    posture: 'Supine Lying (Legs Supported)',
    pressureKgCm2: 25,
    relativePercent: 25,
    biomechanicalDescription: 'Psoas major relaxed; gravitational compressive load eliminated. Nucleus rehydrates via diurnal osmotic imbibition.',
    clinicalRecommendation: 'Acute disc herniation unloading posture; Fowler position (knees/hips flexed at 90° on pillows).',
    shearRisk: 'Low',
  },
  {
    posture: 'Prone Lying (Sphinx / Prone on Elbows)',
    pressureKgCm2: 35,
    relativePercent: 35,
    biomechanicalDescription: 'Passive lumbar extension gently anteriorizes nucleus pulposus away from posterior annular defect (McKenzie derangement principle).',
    clinicalRecommendation: 'First-line protocol for posterior disc derangement with centralization of sciatic symptoms.',
    shearRisk: 'Low',
  },
  {
    posture: 'Side-Lying',
    pressureKgCm2: 75,
    relativePercent: 75,
    biomechanicalDescription: 'Moderate disc loading; lateral shear depends on pelvic and knee support.',
    clinicalRecommendation: 'Place pillow between knees to prevent lumbar rotation and pelvic torsion.',
    shearRisk: 'Low',
  },
  {
    posture: 'Standing Upright (Neutral Lordosis)',
    pressureKgCm2: 100,
    relativePercent: 100,
    biomechanicalDescription: 'Standard baseline reference (Nachemson 1966). Upper body weight distributed ~80% through anterior column (vertebral body/disc) and ~20% through posterior facet joints.',
    clinicalRecommendation: 'Maintain physiological lumbar lordosis (~30°); distribute weight evenly through both feet.',
    shearRisk: 'Low',
  },
  {
    posture: 'Sitting Upright (With 5cm Lumbar Roll)',
    pressureKgCm2: 100,
    relativePercent: 100,
    biomechanicalDescription: 'Lumbar support maintains anterior convexity, balancing disc and facet load similarly to relaxed standing.',
    clinicalRecommendation: 'Ergonomic office setup with active lumbar support and feet flat on floor.',
    shearRisk: 'Low',
  },
  {
    posture: 'Slumped / Relaxed Sitting (Kyphotic)',
    pressureKgCm2: 140,
    relativePercent: 140,
    biomechanicalDescription: 'Posterior pelvic tilt eliminates lordosis, flexing lumbar spine. Posterior annular fibers stretch; nucleus displaced posteriorly toward spinal canal.',
    clinicalRecommendation: 'Harmful in posterior disc protrusions; causes gradual creep and posterior ligament laxity over 20+ minutes.',
    shearRisk: 'Moderate',
  },
  {
    posture: 'Standing Forward Flexion (20° Lean)',
    pressureKgCm2: 150,
    relativePercent: 150,
    biomechanicalDescription: 'Center of gravity of trunk shifts anterior to L4-L5 motion segment, creating a 25-30 cm flexor moment arm countered by intense erector spinae contraction.',
    clinicalRecommendation: 'Frequent trigger in tooth-brushing, dishwashing, or stoop working positions.',
    shearRisk: 'Moderate',
  },
  {
    posture: 'Standing Forward Flexion (60° Full Bend)',
    pressureKgCm2: 220,
    relativePercent: 220,
    biomechanicalDescription: 'Flexion-relaxation phenomenon occurs in erector spinae: active muscle silencing shifts load entirely onto passive posterior ligaments and annulus fibrosus.',
    clinicalRecommendation: 'Avoid repetitive end-range forward flexion in acute or subacute radiculopathies.',
    shearRisk: 'High',
  },
  {
    posture: 'Lifting 20kg (Bent Knees, Straight Back / Close to Body)',
    pressureKgCm2: 210,
    relativePercent: 210,
    biomechanicalDescription: 'Load held close to center of mass (short moment arm ~15 cm). Quadriceps and gluteals absorb load; intra-abdominal pressure hydraulic assist stabilizes spine.',
    clinicalRecommendation: 'Safe ergonomic lifting technique (Power Lift / Squat Lift). Minimizes anterior shear forces.',
    shearRisk: 'Moderate',
  },
  {
    posture: 'Lifting 20kg (Stoop Lift / Rounded Back, Knees Straight)',
    pressureKgCm2: 300,
    relativePercent: 300,
    biomechanicalDescription: 'Long load moment arm (40-50 cm). Compressive force exceeds 5,000 N (above NIOSH 3,400 N action limit); massive anterior shear stress on pars and annulus.',
    clinicalRecommendation: 'Extremely high risk for acute annular tear, disc herniation, or pars stress injury. Strictly proscribed in spine rehabilitation.',
    shearRisk: 'Extreme',
  },
];

export const SPINE_PATHOLOGIES: SpinePathologyInfo[] = [
  {
    id: 'healthy',
    name: 'Normal Healthy Functional Spinal Unit (L4–L5)',
    commonLevel: 'L4–L5 / L5–S1',
    clinicalSignificance: 'Physiological motion segment with intact concentric Annulus Fibrosus (alternating 60° collagen lamellae), pressurized central Nucleus Pulposus, wide patent neural exit foramina, smooth hyaline articular cartilage on zygapophyseal facet joints, and uncompromised cauda equina / dural sac.',
    biomechanicalMechanism: 'Hydrostatic pressure in nucleus transmits axial compressive forces radially into circumferential hoop stress across the annulus fibrosus. Facet joints share 16-20% of compressive load in upright posture.',
    aggravatingPosture: 'Excessive hyperextension or twisting at end-range.',
    relievingPosture: 'Neutral upright posture with balanced physiological lumbar lordosis.',
    specialTests: ['Normal Straight Leg Raise (Negative SLR 0–90°)', 'Negative Slump Test', 'Full symmetrical lumbar mobility'],
    intradiscalPressureMultiplier: 1.0,
    compressiveDeficitPercent: 0,
    shearRisk: 'Low',
    nerveRootInvolved: 'None (Patent lateral recess > 4mm)',
    directionPreference: 'Neutral/Lateral Shift',
  },
  {
    id: 'pivd_herniation',
    name: 'Posterolateral Disc Herniation (PIVD / Sciatica)',
    commonLevel: 'L4–L5 (compressing L5 root) or L5–S1 (compressing S1 root)',
    clinicalSignificance: 'Radial fissure in posterior annulus fibrosus allows pressurized nuclear material to protrude or extrude posterolaterally into the lateral recess, directly impinging the traversing nerve root (L5 or S1). Causes sharp dermatomal radicular pain, paresthesias, reflex diminution, and motor weakness.',
    biomechanicalMechanism: 'Trunk flexion coupled with lateral tilt and axial compression produces peak hydraulic force against the posterior annular lamellae, displacing the nucleus posteriorly. The posterior longitudinal ligament (PLL) is thin laterally, making the posterolateral region the path of least resistance.',
    aggravatingPosture: 'Prolonged sitting, forward stooping, coughing/sneezing (Valsalva), driving, morning flexion.',
    relievingPosture: 'Prone lying (Sphinx pose), standing walking with lordosis, extension in lying (McKenzie extension principle).',
    specialTests: [
      'Positive Straight Leg Raise (SLR / Lasegue at 35°–70° with radicular reproduction)',
      'Positive Cross-SLR (Well Leg Raise - >90% specificity for disc herniation)',
      'Positive Slump Test (Reproduction of distal sciatic symptoms relieved by neck extension)',
      'Bragard’s Sign (Ankle dorsiflexion at SLR threshold exacerbates symptoms)',
      'Myotomal Deficit: L5 (Extensor Hallucis Longus / Heel walking), S1 (Gastrocnemius / Toe walking)',
    ],
    intradiscalPressureMultiplier: 2.2,
    compressiveDeficitPercent: 35,
    shearRisk: 'Severe',
    nerveRootInvolved: 'L5 Traversing Root (at L4-L5) or S1 Root (at L5-S1)',
    directionPreference: 'Extension',
  },
  {
    id: 'spondylolisthesis',
    name: 'Isthmic / Degenerative Spondylolisthesis (L5–S1)',
    commonLevel: 'L5–S1 (Isthmic) or L4–L5 (Degenerative in females > 50 yrs)',
    clinicalSignificance: 'Bilateral defect / fracture of the pars interarticularis (spondylolysis) results in loss of posterior bony restraint, causing anterior translation (slippage) of the superior vertebral body over the inferior segment. Palpable "step-off" deformity above the slippage level on spinous process palpation.',
    biomechanicalMechanism: 'Gravitational body weight and lumbar lordosis create a continuous anterior shear force ($F_{shear} = W \sin \theta$). Without bony continuity of the neural arch, the intervertebral disc and iliolumbar ligaments bear the entire shear load, causing progressive anterior displacement (Meyerding Grade I: <25%, Grade II: 25-50%).',
    aggravatingPosture: 'Lumbar extension, prone lying without abdominal support, gymnastics, fast bowling, repetitive hyperextension.',
    relievingPosture: 'Lumbar flexion (sitting, squatting, knees-to-chest posture).',
    specialTests: [
      'Stork Test (Single-leg hyperextension test - provokes pars stress pain)',
      'Palpable Step-Off Deformity (Spinous process step)',
      'Phalen-Dickson Sign (Hamstring spasm with knee flexion / waddling gait)',
      'Passive Lumbar Extension Test (PLET)',
    ],
    intradiscalPressureMultiplier: 1.4,
    compressiveDeficitPercent: 45,
    shearRisk: 'Critical',
    nerveRootInvolved: 'L5 Exiting Root in subarticular/foraminal zone',
    directionPreference: 'Flexion',
  },
  {
    id: 'spinal_stenosis',
    name: 'Lumbar Spinal Canal & Foraminal Stenosis',
    commonLevel: 'L3–L4, L4–L5, L5–S1',
    clinicalSignificance: 'Progressive narrowing of the central spinal canal, lateral recess, or neuroforamina due to a pathological triad: thickened/hypertrophied Ligamentum Flavum, facet joint arthrosis/osteophytes, and degenerative disc bulge. Manifests classically as Neurogenic Claudication (pseudoclaudication).',
    biomechanicalMechanism: 'In lumbar extension, the ligamentum flavum buckles anteriorly into the canal, facet joints overlap, and disc bulges, reducing canal cross-sectional area by 16-20%. In lumbar flexion, the ligamentum flavum tightens and thins, increasing canal cross-section and restoring microvascular blood flow to the cauda equina.',
    aggravatingPosture: 'Walking downhill, standing upright for prolonged periods, lumbar extension.',
    relievingPosture: 'Flexing forward while walking ("Shopping Cart Sign"), sitting down, cycling bent forward.',
    specialTests: [
      'Van Gelderen Bicycle Test (Painless cycling in forward flexion vs pain in upright posture)',
      'Two-Stage Treadmill Test (Flat walking induces claudication faster than uphill walking)',
      'Romberg Sign (Proprioceptive deficit from dorsal column compression)',
      'Kemp’s / Extension-Quadrant Test (Reproduction of leg numbness/pain on extension)',
    ],
    intradiscalPressureMultiplier: 1.2,
    compressiveDeficitPercent: 30,
    shearRisk: 'Moderate',
    nerveRootInvolved: 'Cauda Equina / Multiple traversing and exiting nerve roots',
    directionPreference: 'Flexion',
  },
  {
    id: 'degenerative_disc',
    name: 'Degenerative Disc Disease (DDD) & Spondylosis',
    commonLevel: 'L4–L5, L5–S1',
    clinicalSignificance: 'Progressive age- or trauma-related desiccation of the nucleus pulposus with loss of hydrophilic chondroitin sulfate. Leads to substantial loss of intervertebral disc height, annular lamellar delamination, endplate sclerosis (Modic changes), and reactive anterior/lateral marginal osteophyte bone spurs.',
    biomechanicalMechanism: 'Loss of nuclear fluid pressure transfers compressive stress from hydrostatic liquid distribution to direct solid-on-solid loading of the annulus and facet joints. Facet joints become overloaded, increasing their share of axial load from 20% to over 50%, predisposing to severe facet arthropathy.',
    aggravatingPosture: 'Early morning transitions, prolonged static sitting, cold weather, sudden loading.',
    relievingPosture: 'Gentle walking, warm hydrotherapy, decompression traction.',
    specialTests: [
      'Facet Joint Loading Test (Kemp’s Quadrant Test)',
      'Springing Test (Stiff hypomobility on central PA pressure)',
      'Lumbar Instability Catch during return from forward flexion',
    ],
    intradiscalPressureMultiplier: 1.6,
    compressiveDeficitPercent: 50,
    shearRisk: 'Moderate',
    nerveRootInvolved: 'Foraminal nerve root encroachment by osteophytes',
    directionPreference: 'Unloaded',
  },
  {
    id: 'scoliosis',
    name: 'Adult Degenerative / Idiopathic Lumbar Scoliosis',
    commonLevel: 'L1–L4 / Lumbar Apex',
    clinicalSignificance: 'Tri-planar structural deformity characterized by lateral curvature (Cobb angle > 10° in coronal plane), abnormal sagittal alignment (hypo-lordosis or kyphosis), and coupled axial rotation (vertebral bodies rotate toward the convexity, spinous processes toward the concavity).',
    biomechanicalMechanism: 'Asymmetric disc and facet loading (Heuter-Volkmann law: compressive stress on concave side retards growth and accelerates degeneration; tensile strain on convex side). Results in lateral wedging of vertebral bodies and progressive coronal tilt.',
    aggravatingPosture: 'Prolonged standing on one leg, asymmetric carrying loads, axial fatigue.',
    relievingPosture: 'Supine positioning with lumbar unloading, lateral shift correction toward concavity.',
    specialTests: [
      'Adam’s Forward Bend Test (Rib hump and lumbar prominence measured with Scoliometer)',
      'Plumb Line Test (Coronal plumb line from C7 spinous process to gluteal cleft)',
      'Cobb Angle Measurement on Full-Spine Radiographs',
    ],
    intradiscalPressureMultiplier: 1.8,
    compressiveDeficitPercent: 40,
    shearRisk: 'Severe',
    nerveRootInvolved: 'Concave side nerve roots compressed in narrowed neuroforamina',
    directionPreference: 'Neutral/Lateral Shift',
  },
];

export interface NeurodynamicTestGuide {
  id: string;
  name: string;
  indication: string;
  startingPosition: string;
  stages: { step: number; action: string; structuralTarget: string }[];
  normalResponse: string;
  positiveResponse: string;
  structuralDifferentiation: string;
}

export const NEURODYNAMIC_TESTS: NeurodynamicTestGuide[] = [
  {
    id: 'slr',
    name: 'Straight Leg Raise (SLR / Lasegue’s Test)',
    indication: 'L4–L5 / L5–S1 disc herniation, sciatic nerve root mechanosensitivity, radiculopathy.',
    startingPosition: 'Patient in supine, neutral spine, contralateral leg flat, examiner supports ankle and knee in 0° extension.',
    stages: [
      { step: 1, action: 'Passive hip flexion with knee in extension (0° to 35°)', structuralTarget: 'Tension is taken up in sciatic nerve slack. No dural pull at foramina yet.' },
      { step: 2, action: 'Elevation between 35° and 70°', structuralTarget: 'Maximal glide and tension on L5/S1 spinal nerve roots over IVD (glides 2-6 mm through intervertebral foramen).' },
      { step: 3, action: 'Elevation > 70°', structuralTarget: 'No further dural stretch; primarily tests hamstring flexibility, SIJ, and hip joint capsule.' },
      { step: 4, action: 'Bragard’s Sensitization: Lower leg 5° below pain threshold, then passively dorsiflex ankle', structuralTarget: 'Increases tibial/sciatic nerve tension without moving hip/pelvis. Confirms neural origin.' },
    ],
    normalResponse: 'Hamstring stretch sensation behind knee at 75°–90°.',
    positiveResponse: 'Sharp dermatomal pain radiating below the knee (L5 or S1 distribution) reproduced between 35° and 70°.',
    structuralDifferentiation: 'Pain relieved when lowering leg slightly, but immediately reproduced with passive ankle dorsiflexion (Bragard) or great toe extension (Sicard) confirms neural tension over hamstring muscle tightness.',
  },
  {
    id: 'slump',
    name: 'Slump Test (Maitland Neurodynamic Evaluation)',
    indication: 'Full dural mobility, spinal cord traction, epidural adhesions, subacute radiculopathy.',
    startingPosition: 'Patient seated on edge of couch, thighs supported, hands clasped behind back.',
    stages: [
      { step: 1, action: 'Thoracic and lumbar slump (kyphotic slump with neutral cervical spine)', structuralTarget: 'Pre-tensions thoracic and lumbar dura.' },
      { step: 2, action: 'Active or passive cervical spine flexion (chin to chest)', structuralTarget: 'Draws spinal cord cephalad, tensing craniocervical dura.' },
      { step: 3, action: 'Active knee extension of symptomatic leg', structuralTarget: 'Tenses sciatic nerve and lumbosacral nerve roots.' },
      { step: 4, action: 'Passive ankle dorsiflexion', structuralTarget: 'Maximal continuous neurodynamic tract tension from cranium to plantar foot.' },
      { step: 5, action: 'Release cervical flexion while holding leg position', structuralTarget: 'Structural differentiation: reduces cranial dural tension.' },
    ],
    normalResponse: 'Mild tension in posterior thigh/knee, slight restriction in full dorsiflexion.',
    positiveResponse: 'Reproduction of patient’s clinical radicular or back pain during the maneuver.',
    structuralDifferentiation: 'If distal symptoms in calf/foot are relieved or significantly reduced upon releasing neck flexion alone (while keeping knee extended and ankle dorsiflexed), the test is unequivocally positive for neural/dural mechanosensitivity.',
  },
  {
    id: 'femoral_stretch',
    name: 'Femoral Nerve Stretch Test (Reverse SLR / Ely’s / Wassermann)',
    indication: 'High lumbar disc herniation (L2–L3, L3–L4) and femoral nerve root radiculopathy.',
    startingPosition: 'Patient prone, pelvis stabilized against the couch.',
    stages: [
      { step: 1, action: 'Passive knee flexion to 90° or end-range', structuralTarget: 'Tenses femoral nerve and L2-L4 roots; stretches rectus femoris.' },
      { step: 2, action: 'Passive hip extension while maintaining knee flexion', structuralTarget: 'Draws femoral nerve distally through inguinal canal, maximal traction on L2-L4 roots.' },
    ],
    normalResponse: 'Anterior thigh tightness (quadriceps stretch) without radiating neurological symptoms.',
    positiveResponse: 'Sharp radiating pain into anterior thigh or medial lower leg (L3 or L4 dermatome).',
    structuralDifferentiation: 'Distinguish from rectus femoris tightness by stabilizing pelvis to avoid anterior pelvic tilt, and assessing whether knee flexion alone or hip extension triggers true radicular pain.',
  },
];

export const CAUDA_EQUINA_RED_FLAGS = [
  {
    id: 'rf_1',
    flag: 'Saddle / Perineal Anesthesia',
    description: 'Loss of sensation in perineum, buttocks, anus, and inner thighs (S3–S5 dermatomes). Ask specifically: "Do you feel normal sensation when wiping yourself with toilet paper?"',
    urgency: 'Immediate Emergency (Same-day MRI & Neurosurgical / Ortho Spine Referral)',
  },
  {
    id: 'rf_2',
    flag: 'Bladder Dysfunction',
    description: 'Urinary retention (inability to void with full bladder), diminished stream, loss of sensation of urinary flow, or overflow incontinence.',
    urgency: 'Immediate Emergency',
  },
  {
    id: 'rf_3',
    flag: 'Bowel Dysfunction',
    description: 'Loss of anal sphincter tone (lax anal sphincter), fecal incontinence, or inability to control flatulence.',
    urgency: 'Immediate Emergency',
  },
  {
    id: 'rf_4',
    flag: 'Progressive Bilateral Motor Deficits',
    description: 'Bilateral foot drop, profound lower extremity weakness (MMT < 3/5 in multiple myotomes), inability to walk or bear weight.',
    urgency: 'Emergency',
  },
  {
    id: 'rf_5',
    flag: 'Unexplained Weight Loss & Night Pain',
    description: 'Constant unremitting spinal ache waking patient from sleep, unresponsive to position changes, associated with history of cancer.',
    urgency: 'Urgent Oncological / Spinal Screening',
  },
];
