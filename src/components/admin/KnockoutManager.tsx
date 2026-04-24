import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Trophy, ChevronDown, ChevronUp, Loader2, Edit2, Save, X, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KnockoutBracket } from '@/components/bracket/KnockoutBracket';
import { SeededBracketGenerator } from './SeededBracketGenerator';

interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  league_id: string | null;
}

interface League {
  id: string;
  name: string;
  short_name: string;
  format: string;
}

interface KnockoutRound {
  id: string;
  league_id: string;
  round_name: string;
  round_order: number;
}

interface KnockoutMatch {
  id: string;
  round_id: string;
  match_order: number;
  team1_id: string | null;
  team2_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  team1_score_90: number | null;
  team2_score_90: number | null;
  went_to_extra_time: boolean;
  team1_penalties: number | null;
  team2_penalties: number | null;
  winner_id: string | null;
  match_date: string | null;
  match_time: string | null;
  venue: string | null;
  is_completed: boolean;
  is_third_place_playoff: boolean;
  team1_seed: number | null;
  team2_seed: number | null;
}

interface KnockoutManagerProps {
  leagues: League[];
  teams: Team[];
}

const ROUND_TEMPLATES = [
  { teams: 32, rounds: ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'] },
  { teams: 16, rounds: ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'] },
  { teams: 8, rounds: ['Quarter-finals', 'Semi-finals', 'Final'] },
  { teams: 4, rounds: ['Semi-finals', 'Final'] },
  { teams: 2, rounds: ['Final'] },
];

export const KnockoutManager = ({ leagues, teams }: KnockoutManagerProps) => {
  const { toast } = useToast();
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [rounds, setRounds] = useState<KnockoutRound[]>([]);
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [matchForm, setMatchForm] = useState<Partial<KnockoutMatch>>({});
  const [generating, setGenerating] = useState(false);
  const [showSeededGenerator, setShowSeededGenerator] = useState(false);

  const knockoutLeagues = leagues.filter(l => l.format === 'knockout');
  const leagueTeams = teams.filter(t => t.league_id === selectedLeague);

  useEffect(() => {
    if (selectedLeague) {
      fetchRoundsAndMatches();
    }
  }, [selectedLeague]);

  const fetchRoundsAndMatches = async () => {
    setLoading(true);
    try {
      const [roundsRes, matchesRes] = await Promise.all([
        supabase
          .from('knockout_rounds')
          .select('*')
          .eq('league_id', selectedLeague)
          .order('round_order'),
        supabase
          .from('knockout_matches')
          .select('*')
          .order('match_order')
      ]);

      if (roundsRes.error) throw roundsRes.error;
      if (matchesRes.error) throw matchesRes.error;

      setRounds(roundsRes.data || []);
      
      // Filter matches to only those belonging to current league's rounds
      const roundIds = (roundsRes.data || []).map(r => r.id);
      setMatches((matchesRes.data || []).filter(m => roundIds.includes(m.round_id)));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateBracket = async () => {
    if (leagueTeams.length < 2) {
      toast({ title: 'Not enough teams', description: 'Need at least 2 teams to generate a bracket.', variant: 'destructive' });
      return;
    }

    const numTeams = leagueTeams.length;
    const template = ROUND_TEMPLATES.find(t => t.teams >= numTeams) || ROUND_TEMPLATES[0];
    
    // Calculate actual bracket size (next power of 2)
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
    const adjustedTemplate = ROUND_TEMPLATES.find(t => t.teams === bracketSize) || template;

    setGenerating(true);
    try {
      // Delete existing rounds and matches for this league
      await supabase.from('knockout_rounds').delete().eq('league_id', selectedLeague);

      // Create rounds
      const newRounds: { league_id: string; round_name: string; round_order: number }[] = [];
      adjustedTemplate.rounds.forEach((roundName, index) => {
        newRounds.push({
          league_id: selectedLeague,
          round_name: roundName,
          round_order: index + 1
        });
      });

      const { data: createdRounds, error: roundsError } = await supabase
        .from('knockout_rounds')
        .insert(newRounds)
        .select();

      if (roundsError) throw roundsError;

      // Generate matches for first round
      const firstRound = createdRounds?.[0];
      if (firstRound) {
        const shuffledTeams = [...leagueTeams].sort(() => Math.random() - 0.5);
        const firstRoundMatches = Math.ceil(numTeams / 2);
        const matchesData: { round_id: string; match_order: number; team1_id: string | null; team2_id: string | null }[] = [];

        for (let i = 0; i < firstRoundMatches; i++) {
          matchesData.push({
            round_id: firstRound.id,
            match_order: i + 1,
            team1_id: shuffledTeams[i * 2]?.id || null,
            team2_id: shuffledTeams[i * 2 + 1]?.id || null
          });
        }

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
              team2_id: null
            });
          }
          
          await supabase.from('knockout_matches').insert(placeholderMatches);
        }
      }

      toast({ title: 'Bracket generated!', description: `Created ${adjustedTemplate.rounds.length} rounds for ${numTeams} teams.` });
      fetchRoundsAndMatches();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const addRound = async () => {
    try {
      const newOrder = rounds.length + 1;
      const { error } = await supabase.from('knockout_rounds').insert({
        league_id: selectedLeague,
        round_name: `Round ${newOrder}`,
        round_order: newOrder
      });

      if (error) throw error;
      toast({ title: 'Round added!' });
      fetchRoundsAndMatches();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteRound = async (roundId: string) => {
    if (!confirm('Delete this round and all its matches?')) return;
    
    try {
      const { error } = await supabase.from('knockout_rounds').delete().eq('id', roundId);
      if (error) throw error;
      toast({ title: 'Round deleted!' });
      fetchRoundsAndMatches();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const addMatch = async (roundId: string) => {
    const roundMatches = matches.filter(m => m.round_id === roundId);
    const newOrder = roundMatches.length + 1;

    try {
      const { error } = await supabase.from('knockout_matches').insert({
        round_id: roundId,
        match_order: newOrder
      });

      if (error) throw error;
      toast({ title: 'Match added!' });
      fetchRoundsAndMatches();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const updateMatch = async (matchId: string) => {
    try {
      // Determine winner based on scores (including penalties for draws)
      let winnerId = matchForm.winner_id;
      const team1Score = matchForm.team1_score ?? 0;
      const team2Score = matchForm.team2_score ?? 0;
      const team1Pens = matchForm.team1_penalties;
      const team2Pens = matchForm.team2_penalties;
      
      if (matchForm.is_completed && matchForm.team1_score !== null && matchForm.team2_score !== null) {
        if (team1Score > team2Score) {
          winnerId = matchForm.team1_id;
        } else if (team2Score > team1Score) {
          winnerId = matchForm.team2_id;
        } else if (team1Score === team2Score && team1Pens !== null && team2Pens !== null) {
          // Draw in regular time - check penalties
          if (team1Pens > team2Pens) {
            winnerId = matchForm.team1_id;
          } else if (team2Pens > team1Pens) {
            winnerId = matchForm.team2_id;
          }
        }
      }

      const { error } = await supabase
        .from('knockout_matches')
        .update({
          team1_id: matchForm.team1_id || null,
          team2_id: matchForm.team2_id || null,
          team1_score: matchForm.team1_score,
          team2_score: matchForm.team2_score,
          team1_score_90: matchForm.went_to_extra_time ? matchForm.team1_score_90 : null,
          team2_score_90: matchForm.went_to_extra_time ? matchForm.team2_score_90 : null,
          went_to_extra_time: matchForm.went_to_extra_time || false,
          team1_penalties: matchForm.team1_penalties,
          team2_penalties: matchForm.team2_penalties,
          winner_id: winnerId,
          match_date: matchForm.match_date || null,
          match_time: matchForm.match_time || null,
          venue: matchForm.venue || null,
          is_completed: matchForm.is_completed || false
        })
        .eq('id', matchId);

      if (error) throw error;
      
      toast({ title: 'Match updated!' });
      setEditingMatch(null);
      setMatchForm({});
      fetchRoundsAndMatches();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm('Delete this match?')) return;
    
    try {
      const { error } = await supabase.from('knockout_matches').delete().eq('id', matchId);
      if (error) throw error;
      toast({ title: 'Match deleted!' });
      fetchRoundsAndMatches();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const startEditMatch = (match: KnockoutMatch) => {
    setEditingMatch(match.id);
    setMatchForm({
      team1_id: match.team1_id,
      team2_id: match.team2_id,
      team1_score: match.team1_score,
      team2_score: match.team2_score,
      team1_score_90: match.team1_score_90,
      team2_score_90: match.team2_score_90,
      went_to_extra_time: match.went_to_extra_time,
      team1_penalties: match.team1_penalties,
      team2_penalties: match.team2_penalties,
      winner_id: match.winner_id,
      match_date: match.match_date,
      match_time: match.match_time,
      venue: match.venue,
      is_completed: match.is_completed
    });
  };

  // Check if scores are tied (penalties applicable)
  const isScoresTied = matchForm.team1_score !== null && 
                       matchForm.team2_score !== null && 
                       matchForm.team1_score === matchForm.team2_score;

  // Find semi-finals round and check for losers
  const semiFinalRound = rounds.find(r => r.round_name.toLowerCase().includes('semi'));
  const semiFinalMatches = semiFinalRound ? matches.filter(m => m.round_id === semiFinalRound.id) : [];
  const completedSemiFinals = semiFinalMatches.filter(m => m.is_completed && m.winner_id);
  
  // Get semi-final losers (teams that lost in semi-finals)
  const getSemiFinalLosers = () => {
    return completedSemiFinals.map(match => {
      const loserId = match.winner_id === match.team1_id ? match.team2_id : match.team1_id;
      return loserId;
    }).filter(Boolean) as string[];
  };

  // Check if third-place playoff already exists
  const thirdPlaceMatch = matches.find(m => m.is_third_place_playoff);
  const canCreateThirdPlace = completedSemiFinals.length === 2 && !thirdPlaceMatch;

  // Create third-place playoff match
  const createThirdPlacePlayoff = async () => {
    const losers = getSemiFinalLosers();
    if (losers.length !== 2 || !semiFinalRound) return;

    try {
      const { error } = await supabase.from('knockout_matches').insert({
        round_id: semiFinalRound.id,
        match_order: 99, // High number to sort after regular matches
        team1_id: losers[0],
        team2_id: losers[1],
        is_third_place_playoff: true
      });

      if (error) throw error;
      toast({ title: 'Third-place playoff created!' });
      fetchRoundsAndMatches();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Prepare bracket data (exclude third-place match from regular rounds)
  const bracketRounds = rounds.map(round => ({
    ...round,
    matches: matches.filter(m => m.round_id === round.id && !m.is_third_place_playoff)
  }));

  return (
    <div className="space-y-6">
      {/* League selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label className="text-xs mb-1 block">Select Knockout Tournament</Label>
          <Select value={selectedLeague} onValueChange={setSelectedLeague}>
            <SelectTrigger>
              <SelectValue placeholder="Select a knockout tournament..." />
            </SelectTrigger>
            <SelectContent>
              {knockoutLeagues.map(league => (
                <SelectItem key={league.id} value={league.id}>
                  {league.name} ({league.short_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {knockoutLeagues.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No knockout tournaments found.</p>
          <p className="text-sm">Create a league with "Knockout Tournament" format first.</p>
        </div>
      )}

      {selectedLeague && (
        <>
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={generateBracket} disabled={generating || leagueTeams.length < 2} size="sm" variant="outline">
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              Random Bracket ({leagueTeams.length} teams)
            </Button>
            <Button 
              onClick={() => setShowSeededGenerator(!showSeededGenerator)} 
              disabled={leagueTeams.length < 2} 
              size="sm"
              variant={showSeededGenerator ? "secondary" : "default"}
            >
              <Trophy className="w-4 h-4 mr-2" />
              {showSeededGenerator ? 'Hide Seeding' : 'Seeded Bracket'}
            </Button>
            <Button onClick={addRound} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Round
            </Button>
            {canCreateThirdPlace && (
              <Button onClick={createThirdPlacePlayoff} variant="outline" size="sm" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10">
                <Trophy className="w-4 h-4 mr-2" />
                Add 3rd Place Playoff
              </Button>
            )}
          </div>

          {/* Seeded bracket generator */}
          {showSeededGenerator && leagueTeams.length >= 2 && (
            <SeededBracketGenerator 
              leagueId={selectedLeague}
              teams={leagueTeams}
              onComplete={() => {
                setShowSeededGenerator(false);
                fetchRoundsAndMatches();
              }}
            />
          )}

          {/* Bracket preview */}
          {rounds.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
              <h3 className="text-sm font-semibold mb-4">Bracket Preview</h3>
              <KnockoutBracket rounds={bracketRounds} teams={teams} thirdPlaceMatch={thirdPlaceMatch} />
            </div>
          )}

          {/* Rounds management */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {rounds.map(round => {
                const roundMatches = matches.filter(m => m.round_id === round.id);
                const isExpanded = expandedRound === round.id;

                return (
                  <div key={round.id} className="bg-gradient-card border border-border/50 rounded-lg overflow-hidden">
                    {/* Round header */}
                    <div 
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedRound(isExpanded ? null : round.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Trophy className="w-4 h-4 text-primary" />
                        <div>
                          <h4 className="text-sm font-semibold">{round.round_name}</h4>
                          <p className="text-[10px] text-muted-foreground">
                            {roundMatches.length} {roundMatches.length === 1 ? 'match' : 'matches'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); deleteRound(round.id); }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Matches */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border/50 p-4 space-y-3">
                            {roundMatches.map(match => {
                              const team1 = teams.find(t => t.id === match.team1_id);
                              const team2 = teams.find(t => t.id === match.team2_id);
                              const isEditing = editingMatch === match.id;

                              return (
                                <div 
                                  key={match.id}
                                  className={cn(
                                    "bg-muted/30 rounded-lg p-3 border border-border/30",
                                    match.is_completed && "border-victory/50"
                                  )}
                                >
                                  {isEditing ? (
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <Label className="text-[10px]">Team 1</Label>
                                          <Select 
                                            value={matchForm.team1_id || ''} 
                                            onValueChange={v => setMatchForm({ ...matchForm, team1_id: v || null })}
                                          >
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue placeholder="Select team" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {leagueTeams.map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.short_name}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Label className="text-[10px]">Team 2</Label>
                                          <Select 
                                            value={matchForm.team2_id || ''} 
                                            onValueChange={v => setMatchForm({ ...matchForm, team2_id: v || null })}
                                          >
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue placeholder="Select team" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {leagueTeams.map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.short_name}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-4 gap-2">
                                        <div>
                                          <Label className="text-[10px]">{matchForm.went_to_extra_time ? 'Final Score 1' : 'Score 1'}</Label>
                                          <Input 
                                            type="number" 
                                            min="0"
                                            value={matchForm.team1_score ?? ''} 
                                            onChange={e => setMatchForm({ ...matchForm, team1_score: e.target.value ? parseInt(e.target.value) : null })}
                                            className="h-8 text-xs"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-[10px]">{matchForm.went_to_extra_time ? 'Final Score 2' : 'Score 2'}</Label>
                                          <Input 
                                            type="number" 
                                            min="0"
                                            value={matchForm.team2_score ?? ''} 
                                            onChange={e => setMatchForm({ ...matchForm, team2_score: e.target.value ? parseInt(e.target.value) : null })}
                                            className="h-8 text-xs"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-[10px]">Date</Label>
                                          <Input 
                                            type="date"
                                            value={matchForm.match_date || ''} 
                                            onChange={e => setMatchForm({ ...matchForm, match_date: e.target.value || null })}
                                            className="h-8 text-xs"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-[10px]">Time</Label>
                                          <Input 
                                            type="time"
                                            value={matchForm.match_time || ''} 
                                            onChange={e => setMatchForm({ ...matchForm, match_time: e.target.value || null })}
                                            className="h-8 text-xs"
                                          />
                                        </div>
                                      </div>

                                      {/* Extra time toggle */}
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id={`extra-time-${match.id}`}
                                          checked={matchForm.went_to_extra_time || false}
                                          onChange={e => setMatchForm({ ...matchForm, went_to_extra_time: e.target.checked })}
                                          className="rounded"
                                        />
                                        <Label htmlFor={`extra-time-${match.id}`} className="text-xs">Went to Extra Time</Label>
                                      </div>

                                      {/* Extra time scores - only show when went to extra time */}
                                      {matchForm.went_to_extra_time && (
                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                          <Label className="text-[10px] text-blue-400 font-semibold mb-2 block">
                                            ⏱️ Score at 90 Minutes (Before Extra Time)
                                          </Label>
                                          <div className="grid grid-cols-2 gap-3">
                                            <div>
                                              <Label className="text-[10px]">Team 1 (90')</Label>
                                              <Input 
                                                type="number" 
                                                min="0"
                                                value={matchForm.team1_score_90 ?? ''} 
                                                onChange={e => setMatchForm({ ...matchForm, team1_score_90: e.target.value ? parseInt(e.target.value) : null })}
                                                className="h-8 text-xs"
                                                placeholder="Score at 90 min"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-[10px]">Team 2 (90')</Label>
                                              <Input 
                                                type="number" 
                                                min="0"
                                                value={matchForm.team2_score_90 ?? ''} 
                                                onChange={e => setMatchForm({ ...matchForm, team2_score_90: e.target.value ? parseInt(e.target.value) : null })}
                                                className="h-8 text-xs"
                                                placeholder="Score at 90 min"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Penalty shootout - only show when scores are tied */}
                                      {isScoresTied && (
                                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                                          <Label className="text-[10px] text-amber-500 font-semibold mb-2 block">
                                            ⚽ Penalty Shootout (Scores Tied{matchForm.went_to_extra_time ? ' After Extra Time' : ''})
                                          </Label>
                                          <div className="grid grid-cols-2 gap-3">
                                            <div>
                                              <Label className="text-[10px]">Team 1 Penalties</Label>
                                              <Input 
                                                type="number" 
                                                min="0"
                                                value={matchForm.team1_penalties ?? ''} 
                                                onChange={e => setMatchForm({ ...matchForm, team1_penalties: e.target.value ? parseInt(e.target.value) : null })}
                                                className="h-8 text-xs"
                                                placeholder="e.g. 4"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-[10px]">Team 2 Penalties</Label>
                                              <Input 
                                                type="number" 
                                                min="0"
                                                value={matchForm.team2_penalties ?? ''} 
                                                onChange={e => setMatchForm({ ...matchForm, team2_penalties: e.target.value ? parseInt(e.target.value) : null })}
                                                className="h-8 text-xs"
                                                placeholder="e.g. 5"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      <div>
                                        <Label className="text-[10px]">Venue</Label>
                                        <Input 
                                          value={matchForm.venue || ''} 
                                          onChange={e => setMatchForm({ ...matchForm, venue: e.target.value || null })}
                                          className="h-8 text-xs"
                                          placeholder="Enter venue"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id={`completed-${match.id}`}
                                          checked={matchForm.is_completed || false}
                                          onChange={e => setMatchForm({ ...matchForm, is_completed: e.target.checked })}
                                          className="rounded"
                                        />
                                        <Label htmlFor={`completed-${match.id}`} className="text-xs">Match Completed</Label>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={() => updateMatch(match.id)}>
                                          <Save className="w-3 h-3 mr-1" />
                                          Save
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => { setEditingMatch(null); setMatchForm({}); }}>
                                          <X className="w-3 h-3 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-muted overflow-hidden">
                                            {team1?.logo_url ? (
                                              <img src={team1.logo_url} alt={team1.name} className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-[10px]">
                                                {team1?.short_name?.charAt(0) || '?'}
                                              </div>
                                            )}
                                          </div>
                                          <span className={cn("text-sm", match.winner_id === match.team1_id && "font-semibold text-victory")}>
                                            {team1?.short_name || 'TBD'}
                                          </span>
                                        </div>
                                        <div className="text-center">
                                          <span className="text-sm font-display font-semibold">
                                            {match.team1_score ?? '-'} : {match.team2_score ?? '-'}
                                          </span>
                                          {match.went_to_extra_time && (
                                            <span className="block text-[10px] text-blue-400">
                                              (AET)
                                            </span>
                                          )}
                                          {match.team1_penalties !== null && match.team2_penalties !== null && (
                                            <span className="block text-[10px] text-amber-500">
                                              ({match.team1_penalties} - {match.team2_penalties} pens)
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className={cn("text-sm", match.winner_id === match.team2_id && "font-semibold text-victory")}>
                                            {team2?.short_name || 'TBD'}
                                          </span>
                                          <div className="w-6 h-6 rounded-full bg-muted overflow-hidden">
                                            {team2?.logo_url ? (
                                              <img src={team2.logo_url} alt={team2.name} className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-[10px]">
                                                {team2?.short_name?.charAt(0) || '?'}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {match.is_third_place_playoff && (
                                          <span className="text-[10px] text-amber-500 font-medium">🥉 3rd Place</span>
                                        )}
                                        {match.is_completed && (
                                          <span className="text-[10px] text-victory font-medium">Completed</span>
                                        )}
                                        <Button size="sm" variant="ghost" onClick={() => startEditMatch(match)}>
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          onClick={() => deleteMatch(match.id)}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <Button size="sm" variant="outline" onClick={() => addMatch(round.id)} className="w-full">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Match
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KnockoutManager;
