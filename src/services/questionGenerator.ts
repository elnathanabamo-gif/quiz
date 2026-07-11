import { QuizConfig } from '@/components/QuizConfiguration';
import { ExtractedContent } from './contentExtractor';

export interface Question {
  id: number;
  question: string;
  type: 'true-false' | 'multiple-choice' | 'fill-blank' | 'descriptive';
  options?: string[];
  correctAnswer: string;
}

class QuestionGenerator {
  generateQuestions(content: ExtractedContent, config: QuizConfig): Question[] {
    const questions: Question[] = [];
    const text = content.text;
    
    // Extract key sentences and concepts from the content
    const sentences = this.extractKeySentences(text);
    const concepts = this.extractKeyConcepts(text);
    
    for (let i = 1; i <= config.questionCount; i++) {
      let question: Question;
      
      switch (config.type) {
        case 'true-false':
          question = this.generateTrueFalseQuestion(i, sentences, concepts);
          break;
        case 'multiple-choice':
          question = this.generateMultipleChoiceQuestion(i, sentences, concepts);
          break;
        case 'fill-blank':
          question = this.generateFillBlankQuestion(i, sentences, concepts);
          break;
        case 'descriptive':
          question = this.generateDescriptiveQuestion(i, concepts);
          break;
        default:
          throw new Error(`Unsupported question type: ${config.type}`);
      }
      
      questions.push(question);
    }
    
    return questions;
  }

  private extractKeySentences(text: string): string[] {
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200)
      .slice(0, 50); // Limit to first 50 meaningful sentences
    
    return sentences.length > 0 ? sentences : ['The document contains important information.'];
  }

  private extractKeyConcepts(text: string): string[] {
    // Extract potential key terms (capitalized words, repeated terms, etc.)
    const words = text.split(/\s+/);
    const conceptMap = new Map<string, number>();
    
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '').toLowerCase();
      if (cleaned.length > 3 && !this.isCommonWord(cleaned)) {
        conceptMap.set(cleaned, (conceptMap.get(cleaned) || 0) + 1);
      }
    });
    
    // Get most frequent terms
    const concepts = Array.from(conceptMap.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, _]) => word);
    
    return concepts.length > 0 ? concepts : ['concept', 'information', 'data'];
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'she', 'use', 'her', 'now', 'man', 'say', 'why', 'ask', 'men', 'run', 'own', 'put', 'say', 'she', 'too', 'use'
    ];
    return commonWords.includes(word);
  }

  private generateTrueFalseQuestion(id: number, sentences: string[], concepts: string[]): Question {
    const sentence = sentences[id % sentences.length];
    const concept = concepts[id % concepts.length];
    
    // Create variations of true/false questions
    const variations = [
      `According to the document, ${sentence.toLowerCase()}`,
      `The document states that ${concept} is mentioned.`,
      `Based on the content, ${sentence.toLowerCase().substring(0, 50)}...`
    ];
    
    return {
      id,
      question: variations[id % variations.length],
      type: 'true-false',
      correctAnswer: Math.random() > 0.5 ? 'true' : 'false'
    };
  }

  private generateMultipleChoiceQuestion(id: number, sentences: string[], concepts: string[]): Question {
    const concept = concepts[id % concepts.length];
    const sentence = sentences[id % sentences.length];
    
    const questions = [
      `What is the main focus regarding ${concept} in the document?`,
      `According to the document, which statement about ${concept} is correct?`,
      `Based on the content, what can be said about ${concept}?`
    ];
    
    const options = [
      `It is a key concept discussed in detail`,
      `It is mentioned briefly`,
      `It is not relevant to the topic`,
      `It requires further explanation`
    ];
    
    return {
      id,
      question: questions[id % questions.length],
      type: 'multiple-choice',
      options,
      correctAnswer: 'A'
    };
  }

  private generateFillBlankQuestion(id: number, sentences: string[], concepts: string[]): Question {
    const concept = concepts[id % concepts.length];
    const sentence = sentences[id % sentences.length];
    
    // Try to create a fill-in-the-blank from the sentence
    const words = sentence.split(' ');
    if (words.length > 5) {
      const blankIndex = Math.floor(words.length / 2);
      const originalWord = words[blankIndex];
      words[blankIndex] = '_____';
      
      return {
        id,
        question: `Fill in the blank: ${words.join(' ')}`,
        type: 'fill-blank',
        correctAnswer: originalWord.replace(/[^\w]/g, '').toLowerCase()
      };
    }
    
    return {
      id,
      question: `The key term _____ is important in this document.`,
      type: 'fill-blank',
      correctAnswer: concept
    };
  }

  private generateDescriptiveQuestion(id: number, concepts: string[]): Question {
    const concept = concepts[id % concepts.length];
    
    const questions = [
      `Explain the significance of ${concept} based on the document.`,
      `Describe the main points related to ${concept} mentioned in the content.`,
      `Analyze how ${concept} is presented in the document.`,
      `Discuss the role of ${concept} according to the text.`
    ];
    
    return {
      id,
      question: questions[id % questions.length],
      type: 'descriptive',
      correctAnswer: `Based on the document, ${concept} is an important element that requires detailed explanation and analysis.`
    };
  }
}

export const questionGenerator = new QuestionGenerator();