import { RequestData, RatingData, ServiceData, UserData, MessageData } from '@/types/app-types';

// Helper to get a date some days/months ago
const getRecentDate = (daysAgo: number = 0, monthsAgo: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setMonth(date.getMonth() - monthsAgo);
  return date.toISOString();
};

// Mock Users
export const mockUsers: UserData[] = [
  {
    id: 1,
    name: 'أحمد مقدم',
    email: 'ahmed.provider@example.com',
    role: 'provider',
    phone: '+966501234567',
    bio: 'مصمم جرافيك بخبرة 5 سنوات في تصميم الشعارات والهويات البصرية.',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=AP',
    favorite_service_ids: [],
    created_at: getRecentDate(150), // ~5 months ago
    updated_at: getRecentDate(100), // ~3 months ago
  },
  {
    id: 2,
    name: 'ليلى طالبة',
    email: 'layla.seeker@example.com',
    role: 'seeker',
    phone: '+966557654321',
    bio: 'أبحث عن خدمات تصميم وتطوير لمشروعي الجديد.',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=LS',
    favorite_service_ids: [1, 3], // Laila likes service 1 and 3
    created_at: getRecentDate(180), // ~6 months ago
    updated_at: getRecentDate(120), // ~4 months ago
  },
  {
    id: 3,
    name: 'خالد عميل',
    email: 'khalid.client@example.com',
    role: 'seeker',
    phone: '+966509876543',
    bio: 'أبحث عن خدمات منزلية متنوعة.',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=KC',
    favorite_service_ids: [],
    created_at: getRecentDate(90), // ~3 months ago
    updated_at: getRecentDate(30), // ~1 month ago
  },
];

// Mock Services
export const mockServices: ServiceData[] = [
  {
    id: 1,
    provider_id: 1,
    title: 'تصميم شعار احترافي',
    description: 'أقدم خدمة تصميم شعارات احترافية ومبتكرة لشركتك أو مشروعك. تصميم فريد يعكس هويتك ويبرز علامتك التجارية في السوق.',
    category: 'photography',
    price: 150,
    delivery_time: 3,
    image_url: '/placeholder.svg',
    rating: 4.9,
    reviews_count: 250,
    location: 'الرياض',
    service_level: 'مستوى احترافي',
    created_at: getRecentDate(60), // 2 months ago
    updated_at: getRecentDate(5), // 5 days ago
  },
  {
    id: 2,
    provider_id: 1,
    title: 'تطوير موقع ويب شخصي',
    description: 'بناء وتطوير مواقع ويب مخصصة تلبي احتياجاتك وتطلعاتك، مع تصميم عصري ومتجاوب.',
    category: 'private_tutoring',
    price: 500,
    delivery_time: 7,
    image_url: '/placeholder.svg',
    rating: 4.7,
    reviews_count: 120,
    location: 'جدة',
    service_level: 'مستوى احترافي',
    created_at: getRecentDate(90), // 3 months ago
    updated_at: getRecentDate(10), // 10 days ago
  },
  {
    id: 3,
    provider_id: 1,
    title: 'كتابة محتوى تسويقي',
    description: 'كتابة محتوى جذاب ومقنع لمدوناتك، مواقعك، أو حملاتك التسويقية، لزيادة تفاعل الجمهور.',
    category: 'cleaning',
    price: 100,
    delivery_time: 2,
    image_url: '/placeholder.svg',
    rating: 4.8,
    reviews_count: 80,
    location: 'الدمام',
    service_level: 'مستوى متوسط',
    created_at: getRecentDate(30), // 1 month ago
    updated_at: getRecentDate(2), // 2 days ago
  },
];

// Mock Requests (for ClientPaymentsTab)
export const mockRequests: RequestData[] = [
  {
    id: 101,
    client_id: 2, // Laila Seeker
    title: 'طلب تصميم شعار لمتجر جديد',
    description: 'أحتاج إلى شعار عصري وجذاب لمتجري الإلكتروني الجديد لبيع المنتجات اليدوية.',
    category: 'photography',
    location: 'الرياض',
    due_date: getRecentDate(-10).split('T')[0], // 10 days in future
    status: 'accepted',
    payment_status: 'unpaid',
    assigned_provider_id: 1, // Ahmed Provider
    agreed_price: 200,
    created_at: getRecentDate(45), // 1.5 months ago
    updated_at: getRecentDate(30), // 1 month ago
  },
  {
    id: 102,
    client_id: 2, // Laila Seeker
    title: 'طلب كتابة مقالات للمدونة',
    description: 'أحتاج إلى 5 مقالات حول التسويق الرقمي لمدونتي، كل مقال بطول 800 كلمة.',
    category: 'cleaning',
    due_date: getRecentDate(-5).split('T')[0], // 5 days in future
    status: 'payment_pending', // Payment pending
    payment_status: 'pending_review',
    payment_reference: 'PAYREF12345',
    receipt_url: 'https://example.com/receipts/receipt123.pdf',
    assigned_provider_id: 1, // Ahmed Provider
    agreed_price: 350,
    created_at: getRecentDate(20), // 20 days ago
    updated_at: getRecentDate(15), // 15 days ago
  },
  {
    id: 103,
    client_id: 2, // Laila Seeker
    title: 'طلب صيانة كهربائية للمنزل',
    description: 'إصلاح بعض الأعطال الكهربائية في المطبخ وغرفة المعيشة.',
    category: 'electricity',
    location: 'جدة',
    status: 'completed',
    payment_status: 'paid',
    payment_reference: 'PAIDREF67890',
    receipt_url: 'https://example.com/receipts/receipt456.pdf',
    assigned_provider_id: 1, // Ahmed Provider
    agreed_price: 120,
    created_at: getRecentDate(100), // ~3 months ago
    updated_at: getRecentDate(95), // ~3 months ago
  },
  {
    id: 104,
    client_id: 2, // Laila Seeker
    title: 'طلب تصميم هوية بصرية كاملة',
    description: 'تصميم شعار، ألوان، خطوط، وبطاقات عمل لعلامة تجارية جديدة.',
    category: 'photography',
    status: 'pending', // Still pending acceptance
    payment_status: 'unpaid',
    assigned_provider_id: undefined,
    agreed_price: undefined,
    created_at: getRecentDate(5), // 5 days ago
    updated_at: getRecentDate(5), // 5 days ago
  },
];

// Mock Ratings (for ClientReviewsTab)
export const mockRatings: RatingData[] = [
  {
    id: 201,
    service_id: 1, // تصميم شعار احترافي
    client_id: 2, // Laila Seeker
    rating: 5,
    comment: 'خدمة ممتازة وشعار رائع، أنصح به بشدة!',
    created_at: getRecentDate(40), // ~1.3 months ago
  },
  {
    id: 202,
    service_id: 3, // كتابة محتوى تسويقي
    client_id: 2, // Laila Seeker
    rating: 4,
    comment: 'محتوى جيد جداً وسرعة في التنفيذ، شكراً.',
    created_at: getRecentDate(10), // 10 days ago
  },
];

// Mock Messages
export const mockMessages: MessageData[] = [
  {
    id: 1,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-2-1',
    text: 'مرحباً أحمد، هل يمكنك البدء في تصميم الشعار قريباً؟',
    read: false,
    created_at: getRecentDate(3), // 3 days ago
  },
  {
    id: 2,
    sender_id: 1, // Ahmed Provider
    receiver_id: 2, // Laila Seeker
    conversation_id: 'conv-2-1',
    text: 'أهلاً ليلى، نعم سأبدأ العمل عليه اليوم. سأرسل لك المسودة الأولى غداً.',
    read: true,
    created_at: getRecentDate(2), // 2 days ago
  },
  {
    id: 3,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-2-1',
    text: 'رائع، شكراً لك!',
    read: false,
    created_at: getRecentDate(1), // 1 day ago
  },
  {
    id: 4,
    sender_id: 3, // Khalid Client
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-3-1',
    text: 'مرحباً، هل تقدمون خدمات صيانة التكييف؟',
    read: false,
    created_at: getRecentDate(7), // 7 days ago
  },
  {
    id: 5,
    sender_id: 1, // Ahmed Provider
    receiver_id: 3, // Khalid Client
    conversation_id: 'conv-3-1',
    text: 'أهلاً بك خالد، نعم نقدم خدمات صيانة التكييف. ما هي المشكلة التي تواجهها؟',
    read: true,
    created_at: getRecentDate(6), // 6 days ago
  },
];