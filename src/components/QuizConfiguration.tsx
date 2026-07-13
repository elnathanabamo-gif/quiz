import React, { useState } from 'react';
import { CheckCircle, CircleDot, PenTool, MessageSquare, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface QuizConfig {
  type: 'true-false' | 'multiple-choice' | 'fill-blank' | 'descriptive';
  questionCount: number;
  difficulty: 'easy' | 'normal' | 'hard';
}

const typeColors: Record<QuizConfig['type'], { bg: string; text: string }> = {
  'true-false': { bg: 'bg-quiz-true-false/10', text: 'text-quiz-true-false' },
  'multiple-choice': { bg: 'bg-quiz-multiple-choice/10', text: 'text-quiz-multiple-choice' },
  'fill-blank': { bg: 'bg-quiz-fill-blank/10', text: 'text-quiz-fill-blank' },
  'descriptive': { bg: 'bg-quiz-descriptive/10', text: 'text-quiz-descriptive' },
};

const QuizConfiguration: React.FC<QuizConfigurationProps> = ({ 
  onConfigurationComplete, 
  fileName 
}) => {
  const [selectedType, setSelectedType] = useState<QuizConfig['type']>('multiple-choice');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<QuizConfig['difficulty']>('normal');

  const quizTypes = [
    {
      id: 'true-false' as const,
      title: 'True or False',
      description: 'Simple true/false statements',
      icon: CheckCircle,
      color: 'quiz-true-false',
      example: 'The Earth revolves around the Sun. (True/False)'
    },
    {
      id: 'multiple-choice' as const,
      title: 'Multiple Choice',
      description: '4 options to choose from',
      icon: CircleDot,
      color: 'quiz-multiple-choice',
      example: 'What is the capital of France? A) London B) Berlin C) Paris D) Madrid'
    },
    {
      id: 'fill-blank' as const,
      title: 'Fill in the Blank',
      description: 'Complete the missing words',
      icon: PenTool,
      color: 'quiz-fill-blank',
      example: 'The _____ is the largest planet in our solar system.'
    },
    {
      id: 'descriptive' as const,
      title: 'Descriptive',
      description: 'Short answer questions',
      icon: MessageSquare,
      color: 'quiz-descriptive',
      example: 'Explain the process of photosynthesis in plants.'
    }
  ];

  const difficulties = [
    { id: 'easy' as const, label: 'Easy', description: 'Basic concepts and definitions' },
    { id: 'normal' as const, label: 'Normal', description: 'Moderate understanding required' },
    { id: 'hard' as const, label: 'Hard', description: 'Advanced analysis and application' }
  ];

  const handleGenerate = () => {
    onConfigurationComplete({
      type: selectedType,
      questionCount,
      difficulty
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* File Info */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium">Document uploaded:</span>
            <span className="text-muted-foreground">{fileName}</span>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>1. Select Quiz Format</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className={cn(
                    "cursor-pointer transition-all duration-300 hover:scale-105",
                    selectedType === type.id
                      ? "ring-2 ring-primary border-primary bg-primary/5"
                      : "hover:border-primary/20 hover:shadow-md"
                  )}
                  onClick={() => setSelectedType(type.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={cn(
                        "p-3 rounded-lg",
                        typeColors[type.id].bg,
                        typeColors[type.id].text
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold">{type.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                        <div className="text-xs text-muted-foreground italic">
                          Example: {type.example}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Question Count */}
      <Card>
        <CardHeader>
          <CardTitle>2. Number of Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Questions: {questionCount}</span>
            <Badge variant="secondary">{questionCount} questions</Badge>
          </div>
          <Slider
            value={[questionCount]}
            onValueChange={(value) => setQuestionCount(value[0])}
            max={50}
            min={5}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 questions</span>
            <span>50 questions</span>
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Selection */}
      <Card>
        <CardHeader>
          <CardTitle>3. Difficulty Level</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={difficulty} onValueChange={(value) => setDifficulty(value as QuizConfig['difficulty'])}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {difficulties.map((diff) => (
                <div key={diff.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={diff.id} id={diff.id} />
                  <Label 
                    htmlFor={diff.id} 
                    className="flex-1 cursor-pointer p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{diff.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {diff.description}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button 
          size="xl" 
          onClick={handleGenerate}
          className="group"
        >
          Generate Quiz
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default QuizConfiguration;