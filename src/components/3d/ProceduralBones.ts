import * as THREE from 'three';
import { JointId, SpinePathologyType } from '../../types/biomechanics';
import { createAnatomicalMaterials } from './ProceduralBoneTextures';

/**
 * Procedural Anatomical Bone Generator for 3D Anatomy & Biomechanics
 * Creates true-to-life multi-part anatomical bone meshes with realistic epiphyses,
 * diaphyses, articular hyaline cartilage surfaces, labra, menisci, and distinct fixed vs moving bone coloring.
 */

export interface BoneRig {
  fixedGroup: THREE.Group;
  movingGroup: THREE.Group;
  jointAnchor: THREE.Group; // Pivot point at anatomical joint axis
  landmarksGroup: THREE.Group;
  materials: {
    fixedBoneMat: THREE.MeshStandardMaterial;
    movingBoneMat: THREE.MeshStandardMaterial;
    cartilageMat: THREE.MeshStandardMaterial;
    xRayBoneMat: THREE.MeshStandardMaterial;
    fibrocartilageMat: THREE.MeshStandardMaterial;
  };
  setXRayMode: (enabled: boolean) => void;
  setCartilageHighlight: (highlight: boolean) => void;
  dispose: () => void;
}

// Landmark marker material
export const landmarkMat = new THREE.MeshStandardMaterial({
  color: 0xd4af37, // Gold
  roughness: 0.25,
  metalness: 0.65,
  emissive: 0x996515,
  emissiveIntensity: 0.45,
});

export function createProceduralJoint(
  jointId: JointId,
  spinePathology: SpinePathologyType = 'healthy'
): BoneRig {
  const fixedGroup = new THREE.Group();
  const movingGroup = new THREE.Group();
  const jointAnchor = new THREE.Group();
  const landmarksGroup = new THREE.Group();

  jointAnchor.add(movingGroup);

  const materials = createAnatomicalMaterials();
  const { fixedBoneMat, movingBoneMat, cartilageMat, xRayBoneMat, fibrocartilageMat } = materials;

  switch (jointId) {
    case 'shoulder':
      buildShoulderJoint(fixedGroup, movingGroup, landmarksGroup, fixedBoneMat, movingBoneMat, cartilageMat, fibrocartilageMat);
      break;
    case 'elbow':
      buildElbowJoint(fixedGroup, movingGroup, landmarksGroup, fixedBoneMat, movingBoneMat, cartilageMat);
      break;
    case 'hip':
      buildHipJoint(fixedGroup, movingGroup, landmarksGroup, fixedBoneMat, movingBoneMat, cartilageMat, fibrocartilageMat);
      break;
    case 'knee':
      buildKneeJoint(fixedGroup, movingGroup, landmarksGroup, fixedBoneMat, movingBoneMat, cartilageMat, fibrocartilageMat);
      break;
    case 'ankle':
      buildAnkleJoint(fixedGroup, movingGroup, landmarksGroup, fixedBoneMat, movingBoneMat, cartilageMat);
      break;
    case 'spine':
      buildSpineJoint(fixedGroup, movingGroup, landmarksGroup, fixedBoneMat, movingBoneMat, cartilageMat, spinePathology);
      break;
  }

  // Toggle X-Ray Translucent Bone Inspection
  const setXRayMode = (enabled: boolean) => {
    fixedBoneMat.transparent = enabled;
    fixedBoneMat.opacity = enabled ? 0.35 : 1.0;
    fixedBoneMat.depthWrite = !enabled;

    movingBoneMat.transparent = enabled;
    movingBoneMat.opacity = enabled ? 0.35 : 1.0;
    movingBoneMat.depthWrite = !enabled;
  };

  // Toggle Cartilage Glow / Highlighting
  const setCartilageHighlight = (highlight: boolean) => {
    if (highlight) {
      cartilageMat.color.setHex(0x38bdf8); // Bright cyan hyaline glow
      cartilageMat.emissive.setHex(0x0284c7);
      cartilageMat.emissiveIntensity = 0.55;
    } else {
      cartilageMat.color.setHex(0xe0f2fe); // Natural porcelain sheen
      cartilageMat.emissive.setHex(0x000000);
      cartilageMat.emissiveIntensity = 0;
    }
  };

  const dispose = () => {
    const cleanGroup = (grp: THREE.Group) => {
      grp.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
        }
      });
    };
    cleanGroup(fixedGroup);
    cleanGroup(movingGroup);
    cleanGroup(jointAnchor);
    cleanGroup(landmarksGroup);
  };

  return {
    fixedGroup,
    movingGroup,
    jointAnchor,
    landmarksGroup,
    materials,
    setXRayMode,
    setCartilageHighlight,
    dispose,
  };
}

// =========================================================================
// 1. SHOULDER: Scapula + Clavicle (Fixed) & Humerus (Moving)
// =========================================================================
function buildShoulderJoint(
  fixed: THREE.Group,
  moving: THREE.Group,
  landmarks: THREE.Group,
  fixedBoneMat: THREE.MeshStandardMaterial,
  movingBoneMat: THREE.MeshStandardMaterial,
  cartilageMat: THREE.MeshStandardMaterial,
  fibrocartilageMat: THREE.MeshStandardMaterial
) {
  // Scapular Blade: Anatomical triangular shape with subscapular concavity
  const scapulaShape = new THREE.Shape();
  scapulaShape.moveTo(-0.16, 0.41); // Superior angle
  scapulaShape.lineTo(0.08, 0.38);  // Glenoid neck region
  scapulaShape.lineTo(0.02, 0.11);  // Inferior angle
  scapulaShape.lineTo(-0.15, 0.23); // Medial / vertebral border
  scapulaShape.closePath();

  const scapulaGeo = new THREE.ExtrudeGeometry(scapulaShape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.007,
    bevelThickness: 0.007,
  });
  const scapulaMesh = new THREE.Mesh(scapulaGeo, fixedBoneMat);
  scapulaMesh.position.set(0, 0, -0.05);
  fixed.add(scapulaMesh);

  // Spine of Scapula (posterior horizontal triangular shelf)
  const spineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.15, 0.33, -0.04),
    new THREE.Vector3(-0.03, 0.37, -0.02),
    new THREE.Vector3(0.09, 0.40, 0.01),
  ]);
  const spineGeo = new THREE.TubeGeometry(spineCurve, 16, 0.014, 12, false);
  const spineMesh = new THREE.Mesh(spineGeo, fixedBoneMat);
  fixed.add(spineMesh);

  // Acromion Process (broad curved lateral shelf with clavicular facet)
  const acromionGeo = new THREE.BoxGeometry(0.065, 0.018, 0.075);
  const acromionMesh = new THREE.Mesh(acromionGeo, fixedBoneMat);
  acromionMesh.rotation.y = -Math.PI / 12;
  acromionMesh.position.set(0.12, 0.42, 0.0);
  fixed.add(acromionMesh);

  // Coracoid Process (hook-shaped anterior process)
  const coracoidCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.06, 0.37, -0.01),
    new THREE.Vector3(0.07, 0.39, 0.04),
    new THREE.Vector3(0.09, 0.38, 0.06),
  ]);
  const coracoidGeo = new THREE.TubeGeometry(coracoidCurve, 14, 0.010, 10, false);
  const coracoidMesh = new THREE.Mesh(coracoidGeo, fixedBoneMat);
  fixed.add(coracoidMesh);

  // Glenoid Cavity: Pear-shaped shallow socket with hyaline cartilage
  const glenoidGeo = new THREE.SphereGeometry(0.046, 24, 20, 0, Math.PI * 2, 0, Math.PI / 3.2);
  glenoidGeo.scale(1.15, 1.45, 0.85); // Pear-shaped aspect
  const glenoidMesh = new THREE.Mesh(glenoidGeo, cartilageMat);
  glenoidMesh.rotation.y = -Math.PI / 2;
  glenoidMesh.position.set(0.088, 0.37, 0.0);
  fixed.add(glenoidMesh);

  // Glenoid Labrum (fibrocartilaginous ring deepening socket)
  const labrumGeo = new THREE.TorusGeometry(0.038, 0.006, 12, 24);
  labrumGeo.scale(1.0, 1.35, 1.0);
  const labrumMesh = new THREE.Mesh(labrumGeo, fibrocartilageMat);
  labrumMesh.rotation.y = -Math.PI / 2;
  labrumMesh.position.set(0.089, 0.37, 0.0);
  fixed.add(labrumMesh);

  // Clavicle: Sigmoid S-curved bone (convex anteriorly medially, concave laterally)
  const clavicleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.16, 0.44, 0.08), // Sternal end
    new THREE.Vector3(-0.04, 0.43, 0.11), // Medial forward curve
    new THREE.Vector3(0.05, 0.42, 0.05),  // Lateral inflection
    new THREE.Vector3(0.12, 0.43, 0.02),  // Acromioclavicular end
  ]);
  const clavicleGeo = new THREE.TubeGeometry(clavicleCurve, 24, 0.012, 12, false);
  const clavicleMesh = new THREE.Mesh(clavicleGeo, fixedBoneMat);
  fixed.add(clavicleMesh);

  // MOVING: Humerus (Lighter ivory tone with hyaline head)
  // Humeral Head: 1/3 sphere oriented posterosuperomedially with smooth cartilage
  const humHeadGeo = new THREE.SphereGeometry(0.048, 28, 24);
  const humHeadMesh = new THREE.Mesh(humHeadGeo, cartilageMat);
  humHeadMesh.position.set(0.128, 0.37, 0.0);
  moving.add(humHeadMesh);

  // Anatomical Neck & Greater Tubercle (lateral prominence with 3 facet impressions)
  const gtGeo = new THREE.BoxGeometry(0.032, 0.045, 0.038);
  const gtMesh = new THREE.Mesh(gtGeo, movingBoneMat);
  gtMesh.position.set(0.175, 0.38, 0.015);
  moving.add(gtMesh);

  // Lesser Tubercle (anterior prominence)
  const ltGeo = new THREE.SphereGeometry(0.018, 16, 16);
  const ltMesh = new THREE.Mesh(ltGeo, movingBoneMat);
  ltMesh.position.set(0.155, 0.36, 0.042);
  moving.add(ltMesh);

  // Bicipital Intertubercular Sulcus (biceps tendon groove)
  const grooveGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.09, 12);
  const grooveMesh = new THREE.Mesh(grooveGeo, movingBoneMat);
  grooveMesh.position.set(0.165, 0.34, 0.032);
  moving.add(grooveMesh);

  // Humeral Shaft (Diaphysis) with Deltoid Tuberosity
  const humShaftGeo = new THREE.CylinderGeometry(0.021, 0.019, 0.36, 22);
  const humShaftMesh = new THREE.Mesh(humShaftGeo, movingBoneMat);
  humShaftMesh.position.set(0.17, 0.18, 0.0);
  moving.add(humShaftMesh);

  // Deltoid Tuberosity (V-shaped lateral ridge)
  const deltoidTubGeo = new THREE.BoxGeometry(0.012, 0.05, 0.016);
  const deltoidTubMesh = new THREE.Mesh(deltoidTubGeo, movingBoneMat);
  deltoidTubMesh.position.set(0.192, 0.22, 0.0);
  moving.add(deltoidTubMesh);

  // Distal Humerus: Medial & Lateral Epicondyles
  const distalHumGeo = new THREE.CylinderGeometry(0.034, 0.028, 0.07, 18);
  const distalHumMesh = new THREE.Mesh(distalHumGeo, movingBoneMat);
  distalHumMesh.rotation.z = Math.PI / 2;
  distalHumMesh.position.set(0.17, 0.01, 0.0);
  moving.add(distalHumMesh);

  // Landmarks
  addLandmark(landmarks, 'Acromion Process', [0.12, 0.43, 0.0]);
  addLandmark(landmarks, 'Greater Tubercle', [0.18, 0.38, 0.02]);
  addLandmark(landmarks, 'Coracoid Process', [0.08, 0.39, 0.06]);
  addLandmark(landmarks, 'Deltoid Tuberosity', [0.19, 0.22, 0.0]);
}

// =========================================================================
// 2. ELBOW & FOREARM: Humerus (Fixed) & Radius/Ulna (Moving)
// =========================================================================
function buildElbowJoint(
  fixed: THREE.Group,
  moving: THREE.Group,
  landmarks: THREE.Group,
  fixedBoneMat: THREE.MeshStandardMaterial,
  movingBoneMat: THREE.MeshStandardMaterial,
  cartilageMat: THREE.MeshStandardMaterial
) {
  // FIXED: Distal Humerus (Shaft, Trochlea, Capitulum, Epicondyles, Olecranon Fossa)
  const humShaftGeo = new THREE.CylinderGeometry(0.022, 0.025, 0.34, 22);
  const humShaftMesh = new THREE.Mesh(humShaftGeo, fixedBoneMat);
  humShaftMesh.position.set(0.0, 0.18, 0.0);
  fixed.add(humShaftMesh);

  // Medial Epicondyle (prominent projection with sublime tubercle)
  const medEpicondyleGeo = new THREE.SphereGeometry(0.020, 16, 16);
  medEpicondyleGeo.scale(1.2, 0.9, 0.9);
  const medEpicondyleMesh = new THREE.Mesh(medEpicondyleGeo, fixedBoneMat);
  medEpicondyleMesh.position.set(-0.046, 0.018, 0.0);
  fixed.add(medEpicondyleMesh);

  // Lateral Epicondyle
  const latEpicondyleGeo = new THREE.SphereGeometry(0.016, 16, 16);
  const latEpicondyleMesh = new THREE.Mesh(latEpicondyleGeo, fixedBoneMat);
  latEpicondyleMesh.position.set(0.046, 0.018, 0.0);
  fixed.add(latEpicondyleMesh);

  // Trochlea: Spool-shaped pulley with steep medial ridge
  const trochleaGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.036, 24);
  const trochleaMesh = new THREE.Mesh(trochleaGeo, cartilageMat);
  trochleaMesh.rotation.z = Math.PI / 2;
  trochleaMesh.position.set(-0.012, 0.0, 0.0);
  fixed.add(trochleaMesh);

  // Capitulum: Rounded hemisphere for radius head articulation
  const capitulumGeo = new THREE.SphereGeometry(0.019, 22, 18);
  const capitulumMesh = new THREE.Mesh(capitulumGeo, cartilageMat);
  capitulumMesh.position.set(0.026, 0.0, 0.006);
  fixed.add(capitulumMesh);

  // Posterior Olecranon Fossa (deep depression)
  const fossaGeo = new THREE.BoxGeometry(0.034, 0.038, 0.012);
  const fossaMesh = new THREE.Mesh(fossaGeo, fixedBoneMat);
  fossaMesh.position.set(-0.008, 0.028, -0.018);
  fixed.add(fossaMesh);

  // MOVING: Forearm (Ulna + Radius + Interosseous Membrane + Hand skeleton)
  // Ulna: Olecranon Process forming posterior beak
  const olecranonGeo = new THREE.BoxGeometry(0.026, 0.038, 0.036);
  const olecranonMesh = new THREE.Mesh(olecranonGeo, movingBoneMat);
  olecranonMesh.position.set(-0.012, 0.016, -0.016);
  moving.add(olecranonMesh);

  // Coronoid Process of Ulna (anterior projection)
  const coronoidGeo = new THREE.ConeGeometry(0.014, 0.024, 14);
  const coronoidMesh = new THREE.Mesh(coronoidGeo, movingBoneMat);
  coronoidMesh.rotation.x = -Math.PI / 3;
  coronoidMesh.position.set(-0.012, -0.005, 0.018);
  moving.add(coronoidMesh);

  // Trochlear Notch: Semilunar notch with hyaline cartilage
  const trochlearNotchGeo = new THREE.TorusGeometry(0.019, 0.009, 14, 20, Math.PI);
  const notchMesh = new THREE.Mesh(trochlearNotchGeo, cartilageMat);
  notchMesh.rotation.y = Math.PI / 2;
  notchMesh.position.set(-0.012, 0.0, 0.0);
  moving.add(notchMesh);

  // Ulnar Shaft with sharp interosseous crest
  const ulnaShaftGeo = new THREE.CylinderGeometry(0.015, 0.011, 0.30, 18);
  const ulnaShaftMesh = new THREE.Mesh(ulnaShaftGeo, movingBoneMat);
  ulnaShaftMesh.position.set(-0.014, -0.16, 0.0);
  moving.add(ulnaShaftMesh);

  // Ulnar Head & Styloid Process at wrist
  const ulnaStyloidGeo = new THREE.SphereGeometry(0.011, 14, 14);
  const ulnaStyloidMesh = new THREE.Mesh(ulnaStyloidGeo, movingBoneMat);
  ulnaStyloidMesh.position.set(-0.014, -0.31, 0.0);
  moving.add(ulnaStyloidMesh);

  // Radius: Concave Radial Head (dish for capitulum with cartilage)
  const radHeadGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.013, 22);
  const radHeadMesh = new THREE.Mesh(radHeadGeo, cartilageMat);
  radHeadMesh.position.set(0.026, -0.006, 0.0);
  moving.add(radHeadMesh);

  // Radial Neck
  const radNeckGeo = new THREE.CylinderGeometry(0.011, 0.013, 0.03, 16);
  const radNeckMesh = new THREE.Mesh(radNeckGeo, movingBoneMat);
  radNeckMesh.position.set(0.026, -0.026, 0.0);
  moving.add(radNeckMesh);

  // Radial (Bicipital) Tuberosity
  const tuberosityGeo = new THREE.SphereGeometry(0.011, 14, 14);
  const tuberosityMesh = new THREE.Mesh(tuberosityGeo, movingBoneMat);
  tuberosityMesh.position.set(0.022, -0.046, 0.013);
  moving.add(tuberosityMesh);

  // Bowed Radial Shaft
  const radShaftGeo = new THREE.CylinderGeometry(0.014, 0.017, 0.26, 18);
  const radShaftMesh = new THREE.Mesh(radShaftGeo, movingBoneMat);
  radShaftMesh.position.set(0.028, -0.17, 0.0);
  moving.add(radShaftMesh);

  // Radial Styloid Process & Lister's Tubercle at distal radius
  const radStyloidGeo = new THREE.BoxGeometry(0.032, 0.022, 0.026);
  const radStyloidMesh = new THREE.Mesh(radStyloidGeo, movingBoneMat);
  radStyloidMesh.position.set(0.028, -0.30, 0.0);
  moving.add(radStyloidMesh);

  // Interosseous Membrane: Fibrous sheet between radius and ulna
  const interosseousGeo = new THREE.PlaneGeometry(0.024, 0.22);
  const interosseousMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    roughness: 0.7,
  });
  const interosseousMesh = new THREE.Mesh(interosseousGeo, interosseousMat);
  interosseousMesh.position.set(0.007, -0.17, 0.0);
  moving.add(interosseousMesh);

  // Hand skeleton (Carpals, Metacarpals, Phalanges)
  const handGeo = new THREE.BoxGeometry(0.052, 0.095, 0.024);
  const handMesh = new THREE.Mesh(handGeo, movingBoneMat);
  handMesh.position.set(0.01, -0.36, 0.0);
  moving.add(handMesh);

  // Landmarks
  addLandmark(landmarks, 'Lateral Epicondyle', [0.046, 0.018, 0.0]);
  addLandmark(landmarks, 'Medial Epicondyle', [-0.046, 0.018, 0.0]);
  addLandmark(landmarks, 'Olecranon Beak', [-0.012, 0.025, -0.02]);
  addLandmark(landmarks, 'Radial Styloid', [0.036, -0.31, 0.01]);
}

// =========================================================================
// 3. HIP: Pelvis (Fixed) & Femur (Moving)
// =========================================================================
function buildHipJoint(
  fixed: THREE.Group,
  moving: THREE.Group,
  landmarks: THREE.Group,
  fixedBoneMat: THREE.MeshStandardMaterial,
  movingBoneMat: THREE.MeshStandardMaterial,
  cartilageMat: THREE.MeshStandardMaterial,
  fibrocartilageMat: THREE.MeshStandardMaterial
) {
  // FIXED: Pelvis / Hemi-pelvis with Iliac Crest, ASIS, AIIS, Ischium, Pubis, Obturator Ring
  const iliumShape = new THREE.Shape();
  iliumShape.moveTo(-0.17, 0.10); // ASIS
  iliumShape.lineTo(-0.15, 0.29); // Iliac crest peak
  iliumShape.lineTo(0.13, 0.27);  // PSIS
  iliumShape.lineTo(0.15, 0.06);  // Greater sciatic notch / Ischial spine
  iliumShape.lineTo(0.09, -0.09); // Ischial tuberosity
  iliumShape.lineTo(-0.07, -0.06);// Pubic ramus & crest
  iliumShape.closePath();

  const pelvisGeo = new THREE.ExtrudeGeometry(iliumShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.012,
    bevelThickness: 0.012,
  });
  const pelvisMesh = new THREE.Mesh(pelvisGeo, fixedBoneMat);
  pelvisMesh.position.set(-0.04, 0.08, -0.05);
  fixed.add(pelvisMesh);

  // Obturator Foramen Opening
  const obturatorGeo = new THREE.TorusGeometry(0.028, 0.008, 12, 20);
  const obturatorMesh = new THREE.Mesh(obturatorGeo, fixedBoneMat);
  obturatorMesh.position.set(0.01, -0.02, 0.0);
  fixed.add(obturatorMesh);

  // Acetabulum: Deep hemispherical cup with horseshoe-shaped lunate cartilage
  const acetabulumGeo = new THREE.SphereGeometry(0.053, 26, 22, 0, Math.PI * 2, 0, Math.PI / 2.1);
  const acetabulumMesh = new THREE.Mesh(acetabulumGeo, cartilageMat);
  acetabulumMesh.rotation.y = Math.PI / 2;
  acetabulumMesh.position.set(0.04, 0.12, 0.0);
  fixed.add(acetabulumMesh);

  // Acetabular Labrum (fibrocartilaginous rim sealing the joint)
  const labrumGeo = new THREE.TorusGeometry(0.051, 0.006, 14, 26);
  const labrumMesh = new THREE.Mesh(labrumGeo, fibrocartilageMat);
  labrumMesh.rotation.y = Math.PI / 2;
  labrumMesh.position.set(0.042, 0.12, 0.0);
  fixed.add(labrumMesh);

  // MOVING: Femur
  // Femoral Head: 2/3 sphere with smooth hyaline cartilage & fovea capitis
  const femHeadGeo = new THREE.SphereGeometry(0.048, 28, 26);
  const femHeadMesh = new THREE.Mesh(femHeadGeo, cartilageMat);
  femHeadMesh.position.set(0.04, 0.12, 0.0);
  moving.add(femHeadMesh);

  // Fovea Capitis (pit for ligamentum teres)
  const foveaGeo = new THREE.SphereGeometry(0.008, 12, 12);
  const foveaMesh = new THREE.Mesh(foveaGeo, fixedBoneMat);
  foveaMesh.position.set(0.005, 0.12, -0.005);
  moving.add(foveaMesh);

  // Femoral Neck (angled at 126° neck-shaft angle with 15° anteversion)
  const femNeckGeo = new THREE.CylinderGeometry(0.022, 0.027, 0.075, 18);
  const femNeckMesh = new THREE.Mesh(femNeckGeo, movingBoneMat);
  femNeckMesh.rotation.z = -Math.PI / 3.1;
  femNeckMesh.position.set(0.082, 0.098, 0.0);
  moving.add(femNeckMesh);

  // Greater Trochanter (large quadrangular mass with trochanteric fossa)
  const gtGeo = new THREE.BoxGeometry(0.044, 0.055, 0.042);
  const gtMesh = new THREE.Mesh(gtGeo, movingBoneMat);
  gtMesh.position.set(0.125, 0.092, 0.0);
  moving.add(gtMesh);

  // Lesser Trochanter (conical posteromedial prominence)
  const ltGeo = new THREE.ConeGeometry(0.015, 0.022, 14);
  const ltMesh = new THREE.Mesh(ltGeo, movingBoneMat);
  ltMesh.rotation.x = Math.PI / 2;
  ltMesh.position.set(0.065, 0.052, -0.022);
  moving.add(ltMesh);

  // Anteriorly Bowed Femoral Shaft with Posterior Linea Aspera
  const femShaftGeo = new THREE.CylinderGeometry(0.025, 0.029, 0.42, 22);
  const femShaftMesh = new THREE.Mesh(femShaftGeo, movingBoneMat);
  femShaftMesh.position.set(0.11, -0.13, 0.006);
  moving.add(femShaftMesh);

  // Distal Femoral Condyles with Intercondylar Notch
  const condyleGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.032, 20);
  const condyleMed = new THREE.Mesh(condyleGeo, movingBoneMat);
  condyleMed.rotation.z = Math.PI / 2;
  condyleMed.position.set(0.078, -0.34, 0.0);

  const condyleLat = new THREE.Mesh(condyleGeo, movingBoneMat);
  condyleLat.rotation.z = Math.PI / 2;
  condyleLat.position.set(0.142, -0.34, 0.0);

  moving.add(condyleMed);
  moving.add(condyleLat);

  // Landmarks
  addLandmark(landmarks, 'ASIS', [-0.08, 0.27, 0.02]);
  addLandmark(landmarks, 'Greater Trochanter', [0.13, 0.11, 0.0]);
  addLandmark(landmarks, 'Ischial Tuberosity', [0.04, -0.02, -0.06]);
}

// =========================================================================
// 4. KNEE: Femur (Fixed) & Tibia, Fibula, Patella (Moving)
// =========================================================================
function buildKneeJoint(
  fixed: THREE.Group,
  moving: THREE.Group,
  landmarks: THREE.Group,
  fixedBoneMat: THREE.MeshStandardMaterial,
  movingBoneMat: THREE.MeshStandardMaterial,
  cartilageMat: THREE.MeshStandardMaterial,
  fibrocartilageMat: THREE.MeshStandardMaterial
) {
  // FIXED: Distal Femur (Shaft, Trochlear Groove, Medial & Lateral Condyles, Epicondyles)
  const femShaftGeo = new THREE.CylinderGeometry(0.026, 0.031, 0.36, 22);
  const femShaftMesh = new THREE.Mesh(femShaftGeo, fixedBoneMat);
  femShaftMesh.position.set(0.0, 0.20, 0.0);
  fixed.add(femShaftMesh);

  // Medial Condyle (longer, curves more posteriorly)
  const medCondyleGeo = new THREE.CylinderGeometry(0.029, 0.029, 0.036, 24);
  const medCondyleMesh = new THREE.Mesh(medCondyleGeo, cartilageMat);
  medCondyleMesh.rotation.z = Math.PI / 2;
  medCondyleMesh.position.set(-0.034, 0.0, 0.0);
  fixed.add(medCondyleMesh);

  // Lateral Condyle (flatter, higher anterior ridge)
  const latCondyleGeo = new THREE.CylinderGeometry(0.027, 0.027, 0.036, 24);
  const latCondyleMesh = new THREE.Mesh(latCondyleGeo, cartilageMat);
  latCondyleMesh.rotation.z = Math.PI / 2;
  latCondyleMesh.position.set(0.034, 0.0, 0.0);
  fixed.add(latCondyleMesh);

  // Anterior Trochlear Groove for Patella
  const trochlearGeo = new THREE.BoxGeometry(0.054, 0.065, 0.016);
  const trochlearMesh = new THREE.Mesh(trochlearGeo, cartilageMat);
  trochlearMesh.position.set(0.0, 0.032, 0.032);
  fixed.add(trochlearMesh);

  // Medial Epicondyle & Adductor Tubercle
  const medEpicondyleGeo = new THREE.SphereGeometry(0.015, 14, 14);
  const medEpicondyleMesh = new THREE.Mesh(medEpicondyleGeo, fixedBoneMat);
  medEpicondyleMesh.position.set(-0.048, 0.018, 0.0);
  fixed.add(medEpicondyleMesh);

  // Lateral Epicondyle
  const latEpicondyleGeo = new THREE.SphereGeometry(0.014, 14, 14);
  const latEpicondyleMesh = new THREE.Mesh(latEpicondyleGeo, fixedBoneMat);
  latEpicondyleMesh.position.set(0.048, 0.018, 0.0);
  fixed.add(latEpicondyleMesh);

  // MOVING: Tibia + Fibula + Patella + Menisci
  // Tibial Plateau (Medial concave plateau + Lateral plateau with hyaline cartilage)
  const tibPlateauGeo = new THREE.BoxGeometry(0.096, 0.032, 0.070);
  const tibPlateauMesh = new THREE.Mesh(tibPlateauGeo, movingBoneMat);
  tibPlateauMesh.position.set(0.0, -0.018, 0.0);
  moving.add(tibPlateauMesh);

  const plateauCartilageGeo = new THREE.BoxGeometry(0.092, 0.006, 0.066);
  const plateauCartilageMesh = new THREE.Mesh(plateauCartilageGeo, cartilageMat);
  plateauCartilageMesh.position.set(0.0, -0.002, 0.0);
  moving.add(plateauCartilageMesh);

  // Intercondylar Eminence (Tibial Spines between plateaus)
  const spinesGeo = new THREE.ConeGeometry(0.008, 0.018, 12);
  const medSpine = new THREE.Mesh(spinesGeo, movingBoneMat);
  medSpine.position.set(-0.006, 0.006, 0.0);
  const latSpine = new THREE.Mesh(spinesGeo, movingBoneMat);
  latSpine.position.set(0.006, 0.006, 0.0);
  moving.add(medSpine);
  moving.add(latSpine);

  // Medial Meniscus (C-shaped fibrocartilage)
  const medMeniscusGeo = new THREE.TorusGeometry(0.022, 0.0055, 10, 20, Math.PI * 0.95);
  const medMeniscusMesh = new THREE.Mesh(medMeniscusGeo, fibrocartilageMat);
  medMeniscusMesh.rotation.x = Math.PI / 2;
  medMeniscusMesh.position.set(-0.028, 0.003, 0.0);
  moving.add(medMeniscusMesh);

  // Lateral Meniscus (circular 4/5 ring fibrocartilage)
  const latMeniscusGeo = new THREE.TorusGeometry(0.020, 0.0055, 10, 20, Math.PI * 1.5);
  const latMeniscusMesh = new THREE.Mesh(latMeniscusGeo, fibrocartilageMat);
  latMeniscusMesh.rotation.x = Math.PI / 2;
  latMeniscusMesh.position.set(0.028, 0.003, 0.0);
  moving.add(latMeniscusMesh);

  // Tibial Tuberosity (anterior attachment for patellar ligament)
  const tibTubGeo = new THREE.SphereGeometry(0.016, 14, 14);
  const tibTubMesh = new THREE.Mesh(tibTubGeo, movingBoneMat);
  tibTubMesh.position.set(0.0, -0.052, 0.035);
  moving.add(tibTubMesh);

  // Gerdy's Tubercle (IT Band insertion anterolaterally)
  const gerdyGeo = new THREE.SphereGeometry(0.011, 12, 12);
  const gerdyMesh = new THREE.Mesh(gerdyGeo, movingBoneMat);
  gerdyMesh.position.set(0.038, -0.040, 0.024);
  moving.add(gerdyMesh);

  // Tibial Shaft (triangular prism with sharp anterior crest)
  const tibShaftGeo = new THREE.CylinderGeometry(0.023, 0.019, 0.34, 18);
  const tibShaftMesh = new THREE.Mesh(tibShaftGeo, movingBoneMat);
  tibShaftMesh.position.set(0.0, -0.19, 0.0);
  moving.add(tibShaftMesh);

  // Fibula: Head with styloid apex & slender shaft
  const fibHeadGeo = new THREE.SphereGeometry(0.017, 14, 14);
  const fibHeadMesh = new THREE.Mesh(fibHeadGeo, movingBoneMat);
  fibHeadMesh.position.set(0.054, -0.036, -0.01);
  moving.add(fibHeadMesh);

  const fibShaftGeo = new THREE.CylinderGeometry(0.009, 0.008, 0.32, 14);
  const fibShaftMesh = new THREE.Mesh(fibShaftGeo, movingBoneMat);
  fibShaftMesh.position.set(0.054, -0.19, -0.01);
  moving.add(fibShaftMesh);

  // Patella: Heart-shaped sesamoid bone with posterior cartilage facets
  const patellaGeo = new THREE.ConeGeometry(0.026, 0.040, 18);
  const patellaMesh = new THREE.Mesh(patellaGeo, movingBoneMat);
  patellaMesh.rotation.x = Math.PI;
  patellaMesh.position.set(0.0, 0.028, 0.042);
  moving.add(patellaMesh);

  const patellaCartilageGeo = new THREE.BoxGeometry(0.036, 0.032, 0.005);
  const patellaCartilageMesh = new THREE.Mesh(patellaCartilageGeo, cartilageMat);
  patellaCartilageMesh.position.set(0.0, 0.028, 0.037);
  moving.add(patellaCartilageMesh);

  // Landmarks
  addLandmark(landmarks, 'Lateral Epicondyle', [0.048, 0.018, 0.0]);
  addLandmark(landmarks, 'Tibial Tuberosity', [0.0, -0.052, 0.036]);
  addLandmark(landmarks, 'Fibular Head', [0.054, -0.036, -0.01]);
  addLandmark(landmarks, 'Patella Apex', [0.0, 0.012, 0.046]);
}

// =========================================================================
// 5. ANKLE & FOOT: Tibia/Fibula Mortise (Fixed) & Talus/Foot (Moving)
// =========================================================================
function buildAnkleJoint(
  fixed: THREE.Group,
  moving: THREE.Group,
  landmarks: THREE.Group,
  fixedBoneMat: THREE.MeshStandardMaterial,
  movingBoneMat: THREE.MeshStandardMaterial,
  cartilageMat: THREE.MeshStandardMaterial
) {
  // FIXED: Distal Tibia & Fibula forming the Mortise Socket
  const tibDistalShaftGeo = new THREE.CylinderGeometry(0.021, 0.025, 0.28, 18);
  const tibMesh = new THREE.Mesh(tibDistalShaftGeo, fixedBoneMat);
  tibMesh.position.set(-0.012, 0.15, 0.0);
  fixed.add(tibMesh);

  // Medial Malleolus (tibial downward projection with posterior sulcus)
  const medMalleolusGeo = new THREE.BoxGeometry(0.022, 0.038, 0.028);
  const medMalleolusMesh = new THREE.Mesh(medMalleolusGeo, fixedBoneMat);
  medMalleolusMesh.position.set(-0.036, 0.0, 0.0);
  fixed.add(medMalleolusMesh);

  // Lateral Malleolus (fibular projection, extends ~1 cm more distally for lateral stability)
  const latMalleolusGeo = new THREE.BoxGeometry(0.020, 0.048, 0.028);
  const latMalleolusMesh = new THREE.Mesh(latMalleolusGeo, fixedBoneMat);
  latMalleolusMesh.position.set(0.036, -0.009, 0.0);
  fixed.add(latMalleolusMesh);

  // Tibial Plafond (ceiling of mortise with hyaline cartilage)
  const plafondGeo = new THREE.BoxGeometry(0.052, 0.012, 0.038);
  const plafondMesh = new THREE.Mesh(plafondGeo, cartilageMat);
  plafondMesh.position.set(0.0, 0.01, 0.0);
  fixed.add(plafondMesh);

  // MOVING: Foot (Talus, Calcaneus, Tarsals, Metatarsals, Phalanges)
  // Talus: Trochlea Tali (talar dome) that is wider anteriorly than posteriorly
  const talusTrochleaGeo = new THREE.CylinderGeometry(0.023, 0.020, 0.040, 22);
  const talusMesh = new THREE.Mesh(talusTrochleaGeo, cartilageMat);
  talusMesh.rotation.z = Math.PI / 2;
  talusMesh.position.set(0.0, 0.0, 0.0);
  moving.add(talusMesh);

  // Talar Head & Neck (articulating with navicular)
  const talusHeadGeo = new THREE.SphereGeometry(0.018, 16, 16);
  const talusHeadMesh = new THREE.Mesh(talusHeadGeo, movingBoneMat);
  talusHeadMesh.position.set(0.0, -0.014, 0.032);
  moving.add(talusHeadMesh);

  // Calcaneus (Heel bone projecting posteriorly and plantarly, sustentaculum tali)
  const calcaneusGeo = new THREE.BoxGeometry(0.048, 0.048, 0.095);
  const calcaneusMesh = new THREE.Mesh(calcaneusGeo, movingBoneMat);
  calcaneusMesh.position.set(0.0, -0.042, -0.046);
  moving.add(calcaneusMesh);

  // Sustentaculum Tali (medial shelf supporting talar neck)
  const sustentaculumGeo = new THREE.BoxGeometry(0.016, 0.018, 0.032);
  const sustentaculumMesh = new THREE.Mesh(sustentaculumGeo, movingBoneMat);
  sustentaculumMesh.position.set(-0.026, -0.028, -0.012);
  moving.add(sustentaculumMesh);

  // Navicular & Cuneiforms / Midfoot Arched Skeleton
  const midfootGeo = new THREE.BoxGeometry(0.058, 0.032, 0.065);
  const midfootMesh = new THREE.Mesh(midfootGeo, movingBoneMat);
  midfootMesh.position.set(0.0, -0.032, 0.048);
  moving.add(midfootMesh);

  // Metatarsals & Toes (5 arched ray shafts with metatarsal heads)
  const forefootGeo = new THREE.BoxGeometry(0.068, 0.020, 0.105);
  const forefootMesh = new THREE.Mesh(forefootGeo, movingBoneMat);
  forefootMesh.position.set(0.0, -0.046, 0.130);
  moving.add(forefootMesh);

  // Landmarks
  addLandmark(landmarks, 'Lateral Malleolus', [0.038, -0.01, 0.0]);
  addLandmark(landmarks, 'Medial Malleolus', [-0.038, 0.0, 0.0]);
  addLandmark(landmarks, 'Calcaneal Tuberosity', [0.0, -0.048, -0.095]);
  addLandmark(landmarks, '5th Metatarsal Base', [0.040, -0.046, 0.082]);
}

// =========================================================================
// 6. LUMBAR SPINE: Sacrum / Lower Segment (Fixed) & L4/L5 Segment (Moving)
// Includes Multi-Part Pathological Visualizations (PIVD, Spondylolisthesis, Stenosis, DDD, Scoliosis)
// =========================================================================
function buildSpineJoint(
  fixed: THREE.Group,
  moving: THREE.Group,
  landmarks: THREE.Group,
  fixedBoneMat: THREE.MeshStandardMaterial,
  movingBoneMat: THREE.MeshStandardMaterial,
  cartilageMat: THREE.MeshStandardMaterial,
  pathology: SpinePathologyType
) {
  // Disc & Neural Materials
  const discAnnulusMat = new THREE.MeshStandardMaterial({
    color: pathology === 'degenerative_disc' ? 0x5a6864 : 0x7fa9a3,
    roughness: 0.6,
    metalness: 0.05,
  });

  const discNucleusMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
  });

  const nerveMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.35,
    metalness: 0.1,
    emissive: 0x854d0e,
    emissiveIntensity: 0.35,
  });

  const inflamedNerveMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.3,
    metalness: 0.2,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.75,
  });

  const ligamentFlavumMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.65,
    metalness: 0.05,
    transparent: true,
    opacity: 0.85,
  });

  const osteophyteMat = new THREE.MeshStandardMaterial({
    color: 0xa8a29e,
    roughness: 0.8,
    metalness: 0.1,
  });

  // Helper to build an authentic lumbar vertebra with pedicles, laminae, spinous process, and articular facets
  const createVertebraBody = (isFixed: boolean) => {
    const vGroup = new THREE.Group();
    const mat = isFixed ? fixedBoneMat : movingBoneMat;

    // Vertebral Body (oval kidney shape)
    const bodyGeo = new THREE.CylinderGeometry(0.044, 0.046, 0.035, 26);
    bodyGeo.scale(1.28, 1, 0.92);
    const bodyMesh = new THREE.Mesh(bodyGeo, mat);
    vGroup.add(bodyMesh);

    // Superior & Inferior Endplate Rims
    const endplateGeo = new THREE.TorusGeometry(0.048, 0.004, 12, 26);
    endplateGeo.scale(1.22, 0.9, 1);
    endplateGeo.rotateX(Math.PI / 2);

    const supEndplate = new THREE.Mesh(endplateGeo, cartilageMat);
    supEndplate.position.y = 0.018;
    vGroup.add(supEndplate);

    const infEndplate = new THREE.Mesh(endplateGeo, cartilageMat);
    infEndplate.position.y = -0.018;
    vGroup.add(infEndplate);

    // Bilateral Pedicles
    const pedicleGeo = new THREE.CylinderGeometry(0.007, 0.008, 0.026, 14);
    pedicleGeo.rotateX(Math.PI / 2);

    const leftPedicle = new THREE.Mesh(pedicleGeo, mat);
    leftPedicle.position.set(-0.026, 0.006, -0.044);
    vGroup.add(leftPedicle);

    const rightPedicle = new THREE.Mesh(pedicleGeo, mat);
    rightPedicle.position.set(0.026, 0.006, -0.044);
    vGroup.add(rightPedicle);

    // Posterior Laminae & Spinal Canal Roof
    const laminaGeo = new THREE.BoxGeometry(0.065, 0.024, 0.008);
    const laminaMesh = new THREE.Mesh(laminaGeo, mat);
    laminaMesh.position.set(0, 0.006, -0.058);
    vGroup.add(laminaMesh);

    // Spinous Process (sturdy horizontal rectangular spine)
    const spinousGeo = new THREE.BoxGeometry(0.012, 0.032, 0.052);
    const spinousMesh = new THREE.Mesh(spinousGeo, mat);
    spinousMesh.position.set(0, 0.002, -0.082);
    vGroup.add(spinousMesh);

    // Transverse Processes (costiform lateral wings)
    const tpGeo = new THREE.BoxGeometry(0.046, 0.012, 0.012);
    const leftTp = new THREE.Mesh(tpGeo, mat);
    leftTp.position.set(-0.062, 0.006, -0.042);
    vGroup.add(leftTp);

    const rightTp = new THREE.Mesh(tpGeo, mat);
    rightTp.position.set(0.062, 0.006, -0.042);
    vGroup.add(rightTp);

    // Superior Articular Facets (with cartilage)
    const supFacetGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.014, 12);
    const leftSupFacet = new THREE.Mesh(supFacetGeo, cartilageMat);
    leftSupFacet.position.set(-0.024, 0.024, -0.054);
    vGroup.add(leftSupFacet);

    const rightSupFacet = new THREE.Mesh(supFacetGeo, cartilageMat);
    rightSupFacet.position.set(0.024, 0.024, -0.054);
    vGroup.add(rightSupFacet);

    // Inferior Articular Facets
    const infFacetGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.014, 12);
    const leftInfFacet = new THREE.Mesh(infFacetGeo, cartilageMat);
    leftInfFacet.position.set(-0.020, -0.022, -0.056);
    vGroup.add(leftInfFacet);

    const rightInfFacet = new THREE.Mesh(infFacetGeo, cartilageMat);
    rightInfFacet.position.set(0.020, -0.022, -0.056);
    vGroup.add(rightInfFacet);

    return vGroup;
  };

  // 1. FIXED SEGMENT: L5 Vertebra + Upper Sacral Base
  const l5Group = createVertebraBody(true);
  l5Group.position.set(0, -0.048, 0);
  fixed.add(l5Group);

  // Sacral Promontory Base
  const sacrumGeo = new THREE.ConeGeometry(0.068, 0.07, 18);
  sacrumGeo.scale(1.2, 0.8, 0.9);
  sacrumGeo.rotateX(Math.PI);
  const sacrumMesh = new THREE.Mesh(sacrumGeo, fixedBoneMat);
  sacrumMesh.position.set(0, -0.10, -0.015);
  fixed.add(sacrumMesh);

  // 2. MOVING SEGMENT: L4 Vertebra
  const l4Group = createVertebraBody(false);
  const discHeight = pathology === 'degenerative_disc' ? 0.008 : 0.018;
  l4Group.position.set(0, 0.048 - (0.018 - discHeight), 0);

  if (pathology === 'spondylolisthesis') {
    // Grade 1-2 anterior slip (~12 mm forward translation)
    l4Group.position.z += 0.012;
  } else if (pathology === 'scoliosis') {
    // Coronal Cobb tilt and axial rotation
    l4Group.rotation.z = 0.12;
    l4Group.rotation.y = -0.08;
    l4Group.position.x += 0.006;
  }
  moving.add(l4Group);

  // 3. INTERVERTEBRAL DISC: Concentric Annulus Fibrosus + Central Nucleus
  const discAnnulusGeo = new THREE.CylinderGeometry(0.042, 0.044, discHeight, 26);
  discAnnulusGeo.scale(1.25, 1, 0.92);
  const discAnnulusMesh = new THREE.Mesh(discAnnulusGeo, discAnnulusMat);
  discAnnulusMesh.position.set(0, 0, 0);
  fixed.add(discAnnulusMesh);

  const discNucleusGeo = new THREE.CylinderGeometry(0.020, 0.021, discHeight * 0.92, 18);
  discNucleusGeo.scale(1.2, 1, 0.9);
  const discNucleusMesh = new THREE.Mesh(discNucleusGeo, discNucleusMat);
  discNucleusMesh.position.set(0, 0, -0.005);
  fixed.add(discNucleusMesh);

  // Pathology Specific Structures:
  if (pathology === 'pivd_herniation') {
    // Paracentral/posterolateral disc herniation compressing the traversing nerve root
    const herniationGeo = new THREE.SphereGeometry(0.013, 16, 16);
    herniationGeo.scale(1.1, 0.8, 1.4);
    const herniationMesh = new THREE.Mesh(herniationGeo, discNucleusMat);
    herniationMesh.position.set(0.022, 0.001, -0.044);
    fixed.add(herniationMesh);

    // Inflamed compressed nerve root (bright red)
    const rightNerveCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.015, 0.045, -0.040),
      new THREE.Vector3(0.024, 0.002, -0.046),
      new THREE.Vector3(0.042, -0.052, -0.052),
    ]);
    const rightNerveGeo = new THREE.TubeGeometry(rightNerveCurve, 16, 0.0048, 10, false);
    const rightNerveMesh = new THREE.Mesh(rightNerveGeo, inflamedNerveMat);
    fixed.add(rightNerveMesh);
  } else {
    // Normal healthy right nerve root (golden yellow)
    const rightNerveCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.015, 0.045, -0.040),
      new THREE.Vector3(0.026, 0.005, -0.048),
      new THREE.Vector3(0.042, -0.052, -0.052),
    ]);
    const rightNerveGeo = new THREE.TubeGeometry(rightNerveCurve, 16, 0.0042, 10, false);
    const rightNerveMesh = new THREE.Mesh(rightNerveGeo, nerveMat);
    fixed.add(rightNerveMesh);
  }

  // Left Nerve Root
  const leftNerveCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.015, 0.045, -0.040),
    new THREE.Vector3(-0.026, 0.005, -0.048),
    new THREE.Vector3(-0.042, -0.052, -0.052),
  ]);
  const leftNerveGeo = new THREE.TubeGeometry(leftNerveCurve, 16, 0.0042, 10, false);
  const leftNerveMesh = new THREE.Mesh(leftNerveGeo, nerveMat);
  fixed.add(leftNerveMesh);

  // Central Cauda Equina / Thecal Sac
  const thecalGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.14, 16);
  thecalGeo.scale(1.2, 1, 0.85);
  const thecalMesh = new THREE.Mesh(thecalGeo, nerveMat);
  thecalMesh.position.set(0, 0, -0.045);
  fixed.add(thecalMesh);

  // Hypertrophied Ligamentum Flavum in Spinal Stenosis
  if (pathology === 'spinal_stenosis') {
    const flavumGeo = new THREE.BoxGeometry(0.048, 0.024, 0.012);
    const flavumMesh = new THREE.Mesh(flavumGeo, ligamentFlavumMat);
    flavumMesh.position.set(0, 0.006, -0.048);
    fixed.add(flavumMesh);
  }

  // Osteophytes / Bone Spurs in DDD
  if (pathology === 'degenerative_disc') {
    const spurGeo = new THREE.ConeGeometry(0.009, 0.016, 12);
    spurGeo.rotateX(Math.PI / 2);
    const antSpur = new THREE.Mesh(spurGeo, osteophyteMat);
    antSpur.position.set(0, 0.004, 0.046);
    fixed.add(antSpur);

    const latSpur = new THREE.Mesh(spurGeo, osteophyteMat);
    latSpur.rotation.y = Math.PI / 2;
    latSpur.position.set(0.046, -0.004, 0.01);
    fixed.add(latSpur);
  }

  // Landmarks
  addLandmark(landmarks, 'L4 Spinous Process', [0, 0.050, -0.082]);
  addLandmark(landmarks, 'L5 Spinous Process', [0, -0.046, -0.082]);
  addLandmark(landmarks, 'L4-L5 Disc Space', [0, 0, 0.045]);
}

/**
 * Adds an interactive landmark sphere to the rig
 */
function addLandmark(group: THREE.Group, name: string, coords: [number, number, number]) {
  const geo = new THREE.SphereGeometry(0.008, 14, 14);
  const mesh = new THREE.Mesh(geo, landmarkMat);
  mesh.position.set(...coords);
  mesh.userData = { landmarkName: name };
  group.add(mesh);
}
