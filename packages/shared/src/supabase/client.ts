import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.js";

config();

// Supabase connection - uses Publishable key (previously called ANON_KEY)
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const supabaseClient = createClient<Database>(supabaseUrl, supabasePublishableKey);

/**
 * naming it this way since we will have a lot of "supabase"s around the code
 */
export default supabaseClient;

