-- Create deleted_venues table to track deleted venues
CREATE TABLE IF NOT EXISTS deleted_venues (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_by TEXT NOT NULL,
  reason TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_deleted_venues_venue_id ON deleted_venues(venue_id);
CREATE INDEX IF NOT EXISTS idx_deleted_venues_deleted_at ON deleted_venues(deleted_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE deleted_venues ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (so venues can be filtered)
CREATE POLICY "Allow public read access to deleted_venues" ON deleted_venues
  FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated insert to deleted_venues" ON deleted_venues
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated delete from deleted_venues" ON deleted_venues
  FOR DELETE USING (true);
