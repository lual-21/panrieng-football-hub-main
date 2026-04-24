import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Star, ChevronRight, Loader2, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const PLAYERS_PER_PAGE = 20;

const Players = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(PLAYERS_PER_PAGE);

  // Real-time subscription for player stats updates via match events
  useEffect(() => {
    const channel = supabase
      .channel('players-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events' }, () => {
        queryClient.invalidateQueries({ queryKey: ['players-with-teams'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        queryClient.invalidateQueries({ queryKey: ['players-with-teams'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: players, isLoading } = useQuery({
    queryKey: ['players-with-teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(short_name, name, id)
        `)
        .order('rating', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const positions = useMemo(() => {
    if (!players) return [];
    const uniquePositions = [...new Set(players.map(p => p.position))];
    return uniquePositions.sort();
  }, [players]);

  const teams = useMemo(() => {
    if (!players) return [];
    const uniqueTeams = players
      .filter(p => p.team)
      .map(p => ({ id: p.team!.id, name: p.team!.short_name }))
      .filter((team, index, self) => self.findIndex(t => t.id === team.id) === index);
    return uniqueTeams.sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    
    return players.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPosition = positionFilter === 'all' || player.position === positionFilter;
      const matchesTeam = teamFilter === 'all' || player.team?.id === teamFilter;
      
      return matchesSearch && matchesPosition && matchesTeam;
    });
  }, [players, searchQuery, positionFilter, teamFilter]);

  // Reset visible count when filters change
  const handleFilterChange = (setter: (val: string) => void) => (value: string) => {
    setter(value);
    setVisibleCount(PLAYERS_PER_PAGE);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setVisibleCount(PLAYERS_PER_PAGE);
  };

  const visiblePlayers = filteredPlayers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPlayers.length;

  const loadMore = () => {
    setVisibleCount(prev => prev + PLAYERS_PER_PAGE);
  };

  if (isLoading) {
    return (
      <PageLayout title="Player Hub" subtitle="Global Rankings">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Player Hub" subtitle="Global Rankings">
      <div className="space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="flex gap-2">
            <Select value={positionFilter} onValueChange={handleFilterChange(setPositionFilter)}>
              <SelectTrigger className="flex-1 bg-card border-border">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {positions.map(pos => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={teamFilter} onValueChange={handleFilterChange(setTeamFilter)}>
              <SelectTrigger className="flex-1 bg-card border-border">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          Showing {visiblePlayers.length} of {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
        </p>

        {/* Player List */}
        <div className="space-y-2">
          {visiblePlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 10) * 0.03 }}
            >
              <Link
                to={`/players/${player.id}`}
                className="flex items-center gap-3 bg-gradient-card rounded-xl border border-border/50 p-3 card-hover group"
              >
                <span className={`w-6 text-center font-display text-sm ${
                  index === 0 ? 'text-gold' : index === 1 ? 'text-foreground/70' : index === 2 ? 'text-orange-400' : 'text-muted-foreground'
                }`}>
                  {index + 1}
                </span>

                {player.photo_url ? (
                  <img 
                    src={player.photo_url} 
                    alt={player.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-display text-muted-foreground">
                    {player.name.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {player.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {player.team?.short_name || 'Free Agent'} · {player.position}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-gold fill-gold" />
                  <span className="text-sm font-semibold text-gold">{(player.rating || 5).toFixed(1)}</span>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center pt-2 pb-4">
            <Button 
              variant="outline" 
              onClick={loadMore}
              className="w-full max-w-xs"
            >
              Load More ({filteredPlayers.length - visibleCount} remaining)
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Players;
