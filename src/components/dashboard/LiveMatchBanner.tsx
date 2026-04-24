import { motion } from 'framer-motion';
import { Radio, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LiveMatchBannerProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: string;
}

export function LiveMatchBanner({ homeTeam, awayTeam, homeScore, awayScore, minute }: LiveMatchBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-destructive/20 via-destructive/10 to-destructive/20 border border-destructive/30 mb-6"
    >
      {/* Pulse effect */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-destructive/10 to-transparent"
        />
      </div>

      <Link to="/matches" className="relative flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-center gap-2 px-2 py-1 rounded-full bg-destructive/20"
          >
            <Radio className="w-3 h-3 text-destructive animate-pulse" />
            <span className="text-[10px] font-bold text-destructive uppercase">Live</span>
          </motion.div>
          <span className="text-xs text-muted-foreground">{minute}'</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">{homeTeam}</span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-background/50">
            <span className="text-lg font-display text-foreground">{homeScore}</span>
            <span className="text-muted-foreground">-</span>
            <span className="text-lg font-display text-foreground">{awayScore}</span>
          </div>
          <span className="text-sm font-medium text-foreground">{awayTeam}</span>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </Link>
    </motion.div>
  );
}
