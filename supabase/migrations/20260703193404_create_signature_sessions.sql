/*
# Create signature_sessions table

1. New Tables
- `signature_sessions` - stores temporary session data for mobile-to-desktop signature sync
- `id` (uuid, primary key)
- `session_code` (text, unique) - short readable code for mobile connection
- `signature_data` (text, nullable) - base64 encoded signature image when submitted
- `status` (text) - pending, connected, completed
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

2. Security
- Enable RLS on `signature_sessions`.
- Allow anon + authenticated CRUD for single-tenant app (no sign-in required).

3. Notes
- Sessions are temporary and used for real-time mobile sync
- Realtime will be enabled on this table for live updates
*/

CREATE TABLE IF NOT EXISTS signature_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code text UNIQUE NOT NULL,
  signature_data text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE signature_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for anon + authenticated (single-tenant, no auth)
DROP POLICY IF EXISTS "anon_select_sessions" ON signature_sessions;
CREATE POLICY "anon_select_sessions" ON signature_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON signature_sessions;
CREATE POLICY "anon_insert_sessions" ON signature_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON signature_sessions;
CREATE POLICY "anon_update_sessions" ON signature_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON signature_sessions;
CREATE POLICY "anon_delete_sessions" ON signature_sessions FOR DELETE
  TO anon, authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE signature_sessions;

-- Create index for faster session_code lookups
CREATE INDEX IF NOT EXISTS idx_signature_sessions_code ON signature_sessions(session_code);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_signature_sessions_updated_at
  BEFORE UPDATE ON signature_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();