-- Create forum boards table
CREATE TABLE IF NOT EXISTS forum_boards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'message-circle',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create forum posts table
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id UUID NOT NULL REFERENCES forum_boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create forum replies table
CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_forum_posts_board_id ON forum_posts(board_id);
CREATE INDEX idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX idx_forum_replies_user_id ON forum_replies(user_id);
CREATE INDEX idx_forum_replies_created_at ON forum_replies(created_at ASC);

-- Enable RLS
ALTER TABLE forum_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_boards
-- Everyone can view boards
CREATE POLICY "forum_boards_select_policy" ON forum_boards
    FOR SELECT
    USING (true);

-- Only admins can manage boards
CREATE POLICY "forum_boards_insert_policy" ON forum_boards
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "forum_boards_update_policy" ON forum_boards
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "forum_boards_delete_policy" ON forum_boards
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- RLS Policies for forum_posts
-- Everyone can view posts
CREATE POLICY "forum_posts_select_policy" ON forum_posts
    FOR SELECT
    USING (true);

-- Authenticated users can create posts
CREATE POLICY "forum_posts_insert_policy" ON forum_posts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "forum_posts_update_policy" ON forum_posts
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own posts, admins can delete any
CREATE POLICY "forum_posts_delete_policy" ON forum_posts
    FOR DELETE
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- RLS Policies for forum_replies
-- Everyone can view replies
CREATE POLICY "forum_replies_select_policy" ON forum_replies
    FOR SELECT
    USING (true);

-- Authenticated users can create replies
CREATE POLICY "forum_replies_insert_policy" ON forum_replies
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own replies
CREATE POLICY "forum_replies_update_policy" ON forum_replies
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own replies, admins can delete any
CREATE POLICY "forum_replies_delete_policy" ON forum_replies
    FOR DELETE
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_forum_boards_updated_at BEFORE UPDATE
    ON forum_boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE
    ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_replies_updated_at BEFORE UPDATE
    ON forum_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for post statistics
CREATE VIEW forum_post_stats AS
SELECT 
    p.id,
    p.board_id,
    p.user_id,
    p.title,
    p.created_at,
    p.updated_at,
    p.view_count,
    COUNT(DISTINCT r.id) as reply_count,
    MAX(r.created_at) as last_reply_at
FROM forum_posts p
LEFT JOIN forum_replies r ON p.id = r.post_id
GROUP BY p.id, p.board_id, p.user_id, p.title, p.created_at, p.updated_at, p.view_count;

-- Grant permissions on the view
GRANT SELECT ON forum_post_stats TO anon, authenticated;