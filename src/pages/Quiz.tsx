import React, { useState } from 'react';
import { ArrowLeft, Download, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuizConfig } from '@/components/QuizConfiguration';

interface QuizProps {
  config: QuizConfig;
  fileName: string;
  questions: any[];
  onBack: () => void;
  onStartQuiz: () => void;
  onDownloadPDF: () => void;
}

// This component now receives pre-generated questions as props
// Questions are generated in the parent component using real content extraction

const Quiz: React.FC<QuizProps> = ({ 
  config, 
  fileName, 
  questions,
  onBack, 
  onStartQuiz, 
  onDownloadPDF 
}) => {
  
  const getQuizTypeDisplay = (type: string) => {
    const typeMap = {
      'true-false': 'True or False',
      'multiple-choice': 'Multiple Choice',
      'fill-blank': 'Fill in the Blank',
      'descriptive': 'Descriptive'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'normal': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Configuration</span>
        </Button>
      </div>

      {/* Quiz Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Quiz Ready!</CardTitle>
            <Badge className={getDifficultyColor(config.difficulty)}>
              {config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Document</p>
              <p className="font-medium truncate">{fileName}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Question Type</p>
              <p className="font-medium">{getQuizTypeDisplay(config.type)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Questions</p>
              <p className="font-medium">{config.questionCount} questions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions.slice(0, 3).map((question, index) => (
              <div key={question.id} className="p-4 border rounded-lg bg-accent/20">
                <div className="flex items-start space-x-3">
                  <Badge variant="outline" className="mt-1">
                    Q{question.id}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium">{question.question}</p>
                    {question.type === 'multiple-choice' && question.options && (
                      <div className="mt-3 space-y-1">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="text-sm text-muted-foreground">
                            {String.fromCharCode(65 + optIndex)}) {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {questions.length > 3 && (
              <div className="text-center text-muted-foreground">
                + {questions.length - 3} more questions...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>How would you like to use this quiz?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-blue-100 rounded-full">
                    <Download className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Download as PDF</h3>
                  <p className="text-sm text-muted-foreground">
                    Get a printable PDF version of your quiz for offline use
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={onDownloadPDF}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-105">
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-green-100 rounded-full">
                    <Play className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Take Quiz Live</h3>
                  <p className="text-sm text-muted-foreground">
                    Answer questions interactively and get instant AI feedback
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={onStartQuiz}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Quiz;