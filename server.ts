import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { solveRelocationMip } from './src/agents/relocationPlanningAgent.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

// 1. Relocation Optimization Endpoint (CP-SAT / MILP Solver)
app.post(['/optimize', '/api/optimize'], (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.habitations || !payload.sites) {
      return res.status(400).json({ error: 'Invalid payload: habitations and sites required' });
    }
    const solution = solveRelocationMip(payload);
    return res.json(solution);
  } catch (err: any) {
    console.error('Optimization error:', err);
    return res.status(500).json({ error: err.message || 'Solver execution failed' });
  }
});

// 2. AI Explanation Endpoint
app.post('/api/ai/explanation', async (req, res) => {
  try {
    const { prompt, payload } = req.body;
    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${prompt}\n\nSTRICT INSTRUCTION: Only use numbers from the JSON payload below. Do not add any new numbers.\n${JSON.stringify(payload)}`
      });
      return res.json({ text: response.text });
    }
    return res.json({ text: null, note: 'Gemini API key not configured on server; using grounded fallback' });
  } catch (err: any) {
    console.warn('AI explanation error:', err?.message);
    return res.json({ text: null, error: err.message });
  }
});

// 3. AI Intelligence Ingestion Endpoint
app.post('/api/ai/ingest', async (req, res) => {
  try {
    const { text } = req.body;
    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Extract disaster report fields in JSON format:
Text: "${text}"
Output ONLY a JSON object with keys:
"location": string,
"hazardType": "Flood" | "Landslide" | "Cyclone" | "Cloudburst",
"severity": "LOW" | "MODERATE" | "HIGH" | "EXTREME",
"confidence": number between 0 and 1`
      });
      const cleanJson = response.text ? response.text.replace(/```json|```/g, '').trim() : '{}';
      return res.json(JSON.parse(cleanJson));
    }
    return res.json({});
  } catch (err: any) {
    return res.json({});
  }
});

// 4. AI Query Agent Endpoint
app.post('/api/ai/query', async (req, res) => {
  try {
    const { question, toolResults } = req.body;
    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are a Disaster Query Assistant. Answer this question: "${question}"
STRICT RULES:
1. Base your answer SOLELY on the verified tool results: ${JSON.stringify(toolResults)}
2. DO NOT mention any village or habitation name unless it appears in toolResults.habitations.`
      });
      return res.json({ answer: response.text });
    }
    return res.json({ answer: null });
  } catch (err: any) {
    return res.json({ answer: null });
  }
});

// Mount Vite or static server
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Disaster Multi-Agent DSS Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
