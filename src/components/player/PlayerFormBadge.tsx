import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Flame, Snowflake, ThermometerSun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  calculatePlayerForm, 
  getFormStatusColor, 
  getFormStatusBg,
  getProjectedRating,
  type FormStatus 
} from '@/lib/playerForm';

interface PlayerFormBadgeProps {
  goals: number;
  assists: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
  currentRating: number;
  showProjected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const FormIcon = ({ status }: { status: FormStatus }) => {
  switch (status) {
    case 'hot':
      return <Flame className="w-4 h-4" />;
    case 'cold':
      return <Snowflake className="w-4 h-4" />;
    default:
      return <ThermometerSun className="w-4 h-4" />;
  }
};

const TrendIcon = ({ trend }: { trend: 'up' | 'stable' | 'down' }) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-3 h-3" />;
    case 'down':
      return <TrendingDown className="w-3 h-3" />;
    default:
      return <Minus className="w-3 h-3" />;
  }
};

export function PlayerFormBadge({
  goals,
  assists,
  appearances,
  yellowCards,
  redCards,
  currentRating,
  showProjected = false,
  size = 'md'
}: PlayerFormBadgeProps) {
  const formData = calculatePlayerForm(
    goals,
    assists,
    appearances,
    yellowCards,
    redCards,
    currentRating
  );

  const projectedRating = getProjectedRating(currentRating, formData);

  const sizeClasses = {
    sm: 'px-2 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-2"
    >
      <motion.div
        className={cn(
          "inline-flex items-center gap-2 rounded-full font-semibold",
          getFormStatusBg(formData.status),
          getFormStatusColor(formData.status),
          sizeClasses[size]
        )}
        whileHover={{ scale: 1.05 }}
      >
        <motion.span
          animate={formData.status === 'hot' ? { 
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <FormIcon status={formData.status} />
        </motion.span>
        <span className="capitalize">{formData.status}</span>
        <span className="flex items-center gap-0.5">
          <TrendIcon trend={formData.trend} />
        </span>
      </motion.div>

      {showProjected && formData.ratingChange !== 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 text-xs"
        >
          <span className="text-muted-foreground">Projected:</span>
          <span className={cn(
            "font-semibold",
            formData.trend === 'up' ? 'text-victory' : formData.trend === 'down' ? 'text-destructive' : 'text-foreground'
          )}>
            {currentRating.toFixed(1)} → {projectedRating.toFixed(1)}
          </span>
          <span className={cn(
            "text-[10px]",
            formData.trend === 'up' ? 'text-victory' : formData.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
          )}>
            ({formData.ratingChange > 0 ? '+' : ''}{formData.ratingChange.toFixed(2)})
          </span>
        </motion.div>
      )}

      <p className="text-[10px] text-muted-foreground">{formData.description}</p>
    </motion.div>
  );
}
