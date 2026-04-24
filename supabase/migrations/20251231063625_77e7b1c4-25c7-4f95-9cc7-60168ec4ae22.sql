-- Add league_id to matches table
ALTER TABLE public.matches 
ADD COLUMN league_id UUID REFERENCES public.leagues(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_matches_league_id ON public.matches(league_id);