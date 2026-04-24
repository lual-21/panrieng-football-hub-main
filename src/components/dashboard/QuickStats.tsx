import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, Target, Star, Award, Flame, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export function QuickStats() {
  const queryClient = useQueryClient();

  // Real-time subscription for stats updates
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leagues' }, () => {
        queryClient.invalidateQueries({ queryKey: ['league-count'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        queryClient.invalidateQueries({ queryKey: ['team-count'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        queryClient.invalidateQueries({ queryKey: ['matches-played-count'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        queryClient.invalidateQueries({ queryKey: ['top-scorer'] });
        queryClient.invalidateQueries({ queryKey: ['top-assister'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events' }, () => {
        queryClient.invalidateQueries({ queryKey: ['top-scorer'] });
        queryClient.invalidateQueries({ queryKey: ['top-assister'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: topScorer, isLoading: scorerLoading } = useQuery({
    queryKey: ['top-scorer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(short_name)
        `)
        .order('goals', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: topAssister, isLoading: assisterLoading } = useQuery({
    queryKey: ['top-assister'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(short_name)
        `)
        .order('assists', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: leagueCount, isLoading: leagueLoading } = useQuery({
    queryKey: ['league-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('leagues')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: teamCount, isLoading: teamLoading } = useQuery({
    queryKey: ['team-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: matchesPlayed, isLoading: matchLoading } = useQuery({
    queryKey: ['matches-played-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', true);
      
      if (error) throw error;
      return count || 0;
    }
  });

  const isLoading = scorerLoading || assisterLoading || leagueLoading || teamLoading || matchLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl bg-gradient-card border border-border/50 p-3 h-20 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl bg-gradient-card border border-border/50 p-4 h-32 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 mb-6"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div variants={itemVariants}>
          <Link to="/table" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl bg-gradient-card border border-border/50 p-3 text-center"
            >
              <Trophy className="w-5 h-5 text-gold mx-auto mb-1" />
              <p className="text-xl font-display text-foreground">{leagueCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Leagues</p>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/teams" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl bg-gradient-card border border-border/50 p-3 text-center"
            >
              <Users className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-display text-foreground">{teamCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Teams</p>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/matches" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl bg-gradient-card border border-border/50 p-3 text-center"
            >
              <Calendar className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-xl font-display text-foreground">{matchesPlayed}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Played</p>
            </motion.div>
          </Link>
        </motion.div>
      </div>

      {/* Top Performer Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Top Scorer Card */}
        <motion.div variants={itemVariants}>
          <Link to="/players" className="block">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gold/20 via-card to-card border border-gold/30 p-4 h-full"
            >
              <div className="absolute top-2 right-2">
                <Target className="w-8 h-8 text-gold/30" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-gold" />
                  <span className="text-[10px] uppercase tracking-wider text-gold font-semibold">Top Scorer</span>
                </div>
                <p className="text-base font-display text-foreground truncate">{topScorer?.name || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">{topScorer?.team?.short_name || '-'}</p>
                <p className="text-2xl font-display text-gold mt-1">{topScorer?.goals || 0} <span className="text-xs text-muted-foreground">goals</span></p>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Top Assists Card */}
        <motion.div variants={itemVariants}>
          <Link to="/players" className="block">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-card to-card border border-primary/30 p-4 h-full"
            >
              <div className="absolute top-2 right-2">
                <Star className="w-8 h-8 text-primary/30" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Top Assists</span>
                </div>
                <p className="text-base font-display text-foreground truncate">{topAssister?.name || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">{topAssister?.team?.short_name || '-'}</p>
                <p className="text-2xl font-display text-primary mt-1">{topAssister?.assists || 0} <span className="text-xs text-muted-foreground">assists</span></p>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
