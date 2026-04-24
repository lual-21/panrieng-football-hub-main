import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Teams = () => {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <PageLayout title="Teams" subtitle="Team Directory">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Teams" subtitle="Team Directory">
      <div className="grid grid-cols-2 gap-3">
        {teams?.map((team, index) => {
          const points = (team.won || 0) * 3 + (team.drawn || 0);
          
          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/teams/${team.id}`}
                className="block bg-gradient-card rounded-xl border border-border/50 p-4 card-hover group"
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform overflow-hidden">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-display text-muted-foreground">{team.short_name?.charAt(0)}</span>
                  )}
                </div>
                
                <h3 className="text-sm font-display text-center text-foreground tracking-wide truncate mb-1">
                  {team.name}
                </h3>
                
                <p className="text-[10px] text-muted-foreground text-center">
                  Est. {team.founded || 'N/A'}
                </p>

                <div className="mt-3 pt-3 border-t border-border/30 flex justify-between text-[10px]">
                  <div className="text-center">
                    <p className="font-display text-foreground">{points}</p>
                    <p className="text-muted-foreground">Pts</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-foreground">{team.won || 0}</p>
                    <p className="text-muted-foreground">W</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-foreground">{team.drawn || 0}</p>
                    <p className="text-muted-foreground">D</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-foreground">{team.lost || 0}</p>
                    <p className="text-muted-foreground">L</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </PageLayout>
  );
};

export default Teams;
