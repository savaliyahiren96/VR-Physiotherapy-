import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { JointDefinition, MovementDefinition, MuscleCalculatedState, SpinePathologyType } from '../../types/biomechanics';
import { createProceduralJoint, BoneRig } from './ProceduralBones';

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
  showLandmarks: boolean;
  activeAccessoryGlideVector: [number, number, number] | null;
  netTorqueNm: number;
  spinePathology?: SpinePathologyType;
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
  showLandmarks,
  activeAccessoryGlideVector,
  netTorqueNm,
  spinePathology = 'healthy',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [vrSupported, setVrSupported] = useState<boolean>(false);
  const [isInVR, setIsInVR] = useState<boolean>(false);
  const [selectedMuscleName, setSelectedMuscleName] = useState<string>('');

  // Refs for scene components across renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rigRef = useRef<BoneRig | null>(null);
  const musclesGroupRef = useRef<THREE.Group>(new THREE.Group());
  const goniometerGroupRef = useRef<THREE.Group>(new THREE.Group());
  const vrInfoPanelMeshRef = useRef<THREE.Mesh | null>(null);
  const vrInfoTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Mutable state for animation / VR controller polling
  const stateRef = useRef({
    angleDeg,
    joint,
    movement,
    netTorqueNm,
    selectedMuscleId,
    onAngleChange,
    onNextMovement,
    onNextJoint,
    onSelectMuscle,
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
    stateRef.current.onAngleChange = onAngleChange;
    stateRef.current.onNextMovement = onNextMovement;
    stateRef.current.onNextJoint = onNextJoint;
    stateRef.current.onSelectMuscle = onSelectMuscle;
  }, [angleDeg, joint, movement, netTorqueNm, selectedMuscleId, onAngleChange, onNextMovement, onNextJoint, onSelectMuscle]);

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

    // Studio Lighting Rig
    const ambLight = new THREE.AmbientLight(0xdce7f5, 0.6);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.4);
    keyLight.position.set(1.5, 2.5, 1.8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7090b0, 0.8);
    fillLight.position.set(-1.8, -0.5, -1.2);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1a2b4c, 0.6);
    scene.add(hemiLight);

    // Soft Contact Shadow Plane Grounding
    const shadowGeo = new THREE.PlaneGeometry(1.5, 1.5);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.45)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.15)');
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

    // Add muscle and goniometer root groups
    scene.add(musclesGroupRef.current);
    scene.add(goniometerGroupRef.current);

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

    // Raycasting for Muscle Selection & Landmarks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check muscle meshes first
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
        // Face floating info billboard to camera
        infoMesh.quaternion.copy(camera.quaternion);

        // Update VR Info Billboard canvas
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
          ctx.font = '24px "Times New Roman", serif';
          ctx.fillText(`Joint: ${s.joint.name}`, 24, 84);
          ctx.fillText(`Movement: ${s.movement.name}`, 24, 120);

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 30px "Times New Roman", serif';
          ctx.fillText(`Angle: ${s.angleDeg.toFixed(1)}° | Torque: ${s.netTorqueNm.toFixed(1)} N·m`, 24, 166);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '20px "Times New Roman", serif';
          ctx.fillText(`[Thumbstick: Angle] [Trigger: Move] [Grip: Joint]`, 24, 214);
          infoTexture.needsUpdate = true;
        }

        // WebXR Gamepad controller checks
        const now = performance.now();
        const sources = session.inputSources;
        for (const source of sources) {
          if (source.gamepad) {
            const gp = source.gamepad;
            // Thumbstick axis 2 or 0 (horizontal or vertical)
            if (gp.axes.length >= 2) {
              const stickVal = gp.axes[2] !== undefined && Math.abs(gp.axes[2]) > 0.1 ? gp.axes[2] : gp.axes[0];
              if (Math.abs(stickVal) > 0.15) {
                const newAng = THREE.MathUtils.clamp(
                  s.angleDeg + stickVal * 1.5,
                  s.movement.minAngle,
                  s.movement.maxAngle
                );
                s.onAngleChange(Math.round(newAng));
              }
            }

            // Trigger button (buttons[0]) -> Next movement
            if (gp.buttons[0]?.pressed && now - s.lastTriggerTime > 600) {
              s.lastTriggerTime = now;
              s.onNextMovement();
            }

            // Grip button (buttons[1]) -> Next joint
            if (gp.buttons[1]?.pressed && now - s.lastGripTime > 600) {
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

  // Update Procedural Bones Rig when joint changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old bones
    if (rigRef.current) {
      scene.remove(rigRef.current.fixedGroup);
      scene.remove(rigRef.current.jointAnchor);
      scene.remove(rigRef.current.landmarksGroup);
      rigRef.current.dispose();
    }

    const newRig = createProceduralJoint(joint.id, spinePathology);
    rigRef.current = newRig;

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

  // Update Joint Angle, Scapular Rhythm & Accessory Glides
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
          // Pure glenohumeral abduction
          movingGroup.rotation.z = rad;
        } else {
          // After 30°, for every 3° of abduction: 2° glenohumeral, 1° scapulothoracic
          const remAngle = angleDeg - 30;
          const ghAngle = 30 + (remAngle * 2) / 3;
          const stAngle = (remAngle * 1) / 3;

          movingGroup.rotation.z = (ghAngle * Math.PI) / 180;
          fixedGroup.rotation.z = (stAngle * Math.PI) / 180; // Scapular upward rotation!
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
        // Humeroulnar hinge flexion in sagittal plane
        movingGroup.rotation.x = -rad;
      } else if (movement.id === 'elbow_extension') {
        // Extension return
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
        // Terminal screw-home mechanism: external rotation in last 15° of extension
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
        // Oblique subtalar axis: 42° to transverse, 16° to sagittal
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
        // Forward flexion: anterior sagittal tilt
        movingGroup.rotation.x = -rad;
      } else if (movement.id === 'spine_extension') {
        // Extension: posterior sagittal tilt
        movingGroup.rotation.x = rad;
      } else if (movement.id === 'spine_lateral_flexion') {
        // Lateral flexion: coronal tilt
        movingGroup.rotation.z = -rad;
      } else if (movement.id === 'spine_axial_rotation') {
        // Axial rotation: transverse twist
        movingGroup.rotation.y = rad;
      }
    }

    // Apply active accessory glide animation if requested (greatly enlarged for educational clarity)
    if (activeAccessoryGlideVector) {
      movingGroup.position.x += activeAccessoryGlideVector[0];
      movingGroup.position.y += activeAccessoryGlideVector[1];
      movingGroup.position.z += activeAccessoryGlideVector[2];
    }
  }, [joint.id, movement.id, angleDeg, activeAccessoryGlideVector]);

  // Update Dynamic Procedural Muscle Tubes & Colors (Teal when shorter, Gold when longer)
  useEffect(() => {
    const musclesGroup = musclesGroupRef.current;
    if (!musclesGroup || !rigRef.current) return;

    // Clean previous muscle meshes
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

      // Determine muscle color: Teal when shorter than rest, Gold when longer
      const currentLen = calc?.currentLengthM || origin.distanceTo(worldInsertion);
      const restLen = muscle.restLengthM;
      const isShorter = currentLen < restLen - 0.006;
      const isLonger = currentLen > restLen + 0.006;

      let muscleColor = 0x14b8a6; // Teal
      if (isLonger) {
        muscleColor = 0xd4af37; // Gold
      } else if (!isShorter && !isLonger) {
        muscleColor = 0x2dd4bf; // Neutral teal-mint
      }

      if (isSelected) {
        muscleColor = 0xffe066; // Bright gold highlight for selected muscle
      }

      // Procedural 3D lofted muscle belly: Bulges in center when shortening
      const midPoint = new THREE.Vector3().addVectors(origin, worldInsertion).multiplyScalar(0.5);
      // Slight anterior/lateral belly curvature
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

      // Tendon lines at origin and insertion
      const tendonGeo = new THREE.SphereGeometry(bellyRadius * 0.9, 12, 12);
      const tendonMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const orgTendon = new THREE.Mesh(tendonGeo, tendonMat);
      orgTendon.position.copy(origin);
      musclesGroup.add(orgTendon);

      const insTendon = new THREE.Mesh(tendonGeo, tendonMat);
      insTendon.position.copy(worldInsertion);
      musclesGroup.add(insTendon);
    });
  }, [movement, angleDeg, muscleCalculations, selectedMuscleId, activeAccessoryGlideVector]);

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

    // Normal Range Arc (Translucent teal background disc arc)
    const normalRangeGeo = new THREE.RingGeometry(arcRadius * 0.85, arcRadius, 32, 1, 0, maxRad);
    const normalRangeMat = new THREE.MeshBasicMaterial({
      color: 0x20b2aa,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const normalRangeMesh = new THREE.Mesh(normalRangeGeo, normalRangeMat);
    goniometerGroup.add(normalRangeMesh);

    // Current Angle Arc (Bright gold active arc)
    const activeArcGeo = new THREE.RingGeometry(arcRadius * 0.88, arcRadius * 1.02, 32, 1, 0, currentRad);
    const activeArcMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      side: THREE.DoubleSide,
    });
    const activeArcMesh = new THREE.Mesh(activeArcGeo, activeArcMat);
    goniometerGroup.add(activeArcMesh);

    // Stationary Arm (Gold line along 0°)
    const stationaryGeo = new THREE.CylinderGeometry(0.003, 0.003, arcRadius * 1.15, 8);
    const stationaryMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
    const stationaryMesh = new THREE.Mesh(stationaryGeo, stationaryMat);
    stationaryMesh.position.set(arcRadius * 0.55, 0, 0);
    stationaryMesh.rotation.z = Math.PI / 2;
    goniometerGroup.add(stationaryMesh);

    // Moving Arm (Gold pointer along current angle)
    const movingArmMesh = new THREE.Mesh(stationaryGeo, stationaryMat);
    movingArmMesh.rotation.z = Math.PI / 2 + currentRad;
    movingArmMesh.position.set(
      (arcRadius * 0.55) * Math.cos(currentRad),
      (arcRadius * 0.55) * Math.sin(currentRad),
      0.002
    );
    goniometerGroup.add(movingArmMesh);

    // Central Axis Fulcrum Hub
    const hubGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.008, 24);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.8 });
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    hubMesh.rotation.x = Math.PI / 2;
    goniometerGroup.add(hubMesh);

    // Align goniometer orientation with joint rotation plane
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
        <div className="flex flex-col bg-[#0b132bcc]/90 backdrop-blur-xs border border-[#20b2aa]/40 px-3 py-1.5 rounded shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#20b2aa]"></span>
            <span className="text-[#fbbf24] font-bold text-xs uppercase tracking-wider">
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#20b2aa] to-[#0d9488] hover:from-[#14b8a6] hover:to-[#0f766e] text-white font-bold text-xs rounded border border-[#fbbf24] shadow-md transition-all active:scale-95 cursor-pointer"
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
              className="text-[11px] text-slate-300 bg-[#0b132b]/80 border border-slate-700/60 px-2.5 py-1 rounded"
              title="WebXR immersive VR is supported on Meta Quest, Pico, or WebXR browsers"
            >
              VR: Browser/Headset Not Detected
            </div>
          )}
        </div>
      </div>

      {/* Floating 3D Goniometer Angle Badge */}
      <div className="absolute top-16 left-3 bg-[#0b132b]/85 border border-[#d4af37]/60 rounded px-2.5 py-1 pointer-events-none shadow">
        <div className="text-[10px] text-[#fbbf24] uppercase tracking-wide">Measured Goniometer Arc</div>
        <div className="text-xl font-bold text-white leading-tight">
          {angleDeg}° <span className="text-xs font-normal text-slate-300">/ {movement.normalRangeText}</span>
        </div>
      </div>

      {/* Selected Muscle Indicator Banner */}
      {selectedMuscleName && (
        <div className="absolute bottom-3 left-3 bg-[#0b132b]/90 border border-[#fbbf24] rounded px-3 py-1 text-xs text-white shadow flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span>
          <span>Selected: <strong className="text-[#fbbf24]">{selectedMuscleName}</strong></span>
        </div>
      )}

      {/* 3D Color Legend (Teal = shorter than rest, Gold = longer than rest) */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-[#0b132b]/80 border border-slate-700 px-2.5 py-1 rounded text-[11px] pointer-events-none">
        <span className="flex items-center gap-1 text-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-[#20b2aa]"></span> Shortened
        </span>
        <span className="flex items-center gap-1 text-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37]"></span> Lengthened
        </span>
      </div>
    </div>
  );
};
