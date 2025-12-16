import { Service } from '../models/serviceModel';

let services: Service[] = [
  {
    id: 1,
    provider_id: 1,
    title: 'تصميم شعار احترافي',
    description: 'أقدم خدمة تصميم شعارات احترافية ومبتكرة لشركتك أو مشروعك. تصميم فريد يعكس هويتك ويبرز علامتك التجارية في السوق.',
    category: 'photography', // Changed from 'design'
    price: 150,
    delivery_time: 3,
    image_url: '/placeholder.svg',
    rating: 4.9,
    reviews_count: 250,
    location: 'الرياض',
    service_level: 'مستوى احترافي',
    created_at: new Date('2023-01-10T00:00:00Z'),
    updated_at: new Date('2023-01-10T00:00:00Z'),
  },
  {
    id: 2,
    provider_id: 1,
    title: 'تطوير موقع ويب شخصي',
    description: 'بناء وتطوير مواقع ويب مخصصة تلبي احتياجاتك وتطلعاتك، مع تصميم عصري ومتجاوب.',
    category: 'private_tutoring', // Changed from 'development'
    price: 500,
    delivery_time: 7,
    image_url: '/placeholder.svg',
    rating: 4.7,
    reviews_count: 120,
    location: 'جدة',
    service_level: 'مستوى احترافي',
    created_at: new Date('2023-02-15T00:00:00Z'),
    updated_at: new Date('2023-02-15T00:00:00Z'),
  },
  {
    id: 3,
    provider_id: 1,
    title: 'كتابة محتوى تسويقي',
    description: 'كتابة محتوى جذاب ومقنع لمدوناتك، مواقعك، أو حملاتك التسويقية، لزيادة تفاعل الجمهور.',
    category: 'cleaning', // Changed from 'writing'
    price: 100,
    delivery_time: 2,
    image_url: '/placeholder.svg',
    rating: 4.8,
    reviews_count: 80,
    location: 'الدمام',
    service_level: 'مستوى متوسط',
    created_at: new Date('2023-03-20T00:00:00Z'),
    updated_at: new Date('2023-03-20T00:00:00Z'),
  },
  {
    id: 4,
    provider_id: 1,
    title: 'خدمة صيانة كهربائية',
    description: 'إصلاح الأعطال الكهربائية، تركيب الإضاءة، وصيانة الدوائر الكهربائية للمنازل والشركات.',
    category: 'electricity',
    price: 200,
    delivery_time: 1,
    image_url: '/placeholder.svg',
    rating: 4.5,
    reviews_count: 60,
    location: 'الرياض',
    service_level: 'مستوى احترافي',
    created_at: new Date('2023-04-01T00:00:00Z'),
    updated_at: new Date('2023-04-01T00:00:00Z'),
  },
  {
    id: 5,
    provider_id: 1,
    title: 'خدمة سباكة طارئة',
    description: 'إصلاح تسربات المياه، تركيب الأدوات الصحية، وصيانة شبكات الصرف الصحي على مدار الساعة.',
    category: 'plumbing',
    price: 180,
    delivery_time: 1,
    image_url: '/placeholder.svg',
    rating: 4.6,
    reviews_count: 75,
    location: 'جدة',
    service_level: 'مستوى احترافي',
    created_at: new Date('2023-05-05T00:00:00Z'),
    updated_at: new Date('2023-05-05T00:00:00Z'),
  },
  {
    id: 6,
    provider_id: 4, // Fatima Provider
    title: 'تنظيف عميق للمنازل',
    description: 'خدمة تنظيف شاملة وعميقة للمنازل، تشمل جميع الغرف والمطابخ والحمامات.',
    category: 'cleaning',
    price: 250,
    delivery_time: 1,
    image_url: '/placeholder.svg',
    rating: 4.9,
    reviews_count: 150,
    location: 'الرياض',
    service_level: 'مستوى احترافي',
    created_at: new Date('2023-06-10T00:00:00Z'),
    updated_at: new Date('2023-06-10T00:00:00Z'),
  },
];

let nextServiceId = services.length > 0 ? Math.max(...services.map(s => s.id || 0)) + 1 : 1;

export const serviceService = {
  async getAllServices(): Promise<Service[]> {
    return services;
  },

  async getServiceById(id: number): Promise<Service | undefined> {
    return services.find(s => s.id === id);
  },

  async createService(service: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'rating' | 'reviews_count'>): Promise<Service> {
    const newService: Service = {
      id: nextServiceId++,
      ...service,
      rating: 0, // Default rating for new service
      reviews_count: 0, // Default reviews count for new service
      created_at: new Date(),
      updated_at: new Date(),
    };
    services.push(newService);
    return newService;
  },

  async updateService(id: number, updates: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at'>>): Promise<Service | undefined> {
    const index = services.findIndex(s => s.id === id);
    if (index !== -1) {
      const updatedService = {
        ...services[index],
        ...updates,
        updated_at: new Date(),
      };
      services[index] = updatedService;
      return updatedService;
    }
    return undefined;
  },

  async deleteService(id: number): Promise<boolean> {
    const initialLength = services.length;
    services = services.filter(s => s.id !== id);
    return services.length < initialLength;
  },
};