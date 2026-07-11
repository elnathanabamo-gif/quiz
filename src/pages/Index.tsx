import React, { useCallback, useEffect, useState } from 'react';
import { Brain, FileText, Zap, Target, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DocumentUpload from '@/components/DocumentUpload';
import QuizConfiguration, { QuizConfig } from '@/components/QuizConfiguration';
import QuizGeneration from '@/components/QuizGeneration';
import Quiz from '@/pages/Quiz';
import LiveQuiz from '@/components/LiveQuiz';
import AIConfigModal from '@/components/AIConfigModal';
import { Question, aiQuestionGenerator } from '@/services/aiQuestionGenerator';
import { contentExtractor } from '@/services/contentExtractor';
import heroImage from '@/assets/hero-image.jpg';

type AppState = 'landing' | 'upload' | 'configure' | 'generating' | 'quiz-ready' | 'live-quiz';

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('landing');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [serverAIConfigured, setServerAIConfigured] = useState(false);
  const [serverReachable, setServerReachable] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<QuizConfig | null>(null);

  useEffect(() => {
    aiQuestionGenerator.checkAIStatus().then((status) => {
      setServerAIConfigured(status.configured);
      setServerReachable(status.reachable);
    });
  }, []);

  const features = [
    { icon: FileText, title: 'Multiple Formats', description: 'Upload PDF, Word, Excel, and text documents', color: 'text-blue-600' },
    { icon: Brain, title: 'AI-Powered', description: 'Advanced AI analyzes content and generates questions', color: 'text-purple-600' },
    { icon: Target, title: '4 Question Types', description: 'True/False, Multiple Choice, Fill-in-Blank, Descriptive', color: 'text-green-600' },
    { icon: Zap, title: 'Instant Results', description: 'Get immediate feedback and scoring', color: 'text-orange-600' },
  ];

  const handleFileUpload = async (file: File) => {
    try {
      setUploadedFile(file);
      await contentExtractor.extractFromFile(file);
      setCurrentState('configure');
    } catch (error) {
      console.error('File processing error:', error);
      setUploadedFile(file);
      setCurrentState('configure');
    }
  };

  const startGeneration = (config: QuizConfig) => {
    setQuizConfig(config);
    setCurrentState('generating');
  };

  const handleConfigurationComplete = async (config: QuizConfig) => {
    const status = await aiQuestionGenerator.checkAIStatus();
    setServerAIConfigured(status.configured);
    setServerReachable(status.reachable);

    const aiAvailable = aiQuestionGenerator.isAIAvailable(status.configured);
    if (!aiAvailable) {
      setPendingConfig(config);
      setShowAIConfig(true);
      return;
    }

    startGeneration(config);
  };

  const handleAIConfigSave = (apiKey: string) => {
    aiQuestionGenerator.setApiKey(apiKey);
    setShowAIConfig(false);

    if (pendingConfig) {
      startGeneration(pendingConfig);
      setPendingConfig(null);
    }
  };

  const handleGenerate = useCallback(
    async (onProgress: (step: number, progress: number) => void) => {
      if (!uploadedFile || !quizConfig) {
        throw new Error('Missing file or quiz configuration');
      }

      onProgress(0, 10);
      const content = await contentExtractor.extractFromFile(uploadedFile);

      if (!content.text || content.text.trim().length < 50) {
        throw new Error('Document content is too short or could not be extracted. Try a different file.');
      }

      onProgress(1, 35);
      onProgress(2, 50);

      const questions = await aiQuestionGenerator.generateQuestions(content, quizConfig);

      if (questions.length === 0) {
        throw new Error('No questions were generated. Please try again.');
      }

      onProgress(3, 95);
      return questions;
    },
    [uploadedFile, quizConfig]
  );

  const handleGenerationComplete = (questions: Question[]) => {
    setGeneratedQuestions(questions);
    setCurrentState('quiz-ready');
  };

  const handleStartQuiz = () => setCurrentState('live-quiz');

  const handleDownloadPDF = async () => {
    try {
      if (generatedQuestions.length > 0 && quizConfig && uploadedFile) {
        const { pdfGenerator } = await import('@/services/pdfGenerator');
        const pdfBlob = pdfGenerator.generateQuizPDF(generatedQuestions, uploadedFile.name, quizConfig);
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${uploadedFile.name.replace(/\.[^/.]+$/, '')}-quiz.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
    }
  };

  const handleQuizComplete = (answers: Record<number, string>, score: number) => {
    console.log('Quiz completed with score:', score, 'answers:', answers);
  };

  const handleBackToStart = () => {
    setCurrentState('landing');
    setUploadedFile(null);
    setQuizConfig(null);
    setGeneratedQuestions([]);
    setPendingConfig(null);
  };

  if (currentState === 'live-quiz' && quizConfig) {
    return (
      <div className="min-h-screen bg-background p-4">
        <LiveQuiz questions={generatedQuestions} onComplete={handleQuizComplete} onBack={handleBackToStart} />
      </div>
    );
  }

  if (currentState === 'quiz-ready' && uploadedFile && quizConfig) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Quiz
          config={quizConfig}
          fileName={uploadedFile.name}
          questions={generatedQuestions}
          onBack={() => setCurrentState('configure')}
          onStartQuiz={handleStartQuiz}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>
    );
  }

  if (currentState === 'generating' && uploadedFile && quizConfig) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <QuizGeneration
          config={quizConfig}
          fileName={uploadedFile.name}
          onGenerate={handleGenerate}
          onComplete={handleGenerationComplete}
          onBack={() => setCurrentState('configure')}
        />
      </div>
    );
  }

  if (currentState === 'configure' && uploadedFile) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto py-8">
          <QuizConfiguration fileName={uploadedFile.name} onConfigurationComplete={handleConfigurationComplete} />
        </div>
        <AIConfigModal
          isOpen={showAIConfig}
          onClose={() => {
            setShowAIConfig(false);
            setPendingConfig(null);
          }}
          onConfigSave={handleAIConfigSave}
          serverConfigured={serverAIConfigured}
          serverReachable={serverReachable}
        />
      </div>
    );
  }

  if (currentState === 'upload') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => setCurrentState('landing')}>
              ← Back to Home
            </Button>
          </div>
        </div>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">Upload Your Document</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Upload your document and let AI create engaging quiz questions from your content
              </p>
            </div>
            <DocumentUpload onFileUpload={handleFileUpload} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {features.map((feature, index) => (
                <div key={index} className="text-center space-y-2">
                  <feature.icon className={`w-8 h-8 mx-auto ${feature.color}`} />
                  <p className="text-sm font-medium">{feature.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative bg-gradient-primary/5">
          <div className="container mx-auto px-4 py-24">
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              <div className="space-y-4">
                <Badge className="text-sm px-4 py-2 bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered Quiz Generation
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Welcome to ElRunner
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                  Transform any document into engaging quizzes instantly. Upload, configure, and generate with the power of AI.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="xl" onClick={() => setCurrentState('upload')} className="group">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-24 bg-accent/20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Powerful Features</h2>
            <p className="text-xl text-muted-foreground">Everything you need to create amazing quizzes from your documents</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8 space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-accent rounded-full">
                      <feature.icon className={`w-8 h-8 ${feature.color}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="py-24 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="space-y-8 text-white">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Create Your First Quiz?</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of educators and students using AI to create better learning experiences
            </p>
            <Button size="xl" variant="secondary" onClick={() => setCurrentState('upload')} className="group">
              Start Creating Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      <AIConfigModal
        isOpen={showAIConfig}
        onClose={() => {
          setShowAIConfig(false);
          setPendingConfig(null);
        }}
        onConfigSave={handleAIConfigSave}
        serverConfigured={serverAIConfigured}
        serverReachable={serverReachable}
      />
    </div>
  );
};

export default Index;
