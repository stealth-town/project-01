import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
// @ts-ignore
import { Database } from "./database.types";

config();


const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);


/** 
 * naming it this way since we will have a lot of "supabase"s around the code
 */
export default supabaseClient;

