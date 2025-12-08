export interface Rating {
  id?: number;
  service_id: number;
  client_id: number;
  rating: number; // 1 to 5 stars
  comment?: string;
  created_at?: Date;
}