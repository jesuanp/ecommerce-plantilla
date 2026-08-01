import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, logout, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    address: user?.address || '',
    city: user?.city || '',
    zipCode: user?.zipCode || '',
    country: user?.country || 'US',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await updateProfile(form);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Update failed');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <button onClick={handleLogout} className="btn-secondary text-sm">
          Sign out
        </button>
      </div>

      <div className="bg-white border border-ink-200 rounded-2xl p-6 space-y-6">
        <div>
          <p className="text-sm text-ink-500">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input-base"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="input-base"
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">City</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">ZIP code</label>
              <input
                type="text"
                value={form.zipCode}
                onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))}
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Country</label>
            <select
              value={form.country}
              onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              className="input-base"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="MX">Mexico</option>
              <option value="ES">Spain</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
