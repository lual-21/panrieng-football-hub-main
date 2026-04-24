-- Add third-place playoff flag to knockout_matches
ALTER TABLE public.knockout_matches
ADD COLUMN is_third_place_playoff boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.knockout_matches.is_third_place_playoff IS 'Whether this match is a third-place playoff';