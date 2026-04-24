-- Add seed columns to knockout_matches to track team seeds
ALTER TABLE public.knockout_matches
ADD COLUMN team1_seed integer,
ADD COLUMN team2_seed integer;