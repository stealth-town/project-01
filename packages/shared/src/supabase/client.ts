import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.js";

// Get environment variables from either Node.js or browser context
// In Node.js: process.env (server/workers should load dotenv first)
// In Vite/browser: import.meta.env
function getEnvVar(nodeKey: string, viteKey: string, defaultValue: string): string {
  // Check if we're in a Node.js environment
  if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
    const processEnv = (globalThis as any).process?.env;
    if (processEnv && processEnv[nodeKey]) {
      return processEnv[nodeKey];
    }
  }

  // Check if we're in a Vite/browser environment
  if (typeof import.meta !== 'undefined' && 'env' in import.meta) {
    const importMetaEnv = (import.meta as any).env;
    if (importMetaEnv && importMetaEnv[viteKey]) {
      return importMetaEnv[viteKey];
    }
  }

  return defaultValue;
}

// Supabase connection - uses Publishable key (Anon key for local dev)
const supabaseUrl = getEnvVar(
  'SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'http://127.0.0.1:54321'
);

const supabasePublishableKey = getEnvVar(
  'SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

const supabaseClient = createClient<Database>(supabaseUrl, supabasePublishableKey);

/**
 * naming it this way since we will have a lot of "supabase"s around the code
 */
export default supabaseClient;

