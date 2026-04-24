-- Add format column to leagues table
ALTER TABLE public.leagues 
ADD COLUMN format text NOT NULL DEFAULT 'league';

-- Add comment explaining the format values
COMMENT ON COLUMN public.leagues.format IS 'League format: league (points-based) or knockout (elimination rounds)';