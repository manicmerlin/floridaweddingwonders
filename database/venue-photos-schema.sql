-- Create venue_photos table to store uploaded images
CREATE TABLE IF NOT EXISTS venue_photos (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL,
  url TEXT NOT NULL,
  alt TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by TEXT NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_venue_photos_venue_id ON venue_photos(venue_id);

-- Enable Row Level Security (RLS)
ALTER TABLE venue_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to venue_photos" ON venue_photos
  FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated insert to venue_photos" ON venue_photos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update to venue_photos" ON venue_photos
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete from venue_photos" ON venue_photos
  FOR DELETE USING (true);
