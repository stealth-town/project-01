import type { Database } from "../supabase/database.types.js";

export type ConcreteItem = Database["public"]["Tables"]["concrete_items"]["Row"];