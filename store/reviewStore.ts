import { create } from 'zustand';
import type { Review } from '../types';
import { fetchReviews, submitReview } from '../services/reviewService';

interface ReviewState {
  /** stationId → reviews */
  reviews: Record<string, Review[]>;
  loading: Record<string, boolean>;
  loadReviews: (stationId: string) => Promise<void>;
  addReview: (
    stationId: string,
    userId: string,
    userName: string,
    rating: number,
    comment: string
  ) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: {},
  loading: {},

  loadReviews: async (stationId) => {
    set({ loading: { ...get().loading, [stationId]: true } });
    try {
      const data = await fetchReviews(stationId);
      set({ reviews: { ...get().reviews, [stationId]: data } });
    } catch {
      // Silently fail — reviews are non-critical
    } finally {
      set({ loading: { ...get().loading, [stationId]: false } });
    }
  },

  addReview: async (stationId, userId, userName, rating, comment) => {
    const review = await submitReview(stationId, userId, userName, rating, comment);
    const existing = get().reviews[stationId] ?? [];
    set({ reviews: { ...get().reviews, [stationId]: [review, ...existing] } });
  },
}));
