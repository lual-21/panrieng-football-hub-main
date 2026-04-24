import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Newspaper, ArrowRight, Sparkles, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
  }),
};

const imageVariants: Variants = {
  hidden: { scale: 1.2, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
  },
};

const contentVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

export function NewsHighlights() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: news, isLoading } = useQuery({
    queryKey: ['news-highlights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  // Real-time subscription for news updates
  useEffect(() => {
    const channel = supabase
      .channel('news-highlights-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
        queryClient.invalidateQueries({ queryKey: ['news-highlights'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    if (isPaused || !news?.length) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, news?.length]);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gradient-card border border-border/50 p-8 flex items-center justify-center h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!news?.length) {
    return (
      <div className="rounded-2xl bg-gradient-card border border-border/50 p-8 flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">No news available</p>
      </div>
    );
  }

  const goTo = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const goNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % news.length);
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
  };

  const currentNews = news[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-card border border-border/50"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Animated background gradient */}
      <motion.div 
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 100% 100%, hsl(var(--primary) / 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 0% 100%, hsl(var(--primary) / 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 100% 0%, hsl(var(--primary) / 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.3) 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />

      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer pointer-events-none" />
      
      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-5 pb-3 z-10">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
            animate={{ 
              boxShadow: ['0 0 0px hsl(var(--accent) / 0)', '0 0 20px hsl(var(--accent) / 0.4)', '0 0 0px hsl(var(--accent) / 0)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Newspaper className="w-5 h-5 text-accent" />
          </motion.div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">News Highlights</h3>
            <p className="text-[10px] text-muted-foreground">Latest updates</p>
          </div>
        </motion.div>
        <Link 
          to="/news" 
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors group"
        >
          <span>View All</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Content Area */}
      <div className="relative h-[200px] overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="absolute inset-0 px-5 pb-5"
          >
            <Link to={`/news/${currentNews.id}`} className="flex gap-4 h-full">
              {/* Image Section with background style */}
              {currentNews.image_url ? (
                <motion.div 
                  className="w-1/3 h-full rounded-xl overflow-hidden relative flex-shrink-0 group"
                  variants={imageVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.8 }}
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${currentNews.image_url})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                </motion.div>
              ) : (
                <motion.div 
                  className="w-1/4 h-full rounded-xl overflow-hidden relative flex-shrink-0 bg-muted/30 flex items-center justify-center"
                  variants={imageVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.8 }}
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                  </motion.div>
                </motion.div>
              )}

              {/* Text Content */}
              <div className="flex-1 flex flex-col justify-center">
                <motion.span 
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-full mb-3 w-fit uppercase tracking-wider",
                    currentNews.category === 'Match Report' && "bg-primary/20 text-primary border border-primary/30",
                    currentNews.category === 'Transfer News' && "bg-accent/20 text-accent border border-accent/30",
                    currentNews.category === 'Announcement' && "bg-muted text-foreground border border-border",
                    currentNews.category === 'Feature' && "bg-gold/20 text-gold border border-gold/30"
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  {currentNews.category}
                </motion.span>

                <motion.h3 
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="text-xl font-display tracking-wide mb-2 text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors"
                >
                  {currentNews.title}
                </motion.h3>

                <motion.p 
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-sm text-muted-foreground line-clamp-2 leading-relaxed"
                >
                  {currentNews.excerpt}
                </motion.p>

                <motion.div
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.25, duration: 0.5 }}
                  className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground"
                >
                  <span>{currentNews.author || 'PLFA Media'}</span>
                  <span>•</span>
                  <span>{new Date(currentNews.published_at).toLocaleDateString()}</span>
                </motion.div>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <motion.button
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors z-20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
        <motion.button
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors z-20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Progress Indicators */}
      <div className="relative flex justify-center gap-2 pb-4">
        {news.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goTo(index)}
            className="relative h-1.5 rounded-full overflow-hidden bg-muted-foreground/20"
            style={{ width: index === currentIndex ? 32 : 8 }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            animate={{ width: index === currentIndex ? 32 : 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {index === currentIndex && (
              <motion.div
                className="absolute inset-0 bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 6, ease: 'linear' }}
                style={{ transformOrigin: 'left' }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
