-- Function to update team standings when match results are saved
CREATE OR REPLACE FUNCTION public.update_team_standings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_home_team_id uuid;
  v_away_team_id uuid;
  v_home_score int;
  v_away_score int;
BEGIN
  -- Only process if match is being marked as completed
  IF NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL) THEN
    v_home_team_id := NEW.home_team_id;
    v_away_team_id := NEW.away_team_id;
    v_home_score := COALESCE(NEW.home_score, 0);
    v_away_score := COALESCE(NEW.away_score, 0);

    -- Update home team stats
    UPDATE teams SET
      played = played + 1,
      goals_for = goals_for + v_home_score,
      goals_against = goals_against + v_away_score,
      won = won + CASE WHEN v_home_score > v_away_score THEN 1 ELSE 0 END,
      drawn = drawn + CASE WHEN v_home_score = v_away_score THEN 1 ELSE 0 END,
      lost = lost + CASE WHEN v_home_score < v_away_score THEN 1 ELSE 0 END
    WHERE id = v_home_team_id;

    -- Update away team stats
    UPDATE teams SET
      played = played + 1,
      goals_for = goals_for + v_away_score,
      goals_against = goals_against + v_home_score,
      won = won + CASE WHEN v_away_score > v_home_score THEN 1 ELSE 0 END,
      drawn = drawn + CASE WHEN v_home_score = v_away_score THEN 1 ELSE 0 END,
      lost = lost + CASE WHEN v_away_score < v_home_score THEN 1 ELSE 0 END
    WHERE id = v_away_team_id;
  END IF;

  -- Handle score updates for already completed matches
  IF NEW.is_completed = true AND OLD.is_completed = true AND 
     (NEW.home_score != OLD.home_score OR NEW.away_score != OLD.away_score) THEN
    -- Revert old scores from home team
    UPDATE teams SET
      goals_for = goals_for - COALESCE(OLD.home_score, 0) + COALESCE(NEW.home_score, 0),
      goals_against = goals_against - COALESCE(OLD.away_score, 0) + COALESCE(NEW.away_score, 0),
      won = won - CASE WHEN COALESCE(OLD.home_score, 0) > COALESCE(OLD.away_score, 0) THEN 1 ELSE 0 END
              + CASE WHEN COALESCE(NEW.home_score, 0) > COALESCE(NEW.away_score, 0) THEN 1 ELSE 0 END,
      drawn = drawn - CASE WHEN COALESCE(OLD.home_score, 0) = COALESCE(OLD.away_score, 0) THEN 1 ELSE 0 END
               + CASE WHEN COALESCE(NEW.home_score, 0) = COALESCE(NEW.away_score, 0) THEN 1 ELSE 0 END,
      lost = lost - CASE WHEN COALESCE(OLD.home_score, 0) < COALESCE(OLD.away_score, 0) THEN 1 ELSE 0 END
              + CASE WHEN COALESCE(NEW.home_score, 0) < COALESCE(NEW.away_score, 0) THEN 1 ELSE 0 END
    WHERE id = NEW.home_team_id;

    -- Revert old scores from away team
    UPDATE teams SET
      goals_for = goals_for - COALESCE(OLD.away_score, 0) + COALESCE(NEW.away_score, 0),
      goals_against = goals_against - COALESCE(OLD.home_score, 0) + COALESCE(NEW.home_score, 0),
      won = won - CASE WHEN COALESCE(OLD.away_score, 0) > COALESCE(OLD.home_score, 0) THEN 1 ELSE 0 END
              + CASE WHEN COALESCE(NEW.away_score, 0) > COALESCE(NEW.home_score, 0) THEN 1 ELSE 0 END,
      drawn = drawn - CASE WHEN COALESCE(OLD.home_score, 0) = COALESCE(OLD.away_score, 0) THEN 1 ELSE 0 END
               + CASE WHEN COALESCE(NEW.home_score, 0) = COALESCE(NEW.away_score, 0) THEN 1 ELSE 0 END,
      lost = lost - CASE WHEN COALESCE(OLD.away_score, 0) < COALESCE(OLD.home_score, 0) THEN 1 ELSE 0 END
              + CASE WHEN COALESCE(NEW.away_score, 0) < COALESCE(NEW.home_score, 0) THEN 1 ELSE 0 END
    WHERE id = NEW.away_team_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_match_result_update ON matches;
CREATE TRIGGER on_match_result_update
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_team_standings();