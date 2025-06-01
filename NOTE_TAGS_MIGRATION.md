# Note Tags Migration Instructions

To add the note tags functionality, you need to run the following SQL migration in your Supabase dashboard:

## Steps:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL below
4. Click "Run"

## SQL Migration:

```sql
-- Create note_tags table
CREATE TABLE IF NOT EXISTS public.note_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#808080',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(name, user_id)
);

-- Create note_tags_relations table
CREATE TABLE IF NOT EXISTS public.note_tags_relations (
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.note_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (note_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_note_tags_user_id ON public.note_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_relations_note_id ON public.note_tags_relations(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_relations_tag_id ON public.note_tags_relations(tag_id);

-- Enable RLS
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags_relations ENABLE ROW LEVEL SECURITY;

-- RLS policies for note_tags
CREATE POLICY "Users can view their own tags" ON public.note_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" ON public.note_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON public.note_tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON public.note_tags
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for note_tags_relations
CREATE POLICY "Users can view tags for their notes" ON public.note_tags_relations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = note_tags_relations.note_id
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add tags to their notes" ON public.note_tags_relations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = note_id
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from their notes" ON public.note_tags_relations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = note_tags_relations.note_id
      AND notes.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON public.note_tags TO authenticated;
GRANT ALL ON public.note_tags_relations TO authenticated;
```

## After Running the Migration:

1. Update your TypeScript types by running:
   ```bash
   npx supabase gen types typescript --project-id qzkzwtmzqysvhdsbrfzo > src/integrations/supabase/types.ts
   ```

2. The note tags functionality should now be available in your application! 