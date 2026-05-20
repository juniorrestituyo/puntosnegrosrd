import type { CategoryKey } from './constants';

export type PointStatus =
  | 'nuevo'
  | 'corroborado'
  | 'notificado'
  | 'en_atencion'
  | 'resuelto';

export interface Point {
  id: string;
  lat: number;
  lng: number;
  category: CategoryKey;
  subcategory: string | null;
  description: string;
  status: PointStatus;
  photo_url: string | null;
  province: string | null;
  municipality: string | null;
  created_at: string;
  updated_at: string;
  confirmation_count: number;
}

export interface PointInput {
  lat: number;
  lng: number;
  category: CategoryKey;
  subcategory?: string;
  description: string;
  province?: string;
  municipality?: string;
  photo_url?: string;
}

export interface StatusHistoryEntry {
  id: string;
  point_id: string;
  old_status: PointStatus | null;
  new_status: PointStatus;
  note: string | null;
  changed_by: string | null;
  created_at: string;
}
