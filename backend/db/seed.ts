import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('ratings').del();
  await knex('messages').del();
  await knex('conversations').del();
  await knex('orders').del();
  await knex('notifications').del();
  await knex('calendar_events').del();
  await knex('requests').del();
  await knex('services').del();
  await knex('users').del();

  // Define IDs
  const clientId = uuidv4();
  const providerId = uuidv4();
  const service1Id = uuidv4();
  const service2Id = uuidv4();
  const requestId = uuidv4();
  const orderId = uuidv4();
  const conversationId = uuidv4();
  const message1Id = uuidv4();
  const message2Id = uuidv4();
  const ratingId = uuidv4();
  const notification1Id = uuidv4(); // For provider: new order
  const notification2Id = uuidv4(); // For client: order status update
  const notification3Id = uuidv4(); // For provider: new message
  const calendarEvent1Id = uuidv4();

  // Hash password for users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Insert Users
  await knex('users').insert([
    {
      id: clientId,
      name: 'أحمد العميل',
      email: 'ahmed.client@example.com',
      password: hashedPassword,
      role: 'seeker',
      phone: '0501234567',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AC',
      address: 'الرياض، حي النرجس',
    },
    {
      id: providerId,
      name: 'فاطمة مقدمة الخدمة',
      email: 'fatima.provider@example.com',
      password: hashedPassword,
      role: 'provider',
      phone: '0557654321',
      providerType: 'craftsman-card',
      idNumber: '1234567890',
      address: 'جدة، حي الروضة',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=FP',
      bio: 'مقدمة خدمة محترفة في التصميم الجرافيكي وتطوير الويب بخبرة تزيد عن 5 سنوات.',
    },
  ]);

  // Insert Services
  await knex('services').insert([
    {
      id: service1Id,
      providerId: providerId,
      title: 'تصميم شعار احترافي',
      description: 'تصميم شعار فريد واحترافي لشركتك أو مشروعك، مع تسليم الملفات المصدرية.',
      category: 'design',
      price: 150.00,
      deliveryTime: 5,
      imageUrl: 'https://via.placeholder.com/400x200/306BFF/FFFFFF?text=Logo+Design',
      rating: 4.5,
      reviewsCount: 1,
    },
    {
      id: service2Id,
      providerId: providerId,
      title: 'تطوير موقع إلكتروني شخصي',
      description: 'إنشاء موقع إلكتروني شخصي جذاب ومتجاوب لعرض أعمالك وخدماتك.',
      category: 'development',
      price: 500.00,
      deliveryTime: 14,
      imageUrl: 'https://via.placeholder.com/400x200/306BFF/FFFFFF?text=Web+Development',
      rating: 0.0,
      reviewsCount: 0,
    },
  ]);

  // Insert Requests
  await knex('requests').insert([
    {
      id: requestId,
      clientId: clientId,
      title: 'أحتاج صيانة منزلية عاجلة',
      description: 'أبحث عن فني لإصلاح تسرب مياه في الحمام، يفضل أن يكون متاحًا اليوم.',
      location: 'الرياض، حي الياسمين',
      dueDate: 'اليوم',
      additionalOptions: 'يجب أن يكون لديه أدواته الخاصة.',
      status: 'Pending',
    },
  ]);

  // Insert Orders
  await knex('orders').insert([
    {
      id: orderId,
      serviceId: service1Id,
      clientId: clientId,
      providerId: providerId,
      price: 150.00,
      status: 'Completed',
      details: 'طلب تصميم شعار احترافي لشركة ناشئة.',
    },
  ]);

  // Insert Conversations
  await knex('conversations').insert([
    {
      id: conversationId,
      participant1Id: clientId,
      participant2Id: providerId,
    },
  ]);

  // Insert Messages
  await knex('messages').insert([
    {
      id: message1Id,
      conversationId: conversationId,
      senderId: clientId,
      text: 'مرحباً فاطمة، هل يمكنك تصميم شعار لشركتي؟',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      read: true,
    },
    {
      id: message2Id,
      conversationId: conversationId,
      senderId: providerId,
      text: 'أهلاً بك أحمد! بالتأكيد، يرجى تزويدي بالمزيد من التفاصيل حول مشروعك.',
      timestamp: new Date().toISOString(), // now
      read: false,
    },
  ]);

  // Insert Ratings
  await knex('ratings').insert([
    {
      id: ratingId,
      serviceId: service1Id,
      clientId: clientId,
      rating: 5,
      comment: 'خدمة ممتازة وشعار احترافي للغاية، أنصح بها بشدة!',
    },
  ]);

  // Insert Notifications
  await knex('notifications').insert([
    {
      id: notification1Id,
      userId: providerId,
      type: 'order',
      title: 'طلب خدمة جديد!',
      description: `لديك طلب جديد للخدمة "تصميم شعار احترافي" من العميل أحمد العميل.`,
      link: `/dashboard/orders/${orderId}`,
      read: false,
    },
    {
      id: notification2Id,
      userId: clientId,
      type: 'order',
      title: 'تحديث حالة طلبك: Completed',
      description: `تم تحديث حالة طلبك للخدمة "تصميم شعار احترافي" إلى "Completed".`,
      link: `/client-dashboard/orders/${orderId}`,
      read: false,
    },
    {
      id: notification3Id,
      userId: providerId,
      type: 'message',
      title: 'رسالة جديدة من أحمد العميل',
      description: 'أهلاً بك أحمد! بالتأكيد، يرجى تزويدي بالمزيد من التفاصيل حول مشروعك.',
      link: `/dashboard/messages/${conversationId}`,
      read: false,
    },
  ]);

  // Insert Calendar Events
  await knex('calendar_events').insert([
    {
      id: calendarEvent1Id,
      userId: providerId,
      title: 'اجتماع مع العميل أحمد',
      description: 'مناقشة تفاصيل مشروع تصميم الشعار.',
      start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour duration
      type: 'appointment',
    },
  ]);
}