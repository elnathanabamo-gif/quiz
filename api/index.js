import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function getApiKey(requestKey) {
  return requestKey?.trim() || process.env.OPENAI_API_KEY?.trim() || null;
}

function getDifficultyPrompt(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'Focus on basic recall and simple facts from the document.';
    case 'hard':
      return 'Create challenging questions requiring analysis and critical thinking.';
    default:
      return 'Include moderate comprehension questions about concepts and relationships.';
  }
}

function getTypePrompt(type) {
  switch (type) {
    case 'true-false':
      return 'Create true/false statements. Mix true and false answers based on the document.';
    case 'multiple-choice':
      return 'Create multiple choice questions with exactly 4 options. correctAnswer must be "A", "B", "C", or "D".';
    case 'fill-blank':
      return 'Create fill-in-the-blank questions with one missing key word or phrase from the document.';
    case 'descriptive':
      return 'Create open-ended questions requiring detailed explanations from the document.';
    default:
      return '';
  }
}

function buildPrompt(content, config) {
  const truncated =
    content.length > 15000 ? content.slice(0, 15000) + '\n\n[Content truncated for length]' : content;

  return `Generate exactly ${config.questionCount} ${config.type} quiz questions based ONLY on this document.

DOCUMENT:
${truncated}

REQUIREMENTS:
- Question type: ${config.type}
- Difficulty: ${config.difficulty} — ${getDifficultyPrompt(config.difficulty)}
- Use ONLY information from the document
- All questions must be unique
${getTypePrompt(config.type)}

Return JSON in this exact shape:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "type": "${config.type}",
      ${config.type === 'multiple-choice' ? '"options": ["Option A", "Option B", "Option C", "Option D"],' : ''}
      "correctAnswer": "answer"
    }
  ]
}

For true-false, correctAnswer is "true" or "false".
For multiple-choice, correctAnswer is "A", "B", "C", or "D".
For fill-blank and descriptive, correctAnswer is the expected answer text.`;
}

function parseQuestionsFromAI(raw) {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned);
  const questions = Array.isArray(parsed) ? parsed : parsed.questions;

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('AI returned no questions');
  }

  return questions.map((q, index) => ({
    id: index + 1,
    question: String(q.question || '').trim(),
    type: q.type,
    options: q.options,
    correctAnswer: String(q.correctAnswer ?? '').trim(),
  }));
}

app.get('/api/ai-status', (_req, res) => {
  res.json({
    configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    model: OPENAI_MODEL,
  });
});

app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { content, config, apiKey } = req.body ?? {};

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Document content is required' });
    }

    if (!config?.type || !config?.questionCount || !config?.difficulty) {
      return res.status(400).json({ error: 'Quiz configuration is required' });
    }

    const key = getApiKey(apiKey);
    if (!key) {
      return res.status(503).json({
        error: 'OpenAI API key not configured. Add OPENAI_API_KEY to .env or enter your key in the app.',
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert quiz generator. Create questions using ONLY the provided document. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: buildPrompt(content, config),
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI error:', response.status, errorBody);
      return res.status(response.status).json({
        error: `OpenAI API error (${response.status}). Check your API key and billing.`,
      });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      return res.status(502).json({ error: 'Empty response from OpenAI' });
    }

    const questions = parseQuestionsFromAI(rawContent);
    res.json({ questions });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate quiz',
    });
  }
});

// Conditionally run express app listener only if not deployed as a Serverless Function on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Quiz Wizard API running on http://localhost:${PORT}`);
    console.log(`OpenAI configured: ${Boolean(process.env.OPENAI_API_KEY?.trim())}`);
  });
}

export default app;
