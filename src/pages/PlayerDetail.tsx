import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { supabase } from '@/integrations/supabase/client';
import { Star, Target, Handshake, Calendar, Flag, AlertTriangle, XCircle, ZoomIn, X, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerFormBadge } from '@/components/player/PlayerFormBadge';

interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  age: number | null;
  nationality: string | null;
  team_id: string | null;
  photo_url: string | null;
  appearances: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  rating: number;
}

interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
}

const PlayerDetail = () => {
  const { playerId } = useParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const fetchPlayer = async () => {
      if (!playerId) return;
      
      setLoading(true);
      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();
      
      if (playerData) {
        setPlayer(playerData);
        
        if (playerData.team_id) {
          const { data: teamData } = await supabase
            .from('teams')
            .select('id, name, short_name, logo_url')
            .eq('id', playerData.team_id)
            .single();
          
          if (teamData) setTeam(teamData);
        }
      }
      setLoading(false);
    };

    fetchPlayer();
  }, [playerId]);

  if (loading) {
    return (
      <PageLayout title="Loading...">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!player) {
    return (
      <PageLayout title="Player Not Found">
        <p className="text-center text-muted-foreground py-8">Player not found</p>
      </PageLayout>
    );
  }

  const StatCard = ({ icon: Icon, label, value, color = 'text-foreground' }: { icon: any; label: string; value: string | number; color?: string }) => (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />
      <p className={cn("text-lg font-display", color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );

  const PlayerAvatar = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
    const sizeClasses = {
      sm: 'w-16 h-16 text-2xl',
      md: 'w-20 h-20 text-3xl',
      lg: 'w-32 h-32 text-6xl'
    };
    
    if (player.photo_url) {
      return (
        <img 
          src={player.photo_url} 
          alt={player.name}
          className={cn(
            "rounded-full object-cover border-2 border-primary/30",
            sizeClasses[size],
            className
          )}
        />
      );
    }
    
    return (
      <div className={cn(
        "rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center font-display text-foreground",
        sizeClasses[size],
        className
      )}>
        {player.name.charAt(0)}
      </div>
    );
  };

  return (
    <PageLayout title={player.name} subtitle={player.position}>
      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg p-4"
            onClick={() => setIsZoomed(false)}
          >
            <motion.button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsZoomed(false)}
            >
              <X className="w-5 h-5" />
            </motion.button>
            
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-full max-w-lg bg-gradient-card rounded-2xl border border-border/50 p-8 overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Zoomed Player Avatar */}
              <div className="flex flex-col items-center mb-6">
                <motion.div 
                  className="relative mb-4"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <PlayerAvatar size="lg" className="shadow-glow" />
                  <motion.div 
                    className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    <span className="text-lg font-bold text-primary-foreground">{player.number}</span>
                  </motion.div>
                </motion.div>
                
                <motion.h2 
                  className="text-3xl font-display tracking-wide text-foreground mb-1"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  {player.name}
                </motion.h2>
                <motion.p 
                  className="text-lg text-primary font-semibold"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {player.position}
                </motion.p>
              </div>

              {/* Zoomed Rating */}
              <motion.div 
                className="flex items-center justify-center gap-3 mb-6 p-4 bg-muted/50 rounded-xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-7 h-7 ${i < Math.round((player.rating || 5) / 2) ? 'text-gold fill-gold' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
                <span className="text-4xl font-display text-gold">{(player.rating || 5).toFixed(1)}</span>
              </motion.div>

              {/* Zoomed Form Badge */}
              <motion.div 
                className="flex justify-center mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <PlayerFormBadge
                  goals={player.goals || 0}
                  assists={player.assists || 0}
                  appearances={player.appearances || 0}
                  yellowCards={player.yellow_cards || 0}
                  redCards={player.red_cards || 0}
                  currentRating={player.rating || 5}
                  showProjected={true}
                  size="lg"
                />
              </motion.div>

              {/* Zoomed Stats */}
              <motion.div 
                className="grid grid-cols-3 gap-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Target className="w-6 h-6 mx-auto mb-2 text-victory" />
                  <p className="text-2xl font-display text-victory">{player.goals || 0}</p>
                  <p className="text-xs text-muted-foreground">Goals</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Handshake className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-display text-primary">{player.assists || 0}</p>
                  <p className="text-xs text-muted-foreground">Assists</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-accent" />
                  <p className="text-2xl font-display text-accent">{player.appearances || 0}</p>
                  <p className="text-xs text-muted-foreground">Games</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Header - Clickable for Zoom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-card rounded-xl border border-border/50 p-5 mb-4 cursor-pointer relative group"
        onClick={() => setIsZoomed(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Zoom indicator */}
        <motion.div
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          whileHover={{ scale: 1.1 }}
        >
          <ZoomIn className="w-4 h-4 text-primary" />
        </motion.div>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <PlayerAvatar size="md" className="group-hover:shadow-glow transition-shadow" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">{player.number}</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display tracking-wide text-foreground mb-1">
              {player.name}
            </h2>
            {team && (
              <Link
                to={`/teams/${team.id}`}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-5 h-5 object-contain" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span>{team.name}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${i < Math.round((player.rating || 5) / 2) ? 'text-gold fill-gold' : 'text-muted-foreground/30'}`}
              />
            ))}
          </div>
          <span className="text-2xl font-display text-gold">{(player.rating || 5).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">Performance Rating</span>
        </div>

        {/* Bio */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs mb-4">
          <div className="flex flex-col items-center gap-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{player.age || '-'} years</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Flag className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{player.nationality || '-'}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            {team?.logo_url ? (
              <img src={team.logo_url} alt={team.name} className="w-5 h-5 object-contain" />
            ) : (
              <User className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-foreground font-medium">{team?.short_name || '-'}</span>
          </div>
        </div>

        {/* Form Badge */}
        <div className="flex justify-center">
          <PlayerFormBadge
            goals={player.goals || 0}
            assists={player.assists || 0}
            appearances={player.appearances || 0}
            yellowCards={player.yellow_cards || 0}
            redCards={player.red_cards || 0}
            currentRating={player.rating || 5}
            showProjected={true}
            size="md"
          />
        </div>
      </motion.div>

      {/* Season Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
          Season Stats
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Calendar} label="Appearances" value={player.appearances || 0} />
          <StatCard icon={Target} label="Goals" value={player.goals || 0} color="text-victory" />
          <StatCard icon={Handshake} label="Assists" value={player.assists || 0} color="text-primary" />
        </div>
      </motion.div>

      {/* Discipline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
          Discipline
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={AlertTriangle} label="Yellow Cards" value={player.yellow_cards || 0} color="text-warning-yellow" />
          <StatCard icon={XCircle} label="Red Cards" value={player.red_cards || 0} color="text-red-card" />
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default PlayerDetail;
