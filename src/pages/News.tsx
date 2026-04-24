import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { Calendar, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const News = () => {
  const { data: news, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <PageLayout title="News" subtitle="Latest Updates">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="News" subtitle="Latest Updates">
      <div className="space-y-4">
        {news?.map((article, index) => (
          <motion.article
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-card rounded-xl border border-border/50 overflow-hidden card-hover"
          >
            {/* Image */}
            <div className="h-32 bg-muted flex items-center justify-center overflow-hidden">
              {article.image_url ? (
                <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl opacity-30">📰</span>
              )}
            </div>

            <div className="p-4">
              <span className={cn(
                "inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full mb-2",
                article.category === 'Match Report' && "bg-primary/20 text-primary",
                article.category === 'Transfer News' && "bg-accent/20 text-accent",
                article.category === 'Announcement' && "bg-muted text-muted-foreground",
                article.category === 'Feature' && "bg-gold/20 text-gold"
              )}>
                {article.category}
              </span>

              <h3 className="text-lg font-display tracking-wide text-foreground mb-2">
                {article.title}
              </h3>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {article.excerpt}
              </p>

              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {article.author || 'PLFA Media'}
                </span>
              </div>
            </div>
          </motion.article>
        ))}
        {(!news || news.length === 0) && (
          <p className="text-center text-muted-foreground py-8">No news articles found</p>
        )}
      </div>
    </PageLayout>
  );
};

export default News;
