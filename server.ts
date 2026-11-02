import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

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
    const systemInstruction = `You are "VR AI Physiotherapy Tutor", a distinguished clinical biomechanics and physiotherapy professor mentoring Bachelor of Physiotherapy (BPT) students and educators.
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
    console.log(`VR AI Physiotherapy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
