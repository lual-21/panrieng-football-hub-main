
-- Create a function to advance winner to next round
CREATE OR REPLACE FUNCTION public.advance_knockout_winner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_round_order int;
  v_next_round_id uuid;
  v_next_match_order int;
  v_league_id uuid;
  v_is_team1 boolean;
BEGIN
  -- Only process if match is being marked as completed with a winner
  IF NEW.is_completed = true AND NEW.winner_id IS NOT NULL AND 
     (OLD.is_completed = false OR OLD.is_completed IS NULL OR OLD.winner_id IS NULL) THEN
    
    -- Get the current round's order and league_id
    SELECT kr.round_order, kr.league_id 
    INTO v_current_round_order, v_league_id
    FROM knockout_rounds kr
    WHERE kr.id = NEW.round_id;
    
    -- Find the next round
    SELECT kr.id INTO v_next_round_id
    FROM knockout_rounds kr
    WHERE kr.league_id = v_league_id
      AND kr.round_order = v_current_round_order + 1;
    
    -- If there's a next round, advance the winner
    IF v_next_round_id IS NOT NULL THEN
      -- Calculate which match in next round (matches 1,2 -> match 1; matches 3,4 -> match 2, etc.)
      v_next_match_order := CEIL(NEW.match_order::numeric / 2);
      
      -- Determine if winner goes to team1 (odd match_order) or team2 (even match_order)
      v_is_team1 := (NEW.match_order % 2 = 1);
      
      -- Update the next round match with the winner
      IF v_is_team1 THEN
        UPDATE knockout_matches
        SET team1_id = NEW.winner_id,
            updated_at = now()
        WHERE round_id = v_next_round_id
          AND match_order = v_next_match_order;
      ELSE
        UPDATE knockout_matches
        SET team2_id = NEW.winner_id,
            updated_at = now()
        WHERE round_id = v_next_round_id
          AND match_order = v_next_match_order;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_advance_knockout_winner ON knockout_matches;
CREATE TRIGGER trigger_advance_knockout_winner
  AFTER UPDATE ON knockout_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.advance_knockout_winner();
