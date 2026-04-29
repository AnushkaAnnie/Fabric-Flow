import { create } from 'zustand';
import * as knittingApi from '../api/knitting';

const useKnittingStore = create((set, get) => ({
  // Stock
  stockList: [],
  stockLoading: false,
  stockError: null,

  fetchStock: async (knitterId) => {
    set({ stockLoading: true, stockError: null });
    try {
      const res = await knittingApi.getKnitterStock(knitterId);
      set({ stockList: res.data, stockLoading: false });
    } catch (err) {
      set({
        stockError: err.response?.data?.message || 'Failed to fetch stock',
        stockLoading: false,
      });
    }
  },

  issueYarn: async (payload) => {
    try {
      await knittingApi.issueYarnToKnitter(payload);
      await get().fetchStock(payload.knitterId);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Issue failed',
      };
    }
  },

  // Delivery Notes
  deliveryNotes: [],
  deliveryNoteLoading: false,
  deliveryNoteError: null,

  fetchDeliveryNotes: async () => {
    set({ deliveryNoteLoading: true, deliveryNoteError: null });
    try {
      const res = await knittingApi.getDeliveryNotes();
      set({ deliveryNotes: res.data, deliveryNoteLoading: false });
    } catch (err) {
      set({
        deliveryNoteError: err.response?.data?.message || 'Failed to fetch delivery notes',
        deliveryNoteLoading: false,
      });
    }
  },

  createDeliveryNote: async (payload) => {
    try {
      await knittingApi.createDeliveryNote(payload);
      await get().fetchDeliveryNotes();
      await get().fetchStock(payload.sourceKnitterId);
      await get().fetchStock(payload.destKnitterId);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Transfer failed',
      };
    }
  },

  // Knitter Program
  programs: [],
  programLoading: false,
  programError: null,

  fetchPrograms: async (knitterId) => {
    set({ programLoading: true, programError: null });
    try {
      const res = await knittingApi.getKnitterPrograms(knitterId);
      set({ programs: res.data, programLoading: false });
    } catch (err) {
      set({
        programError: err.response?.data?.message || 'Failed to fetch programs',
        programLoading: false,
      });
    }
  },

  createProgram: async (payload) => {
    try {
      await knittingApi.createKnitterProgram(payload);
      await get().fetchPrograms(payload.knitterId);
      await get().fetchStock(payload.knitterId);
      await get().fetchGreyFabric();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Program creation failed',
      };
    }
  },

  // Grey Fabric
  greyFabricList: [],
  greyFabricLoading: false,
  greyFabricError: null,

  fetchGreyFabric: async () => {
    set({ greyFabricLoading: true, greyFabricError: null });
    try {
      const res = await knittingApi.getGreyFabricAvailable();
      set({ greyFabricList: res.data, greyFabricLoading: false });
    } catch (err) {
      set({
        greyFabricError: err.response?.data?.message || 'Failed to fetch grey fabric',
        greyFabricLoading: false,
      });
    }
  },
}));

export default useKnittingStore;
