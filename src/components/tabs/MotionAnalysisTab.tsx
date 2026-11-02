import React, { useState, useRef, useEffect } from 'react';
import { JointDefinition, MovementDefinition, BiomechanicalSummary } from '../../types/biomechanics';
import {
  PatientAssessmentRecord,
  MovementAbnormality,
  FieldSource,
} from '../../types/clinicalAssessment';
import { CLINICAL_MOVEMENT_TEMPLATES, MovementTemplateMeta } from '../../data/clinicalTemplates';

interface MarkerPoint {
  id: string;
  name: string;
  label: string;
  x: number; // percentage 0 to 100
  y: number; // percentage 0 to 100
  color: string;
}

interface SkeletonPoint {
  x: number;
  y: number;
}

interface MotionAnalysisTabProps {
  joint: JointDefinition;
  movement: MovementDefinition;
  currentAngleDeg: number;
  onApplyAngleToModel: (angle: number) => void;
  biomechanics: BiomechanicalSummary;
}

export const MotionAnalysisTab: React.FC<MotionAnalysisTabProps> = ({
  joint,
  movement,
  currentAngleDeg,
  onApplyAngleToModel,
  biomechanics,
}) => {
  // Media source state
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'camera'>('image');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [autoSyncTo3D, setAutoSyncTo3D] = useState<boolean>(true);

  // Video playback controls
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [videoPlaybackRate, setVideoPlaybackRate] = useState<number>(1.0);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // Overlays toggle
  const [showSkeletonOverlay, setShowSkeletonOverlay] = useState<boolean>(true);
  const [showMarkersOverlay, setShowMarkersOverlay] = useState<boolean>(true);

  // Movement selection & recognition
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('squat');
  const [recognizedMovementName, setRecognizedMovementName] = useState<string>('Bilateral Squat');
  const [recognitionConfidence, setRecognitionConfidence] = useState<number>(0.94);
  const [isLowConfidence, setIsLowConfidence] = useState<boolean>(false);

  // Markers state (3 points: Proximal, Fulcrum, Distal)
  const [markers, setMarkers] = useState<MarkerPoint[]>([
    { id: 'proximal', name: 'Marker A (Proximal)', label: 'Right Hip (ASIS)', x: 45, y: 32, color: '#20b2aa' },
    { id: 'fulcrum', name: 'Marker B (Joint Fulcrum)', label: 'Right Knee Joint Axis', x: 43, y: 60, color: '#fbbf24' },
    { id: 'distal', name: 'Marker C (Distal)', label: 'Right Lateral Malleolus', x: 42, y: 88, color: '#38bdf8' },
  ]);

  // Full 18-point 2D skeleton
  const [skeleton, setSkeleton] = useState<Record<string, SkeletonPoint>>({
    nose: { x: 50, y: 12 },
    leftShoulder: { x: 56, y: 22 },
    rightShoulder: { x: 44, y: 22 },
    leftElbow: { x: 60, y: 34 },
    rightElbow: { x: 40, y: 34 },
    leftWrist: { x: 58, y: 44 },
    rightWrist: { x: 42, y: 44 },
    leftHip: { x: 54, y: 48 },
    rightHip: { x: 46, y: 48 },
    leftKnee: { x: 56, y: 68 },
    rightKnee: { x: 44, y: 68 },
    leftAnkle: { x: 56, y: 88 },
    rightAnkle: { x: 44, y: 88 },
    leftFoot: { x: 58, y: 92 },
    rightFoot: { x: 42, y: 92 },
  });

  const [activeDragMarker, setActiveDragMarker] = useState<string | null>(null);
  const [measuredAngle, setMeasuredAngle] = useState<number>(90);
  const [contralateralAngle, setContralateralAngle] = useState<number>(88);
  const [symmetryPercent, setSymmetryPercent] = useState<number>(92);
  const [repetitionCount, setRepetitionCount] = useState<number>(1);
  const [activePhase, setActivePhase] = useState<string>('Eccentric Descent to 90° Knee Flexion');

  // AI Analysis & Clinical Prefill State
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [formSubTab, setFormSubTab] = useState<'identification' | 'biomechanics' | 'findings' | 'rehabilitation' | 'report'>('biomechanics');

  // Clinical Form Fields with source tracking
  const [formData, setFormData] = useState({
    // Identification
    movementName: { val: 'Bilateral Squat', src: 'AI Generated' as FieldSource },
    category: 'Lower Limb',
    cameraView: 'Anterior',
    reps: { val: 1, src: 'Video Observed' as FieldSource },
    duration: { val: 3.2, src: 'Video Observed' as FieldSource },
    cadence: { val: 'Controlled cadence (~2s eccentric, 1s concentric)', src: 'AI Generated' as FieldSource },
    activePhases: { val: 'Eccentric Descent to 90° Knee Flexion', src: 'AI Generated' as FieldSource },
    symmetry: { val: 92, src: 'AI Generated' as FieldSource },

    // Biomechanics
    trunkAlignment: { val: 'Upright spine maintained; slight forward lean within physiological limits', src: 'AI Generated' as FieldSource },
    pelvicMovement: { val: 'Level pelvis in frontal plane; no Trendelenburg pelvic tilt observed', src: 'AI Generated' as FieldSource },
    hipMechanics: { val: 'Symmetrical bilateral hip flexion to ~95° with good femoral control', src: 'AI Generated' as FieldSource },
    kneeMechanics: { val: 'Mild dynamic knee valgus on right limb during descent; left tracks well over 2nd toe', src: 'AI Generated' as FieldSource },
    ankleMechanics: { val: 'Adequate ankle dorsiflexion (~15°); heels remain grounded on plinth', src: 'AI Generated' as FieldSource },
    footPosture: { val: 'Slight bilateral pronation at bottom turnaround; arch reconstitutes on ascent', src: 'AI Generated' as FieldSource },
    segmentalCoordination: { val: 'Smooth knee-hip coupling throughout eccentric phase', src: 'AI Generated' as FieldSource },
    weightBearing: { val: 'Slight 52%/48% right/left weight distribution bias', src: 'AI Generated' as FieldSource },
    dynamicStability: { val: 'Good base of support and center-of-mass control', src: 'AI Generated' as FieldSource },

    // Findings
    abnormalities: [
      {
        id: 'ab_1',
        name: 'Mild Dynamic Knee Valgus',
        severity: 'Mild',
        confidence: 0.88,
        observedEvidence: 'Medial translation of right patella relative to foot long axis at 70°-90° flexion',
        contributingFactors: ['Gluteus medius fatigue / under-recruitment', 'Slight ankle pronation'],
        affectedSegment: 'Knee',
      },
    ] as MovementAbnormality[],
    functionalLimitations: { val: 'Mild difficulty maintaining knee frontal plane stability under progressive fatigue', src: 'AI Generated' as FieldSource },
    contributingFactors: { val: 'Hip abductor endurance deficit and tight gastrocnemius', src: 'AI Generated' as FieldSource },
    compensations: { val: 'Right knee medial shift to bring load closer to body center line', src: 'AI Generated' as FieldSource },
    recommendedTests: {
      val: ['Single-Leg Squat Test', 'Trendelenburg Test', 'Weight-Bearing Lunge Test (WBLT)', 'Ober Test'],
      src: 'AI Generated' as FieldSource,
    },
    estimatedMmtGrade: { val: 4, src: 'AI Generated' as FieldSource },

    // Rehabilitation
    mobility: { val: ['Gastrocnemius-Soleus Wall Stretch (3x30s)', 'Hip Adductor Foam Rolling (2 mins)'], src: 'AI Generated' as FieldSource },
    strengthening: { val: ['Banded Goblet Squats with Miniband (3x10)', 'Side-Lying Clamshells with Resistance (3x15)', 'Single-Leg Romanian Deadlift (3x10)'], src: 'AI Generated' as FieldSource },
    neuromuscular: { val: ['Visual Mirror Biofeedback Squats with Laser Pointer', 'Tempo Eccentric Squats (4s descent)'], src: 'AI Generated' as FieldSource },
    balance: { val: ['Single-Leg Stance on Foam Pad (3x30s)', 'Y-Balance Reach Drills'], src: 'AI Generated' as FieldSource },
    functional: { val: ['Sit-to-Stand Speed Drills', 'Step-Down Control Training'], src: 'AI Generated' as FieldSource },
    patientEducation: { val: 'Focus on driving knees outwards over 2nd toes during descent. Avoid inward knee collapse.', src: 'AI Generated' as FieldSource },
  });

  // Patient Assessment Saved History
  const [savedRecords, setSavedRecords] = useState<PatientAssessmentRecord[]>([]);
  const [patientName, setPatientName] = useState<string>('Patient #1042 (Knee Rehab)');
  const [showSavedModal, setShowSavedModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // DOM Refs
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to compute angle between 3 markers
  const computeAngleFromMarkers = (mList: MarkerPoint[]): number => {
    const a = mList[0];
    const b = mList[1];
    const c = mList[2];
    if (!a || !b || !c) return 90;

    const v1x = a.x - b.x;
    const v1y = a.y - b.y;
    const v2x = c.x - b.x;
    const v2y = c.y - b.y;

    const dot = v1x * v2x + v1y * v2y;
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

    if (mag1 === 0 || mag2 === 0) return 90;

    let cosTheta = dot / (mag1 * mag2);
    cosTheta = Math.max(-1, Math.min(1, cosTheta));
    const rad = Math.acos(cosTheta);
    let deg = Math.round((rad * 180) / Math.PI);

    let goniometricAngle = Math.abs(180 - deg);
    if (goniometricAngle > 180) goniometricAngle = 180;
    return goniometricAngle;
  };

  // Sync measured angle whenever markers change
  useEffect(() => {
    const ang = computeAngleFromMarkers(markers);
    setMeasuredAngle(ang);
    if (autoSyncTo3D) {
      const clamped = Math.max(movement.minAngle, Math.min(movement.maxAngle, ang));
      onApplyAngleToModel(clamped);
    }
  }, [markers, autoSyncTo3D, movement.minAngle, movement.maxAngle]);

  // Handle Dragging of Markers
  const handlePointerDown = (markerId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setActiveDragMarker(markerId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragMarker || !mediaContainerRef.current) return;
    const rect = mediaContainerRef.current.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));

    setMarkers((prev) =>
      prev.map((m) => (m.id === activeDragMarker ? { ...m, x: Math.round(x), y: Math.round(y) } : m))
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDragMarker) {
      setActiveDragMarker(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // File Upload Handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setMediaUrl(url);

    if (file.type.startsWith('video/')) {
      setMediaType('video');
      setIsPlayingVideo(false);
    } else {
      setMediaType('image');
    }
  };

  // Toggle Live Webcam
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setMediaUrl(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
        setMediaType('camera');
      } catch (err: any) {
        alert('Could not access camera: ' + (err?.message || 'Permission denied'));
      }
    }
  };

  // Video playback listeners
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onTimeUpdate = () => setVideoCurrentTime(vid.currentTime);
    const onLoadedMetadata = () => setVideoDuration(vid.duration || 0);
    const onEnded = () => setIsPlayingVideo(false);

    vid.addEventListener('timeupdate', onTimeUpdate);
    vid.addEventListener('loadedmetadata', onLoadedMetadata);
    vid.addEventListener('ended', onEnded);

    return () => {
      vid.removeEventListener('timeupdate', onTimeUpdate);
      vid.removeEventListener('loadedmetadata', onLoadedMetadata);
      vid.removeEventListener('ended', onEnded);
    };
  }, [mediaUrl, mediaType]);

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (isPlayingVideo) {
      videoRef.current.pause();
      setIsPlayingVideo(false);
    } else {
      videoRef.current.play();
      setIsPlayingVideo(true);
    }
  };

  const handleStepFrame = (deltaSeconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoDuration, videoRef.current.currentTime + deltaSeconds));
  };

  const handlePlaybackSpeedToggle = () => {
    const nextRate = videoPlaybackRate === 1.0 ? 0.5 : videoPlaybackRate === 0.5 ? 0.25 : 1.0;
    setVideoPlaybackRate(nextRate);
    if (videoRef.current) videoRef.current.playbackRate = nextRate;
  };

  // Load Preset Demonstrations
  const handleLoadTemplatePreset = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = CLINICAL_MOVEMENT_TEMPLATES.find((t) => t.id === templateId) || CLINICAL_MOVEMENT_TEMPLATES[0];
    const demo = tmpl.sampleDemonstrations[0];

    // Generate clinical SVG image
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
        <rect width="600" height="450" fill="#091326"/>
        <defs>
          <pattern id="cal_grid" width="35" height="35" patternUnits="userSpaceOnUse">
            <path d="M 35 0 L 0 0 0 35" fill="none" stroke="#162544" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="600" height="450" fill="url(#cal_grid)" />
        
        <!-- Floor & Plinth Reference -->
        <rect x="40" y="380" width="520" height="30" rx="4" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
        
        <!-- Subject Anatomical Representation -->
        <circle cx="300" cy="85" r="30" fill="#c49e7b" stroke="#8c6239" stroke-width="2"/>
        <path d="M 270 125 Q 300 115 330 125 L 325 240 L 275 240 Z" fill="#203a43" stroke="#2c5364" stroke-width="2"/>
        
        <!-- Right Lower Limb -->
        <path d="M 285 240 L 265 310 L 270 380" fill="none" stroke="#e0c3a5" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Left Lower Limb -->
        <path d="M 315 240 L 335 310 L 330 380" fill="none" stroke="#e0c3a5" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Right Foot -->
        <rect x="250" y="375" width="45" height="15" rx="3" fill="#64748b"/>
        <!-- Left Foot -->
        <rect x="315" y="375" width="45" height="15" rx="3" fill="#64748b"/>
        
        <!-- Title Badge -->
        <rect x="20" y="20" width="380" height="44" rx="4" fill="#0b132bcc" stroke="#20b2aa" stroke-width="1"/>
        <text x="32" y="42" fill="#20b2aa" font-family="'Times New Roman', serif" font-size="16" font-weight="bold">
          ClinicaAI Motion Capture: ${tmpl.name}
        </text>
        <text x="32" y="56" fill="#fbbf24" font-family="'Times New Roman', serif" font-size="11">
          Camera View: ${tmpl.cameraViewRecommendation} | Normal: ${tmpl.normalRangeOrCriteria.slice(0, 40)}...
        </text>
      </svg>
    `;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    setMediaUrl(url);
    setMediaType('image');
    setRecognizedMovementName(tmpl.name);
    setRecognitionConfidence(0.96);
    setIsLowConfidence(false);

    if (demo && demo.initialMarkers.length >= 3) {
      setMarkers([
        { id: 'proximal', name: 'Marker A (Proximal)', label: demo.initialMarkers[0].name, x: demo.initialMarkers[0].x, y: demo.initialMarkers[0].y, color: '#20b2aa' },
        { id: 'fulcrum', name: 'Marker B (Fulcrum)', label: demo.initialMarkers[1].name, x: demo.initialMarkers[1].x, y: demo.initialMarkers[1].y, color: '#fbbf24' },
        { id: 'distal', name: 'Marker C (Distal)', label: demo.initialMarkers[2].name, x: demo.initialMarkers[2].x, y: demo.initialMarkers[2].y, color: '#38bdf8' },
      ]);
      setMeasuredAngle(demo.defaultAngle);
    }
  };

  // Perform AI Video Movement Recognition, Pose Estimation, and Clinical Prefill
  const handleExecuteAIAnalysis = async () => {
    setIsAiAnalyzing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');

      if ((mediaType === 'video' || mediaType === 'camera') && videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      } else if (mediaUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = mediaUrl;
        });
        ctx.drawImage(img, 0, 0, 640, 480);
      } else {
        ctx.fillStyle = '#0b132b';
        ctx.fillRect(0, 0, 640, 480);
      }

      const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);

      const res = await fetch('/api/analyze-motion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
          expectedJoint: joint.name,
          expectedMovement: movement.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Server error during motion analysis');
      }

      const data = await res.json();
      const analysis = data.analysis;

      // 1. Process Movement Recognition
      if (analysis.movementIdentification) {
        const movId = analysis.movementIdentification;
        setRecognizedMovementName(movId.movementName || 'Recognized Movement');
        const conf = movId.confidence !== undefined ? movId.confidence : 0.92;
        setRecognitionConfidence(conf);
        setIsLowConfidence(conf < 0.75);

        if (movId.repetitionCount !== undefined) setRepetitionCount(movId.repetitionCount);
        if (movId.leftRightSymmetryPercent !== undefined) setSymmetryPercent(movId.leftRightSymmetryPercent);
        if (movId.activePhases) setActivePhase(movId.activePhases);
      }

      // 2. Process Markers
      if (analysis.markers && Array.isArray(analysis.markers) && analysis.markers.length >= 3) {
        setMarkers([
          {
            id: 'proximal',
            name: analysis.markers[0].name || 'Marker A (Proximal)',
            label: analysis.markers[0].label || 'Proximal Landmark',
            x: Math.round(analysis.markers[0].x || 45),
            y: Math.round(analysis.markers[0].y || 32),
            color: '#20b2aa',
          },
          {
            id: 'fulcrum',
            name: analysis.markers[1].name || 'Marker B (Fulcrum)',
            label: analysis.markers[1].label || 'Joint Fulcrum',
            x: Math.round(analysis.markers[1].x || 43),
            y: Math.round(analysis.markers[1].y || 60),
            color: '#fbbf24',
          },
          {
            id: 'distal',
            name: analysis.markers[2].name || 'Marker C (Distal)',
            label: analysis.markers[2].label || 'Distal Landmark',
            x: Math.round(analysis.markers[2].x || 42),
            y: Math.round(analysis.markers[2].y || 88),
            color: '#38bdf8',
          },
        ]);
      }

      // 3. Process Skeleton
      if (analysis.skeleton && typeof analysis.skeleton === 'object') {
        const newSkel: Record<string, SkeletonPoint> = {};
        for (const [key, coords] of Object.entries(analysis.skeleton)) {
          if (Array.isArray(coords) && coords.length >= 2) {
            newSkel[key] = { x: Math.round(coords[0]), y: Math.round(coords[1]) };
          }
        }
        setSkeleton((prev) => ({ ...prev, ...newSkel }));
      }

      // 4. Measured Angles
      if (analysis.biomechanicalAssessment?.measuredPrimaryAngleDeg !== undefined) {
        setMeasuredAngle(Math.round(analysis.biomechanicalAssessment.measuredPrimaryAngleDeg));
        if (autoSyncTo3D) {
          onApplyAngleToModel(Math.round(analysis.biomechanicalAssessment.measuredPrimaryAngleDeg));
        }
      }
      if (analysis.biomechanicalAssessment?.contralateralAngleDeg !== undefined) {
        setContralateralAngle(Math.round(analysis.biomechanicalAssessment.contralateralAngleDeg));
      }

      // 5. Automatic Form Prefill Mapping
      const bio = analysis.biomechanicalAssessment || {};
      const find = analysis.clinicalFindings || {};
      const rehab = analysis.rehabilitationRecommendations || {};

      setFormData((prev) => ({
        ...prev,
        movementName: { val: analysis.movementIdentification?.movementName || prev.movementName.val, src: 'AI Generated' },
        category: analysis.movementIdentification?.category || prev.category,
        reps: { val: analysis.movementIdentification?.repetitionCount || prev.reps.val, src: 'AI Generated' },
        duration: { val: analysis.movementIdentification?.durationSeconds || prev.duration.val, src: 'AI Generated' },
        cadence: { val: analysis.movementIdentification?.cadenceOrSpeed || prev.cadence.val, src: 'AI Generated' },
        activePhases: { val: analysis.movementIdentification?.activePhases || prev.activePhases.val, src: 'AI Generated' },
        symmetry: { val: analysis.movementIdentification?.leftRightSymmetryPercent || prev.symmetry.val, src: 'AI Generated' },

        trunkAlignment: { val: bio.trunkAlignment || prev.trunkAlignment.val, src: 'AI Generated' },
        pelvicMovement: { val: bio.pelvicMovement || prev.pelvicMovement.val, src: 'AI Generated' },
        hipMechanics: { val: bio.hipMechanics || prev.hipMechanics.val, src: 'AI Generated' },
        kneeMechanics: { val: bio.kneeMechanics || prev.kneeMechanics.val, src: 'AI Generated' },
        ankleMechanics: { val: bio.ankleMechanics || prev.ankleMechanics.val, src: 'AI Generated' },
        footPosture: { val: bio.footPosture || prev.footPosture.val, src: 'AI Generated' },
        segmentalCoordination: { val: bio.segmentalCoordination || prev.segmentalCoordination.val, src: 'AI Generated' },
        weightBearing: { val: bio.weightBearingSymmetry || prev.weightBearing.val, src: 'AI Generated' },
        dynamicStability: { val: bio.dynamicStability || prev.dynamicStability.val, src: 'AI Generated' },

        abnormalities: find.observedAbnormalities && Array.isArray(find.observedAbnormalities)
          ? find.observedAbnormalities
          : prev.abnormalities,
        functionalLimitations: { val: find.functionalLimitations || prev.functionalLimitations.val, src: 'AI Generated' },
        contributingFactors: { val: find.possibleContributingFactors || prev.contributingFactors.val, src: 'AI Generated' },
        compensations: { val: find.compensatoryStrategies || prev.compensations.val, src: 'AI Generated' },
        recommendedTests: { val: find.recommendedPhysicalTests || prev.recommendedTests.val, src: 'AI Generated' },
        estimatedMmtGrade: { val: find.estimatedMmtGrade || prev.estimatedMmtGrade.val, src: 'AI Generated' },

        mobility: { val: rehab.mobilityExercises || prev.mobility.val, src: 'AI Generated' },
        strengthening: { val: rehab.strengtheningExercises || prev.strengthening.val, src: 'AI Generated' },
        neuromuscular: { val: rehab.neuromuscularTraining || prev.neuromuscular.val, src: 'AI Generated' },
        balance: { val: rehab.balanceProprioception || prev.balance.val, src: 'AI Generated' },
        functional: { val: rehab.gaitOrFunctionalRetraining || prev.functional.val, src: 'AI Generated' },
        patientEducation: { val: rehab.patientEducation || prev.patientEducation.val, src: 'AI Generated' },
      }));
    } catch (err: any) {
      console.error('AI Movement analysis failed:', err);
      alert(`AI Motion Analysis Error: ${err?.message || 'Check GEMINI_API_KEY setting'}`);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Confirm / Approve All Fields
  const handleApproveAll = () => {
    setFormData((prev) => ({
      ...prev,
      trunkAlignment: { ...prev.trunkAlignment, src: 'Clinician Confirmed' },
      pelvicMovement: { ...prev.pelvicMovement, src: 'Clinician Confirmed' },
      hipMechanics: { ...prev.hipMechanics, src: 'Clinician Confirmed' },
      kneeMechanics: { ...prev.kneeMechanics, src: 'Clinician Confirmed' },
      ankleMechanics: { ...prev.ankleMechanics, src: 'Clinician Confirmed' },
      footPosture: { ...prev.footPosture, src: 'Clinician Confirmed' },
      segmentalCoordination: { ...prev.segmentalCoordination, src: 'Clinician Confirmed' },
      weightBearing: { ...prev.weightBearing, src: 'Clinician Confirmed' },
      dynamicStability: { ...prev.dynamicStability, src: 'Clinician Confirmed' },
      functionalLimitations: { ...prev.functionalLimitations, src: 'Clinician Confirmed' },
      contributingFactors: { ...prev.contributingFactors, src: 'Clinician Confirmed' },
      compensations: { ...prev.compensations, src: 'Clinician Confirmed' },
      recommendedTests: { ...prev.recommendedTests, src: 'Clinician Confirmed' },
      estimatedMmtGrade: { ...prev.estimatedMmtGrade, src: 'Clinician Confirmed' },
      mobility: { ...prev.mobility, src: 'Clinician Confirmed' },
      strengthening: { ...prev.strengthening, src: 'Clinician Confirmed' },
      neuromuscular: { ...prev.neuromuscular, src: 'Clinician Confirmed' },
      balance: { ...prev.balance, src: 'Clinician Confirmed' },
      functional: { ...prev.functional, src: 'Clinician Confirmed' },
      patientEducation: { ...prev.patientEducation, src: 'Clinician Confirmed' },
    }));
  };

  // Save Assessment to Patient History
  const handleSaveAssessment = () => {
    const toField = <T,>(f: { val: T; src: FieldSource }) => ({ value: f.val, source: f.src });

    const record: PatientAssessmentRecord = {
      id: `assess_${Date.now()}`,
      patientId: 'PT-1042',
      patientName,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      movementName: recognizedMovementName,
      category: formData.category as any,
      identification: {
        movementName: toField(formData.movementName),
        category: formData.category as any,
        confidence: recognitionConfidence,
        cameraView: formData.cameraView as any,
        repetitionCount: toField(formData.reps),
        durationSeconds: toField(formData.duration),
        cadenceOrSpeed: toField(formData.cadence),
        activePhases: toField(formData.activePhases),
        leftRightSymmetryPercent: toField(formData.symmetry),
      },
      biomechanics: {
        trunkAlignment: toField(formData.trunkAlignment),
        pelvicMovement: toField(formData.pelvicMovement),
        hipMechanics: toField(formData.hipMechanics),
        kneeMechanics: toField(formData.kneeMechanics),
        ankleMechanics: toField(formData.ankleMechanics),
        footPosture: toField(formData.footPosture),
        segmentalCoordination: toField(formData.segmentalCoordination),
        weightBearingSymmetry: toField(formData.weightBearing),
        dynamicStability: toField(formData.dynamicStability),
        measuredPrimaryAngleDeg: { value: measuredAngle, source: 'Video Observed' },
        contralateralAngleDeg: { value: contralateralAngle, source: 'Video Observed' },
      },
      findings: {
        observedAbnormalities: formData.abnormalities,
        functionalLimitations: toField(formData.functionalLimitations),
        possibleContributingFactors: toField(formData.contributingFactors),
        compensatoryStrategies: toField(formData.compensations),
        recommendedPhysicalTests: toField(formData.recommendedTests),
        estimatedMmtGrade: toField(formData.estimatedMmtGrade),
      },
      rehabilitation: {
        mobilityExercises: toField(formData.mobility),
        strengtheningExercises: toField(formData.strengthening),
        neuromuscularTraining: toField(formData.neuromuscular),
        balanceProprioception: toField(formData.balance),
        gaitOrFunctionalRetraining: toField(formData.functional),
        patientEducation: toField(formData.patientEducation),
      },
      clinicianNotes: `Verified and approved by attending physiotherapist. Measured primary joint angle: ${measuredAngle}°.`,
      status: 'Clinician Approved',
      approvedBy: 'Lead Physiotherapy Clinician (BPT/MPT)',
    };

    setSavedRecords((prev) => [record, ...prev]);
    alert(`Assessment for ${patientName} (${recognizedMovementName}) successfully saved to clinical records!`);
  };

  const pA = markers[0];
  const pB = markers[1];
  const pC = markers[2];

  // Helper for source badge
  const renderSourceBadge = (source: FieldSource) => {
    switch (source) {
      case 'AI Generated':
        return <span className="text-[9px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-600/60 font-sans">AI Generated</span>;
      case 'Video Observed':
        return <span className="text-[9px] bg-sky-950/80 text-sky-300 px-1.5 py-0.5 rounded border border-sky-600/60 font-sans">Video Observed</span>;
      case 'Clinician Confirmed':
        return <span className="text-[9px] bg-teal-950/80 text-teal-300 px-1.5 py-0.5 rounded border border-teal-600/60 font-sans font-bold">✓ Clinician Confirmed</span>;
      case 'Manually Edited':
        return <span className="text-[9px] bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded border border-purple-600/60 font-sans">Manually Edited</span>;
    }
  };

  return (
    <div className="space-y-4 text-slate-100 text-sm">
      {/* ClinicaAI Header Banner */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-[#20b2aa]/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#20b2aa]"></span>
            <span className="text-xs uppercase font-bold text-[#fbbf24] tracking-wide font-sans">
              ClinicaAI Intelligent Movement Assessment & Automatic Prefill Studio
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="text-[11px] px-2.5 py-1 bg-[#132247] hover:bg-[#1a2d5e] text-[#fbbf24] font-bold rounded border border-amber-500/60 cursor-pointer flex items-center gap-1 font-sans"
            >
              📄 View Clinical Report
            </button>
            <button
              onClick={() => setShowSavedModal(true)}
              className="text-[11px] px-2.5 py-1 bg-[#132247] hover:bg-[#1a2d5e] text-teal-300 font-bold rounded border border-teal-500/60 cursor-pointer flex items-center gap-1 font-sans"
            >
              📂 History ({savedRecords.length})
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Upload patient movement videos or live camera recordings. ClinicaAI automatically recognizes the functional movement, computes 2D skeletal tracking, identifies biomechanical abnormalities, and automatically prefills the structured clinical assessment template.
        </p>
      </div>

      {/* Movement Recognition Banner & Template Selector */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 font-sans uppercase">Recognized Movement:</span>
            <span className="text-sm font-bold text-white bg-[#132247] px-2.5 py-0.5 rounded border border-teal-500/50">
              {recognizedMovementName}
            </span>
            <span className={`text-[11px] font-sans px-2 py-0.5 rounded font-bold ${recognitionConfidence >= 0.85 ? 'bg-teal-950 text-teal-300 border border-teal-700' : 'bg-amber-950 text-amber-300 border border-amber-600'}`}>
              {(recognitionConfidence * 100).toFixed(0)}% Confidence
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-sans">Template Override:</span>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleLoadTemplatePreset(e.target.value)}
              className="bg-[#070e22] text-xs text-slate-200 border border-slate-700 rounded px-2 py-1 font-sans cursor-pointer focus:outline-none focus:border-teal-500"
            >
              {CLINICAL_MOVEMENT_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  [{tmpl.category}] {tmpl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLowConfidence && (
          <div className="bg-amber-950/70 border border-amber-500/80 p-2 rounded text-xs text-amber-200 flex items-center gap-2">
            <span>⚠️</span>
            <span>
              <strong>Low Recognition Confidence:</strong> Video angle or landmark occlusion detected. Please confirm or select the correct movement template from the dropdown above to ensure clinical accuracy.
            </span>
          </div>
        )}
      </div>

      {/* Media Input & AI Action Toolbar */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* File Upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-[#132247] hover:bg-[#1a2d5e] text-slate-200 text-xs font-semibold rounded border border-slate-700 flex items-center gap-1.5 cursor-pointer font-sans"
          >
            <svg className="w-4 h-4 text-[#20b2aa]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Upload Video / Photo</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Camera Toggle */}
          <button
            type="button"
            onClick={handleToggleCamera}
            className={`px-3 py-1.5 text-xs font-semibold rounded border flex items-center gap-1.5 cursor-pointer transition-colors font-sans ${
              isCameraActive
                ? 'bg-red-900/80 text-red-200 border-red-500'
                : 'bg-[#132247] hover:bg-[#1a2d5e] text-slate-200 border-slate-700'
            }`}
          >
            <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>{isCameraActive ? 'Stop Live Camera' : 'Live Camera'}</span>
          </button>

          {/* Preset Clinical Demo */}
          <button
            type="button"
            onClick={() => handleLoadTemplatePreset(selectedTemplateId)}
            className="px-3 py-1.5 bg-[#20b2aa]/20 hover:bg-[#20b2aa]/35 text-teal-300 text-xs font-semibold rounded border border-[#20b2aa]/50 cursor-pointer font-sans"
          >
            Load Sample Patient Demo
          </button>
        </div>

        {/* AI Execute Button */}
        <button
          type="button"
          onClick={handleExecuteAIAnalysis}
          disabled={isAiAnalyzing}
          className="px-4 py-2 bg-gradient-to-r from-[#20b2aa] to-[#0d9488] hover:from-[#14b8a6] hover:to-[#0f766e] disabled:opacity-40 text-[#0b132b] text-xs font-bold rounded border border-[#fbbf24] shadow flex items-center gap-1.5 cursor-pointer font-sans"
        >
          {isAiAnalyzing ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-spin"></span>
              <span>AI Analyzing Biomechanics & Prefilling...</span>
            </>
          ) : (
            <>
              <span>✨ Run AI Movement Recognition & Prefill</span>
            </>
          )}
        </button>
      </div>

      {/* Video & 2D Skeletal Canvas Viewport */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-slate-700/80 space-y-2">
        <div className="flex flex-wrap items-center justify-between text-xs font-sans gap-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#fbbf24]">Skeletal Tracking & Marker Overlay</span>
            <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showSkeletonOverlay}
                onChange={(e) => setShowSkeletonOverlay(e.target.checked)}
                className="accent-[#20b2aa]"
              />
              <span>2D Skeleton Wireframe</span>
            </label>
            <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showMarkersOverlay}
                onChange={(e) => setShowMarkersOverlay(e.target.checked)}
                className="accent-[#20b2aa]"
              />
              <span>Goniometer Markers</span>
            </label>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSyncTo3D}
              onChange={(e) => setAutoSyncTo3D(e.target.checked)}
              className="accent-[#20b2aa]"
            />
            <span>Live Sync to 3D Simulation ({measuredAngle}°)</span>
          </label>
        </div>

        {/* Media Frame Container */}
        <div
          ref={mediaContainerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full h-[300px] sm:h-[380px] bg-[#050b18] rounded-md overflow-hidden border border-slate-800 touch-none select-none flex items-center justify-center"
        >
          {/* Media Content */}
          {mediaType === 'camera' ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
          ) : mediaType === 'video' && mediaUrl ? (
            <video ref={videoRef} src={mediaUrl} playsInline className="w-full h-full object-contain" />
          ) : mediaUrl ? (
            <img src={mediaUrl} alt="Patient Posture" className="w-full h-full object-contain pointer-events-none" />
          ) : (
            <div className="text-center p-6 text-slate-400 space-y-2 font-sans">
              <p className="text-xs">No media loaded yet.</p>
              <button
                onClick={() => handleLoadTemplatePreset(selectedTemplateId)}
                className="text-xs text-teal-400 underline font-semibold cursor-pointer"
              >
                Click here to load a sample clinical demonstration
              </button>
            </div>
          )}

          {/* SVG Overlay: 2D Skeletal Wireframe & Goniometer Arms */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {/* Full 2D Human Skeleton Wireframe */}
            {showSkeletonOverlay && skeleton.rightShoulder && skeleton.leftShoulder && (
              <g stroke="#14b8a6" strokeWidth="2.5" opacity="0.8" strokeLinecap="round">
                {/* Head to Neck */}
                {skeleton.nose && (
                  <line x1={`${skeleton.nose.x}%`} y1={`${skeleton.nose.y}%`} x2={`${(skeleton.leftShoulder.x + skeleton.rightShoulder.x) / 2}%`} y2={`${(skeleton.leftShoulder.y + skeleton.rightShoulder.y) / 2}%`} stroke="#38bdf8" />
                )}
                {/* Clavicle bar */}
                <line x1={`${skeleton.rightShoulder.x}%`} y1={`${skeleton.rightShoulder.y}%`} x2={`${skeleton.leftShoulder.x}%`} y2={`${skeleton.leftShoulder.y}%`} stroke="#fbbf24" strokeWidth="3" />
                {/* Torso right & left to hips */}
                {skeleton.rightHip && skeleton.leftHip && (
                  <>
                    <line x1={`${skeleton.rightShoulder.x}%`} y1={`${skeleton.rightShoulder.y}%`} x2={`${skeleton.rightHip.x}%`} y2={`${skeleton.rightHip.y}%`} />
                    <line x1={`${skeleton.leftShoulder.x}%`} y1={`${skeleton.leftShoulder.y}%`} x2={`${skeleton.leftHip.x}%`} y2={`${skeleton.leftHip.y}%`} />
                    {/* Pelvic bar */}
                    <line x1={`${skeleton.rightHip.x}%`} y1={`${skeleton.rightHip.y}%`} x2={`${skeleton.leftHip.x}%`} y2={`${skeleton.leftHip.y}%`} stroke="#fbbf24" strokeWidth="3" />
                  </>
                )}
                {/* Right Arm */}
                {skeleton.rightElbow && <line x1={`${skeleton.rightShoulder.x}%`} y1={`${skeleton.rightShoulder.y}%`} x2={`${skeleton.rightElbow.x}%`} y2={`${skeleton.rightElbow.y}%`} />}
                {skeleton.rightElbow && skeleton.rightWrist && <line x1={`${skeleton.rightElbow.x}%`} y1={`${skeleton.rightElbow.y}%`} x2={`${skeleton.rightWrist.x}%`} y2={`${skeleton.rightWrist.y}%`} />}
                {/* Left Arm */}
                {skeleton.leftElbow && <line x1={`${skeleton.leftShoulder.x}%`} y1={`${skeleton.leftShoulder.y}%`} x2={`${skeleton.leftElbow.x}%`} y2={`${skeleton.leftElbow.y}%`} />}
                {skeleton.leftElbow && skeleton.leftWrist && <line x1={`${skeleton.leftElbow.x}%`} y1={`${skeleton.leftElbow.y}%`} x2={`${skeleton.leftWrist.x}%`} y2={`${skeleton.leftWrist.y}%`} />}
                {/* Right Leg */}
                {skeleton.rightHip && skeleton.rightKnee && <line x1={`${skeleton.rightHip.x}%`} y1={`${skeleton.rightHip.y}%`} x2={`${skeleton.rightKnee.x}%`} y2={`${skeleton.rightKnee.y}%`} stroke="#2dd4bf" strokeWidth="3.5" />}
                {skeleton.rightKnee && skeleton.rightAnkle && <line x1={`${skeleton.rightKnee.x}%`} y1={`${skeleton.rightKnee.y}%`} x2={`${skeleton.rightAnkle.x}%`} y2={`${skeleton.rightAnkle.y}%`} stroke="#2dd4bf" strokeWidth="3.5" />}
                {/* Left Leg */}
                {skeleton.leftHip && skeleton.leftKnee && <line x1={`${skeleton.leftHip.x}%`} y1={`${skeleton.leftHip.y}%`} x2={`${skeleton.leftKnee.x}%`} y2={`${skeleton.leftKnee.y}%`} stroke="#38bdf8" strokeWidth="3.5" />}
                {skeleton.leftKnee && skeleton.leftAnkle && <line x1={`${skeleton.leftKnee.x}%`} y1={`${skeleton.leftKnee.y}%`} x2={`${skeleton.leftAnkle.x}%`} y2={`${skeleton.leftAnkle.y}%`} stroke="#38bdf8" strokeWidth="3.5" />}

                {/* Skeletal Joint Nodes */}
                {Object.values(skeleton).map((pt, i) => (
                  <circle key={i} cx={`${pt.x}%`} cy={`${pt.y}%`} r="3.5" fill="#ffffff" stroke="#0b132b" strokeWidth="1" />
                ))}
              </g>
            )}

            {/* 3 Goniometer Primary Arms */}
            {showMarkersOverlay && (
              <>
                <line x1={`${pA.x}%`} y1={`${pA.y}%`} x2={`${pB.x}%`} y2={`${pB.y}%`} stroke="#20b2aa" strokeWidth="3.5" strokeDasharray="5 3" />
                <line x1={`${pB.x}%`} y1={`${pB.y}%`} x2={`${pC.x}%`} y2={`${pC.y}%`} stroke="#38bdf8" strokeWidth="3.5" strokeDasharray="5 3" />
                <circle cx={`${pB.x}%`} cy={`${pB.y}%`} r="26" fill="none" stroke="#d4af37" strokeWidth="2" opacity="0.85" />
              </>
            )}
          </svg>

          {/* Draggable Goniometer Pins */}
          {showMarkersOverlay &&
            markers.map((marker) => (
              <div
                key={marker.id}
                onPointerDown={(e) => handlePointerDown(marker.id, e)}
                style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: 'translate(-50%, -50%)' }}
                className="absolute z-20 cursor-grab active:cursor-grabbing flex flex-col items-center group"
              >
                <div
                  style={{ backgroundColor: marker.color }}
                  className="w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[9px] font-bold text-slate-900 group-hover:scale-125 transition-transform"
                >
                  {marker.id === 'proximal' ? 'A' : marker.id === 'fulcrum' ? 'B' : 'C'}
                </div>
                <div className="mt-0.5 bg-[#0b132b]/95 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] text-white whitespace-nowrap shadow pointer-events-none font-sans">
                  {marker.label}
                </div>
              </div>
            ))}

          {/* Measured Goniometer Badge */}
          <div className="absolute top-2.5 left-2.5 bg-[#0b132b]/90 border border-[#fbbf24] px-2.5 py-1 rounded shadow z-20 pointer-events-none">
            <span className="text-[10px] text-slate-400 block font-sans">Measured Joint Angle:</span>
            <span className="text-base font-bold text-[#fbbf24]">{measuredAngle}°</span>
          </div>

          {/* Movement Phase Tag */}
          <div className="absolute top-2.5 right-2.5 bg-[#0b132b]/90 border border-teal-500/70 px-2 py-1 rounded shadow z-20 pointer-events-none text-right font-sans">
            <span className="text-[10px] text-teal-300 block">Movement Phase:</span>
            <span className="text-xs font-bold text-white">{activePhase}</span>
          </div>
        </div>

        {/* Video Scrubber Controls (Shown when video is active) */}
        {mediaType === 'video' && mediaUrl && (
          <div className="bg-[#070e22] p-2 rounded border border-slate-800 flex items-center gap-2 text-xs font-sans">
            <button
              onClick={toggleVideoPlay}
              className="px-2.5 py-1 bg-[#20b2aa] text-[#0b132b] font-bold rounded cursor-pointer"
            >
              {isPlayingVideo ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={() => handleStepFrame(-0.04)}
              className="px-2 py-1 bg-[#132247] text-slate-200 rounded cursor-pointer"
              title="Previous frame"
            >
              ⏮ -1 Frame
            </button>
            <button
              onClick={() => handleStepFrame(0.04)}
              className="px-2 py-1 bg-[#132247] text-slate-200 rounded cursor-pointer"
              title="Next frame"
            >
              ⏭ +1 Frame
            </button>
            <input
              type="range"
              min={0}
              max={videoDuration || 1}
              step={0.02}
              value={videoCurrentTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVideoCurrentTime(val);
                if (videoRef.current) videoRef.current.currentTime = val;
              }}
              className="flex-1 accent-[#20b2aa] cursor-pointer"
            />
            <button
              onClick={handlePlaybackSpeedToggle}
              className="px-2 py-1 bg-[#132247] text-amber-300 rounded font-mono font-bold cursor-pointer"
            >
              {videoPlaybackRate}x
            </button>
            <span className="text-[10px] text-slate-400 font-mono">
              {videoCurrentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {/* Biomechanical Live Meters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-sans">
        <div className="bg-[#0b1633] p-2.5 rounded border border-slate-700/80">
          <span className="text-[10px] uppercase text-slate-400 block font-semibold">Joint Angle (A-B-C)</span>
          <div className="text-lg font-bold text-[#fbbf24]">{measuredAngle}°</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Contralateral: {contralateralAngle}°</div>
        </div>

        <div className="bg-[#0b1633] p-2.5 rounded border border-slate-700/80">
          <span className="text-[10px] uppercase text-slate-400 block font-semibold">L/R Symmetry</span>
          <div className="text-lg font-bold text-[#20b2aa]">{symmetryPercent}%</div>
          <div className="text-[10px] text-teal-300 mt-0.5">{symmetryPercent >= 90 ? 'Normal Symmetry' : 'Asymmetry Detected'}</div>
        </div>

        <div className="bg-[#0b1633] p-2.5 rounded border border-slate-700/80">
          <span className="text-[10px] uppercase text-slate-400 block font-semibold">Repetition Count</span>
          <div className="text-lg font-bold text-amber-300">{repetitionCount} Reps</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cadence: 2.5s / rep</div>
        </div>

        <div className="bg-[#0b1633] p-2.5 rounded border border-slate-700/80">
          <span className="text-[10px] uppercase text-slate-400 block font-semibold">Calculated Torque</span>
          <div className="text-lg font-bold text-white">{biomechanics.netTorqueNm.toFixed(2)} N·m</div>
          <div className="text-[10px] text-teal-300 mt-0.5">Muscle Force: {biomechanics.primaryMuscleForceN.toFixed(0)} N</div>
        </div>
      </div>

      {/* Structured Clinical Assessment Prefill Section */}
      <div className="bg-[#0b1633] p-3 rounded-md border border-[#20b2aa]/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
              <span>Automatic Clinical Assessment Form</span>
              <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-700">
                Prefilled via AI Video Analysis
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Review, edit, or approve all video-derived biomechanical findings and clinical recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApproveAll}
              className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-[#0b132b] text-xs font-bold rounded cursor-pointer font-sans shadow"
            >
              ✓ Approve All Findings
            </button>
            <button
              onClick={handleSaveAssessment}
              className="px-3 py-1 bg-[#d4af37] hover:bg-amber-400 text-[#0b132b] text-xs font-bold rounded cursor-pointer font-sans shadow"
            >
              💾 Save Assessment
            </button>
          </div>
        </div>

        {/* Form Category Navigation Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-2">
          {[
            { key: 'biomechanics', label: '1. Biomechanical Mechanics' },
            { key: 'findings', label: '2. Clinical Findings & Tests' },
            { key: 'rehabilitation', label: '3. Rehabilitation Plan' },
            { key: 'identification', label: '4. Movement Parameters' },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setFormSubTab(st.key as any)}
              className={`text-xs px-3 py-1 rounded font-sans font-semibold transition-colors cursor-pointer border ${
                formSubTab === st.key
                  ? 'bg-[#20b2aa] text-[#0b132b] font-bold border-[#fbbf24]'
                  : 'bg-[#132247] text-slate-300 border-slate-700 hover:bg-[#1a2d5e]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Biomechanical Mechanics */}
        {formSubTab === 'biomechanics' && (
          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-white">Trunk Alignment:</strong>
                  {renderSourceBadge(formData.trunkAlignment.src)}
                </div>
                <input
                  type="text"
                  value={formData.trunkAlignment.val}
                  onChange={(e) => setFormData({ ...formData, trunkAlignment: { val: e.target.value, src: 'Manually Edited' } })}
                  className="w-full bg-[#0b1633] border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-white">Pelvic Movement & Tilt:</strong>
                  {renderSourceBadge(formData.pelvicMovement.src)}
                </div>
                <input
                  type="text"
                  value={formData.pelvicMovement.val}
                  onChange={(e) => setFormData({ ...formData, pelvicMovement: { val: e.target.value, src: 'Manually Edited' } })}
                  className="w-full bg-[#0b1633] border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-white">Hip Mechanics:</strong>
                  {renderSourceBadge(formData.hipMechanics.src)}
                </div>
                <input
                  type="text"
                  value={formData.hipMechanics.val}
                  onChange={(e) => setFormData({ ...formData, hipMechanics: { val: e.target.value, src: 'Manually Edited' } })}
                  className="w-full bg-[#0b1633] border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-white">Knee Mechanics:</strong>
                  {renderSourceBadge(formData.kneeMechanics.src)}
                </div>
                <input
                  type="text"
                  value={formData.kneeMechanics.val}
                  onChange={(e) => setFormData({ ...formData, kneeMechanics: { val: e.target.value, src: 'Manually Edited' } })}
                  className="w-full bg-[#0b1633] border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-white">Ankle Mechanics:</strong>
                  {renderSourceBadge(formData.ankleMechanics.src)}
                </div>
                <input
                  type="text"
                  value={formData.ankleMechanics.val}
                  onChange={(e) => setFormData({ ...formData, ankleMechanics: { val: e.target.value, src: 'Manually Edited' } })}
                  className="w-full bg-[#0b1633] border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-white">Foot Posture / Arch:</strong>
                  {renderSourceBadge(formData.footPosture.src)}
                </div>
                <input
                  type="text"
                  value={formData.footPosture.val}
                  onChange={(e) => setFormData({ ...formData, footPosture: { val: e.target.value, src: 'Manually Edited' } })}
                  className="w-full bg-[#0b1633] border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-white">Weight-Bearing Symmetry:</strong>
                  {renderSourceBadge(formData.weightBearing.src)}
                </div>
                <input
                  type="text"
                  value={formData.weightBearing.val}
                  onChange={(e) => setFormData({ ...formData, weightBearing: { val: e.target.value, src: 'Manually Edited' } })}
                  className="w-full bg-[#0b1633] border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-white">Dynamic Stability:</strong>
                  {renderSourceBadge(formData.dynamicStability.src)}
                </div>
                <input
                  type="text"
                  value={formData.dynamicStability.val}
                  onChange={(e) => setFormData({ ...formData, dynamicStability: { val: e.target.value, src: 'Manually Edited' } })}
                  className="w-full bg-[#0b1633] border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Clinical Findings & Physical Tests */}
        {formSubTab === 'findings' && (
          <div className="space-y-2.5 text-xs">
            {/* Identified Abnormalities Cards */}
            <div className="space-y-1.5">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">
                Observed Movement Abnormalities & Dysfunctions
              </span>
              {formData.abnormalities.map((ab) => (
                <div key={ab.id} className="bg-[#070e22] p-2.5 rounded border border-slate-800 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ab.severity === 'Severe' ? 'bg-red-950 text-red-300 border border-red-700' : ab.severity === 'Moderate' ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-teal-950 text-teal-300 border border-teal-700'}`}>
                        {ab.severity} Severity
                      </span>
                      <strong className="text-white text-sm">{ab.name}</strong>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      <strong className="text-slate-400">Observed Evidence:</strong> {ab.observedEvidence}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      <strong>Contributing Factors:</strong> {ab.contributingFactors.join(', ')}
                    </p>
                  </div>
                  <span className="text-[10px] text-teal-300 bg-[#0b1633] px-2 py-1 rounded border border-slate-700">
                    Confidence: {(ab.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Compensations & Limitations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-white">Compensatory Strategies:</strong>
                  {renderSourceBadge(formData.compensations.src)}
                </div>
                <textarea
                  rows={2}
                  value={formData.compensations.val}
                  onChange={(e) => setFormData({ ...formData, compensations: { val: e.target.value, src: 'Manually Edited' } })}
                  className="w-full bg-[#0b1633] border border-slate-700 rounded p-1.5 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-white">Functional Limitations:</strong>
                  {renderSourceBadge(formData.functionalLimitations.src)}
                </div>
                <textarea
                  rows={2}
                  value={formData.functionalLimitations.val}
                  onChange={(e) => setFormData({ ...formData, functionalLimitations: { val: e.target.value, src: 'Manually Edited' } })}
                  className="w-full bg-[#0b1633] border border-slate-700 rounded p-1.5 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Recommended Physical Tests & Estimated MMT Grade */}
            <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <strong className="text-amber-300">Recommended Physical Examination Tests:</strong>
                {renderSourceBadge(formData.recommendedTests.src)}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formData.recommendedTests.val.map((testName, i) => (
                  <span key={i} className="bg-[#132247] text-teal-200 px-2 py-0.5 rounded text-xs border border-teal-600/50">
                    🔍 {testName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Rehabilitation Prescription */}
        {formSubTab === 'rehabilitation' && (
          <div className="space-y-2.5 text-xs">
            <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-[#20b2aa]">Targeted Mobility & Joint Mobilization:</strong>
                {renderSourceBadge(formData.mobility.src)}
              </div>
              <ul className="list-disc pl-4 text-slate-300 space-y-0.5">
                {formData.mobility.val.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-[#fbbf24]">Targeted Strengthening & Loading:</strong>
                {renderSourceBadge(formData.strengthening.src)}
              </div>
              <ul className="list-disc pl-4 text-slate-300 space-y-0.5">
                {formData.strengthening.val.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-emerald-400">Neuromuscular Biofeedback Training:</strong>
                {renderSourceBadge(formData.neuromuscular.src)}
              </div>
              <ul className="list-disc pl-4 text-slate-300 space-y-0.5">
                {formData.neuromuscular.val.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-[#070e22] p-2.5 rounded border border-slate-800 space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-slate-300">Patient Education & Movement Cues:</strong>
                {renderSourceBadge(formData.patientEducation.src)}
              </div>
              <p className="text-slate-300 italic">{formData.patientEducation.val}</p>
            </div>
          </div>
        )}

        {/* Tab 4: Movement Parameters */}
        {formSubTab === 'identification' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-[#070e22] p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Movement Name</span>
              <strong className="text-white text-sm">{formData.movementName.val}</strong>
            </div>
            <div className="bg-[#070e22] p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Category</span>
              <strong className="text-teal-300">{formData.category}</strong>
            </div>
            <div className="bg-[#070e22] p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Camera View</span>
              <strong className="text-slate-200">{formData.cameraView}</strong>
            </div>
            <div className="bg-[#070e22] p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Repetition Count</span>
              <strong className="text-white">{formData.reps.val}</strong>
            </div>
            <div className="bg-[#070e22] p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Active Movement Phases</span>
              <strong className="text-amber-300">{formData.activePhases.val}</strong>
            </div>
            <div className="bg-[#070e22] p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Movement Duration</span>
              <strong className="text-slate-200">{formData.duration.val} seconds</strong>
            </div>
          </div>
        )}
      </div>

      {/* Clinical Assessment Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0b132b] border border-[#20b2aa] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <h2 className="text-lg font-bold text-[#fbbf24]">ClinicaAI Clinical Movement Assessment Report</h2>
                <div className="text-xs text-slate-400">
                  Patient: <strong className="text-white">{patientName}</strong> | Date: {new Date().toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Report Content */}
            <div className="space-y-3 text-xs text-slate-200">
              <div className="bg-[#070e22] p-3 rounded border border-slate-800">
                <h4 className="text-xs font-bold text-[#20b2aa] uppercase mb-1">1. Movement Identification</h4>
                <p><strong>Movement Evaluated:</strong> {formData.movementName.val} ({formData.category})</p>
                <p><strong>Camera Plane & View:</strong> {formData.cameraView}</p>
                <p><strong>Measured Primary Joint Angle:</strong> {measuredAngle}° (Contralateral: {contralateralAngle}°)</p>
                <p><strong>Bilateral Symmetry:</strong> {symmetryPercent}%</p>
              </div>

              <div className="bg-[#070e22] p-3 rounded border border-slate-800">
                <h4 className="text-xs font-bold text-[#fbbf24] uppercase mb-1">2. Biomechanical Findings</h4>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li><strong>Trunk:</strong> {formData.trunkAlignment.val}</li>
                  <li><strong>Pelvis:</strong> {formData.pelvicMovement.val}</li>
                  <li><strong>Hip:</strong> {formData.hipMechanics.val}</li>
                  <li><strong>Knee:</strong> {formData.kneeMechanics.val}</li>
                  <li><strong>Ankle & Foot:</strong> {formData.ankleMechanics.val} | {formData.footPosture.val}</li>
                </ul>
              </div>

              <div className="bg-[#070e22] p-3 rounded border border-slate-800">
                <h4 className="text-xs font-bold text-red-400 uppercase mb-1">3. Movement Abnormalities Detected</h4>
                {formData.abnormalities.map((ab) => (
                  <p key={ab.id} className="mt-1">
                    <strong>• {ab.name} ({ab.severity}):</strong> {ab.observedEvidence}
                  </p>
                ))}
              </div>

              <div className="bg-[#070e22] p-3 rounded border border-slate-800">
                <h4 className="text-xs font-bold text-teal-300 uppercase mb-1">4. Evidence-Based Rehabilitation Plan</h4>
                <p><strong>Mobility:</strong> {formData.mobility.val.join(', ')}</p>
                <p className="mt-1"><strong>Strengthening:</strong> {formData.strengthening.val.join(', ')}</p>
                <p className="mt-1"><strong>Neuromuscular:</strong> {formData.neuromuscular.val.join(', ')}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-700 pt-3">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-[#20b2aa] text-[#0b132b] font-bold text-xs rounded cursor-pointer"
              >
                🖨 Print / Export PDF
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-3 py-1.5 bg-[#132247] text-slate-200 text-xs rounded border border-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Patient Records History Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0b132b] border border-[#20b2aa] w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-lg p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h3 className="text-sm font-bold text-[#fbbf24]">Patient Assessment History & Follow-Up</h3>
              <button
                onClick={() => setShowSavedModal(false)}
                className="text-slate-400 hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {savedRecords.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">
                No saved assessment records yet. Click "Save Assessment" on any evaluated movement.
              </p>
            ) : (
              <div className="space-y-2">
                {savedRecords.map((rec) => (
                  <div key={rec.id} className="bg-[#070e22] p-3 rounded border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-white">{rec.patientName} - {rec.movementName}</strong>
                      <span className="text-[10px] text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-700 font-sans">
                        {rec.date}
                      </span>
                    </div>
                    <p className="text-slate-300">
                      Primary Angle: <strong>{rec.biomechanics.measuredPrimaryAngleDeg.value}°</strong> | Symmetry: <strong>{rec.identification.leftRightSymmetryPercent.value}%</strong>
                    </p>
                    <p className="text-slate-400 text-[11px] italic">
                      {rec.clinicianNotes}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
