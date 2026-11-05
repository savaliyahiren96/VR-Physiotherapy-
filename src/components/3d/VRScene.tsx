import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { JointDefinition, MovementDefinition, MuscleCalculatedState, SpinePathologyType } from '../../types/biomechanics';
import { createProceduralJoint, BoneRig } from './ProceduralBones';
import { calculateSoftTissueStates } from '../../utils/softTissueEngine';
import { SOFT_TISSUES_DATA } from '../../data/softTissueData';

interface VRSceneProps {
  joint: JointDefinition;
  movement: MovementDefinition;
  angleDeg: number;
  onAngleChange: (angle: number) => void;
  onNextMovement: () => void;
  onNextJoint: () => void;
  muscleCalculations: MuscleCalculatedState[];
  selectedMuscleId: string | null;
  onSelectMuscle: (muscleId: string) => void;
  selectedSoftTissueId?: string | null;
  onSelectSoftTissue?: (tissueId: string) => void;
  showLandmarks: boolean;
  activeAccessoryGlideVector: [number, number, number] | null;
  netTorqueNm: number;
  spinePathology?: SpinePathologyType;
  jointReactionForceN?: number;
  primaryMuscleForceN?: number;
}

export const VRScene: React.FC<VRSceneProps> = ({
  joint,
  movement,
  angleDeg,
  onAngleChange,
  onNextMovement,
  onNextJoint,
  muscleCalculations,
  selectedMuscleId,
  onSelectMuscle,
  selectedSoftTissueId = null,
  onSelectSoftTissue,
  showLandmarks,
  activeAccessoryGlideVector,
  netTorqueNm,
  spinePathology = 'healthy',
  jointReactionForceN,
  primaryMuscleForceN,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [vrSupported, setVrSupported] = useState<boolean>(false);
  const [isInVR, setIsInVR] = useState<boolean>(false);
  const [selectedMuscleName, setSelectedMuscleName] = useState<string>('');
  const [selectedSoftTissueName, setSelectedSoftTissueName] = useState<string>('');

  // 3D Anatomy App Controls & Layer Visibility State
  const [xRayMode, setXRayMode] = useState<boolean>(false);
  const [cartilageHighlight, setCartilageHighlight] = useState<boolean>(false);
  const [showSoftTissues, setShowSoftTissues] = useState<boolean>(true);
  const [showMuscles, setShowMuscles] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [distractionMm, setDistractionMm] = useState<number>(0); // 0 to 25 mm exploded / distraction slider
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);

  // Refs for scene components across renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rigRef = useRef<BoneRig | null>(null);
  const musclesGroupRef = useRef<THREE.Group>(new THREE.Group());
  const softTissuesGroupRef = useRef<THREE.Group>(new THREE.Group());
  const goniometerGroupRef = useRef<THREE.Group>(new THREE.Group());
  const biomechanicsVectorsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const contactPatchGroupRef = useRef<THREE.Group>(new THREE.Group());
  const vrInfoPanelMeshRef = useRef<THREE.Mesh | null>(null);
  const vrInfoTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Mutable state for animation / VR controller polling
  const stateRef = useRef({
    angleDeg,
    joint,
    movement,
    netTorqueNm,
    selectedMuscleId,
    selectedSoftTissueId,
    onAngleChange,
    onNextMovement,
    onNextJoint,
    onSelectMuscle,
    onSelectSoftTissue,
    lastThumbstickTime: 0,
    lastTriggerTime: 0,
    lastGripTime: 0,
  });

  useEffect(() => {
    stateRef.current.angleDeg = angleDeg;
    stateRef.current.joint = joint;
    stateRef.current.movement = movement;
    stateRef.current.netTorqueNm = netTorqueNm;
    stateRef.current.selectedMuscleId = selectedMuscleId;
    stateRef.current.selectedSoftTissueId = selectedSoftTissueId;
    stateRef.current.onAngleChange = onAngleChange;
    stateRef.current.onNextMovement = onNextMovement;
    stateRef.current.onNextJoint = onNextJoint;
    stateRef.current.onSelectMuscle = onSelectMuscle;
    stateRef.current.onSelectSoftTissue = onSelectSoftTissue;
  }, [angleDeg, joint, movement, netTorqueNm, selectedMuscleId, selectedSoftTissueId, onAngleChange, onNextMovement, onNextJoint, onSelectMuscle, onSelectSoftTissue]);

  // Check WebXR VR support
  useEffect(() => {
    if ('xr' in navigator && (navigator as any).xr?.isSessionSupported) {
      (navigator as any).xr.isSessionSupported('immersive-vr').then((supported: boolean) => {
        setVrSupported(supported);
      }).catch(() => setVrSupported(false));
    } else {
      setVrSupported(false);
    }
  }, []);

  // Update selected muscle display name
  useEffect(() => {
    if (selectedMuscleId) {
      const found = movement.muscles.find((m) => m.id === selectedMuscleId);
      setSelectedMuscleName(found ? found.name : '');
    } else {
      setSelectedMuscleName('');
    }
  }, [selectedMuscleId, movement]);

  // Update selected soft tissue display name
  useEffect(() => {
    if (selectedSoftTissueId) {
      const found = SOFT_TISSUES_DATA.find((t) => t.id === selectedSoftTissueId);
      setSelectedSoftTissueName(found ? found.name : '');
    } else {
      setSelectedSoftTissueName('');
    }
  }, [selectedSoftTissueId]);

  // Main Three.js Scene Setup (Mount once)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1426); // Deep academic navy
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 50);
    camera.position.set(0.0, 0.1, 0.95);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.xr.enabled = true;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment (PMREM)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio Lighting Rig for true anatomical depth
    const ambLight = new THREE.AmbientLight(0xdce7f5, 0.65);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.45);
    keyLight.position.set(1.5, 2.5, 1.8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7090b0, 0.85);
    fillLight.position.set(-1.8, -0.5, -1.2);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1a2b4c, 0.65);
    scene.add(hemiLight);

    // Soft Contact Shadow Plane Grounding
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.50)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.18)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.42;
    scene.add(shadowMesh);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 3.0;
    controls.minDistance = 0.2;
    controls.target.set(0.05, 0.05, 0.0);
    controlsRef.current = controls;

    // Add root groups to scene
    scene.add(musclesGroupRef.current);
    scene.add(softTissuesGroupRef.current);
    scene.add(goniometerGroupRef.current);
    scene.add(biomechanicsVectorsGroupRef.current);
    scene.add(contactPatchGroupRef.current);

    // VR Floating Info Panel Billboard
    const infoCanvas = document.createElement('canvas');
    infoCanvas.width = 512;
    infoCanvas.height = 256;
    const infoTexture = new THREE.CanvasTexture(infoCanvas);
    vrInfoTextureRef.current = infoTexture;

    const infoMat = new THREE.MeshBasicMaterial({
      map: infoTexture,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    const infoMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), infoMat);
    infoMesh.position.set(0.35, 0.45, -0.2);
    infoMesh.visible = false;
    scene.add(infoMesh);
    vrInfoPanelMeshRef.current = infoMesh;

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Raycasting for Muscle Selection, Soft Tissues & Landmarks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check soft tissue meshes first
      const softTissueHits = raycaster.intersectObjects(softTissuesGroupRef.current.children, true);
      if (softTissueHits.length > 0) {
        let obj: THREE.Object3D | null = softTissueHits[0].object;
        while (obj && !obj.userData?.softTissueId && obj.parent) {
          obj = obj.parent;
        }
        if (obj?.userData?.softTissueId) {
          stateRef.current.onSelectSoftTissue?.(obj.userData.softTissueId);
          return;
        }
      }

      // Check muscle meshes
      const muscleHits = raycaster.intersectObjects(musclesGroupRef.current.children, true);
      if (muscleHits.length > 0) {
        let obj: THREE.Object3D | null = muscleHits[0].object;
        while (obj && !obj.userData?.muscleId && obj.parent) {
          obj = obj.parent;
        }
        if (obj?.userData?.muscleId) {
          stateRef.current.onSelectMuscle(obj.userData.muscleId);
          return;
        }
      }

      // Check landmark hits
      if (rigRef.current) {
        const landmarkHits = raycaster.intersectObjects(rigRef.current.landmarksGroup.children, true);
        if (landmarkHits.length > 0) {
          const lmark = landmarkHits[0].object;
          if (lmark.userData?.landmarkName) {
            setSelectedMuscleName(`Landmark: ${lmark.userData.landmarkName}`);
          }
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // VR Controllers & Render Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      controls.update();

      // Poll WebXR Gamepads if in VR
      const session = renderer.xr.getSession();
      if (session) {
        infoMesh.visible = true;
        infoMesh.quaternion.copy(camera.quaternion);

        const s = stateRef.current;
        const ctx = infoCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0b132b';
          ctx.fillRect(0, 0, 512, 256);
          ctx.strokeStyle = '#d4af37';
          ctx.lineWidth = 6;
          ctx.strokeRect(4, 4, 504, 248);

          ctx.fillStyle = '#20b2aa';
          ctx.font = 'bold 28px "Times New Roman", serif';
          ctx.fillText(`VR BIOMECHANICS LAB`, 24, 44);

          ctx.fillStyle = '#ffffff';
          ctx.font = '22px "Times New Roman", serif';
          ctx.fillText(`Joint: ${s.joint.name}`, 24, 82);
          ctx.fillText(`Motion: ${s.movement.name}`, 24, 116);

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 36px "Times New Roman", serif';
          ctx.fillText(`${s.angleDeg}°`, 24, 168);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '18px "Times New Roman", serif';
          ctx.fillText(`Torque: ${s.netTorqueNm.toFixed(1)} N·m`, 24, 210);

          infoTexture.needsUpdate = true;
        }

        const now = performance.now();
        for (const source of session.inputSources) {
          if (source.gamepad) {
            const axes = source.gamepad.axes;
            if (axes && axes.length >= 2) {
              const x = axes[2] || axes[0];
              if (Math.abs(x) > 0.25 && now - s.lastThumbstickTime > 120) {
                s.lastThumbstickTime = now;
                const step = x > 0 ? 2 : -2;
                const newAngle = Math.min(
                  s.movement.maxAngle,
                  Math.max(s.movement.minAngle, s.angleDeg + step)
                );
                s.onAngleChange(newAngle);
              }
            }

            const buttons = source.gamepad.buttons;
            if (buttons && buttons.length > 0 && buttons[0].pressed && now - s.lastTriggerTime > 600) {
              s.lastTriggerTime = now;
              s.onNextMovement();
            }

            if (buttons && buttons.length > 1 && buttons[1].pressed && now - s.lastGripTime > 700) {
              s.lastGripTime = now;
              s.onNextJoint();
            }
          }
        }
      } else {
        infoMesh.visible = false;
      }

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(tick);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      rigRef.current?.dispose();
    };
  }, []);

  // Update Procedural Bones Rig when joint or pathology changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (rigRef.current) {
      scene.remove(rigRef.current.fixedGroup);
      scene.remove(rigRef.current.jointAnchor);
      scene.remove(rigRef.current.landmarksGroup);
      rigRef.current.dispose();
    }

    const newRig = createProceduralJoint(joint.id, spinePathology);
    rigRef.current = newRig;

    // Apply active layer states to new rig
    newRig.setXRayMode(xRayMode);
    newRig.setCartilageHighlight(cartilageHighlight);

    scene.add(newRig.fixedGroup);
    scene.add(newRig.jointAnchor);
    scene.add(newRig.landmarksGroup);

    // Adjust camera target based on joint
    if (controlsRef.current) {
      if (joint.id === 'shoulder') controlsRef.current.target.set(0.12, 0.35, 0.0);
      else if (joint.id === 'elbow') controlsRef.current.target.set(0.01, -0.05, 0.0);
      else if (joint.id === 'hip') controlsRef.current.target.set(0.08, 0.05, 0.0);
      else if (joint.id === 'knee') controlsRef.current.target.set(0.03, -0.05, 0.0);
      else if (joint.id === 'ankle') controlsRef.current.target.set(0.0, -0.05, 0.0);
      else if (joint.id === 'spine') controlsRef.current.target.set(0.0, 0.01, 0.0);
    }
  }, [joint.id, spinePathology]);

  // Sync X-Ray Mode
  useEffect(() => {
    rigRef.current?.setXRayMode(xRayMode);
  }, [xRayMode]);

  // Sync Cartilage Highlighting
  useEffect(() => {
    rigRef.current?.setCartilageHighlight(cartilageHighlight);
  }, [cartilageHighlight]);

  // Sync Soft Tissues & Muscles Visibility
  useEffect(() => {
    softTissuesGroupRef.current.visible = showSoftTissues;
  }, [showSoftTissues]);

  useEffect(() => {
    musclesGroupRef.current.visible = showMuscles;
  }, [showMuscles]);

  // Sync Biomechanics Vectors Visibility
  useEffect(() => {
    biomechanicsVectorsGroupRef.current.visible = showVectors;
    contactPatchGroupRef.current.visible = showVectors;
  }, [showVectors]);

  // Update Joint Angle, Scapular Rhythm, Accessory Glides & Joint Distraction
  useEffect(() => {
    if (!rigRef.current) return;
    const { movingGroup, fixedGroup } = rigRef.current;

    // Reset transformations
    movingGroup.rotation.set(0, 0, 0);
    movingGroup.position.set(0, 0, 0);
    fixedGroup.rotation.set(0, 0, 0);

    const rad = (angleDeg * Math.PI) / 180;

    // 1. Shoulder Realistic Axes & Scapulohumeral Rhythm (~2:1 after 30° abduction)
    if (joint.id === 'shoulder') {
      if (movement.id === 'shoulder_abduction') {
        if (angleDeg <= 30) {
          movingGroup.rotation.z = rad;
        } else {
          const remAngle = angleDeg - 30;
          const ghAngle = 30 + (remAngle * 2) / 3;
          const stAngle = (remAngle * 1) / 3;

          movingGroup.rotation.z = (ghAngle * Math.PI) / 180;
          fixedGroup.rotation.z = (stAngle * Math.PI) / 180; // Scapular upward rotation
        }
      } else if (movement.id === 'shoulder_flexion') {
        movingGroup.rotation.x = -rad;
      } else if (movement.id === 'shoulder_extension') {
        movingGroup.rotation.x = rad;
      } else if (movement.id === 'shoulder_adduction') {
        movingGroup.rotation.z = (rad * 0.4);
      } else if (movement.id === 'shoulder_medial_rotation') {
        movingGroup.rotation.y = -rad;
      } else if (movement.id === 'shoulder_lateral_rotation') {
        movingGroup.rotation.y = rad;
      }
    }

    // 2. Elbow & Forearm
    else if (joint.id === 'elbow') {
      if (movement.id === 'elbow_flexion') {
        movingGroup.rotation.x = -rad;
      } else if (movement.id === 'elbow_extension') {
        movingGroup.rotation.x = -((150 - angleDeg) * Math.PI) / 180;
      } else if (movement.id === 'forearm_pronation') {
        movingGroup.rotation.y = -rad;
      } else if (movement.id === 'forearm_supination') {
        movingGroup.rotation.y = rad;
      }
    }

    // 3. Hip Joint
    else if (joint.id === 'hip') {
      if (movement.id === 'hip_flexion') {
        movingGroup.rotation.x = -rad;
      } else if (movement.id === 'hip_extension') {
        movingGroup.rotation.x = rad;
      } else if (movement.id === 'hip_abduction') {
        movingGroup.rotation.z = rad;
      } else if (movement.id === 'hip_adduction') {
        movingGroup.rotation.z = -rad;
      } else if (movement.id === 'hip_medial_rotation') {
        movingGroup.rotation.y = -rad;
      } else if (movement.id === 'hip_lateral_rotation') {
        movingGroup.rotation.y = rad;
      }
    }

    // 4. Knee Joint (bicondylar hinge + terminal screw-home rotation)
    else if (joint.id === 'knee') {
      if (movement.id === 'knee_flexion') {
        movingGroup.rotation.x = rad;
      } else if (movement.id === 'knee_extension') {
        const eff = ((135 - angleDeg) * Math.PI) / 180;
        movingGroup.rotation.x = eff;
        if (angleDeg <= 15) {
          movingGroup.rotation.y = -((15 - angleDeg) / 15) * 0.08;
        }
      }
    }

    // 5. Ankle & Foot (Talocrural hinge & Subtalar oblique axis)
    else if (joint.id === 'ankle') {
      if (movement.id === 'ankle_dorsiflexion') {
        movingGroup.rotation.x = -rad;
      } else if (movement.id === 'ankle_plantarflexion') {
        movingGroup.rotation.x = rad;
      } else if (movement.id === 'foot_inversion') {
        movingGroup.rotation.z = -rad * 0.85;
        movingGroup.rotation.y = -rad * 0.45;
        movingGroup.rotation.x = rad * 0.25;
      } else if (movement.id === 'foot_eversion') {
        movingGroup.rotation.z = rad * 0.85;
        movingGroup.rotation.y = rad * 0.45;
        movingGroup.rotation.x = -rad * 0.25;
      }
    }

    // 6. Lumbar Spine & Motion Segment (L4-S1)
    else if (joint.id === 'spine') {
      if (movement.id === 'spine_flexion') {
        movingGroup.rotation.x = -rad;
      } else if (movement.id === 'spine_extension') {
        movingGroup.rotation.x = rad;
      } else if (movement.id === 'spine_lateral_flexion') {
        movingGroup.rotation.z = -rad;
      } else if (movement.id === 'spine_axial_rotation') {
        movingGroup.rotation.y = rad;
      }
    }

    // Apply active accessory glide animation if requested
    if (activeAccessoryGlideVector) {
      movingGroup.position.x += activeAccessoryGlideVector[0];
      movingGroup.position.y += activeAccessoryGlideVector[1];
      movingGroup.position.z += activeAccessoryGlideVector[2];
    }

    // Apply Joint Distraction / Separation (0 to 25 mm) for exploded interior inspection
    const distM = distractionMm * 0.001;
    if (distM > 0) {
      if (joint.id === 'shoulder') movingGroup.position.x += distM;
      else if (joint.id === 'elbow') movingGroup.position.y -= distM;
      else if (joint.id === 'hip') movingGroup.position.x += distM;
      else if (joint.id === 'knee') movingGroup.position.y -= distM;
      else if (joint.id === 'ankle') movingGroup.position.y -= distM;
      else if (joint.id === 'spine') movingGroup.position.y += distM;
    }
  }, [joint.id, movement.id, angleDeg, activeAccessoryGlideVector, distractionMm]);

  // Update Dynamic Procedural Muscle Tubes & Colors
  useEffect(() => {
    const musclesGroup = musclesGroupRef.current;
    if (!musclesGroup || !rigRef.current) return;

    while (musclesGroup.children.length > 0) {
      const child = musclesGroup.children[0] as THREE.Mesh;
      child.geometry?.dispose();
      musclesGroup.remove(child);
    }

    const { movingGroup } = rigRef.current;
    movingGroup.updateMatrixWorld(true);

    movement.muscles.forEach((muscle) => {
      const calc = muscleCalculations.find((c) => c.muscle.id === muscle.id);
      const isSelected = selectedMuscleId === muscle.id;

      const origin = new THREE.Vector3(...muscle.originCoords);
      const localInsertion = new THREE.Vector3(...muscle.insertionCoords);
      const worldInsertion = localInsertion.clone().applyMatrix4(movingGroup.matrixWorld);

      const currentLen = calc?.currentLengthM || origin.distanceTo(worldInsertion);
      const restLen = muscle.restLengthM;
      const isShorter = currentLen < restLen - 0.006;
      const isLonger = currentLen > restLen + 0.006;

      let muscleColor = 0x14b8a6; // Teal
      if (isLonger) {
        muscleColor = 0xd4af37; // Gold
      } else if (!isShorter && !isLonger) {
        muscleColor = 0x2dd4bf;
      }

      if (isSelected) {
        muscleColor = 0xffe066;
      }

      const midPoint = new THREE.Vector3().addVectors(origin, worldInsertion).multiplyScalar(0.5);
      midPoint.y += (isShorter ? 0.025 : 0.012);

      const curve = new THREE.CatmullRomCurve3([origin, midPoint, worldInsertion]);
      const bellyRadius = (isShorter ? 0.020 : 0.014) * (muscle.role === 'Prime Mover' ? 1.2 : 0.9);

      const muscleGeo = new THREE.TubeGeometry(curve, 18, bellyRadius, 12, false);
      const muscleMat = new THREE.MeshStandardMaterial({
        color: muscleColor,
        roughness: 0.45,
        metalness: isSelected ? 0.4 : 0.15,
        emissive: isSelected ? 0x664400 : (isShorter ? 0x064e3b : 0x451a03),
        emissiveIntensity: isSelected ? 0.5 : 0.25,
      });

      const muscleMesh = new THREE.Mesh(muscleGeo, muscleMat);
      muscleMesh.userData = { muscleId: muscle.id, muscleName: muscle.name };
      musclesGroup.add(muscleMesh);

      const tendonGeo = new THREE.SphereGeometry(bellyRadius * 0.9, 12, 12);
      const tendonMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const orgTendon = new THREE.Mesh(tendonGeo, tendonMat);
      orgTendon.position.copy(origin);
      musclesGroup.add(orgTendon);

      const insTendon = new THREE.Mesh(tendonGeo, tendonMat);
      insTendon.position.copy(worldInsertion);
      musclesGroup.add(insTendon);
    });
  }, [movement, angleDeg, muscleCalculations, selectedMuscleId, activeAccessoryGlideVector, distractionMm]);

  // Update Dynamic Procedural Soft Tissues
  useEffect(() => {
    const softTissuesGroup = softTissuesGroupRef.current;
    if (!softTissuesGroup || !rigRef.current) return;

    while (softTissuesGroup.children.length > 0) {
      const child = softTissuesGroup.children[0] as THREE.Mesh;
      child.geometry?.dispose();
      softTissuesGroup.remove(child);
    }

    const { movingGroup } = rigRef.current;
    movingGroup.updateMatrixWorld(true);

    const calculatedTissues = calculateSoftTissueStates(joint.id, movement.id, angleDeg);

    calculatedTissues.forEach((cs) => {
      const tissue = cs.tissue;
      const isSelected = selectedSoftTissueId === tissue.id;

      const origin = new THREE.Vector3(...tissue.originCoords);
      const localInsertion = new THREE.Vector3(...tissue.insertionCoords);
      const worldInsertion = localInsertion.clone().applyMatrix4(movingGroup.matrixWorld);

      const color = new THREE.Color(cs.colorHex);
      const thickness = (tissue.thicknessM || 0.005) * (isSelected ? 1.4 : 1.0);

      if (tissue.type === 'bursa') {
        const bursaGeo = new THREE.SphereGeometry(0.016, 16, 12);
        bursaGeo.scale(1.2, 0.45, 1.1);
        const bursaMat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.35,
          metalness: 0.1,
          transparent: true,
          opacity: 0.85,
          emissive: isSelected
            ? new THREE.Color(0xf59e0b)
            : cs.isClinicallyVulnerable
            ? new THREE.Color(0xef4444)
            : new THREE.Color(0x06b6d4),
          emissiveIntensity: isSelected ? 0.75 : cs.isClinicallyVulnerable ? 0.6 : 0.2,
        });
        const bursaMesh = new THREE.Mesh(bursaGeo, bursaMat);
        const mid = new THREE.Vector3().addVectors(origin, worldInsertion).multiplyScalar(0.5);
        bursaMesh.position.copy(mid);
        bursaMesh.userData = { softTissueId: tissue.id, softTissueName: tissue.name };
        softTissuesGroup.add(bursaMesh);
      } else if (tissue.type === 'meniscus' || tissue.type === 'fibrocartilage_labrum') {
        const arcRadius = 0.022;
        const torusGeo = new THREE.TorusGeometry(arcRadius, thickness * 0.8, 10, 24, Math.PI * 0.9);
        const torusMat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.4,
          metalness: 0.2,
          emissive: isSelected ? new THREE.Color(0xf59e0b) : color,
          emissiveIntensity: isSelected ? 0.65 : 0.2,
        });
        const crescentMesh = new THREE.Mesh(torusGeo, torusMat);
        const mid = new THREE.Vector3().addVectors(origin, worldInsertion).multiplyScalar(0.5);
        crescentMesh.position.copy(mid);
        crescentMesh.rotation.x = Math.PI / 2;
        crescentMesh.userData = { softTissueId: tissue.id, softTissueName: tissue.name };
        softTissuesGroup.add(crescentMesh);
      } else {
        const midPoint = new THREE.Vector3().addVectors(origin, worldInsertion).multiplyScalar(0.5);

        if (cs.state === 'Slack / Relaxed') {
          midPoint.y -= 0.005;
          midPoint.z += 0.003;
        } else if (cs.state === 'Impinged / Compressed') {
          midPoint.y += 0.002;
        }

        const curve = new THREE.CatmullRomCurve3([origin, midPoint, worldInsertion]);
        const tubeGeo = new THREE.TubeGeometry(curve, 16, thickness * 0.6, 10, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.35,
          metalness: 0.25,
          emissive: isSelected
            ? new THREE.Color(0xf59e0b)
            : cs.isClinicallyVulnerable
            ? new THREE.Color(0xef4444)
            : new THREE.Color(0x0891b2),
          emissiveIntensity: isSelected ? 0.75 : cs.isClinicallyVulnerable ? 0.55 : 0.2,
        });

        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        tubeMesh.userData = { softTissueId: tissue.id, softTissueName: tissue.name };
        softTissuesGroup.add(tubeMesh);

        const anchorGeo = new THREE.SphereGeometry(thickness * 0.75, 8, 8);
        const anchorMat = new THREE.MeshBasicMaterial({ color: isSelected ? 0xffffff : color });

        const orgAnchor = new THREE.Mesh(anchorGeo, anchorMat);
        orgAnchor.position.copy(origin);
        softTissuesGroup.add(orgAnchor);

        const insAnchor = new THREE.Mesh(anchorGeo, anchorMat);
        insAnchor.position.copy(worldInsertion);
        softTissuesGroup.add(insAnchor);
      }
    });
  }, [joint.id, movement.id, angleDeg, selectedSoftTissueId, activeAccessoryGlideVector, distractionMm]);

  // Update Biomechanics Force Vectors, Contact Patch & ICR Gizmo
  useEffect(() => {
    const vectorsGroup = biomechanicsVectorsGroupRef.current;
    const contactGroup = contactPatchGroupRef.current;
    if (!vectorsGroup || !contactGroup || !rigRef.current) return;

    while (vectorsGroup.children.length > 0) {
      const child = vectorsGroup.children[0] as THREE.Object3D;
      vectorsGroup.remove(child);
    }
    while (contactGroup.children.length > 0) {
      const child = contactGroup.children[0] as THREE.Object3D;
      contactGroup.remove(child);
    }

    if (!showVectors) return;

    const { movingGroup } = rigRef.current;
    movingGroup.updateMatrixWorld(true);

    let jointCenter = new THREE.Vector3(0, 0, 0);
    let jrfDirection = new THREE.Vector3(0, 1, 0);
    let contactCenter = new THREE.Vector3(0, 0, 0);
    let contactNormal = new THREE.Vector3(0, 1, 0);

    if (joint.id === 'shoulder') {
      jointCenter = new THREE.Vector3(0.128, 0.37, 0.0);
      jrfDirection = new THREE.Vector3(-1, 0.2, 0).normalize();
      contactCenter = new THREE.Vector3(0.098, 0.37, 0.0);
      contactNormal = new THREE.Vector3(1, 0, 0);
    } else if (joint.id === 'elbow') {
      jointCenter = new THREE.Vector3(0.0, 0.0, 0.0);
      jrfDirection = new THREE.Vector3(0, 1, 0.2).normalize();
      contactCenter = new THREE.Vector3(-0.012, 0.0, 0.0);
      contactNormal = new THREE.Vector3(0, 1, 0);
    } else if (joint.id === 'hip') {
      jointCenter = new THREE.Vector3(0.04, 0.12, 0.0);
      jrfDirection = new THREE.Vector3(-0.35, 1, 0).normalize();
      contactCenter = new THREE.Vector3(0.04, 0.145, 0.0);
      contactNormal = new THREE.Vector3(0, 1, 0);
    } else if (joint.id === 'knee') {
      const rad = (angleDeg * Math.PI) / 180;
      const icrZShift = -Math.sin(rad * 0.7) * 0.015;
      jointCenter = new THREE.Vector3(0.0, 0.0, icrZShift);
      jrfDirection = new THREE.Vector3(0, 1, 0).normalize();
      contactCenter = new THREE.Vector3(0.0, -0.002, icrZShift);
      contactNormal = new THREE.Vector3(0, 1, 0);
    } else if (joint.id === 'ankle') {
      jointCenter = new THREE.Vector3(0.0, 0.0, 0.0);
      jrfDirection = new THREE.Vector3(0, 1, 0).normalize();
      contactCenter = new THREE.Vector3(0.0, 0.008, 0.0);
      contactNormal = new THREE.Vector3(0, 1, 0);
    } else if (joint.id === 'spine') {
      jointCenter = new THREE.Vector3(0.0, 0.0, -0.015);
      jrfDirection = new THREE.Vector3(0, 1, 0).normalize();
      contactCenter = new THREE.Vector3(0.0, 0.0, 0.0);
      contactNormal = new THREE.Vector3(0, 1, 0);
    }

    // ICR (Instantaneous Center of Rotation) Golden Ring Fulcrum
    const icrSphereGeo = new THREE.SphereGeometry(0.007, 14, 14);
    const icrMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.25,
      metalness: 0.8,
    });
    const icrSphere = new THREE.Mesh(icrSphereGeo, icrMat);
    icrSphere.position.copy(jointCenter);
    vectorsGroup.add(icrSphere);

    const icrRingGeo = new THREE.TorusGeometry(0.016, 0.0018, 8, 24);
    const icrRing = new THREE.Mesh(icrRingGeo, icrMat);
    icrRing.position.copy(jointCenter);
    icrRing.rotation.x = Math.PI / 2;
    vectorsGroup.add(icrRing);

    // JRF (Joint Reaction Force) Arrow: Crimson Red Arrow
    const jrfMagnitude = Math.max(0.07, Math.min(0.20, ((jointReactionForceN || 350) / 1000) * 0.18));
    const jrfArrow = new THREE.ArrowHelper(
      jrfDirection,
      jointCenter,
      jrfMagnitude,
      0xef4444,
      0.024,
      0.016
    );
    vectorsGroup.add(jrfArrow);

    // Muscle Pull Force Vector (Teal Arrow)
    const primeMover = movement.muscles.find((m) => m.role === 'Prime Mover') || movement.muscles[0];
    if (primeMover) {
      const org = new THREE.Vector3(...primeMover.originCoords);
      const localIns = new THREE.Vector3(...primeMover.insertionCoords);
      const worldIns = localIns.clone().applyMatrix4(movingGroup.matrixWorld);
      const muscleDir = new THREE.Vector3().subVectors(org, worldIns).normalize();
      const muscleArrowMag = Math.max(0.07, Math.min(0.20, ((primaryMuscleForceN || 220) / 800) * 0.18));
      const muscleArrow = new THREE.ArrowHelper(
        muscleDir,
        worldIns,
        muscleArrowMag,
        0x14b8a6,
        0.024,
        0.016
      );
      vectorsGroup.add(muscleArrow);
    }

    // Dynamic Articular Contact Patch: Luminous Blue Hyaline Pressure Disc
    const contactGeo = new THREE.CircleGeometry(0.024, 24);
    const contactMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const contactMesh = new THREE.Mesh(contactGeo, contactMat);
    contactMesh.position.copy(contactCenter);
    contactMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), contactNormal);
    contactGroup.add(contactMesh);
  }, [joint.id, movement.id, angleDeg, showVectors, jointReactionForceN, primaryMuscleForceN, distractionMm]);

  // Update 3D Goniometer Arc
  useEffect(() => {
    const goniometerGroup = goniometerGroupRef.current;
    if (!goniometerGroup) return;

    while (goniometerGroup.children.length > 0) {
      const child = goniometerGroup.children[0] as THREE.Mesh;
      child.geometry?.dispose();
      goniometerGroup.remove(child);
    }

    const arcRadius = 0.18;
    const currentRad = (angleDeg * Math.PI) / 180;
    const maxRad = (movement.maxAngle * Math.PI) / 180;

    const normalRangeGeo = new THREE.RingGeometry(arcRadius * 0.85, arcRadius, 32, 1, 0, maxRad);
    const normalRangeMat = new THREE.MeshBasicMaterial({
      color: 0x20b2aa,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const normalRangeMesh = new THREE.Mesh(normalRangeGeo, normalRangeMat);
    goniometerGroup.add(normalRangeMesh);

    const activeArcGeo = new THREE.RingGeometry(arcRadius * 0.88, arcRadius * 1.02, 32, 1, 0, currentRad);
    const activeArcMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      side: THREE.DoubleSide,
    });
    const activeArcMesh = new THREE.Mesh(activeArcGeo, activeArcMat);
    goniometerGroup.add(activeArcMesh);

    const stationaryGeo = new THREE.CylinderGeometry(0.003, 0.003, arcRadius * 1.15, 8);
    const stationaryMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
    const stationaryMesh = new THREE.Mesh(stationaryGeo, stationaryMat);
    stationaryMesh.position.set(arcRadius * 0.55, 0, 0);
    stationaryMesh.rotation.z = Math.PI / 2;
    goniometerGroup.add(stationaryMesh);

    const movingArmMesh = new THREE.Mesh(stationaryGeo, stationaryMat);
    movingArmMesh.rotation.z = Math.PI / 2 + currentRad;
    movingArmMesh.position.set(
      (arcRadius * 0.55) * Math.cos(currentRad),
      (arcRadius * 0.55) * Math.sin(currentRad),
      0.002
    );
    goniometerGroup.add(movingArmMesh);

    const hubGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.008, 24);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.8 });
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    hubMesh.rotation.x = Math.PI / 2;
    goniometerGroup.add(hubMesh);

    if (joint.id === 'elbow' || (joint.id === 'shoulder' && movement.id.includes('flexion'))) {
      goniometerGroup.rotation.y = Math.PI / 2;
      goniometerGroup.position.set(0.08, 0.0, 0.0);
    } else if (joint.id === 'shoulder' && movement.id.includes('abduction')) {
      goniometerGroup.rotation.y = 0;
      goniometerGroup.position.set(0.12, 0.38, 0.08);
    } else if (joint.id === 'knee') {
      goniometerGroup.rotation.y = Math.PI / 2;
      goniometerGroup.position.set(0.08, 0.0, 0.0);
    } else {
      goniometerGroup.rotation.y = 0;
      goniometerGroup.position.set(0.0, 0.0, 0.06);
    }
  }, [movement, angleDeg, joint.id]);

  // Toggle Landmark Spheres Visibility
  useEffect(() => {
    if (rigRef.current) {
      rigRef.current.landmarksGroup.visible = showLandmarks;
    }
  }, [showLandmarks]);

  // Enter WebXR VR Session Handler
  const handleEnterVR = async () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (!vrSupported) {
      alert('WebXR immersive-vr is not supported in this browser. Please open in Meta Quest Browser or a WebXR-compatible browser.');
      return;
    }

    try {
      const session = await (navigator as any).xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
      });
      await renderer.xr.setSession(session);
      setIsInVR(true);

      session.addEventListener('end', () => {
        setIsInVR(false);
      });
    } catch (err: any) {
      console.error('Failed to start WebXR VR session:', err);
      alert(`Could not start VR session: ${err?.message || 'Check headset connection.'}`);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#070d1e] select-none overflow-hidden">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3D Viewport Academic Header Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col bg-[#0b132bcc]/90 border border-[#20b2aa]/40 px-3 py-1.5 rounded shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#20b2aa]"></span>
            <span className="text-[#fbbf24] font-bold text-xs uppercase tracking-wider font-sans">
              {joint.name}
            </span>
          </div>
          <span className="text-white text-sm font-semibold mt-0.5">
            {movement.name}
          </span>
        </div>

        {/* VR Entrance Button & Status */}
        <div className="pointer-events-auto flex items-center gap-2">
          {vrSupported ? (
            <button
              onClick={handleEnterVR}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#20b2aa] to-[#0d9488] hover:from-[#14b8a6] hover:to-[#0f766e] text-white font-bold text-xs rounded border border-[#fbbf24] shadow-md transition-all active:scale-95 cursor-pointer font-sans"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 8h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4l-2 2-2-2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" />
                <circle cx="8" cy="12" r="2" />
                <circle cx="16" cy="12" r="2" />
              </svg>
              <span>{isInVR ? 'VR ACTIVE' : 'ENTER VR'}</span>
            </button>
          ) : (
            <div
              className="text-[11px] text-slate-300 bg-[#0b132b]/85 border border-slate-700/60 px-2.5 py-1 rounded font-sans"
              title="WebXR immersive VR is supported on Meta Quest, Pico, or WebXR browsers"
            >
              VR: Ready for Quest
            </div>
          )}
        </div>
      </div>

      {/* Floating 3D Goniometer Angle Badge */}
      <div className="absolute top-16 left-3 bg-[#0b132b]/90 border border-[#d4af37]/60 rounded px-2.5 py-1 pointer-events-none shadow">
        <div className="text-[10px] text-[#fbbf24] uppercase tracking-wide font-sans">Measured Goniometer Arc</div>
        <div className="text-xl font-bold text-white leading-tight">
          {angleDeg}° <span className="text-xs font-normal text-slate-300">/ {movement.normalRangeText}</span>
        </div>
      </div>

      {/* Selected Muscle Indicator Banner */}
      {selectedMuscleName && (
        <div className="absolute top-28 left-3 bg-[#0b132b]/90 border border-[#fbbf24] rounded px-3 py-1 text-xs text-white shadow flex items-center gap-2 font-sans pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span>
          <span>Muscle: <strong className="text-[#fbbf24]">{selectedMuscleName}</strong></span>
          <button
            type="button"
            onClick={() => onSelectMuscle('')}
            className="text-[10px] text-slate-400 hover:text-white ml-1 px-1 rounded bg-slate-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Selected Soft Tissue Indicator Banner */}
      {selectedSoftTissueName && (
        <div className="absolute top-36 left-3 bg-[#0b132b]/95 border border-[#06b6d4] rounded px-3 py-1 text-xs text-white shadow flex items-center gap-2 font-sans pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span>
          <span>Soft Tissue: <strong className="text-[#38bdf8]">{selectedSoftTissueName}</strong></span>
          <button
            type="button"
            onClick={() => onSelectSoftTissue?.('')}
            className="text-[10px] text-slate-400 hover:text-white ml-1 px-1 rounded bg-slate-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Unified Ergonomic Bottom 3D Anatomy & Biomechanics Dock */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[95%] max-w-[820px] flex flex-col items-center pointer-events-auto z-20">
        {/* Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
          className="text-[11px] font-sans font-bold px-3 py-0.5 rounded-t-md bg-[#0b1633]/90 text-teal-300 border-t border-x border-teal-500/40 hover:bg-[#122247] shadow transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>{isControlsCollapsed ? '▴ Show 3D Anatomy & Biomechanics Dock' : '▾ Hide Dock'}</span>
        </button>

        {/* Dock Controls Body */}
        {!isControlsCollapsed && (
          <div className="w-full bg-[#0b132b]/95 border border-teal-500/40 rounded-b-lg rounded-t-sm p-2 sm:p-2.5 shadow-2xl flex flex-col gap-2 font-sans text-xs">
            {/* Top Row: Layer Swatches & X-Ray Controls */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">3D Layers:</span>

                {/* X-Ray Bone Toggle */}
                <button
                  type="button"
                  onClick={() => setXRayMode(!xRayMode)}
                  className={`px-2 py-0.5 rounded border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    xRayMode
                      ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Toggle Translucent X-Ray Bones to inspect internal joint cavity & ligaments"
                >
                  <span>🦴 X-Ray</span>
                </button>

                {/* Cartilage Highlight Toggle */}
                <button
                  type="button"
                  onClick={() => setCartilageHighlight(!cartilageHighlight)}
                  className={`px-2 py-0.5 rounded border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    cartilageHighlight
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Highlight glistening hyaline articular cartilage surfaces"
                >
                  <span>🩹 Cartilage</span>
                </button>

                {/* Ligaments Toggle */}
                <button
                  type="button"
                  onClick={() => setShowSoftTissues(!showSoftTissues)}
                  className={`px-2 py-0.5 rounded border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    showSoftTissues
                      ? 'bg-teal-700 text-teal-100 border-teal-400'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 line-through'
                  }`}
                  title="Show / Hide non-contractile soft tissue & ligaments"
                >
                  <span>🧬 Ligaments</span>
                </button>

                {/* Muscles Toggle */}
                <button
                  type="button"
                  onClick={() => setShowMuscles(!showMuscles)}
                  className={`px-2 py-0.5 rounded border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    showMuscles
                      ? 'bg-emerald-700 text-emerald-100 border-emerald-400'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 line-through'
                  }`}
                  title="Show / Hide contractile muscle bellies"
                >
                  <span>💪 Muscles</span>
                </button>

                {/* Biomechanics Vectors Toggle */}
                <button
                  type="button"
                  onClick={() => setShowVectors(!showVectors)}
                  className={`px-2 py-0.5 rounded border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    showVectors
                      ? 'bg-amber-600 text-amber-100 border-amber-300 shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700'
                  }`}
                  title="Show / Hide JRF contact force, muscle line of pull, and ICR"
                >
                  <span>📐 Vectors</span>
                </button>
              </div>

              {/* Biomechanical Live Force Readouts */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                <span className="text-red-400" title="Joint Reaction Force compressive load">
                  JRF: <strong className="text-white">~{Math.round(jointReactionForceN || 340)} N</strong>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-teal-400" title="Net resultant muscle torque">
                  Torque: <strong className="text-white">{netTorqueNm.toFixed(1)} N·m</strong>
                </span>
              </div>
            </div>

            {/* Bottom Row: Joint Distraction / Exploded Separation Slider & Color Legend */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] text-amber-300 font-semibold whitespace-nowrap" title="Separate articulating bone surfaces to inspect internal socket, labrum, and cartilage">
                  🔍 Joint Distraction (Exploded View):
                </span>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={distractionMm}
                  onChange={(e) => setDistractionMm(parseInt(e.target.value))}
                  className="w-32 sm:w-40 accent-[#fbbf24] cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <span className="text-[11px] font-mono text-white font-bold w-12 text-right">
                  {distractionMm} mm
                </span>
                {distractionMm > 0 && (
                  <button
                    type="button"
                    onClick={() => setDistractionMm(0)}
                    className="text-[10px] text-slate-400 hover:text-white px-1 py-0.5 bg-slate-800 rounded border border-slate-700"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Concise 3D Visual Legend */}
              <div className="flex items-center gap-2 text-[10px] text-slate-300 shrink-0">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> JRF Force
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#14b8a6]"></span> Muscle Pull
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> ICR Axis
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span> Contact Patch
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
