import { create } from 'zustand';
import { FilterParams } from './recommend-engine';

interface AppState {
  // Search Filters
  searchFilters: Partial<FilterParams>;
  setSearchFilters: (filters: Partial<FilterParams>) => void;
  updateSearchFilter: (key: keyof FilterParams, value: any) => void;

  // Comparison
  compareVehicles: any[];
  addToCompare: (vehicle: any) => void;
  removeFromCompare: (vehicleId: string) => void;
  clearCompare: () => void;

  // Results
  lastResults: any[];
  setLastResults: (results: any[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  searchFilters: {
    budget: 5000000, // Default 50L NPR
  },
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  updateSearchFilter: (key, value) => 
    set((state) => ({ 
      searchFilters: { ...state.searchFilters, [key]: value } 
    })),

  compareVehicles: [],
  addToCompare: (vehicle) => 
    set((state) => {
      // Max 4 vehicles for comparison
      if (state.compareVehicles.length >= 4) return state;
      if (state.compareVehicles.find(v => v.id === vehicle.id)) return state;
      return { compareVehicles: [...state.compareVehicles, vehicle] };
    }),
  removeFromCompare: (vehicleId) => 
    set((state) => ({
      compareVehicles: state.compareVehicles.filter(v => v.id !== vehicleId)
    })),
  clearCompare: () => set({ compareVehicles: [] }),

  lastResults: [],
  setLastResults: (results) => set({ lastResults: results }),
}));
