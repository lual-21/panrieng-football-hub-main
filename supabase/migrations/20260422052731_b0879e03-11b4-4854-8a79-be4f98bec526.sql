
-- Function: recalculate a single player's rating from their stored stats
CREATE OR REPLACE FUNCTION public.recalculate_player_rating(_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goals int;
  v_assists int;
  v_appearances int;
  v_yellow int;
  v_red int;
  v_goals_pg numeric;
  v_assists_pg numeric;
  v_cards_pg numeric;
  v_score numeric;
  v_change numeric := 0;
  v_new_rating numeric;
  v_base_rating numeric := 5.0; -- baseline rating all players are measured against
BEGIN
  SELECT
    COALESCE(goals, 0),
    COALESCE(assists, 0),
    COALESCE(appearances, 0),
    COALESCE(yellow_cards, 0),
    COALESCE(red_cards, 0)
  INTO v_goals, v_assists, v_appearances, v_yellow, v_red
  FROM public.players
  WHERE id = _player_id;

  IF v_appearances = 0 THEN
    -- No appearances: keep at baseline
    UPDATE public.players SET rating = v_base_rating WHERE id = _player_id;
    RETURN;
  END IF;

  v_goals_pg := v_goals::numeric / v_appearances;
  v_assists_pg := v_assists::numeric / v_appearances;
  v_cards_pg := (v_yellow + v_red * 2)::numeric / v_appearances;

  v_score := (v_goals_pg * 2.5) + (v_assists_pg * 1.5) - (v_cards_pg * 0.5);

  IF v_score >= 1.5 THEN
    v_change := 0.30;
  ELSIF v_score >= 0.8 THEN
    v_change := 0.15;
  ELSIF v_score >= 0.3 THEN
    v_change := 0;
  ELSIF v_score >= 0 THEN
    v_change := -0.10;
  ELSE
    v_change := -0.20;
  END IF;

  -- Discipline penalties
  IF v_red > 0 THEN
    v_change := v_change - (0.15 * v_red);
  END IF;
  IF v_yellow >= 4 THEN
    v_change := v_change - 0.05;
  END IF;

  -- Scale change by appearances so ratings actually move with sustained performance
  -- (single change is small; cumulative effect grows with games played)
  v_change := v_change * v_appearances;

  v_new_rating := v_base_rating + v_change;

  -- Clamp between 1.0 and 10.0
  IF v_new_rating < 1.0 THEN v_new_rating := 1.0; END IF;
  IF v_new_rating > 10.0 THEN v_new_rating := 10.0; END IF;

  UPDATE public.players
  SET rating = ROUND(v_new_rating, 1)
  WHERE id = _player_id;
END;
$$;

-- Trigger function for match_events (goals/assists/cards)
CREATE OR REPLACE FUNCTION public.trg_recalc_rating_from_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_player_rating(OLD.player_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalculate_player_rating(NEW.player_id);
    IF TG_OP = 'UPDATE' AND OLD.player_id IS DISTINCT FROM NEW.player_id THEN
      PERFORM public.recalculate_player_rating(OLD.player_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger function for match_lineups (appearances)
CREATE OR REPLACE FUNCTION public.trg_recalc_rating_from_lineup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_player_rating(OLD.player_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalculate_player_rating(NEW.player_id);
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger function for direct edits to player stats
CREATE OR REPLACE FUNCTION public.trg_recalc_rating_from_player()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_rating numeric;
BEGIN
  -- Only react to stat changes, not to a rating change itself (prevent recursion)
  IF NEW.goals IS DISTINCT FROM OLD.goals
     OR NEW.assists IS DISTINCT FROM OLD.assists
     OR NEW.appearances IS DISTINCT FROM OLD.appearances
     OR NEW.yellow_cards IS DISTINCT FROM OLD.yellow_cards
     OR NEW.red_cards IS DISTINCT FROM OLD.red_cards
  THEN
    -- Compute inline and assign to NEW so we don't fire another UPDATE
    DECLARE
      v_goals int := COALESCE(NEW.goals, 0);
      v_assists int := COALESCE(NEW.assists, 0);
      v_apps int := COALESCE(NEW.appearances, 0);
      v_yel int := COALESCE(NEW.yellow_cards, 0);
      v_red int := COALESCE(NEW.red_cards, 0);
      v_score numeric;
      v_change numeric := 0;
      v_base numeric := 5.0;
    BEGIN
      IF v_apps = 0 THEN
        NEW.rating := v_base;
        RETURN NEW;
      END IF;

      v_score := ((v_goals::numeric / v_apps) * 2.5)
               + ((v_assists::numeric / v_apps) * 1.5)
               - (((v_yel + v_red * 2)::numeric / v_apps) * 0.5);

      IF v_score >= 1.5 THEN v_change := 0.30;
      ELSIF v_score >= 0.8 THEN v_change := 0.15;
      ELSIF v_score >= 0.3 THEN v_change := 0;
      ELSIF v_score >= 0 THEN v_change := -0.10;
      ELSE v_change := -0.20;
      END IF;

      IF v_red > 0 THEN v_change := v_change - (0.15 * v_red); END IF;
      IF v_yel >= 4 THEN v_change := v_change - 0.05; END IF;

      v_change := v_change * v_apps;
      v_new_rating := v_base + v_change;
      IF v_new_rating < 1.0 THEN v_new_rating := 1.0; END IF;
      IF v_new_rating > 10.0 THEN v_new_rating := 10.0; END IF;

      NEW.rating := ROUND(v_new_rating, 1);
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing triggers if re-running
DROP TRIGGER IF EXISTS recalc_rating_on_match_event ON public.match_events;
DROP TRIGGER IF EXISTS recalc_rating_on_match_lineup ON public.match_lineups;
DROP TRIGGER IF EXISTS recalc_rating_on_player_stats ON public.players;

-- Attach triggers (AFTER existing stat-update triggers so stats are already applied)
CREATE TRIGGER recalc_rating_on_match_event
AFTER INSERT OR UPDATE OR DELETE ON public.match_events
FOR EACH ROW
EXECUTE FUNCTION public.trg_recalc_rating_from_event();

CREATE TRIGGER recalc_rating_on_match_lineup
AFTER INSERT OR UPDATE OR DELETE ON public.match_lineups
FOR EACH ROW
EXECUTE FUNCTION public.trg_recalc_rating_from_lineup();

CREATE TRIGGER recalc_rating_on_player_stats
BEFORE UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.trg_recalc_rating_from_player();

-- Backfill existing players
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.players LOOP
    PERFORM public.recalculate_player_rating(r.id);
  END LOOP;
END $$;
