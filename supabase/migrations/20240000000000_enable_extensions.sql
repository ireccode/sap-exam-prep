-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; 