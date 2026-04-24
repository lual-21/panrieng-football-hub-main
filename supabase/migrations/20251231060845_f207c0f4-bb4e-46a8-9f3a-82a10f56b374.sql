-- Add league_id to teams table
ALTER TABLE public.teams 
ADD COLUMN league_id UUID REFERENCES public.leagues(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_teams_league_id ON public.teams(league_id);