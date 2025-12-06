import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CalendarPage = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  // Placeholder for events/bookings
  const events = [
    { id: 'e1', date: new Date(2023, 9, 28), title: 'اجتماع مشروع تصميم', time: '10:00 AM' },
    { id: 'e2', date: new Date(2023, 9, 28), title: 'تسليم خدمة تطوير', time: '02:00 PM' },
    { id: 'e3', date: new Date(2023, 9, 30), title: 'مكالمة عميل جديد', time: '11:00 AM' },
  ];

  const getEventsForDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) return [];
    return events.filter(event =>
      event.date.toDateString() === selectedDate.toDateString()
    );
  };

  const selectedDateEvents = getEventsForDate(date);

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-gray-800">التقويم وتوفر الخدمة</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-montserrat">التقويم</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border shadow"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-montserrat">أحداث اليوم ({date?.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })})</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length > 0 ? (
              <ul className="space-y-4">
                {selectedDateEvents.map(event => (
                  <li key={event.id} className="border-b pb-2 last:border-b-0">
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.time}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">لا توجد أحداث لهذا اليوم.</p>
            )}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold font-montserrat">تعديل التوفر</h3>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر حالة التوفر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">متاح</SelectItem>
                  <SelectItem value="busy">مشغول</SelectItem>
                  <SelectItem value="vacation">إجازة</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full bg-orange-button hover:bg-orange-button/90 text-white">
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