import { Request } from '../models/requestModel';

let requests: Request[] = [
  {
    id: 1,
    client_id: 2, // Laila Seeker
    title: 'طلب تصميم موقع شخصي',
    description: 'أحتاج إلى تصميم موقع ويب شخصي لعرض أعمالي الفنية، مع معرض صور ونموذج اتصال.',
    category: 'photography', // Changed from 'development'
    location: 'الرياض',
    due_date: '2024-01-15',
    additional_options: 'تصميم متجاوب مع الجوالات.',
    status: 'pending',
    payment_status: 'unpaid',
    assigned_provider_id: undefined, // Not yet accepted
    agreed_price: undefined,
    created_at: new Date('2023-11-01T10:00:00Z'),
    updated_at: new Date('2023-11-01T10:00:00Z'),
  },
  {
    id: 2,
    client_id: 2, // Laila Seeker
    title: 'طلب كتابة مقال تسويقي',
    description: 'مقال تسويقي عن فوائد استخدام الطاقة المتجددة في المنازل، بطول 1000 كلمة.',
    category: 'private_tutoring', // Changed from 'writing'
    due_date: '2024-01-10',
    status: 'accepted',
    payment_status: 'unpaid',
    assigned_provider_id: 1, // Accepted by Ahmed Provider
    agreed_price: 100, // Agreed price
    created_at: new Date('2023-11-05T14:30:00Z'),
    updated_at: new Date('2023-11-06T09:00:00Z'),
  },
  {
    id: 3,
    client_id: 2, // Laila Seeker
    title: 'تصميم شعار لشركة ناشئة',
    description: 'شعار احترافي لشركة تقنية جديدة، أرغب في تصميم عصري وبسيط.',
    category: 'cleaning', // Changed from 'design'
    status: 'completed',
    payment_status: 'paid',
    assigned_provider_id: 1, // Completed by Ahmed Provider
    agreed_price: 150, // Agreed price
    created_at: new Date('2023-10-20T11:00:00Z'),
    updated_at: new Date('2023-10-25T16:00:00Z'),
  },
  {
    id: 4,
    client_id: 2, // Laila Seeker
    title: 'طلب صيانة كهربائية',
    description: 'أحتاج فني صيانة لإصلاح بعض الأعطال الكهربائية في المنزل.',
    category: 'electricity', // Changed from 'maintenance'
    location: 'جدة',
    due_date: '2024-02-01',
    status: 'pending',
    payment_status: 'unpaid',
    assigned_provider_id: undefined,
    agreed_price: undefined,
    created_at: new Date('2023-12-10T09:00:00Z'),
    updated_at: new Date('2023-12-10T09:00:00Z'),
  },
  {
    id: 5,
    client_id: 2, // Laila Seeker
    title: 'طلب تصميم هوية بصرية',
    description: 'تصميم هوية بصرية كاملة لعلامة تجارية جديدة تشمل الشعار، الألوان، والخطوط.',
    category: 'plumbing', // Changed from 'design'
    status: 'accepted',
    payment_status: 'unpaid',
    assigned_provider_id: 1, // Accepted by Ahmed Provider
    agreed_price: 300,
    created_at: new Date('2023-12-15T11:00:00Z'),
    updated_at: new Date('2023-12-16T10:00:00Z'),
  },
];

// Ensure all existing requests have default payment_status and new fields
requests = requests.map(req => ({
  ...req,
  payment_status: req.payment_status || 'unpaid',
  assigned_provider_id: req.assigned_provider_id || undefined,
  agreed_price: req.agreed_price || undefined,
}));

let nextRequestId = requests.length > 0 ? Math.max(...requests.map(r => r.id || 0)) + 1 : 1;

export const requestService = {
  async getAllRequests(): Promise<Request[]> {
    return requests;
  },

  async getRequestById(id: number): Promise<Request | undefined> {
    return requests.find(r => r.id === id);
  },

  async createRequest(request: Omit<Request, 'id' | 'created_at' | 'updated_at' | 'status' | 'payment_status' | 'assigned_provider_id' | 'agreed_price'>): Promise<Request> {
    const newRequest: Request = {
      id: nextRequestId++,
      ...request,
      status: 'pending', // Default status for new requests
      payment_status: 'unpaid', // Default payment status for new requests
      assigned_provider_id: undefined, // Not assigned initially
      agreed_price: undefined, // No agreed price initially
      created_at: new Date(),
      updated_at: new Date(),
    };
    requests.push(newRequest);
    return newRequest;
  },

  async updateRequest(id: number, updates: Partial<Request>): Promise<Request | undefined> {
    const index = requests.findIndex(r => r.id === id);
    if (index !== -1) {
      const updatedRequest = {
        ...requests[index],
        ...updates,
        updated_at: new Date(),
      };
      requests[index] = updatedRequest;
      return updatedRequest;
    }
    return undefined;
  },

  async deleteRequest(id: number): Promise<boolean> {
    const initialLength = requests.length;
    requests = requests.filter(r => r.id !== id);
    return requests.length < initialLength;
  },
};