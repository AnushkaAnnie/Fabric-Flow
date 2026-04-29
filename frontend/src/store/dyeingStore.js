import { create } from 'zustand';
import { dyeingAPI } from '../api/dyeing';

const useDyeingStore = create((set) => ({
  // Dyeing records (legacy)
  dyeings: [],
  dyeingsLoading: false,
  dyeingsError: null,

  fetchDyeings: async (page = 1, limit = 50, search = '') => {
    set({ dyeingsLoading: true, dyeingsError: null });
    try {
      const response = await dyeingAPI.getDyeing(page, limit, search);
      set({
        dyeings: response.data.data || [],
        dyeingsLoading: false,
      });
      return { total: response.data.total };
    } catch (error) {
      set({
        dyeingsError: error.response?.data?.message || 'Failed to fetch dyeings',
        dyeingsLoading: false,
      });
      return { total: 0 };
    }
  },

  // New dyeing program
  createProgram: async (data) => {
    try {
      const response = await dyeingAPI.createProgram(data);
      // Refresh dyeings list after successful creation
      await set((state) => state.fetchDyeings());
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create dyeing program',
      };
    }
  },
}));

export default useDyeingStore;
