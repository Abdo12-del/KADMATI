import { Service } from '../models/serviceModel';

let services: Service[] = [
  {
    id: 1,
    provider_id: 1,
    title: 'تصميم شعار احترافي',
    description: 'أقدم خدمة تصميم شعارات احترافية ومبتكرة لشركتك أو مشروعك. تصميم فريد يعكس هويتك ويبرز علامتك التجارية في السوق.',
    category: 'design',
    price: 150,
    delivery_time: 3,
    image_url: '/placeholder.svg',
    rating: 4.9,
    reviews_count: 250,
    location: 'الرياض',
    service_level: 'مستوى احترافي',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    provider_id: 1,
    title: 'تطوير موقع ويب شخصي',
    description: 'بناء وتطوير مواقع ويب مخصصة تلبي احتياجاتك وتطلعاتك، مع تصميم عصري ومتجاوب.',
    category: 'development',
    price: 500,
    delivery_time: 7,
    image_url: '/placeholder.svg',
    rating: 4.7,
    reviews_count: 120,
    location: 'جدة',
    service_level: 'مستوى احترافي',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 3,
    provider_id: 1,
    title: 'كتابة محتوى تسويقي',
    description: 'كتابة محتوى جذاب ومقنع لمدوناتك، مواقعك، أو حملاتك التسويقية، لزيادة تفاعل الجمهور.',
    category: 'writing',
    price: 100,
    delivery_time: 2,
    image_url: '/placeholder.svg',
    rating: 4.8,
    reviews_count: 80,
    location: 'الدمام',
    service_level: 'مستوى متوسط',
    created_at: new Date(),
    updated_at: new Date(),
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