import * as THREE from 'three';
import { JointId } from '../../types/biomechanics';

/**
 * Procedural Anatomical Bone Generator
 * Creates multi-part compound anatomical bone meshes with realistic epiphyses,
 * diaphyses, articular condyles, and distinct fixed vs moving bone coloring.
 */

export interface BoneRig {
  fixedGroup: THREE.Group;
  movingGroup: THREE.Group;
  jointAnchor: THREE.Group; // Pivot point at anatomical joint axis
  landmarksGroup: THREE.Group;
  dispose: () => void;
}

// Fixed bone material: deeper osteoid bone tone
const fixedBoneMat = new THREE.MeshStandardMaterial({
  color: 0xc8bfa8,
  roughness: 0.55,
  metalness: 0.08,
});

// Moving bone material: lighter ivory bone tone (per prompt requirement)
const movingBoneMat = new THREE.MeshStandardMaterial({
  color: 0xfdf9ee,
  roughness: 0.38,
  metalness: 0.05,
});

// Articular cartilage / joint surface
const cartilageMat = new THREE.MeshStandardMaterial({
  color: 0xe2f0f8,
  roughness: 0.22,
  metalness: 0.12,
});

// Landmark marker material
export const landmarkMat = new THREE.MeshStandardMaterial({
  color: 0xd4af37, // Gold
  roughness: 0.3,
  metalness: 0.6,
  emissive: 0x996515,
  emissiveIntensity: 0.4,
});

export function createProceduralJoint(jointId: JointId): BoneRig {
  const fixedGroup = new THREE.Group();
  const movingGroup = new THREE.Group();
  const jointAnchor = new THREE.Group();
  const landmarksGroup = new THREE.Group();

  jointAnchor.add(movingGroup);

  switch (jointId) {
    case 'shoulder':
      buildShoulderJoint(fixedGroup, movingGroup, landmarksGroup);
      break;
    case 'elbow':
      buildElbowJoint(fixedGroup, movingGroup, landmarksGroup);
      break;
    case 'hip':
      buildHipJoint(fixedGroup, movingGroup, landmarksGroup);
      break;
    case 'knee':
      buildKneeJoint(fixedGroup, movingGroup, landmarksGroup);
      break;
    case 'ankle':
      buildAnkleJoint(fixedGroup, movingGroup, landmarksGroup);
      break;
  }

  const dispose = () => {
    // Traverse and dispose geometries and materials
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
    dispose,
  };
}

// -------------------------------------------------------------
// 1. SHOULDER: Scapula + Clavicle (Fixed) & Humerus (Moving)
// -------------------------------------------------------------
function buildShoulderJoint(fixed: THREE.Group, moving: THREE.Group, landmarks: THREE.Group) {
  // Scapula blade: Flat triangular body
  const scapulaShape = new THREE.Shape();
  scapulaShape.moveTo(-0.15, 0.40); // Superior angle
  scapulaShape.lineTo(0.08, 0.38);  // Glenoid neck region
  scapulaShape.lineTo(0.02, 0.12);  // Inferior angle
  scapulaShape.lineTo(-0.14, 0.24); // Medial border
  scapulaShape.closePath();

  const scapulaGeo = new THREE.ExtrudeGeometry(scapulaShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.006,
    bevelThickness: 0.006,
  });
  const scapulaMesh = new THREE.Mesh(scapulaGeo, fixedBoneMat);
  scapulaMesh.position.set(0, 0, -0.05);
  fixed.add(scapulaMesh);

  // Spine of Scapula and Acromion process
  const spineGeo = new THREE.CylinderGeometry(0.016, 0.012, 0.22, 16);
  const spineMesh = new THREE.Mesh(spineGeo, fixedBoneMat);
  spineMesh.rotation.z = Math.PI / 2.3;
  spineMesh.position.set(-0.02, 0.38, -0.02);
  fixed.add(spineMesh);

  // Acromion shelf
  const acromionGeo = new THREE.BoxGeometry(0.05, 0.016, 0.06);
  const acromionMesh = new THREE.Mesh(acromionGeo, fixedBoneMat);
  acromionMesh.position.set(0.12, 0.42, 0.0);
  fixed.add(acromionMesh);

  // Coracoid process
  const coracoidGeo = new THREE.CylinderGeometry(0.01, 0.012, 0.06, 12);
  const coracoidMesh = new THREE.Mesh(coracoidGeo, fixedBoneMat);
  coracoidMesh.rotation.x = Math.PI / 3;
  coracoidMesh.position.set(0.08, 0.38, 0.04);
  fixed.add(coracoidMesh);

  // Glenoid fossa (concave articular surface)
  const glenoidGeo = new THREE.SphereGeometry(0.045, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3);
  const glenoidMesh = new THREE.Mesh(glenoidGeo, cartilageMat);
  glenoidMesh.rotation.y = -Math.PI / 2;
  glenoidMesh.position.set(0.09, 0.37, 0.0);
  fixed.add(glenoidMesh);

  // Clavicle (S-shaped curved tube)
  const clavicleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.16, 0.44, 0.08), // Sternal end
    new THREE.Vector3(-0.02, 0.42, 0.10), // Medial curvature
    new THREE.Vector3(0.11, 0.43, 0.02),  // Acromial end
  ]);
  const clavicleGeo = new THREE.TubeGeometry(clavicleCurve, 20, 0.012, 12, false);
  const clavicleMesh = new THREE.Mesh(clavicleGeo, fixedBoneMat);
  fixed.add(clavicleMesh);

  // MOVING: Humerus (lighter tone)
  // Humeral head (hemisphere fitting in glenoid)
  const humHeadGeo = new THREE.SphereGeometry(0.048, 24, 24);
  const humHeadMesh = new THREE.Mesh(humHeadGeo, cartilageMat);
  humHeadMesh.position.set(0.13, 0.37, 0.0);
  moving.add(humHeadMesh);

  // Greater & Lesser Tubercles
  const tubercleGeo = new THREE.SphereGeometry(0.024, 16, 16);
  const gtMesh = new THREE.Mesh(tubercleGeo, movingBoneMat);
  gtMesh.position.set(0.17, 0.38, 0.02);
  moving.add(gtMesh);

  // Humeral Shaft (Diaphysis)
  const humShaftGeo = new THREE.CylinderGeometry(0.02, 0.018, 0.36, 20);
  const humShaftMesh = new THREE.Mesh(humShaftGeo, movingBoneMat);
  humShaftMesh.position.set(0.17, 0.18, 0.0);
  moving.add(humShaftMesh);

  // Distal Humerus: Medial & Lateral Epicondyles
  const distalHumGeo = new THREE.CylinderGeometry(0.032, 0.026, 0.06, 16);
  const distalHumMesh = new THREE.Mesh(distalHumGeo, movingBoneMat);
  distalHumMesh.rotation.z = Math.PI / 2;
  distalHumMesh.position.set(0.17, 0.01, 0.0);
  moving.add(distalHumMesh);

  // Landmarks
  addLandmark(landmarks, 'Acromion Process', [0.12, 0.43, 0.0]);
  addLandmark(landmarks, 'Greater Tubercle', [0.18, 0.38, 0.02]);
  addLandmark(landmarks, 'Coracoid Process', [0.08, 0.39, 0.05]);
}

// -------------------------------------------------------------
// 2. ELBOW & FOREARM: Humerus (Fixed) & Radius/Ulna (Moving)
// -------------------------------------------------------------
function buildElbowJoint(fixed: THREE.Group, moving: THREE.Group, landmarks: THREE.Group) {
  // FIXED: Distal Humerus (Shaft, Trochlea, Capitulum, Epicondyles)
  const humShaftGeo = new THREE.CylinderGeometry(0.022, 0.024, 0.34, 20);
  const humShaftMesh = new THREE.Mesh(humShaftGeo, fixedBoneMat);
  humShaftMesh.position.set(0.0, 0.18, 0.0);
  fixed.add(humShaftMesh);

  // Medial Epicondyle (larger prominence)
  const medEpicondyleGeo = new THREE.SphereGeometry(0.018, 16, 16);
  const medEpicondyleMesh = new THREE.Mesh(medEpicondyleGeo, fixedBoneMat);
  medEpicondyleMesh.position.set(-0.045, 0.02, 0.0);
  fixed.add(medEpicondyleMesh);

  // Lateral Epicondyle
  const latEpicondyleGeo = new THREE.SphereGeometry(0.015, 16, 16);
  const latEpicondyleMesh = new THREE.Mesh(latEpicondyleGeo, fixedBoneMat);
  latEpicondyleMesh.position.set(0.045, 0.02, 0.0);
  fixed.add(latEpicondyleMesh);

  // Trochlea (spool-shaped pulley for ulna)
  const trochleaGeo = new THREE.CylinderGeometry(0.02, 0.016, 0.035, 20);
  const trochleaMesh = new THREE.Mesh(trochleaGeo, cartilageMat);
  trochleaMesh.rotation.z = Math.PI / 2;
  trochleaMesh.position.set(-0.012, 0.0, 0.0);
  fixed.add(trochleaMesh);

  // Capitulum (hemispherical knob for radius)
  const capitulumGeo = new THREE.SphereGeometry(0.018, 20, 16);
  const capitulumMesh = new THREE.Mesh(capitulumGeo, cartilageMat);
  capitulumMesh.position.set(0.026, 0.0, 0.005);
  fixed.add(capitulumMesh);

  // MOVING: Forearm (Ulna + Radius + Carpal hand block)
  // Ulna: Olecranon beak & shaft
  const olecranonGeo = new THREE.BoxGeometry(0.025, 0.035, 0.035);
  const olecranonMesh = new THREE.Mesh(olecranonGeo, movingBoneMat);
  olecranonMesh.position.set(-0.012, 0.015, -0.015);
  moving.add(olecranonMesh);

  const trochlearNotchGeo = new THREE.TorusGeometry(0.018, 0.008, 12, 16, Math.PI);
  const notchMesh = new THREE.Mesh(trochlearNotchGeo, cartilageMat);
  notchMesh.rotation.y = Math.PI / 2;
  notchMesh.position.set(-0.012, 0.0, 0.0);
  moving.add(notchMesh);

  // Ulnar Shaft
  const ulnaShaftGeo = new THREE.CylinderGeometry(0.014, 0.010, 0.30, 16);
  const ulnaShaftMesh = new THREE.Mesh(ulnaShaftGeo, movingBoneMat);
  ulnaShaftMesh.position.set(-0.014, -0.16, 0.0);
  moving.add(ulnaShaftMesh);

  // Radius: Head (shallow dish), Neck, Tuberosity, Shaft, Styloid
  const radHeadGeo = new THREE.CylinderGeometry(0.017, 0.017, 0.012, 20);
  const radHeadMesh = new THREE.Mesh(radHeadGeo, cartilageMat);
  radHeadMesh.position.set(0.026, -0.005, 0.0);
  moving.add(radHeadMesh);

  const radNeckGeo = new THREE.CylinderGeometry(0.011, 0.013, 0.03, 16);
  const radNeckMesh = new THREE.Mesh(radNeckGeo, movingBoneMat);
  radNeckMesh.position.set(0.026, -0.025, 0.0);
  moving.add(radNeckMesh);

  // Radial Tuberosity (biceps insertion landmark)
  const tuberosityGeo = new THREE.SphereGeometry(0.01, 12, 12);
  const tuberosityMesh = new THREE.Mesh(tuberosityGeo, movingBoneMat);
  tuberosityMesh.position.set(0.022, -0.045, 0.012);
  moving.add(tuberosityMesh);

  const radShaftGeo = new THREE.CylinderGeometry(0.013, 0.016, 0.26, 16);
  const radShaftMesh = new THREE.Mesh(radShaftGeo, movingBoneMat);
  radShaftMesh.position.set(0.028, -0.17, 0.0);
  moving.add(radShaftMesh);

  // Hand skeleton (carpus + metacarpals proxy)
  const handGeo = new THREE.BoxGeometry(0.05, 0.09, 0.022);
  const handMesh = new THREE.Mesh(handGeo, movingBoneMat);
  handMesh.position.set(0.01, -0.34, 0.0);
  moving.add(handMesh);

  // Landmarks
  addLandmark(landmarks, 'Lateral Epicondyle', [0.045, 0.02, 0.0]);
  addLandmark(landmarks, 'Medial Epicondyle', [-0.045, 0.02, 0.0]);
  addLandmark(landmarks, 'Olecranon Beak', [-0.012, 0.025, -0.02]);
  addLandmark(landmarks, 'Radial Styloid', [0.035, -0.30, 0.01]);
}

// -------------------------------------------------------------
// 3. HIP: Pelvis (Fixed) & Femur (Moving)
// -------------------------------------------------------------
function buildHipJoint(fixed: THREE.Group, moving: THREE.Group, landmarks: THREE.Group) {
  // FIXED: Pelvis / Hemi-pelvis (Ilium, Pubis, Ischium, Acetabulum)
  const iliumShape = new THREE.Shape();
  iliumShape.moveTo(-0.16, 0.10); // ASIS
  iliumShape.lineTo(-0.14, 0.28); // Iliac crest high point
  iliumShape.lineTo(0.12, 0.26);  // PSIS
  iliumShape.lineTo(0.14, 0.05);  // Ischial spine
  iliumShape.lineTo(0.08, -0.08); // Ischial tuberosity
  iliumShape.lineTo(-0.06, -0.05);// Pubic ramus
  iliumShape.closePath();

  const pelvisGeo = new THREE.ExtrudeGeometry(iliumShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.01,
    bevelThickness: 0.01,
  });
  const pelvisMesh = new THREE.Mesh(pelvisGeo, fixedBoneMat);
  pelvisMesh.position.set(-0.04, 0.08, -0.05);
  fixed.add(pelvisMesh);

  // Acetabular cup (deep socket with cartilage)
  const acetabulumGeo = new THREE.SphereGeometry(0.052, 24, 20, 0, Math.PI * 2, 0, Math.PI / 2.2);
  const acetabulumMesh = new THREE.Mesh(acetabulumGeo, cartilageMat);
  acetabulumMesh.rotation.y = Math.PI / 2;
  acetabulumMesh.position.set(0.04, 0.12, 0.0);
  fixed.add(acetabulumMesh);

  // MOVING: Femur
  // Femoral head (2/3 sphere)
  const femHeadGeo = new THREE.SphereGeometry(0.048, 24, 24);
  const femHeadMesh = new THREE.Mesh(femHeadGeo, cartilageMat);
  femHeadMesh.position.set(0.04, 0.12, 0.0);
  moving.add(femHeadMesh);

  // Femoral neck (angled ~125° to shaft)
  const femNeckGeo = new THREE.CylinderGeometry(0.022, 0.026, 0.07, 16);
  const femNeckMesh = new THREE.Mesh(femNeckGeo, movingBoneMat);
  femNeckMesh.rotation.z = -Math.PI / 3.2;
  femNeckMesh.position.set(0.08, 0.10, 0.0);
  moving.add(femNeckMesh);

  // Greater Trochanter
  const gtGeo = new THREE.BoxGeometry(0.04, 0.05, 0.038);
  const gtMesh = new THREE.Mesh(gtGeo, movingBoneMat);
  gtMesh.position.set(0.12, 0.09, 0.0);
  moving.add(gtMesh);

  // Lesser Trochanter (medial & posterior)
  const ltGeo = new THREE.SphereGeometry(0.014, 12, 12);
  const ltMesh = new THREE.Mesh(ltGeo, movingBoneMat);
  ltMesh.position.set(0.06, 0.05, -0.02);
  moving.add(ltMesh);

  // Femoral Shaft
  const femShaftGeo = new THREE.CylinderGeometry(0.025, 0.028, 0.42, 20);
  const femShaftMesh = new THREE.Mesh(femShaftGeo, movingBoneMat);
  femShaftMesh.position.set(0.11, -0.13, 0.0);
  moving.add(femShaftMesh);

  // Distal Femoral Condyles
  const condyleGeo = new THREE.SphereGeometry(0.032, 16, 16);
  const condyleMed = new THREE.Mesh(condyleGeo, movingBoneMat);
  condyleMed.position.set(0.08, -0.34, 0.0);
  const condyleLat = new THREE.Mesh(condyleGeo, movingBoneMat);
  condyleLat.position.set(0.14, -0.34, 0.0);
  moving.add(condyleMed);
  moving.add(condyleLat);

  // Landmarks
  addLandmark(landmarks, 'ASIS', [-0.08, 0.26, 0.02]);
  addLandmark(landmarks, 'Greater Trochanter', [0.13, 0.11, 0.0]);
  addLandmark(landmarks, 'Ischial Tuberosity', [0.04, -0.02, -0.06]);
}

// -------------------------------------------------------------
// 4. KNEE: Femur (Fixed) & Tibia, Fibula, Patella (Moving)
// -------------------------------------------------------------
function buildKneeJoint(fixed: THREE.Group, moving: THREE.Group, landmarks: THREE.Group) {
  // FIXED: Distal Femur (Shaft, Supracondylar ridges, Medial & Lateral Condyles, Intercondylar notch)
  const femShaftGeo = new THREE.CylinderGeometry(0.026, 0.030, 0.36, 20);
  const femShaftMesh = new THREE.Mesh(femShaftGeo, fixedBoneMat);
  femShaftMesh.position.set(0.0, 0.20, 0.0);
  fixed.add(femShaftMesh);

  // Medial Condyle
  const medCondyleGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.035, 20);
  const medCondyleMesh = new THREE.Mesh(medCondyleGeo, cartilageMat);
  medCondyleMesh.rotation.z = Math.PI / 2;
  medCondyleMesh.position.set(-0.032, 0.0, 0.0);
  fixed.add(medCondyleMesh);

  // Lateral Condyle
  const latCondyleGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.035, 20);
  const latCondyleMesh = new THREE.Mesh(latCondyleGeo, cartilageMat);
  latCondyleMesh.rotation.z = Math.PI / 2;
  latCondyleMesh.position.set(0.032, 0.0, 0.0);
  fixed.add(latCondyleMesh);

  // Trochlear groove for patella (anterior)
  const trochlearGrooveGeo = new THREE.BoxGeometry(0.05, 0.06, 0.015);
  const trochlearMesh = new THREE.Mesh(trochlearGrooveGeo, cartilageMat);
  trochlearMesh.position.set(0.0, 0.03, 0.03);
  fixed.add(trochlearMesh);

  // MOVING: Tibia + Fibula + Patella
  // Tibial Plateau (concave condyles)
  const tibPlateauGeo = new THREE.BoxGeometry(0.09, 0.03, 0.065);
  const tibPlateauMesh = new THREE.Mesh(tibPlateauGeo, movingBoneMat);
  tibPlateauMesh.position.set(0.0, -0.018, 0.0);
  moving.add(tibPlateauMesh);

  // Tibial Tuberosity (anterior bump for patellar tendon)
  const tibTuberosityGeo = new THREE.SphereGeometry(0.015, 12, 12);
  const tibTubMesh = new THREE.Mesh(tibTuberosityGeo, movingBoneMat);
  tibTubMesh.position.set(0.0, -0.05, 0.032);
  moving.add(tibTubMesh);

  // Tibial Shaft (triangular prism with sharp anterior crest)
  const tibShaftGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.34, 16);
  const tibShaftMesh = new THREE.Mesh(tibShaftGeo, movingBoneMat);
  tibShaftMesh.position.set(0.0, -0.19, 0.0);
  moving.add(tibShaftMesh);

  // Fibula: Head & slender lateral shaft
  const fibHeadGeo = new THREE.SphereGeometry(0.016, 12, 12);
  const fibHeadMesh = new THREE.Mesh(fibHeadGeo, movingBoneMat);
  fibHeadMesh.position.set(0.052, -0.035, -0.01);
  moving.add(fibHeadMesh);

  const fibShaftGeo = new THREE.CylinderGeometry(0.009, 0.008, 0.32, 12);
  const fibShaftMesh = new THREE.Mesh(fibShaftGeo, movingBoneMat);
  fibShaftMesh.position.set(0.052, -0.19, -0.01);
  moving.add(fibShaftMesh);

  // Patella (sesamoid bone inside quadriceps/patellar tendon)
  const patellaGeo = new THREE.ConeGeometry(0.024, 0.038, 16);
  const patellaMesh = new THREE.Mesh(patellaGeo, movingBoneMat);
  patellaMesh.rotation.x = Math.PI;
  patellaMesh.position.set(0.0, 0.025, 0.04);
  moving.add(patellaMesh);

  // Landmarks
  addLandmark(landmarks, 'Lateral Epicondyle', [0.045, 0.01, 0.0]);
  addLandmark(landmarks, 'Tibial Tuberosity', [0.0, -0.05, 0.035]);
  addLandmark(landmarks, 'Fibular Head', [0.052, -0.035, -0.01]);
  addLandmark(landmarks, 'Patella Apex', [0.0, 0.01, 0.045]);
}

// -------------------------------------------------------------
// 5. ANKLE & FOOT: Tibia/Fibula Mortise (Fixed) & Talus/Foot (Moving)
// -------------------------------------------------------------
function buildAnkleJoint(fixed: THREE.Group, moving: THREE.Group, landmarks: THREE.Group) {
  // FIXED: Distal Tibia & Fibula forming the mortise
  const tibDistalShaftGeo = new THREE.CylinderGeometry(0.02, 0.024, 0.28, 16);
  const tibMesh = new THREE.Mesh(tibDistalShaftGeo, fixedBoneMat);
  tibMesh.position.set(-0.012, 0.15, 0.0);
  fixed.add(tibMesh);

  // Medial Malleolus (tibial projection)
  const medMalleolusGeo = new THREE.BoxGeometry(0.02, 0.035, 0.025);
  const medMalleolusMesh = new THREE.Mesh(medMalleolusGeo, fixedBoneMat);
  medMalleolusMesh.position.set(-0.034, 0.0, 0.0);
  fixed.add(medMalleolusMesh);

  // Lateral Malleolus (fibular projection, extends further distally)
  const latMalleolusGeo = new THREE.BoxGeometry(0.018, 0.045, 0.025);
  const latMalleolusMesh = new THREE.Mesh(latMalleolusGeo, fixedBoneMat);
  latMalleolusMesh.position.set(0.035, -0.008, 0.0);
  fixed.add(latMalleolusMesh);

  // Tibial Plafond (ceiling of mortise)
  const plafondGeo = new THREE.BoxGeometry(0.05, 0.012, 0.035);
  const plafondMesh = new THREE.Mesh(plafondGeo, cartilageMat);
  plafondMesh.position.set(0.0, 0.01, 0.0);
  fixed.add(plafondMesh);

  // MOVING: Foot (Talus, Calcaneus, Midfoot & Metatarsals)
  // Talus: Trochlea (convex pulley fitting into mortise)
  const talusTrochleaGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.038, 20);
  const talusMesh = new THREE.Mesh(talusTrochleaGeo, cartilageMat);
  talusMesh.rotation.z = Math.PI / 2;
  talusMesh.position.set(0.0, 0.0, 0.0);
  moving.add(talusMesh);

  // Calcaneus (heel bone projecting posteriorly and plantarly)
  const calcaneusGeo = new THREE.BoxGeometry(0.045, 0.045, 0.09);
  const calcaneusMesh = new THREE.Mesh(calcaneusGeo, movingBoneMat);
  calcaneusMesh.position.set(0.0, -0.04, -0.045);
  moving.add(calcaneusMesh);

  // Navicular & Cuneiforms / Midfoot
  const midfootGeo = new THREE.BoxGeometry(0.055, 0.03, 0.06);
  const midfootMesh = new THREE.Mesh(midfootGeo, movingBoneMat);
  midfootMesh.position.set(0.0, -0.03, 0.045);
  moving.add(midfootMesh);

  // Metatarsals & Toes (extending anteriorly)
  const forefootGeo = new THREE.BoxGeometry(0.065, 0.018, 0.10);
  const forefootMesh = new THREE.Mesh(forefootGeo, movingBoneMat);
  forefootMesh.position.set(0.0, -0.045, 0.125);
  moving.add(forefootMesh);

  // Landmarks
  addLandmark(landmarks, 'Lateral Malleolus', [0.038, -0.01, 0.0]);
  addLandmark(landmarks, 'Medial Malleolus', [-0.036, 0.0, 0.0]);
  addLandmark(landmarks, 'Calcaneal Tuberosity', [0.0, -0.045, -0.09]);
  addLandmark(landmarks, '5th Metatarsal Base', [0.038, -0.045, 0.08]);
}

function addLandmark(group: THREE.Group, name: string, pos: [number, number, number]) {
  const geo = new THREE.SphereGeometry(0.008, 16, 16);
  const mesh = new THREE.Mesh(geo, landmarkMat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.userData = { isLandmark: true, landmarkName: name };
  group.add(mesh);
}
