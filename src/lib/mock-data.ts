import { RequestData, RatingData, ServiceData, UserData } from '@/types/app-types';

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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
    due_date: '2024-01-20',
    status: 'accepted',
    payment_status: 'unpaid',
    assigned_provider_id: 1, // Ahmed Provider
    agreed_price: 200,
    created_at: new Date('2023-11-10T10:00:00Z').toISOString(),
    updated_at: new Date('2023-11-12T11:00:00Z').toISOString(),
  },
  {
    id: 102,
    client_id: 2, // Laila Seeker
    title: 'طلب كتابة مقالات للمدونة',
    description: 'أحتاج إلى 5 مقالات حول التسويق الرقمي لمدونتي، كل مقال بطول 800 كلمة.',
    category: 'cleaning',
    due_date: '2024-01-25',
    status: 'payment_pending', // Payment pending
    payment_status: 'pending_review',
    payment_reference: 'PAYREF12345',
    receipt_url: 'https://example.com/receipts/receipt123.pdf',
    assigned_provider_id: 1, // Ahmed Provider
    agreed_price: 350,
    created_at: new Date('2023-11-15T14:00:00Z').toISOString(),
    updated_at: new Date('2023-11-18T09:00:00Z').toISOString(),
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
    created_at: new Date('2023-10-01T08:00:00Z').toISOString(),
    updated_at: new Date('2023-10-05T17:00:00Z').toISOString(),
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
    created_at: new Date('2023-12-01T11:00:00Z').toISOString(),
    updated_at: new Date('2023-12-01T11:00:00Z').toISOString(),
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
    created_at: new Date('2023-11-13T15:00:00Z').toISOString(),
  },
  {
    id: 202,
    service_id: 3, // كتابة محتوى تسويقي
    client_id: 2, // Laila Seeker
    rating: 4,
    comment: 'محتوى جيد جداً وسرعة في التنفيذ، شكراً.',
    created_at: new Date('2023-11-20T11:00:00Z').toISOString(),
  },
];