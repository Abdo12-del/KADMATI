export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  start: Date;
  end?: Date;
  type?: 'appointment' | 'task' | 'vacation';
  createdAt?: Date;
  updatedAt?: Date;
}