
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.collection_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, song_id)
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read collections" ON public.collections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert collections" ON public.collections FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update collections" ON public.collections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete collections" ON public.collections FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Allow public read collection_songs" ON public.collection_songs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert collection_songs" ON public.collection_songs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public delete collection_songs" ON public.collection_songs FOR DELETE TO anon, authenticated USING (true);
