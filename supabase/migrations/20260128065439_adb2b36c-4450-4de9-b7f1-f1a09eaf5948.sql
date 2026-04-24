-- Add penalty shootout columns to knockout_matches
ALTER TABLE public.knockout_matches
ADD COLUMN team1_penalties integer DEFAULT NULL,
ADD COLUMN team2_penalties integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.knockout_matches.team1_penalties IS 'Penalty shootout score for team 1 (NULL if no shootout)';
COMMENT ON COLUMN public.knockout_matches.team2_penalties IS 'Penalty shootout score for team 2 (NULL if no shootout)';