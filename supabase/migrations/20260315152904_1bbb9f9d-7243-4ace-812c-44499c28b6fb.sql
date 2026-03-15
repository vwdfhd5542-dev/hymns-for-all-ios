
-- Create songs table (public, no auth required for this app)
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  collection TEXT NOT NULL DEFAULT 'Hymns',
  lyrics TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read songs
CREATE POLICY "Songs are viewable by everyone" ON public.songs FOR SELECT USING (true);

-- Allow anyone to insert songs (no auth for this PWA)
CREATE POLICY "Anyone can add songs" ON public.songs FOR INSERT WITH CHECK (true);

-- Allow anyone to update songs
CREATE POLICY "Anyone can update songs" ON public.songs FOR UPDATE USING (true);

-- Allow anyone to delete songs
CREATE POLICY "Anyone can delete songs" ON public.songs FOR DELETE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
