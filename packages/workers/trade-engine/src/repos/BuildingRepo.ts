import { supabaseClient } from '@stealth-town/shared/supabase';
import { BuildingStatus } from '@stealth-town/shared/types';

export class BuildingRepo {

  async updateBuildingStatus(buildingId: string, status: BuildingStatus) {
    const { error } = await supabaseClient
      .from('buildings')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', buildingId);

    if (error) throw error;
  }
}
