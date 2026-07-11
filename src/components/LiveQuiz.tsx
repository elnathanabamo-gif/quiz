import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Question {
  id: number;
  question: string;
  type: 'true-false' | 'multiple-choice' | 'fill-blank' | 'descriptive';
  options?: string[];
  correctAnswer: string;
}

interface LiveQuizProps {
  questions: Question[];
  onComplete: (answers: Record<number, string>, score: number) => void;
  onBack: () => void;
}

const LiveQuiz: React.FC<LiveQuizProps> = ({ questions, onComplete, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{score: number; feedback: Array<{correct: boolean; explanation: string}>}>({ score: 0, feedback: [] });

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Calculate score and generate feedback
    let correct = 0;
    const feedback = questions.map(question => {
      const userAnswer = answers[question.id]?.toLowerCase().trim();
      const correctAnswer = question.correctAnswer.toLowerCase().trim();
      const isCorrect = userAnswer === correctAnswer;
      
      if (isCorrect) correct++;
      
      return {
        correct: isCorrect,
        explanation: isCorrect 
          ? "Correct! Well done." 
          : `Incorrect. The correct answer is: ${question.correctAnswer}`
      };
    });

    const score = Math.round((correct / questions.length) * 100);
    setResults({ score, feedback });
    setShowResults(true);
    onComplete(answers, score);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestionInput = () => {
    const currentAnswer = answers[currentQuestion.id] || '';

    switch (currentQuestion.type) {
      case 'true-false':
        return (
          <RadioGroup value={currentAnswer} onValueChange={handleAnswerChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="text-lg">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="text-lg">False</Label>
            </div>
          </RadioGroup>
        );

      case 'multiple-choice':
        return (
          <RadioGroup value={currentAnswer} onValueChange={handleAnswerChange}>
            {currentQuestion.options?.map((option, index) => {
              const letter = String.fromCharCode(65 + index);
              return (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={letter} id={letter} />
                  <Label htmlFor={letter} className="text-lg">
                    {letter}) {option}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        );

      case 'fill-blank':
        return (
          <Input
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="text-lg p-4"
          />
        );

      case 'descriptive':
        return (
          <Textarea
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[120px] text-lg p-4"
          />
        );

      default:
        return null;
    }
  };

  if (showResults) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-primary">{results.score}%</div>
              <div className="text-xl text-muted-foreground">
                You got {results.feedback.filter(f => f.correct).length} out of {questions.length} questions correct
              </div>
              <Badge 
                className={`text-lg px-4 py-2 ${
                  results.score >= 80 ? 'bg-green-100 text-green-800' :
                  results.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}
              >
                {results.score >= 80 ? 'Excellent!' : results.score >= 60 ? 'Good Job!' : 'Keep Practicing!'}
              </Badge>
            </div>

            {/* Time and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <Clock className="w-6 h-6 mx-auto text-muted-foreground" />
                <div className="font-medium">Time Taken</div>
                <div className="text-muted-foreground">{formatTime(timeElapsed)}</div>
              </div>
              <div className="space-y-2">
                <CheckCircle2 className="w-6 h-6 mx-auto text-green-600" />
                <div className="font-medium">Correct</div>
                <div className="text-green-600">{results.feedback.filter(f => f.correct).length}</div>
              </div>
              <div className="space-y-2">
                <XCircle className="w-6 h-6 mx-auto text-red-600" />
                <div className="font-medium">Incorrect</div>
                <div className="text-red-600">{results.feedback.filter(f => !f.correct).length}</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Detailed Results</h3>
              {questions.map((question, index) => (
                <Card key={question.id} className={`border-l-4 ${
                  results.feedback[index].correct ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {results.feedback[index].correct ? 
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" /> :
                        <XCircle className="w-5 h-5 text-red-600 mt-1" />
                      }
                      <div className="flex-1 space-y-2">
                        <p className="font-medium">Q{question.id}: {question.question}</p>
                        <p className="text-sm">
                          <span className="font-medium">Your answer:</span> {answers[question.id] || 'No answer'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {results.feedback[index].explanation}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <Button onClick={onBack} size="lg">
                Create Another Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeElapsed)}</span>
          </div>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Question {currentQuestionIndex + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg leading-relaxed">{currentQuestion.question}</p>
          
          <div className="space-y-4">
            {renderQuestionInput()}
          </div>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next'}
              {currentQuestionIndex < questions.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveQuiz;