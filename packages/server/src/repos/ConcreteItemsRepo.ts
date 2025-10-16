import { supabaseClient } from "@stealth-town/shared/supabase";
import type { ConcreteItem } from "@stealth-town/shared/types";

export class ConcreteItemsRepo {
    async getCount(): Promise<number> {
        const { count, error } = await supabaseClient
            .from("concrete_items")
            .select("*", { count: "exact", head: true });

        if (error) throw error;
        return count || 0;
    }

    async getConcreteItem(id: number): Promise<ConcreteItem> {
        const { data, error } = await supabaseClient
            .from("concrete_items")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return data;
    }
}