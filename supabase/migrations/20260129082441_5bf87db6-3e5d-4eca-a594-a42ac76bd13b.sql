-- Add extra time tracking columns to knockout_matches
-- team1_score and team2_score will represent the FINAL score (after extra time if played)
-- These new columns track the score at 90 minutes (before extra time)
ALTER TABLE public.knockout_matches
ADD COLUMN team1_score_90 integer DEFAULT NULL,
ADD COLUMN team2_score_90 integer DEFAULT NULL,
ADD COLUMN went_to_extra_time boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.knockout_matches.team1_score_90 IS 'Team 1 score at 90 minutes (before extra time)';
COMMENT ON COLUMN public.knockout_matches.team2_score_90 IS 'Team 2 score at 90 minutes (before extra time)';
COMMENT ON COLUMN public.knockout_matches.went_to_extra_time IS 'Whether match went to extra time';