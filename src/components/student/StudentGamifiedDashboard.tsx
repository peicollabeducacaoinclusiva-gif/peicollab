import React, { useState, useEffect } from 'react';
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
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  Sparkles,
  TrendingUp,
  Calendar,
  Gift
} from 'lucide-react';
import { ResponsiveLayout, ResponsiveCard, ResponsiveGrid } from '@/components/shared/ResponsiveLayout';

interface StudentProgress {
  totalGoals: number;
  completedGoals: number;
  currentStreak: number;
  totalPoints: number;
  level: number;
  experience: number;
  nextLevelExp: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  points: number;
  category: 'academic' | 'behavior' | 'social' | 'special';
}

interface Activity {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  completed: boolean;
  dueDate?: string;
}

export function StudentGamifiedDashboard() {
  const [progress, setProgress] = useState<StudentProgress>({
    totalGoals: 8,
    completedGoals: 5,
    currentStreak: 7,
    totalPoints: 1250,
    level: 3,
    experience: 750,
    nextLevelExp: 1000
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Primeiro Passo',
      description: 'Complete sua primeira atividade',
      icon: <Star className="h-6 w-6" />,
      unlocked: true,
      points: 50,
      category: 'academic'
    },
    {
      id: '2',
      title: 'Semana Perfeita',
      description: 'Complete todas as atividades de uma semana',
      icon: <Trophy className="h-6 w-6" />,
      unlocked: true,
      points: 100,
      category: 'behavior'
    },
    {
      id: '3',
      title: 'Ajudante',
      description: 'Ajude um colega com uma atividade',
      icon: <Heart className="h-6 w-6" />,
      unlocked: false,
      points: 75,
      category: 'social'
    },
    {
      id: '4',
      title: 'Super Estrela',
      description: 'Alcance 1000 pontos',
      icon: <Zap className="h-6 w-6" />,
      unlocked: true,
      points: 200,
      category: 'special'
    }
  ]);

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      title: 'Leitura Diária',
      description: 'Leia por 15 minutos',
      difficulty: 'easy',
      points: 25,
      completed: true,
      dueDate: '2024-01-15'
    },
    {
      id: '2',
      title: 'Matemática Divertida',
      description: 'Resolva 5 problemas de matemática',
      difficulty: 'medium',
      points: 50,
      completed: false,
      dueDate: '2024-01-16'
    },
    {
      id: '3',
      title: 'Arte Criativa',
      description: 'Crie um desenho sobre o que aprendeu hoje',
      difficulty: 'easy',
      points: 30,
      completed: false,
      dueDate: '2024-01-17'
    },
    {
      id: '4',
      title: 'Desafio Especial',
      description: 'Complete uma atividade extra difícil',
      difficulty: 'hard',
      points: 100,
      completed: false,
      dueDate: '2024-01-20'
    }
  ]);

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic':
        return <BookOpen className="h-4 w-4" />;
      case 'behavior':
        return <Heart className="h-4 w-4" />;
      case 'social':
        return <Target className="h-4 w-4" />;
      case 'special':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'behavior':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'social':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'special':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const completionRate = Math.round((progress.completedGoals / progress.totalGoals) * 100);
  const levelProgress = Math.round((progress.experience / progress.nextLevelExp) * 100);

  return (
    <ResponsiveLayout>
      <div className="space-y-6">
        {/* Header com Avatar e Nível */}
        <ResponsiveCard className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Olá, Estudante!</h1>
                <p className="text-blue-100">Nível {progress.level} • {progress.totalPoints} pontos</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{progress.currentStreak}</div>
              <div className="text-sm text-blue-100">Dias seguidos</div>
            </div>
          </div>
        </ResponsiveCard>

        {/* Progresso Geral */}
        <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }}>
          <ResponsiveCard className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{progress.completedGoals}</div>
            <div className="text-sm text-muted-foreground">Metas Concluídas</div>
            <Progress value={completionRate} className="mt-2" />
          </ResponsiveCard>

          <ResponsiveCard className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{progress.totalPoints}</div>
            <div className="text-sm text-muted-foreground">Pontos Totais</div>
          </ResponsiveCard>

          <ResponsiveCard className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{progress.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Sequência Atual</div>
          </ResponsiveCard>

          <ResponsiveCard className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{progress.level}</div>
            <div className="text-sm text-muted-foreground">Nível Atual</div>
            <Progress value={levelProgress} className="mt-2" />
          </ResponsiveCard>
        </ResponsiveGrid>

        {/* Atividades do Dia */}
        <ResponsiveCard>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Atividades de Hoje
            </CardTitle>
            <CardDescription>
              Complete suas atividades e ganhe pontos!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{activity.title}</h3>
                    <Badge 
                      variant="outline" 
                      className={getDifficultyColor(activity.difficulty)}
                    >
                      {getDifficultyLabel(activity.difficulty)}
                    </Badge>
                    {activity.completed && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Concluída
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {activity.points} pontos
                    </span>
                    {activity.dueDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(activity.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant={activity.completed ? "outline" : "default"}
                  size="sm"
                  disabled={activity.completed}
                >
                  {activity.completed ? 'Concluída' : 'Fazer'}
                </Button>
              </div>
            ))}
          </CardContent>
        </ResponsiveCard>

        {/* Conquistas */}
        <ResponsiveCard>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Conquistas
            </CardTitle>
            <CardDescription>
              Suas medalhas e badges especiais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }}>
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`p-4 rounded-lg border text-center transition-all ${
                    achievement.unlocked 
                      ? 'bg-green-50 border-green-200 hover:shadow-md' 
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                    achievement.unlocked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {achievement.icon}
                  </div>
                  <h3 className="font-medium mb-1">{achievement.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                  <div className="flex items-center justify-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={getCategoryColor(achievement.category)}
                    >
                      {getCategoryIcon(achievement.category)}
                    </Badge>
                    <span className="text-xs font-medium">{achievement.points} pts</span>
                  </div>
                </div>
              ))}
            </ResponsiveGrid>
          </CardContent>
        </ResponsiveCard>

        {/* Próximas Metas */}
        <ResponsiveCard>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Próximas Metas
            </CardTitle>
            <CardDescription>
              O que você pode alcançar em seguida
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Gift className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Próximo Nível</h3>
                  <p className="text-sm text-muted-foreground">
                    {progress.nextLevelExp - progress.experience} pontos para o nível {progress.level + 1}
                  </p>
                </div>
              </div>
              <Progress value={levelProgress} className="w-24" />
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Meta Semanal</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete 5 atividades esta semana
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">3/5</div>
                <div className="text-xs text-muted-foreground">atividades</div>
              </div>
            </div>
          </CardContent>
        </ResponsiveCard>
      </div>
    </ResponsiveLayout>
  );
}


