import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  Trophy, 
  Target, 
  Heart, 
  Zap, 
  CheckCircle,
  Clock,
  Award,
  Sparkles,
  BookOpen,
  Palette,
  Calculator,
  Music,
  Gamepad2
} from 'lucide-react';
import { ResponsiveLayout, ResponsiveCard } from '@/components/shared/ResponsiveLayout';

interface GamifiedActivityProps {
  activity: {
    id: string;
    title: string;
    description: string;
    category: 'reading' | 'math' | 'art' | 'music' | 'games' | 'writing';
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    estimatedTime: number; // em minutos
    steps: string[];
    completed: boolean;
    progress: number; // 0-100
  };
  onComplete?: (activityId: string) => void;
  onProgress?: (activityId: string, progress: number) => void;
}

export function GamifiedActivity({ activity, onComplete, onProgress }: GamifiedActivityProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(activity.completed);
  const [progress, setProgress] = useState(activity.progress);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reading':
        return <BookOpen className="h-6 w-6" />;
      case 'math':
        return <Calculator className="h-6 w-6" />;
      case 'art':
        return <Palette className="h-6 w-6" />;
      case 'music':
        return <Music className="h-6 w-6" />;
      case 'games':
        return <Gamepad2 className="h-6 w-6" />;
      case 'writing':
        return <BookOpen className="h-6 w-6" />;
      default:
        return <Target className="h-6 w-6" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reading':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'math':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'art':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'music':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'games':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'writing':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Fácil';
      case 'medium':
        return 'Médio';
      case 'hard':
        return 'Difícil';
      default:
        return 'Desconhecido';
    }
  };

  const handleStepComplete = () => {
    const newProgress = Math.min(100, progress + (100 / activity.steps.length));
    setProgress(newProgress);
    onProgress?.(activity.id, newProgress);

    if (newProgress >= 100) {
      setIsCompleted(true);
      onComplete?.(activity.id);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStart = () => {
    setCurrentStep(0);
    setProgress(0);
    setIsCompleted(false);
  };

  const getMotivationalMessage = () => {
    if (isCompleted) {
      return "🎉 Parabéns! Você completou esta atividade!";
    }
    if (progress > 75) {
      return "🔥 Você está quase lá! Continue assim!";
    }
    if (progress > 50) {
      return "⭐ Ótimo progresso! Você está indo muito bem!";
    }
    if (progress > 25) {
      return "💪 Continue assim! Você está no caminho certo!";
    }
    return "🚀 Vamos começar esta atividade incrível!";
  };

  return (
    <ResponsiveCard className={`transition-all hover:shadow-lg ${
      isCompleted ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {getCategoryIcon(activity.category)}
            </div>
            <div>
              <CardTitle className="text-lg">{activity.title}</CardTitle>
              <CardDescription>{activity.description}</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={getCategoryColor(activity.category)}
            >
              {activity.category}
            </Badge>
            <Badge 
              variant="outline" 
              className={getDifficultyColor(activity.difficulty)}
            >
              {getDifficultyLabel(activity.difficulty)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações da Atividade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">{activity.points} pontos</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">{activity.estimatedTime} min</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">{activity.steps.length} passos</span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Mensagem Motivacional */}
        <div className="p-3 bg-white rounded-lg border">
          <p className="text-sm font-medium text-center">{getMotivationalMessage()}</p>
        </div>

        {/* Passos da Atividade */}
        {!isCompleted && (
          <div className="space-y-3">
            <h4 className="font-medium">Passos da Atividade:</h4>
            <div className="space-y-2">
              {activity.steps.map((step, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    index < currentStep 
                      ? 'bg-green-50 border-green-200' 
                      : index === currentStep
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    index < currentStep 
                      ? 'bg-green-100 text-green-600' 
                      : index === currentStep
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {index < currentStep ? <CheckCircle className="h-3 w-3" /> : index + 1}
                  </div>
                  <span className={`text-sm ${
                    index < currentStep ? 'text-green-700' : 
                    index === currentStep ? 'text-blue-700 font-medium' : 'text-gray-500'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-between">
          {isCompleted ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Atividade Concluída!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleStart}
                disabled={currentStep > 0}
                variant="outline"
                size="sm"
              >
                {currentStep === 0 ? 'Começar' : 'Reiniciar'}
              </Button>
              
              {currentStep > 0 && (
                <Button 
                  onClick={handleStepComplete}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Concluir Passo
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <Star className="h-3 w-3 mr-1" />
              {activity.points} pts
            </Badge>
            {isCompleted && (
              <Badge variant="default" className="bg-green-600">
                <Trophy className="h-3 w-3 mr-1" />
                Concluída
              </Badge>
            )}
          </div>
        </div>

        {/* Recompensas */}
        {isCompleted && (
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Recompensas Ganhas!</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{activity.points} pontos</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Experiência +{activity.points}</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Conquista desbloqueada!</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </ResponsiveCard>
  );
}


