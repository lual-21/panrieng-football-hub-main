-- Create knockout_rounds table for managing tournament rounds
CREATE TABLE public.knockout_rounds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  round_name text NOT NULL,
  round_order integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create knockout_matches table for bracket matches
CREATE TABLE public.knockout_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id uuid NOT NULL REFERENCES public.knockout_rounds(id) ON DELETE CASCADE,
  match_order integer NOT NULL,
  team1_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  team2_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  team1_score integer,
  team2_score integer,
  winner_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  match_date date,
  match_time time without time zone,
  venue text,
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knockout_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knockout_matches ENABLE ROW LEVEL SECURITY;

-- RLS policies for knockout_rounds
CREATE POLICY "Knockout rounds are viewable by everyone" 
ON public.knockout_rounds FOR SELECT USING (true);

CREATE POLICY "Admins can insert knockout rounds" 
ON public.knockout_rounds FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update knockout rounds" 
ON public.knockout_rounds FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete knockout rounds" 
ON public.knockout_rounds FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for knockout_matches
CREATE POLICY "Knockout matches are viewable by everyone" 
ON public.knockout_matches FOR SELECT USING (true);

CREATE POLICY "Admins can insert knockout matches" 
ON public.knockout_matches FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update knockout matches" 
ON public.knockout_matches FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete knockout matches" 
ON public.knockout_matches FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_knockout_matches_updated_at
BEFORE UPDATE ON public.knockout_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();