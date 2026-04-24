import { motion } from 'framer-motion';
import { TrendingUp, Medal, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

const rankColors = [
  'from-gold to-gold/50 text-gold border-gold/30',
  'from-foreground/60 to-foreground/20 text-foreground/70 border-foreground/20',
  'from-orange-500 to-orange-500/50 text-orange-400 border-orange-400/30',
  'from-muted-foreground to-muted-foreground/50 text-muted-foreground border-muted-foreground/30',
  'from-muted-foreground to-muted-foreground/50 text-muted-foreground border-muted-foreground/30',
];

export function TopScorers() {
  const { data: topScorers, isLoading } = useQuery({
    queryKey: ['top-scorers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(short_name, name)
        `)
        .order('goals', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gradient-card border border-border/50 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-gradient-card border border-border/50 overflow-hidden"
    >
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20"
            >
              <TrendingUp className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <h3 className="text-base font-display text-foreground tracking-wide">Top Scorers</h3>
              <p className="text-[10px] text-muted-foreground">Season leaders</p>
            </div>
          </div>
          <Link to="/players" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="divide-y divide-border/30"
      >
        {topScorers?.map((player, index) => (
          <motion.div
            key={player.id}
            variants={itemVariants}
            whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}
            className="transition-colors"
          >
            <Link
              to={`/players/${player.id}`}
              className="flex items-center gap-4 p-4"
            >
              {/* Rank badge */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`relative w-8 h-8 rounded-lg bg-gradient-to-br ${rankColors[index]} flex items-center justify-center border`}
              >
                {index === 0 && <Medal className="w-4 h-4" />}
                {index !== 0 && <span className="font-display text-sm">{index + 1}</span>}
              </motion.div>
              
              {/* Player avatar */}
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50 overflow-hidden"
              >
                {player.photo_url ? (
                  <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-display text-muted-foreground">
                    {player.name.charAt(0)}
                  </span>
                )}
              </motion.div>
              
              {/* Player info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {player.name}
                </p>
                <p className="text-[10px] text-muted-foreground">{player.team?.short_name || 'Free Agent'}</p>
              </div>
              
              {/* Goals */}
              <div className="text-right">
                <motion.p 
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  className="text-xl font-display text-primary"
                >
                  {player.goals || 0}
                </motion.p>
                <p className="text-[10px] text-muted-foreground">goals</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
