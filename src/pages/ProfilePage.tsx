import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'seeker' | 'provider';
  bio?: string;
  avatarUrl?: string;
  phone?: string;
  providerType?: string;
  idNumber?: string;
  address?: string;
}

const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  // In a real app, you'd get the userId from auth context
  const response = await fetch(`http://localhost:3000/api/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
};

const updateUserProfile = async ({ userId, updates }: { userId: string; updates: Partial<UserProfile> }) => {
  const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update user profile');
  }
  return response.json();
};

const ProfilePage = () => {
  const queryClient = useQueryClient();
  // Placeholder for current user ID - replace with actual auth context
  const currentUserId = 'provider123'; // Example: 'provider123' or 'client456'

  const { data: user, isLoading, error } = useQuery<UserProfile, Error>({
    queryKey: ['userProfile', currentUserId],
    queryFn: () => fetchUserProfile(currentUserId),
    enabled: !!currentUserId,
  });

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Update state when user data is loaded
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', currentUserId] });
      toast.success('تم تحديث الملف الشخصي بنجاح!');
    },
    onError: (err) => {
      toast.error(`فشل في تحديث الملف الشخصي: ${err.message}`);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    updateProfileMutation.mutate({ userId: user.id, updates: { name, phone, bio } });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }
    // In a real app, you'd send currentPassword, newPassword to a backend endpoint
    // For now, just a toast
    toast.success('تم تغيير كلمة المرور بنجاح (وهمي)!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  if (isLoading) return (
    <DashboardLayout>
      <div className="text-center text-brand-text-dark font-ibm-plex-arabic">جاري تحميل الملف الشخصي...</div>
    </DashboardLayout>
  );
  if (error) return (
    <DashboardLayout>
      <div className="text-center text-brand-danger font-ibm-plex-arabic">خطأ في تحميل الملف الشخصي: {error.message}</div>
    </DashboardLayout>
  );
  if (!user) return (
    <DashboardLayout>
      <div className="text-center text-brand-text-muted font-ibm-plex-arabic">لا توجد بيانات للملف الشخصي.</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-3xl mx-auto text-right">
        <CardHeader className="p-0 pb-6">
          <CardTitle className="text-4xl font-cairo text-center text-brand-text-dark">الملف الشخصي</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-8">
          <div className="flex flex-col items-center mb-8">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-cairo text-brand-text-dark">{user.name}</h2>
            <p className="text-brand-text-muted font-ibm-plex-arabic">{user.email}</p>
            <p className="text-brand-primary font-semibold mt-2 font-ibm-plex-arabic">{user.role === 'provider' ? 'مقدم خدمة' : 'طالب خدمة'}</p>
          </div>

          <Card className="rounded-2xl shadow-soft bg-brand-background p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="font-cairo text-brand-text-dark text-2xl">معلومات شخصية</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="profile-name" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الاسم الكامل</Label>
                  <Input id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                </div>
                <div>
                  <Label htmlFor="profile-email" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">البريد الإلكتروني</Label>
                  <Input id="profile-email" type="email" defaultValue={user.email} disabled className="rounded-xl shadow-soft bg-brand-card-bg border-none font-ibm-plex-arabic text-right" />
                </div>
                <div>
                  <Label htmlFor="profile-phone" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رقم الهاتف</Label>
                  <Input id="profile-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                </div>
                <div>
                  <Label htmlFor="profile-bio" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">نبذة عني</Label>
                  <Textarea id="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                </div>
                <Button type="submit" className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft bg-brand-background p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="font-cairo text-brand-text-dark text-2xl">تغيير كلمة المرور</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="current-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">كلمة المرور الحالية</Label>
                  <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                </div>
                <div>
                  <Label htmlFor="new-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">كلمة المرور الجديدة</Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                </div>
                <div>
                  <Label htmlFor="confirm-new-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">تأكيد كلمة المرور الجديدة</Label>
                  <Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                </div>
                <Button type="submit" variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                  تغيير كلمة المرور
                </Button>
              </form>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ProfilePage;