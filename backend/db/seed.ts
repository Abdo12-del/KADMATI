import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

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

  // Insert dummy users
  const userId1 = uuidv4();
  const userId2 = uuidv4();
  const userId3 = uuidv4();

  await knex('users').insert([
    {
      id: userId1,
      name: 'مقدم الخدمة التجريبي',
      email: 'provider@example.com',
      password: 'password123', // In real app, hash this
      role: 'provider',
      phone: '0501234567',
      providerType: 'craftsman-card',
      idNumber: '1234567890',
      address: 'الرياض، حي النرجس',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=PT',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      id: userId2,
      name: 'طالب الخدمة التجريبي',
      email: 'client@example.com',
      password: 'password123',
      role: 'seeker',
      phone: '0551234567',
      address: 'جدة، حي الروضة',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=CT',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      id: userId3,
      name: 'عميل آخر',
      email: 'client2@example.com',
      password: 'password123',
      role: 'seeker',
      phone: '0561234567',
      address: 'الدمام، حي الشاطئ',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=CA',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);

  // Insert dummy services
  const serviceId1 = uuidv4();
  const serviceId2 = uuidv4();

  await knex('services').insert([
    {
      id: serviceId1,
      providerId: userId1,
      title: 'تصميم شعار احترافي',
      description: 'تصميم شعارات فريدة وعصرية لشركتك الناشئة أو مشروعك الخاص.',
      category: 'design',
      price: 150.00,
      deliveryTime: 3,
      imageUrl: 'https://via.placeholder.com/400x200/306BFF/FFFFFF?text=Logo+Design',
      rating: 4.5,
      reviewsCount: 2,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      id: serviceId2,
      providerId: userId1,
      title: 'تطوير موقع ويب شخصي',
      description: 'بناء موقع ويب شخصي متكامل لعرض أعمالك وخدماتك بأسلوب احترافي.',
      category: 'development',
      price: 500.00,
      deliveryTime: 7,
      imageUrl: 'https://via.placeholder.com/400x200/306BFF/FFFFFF?text=Web+Development',
      rating: 4.0,
      reviewsCount: 1,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);

  // Insert dummy requests
  const requestId1 = uuidv4();
  await knex('requests').insert([
    {
      id: requestId1,
      clientId: userId2,
      title: 'أحتاج صيانة منزلية عاجلة',
      description: 'تسرب مياه في الحمام، أحتاج فني سباكة بشكل عاجل لإصلاح المشكلة.',
      location: 'جدة، حي الروضة',
      dueDate: 'خلال 24 ساعة',
      additionalOptions: 'يفضل فني لديه خبرة في أنظمة السباكة الحديثة.',
      status: 'Pending',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);

  // Insert dummy conversations
  const convId1 = uuidv4();
  await knex('conversations').insert([
    {
      id: convId1,
      participant1Id: userId1, // Provider
      participant2Id: userId2, // Client
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);

  // Insert dummy messages
  await knex('messages').insert([
    {
      id: uuidv4(),
      conversationId: convId1,
      senderId: userId2, // Client
      text: 'مرحباً، هل أنت متاح لمشروع تصميم شعار جديد؟',
      read: true,
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      id: uuidv4(),
      conversationId: convId1,
      senderId: userId1, // Provider
      text: 'أهلاً بك! نعم، أنا متاح. ما هي تفاصيل المشروع؟',
      read: true,
      timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(), // 55 mins ago
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      id: uuidv4(),
      conversationId: convId1,
      senderId: userId2, // Client
      text: 'أحتاج شعارًا لشركة تقنية ناشئة. أريد شيئًا حديثًا وبسيطًا.',
      read: false,
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins ago
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);

  // Insert dummy orders
  const orderId1 = uuidv4();
  await knex('orders').insert([
    {
      id: orderId1,
      serviceId: serviceId1,
      clientId: userId2,
      providerId: userId1,
      price: 150.00,
      status: 'Pending',
      details: 'طلب تصميم شعار لشركة تقنية.',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);

  // Insert dummy notifications
  await knex('notifications').insert([
    {
      id: uuidv4(),
      userId: userId1, // Provider
      type: 'order',
      title: 'طلب خدمة جديد!',
      description: `لديك طلب جديد للخدمة "تصميم شعار احترافي" من العميل طالب الخدمة التجريبي.`,
      read: false,
      link: `/dashboard/orders/${orderId1}`,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      id: uuidv4(),
      userId: userId2, // Client
      type: 'system',
      title: 'مرحباً بك في المنصة!',
      description: 'شكراً لانضمامك إلى منصة الخدمات. استكشف الخدمات أو أضف طلبك الأول.',
      read: false,
      link: '/client-home',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);

  // Insert dummy ratings
  await knex('ratings').insert([
    {
      id: uuidv4(),
      serviceId: serviceId1,
      clientId: userId2,
      rating: 5,
      comment: 'خدمة ممتازة وتصميم إبداعي، أنصح به بشدة!',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      id: uuidv4(),
      serviceId: serviceId1,
      clientId: userId3,
      rating: 4,
      comment: 'تصميم جيد جداً، ولكن استغرق وقتاً أطول قليلاً من المتوقع.',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);

  // Insert dummy calendar events
  await knex('calendar_events').insert([
    {
      id: uuidv4(),
      userId: userId1, // Provider
      title: 'اجتماع مشروع تصميم شعار',
      description: 'اجتماع مع العميل لمناقشة متطلبات تصميم الشعار.',
      start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour after start
      type: 'appointment',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      id: uuidv4(),
      userId: userId1, // Provider
      title: 'إجازة شخصية',
      description: 'إجازة قصيرة للاسترخاء.',
      start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      end: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days from now
      type: 'vacation',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);
}