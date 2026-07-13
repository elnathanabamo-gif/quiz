import { QuizConfig } from '@/components/QuizConfiguration';
import { ExtractedContent } from './contentExtractor';

export interface Question {
  id: number;
  question: string;
  type: 'true-false' | 'multiple-choice' | 'fill-blank' | 'descriptive';
  options?: string[];
  correctAnswer: string;
}

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.origin) || '';
const API_KEY_STORAGE = 'quiz-wizard-openai-key';

class AIQuestionGenerator {
  private userApiKey: string | null = null;

  constructor() {
    this.userApiKey = sessionStorage.getItem(API_KEY_STORAGE);
  }

  setApiKey(key: string) {
    const trimmed = key.trim();
    this.userApiKey = trimmed || null;
    if (trimmed) {
      sessionStorage.setItem(API_KEY_STORAGE, trimmed);
    } else {
      sessionStorage.removeItem(API_KEY_STORAGE);
    }
  }

  getApiKey(): string | null {
    return this.userApiKey;
  }

  async checkAIStatus(): Promise<{ configured: boolean; reachable: boolean; model?: string }> {
    try {
      const response = await fetch(`${API_BASE}/api/ai-status`);
      if (!response.ok) return { configured: false, reachable: false };
      const data = await response.json();
      return {
        configured: Boolean(data.configured),
        reachable: true,
        model: data.model,
      };
    } catch {
      return { configured: false, reachable: false };
    }
  }

  isAIAvailable(serverConfigured: boolean): boolean {
    return serverConfigured || Boolean(this.userApiKey);
  }

  async generateQuestions(content: ExtractedContent, config: QuizConfig): Promise<Question[]> {
    try {
      return await this.generateViaAPI(content, config);
    } catch (error) {
      console.error('AI generation failed, falling back to local generation:', error);
      return this.generateLocalQuestions(content, config);
    }
  }

  private async generateViaAPI(content: ExtractedContent, config: QuizConfig): Promise<Question[]> {
    const response = await fetch(`${API_BASE}/api/generate-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.text,
        config,
        apiKey: this.userApiKey || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API error (${response.status})`);
    }

    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error('No questions returned from AI');
    }

    return data.questions.map((q: Question, index: number) => {
      let normalizedAnswer = q.correctAnswer;
      
      // Normalize multiple-choice answer mapping if AI returned the option text instead of 'A', 'B', 'C', or 'D'
      if (q.type === 'multiple-choice' && q.options && q.options.length > 0) {
        const cleanAnswer = q.correctAnswer.trim().toLowerCase();
        
        if (/^[a-d]$/i.test(cleanAnswer)) {
          normalizedAnswer = cleanAnswer.toUpperCase();
        } else {
          // Find option index that matches the text
          const matchingIndex = q.options.findIndex(
            (opt) => opt.trim().toLowerCase() === cleanAnswer
          );
          if (matchingIndex !== -1) {
            normalizedAnswer = String.fromCharCode(65 + matchingIndex);
          } else {
            // Fallback: check if the answer is inside an option string or vice-versa
            const partialIndex = q.options.findIndex(
              (opt) => opt.trim().toLowerCase().includes(cleanAnswer) || cleanAnswer.includes(opt.trim().toLowerCase())
            );
            if (partialIndex !== -1) {
              normalizedAnswer = String.fromCharCode(65 + partialIndex);
            }
          }
        }
      } else if (q.type === 'true-false') {
        const cleanAnswer = q.correctAnswer.trim().toLowerCase();
        if (cleanAnswer === 'true' || cleanAnswer === 't' || cleanAnswer === '1' || cleanAnswer === 'yes') {
          normalizedAnswer = 'true';
        } else if (cleanAnswer === 'false' || cleanAnswer === 'f' || cleanAnswer === '0' || cleanAnswer === 'no') {
          normalizedAnswer = 'false';
        }
      }

      return {
        ...q,
        id: index + 1,
        correctAnswer: normalizedAnswer,
      };
    });
  }

  private generateLocalQuestions(content: ExtractedContent, config: QuizConfig): Question[] {
    const text = content.text;

    if (!text || text.trim().length < 50) {
      throw new Error('Document content is too short to generate meaningful questions');
    }

    const sentences = this.extractKeySentences(text);
    const concepts = this.extractKeyConcepts(text);
    const facts = this.extractFacts(text);
    const questions: Question[] = [];

    for (let i = 1; i <= config.questionCount; i++) {
      switch (config.type) {
        case 'true-false':
          questions.push(this.generateTrueFalseQuestion(i, sentences, facts, config.difficulty));
          break;
        case 'multiple-choice':
          questions.push(this.generateMultipleChoiceQuestion(i, sentences, concepts, config.difficulty));
          break;
        case 'fill-blank':
          questions.push(this.generateFillBlankQuestion(i, sentences, concepts, config.difficulty));
          break;
        case 'descriptive':
          questions.push(this.generateDescriptiveQuestion(i, concepts, config.difficulty));
          break;
      }
    }

    return questions;
  }

  private extractKeySentences(text: string): string[] {
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15 && s.length < 300)
      .slice(0, 100);

    return sentences.length > 0 ? sentences : ['The document contains important information.'];
  }

  private extractKeyConcepts(text: string): string[] {
    const words = text.split(/\s+/);
    const conceptMap = new Map<string, number>();

    words.forEach((word) => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 3 && !this.isCommonWord(cleaned.toLowerCase())) {
        const key = cleaned.toLowerCase();
        conceptMap.set(key, (conceptMap.get(key) || 0) + 1);
      }
      if (word.match(/^[A-Z][a-z]+/) && !this.isCommonWord(word.toLowerCase())) {
        const key = word.toLowerCase();
        conceptMap.set(key, (conceptMap.get(key) || 0) + 2);
      }
    });

    const concepts = Array.from(conceptMap.entries())
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word]) => word);

    return concepts.length > 0 ? concepts : ['concept', 'information', 'data'];
  }

  private extractFacts(text: string): string[] {
    const factPatterns = [
      /[A-Z][^.!?]*\b(is|are|was|were|has|have|will|would|can|could)\b[^.!?]*[.!?]/g,
      /[A-Z][^.!?]*\b(contains|includes|consists|comprises|involves|requires|means|refers)\b[^.!?]*[.!?]/g,
    ];

    const facts: string[] = [];
    factPatterns.forEach((pattern) => {
      facts.push(...(text.match(pattern) || []).map((m) => m.trim()));
    });

    return facts.slice(0, 50);
  }

  private generateTrueFalseQuestion(
    id: number,
    sentences: string[],
    facts: string[],
    difficulty: string
  ): Question {
    const sourcePool = facts.length > 0 ? facts : sentences;
    const statement = sourcePool[id % sourcePool.length];
    const isTrue = id % 2 === 0;

    let question = isTrue
      ? statement.replace(/[.!?]+$/, '')
      : statement.replace(/\b(is|are|was|were)\b/i, 'is not');

    if (difficulty === 'hard') {
      question = `According to the document, ${question.toLowerCase()}`;
    }

    return { id, question, type: 'true-false', correctAnswer: isTrue ? 'true' : 'false' };
  }

  private generateMultipleChoiceQuestion(
    id: number,
    sentences: string[],
    concepts: string[],
    difficulty: string
  ): Question {
    const concept = concepts[id % concepts.length];
    const relatedSentence = sentences.find((s) => s.toLowerCase().includes(concept)) || sentences[id % sentences.length];

    const rawOptions = [
      relatedSentence.slice(0, 80) || `It is discussed as an important topic`,
      `It is not mentioned in the text`,
      `It is explicitly refuted by the author`,
      `It is only briefly mentioned as a side note`,
    ];

    // Shuffle options so 'A' is not always correct
    const optionsWithIndex = rawOptions.map((opt, idx) => ({ opt, originalIdx: idx }));
    // Simple deterministic shuffle using ID so the correct answer is stable
    const offset = id % 4;
    const shuffled = [...optionsWithIndex];
    for (let i = 0; i < offset; i++) {
      const first = shuffled.shift();
      if (first) shuffled.push(first);
    }

    const options = shuffled.map(o => o.opt);
    const correctIdx = shuffled.findIndex(o => o.originalIdx === 0);
    const correctAnswer = String.fromCharCode(65 + correctIdx);

    return {
      id,
      question:
        difficulty === 'easy'
          ? `According to the document, what is mentioned about ${concept}?`
          : `Based on the document, which statement about "${concept}" is most accurate?`,
      type: 'multiple-choice',
      options,
      correctAnswer,
    };
  }

  private generateFillBlankQuestion(
    id: number,
    sentences: string[],
    concepts: string[],
    _difficulty: string
  ): Question {
    const sentence = sentences[id % sentences.length];
    const words = sentence.split(' ');

    if (words.length > 5) {
      const blankIndex = Math.min(Math.floor(words.length / 2), words.length - 2);
      const originalWord = words[blankIndex];
      words[blankIndex] = '_____';
      return {
        id,
        question: `Fill in the blank: ${words.join(' ')}`,
        type: 'fill-blank',
        correctAnswer: originalWord.replace(/[^\w]/g, '').toLowerCase(),
      };
    }

    const concept = concepts[id % concepts.length];
    return {
      id,
      question: `Complete the statement: The document discusses _____ as an important element.`,
      type: 'fill-blank',
      correctAnswer: concept,
    };
  }

  private generateDescriptiveQuestion(id: number, concepts: string[], difficulty: string): Question {
    const concept = concepts[id % concepts.length];
    const questionsPool = [
      `Analyze the significance of "${concept}" as presented in the document.`,
      `Explain the main points or features related to "${concept}" according to the text.`,
      `Describe how "${concept}" contributes to the main arguments or findings in the document.`,
      `Discuss the context and implications of "${concept}" based on the text.`
    ];
    const question = difficulty === 'hard'
      ? `Provide an in-depth analysis of "${concept}" and its implications as discussed in the document.`
      : questionsPool[id % questionsPool.length];

    return {
      id,
      question,
      type: 'descriptive',
      correctAnswer: `Based on the document, "${concept}" is a significant subject. An adequate response should explain its definition, outline the related facts, and evaluate its context within the text.`,
    };
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out',
      'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who',
      'this', 'that', 'with', 'have', 'will', 'been', 'from', 'they', 'know', 'want', 'good', 'much', 'some',
      'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take',
      'than', 'them', 'well', 'were',
    ]);
    return commonWords.has(word.toLowerCase());
  }
}

export const aiQuestionGenerator = new AIQuestionGenerator();
