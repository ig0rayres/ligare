import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://db.jqofecfrqppsemupwjbm.supabase.co", // Replace with real url or env var
  process.env.SUPABASE_SERVICE_ROLE_KEY || "..." // I don't have the service key but I can read it from .env.local
);
