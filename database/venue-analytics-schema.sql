-- Venue Analytics Schema
-- Tracks page views, unique visitors, and engagement metrics for claimed venues

-- Create venue_analytics table to track individual page views
CREATE TABLE IF NOT EXISTS venue_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  venue_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL, -- Generated unique ID stored in browser
  session_id TEXT NOT NULL, -- Session identifier
  page_view_count INTEGER DEFAULT 1,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  country TEXT,
  city TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_venue_analytics_venue_id ON venue_analytics(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_analytics_visitor_id ON venue_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_venue_analytics_visited_at ON venue_analytics(visited_at);
CREATE INDEX IF NOT EXISTS idx_venue_analytics_venue_visitor ON venue_analytics(venue_id, visitor_id);

-- Create venue_analytics_summary table for aggregated daily stats
CREATE TABLE IF NOT EXISTS venue_analytics_summary (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  venue_id TEXT NOT NULL,
  date DATE NOT NULL,
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  mobile_views INTEGER DEFAULT 0,
  desktop_views INTEGER DEFAULT 0,
  tablet_views INTEGER DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(venue_id, date)
);

-- Create index for summary table
CREATE INDEX IF NOT EXISTS idx_venue_analytics_summary_venue_date ON venue_analytics_summary(venue_id, date);

-- Create venue_analytics_actions table for tracking user interactions
CREATE TABLE IF NOT EXISTS venue_analytics_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  venue_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'phone_click', 'email_click', 'website_click', 'photo_view', 'gallery_open', 'save_venue', 'share'
  action_value TEXT, -- Additional data about the action
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for actions
CREATE INDEX IF NOT EXISTS idx_venue_analytics_actions_venue_id ON venue_analytics_actions(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_analytics_actions_type ON venue_analytics_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_venue_analytics_actions_created_at ON venue_analytics_actions(created_at);

-- Function to update or insert visitor record
CREATE OR REPLACE FUNCTION upsert_venue_visit(
  p_venue_id TEXT,
  p_visitor_id TEXT,
  p_session_id TEXT,
  p_referrer TEXT,
  p_user_agent TEXT,
  p_device_type TEXT
) RETURNS void AS $$
BEGIN
  -- Try to update existing record for this visitor
  UPDATE venue_analytics
  SET 
    page_view_count = page_view_count + 1,
    last_viewed_at = NOW(),
    session_id = p_session_id
  WHERE venue_id = p_venue_id AND visitor_id = p_visitor_id;
  
  -- If no record exists, insert new one
  IF NOT FOUND THEN
    INSERT INTO venue_analytics (
      venue_id,
      visitor_id,
      session_id,
      referrer,
      user_agent,
      device_type,
      visited_at,
      last_viewed_at
    ) VALUES (
      p_venue_id,
      p_visitor_id,
      p_session_id,
      p_referrer,
      p_user_agent,
      p_device_type,
      NOW(),
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily summary (run via cron or after each visit)
CREATE OR REPLACE FUNCTION update_venue_analytics_summary(p_venue_id TEXT, p_date DATE) RETURNS void AS $$
DECLARE
  v_total_views INTEGER;
  v_unique_visitors INTEGER;
  v_mobile_views INTEGER;
  v_desktop_views INTEGER;
  v_tablet_views INTEGER;
BEGIN
  -- Calculate stats for the date
  SELECT 
    COALESCE(SUM(page_view_count), 0),
    COUNT(DISTINCT visitor_id),
    COALESCE(SUM(CASE WHEN device_type = 'mobile' THEN page_view_count ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN device_type = 'desktop' THEN page_view_count ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN device_type = 'tablet' THEN page_view_count ELSE 0 END), 0)
  INTO 
    v_total_views,
    v_unique_visitors,
    v_mobile_views,
    v_desktop_views,
    v_tablet_views
  FROM venue_analytics
  WHERE venue_id = p_venue_id
    AND DATE(visited_at) = p_date;
  
  -- Upsert into summary table
  INSERT INTO venue_analytics_summary (
    venue_id,
    date,
    total_views,
    unique_visitors,
    mobile_views,
    desktop_views,
    tablet_views,
    updated_at
  ) VALUES (
    p_venue_id,
    p_date,
    v_total_views,
    v_unique_visitors,
    v_mobile_views,
    v_desktop_views,
    v_tablet_views,
    NOW()
  )
  ON CONFLICT (venue_id, date)
  DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_visitors = EXCLUDED.unique_visitors,
    mobile_views = EXCLUDED.mobile_views,
    desktop_views = EXCLUDED.desktop_views,
    tablet_views = EXCLUDED.tablet_views,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust role names as needed)
-- GRANT ALL ON venue_analytics TO authenticated;
-- GRANT ALL ON venue_analytics_summary TO authenticated;
-- GRANT ALL ON venue_analytics_actions TO authenticated;

-- Create Row Level Security policies
ALTER TABLE venue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_analytics_actions ENABLE ROW LEVEL SECURITY;

-- Allow public to insert analytics (for tracking)
CREATE POLICY "Allow public insert on venue_analytics" ON venue_analytics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public insert on venue_analytics_actions" ON venue_analytics_actions
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to read their own venue analytics
CREATE POLICY "Allow venue owners to read their analytics" ON venue_analytics
  FOR SELECT
  USING (true); -- In production, check if user owns the venue

CREATE POLICY "Allow venue owners to read analytics summary" ON venue_analytics_summary
  FOR SELECT
  USING (true); -- In production, check if user owns the venue

CREATE POLICY "Allow venue owners to read analytics actions" ON venue_analytics_actions
  FOR SELECT
  USING (true); -- In production, check if user owns the venue
