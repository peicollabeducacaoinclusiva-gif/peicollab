import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Search, User, Users, GraduationCap, FileText, Activity, BarChart3, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@pei/ui';
import { searchService, SearchResult } from '@/services/searchService';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RESULT_ICONS: Record<SearchResult['type'], React.ComponentType<{ className?: string }>> = {
  student: User,
  class: Users,
  professional: GraduationCap,
  pei: FileText,
  aee: Activity,
  activity: Activity,
  report: BarChart3,
};

const RESULT_LABELS: Record<SearchResult['type'], string> = {
  student: 'Aluno',
  class: 'Turma',
  professional: 'Profissional',
  pei: 'PEI',
  aee: 'AEE',
  activity: 'Atividade',
  report: 'Relatório',
};

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { data: userProfile } = useUserProfile();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const performSearch = useCallback(async () => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await searchService.search(debouncedQuery, {
        tenantId: userProfile?.tenant_id,
        schoolId: userProfile?.school_id,
        limit: 10,
      });
      setResults(searchResults);
    } catch (error) {
      toast.error('Erro ao realizar busca');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, userProfile?.tenant_id, userProfile?.school_id]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleSelect = (result: SearchResult) => {
    let path = '';

    switch (result.type) {
      case 'student':
        path = `/students/${result.id}/profile`;
        break;
      case 'class':
        path = `/classes/${result.id}`;
        break;
      case 'professional':
        path = `/professionals/${result.id}`;
        break;
      case 'pei':
        path = `/pei/${result.id}`;
        break;
      case 'aee':
        path = `/aee/${result.id}`;
        break;
      default:
        return;
    }

    if (navigate) {
      navigate(path);
    } else {
      window.location.href = path;
    }
    onOpenChange(false);
    setQuery('');
    setResults([]);
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<SearchResult['type'], SearchResult[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <Command className="rounded-lg border-none">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              placeholder="Buscar aluno, turma, profissional, PEI, AEE..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                className="ml-2 p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            ) : results.length === 0 && query.length >= 2 ? (
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Digite pelo menos 2 caracteres para buscar
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                {Object.entries(groupedResults).map(([type, items]) => {
                  const Icon = RESULT_ICONS[type as SearchResult['type']];
                  const label = RESULT_LABELS[type as SearchResult['type']];

                  return (
                    <CommandGroup key={type} heading={label}>
                      {items.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id}
                          onSelect={() => handleSelect(result)}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium">{result.title}</div>
                            {result.description && (
                              <div className="text-xs text-muted-foreground">
                                {result.description}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {label}
                          </Badge>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })}
              </ScrollArea>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

