import React, { useEffect, useRef, useState } from 'react';
import { Brain, Sparkles, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { QuizConfig } from './QuizConfiguration';
import { Question } from '@/services/aiQuestionGenerator';

interface QuizGenerationProps {
  config: QuizConfig;
  fileName: string;
  onGenerate: (onProgress: (step: number, progress: number) => void) => Promise<Question[]>;
  onComplete: (questions: Question[]) => void;
  onBack: () => void;
}

const STEPS = [
  { icon: FileText, label: 'Analyzing document content' },
  { icon: Brain, label: 'Extracting key concepts' },
  { icon: Sparkles, label: 'Generating questions with AI' },
  { icon: CheckCircle2, label: 'Finalizing quiz structure' },
];

const QuizGeneration: React.FC<QuizGenerationProps> = ({
  config,
  fileName,
  onGenerate,
  onComplete,
  onBack,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const run = async () => {
      try {
        const questions = await onGenerate((step, pct) => {
          setCurrentStep(step);
          setProgress(pct);
        });
        setCurrentStep(STEPS.length - 1);
        setProgress(100);
        setTimeout(() => onComplete(questions), 400);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate quiz');
      }
    };

    run();
  }, [onGenerate, onComplete]);

  const getQuizTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'true-false': 'True or False',
      'multiple-choice': 'Multiple Choice',
      'fill-blank': 'Fill in the Blank',
      descriptive: 'Descriptive',
    };
    return typeMap[type] || type;
  };

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Generation Failed</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={onBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="p-4 bg-gradient-primary rounded-full">
                  <Brain className="w-8 h-8 text-white animate-pulse-soft" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">Generating Your Quiz</h2>
              <p className="text-muted-foreground">
                AI is creating {config.questionCount} {getQuizTypeDisplay(config.type).toLowerCase()} questions
              </p>
            </div>

            <div className="bg-accent/50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Document:</span>
                  <p className="text-muted-foreground truncate">{fileName}</p>
                </div>
                <div>
                  <span className="font-medium">Type:</span>
                  <p className="text-muted-foreground">{getQuizTypeDisplay(config.type)}</p>
                </div>
                <div>
                  <span className="font-medium">Questions:</span>
                  <p className="text-muted-foreground">{config.questionCount}</p>
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span>
                  <p className="text-muted-foreground capitalize">{config.difficulty}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Progress value={progress} className="w-full h-3" />
              <div className="text-sm font-medium">{Math.round(progress)}% Complete</div>
            </div>

            <div className="space-y-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-primary/10 border border-primary/20'
                        : isCompleted
                          ? 'bg-green-50 text-green-700'
                          : 'text-muted-foreground'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? 'text-primary animate-pulse' : isCompleted ? 'text-green-600' : ''
                      }`}
                    />
                    <span className="text-sm font-medium">{step.label}</span>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizGeneration;
