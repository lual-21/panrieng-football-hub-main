import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { MapPin, User, Calendar, ChevronRight, Target, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TeamDetail = () => {
  const { teamId } = useParams();

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!teamId
  });

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['team-players', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('number');
      
      if (error) throw error;
      return data;
    },
    enabled: !!teamId
  });

  if (teamLoading || playersLoading) {
    return (
      <PageLayout title="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!team) {
    return (
      <PageLayout title="Team Not Found">
        <p className="text-center text-muted-foreground py-8">Team not found</p>
      </PageLayout>
    );
  }

  const totalGoals = players?.reduce((sum, p) => sum + (p.goals || 0), 0) || 0;
  const cleanSheets = 0; // Can be calculated from matches if needed
  const totalCards = players?.reduce((sum, p) => sum + (p.yellow_cards || 0) + (p.red_cards || 0), 0) || 0;

  return (
    <PageLayout title={team.short_name} subtitle={team.name}>
      {/* Team header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-card rounded-xl border border-border/50 p-5 mb-4"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-4xl overflow-hidden">
            {team.logo_url ? (
              <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-display text-muted-foreground">{team.short_name?.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display tracking-wide text-foreground mb-1">
              {team.name}
            </h2>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {team.founded && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Est. {team.founded}
                </span>
              )}
              {team.stadium && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {team.stadium}
                </span>
              )}
              {team.manager && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {team.manager}
                </span>
              )}
            </div>
          </div>
        </div>

        {team.description && (
          <p className="text-sm text-muted-foreground mb-4">{team.description}</p>
        )}

        {/* Team Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-display text-foreground">{totalGoals}</p>
            <p className="text-[10px] text-muted-foreground">Goals</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-victory" />
            <p className="text-lg font-display text-foreground">{cleanSheets}</p>
            <p className="text-[10px] text-muted-foreground">Clean Sheets</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-warning-yellow" />
            <p className="text-lg font-display text-foreground">{totalCards}</p>
            <p className="text-[10px] text-muted-foreground">Cards</p>
          </div>
        </div>
      </motion.div>

      {/* Squad List */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
          Squad
        </h3>
        <div className="space-y-2">
          {players?.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/players/${player.id}`}
                className="flex items-center gap-3 bg-gradient-card rounded-lg border border-border/50 p-3 card-hover group"
              >
                {player.photo_url ? (
                  <img 
                    src={player.photo_url} 
                    alt={player.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-display text-muted-foreground">
                    {player.number}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {player.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{player.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">{player.goals || 0} G</p>
                  <p className="text-[10px] text-muted-foreground">{player.assists || 0} A</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </motion.div>
          ))}
          {(!players || players.length === 0) && (
            <p className="text-center text-muted-foreground py-4">No players found</p>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default TeamDetail;
