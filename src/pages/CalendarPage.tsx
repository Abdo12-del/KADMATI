import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';

interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  start: string; // ISO string
  end?: string; // ISO string
  type?: 'appointment' | 'task' | 'vacation';
  createdAt: string;
}

const fetchCalendarEvents = async (userId: string): Promise<CalendarEvent[]> => {
  const response = await fetch(`http://localhost:3000/api/calendar/user/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch calendar events');
  }
  return response.json();
};

const CalendarPage = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  // Placeholder for current user ID - replace with actual auth context
  const currentUserId = 'provider123'; // Example: 'provider123' or 'client456'

  const { data: events = [], isLoading, error } = useQuery<CalendarEvent[], Error>({
    queryKey: ['calendarEvents', currentUserId],
    queryFn: () => fetchCalendarEvents(currentUserId),
    enabled: !!currentUserId,
    refetchInterval: 60000, // Poll for updates every minute
  });

  const getEventsForDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) return [];
    return events.filter(event => {
      const eventStartDate = new Date(event.start);
      return eventStartDate.toDateString() === selectedDate.toDateString();
    });
  };

  const selectedDateEvents = getEventsForDate(date);

  if (isLoading) return (
    <DashboardLayout>
      <div className="text-center text-brand-text-dark font-ibm-plex-arabic">جاري تحميل التقويم...</div>
    </DashboardLayout>
  );
  if (error) return (
    <DashboardLayout>
      <div className="text-center text-brand-danger font-ibm-plex-arabic">خطأ في تحميل التقويم: {error.message}</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">التقويم وتوفر الخدمة</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6">
          <CardHeader className="p-0 pb-4 text-right">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">التقويم</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-2xl border border-border shadow-soft bg-brand-background"
              dir="rtl" // Ensure calendar is RTL
            />
          </CardContent>
        </Card>

        <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6 text-right">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">أحداث اليوم ({date?.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {selectedDateEvents.length > 0 ? (
              <ul className="space-y-4">
                {selectedDateEvents.map(event => (
                  <li key={event.id} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
                    <p className="font-cairo text-brand-text-dark font-semibold">{event.title}</p>
                    <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">
                      {new Date(event.start).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      {event.end && ` - ${new Date(event.end).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                    {event.description && <p className="text-xs text-brand-text-muted font-ibm-plex-arabic mt-1">{event.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-brand-text-muted font-ibm-plex-arabic">لا توجد أحداث لهذا اليوم.</p>
            )}
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-cairo text-brand-text-dark">تعديل التوفر</h3>
              <Select>
                <SelectTrigger className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
                  <SelectValue placeholder="اختر حالة التوفر" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
                  <SelectItem value="available">متاح</SelectItem>
                  <SelectItem value="busy">مشغول</SelectItem>
                  <SelectItem value="vacation">إجازة</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                حفظ التوفر
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;