import { create } from 'zustand';
import { FilterParams } from './recommend-engine';

interface AppState {
  // Search Filters
  searchFilters: Partial<FilterParams> & {
    selectedBrand?: string;
    selectedModel?: string;
    searchTerm?: string;
    showDiscountedOnly?: boolean;
    viewMode?: 'detailed' | 'compact';
    sortBy?: string;
  };
  setSearchFilters: (filters: Partial<AppState['searchFilters']>) => void;
  updateSearchFilter: (key: keyof AppState['searchFilters'], value: any) => void;

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
    viewMode: 'detailed',
    sortBy: 'rating',
    selectedBrand: '',
    selectedModel: '',
    searchTerm: '',
    showDiscountedOnly: false,
  },
  setSearchFilters: (filters) => 
    set((state) => ({ searchFilters: { ...state.searchFilters, ...filters } })),
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

