import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera as CameraIcon, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppPermissions } from '@/hooks/useAppPermissions';
import { api } from '@/api/client';
import { Card, CardBody, Button, Input, Textarea } from '@/components/ui';
import { fixFileUrl, fileToDataUrl } from '@/lib/utils';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const { requestCamera } = useAppPermissions();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);


  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    pan: user?.pan || '',
    address: user?.address || '',
    profilePhoto: user?.profilePhoto || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    // Safety check: don't send massive data if not changed
    const payload = { ...form };
    if (payload.profilePhoto === user?.profilePhoto) {
      delete payload.profilePhoto;
    }

    try {
      const { data } = await api.patch('/profile/me', payload);
      setUser(data.data.user);
      setSuccess('Profile updated successfully ✓');
      setTimeout(() => navigate('/staff/profile'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setError(msg);
      if (err.message?.includes('timeout')) {
        setError('Request timed out. The image might be too large for your connection.');
      }
    } finally {
      setLoading(false);
    }
  };


  const handlePhotoUpload = async () => {
    // Web/Desktop fallback
    if (!Capacitor.isNativePlatform()) {
      fileInputRef.current?.click();
      return;
    }

    const hasPermission = await requestCamera();
    if (!hasPermission) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const image = await Camera.getPhoto({
        quality: 60,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        width: 600,
        height: 600
      });

      if (image && image.dataUrl) {
        setForm(prev => ({ ...prev, profilePhoto: image.dataUrl }));
      }
    } catch (e) {
      const msg = e.message?.toLowerCase() || '';
      if (!msg.includes('cancel') && !msg.includes('user closed')) {
        console.error('Photo capture error:', e);
        fileInputRef.current?.click();
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm(prev => ({ ...prev, profilePhoto: dataUrl }));
    } catch (err) {
      setError('Failed to process image file');
    }
  };



  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/staff/profile')} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>

      {success && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{success}</div>}
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>}

      <Card>
        <CardBody>
          <form onSubmit={submit} className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="group relative">
                <div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-slate-100 bg-slate-50 shadow-md dark:border-slate-800">
                  {form.profilePhoto ? (
                    <img src={fixFileUrl(form.profilePhoto)} alt="Profile preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <CameraIcon className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handlePhotoUpload}
                  className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                >
                  <CameraIcon className="h-5 w-5" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-xs text-slate-500">Tap to update profile photo</p>
            </div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Full Name *" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />

              <Input label="Email Address (Non-Editable)" type="email" required value={form.email} disabled className="bg-slate-50 dark:bg-slate-800" />

              <Input label="Mobile Number" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />

              <Input label="PAN Number" value={form.pan}
                onChange={(e) => setForm({ ...form, pan: e.target.value })} />

              <div className="sm:col-span-2">
                <Input label="Position (Non-Editable)" value={user?.position || 'Staff'} disabled className="bg-slate-50 dark:bg-slate-800" />
              </div>

              <div className="sm:col-span-2">
                <Textarea label="Address" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading} className="flex-1">
                <Save className="h-4 w-4" /> Save Profile
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/staff/profile')} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
