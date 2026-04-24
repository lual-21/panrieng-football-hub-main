-- Create match_events table to track goals and assists
CREATE TABLE public.match_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card')),
  minute INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Match events are viewable by everyone"
ON public.match_events FOR SELECT
USING (true);

CREATE POLICY "Admins can insert match events"
ON public.match_events FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update match events"
ON public.match_events FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete match events"
ON public.match_events FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Function to update player stats when events are added
CREATE OR REPLACE FUNCTION public.update_player_stats_on_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE players SET
      goals = goals + CASE WHEN NEW.event_type = 'goal' THEN 1 ELSE 0 END,
      assists = assists + CASE WHEN NEW.event_type = 'assist' THEN 1 ELSE 0 END,
      yellow_cards = yellow_cards + CASE WHEN NEW.event_type = 'yellow_card' THEN 1 ELSE 0 END,
      red_cards = red_cards + CASE WHEN NEW.event_type = 'red_card' THEN 1 ELSE 0 END
    WHERE id = NEW.player_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE players SET
      goals = goals - CASE WHEN OLD.event_type = 'goal' THEN 1 ELSE 0 END,
      assists = assists - CASE WHEN OLD.event_type = 'assist' THEN 1 ELSE 0 END,
      yellow_cards = yellow_cards - CASE WHEN OLD.event_type = 'yellow_card' THEN 1 ELSE 0 END,
      red_cards = red_cards - CASE WHEN OLD.event_type = 'red_card' THEN 1 ELSE 0 END
    WHERE id = OLD.player_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for insert and delete
CREATE TRIGGER on_match_event_insert
  AFTER INSERT ON match_events
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_on_event();

CREATE TRIGGER on_match_event_delete
  AFTER DELETE ON match_events
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_on_event();