import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { ArrowLeft, Calendar, User, Sparkles, ImageIcon, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState } from 'react';

const NewsDetail = () => {
  const { newsId } = useParams<{ newsId: string }>();
  const [imageZoomed, setImageZoomed] = useState(false);

  const { data: article, isLoading } = useQuery({
    queryKey: ['news-article', newsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', newsId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!newsId
  });

  if (isLoading) {
    return (
      <PageLayout title="Loading..." subtitle="News">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!article) {
    return (
      <PageLayout title="Not Found" subtitle="News">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Article not found</p>
          <Link 
            to="/news" 
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to News
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="" subtitle="">
      <div className="space-y-6">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link 
            to="/news" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to News
          </Link>
        </motion.div>

        {/* Hero Image */}
        {article.image_url ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => setImageZoomed(true)}
          >
            <img 
              src={article.image_url} 
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-background/80 backdrop-blur-sm rounded-full p-3">
                <ImageIcon className="w-6 h-6 text-foreground" />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative aspect-video rounded-2xl overflow-hidden bg-muted/30 flex items-center justify-center"
          >
            <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
          </motion.div>
        )}

        {/* Article Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Category Badge */}
          <span 
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider",
              article.category === 'Match Report' && "bg-primary/20 text-primary border border-primary/30",
              article.category === 'Transfer News' && "bg-accent/20 text-accent border border-accent/30",
              article.category === 'Announcement' && "bg-muted text-foreground border border-border",
              article.category === 'Feature' && "bg-gold/20 text-gold border border-gold/30"
            )}
          >
            <Sparkles className="w-3 h-3" />
            {article.category}
          </span>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-display tracking-wide text-foreground leading-tight">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{article.author || 'PLFA Media'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(article.published_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        </motion.div>

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-card rounded-2xl border border-border/50 p-6"
        >
          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-lg text-foreground/90 font-medium leading-relaxed mb-6 pb-6 border-b border-border/50">
              {article.excerpt}
            </p>
          )}

          {/* Main Content */}
          {article.content ? (
            <div className="prose prose-invert max-w-none">
              {article.content.split('\n').map((paragraph, index) => (
                paragraph.trim() && (
                  <p key={index} className="text-muted-foreground leading-relaxed mb-4 last:mb-0">
                    {paragraph}
                  </p>
                )
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No additional content available.</p>
          )}
        </motion.div>

        {/* Image Zoom Dialog */}
        <Dialog open={imageZoomed} onOpenChange={setImageZoomed}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border">
            {article.image_url && (
              <motion.img
                src={article.image_url}
                alt={article.title}
                className="w-full h-auto max-h-[85vh] object-contain"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default NewsDetail;
