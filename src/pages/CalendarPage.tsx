"use client";

import React from 'react';
// import DashboardLayout from '@/components/DashboardLayout'; // Removed
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CalendarPage = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [availability, setAvailability] = React.useState<string>('available');

  // Placeholder for events/bookings
  const events = [
    { id: 'e1', date: new Date(2023, 10, 28), title: 'اجتماع مشروع تصميم', time: '10:00 ص' },
    { id: 'e2', date: new Date(2023, 10, 28), title: 'تسليم خدمة تطوير', time: '02:00 م' },
    { id: 'e3', date: new Date(2023, 10, 30), title: 'مكالمة عميل جديد', time: '11:00 ص' },
  ];

  const getEventsForDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) return [];
    return events.filter(event =>
      event.date.toDateString() === selectedDate.toDateString()
    );
  };

  const selectedDateEvents = getEventsForDate(date);

  const handleSaveAvailability = () => {
    toast.success(`تم حفظ حالة التوفر كـ "${availability}" (وظيفة وهمية)!`);
    console.log('Availability saved:', availability);
  };

  return (
    <>
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
                    <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">{event.time}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-brand-text-muted font-ibm-plex-arabic">لا توجد أحداث لهذا اليوم.</p>
            )}
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-cairo text-brand-text-dark">تعديل التوفر</h3>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
                  <SelectValue placeholder="اختر حالة التوفر" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
                  <SelectItem value="available">متاح</SelectItem>
                  <SelectItem value="busy">مشغول</SelectItem>
                  <SelectItem value="vacation">إجازة</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSaveAvailability} className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                حفظ التوفر
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CalendarPage;