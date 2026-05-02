import { create } from 'zustand';
import * as dyeingApi from '../api/dyeing';

const useDyeingStore = create((set, get) => ({
  dyeingList: [],
  dyeingLoading: false,
  dyeingError: null,

  fetchDyeings: async () => {
    set({ dyeingLoading: true, dyeingError: null });
    try {
      const res = await dyeingApi.getDyeings();
      set({ dyeingList: res.data.data || res.data, dyeingLoading: false });
    } catch (err) {
      set({
        dyeingError: err.response?.data?.message || 'Failed to fetch dyeings',
        dyeingLoading: false,
      });
    }
  },

  createDyeingProgram: async (payload) => {
    try {
      await dyeingApi.createDyeingProgram(payload);
      await get().fetchDyeings();
      // Refresh grey fabric list from knittingStore
      const useKnittingStore = (await import('./knittingStore')).default;
      await useKnittingStore.getState().fetchGreyFabric();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Dyeing program failed',
      };
    }
  },

  updateDyeing: async (id, data) => {
    try {
      await dyeingApi.updateDyeing(id, data);
      await get().fetchDyeings();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Update failed' };
    }
  },

  deleteDyeing: async (id) => {
    try {
      await dyeingApi.deleteDyeing(id);
      await get().fetchDyeings();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Delete failed' };
    }
  },
}));

export default useDyeingStore;
