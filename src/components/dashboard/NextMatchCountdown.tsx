import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Zap, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function NextMatchCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const { data: nextMatch, isLoading } = useQuery({
    queryKey: ['next-match'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, short_name, logo_url),
          away_team:teams!matches_away_team_id_fkey(id, name, short_name, logo_url)
        `)
        .eq('is_completed', false)
        .gte('match_date', today)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (!nextMatch) return;

    const calculateTimeLeft = () => {
      const matchDate = new Date(`${nextMatch.match_date}T${nextMatch.match_time}`);
      const now = new Date();
      const difference = matchDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [nextMatch]);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gradient-card border border-border/50 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!nextMatch) return null;

  const homeTeam = nextMatch.home_team;
  const awayTeam = nextMatch.away_team;

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <motion.div 
      className="text-center"
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        key={value}
        initial={{ rotateX: -90, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-b from-muted to-muted/50 border border-border/50 flex items-center justify-center shadow-lg overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <span className="relative text-2xl sm:text-3xl font-display text-foreground">
          {value.toString().padStart(2, '0')}
        </span>
      </motion.div>
      <span className="text-[10px] font-medium text-muted-foreground mt-2 block uppercase tracking-wider">{label}</span>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card to-accent/5" />
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      
      {/* Animated glow */}
      <motion.div
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/30 rounded-full blur-3xl"
      />

      <div className="relative border border-primary/30 rounded-2xl p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <Clock className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <h3 className="text-base font-display text-primary tracking-wide">Next Match</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(nextMatch.match_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10"
          >
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-primary font-medium">UPCOMING</span>
          </motion.div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <motion.div 
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center flex-1"
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-3xl mb-2 border border-border/50 shadow-lg overflow-hidden"
            >
              {homeTeam?.logo_url ? (
                <img src={homeTeam.logo_url} alt={homeTeam.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-display text-muted-foreground">{homeTeam?.short_name?.charAt(0)}</span>
              )}
            </motion.div>
            <p className="text-sm font-display text-foreground">{homeTeam?.short_name}</p>
            <p className="text-[10px] text-muted-foreground">Home</p>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
              <span className="text-lg font-display text-primary">VS</span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center flex-1"
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-3xl mb-2 border border-border/50 shadow-lg overflow-hidden"
            >
              {awayTeam?.logo_url ? (
                <img src={awayTeam.logo_url} alt={awayTeam.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-display text-muted-foreground">{awayTeam?.short_name?.charAt(0)}</span>
              )}
            </motion.div>
            <p className="text-sm font-display text-foreground">{awayTeam?.short_name}</p>
            <p className="text-[10px] text-muted-foreground">Away</p>
          </motion.div>
        </div>

        {/* Countdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center gap-3 mb-4"
        >
          <TimeBlock value={timeLeft.days} label="Days" />
          <div className="flex items-center text-2xl text-muted-foreground font-light">:</div>
          <TimeBlock value={timeLeft.hours} label="Hours" />
          <div className="flex items-center text-2xl text-muted-foreground font-light">:</div>
          <TimeBlock value={timeLeft.minutes} label="Mins" />
          <div className="flex items-center text-2xl text-muted-foreground font-light">:</div>
          <TimeBlock value={timeLeft.seconds} label="Secs" />
        </motion.div>

        {/* Venue */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
        >
          <MapPin className="w-4 h-4" />
          <span>{nextMatch.venue}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
