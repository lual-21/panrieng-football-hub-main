import { motion } from 'framer-motion';
import { ChevronRight, Trophy, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import plfaLogo from '@/assets/plfa-logo.jpeg';

export function HeroSection() {
  const queryClient = useQueryClient();

  // Fetch league count
  const { data: leagueCount = 0 } = useQuery({
    queryKey: ['hero-league-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('leagues')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  // Fetch team count
  const { data: teamCount = 0 } = useQuery({
    queryKey: ['hero-team-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  // Fetch total matches count (all matches - historical record)
  const { data: matchCount = 0 } = useQuery({
    queryKey: ['hero-match-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('hero-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leagues' }, () => {
        queryClient.invalidateQueries({ queryKey: ['hero-league-count'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        queryClient.invalidateQueries({ queryKey: ['hero-team-count'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        queryClient.invalidateQueries({ queryKey: ['hero-match-count'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const stats = [
    { icon: Trophy, label: 'Leagues', value: leagueCount.toString() },
    { icon: Users, label: 'Teams', value: teamCount.toString() },
    { icon: Calendar, label: 'Matches', value: matchCount.toString() },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl mb-6">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      
      {/* Floating orbs */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl"
      />
      <motion.div
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative px-6 py-8 sm:py-12">
        {/* Logo and Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative mb-4"
          >
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse-glow" />
            <img 
              src={plfaLogo} 
              alt="PLFA Logo" 
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-primary/50 shadow-glow"
            />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl font-display tracking-wider text-gradient-green mb-2"
          >
            PLFA
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm sm:text-base text-muted-foreground max-w-xs"
          >
            Panrieng Local Football Association
          </motion.p>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-4 sm:gap-8 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex flex-col items-center px-4 py-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30 min-w-[80px]"
            >
              <stat.icon className="w-5 h-5 text-primary mb-1" />
              <span className="text-xl sm:text-2xl font-display text-foreground">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <Link to="/matches">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm flex items-center gap-2 shadow-glow transition-all hover:bg-primary/90"
            >
              View Fixtures
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </Link>
          <Link to="/table">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-full bg-secondary border border-border/50 text-foreground font-medium text-sm flex items-center gap-2 transition-all hover:bg-secondary/80"
            >
              League Table
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
