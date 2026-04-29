import { create } from 'zustand';
import { knittingAPI } from '../api/knitting';

const useKnittingStore = create((set) => ({
  // Stock
  stock: [],
  stockLoading: false,
  stockError: null,

  fetchStock: async (knitterId = null) => {
    set({ stockLoading: true, stockError: null });
    try {
      const response = await knittingAPI.getStock(knitterId);
      set({ stock: response.data, stockLoading: false });
    } catch (error) {
      set({ 
        stockError: error.response?.data?.message || 'Failed to fetch stock',
        stockLoading: false,
      });
    }
  },

  issueYarn: async (data) => {
    try {
      const response = await knittingAPI.issueYarn(data);
      // Refresh stock after successful issue
      await set((state) => state.fetchStock());
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to issue yarn',
      };
    }
  },

  // Delivery Notes
  deliveryNotes: [],
  deliveryNotesLoading: false,
  deliveryNotesError: null,

  fetchDeliveryNotes: async () => {
    set({ deliveryNotesLoading: true, deliveryNotesError: null });
    try {
      const response = await knittingAPI.getDeliveryNotes();
      set({ deliveryNotes: response.data, deliveryNotesLoading: false });
    } catch (error) {
      set({
        deliveryNotesError: error.response?.data?.message || 'Failed to fetch delivery notes',
        deliveryNotesLoading: false,
      });
    }
  },

  createDeliveryNote: async (data) => {
    try {
      const response = await knittingAPI.createDeliveryNote(data);
      // Refresh lists after successful creation
      await set((state) => {
        state.fetchDeliveryNotes();
        state.fetchStock();
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create delivery note',
      };
    }
  },

  // Programs (Knitter Programs)
  programs: [],
  programsLoading: false,
  programsError: null,

  fetchPrograms: async (knitterId = null) => {
    set({ programsLoading: true, programsError: null });
    try {
      const response = await knittingAPI.getPrograms(knitterId);
      set({ programs: response.data, programsLoading: false });
    } catch (error) {
      set({
        programsError: error.response?.data?.message || 'Failed to fetch programs',
        programsLoading: false,
      });
    }
  },

  createProgram: async (data) => {
    try {
      const response = await knittingAPI.createProgram(data);
      // Refresh lists after successful creation
      await set((state) => {
        state.fetchPrograms();
        state.fetchStock();
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create program',
      };
    }
  },

  // Grey Fabric Lots
  greyFabricLots: [],
  greyFabricLoading: false,
  greyFabricError: null,

  fetchGreyFabricLots: async () => {
    set({ greyFabricLoading: true, greyFabricError: null });
    try {
      const response = await knittingAPI.getGreyFabricLots();
      set({ greyFabricLots: response.data, greyFabricLoading: false });
    } catch (error) {
      set({
        greyFabricError: error.response?.data?.message || 'Failed to fetch grey fabric lots',
        greyFabricLoading: false,
      });
    }
  },
}));

export default useKnittingStore;
