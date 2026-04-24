-- Add missing UPDATE policy for match_lineups table
CREATE POLICY "Admins can update match lineups"
ON public.match_lineups
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));