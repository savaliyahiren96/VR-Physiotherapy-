import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase payload limit for base64 motion capture images/frames
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// API route for AI Tutor
app.post('/api/ai-tutor', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please configure it in AI Studio settings or .env file.'
      });
    }

    const {
      prompt,
      joint,
      movement,
      angle,
      loadKg,
      selectedMuscle,
      language = 'English',
      mode = 'qna',
      history = []
    } = req.body;

    const ai = new GoogleGenAI({ apiKey });

    // Strict safety & academic persona prompt
    const systemInstruction = `You are "ClinicaAI Virtual Physiotherapy Tutor", a distinguished clinical biomechanics and physiotherapy professor mentoring Bachelor of Physiotherapy (BPT) students and educators.
STRICT RULES:
1. Always answer in the exact language of the user's question or prompt (${language}: English, Gujarati, or Hindi).
2. KEEP ALL ANSWERS UNDER 130 WORDS. Be concise, academically rigorous, and direct.
3. CONTEXT: The user is currently studying the right ${joint || 'elbow'} joint performing ${movement || 'flexion'} at ${angle ?? 90}° with a ${loadKg ?? 2} kg external load${selectedMuscle ? `, focusing on muscle: ${selectedMuscle}` : ''}.
4. SAFETY MANDATE: You are strictly an academic learning tool. NEVER provide medical diagnosis, treatment prescriptions, or clinical advice for real human patients. If a question asks about symptoms or patient care, strictly advise consulting a licensed clinical supervisor or medical specialist.
5. In 'viva' mode, ask a challenging BPT viva question, or evaluate student answers with constructive academic grading (Marks /10), correct anatomical facts, and brief explanation.`;

    const fullPrompt = `${mode === 'viva' ? '[VIVA EXAMINATION MODE]' : '[STUDENT QUERY]'}
Language requested: ${language}
Joint: ${joint}
Movement: ${movement}
Angle: ${angle}°
Limb Load: ${loadKg} kg
Selected Muscle: ${selectedMuscle || 'None'}

Student Prompt / Viva Question:
${prompt || 'Ask me a classic BPT viva question on this joint and movement.'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.6,
        maxOutputTokens: 300,
      }
    });

    const reply = response.text || 'Unable to generate response. Please try again.';
    res.json({ reply });
  } catch (error: any) {
    console.error('AI Tutor error:', error);
    res.status(500).json({
      error: error?.message || 'Internal server error while contacting AI Tutor.'
    });
  }
});

// Comprehensive AI Vision Motion & Marker Analysis Endpoint
app.post('/api/analyze-motion', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please configure it in AI Studio settings or .env file.'
      });
    }

    const { imageBase64, mimeType = 'image/jpeg', expectedJoint, expectedMovement } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const ai = new GoogleGenAI({ apiKey });

    const promptText = `You are ClinicaAI's expert Computer Vision & Clinical Biomechanics Engine for Physiotherapy Movement Assessment.
Analyze this video frame/photo of a human performing a clinical or functional movement.

Tasks:
1. RECOGNIZE THE MOVEMENT:
   - Identify movement from: Walking, Running, Squatting, Single-Leg Squat, Sit-to-Stand, Step-Up/Down, Single-Leg Stance, Jump-Landing, Functional Balance, Stair Climbing, Hip Mobility, Knee Flexion/Extension, Ankle Dorsiflexion/Plantarflexion, Shoulder Flexion, Shoulder Extension, Shoulder Abduction, Shoulder Rotation, Elbow Flexion/Extension, Reaching, or Postural Assessment (Anterior/Posterior/Lateral).
   - If user specified [expectedJoint: "${expectedJoint || ''}", expectedMovement: "${expectedMovement || ''}"], give consideration to that clinical context.
2. 2D SKELETON TRACKING (0-100% normalized coordinates):
   - Provide [x, y] coordinates for:
     nose, leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist,
     leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle, leftFoot, rightFoot.
   - Provide 3 primary goniometer markers:
     Marker A (Proximal Landmark, e.g., Acromion, Greater Trochanter, or Femur)
     Marker B (Joint Fulcrum / Axis, e.g., Lateral Epicondyle, Knee Axis, or Lateral Malleolus)
     Marker C (Distal Landmark, e.g., Radial Styloid, Distal Fibula, or 5th Metatarsal)
3. MEASURED KINEMATICS & SYMMETRY:
   - Measured primary joint angle in degrees (0-180)
   - Contralateral limb joint angle (for symmetry comparison)
   - Left-Right symmetry percentage (0-100%)
   - Detected movement phase (e.g., "Initial Setup", "Eccentric Descent", "Midstance", "Concentric Ascent", "Terminal Range")
   - Estimated repetition count in view
4. MOVEMENT ABNORMALITY DETECTION:
   - Detect any visible abnormalities: Dynamic Knee Valgus, Dynamic Knee Varus, Excessive Trunk Lean, Pelvic Drop (Trendelenburg sign), Reduced Range of Motion, Foot Pronation/Supination, Asymmetrical Weight-Bearing.
   - For each detected abnormality, provide severity ("Mild", "Moderate", or "Severe"), evidence, and affected segment.
5. CLINICAL PREFILL & REHABILITATION:
   - Generate specific entries to automatically prefill the clinical assessment form:
     Trunk alignment, pelvic movement, hip mechanics, knee mechanics, ankle mechanics, foot posture, segmental coordination, dynamic stability.
   - Functional limitations & contributing factors.
   - Recommended physical examination tests (e.g. Trendelenburg test, Ober test, Thomas test, Weight-bearing lunge, Navicular drop).
   - Estimated Daniels & Worthingham MMT grade (0 to 5).
   - Evidence-based Rehabilitation Protocols: Mobility exercises, Strengthening exercises, Neuromuscular drills, Balance/Proprioceptive training, and Functional retraining.

RESPOND WITH ONLY A RAW, VALID JSON OBJECT (no markdown, no backticks):
{
  "movementIdentification": {
    "movementName": "Bilateral Squat",
    "category": "Lower Limb",
    "confidence": 0.94,
    "cameraView": "Anterior",
    "repetitionCount": 1,
    "durationSeconds": 3.2,
    "cadenceOrSpeed": "Controlled cadence (~2s eccentric, 1s concentric)",
    "activePhases": "Eccentric Descent to 90° Knee Flexion",
    "leftRightSymmetryPercent": 92
  },
  "markers": [
    {"name": "Marker A (Proximal)", "label": "Right Hip (ASIS)", "x": 45.0, "y": 32.0},
    {"name": "Marker B (Fulcrum)", "label": "Right Knee Joint Axis", "x": 43.0, "y": 60.0},
    {"name": "Marker C (Distal)", "label": "Right Lateral Malleolus", "x": 42.0, "y": 88.0}
  ],
  "skeleton": {
    "nose": [50.0, 12.0],
    "leftShoulder": [56.0, 22.0],
    "rightShoulder": [44.0, 22.0],
    "leftElbow": [60.0, 34.0],
    "rightElbow": [40.0, 34.0],
    "leftWrist": [58.0, 44.0],
    "rightWrist": [42.0, 44.0],
    "leftHip": [54.0, 48.0],
    "rightHip": [46.0, 48.0],
    "leftKnee": [56.0, 68.0],
    "rightKnee": [44.0, 68.0],
    "leftAnkle": [56.0, 88.0],
    "rightAnkle": [44.0, 88.0],
    "leftFoot": [58.0, 92.0],
    "rightFoot": [42.0, 92.0]
  },
  "biomechanicalAssessment": {
    "measuredPrimaryAngleDeg": 90,
    "contralateralAngleDeg": 88,
    "trunkAlignment": "Upright spine maintained; slight forward lean within physiological limits",
    "pelvicMovement": "Level pelvis in frontal plane; no Trendelenburg pelvic tilt observed",
    "hipMechanics": "Symmetrical bilateral hip flexion to ~95° with good femoral control",
    "kneeMechanics": "Mild dynamic knee valgus on right limb during descent; left knee tracks well over 2nd toe",
    "ankleMechanics": "Adequate ankle dorsiflexion (~15°); heels remain grounded on plinth",
    "footPosture": "Slight bilateral pronation at bottom turnaround; arch reconstitutes on ascent",
    "segmentalCoordination": "Smooth knee-hip coupling throughout eccentric phase",
    "weightBearingSymmetry": "Slight 52%/48% right/left weight distribution bias",
    "dynamicStability": "Good base of support and center-of-mass control"
  },
  "clinicalFindings": {
    "observedAbnormalities": [
      {
        "id": "ab_1",
        "name": "Mild Dynamic Knee Valgus",
        "severity": "Mild",
        "confidence": 0.88,
        "observedEvidence": "Medial translation of right patella relative to foot long axis at 70°-90° flexion",
        "contributingFactors": ["Gluteus medius fatigue / under-recruitment", "Slight ankle pronation"],
        "affectedSegment": "Knee"
      }
    ],
    "functionalLimitations": "Mild difficulty maintaining knee frontal plane stability under progressive fatigue",
    "possibleContributingFactors": "Hip abductor endurance deficit and tight gastrocnemius",
    "compensatoryStrategies": "Right knee medial shift to bring load closer to body center line",
    "recommendedPhysicalTests": ["Single-Leg Squat Test", "Trendelenburg Test", "Weight-Bearing Lunge Test (WBLT)", "Ober Test"],
    "estimatedMmtGrade": 4
  },
  "rehabilitationRecommendations": {
    "mobilityExercises": ["Gastrocnemius-Soleus Wall Stretch (3x30s)", "Hip Adductor Foam Rolling (2 mins)"],
    "strengtheningExercises": ["Banded Goblet Squats with Miniband (3x10)", "Side-Lying Clamshells with Resistance (3x15)", "Single-Leg Romanian Deadlift (3x10)"],
    "neuromuscularTraining": ["Visual Mirror Biofeedback Squats with Laser Pointer", "Tempo Eccentric Squats (4s descent)"],
    "balanceProprioception": ["Single-Leg Stance on Foam Pad (3x30s)", "Y-Balance Reach Drills"],
    "gaitOrFunctionalRetraining": ["Sit-to-Stand Speed Drills", "Step-Down Control Training"],
    "patientEducation": "Focus on driving knees outwards over 2nd toes during descent. Avoid inward knee collapse."
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```json\n?|```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    res.json({ analysis: parsedData });
  } catch (error: any) {
    console.error('Motion analysis error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to analyze motion image with AI.'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClinicaAI | VR AI Physiotherapy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
