// Player Form Calculation Utility
// Automatically calculates player form based on performance metrics

export type FormStatus = 'hot' | 'good' | 'average' | 'poor' | 'cold';

export interface PlayerFormData {
  status: FormStatus;
  trend: 'up' | 'stable' | 'down';
  ratingChange: number;
  description: string;
}

/**
 * Calculate player form based on their performance metrics
 * This considers goals, assists, cards, and appearances
 */
export function calculatePlayerForm(
  goals: number,
  assists: number,
  appearances: number,
  yellowCards: number,
  redCards: number,
  currentRating: number
): PlayerFormData {
  if (appearances === 0) {
    return {
      status: 'average',
      trend: 'stable',
      ratingChange: 0,
      description: 'No recent appearances'
    };
  }

  // Calculate contribution per game
  const goalsPerGame = goals / appearances;
  const assistsPerGame = assists / appearances;
  const cardsPerGame = (yellowCards + redCards * 2) / appearances;
  
  // Performance score calculation
  // Goals weighted more heavily, assists next, cards negatively impact
  const performanceScore = 
    (goalsPerGame * 2.5) + 
    (assistsPerGame * 1.5) - 
    (cardsPerGame * 0.5);
  
  // Calculate rating adjustment
  let ratingChange = 0;
  let status: FormStatus;
  let trend: 'up' | 'stable' | 'down';
  let description: string;

  if (performanceScore >= 1.5) {
    status = 'hot';
    trend = 'up';
    ratingChange = 0.3;
    description = 'Exceptional form! On fire!';
  } else if (performanceScore >= 0.8) {
    status = 'good';
    trend = 'up';
    ratingChange = 0.15;
    description = 'Great form, performing well';
  } else if (performanceScore >= 0.3) {
    status = 'average';
    trend = 'stable';
    ratingChange = 0;
    description = 'Consistent performance';
  } else if (performanceScore >= 0) {
    status = 'poor';
    trend = 'down';
    ratingChange = -0.1;
    description = 'Below expectations';
  } else {
    status = 'cold';
    trend = 'down';
    ratingChange = -0.2;
    description = 'Struggling with form';
  }

  // Adjust for discipline issues
  if (redCards > 0) {
    ratingChange -= 0.15 * redCards;
    if (status === 'hot') status = 'good';
  }
  
  if (yellowCards >= 4) {
    ratingChange -= 0.05;
  }

  // Cap rating changes
  ratingChange = Math.max(-0.5, Math.min(0.5, ratingChange));

  return {
    status,
    trend,
    ratingChange,
    description
  };
}

/**
 * Get the projected new rating based on form
 */
export function getProjectedRating(currentRating: number, formData: PlayerFormData): number {
  const newRating = currentRating + formData.ratingChange;
  // Keep rating between 1 and 10
  return Math.max(1, Math.min(10, parseFloat(newRating.toFixed(1))));
}

/**
 * Get form status color class
 */
export function getFormStatusColor(status: FormStatus): string {
  switch (status) {
    case 'hot':
      return 'text-victory';
    case 'good':
      return 'text-primary';
    case 'average':
      return 'text-muted-foreground';
    case 'poor':
      return 'text-warning-yellow';
    case 'cold':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Get form status background class
 */
export function getFormStatusBg(status: FormStatus): string {
  switch (status) {
    case 'hot':
      return 'bg-victory/20';
    case 'good':
      return 'bg-primary/20';
    case 'average':
      return 'bg-muted';
    case 'poor':
      return 'bg-warning-yellow/20';
    case 'cold':
      return 'bg-destructive/20';
    default:
      return 'bg-muted';
  }
}

/**
 * Get trend icon direction
 */
export function getTrendIcon(trend: 'up' | 'stable' | 'down'): string {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    default:
      return '→';
  }
}
