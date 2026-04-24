import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { Calendar, Clock, MapPin, Trophy, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Tab = 'upcoming' | 'results';

interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
}

interface Player {
  id: string;
  name: string;
}

interface Match {
  id: string;
  match_date: string;
  match_time: string;
  venue: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  is_completed: boolean;
  motm_player_id: string | null;
  league_id: string | null;
  home_team: Team;
  away_team: Team;
  motm_player: Player | null;
}

interface League {
  id: string;
  name: string;
  short_name: string;
}

const Matches = () => {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagues();
    fetchMatches();
  }, []);

  // Real-time subscription for matches updates
  useEffect(() => {
    const channel = supabase
      .channel('matches-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        fetchMatches();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchMatches();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leagues' }, () => {
        fetchLeagues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeagues = async () => {
    const { data } = await supabase
      .from('leagues')
      .select('id, name, short_name')
      .eq('is_active', true)
      .order('name');
    
    if (data) setLeagues(data);
  };

  const fetchMatches = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, short_name, logo_url),
        away_team:teams!matches_away_team_id_fkey(id, name, short_name, logo_url),
        motm_player:players!matches_motm_player_id_fkey(id, name)
      `)
      .order('match_date', { ascending: true });
    
    if (data) setMatches(data as Match[]);
    setLoading(false);
  };

  const filteredMatches = matches.filter(match => {
    if (selectedLeague !== 'all' && match.league_id !== selectedLeague) return false;
    return true;
  });

  const upcomingMatches = filteredMatches.filter(m => !m.is_completed);
  const completedMatches = filteredMatches.filter(m => m.is_completed).reverse();

  const MatchCard = ({ match, isResult = false }: { match: Match; isResult?: boolean }) => {
    const homeTeam = match.home_team;
    const awayTeam = match.away_team;
    const motmPlayer = match.motm_player;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-card rounded-xl border border-border/50 p-4 card-hover"
      >
        {/* Date and venue */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <Clock className="w-3 h-3 ml-2" />
            <span>{match.match_time?.slice(0, 5)}</span>
          </div>
          {isResult && (
            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">
              FT
            </span>
          )}
        </div>

        {/* Teams and score */}
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center overflow-hidden mb-1">
              {homeTeam?.logo_url ? (
                <img src={homeTeam.logo_url} alt={homeTeam.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-display text-muted-foreground">{homeTeam?.short_name?.charAt(0)}</span>
              )}
            </div>
            <p className="text-xs font-medium text-foreground">{homeTeam?.short_name}</p>
          </div>

          <div className="px-4">
            {isResult ? (
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-2xl font-display",
                  (match.home_score ?? 0) > (match.away_score ?? 0) ? "text-victory" : (match.home_score ?? 0) < (match.away_score ?? 0) ? "text-defeat" : "text-draw"
                )}>
                  {match.home_score}
                </span>
                <span className="text-muted-foreground">-</span>
                <span className={cn(
                  "text-2xl font-display",
                  (match.away_score ?? 0) > (match.home_score ?? 0) ? "text-victory" : (match.away_score ?? 0) < (match.home_score ?? 0) ? "text-defeat" : "text-draw"
                )}>
                  {match.away_score}
                </span>
              </div>
            ) : (
              <span className="text-lg font-display text-muted-foreground">VS</span>
            )}
          </div>

          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center overflow-hidden mb-1">
              {awayTeam?.logo_url ? (
                <img src={awayTeam.logo_url} alt={awayTeam.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-display text-muted-foreground">{awayTeam?.short_name?.charAt(0)}</span>
              )}
            </div>
            <p className="text-xs font-medium text-foreground">{awayTeam?.short_name}</p>
          </div>
        </div>

        {/* Venue */}
        <div className="flex items-center justify-center gap-1 mt-3 text-[10px] text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{match.venue}</span>
        </div>

        {/* MOTM for results */}
        {isResult && motmPlayer && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-3 h-3 text-gold" />
              <span className="text-[10px] text-gold">MOTM: {motmPlayer.name}</span>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <PageLayout title="Match Center" subtitle="Fixtures & Results">
      {/* League Filter */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedLeague} onValueChange={setSelectedLeague}>
            <SelectTrigger className="w-full bg-card border-border">
              <SelectValue placeholder="All Competitions" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Competitions</SelectItem>
              {leagues.map((league) => (
                <SelectItem key={league.id} value={league.id}>
                  {league.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['upcoming', 'results'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {tab === 'upcoming' ? 'Upcoming' : 'Results'}
          </button>
        ))}
      </div>

      {/* Match List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + selectedLeague}
          initial={{ opacity: 0, x: activeTab === 'upcoming' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === 'upcoming' ? 20 : -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === 'upcoming' ? (
            upcomingMatches.length > 0 ? (
              upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No upcoming matches</p>
            )
          ) : (
            completedMatches.length > 0 ? (
              completedMatches.map((match) => (
                <MatchCard key={match.id} match={match} isResult />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No completed matches</p>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </PageLayout>
  );
};

export default Matches;
