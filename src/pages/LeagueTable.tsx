import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trophy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KnockoutBracket } from '@/components/bracket/KnockoutBracket';

const LeagueTable = () => {
  const queryClient = useQueryClient();
  const [selectedLeague, setSelectedLeague] = useState<string>('all');

  // Fetch leagues
  const { data: leagues } = useQuery({
    queryKey: ['leagues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const selectedLeagueData = leagues?.find(l => l.id === selectedLeague);
  const isKnockout = selectedLeagueData?.format === 'knockout';

  // Real-time subscription for standings updates
  useEffect(() => {
    const channel = supabase
      .channel('league-standings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        queryClient.invalidateQueries({ queryKey: ['league-table'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        queryClient.invalidateQueries({ queryKey: ['league-table'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knockout_rounds' }, () => {
        queryClient.invalidateQueries({ queryKey: ['knockout-bracket'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knockout_matches' }, () => {
        queryClient.invalidateQueries({ queryKey: ['knockout-bracket'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch teams for points-based leagues
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['league-table', selectedLeague],
    queryFn: async () => {
      let query = supabase.from('teams').select('*');
      
      if (selectedLeague !== 'all') {
        query = query.eq('league_id', selectedLeague);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate points and sort
      return data
        .map(team => ({
          ...team,
          points: (team.won || 0) * 3 + (team.drawn || 0),
          goalDifference: (team.goals_for || 0) - (team.goals_against || 0)
        }))
        .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
    },
    enabled: !isKnockout
  });

  // Fetch knockout bracket data
  const { data: bracketData, isLoading: bracketLoading } = useQuery({
    queryKey: ['knockout-bracket', selectedLeague],
    queryFn: async () => {
      // Fetch rounds
      const { data: rounds, error: roundsError } = await supabase
        .from('knockout_rounds')
        .select('*')
        .eq('league_id', selectedLeague)
        .order('round_order');
      
      if (roundsError) throw roundsError;
      
      // Fetch matches for these rounds
      const roundIds = rounds.map(r => r.id);
      const { data: matches, error: matchesError } = await supabase
        .from('knockout_matches')
        .select('*')
        .in('round_id', roundIds)
        .order('match_order');
      
      if (matchesError) throw matchesError;
      
      // Fetch all teams for this league
      const { data: leagueTeams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('league_id', selectedLeague);
      
      if (teamsError) throw teamsError;
      
      // Find third-place playoff match
      const thirdPlaceMatch = matches.find(m => m.is_third_place_playoff);
      const regularMatches = matches.filter(m => !m.is_third_place_playoff);
      
      return {
        rounds: rounds.map(round => ({
          ...round,
          matches: regularMatches.filter(m => m.round_id === round.id)
        })),
        teams: leagueTeams,
        thirdPlaceMatch
      };
    },
    enabled: isKnockout && selectedLeague !== 'all'
  });

  const isLoading = isKnockout ? bracketLoading : teamsLoading;

  if (isLoading) {
    return (
      <PageLayout title="Standings" subtitle="Current Standings">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Standings" subtitle="Current Standings">
      {/* League Selector */}
      {leagues && leagues.length > 0 && (
        <div className="mb-6">
          <Select value={selectedLeague} onValueChange={setSelectedLeague}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select league..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {leagues.map(league => (
                <SelectItem key={league.id} value={league.id}>
                  {league.name} ({league.format === 'knockout' ? 'Knockout' : 'League'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Knockout Bracket View */}
      {isKnockout && selectedLeague !== 'all' && bracketData && (
        <div className="bg-gradient-card border border-border/50 rounded-xl p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-gold" />
            <h3 className="font-display font-semibold">
              {selectedLeagueData?.name} - Knockout Bracket
            </h3>
          </div>
          <KnockoutBracket rounds={bracketData.rounds} teams={bracketData.teams} thirdPlaceMatch={bracketData.thirdPlaceMatch} />
        </div>
      )}

      {/* Points-Based League Table */}
      {!isKnockout && (
        <>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="min-w-[640px] rounded-xl bg-gradient-card border border-border/50 overflow-hidden">
              {/* Header - FIFA standard columns */}
              <div className="grid grid-cols-[36px_1fr_repeat(8,_40px)] gap-2 px-4 py-3.5 bg-secondary/60 border-b-2 border-b-primary/30 text-xs font-display uppercase tracking-wider text-muted-foreground">
                <span className="text-foreground">#</span>
                <span className="text-foreground">Team</span>
                <span className="text-center" title="Played">P</span>
                <span className="text-center" title="Won">W</span>
                <span className="text-center" title="Drawn">D</span>
                <span className="text-center" title="Lost">L</span>
                <span className="text-center" title="Goals For">GF</span>
                <span className="text-center" title="Goals Against">GA</span>
                <span className="text-center" title="Goal Difference">GD</span>
                <span className="text-center text-foreground" title="Points">Pts</span>
              </div>

              {/* Rows */}
              {teams?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No teams found in this league.</p>
                </div>
              )}
              {teams?.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "grid grid-cols-[36px_1fr_repeat(8,_40px)] gap-2 px-4 py-3.5 items-center border-t border-border/20",
                    "even:bg-muted/10 hover:bg-muted/20 transition-colors",
                    index === 0 && "bg-gold/5 border-l-2 border-l-gold",
                    index === 1 && "bg-primary/5 border-l-2 border-l-primary",
                    index === 2 && "bg-primary/5 border-l-2 border-l-primary/60"
                  )}
                >
                  <span className={cn(
                    "text-sm font-display tabular-nums",
                    index === 0 ? "text-gold" : index < 3 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {index + 1}
                  </span>

                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm flex-shrink-0 overflow-hidden border border-border/40">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-display text-muted-foreground">{team.short_name?.charAt(0)}</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground truncate">
                      {team.short_name}
                    </span>
                  </div>

                  <span className="text-center text-sm text-foreground tabular-nums">{team.played || 0}</span>
                  <span className="text-center text-sm text-victory tabular-nums">{team.won || 0}</span>
                  <span className="text-center text-sm text-draw tabular-nums">{team.drawn || 0}</span>
                  <span className="text-center text-sm text-defeat tabular-nums">{team.lost || 0}</span>
                  <span className="text-center text-sm text-foreground tabular-nums">{team.goals_for || 0}</span>
                  <span className="text-center text-sm text-foreground tabular-nums">{team.goals_against || 0}</span>
                  <span className={cn(
                    "text-center text-sm font-medium tabular-nums",
                    team.goalDifference > 0 ? "text-victory" :
                    team.goalDifference < 0 ? "text-defeat" : "text-muted-foreground"
                  )}>
                    {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                  </span>
                  <span className="text-center text-base font-display text-foreground font-bold tabular-nums">
                    {team.points}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gold" />
              <span>Champion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Top 3</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-victory" />
              <span>Win</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-draw" />
              <span>Draw</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-defeat" />
              <span>Loss</span>
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
};

export default LeagueTable;
