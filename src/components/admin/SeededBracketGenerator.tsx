import { useState, useCallback, KeyboardEvent, useEffect, useRef } from 'react';
import { Reorder } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GripVertical, Wand2, Loader2, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  league_id: string | null;
}

interface SeededBracketGeneratorProps {
  leagueId: string;
  teams: Team[];
  onComplete: () => void;
}

const ROUND_TEMPLATES = [
  { teams: 32, rounds: ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'] },
  { teams: 16, rounds: ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'] },
  { teams: 8, rounds: ['Quarter-finals', 'Semi-finals', 'Final'] },
  { teams: 4, rounds: ['Semi-finals', 'Final'] },
  { teams: 2, rounds: ['Final'] },
];

// Generate seeded matchups - classic bracket seeding
// For 8 teams: 1v8, 4v5, 3v6, 2v7 (so 1 and 2 can only meet in final)
// For 16 teams: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
const generateSeededMatchups = (numTeams: number): [number, number][] => {
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
  const matchups: [number, number][] = [];
  
  // Standard seeding algorithm for single-elimination bracket
  // Ensures highest seeds are on opposite sides
  const seeds = Array.from({ length: bracketSize }, (_, i) => i + 1);
  
  const createBracketOrder = (n: number): number[] => {
    if (n === 1) return [1];
    const prev = createBracketOrder(n / 2);
    const result: number[] = [];
    for (let i = 0; i < prev.length; i++) {
      result.push(prev[i]);
      result.push(n + 1 - prev[i]);
    }
    return result;
  };
  
  const bracketOrder = createBracketOrder(bracketSize);
  
  for (let i = 0; i < bracketOrder.length; i += 2) {
    matchups.push([bracketOrder[i], bracketOrder[i + 1]]);
  }
  
  return matchups;
};

export const SeededBracketGenerator = ({ leagueId, teams, onComplete }: SeededBracketGeneratorProps) => {
  const { toast } = useToast();
  const [seededTeams, setSeededTeams] = useState<Team[]>([...teams]);
  const [generating, setGenerating] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const previousOrderRef = useRef<string[]>(teams.map(t => t.id));

  // Restore focus after keyboard reordering
  useEffect(() => {
    if (focusedIndex !== null) {
      const element = itemRefs.current.get(focusedIndex);
      if (element) {
        element.focus();
      }
    }
  }, [focusedIndex, seededTeams]);

  // Handle drag-and-drop reorder with announcements
  const handleDragReorder = useCallback((newOrder: Team[]) => {
    const oldOrder = previousOrderRef.current;
    const newIds = newOrder.map(t => t.id);
    
    // Find which team moved
    for (let i = 0; i < newIds.length; i++) {
      const oldIndex = oldOrder.indexOf(newIds[i]);
      if (oldIndex !== i) {
        const movedTeam = newOrder[i];
        const newSeed = i + 1;
        setAnnouncement(`${movedTeam.short_name} moved to seed ${newSeed} of ${newOrder.length}`);
        break;
      }
    }
    
    previousOrderRef.current = newIds;
    setSeededTeams(newOrder);
  }, []);

  const moveTeamByKeyboard = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= seededTeams.length) return;
    
    const team = seededTeams[index];
    const newTeams = [...seededTeams];
    [newTeams[index], newTeams[newIndex]] = [newTeams[newIndex], newTeams[index]];
    setSeededTeams(newTeams);
    setFocusedIndex(newIndex);
    
    // Announce for screen readers
    const newSeed = newIndex + 1;
    setAnnouncement(`${team.short_name} moved to seed ${newSeed} of ${seededTeams.length}`);
  }, [seededTeams]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLLIElement>, index: number) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveTeamByKeyboard(index, 'up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveTeamByKeyboard(index, 'down');
    }
  }, [moveTeamByKeyboard]);


  const generateSeededBracket = async () => {
    if (seededTeams.length < 2) {
      toast({ title: 'Not enough teams', description: 'Need at least 2 teams to generate a bracket.', variant: 'destructive' });
      return;
    }

    const numTeams = seededTeams.length;
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
    const template = ROUND_TEMPLATES.find(t => t.teams === bracketSize) || ROUND_TEMPLATES[0];
    const matchups = generateSeededMatchups(numTeams);

    setGenerating(true);
    try {
      // Delete existing rounds and matches for this league
      await supabase.from('knockout_rounds').delete().eq('league_id', leagueId);

      // Create rounds
      const newRounds: { league_id: string; round_name: string; round_order: number }[] = [];
      template.rounds.forEach((roundName, index) => {
        newRounds.push({
          league_id: leagueId,
          round_name: roundName,
          round_order: index + 1
        });
      });

      const { data: createdRounds, error: roundsError } = await supabase
        .from('knockout_rounds')
        .insert(newRounds)
        .select();

      if (roundsError) throw roundsError;

      // Generate matches for first round with seeding
      const firstRound = createdRounds?.[0];
      if (firstRound) {
        const matchesData: { 
          round_id: string; 
          match_order: number; 
          team1_id: string | null; 
          team2_id: string | null;
          team1_seed: number | null;
          team2_seed: number | null;
        }[] = [];

        matchups.forEach((matchup, index) => {
          const [seed1, seed2] = matchup;
          const team1 = seededTeams[seed1 - 1]; // Seeds are 1-indexed
          const team2 = seededTeams[seed2 - 1];
          
          matchesData.push({
            round_id: firstRound.id,
            match_order: index + 1,
            team1_id: team1?.id || null,
            team2_id: team2?.id || null,
            team1_seed: team1 ? seed1 : null,
            team2_seed: team2 ? seed2 : null
          });
        });

        await supabase.from('knockout_matches').insert(matchesData);

        // Create placeholder matches for subsequent rounds
        for (let r = 1; r < createdRounds.length; r++) {
          const round = createdRounds[r];
          const numMatches = Math.pow(2, createdRounds.length - r - 1);
          const placeholderMatches = [];
          
          for (let m = 0; m < numMatches; m++) {
            placeholderMatches.push({
              round_id: round.id,
              match_order: m + 1,
              team1_id: null,
              team2_id: null,
              team1_seed: null,
              team2_seed: null
            });
          }
          
          await supabase.from('knockout_matches').insert(placeholderMatches);
        }
      }

      toast({ 
        title: 'Seeded bracket generated!', 
        description: `Created ${template.rounds.length} rounds with proper seeding for ${numTeams} teams.` 
      });
      onComplete();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  // Preview matchups
  const matchups = generateSeededMatchups(seededTeams.length);

  return (
    <div className="space-y-4">
      {/* Screen reader live region for announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Seeded Bracket Generator</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Arrange teams by seed (1 = highest). Higher seeds will be placed on opposite sides of the bracket to avoid early meetings. Use arrow keys to reorder when focused.
        </p>

        {/* Team seeding list with drag-and-drop */}
        <Reorder.Group 
          axis="y" 
          values={seededTeams} 
          onReorder={handleDragReorder}
          className="space-y-2 mb-4 max-h-[300px] overflow-y-auto"
        >
          {seededTeams.map((team, index) => (
            <Reorder.Item
              key={team.id}
              value={team}
              ref={(el: HTMLLIElement | null) => {
                if (el) {
                  itemRefs.current.set(index, el);
                } else {
                  itemRefs.current.delete(index);
                }
              }}
              tabIndex={0}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg border cursor-grab active:cursor-grabbing outline-none transition-all",
                "focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background",
                index === 0 && "bg-gold/10 border-gold/50",
                index === 1 && "bg-muted border-muted-foreground/20",
                index === 2 && "bg-amber-700/10 border-amber-700/30",
                index > 2 && "bg-muted/50 border-border/50",
                focusedIndex === index && "ring-2 ring-primary"
              )}
              whileDrag={{ 
                scale: 1.02, 
                boxShadow: "0 10px 30px -10px hsl(0 0% 0% / 0.5)",
                zIndex: 50
              }}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                index === 0 && "bg-gold text-black",
                index === 1 && "bg-muted-foreground text-background",
                index === 2 && "bg-amber-700 text-white",
                index > 2 && "bg-muted text-muted-foreground"
              )}>
                {index + 1}
              </div>
              
              <div className="w-6 h-6 rounded-full bg-muted overflow-hidden flex-shrink-0">
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                    {team.short_name?.charAt(0)}
                  </div>
                )}
              </div>
              
              <span className="text-sm font-medium flex-1">{team.short_name}</span>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {/* Matchup preview */}
        <div className="border-t border-border/50 pt-4 mb-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">First Round Matchups Preview:</h4>
          <div className="grid grid-cols-2 gap-2">
            {matchups.map((matchup, index) => {
              const team1 = seededTeams[matchup[0] - 1];
              const team2 = seededTeams[matchup[1] - 1];
              return (
                <div key={index} className="text-xs bg-muted/50 rounded p-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">({matchup[0]})</span>
                    <span className="font-medium">{team1?.short_name || 'BYE'}</span>
                  </span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">{team2?.short_name || 'BYE'}</span>
                    <span className="text-[10px] text-muted-foreground">({matchup[1]})</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Button 
          onClick={generateSeededBracket} 
          disabled={generating || seededTeams.length < 2}
          className="w-full"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4 mr-2" />
          )}
          Generate Seeded Bracket
        </Button>
      </div>
    </div>
  );
};

export default SeededBracketGenerator;
