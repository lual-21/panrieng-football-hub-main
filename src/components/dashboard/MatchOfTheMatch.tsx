import { motion } from 'framer-motion';
import { Star, Trophy, Crown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function MatchOfTheMatch() {
  const { data: lastMatch, isLoading } = useQuery({
    queryKey: ['last-match-motm'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          motm_player:players!matches_motm_player_id_fkey(
            id,
            name,
            photo_url,
            position,
            rating,
            team:teams(name, short_name)
          )
        `)
        .eq('is_completed', true)
        .not('motm_player_id', 'is', null)
        .order('match_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
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

  const motmPlayer = lastMatch?.motm_player;

  if (!motmPlayer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-card to-card" />
      
      {/* Animated sparkles */}
      <motion.div
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -top-10 -right-10 w-32 h-32 bg-gold/20 rounded-full blur-3xl"
      />
      
      <div className="relative border border-gold/30 rounded-2xl overflow-hidden">
        {/* Gold accent bar */}
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3 }}
          className="h-1 bg-gradient-to-r from-gold via-gold-light to-gold origin-left"
        />
        
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center border border-gold/30"
            >
              <Trophy className="w-5 h-5 text-gold" />
            </motion.div>
            <div>
              <h3 className="text-base font-display text-gold tracking-wide">Man of the Match</h3>
              <p className="text-[10px] text-muted-foreground">Last Game Performance</p>
            </div>
          </div>

          {/* Player card */}
          <Link to={`/players/${motmPlayer.id}`}>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gold/10 to-transparent border border-gold/20"
            >
              {/* Player avatar */}
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-gold/30"
                />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-2xl font-display text-muted-foreground border-2 border-gold/50 overflow-hidden">
                  {motmPlayer.photo_url ? (
                    <img src={motmPlayer.photo_url} alt={motmPlayer.name} className="w-full h-full object-cover" />
                  ) : (
                    motmPlayer.name.charAt(0)
                  )}
                </div>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-gold"
                >
                  <Crown className="w-4 h-4 text-accent-foreground" />
                </motion.div>
              </div>

              {/* Player info */}
              <div className="flex-1">
                <motion.h4 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-xl tracking-wide text-foreground mb-1"
                >
                  {motmPlayer.name}
                </motion.h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {motmPlayer.team?.name || 'Unknown Team'} · {motmPlayer.position}
                </p>
                
                {/* Star rating */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                    >
                      <Star
                        className={`w-4 h-4 ${i < Math.round((motmPlayer.rating || 5) / 2) ? 'text-gold fill-gold' : 'text-muted-foreground/30'}`}
                      />
                    </motion.div>
                  ))}
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="ml-2 text-sm font-display text-gold"
                  >
                    {(motmPlayer.rating || 5).toFixed(1)}
                  </motion.span>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
