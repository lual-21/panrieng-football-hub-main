-- Create storage bucket for team logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for player photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for team logos bucket
CREATE POLICY "Team logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-logos');

CREATE POLICY "Admins can upload team logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'team-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update team logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'team-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete team logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'team-logos' AND public.has_role(auth.uid(), 'admin'));

-- RLS policies for player photos bucket
CREATE POLICY "Player photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-photos');

CREATE POLICY "Admins can upload player photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'player-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update player photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'player-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete player photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'player-photos' AND public.has_role(auth.uid(), 'admin'));