-- Create storage bucket for news images
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-images', 'news-images', true);

-- Create policies for news images bucket
CREATE POLICY "News images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'news-images');

CREATE POLICY "Admins can upload news images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'news-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update news images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'news-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete news images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'news-images' AND public.has_role(auth.uid(), 'admin'));