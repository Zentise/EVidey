/**
 * Community charger reviews — backed by Firebase Firestore.
 * Collection schema: station_reviews / {autoId} → { stationId, userId, userName, rating, comment, createdAt }
 */
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseService';
import type { Review } from '../types';

const COLLECTION = 'station_reviews';

export async function fetchReviews(stationId: string): Promise<Review[]> {
  if (!isFirebaseConfigured) return [];
  const q = query(
    collection(db, COLLECTION),
    where('stationId', '==', stationId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const data = doc.data();
    const createdAt =
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString();
    return {
      id: doc.id,
      stationId: data.stationId,
      userId: data.userId,
      userName: data.userName,
      rating: data.rating,
      comment: data.comment ?? '',
      createdAt,
    } satisfies Review;
  });
}

export async function submitReview(
  stationId: string,
  userId: string,
  userName: string,
  rating: number,
  comment: string
): Promise<Review> {
  if (!isFirebaseConfigured) throw new Error('Firebase not configured — add Firebase keys to .env');
  const ref = await addDoc(collection(db, COLLECTION), {
    stationId,
    userId,
    userName,
    rating,
    comment,
    createdAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    stationId,
    userId,
    userName,
    rating,
    comment,
    createdAt: new Date().toISOString(),
  };
}
