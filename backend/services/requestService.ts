import { Request } from '../models/requestModel';

let requests: Request[] = [
  {
    id: 1,
    client_id: 2, // Laila Seeker
    title: 'طلب تصميم موقع شخصي',
    description: 'أحتاج إلى تصميم موقع ويب شخصي لعرض أعمالي الفنية، مع معرض صور ونموذج اتصال.',
    category: 'development',
    location: 'الرياض',
    due_date: '2024-01-15',
    additional_options: 'تصميم متجاوب مع الجوالات.',
    status: 'pending',
    payment_status: 'unpaid', // Default for existing
    created_at: new Date('2023-11-01T10:00:00Z'),
    updated_at: new Date('2023-11-01T10:00:00Z'),
  },
  {
    id: 2,
    client_id: 2, // Laila Seeker
    title: 'طلب كتابة مقال تسويقي',
    description: 'مقال تسويقي عن فوائد استخدام الطاقة المتجددة في المنازل، بطول 1000 كلمة.',
    category: 'writing',
    due_date: '2024-01-10',
    status: 'accepted',
    payment_status: 'unpaid', // Default for existing
    created_at: new Date('2023-11-05T14:30:00Z'),
    updated_at: new Date('2023-11-06T09:00:00Z'),
  },
  {
    id: 3,
    client_id: 2, // Laila Seeker
    title: 'تصميم شعار لشركة ناشئة',
    description: 'شعار احترافي لشركة تقنية جديدة، أرغب في تصميم عصري وبسيط.',
    category: 'design',
    status: 'completed',
    payment_status: 'paid', // Default for existing
    created_at: new Date('2023-10-20T11:00:00Z'),
    updated_at: new Date('2023-10-25T16:00:00Z'),
  },
];

// Ensure all existing requests have default payment_status
requests = requests.map(req => ({
  ...req,
  payment_status: req.payment_status || 'unpaid',
}));

let nextRequestId = requests.length > 0 ? Math.max(...requests.map(r => r.id || 0)) + 1 : 1;

export const requestService = {
  async getAllRequests(): Promise<Request[]> {
    return requests;
  },

  async getRequestById(id: number): Promise<Request | undefined> {
    return requests.find(r => r.id === id);
  },

  async createRequest(request: Omit<Request, 'id' | 'created_at' | 'updated_at' | 'status' | 'payment_status'>): Promise<Request> {
    const newRequest: Request = {
      id: nextRequestId++,
      ...request,
      status: 'pending', // Default status for new requests
      payment_status: 'unpaid', // Default payment status for new requests
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