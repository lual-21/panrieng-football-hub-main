-- Create match_lineups table to track player participation
CREATE TABLE public.match_lineups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  is_starter BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, player_id)
);

-- Enable RLS
ALTER TABLE public.match_lineups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Match lineups are viewable by everyone"
ON public.match_lineups FOR SELECT
USING (true);

CREATE POLICY "Admins can insert match lineups"
ON public.match_lineups FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete match lineups"
ON public.match_lineups FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Function to update player appearances when lineup is added
CREATE OR REPLACE FUNCTION public.update_player_appearances()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE players SET appearances = appearances + 1 WHERE id = NEW.player_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE players SET appearances = appearances - 1 WHERE id = OLD.player_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
CREATE TRIGGER on_lineup_insert
  AFTER INSERT ON match_lineups
  FOR EACH ROW
  EXECUTE FUNCTION update_player_appearances();

CREATE TRIGGER on_lineup_delete
  AFTER DELETE ON match_lineups
  FOR EACH ROW
  EXECUTE FUNCTION update_player_appearances();