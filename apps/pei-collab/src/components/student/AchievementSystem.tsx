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
  CheckCircle,
  Clock,
  Award,
  Sparkles,
  BookOpen,
  Users,
  Calendar,
  TrendingUp,
  Gift,
  Crown
} from 'lucide-react';
import { ResponsiveLayout, ResponsiveCard, ResponsiveGrid } from '@/components/shared/ResponsiveLayout';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'academic' | 'behavior' | 'social' | 'special' | 'streak' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0-100
  requirement: string;
  rewards: {
    points: number;
    experience: number;
    badge?: string;
  };
}

interface AchievementSystemProps {
  studentId: string;
  onAchievementUnlocked?: (achievement: Achievement) => void;
}

export function AchievementSystem({ studentId, onAchievementUnlocked }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'rarity' | 'points' | 'unlocked' | 'category'>('rarity');

  const mockAchievements: Achievement[] = [
    {
      id: '1',
      title: 'Primeiro Passo',
      description: 'Complete sua primeira atividade',
      icon: <Star className="h-6 w-6" />,
      category: 'academic',
      rarity: 'common',
      points: 50,
      unlocked: true,
      unlockedAt: '2024-01-10',
      progress: 100,
      requirement: 'Complete 1 atividade',
      rewards: { points: 50, experience: 100 }
    },
    {
      id: '2',
      title: 'Semana Perfeita',
      description: 'Complete todas as atividades de uma semana',
      icon: <Trophy className="h-6 w-6" />,
      category: 'behavior',
      rarity: 'rare',
      points: 200,
      unlocked: true,
      unlockedAt: '2024-01-15',
      progress: 100,
      requirement: 'Complete 7 atividades em 7 dias',
      rewards: { points: 200, experience: 300, badge: 'Semana Perfeita' }
    },
    {
      id: '3',
      title: 'Ajudante',
      description: 'Ajude um colega com uma atividade',
      icon: <Heart className="h-6 w-6" />,
      category: 'social',
      rarity: 'common',
      points: 75,
      unlocked: false,
      progress: 0,
      requirement: 'Ajude 1 colega',
      rewards: { points: 75, experience: 150 }
    },
    {
      id: '4',
      title: 'Super Estrela',
      description: 'Alcance 1000 pontos',
      icon: <Zap className="h-6 w-6" />,
      category: 'milestone',
      rarity: 'epic',
      points: 500,
      unlocked: true,
      unlockedAt: '2024-01-20',
      progress: 100,
      requirement: 'Alcance 1000 pontos',
      rewards: { points: 500, experience: 750, badge: 'Super Estrela' }
    },
    {
      id: '5',
      title: 'Mestre da Leitura',
      description: 'Complete 50 atividades de leitura',
      icon: <BookOpen className="h-6 w-6" />,
      category: 'academic',
      rarity: 'legendary',
      points: 1000,
      unlocked: false,
      progress: 60,
      requirement: 'Complete 50 atividades de leitura',
      rewards: { points: 1000, experience: 1500, badge: 'Mestre da Leitura' }
    },
    {
      id: '6',
      title: 'Sequência de Ouro',
      description: 'Mantenha uma sequência de 30 dias',
      icon: <Crown className="h-6 w-6" />,
      category: 'streak',
      rarity: 'legendary',
      points: 2000,
      unlocked: false,
      progress: 23,
      requirement: 'Mantenha sequência de 30 dias',
      rewards: { points: 2000, experience: 3000, badge: 'Sequência de Ouro' }
    }
  ];

  useEffect(() => {
    setAchievements(mockAchievements);
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rare':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'epic':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'Comum';
      case 'rare':
        return 'Rara';
      case 'epic':
        return 'Épica';
      case 'legendary':
        return 'Lendária';
      default:
        return 'Desconhecida';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic':
        return <BookOpen className="h-4 w-4" />;
      case 'behavior':
        return <Heart className="h-4 w-4" />;
      case 'social':
        return <Users className="h-4 w-4" />;
      case 'special':
        return <Sparkles className="h-4 w-4" />;
      case 'streak':
        return <TrendingUp className="h-4 w-4" />;
      case 'milestone':
        return <Target className="h-4 w-4" />;
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
      case 'streak':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'milestone':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'academic':
        return 'Acadêmica';
      case 'behavior':
        return 'Comportamento';
      case 'social':
        return 'Social';
      case 'special':
        return 'Especial';
      case 'streak':
        return 'Sequência';
      case 'milestone':
        return 'Marco';
      default:
        return 'Desconhecida';
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    switch (filter) {
      case 'unlocked':
        return achievement.unlocked;
      case 'locked':
        return !achievement.unlocked;
      case 'recent':
        return achievement.unlocked && achievement.unlockedAt;
      default:
        return true;
    }
  });

  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    switch (sortBy) {
      case 'rarity':
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
        return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) - 
               (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0);
      case 'points':
        return b.points - a.points;
      case 'unlocked':
        return Number(b.unlocked) - Number(a.unlocked);
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionRate = Math.round((unlockedCount / totalCount) * 100);

  return (
    <ResponsiveLayout>
      <div className="space-y-6">
        {/* Header com Estatísticas */}
        <ResponsiveCard className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Sistema de Conquistas
              </h2>
              <p className="text-purple-100">
                {unlockedCount} de {totalCount} conquistas desbloqueadas
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{completionRate}%</div>
              <div className="text-sm text-purple-100">Completado</div>
            </div>
          </div>
          <Progress value={completionRate} className="mt-4" />
        </ResponsiveCard>

        {/* Filtros e Ordenação */}
        <ResponsiveCard>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filtrar</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">Todas</option>
                <option value="unlocked">Desbloqueadas</option>
                <option value="locked">Bloqueadas</option>
                <option value="recent">Recentes</option>
              </select>
            </div>
            
            <div className="md:w-48">
              <label className="text-sm font-medium mb-2 block">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="rarity">Raridade</option>
                <option value="points">Pontos</option>
                <option value="unlocked">Status</option>
                <option value="category">Categoria</option>
              </select>
            </div>
          </div>
        </ResponsiveCard>

        {/* Lista de Conquistas */}
        <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }}>
          {sortedAchievements.map((achievement) => (
            <ResponsiveCard 
              key={achievement.id} 
              className={`transition-all hover:shadow-lg ${
                achievement.unlocked 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    achievement.unlocked 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {achievement.icon}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={getRarityColor(achievement.rarity)}
                    >
                      {getRarityLabel(achievement.rarity)}
                    </Badge>
                    {achievement.unlocked && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Desbloqueada
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progresso</span>
                    <span>{Math.round(achievement.progress)}%</span>
                  </div>
                  <Progress value={achievement.progress} className="h-2" />
                </div>

                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={getCategoryColor(achievement.category)}
                  >
                    {getCategoryIcon(achievement.category)}
                    {getCategoryLabel(achievement.category)}
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Star className="h-3 w-3 mr-1" />
                    {achievement.points} pts
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p><strong>Requisito:</strong> {achievement.requirement}</p>
                  {achievement.unlockedAt && (
                    <p><strong>Desbloqueada em:</strong> {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>

                {achievement.unlocked && (
                  <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Recompensas</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span>+{achievement.rewards.points} pontos</span>
                      <span>+{achievement.rewards.experience} XP</span>
                      {achievement.rewards.badge && (
                        <span className="text-yellow-700 font-medium">{achievement.rewards.badge}</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </ResponsiveCard>
          ))}
        </ResponsiveGrid>

        {sortedAchievements.length === 0 && (
          <ResponsiveCard className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma conquista encontrada</h3>
            <p className="text-muted-foreground">
              Ajuste os filtros para ver mais conquistas.
            </p>
          </ResponsiveCard>
        )}
      </div>
    </ResponsiveLayout>
  );
}


