/**
 * ViralCommerce AI — Watchlist / Favorites Store
 * Persists bookmarked product IDs to localStorage via Zustand.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WatchlistState {
  ids: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      add: (id) =>
        set((state) => ({
          ids: state.ids.includes(id) ? state.ids : [...state.ids, id],
        })),
      remove: (id) =>
        set((state) => ({ ids: state.ids.filter((x) => x !== id) })),
      toggle: (id) => {
        const { ids } = get();
        if (ids.includes(id)) {
          set({ ids: ids.filter((x) => x !== id) });
        } else {
          set({ ids: [...ids, id] });
        }
      },
      has: (id) => get().ids.includes(id),
    }),
    { name: "viralcommerce-watchlist" }
  )
);
