import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { updateProfile, connectKroger } from '../services/api';
import './Profile.css';

export default function Profile({ user, onUpdate }) {
  const isPlaceholderName = user.name === 'Kroger User';

  const [form, setForm] = useState({
    name: isPlaceholderName ? '' : user.name,
    email: user.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await updateProfile({
        name: form.name,
        email: form.email,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined,
      });
      onUpdate(updated);
      setSuccess(true);
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="profile-page">
      <div className="profile-card">
        <h1>My Profile</h1>
        <p className="profile-subtitle">Update your account details below.</p>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-section-title">Account Info</div>

          <div className="form-row">
            <label>Name</label>
            <input
              className="form-input"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={isPlaceholderName ? 'Add your name' : ''}
              required
            />
          </div>

          <div className="form-row">
            <label>Email</label>
            <input
              className="form-input"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Add your email address"
              required={!user.krogerOnly}
            />
          </div>

          <div className="profile-section-title">Change Password <span className="optional">(optional)</span></div>

          <div className="form-row">
            <label>Current Password</label>
            <div className="password-wrapper">
              <input className="form-input" name="currentPassword" type={showCurrent ? 'text' : 'password'} placeholder="••••••••" value={form.currentPassword} onChange={handleChange} />
              <button type="button" className="password-toggle" onClick={() => setShowCurrent((p) => !p)}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-row">
            <label>New Password</label>
            <div className="password-wrapper">
              <input className="form-input" name="newPassword" type={showNew ? 'text' : 'password'} placeholder="••••••••" value={form.newPassword} onChange={handleChange} />
              <button type="button" className="password-toggle" onClick={() => setShowNew((p) => !p)}>
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-row">
            <label>Confirm New Password</label>
            <div className="password-wrapper">
              <input className="form-input" name="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} />
              <button type="button" className="password-toggle" onClick={() => setShowConfirm((p) => !p)}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="profile-error">{error}</p>}
          {success && <p className="profile-success">Profile updated successfully!</p>}

          <button className="profile-save-btn" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="profile-kroger-section">
          <div className="profile-section-title" style={{ marginTop: '1.5rem' }}>Kroger Account</div>
          {user.krogerConnected ? (
            <div className="kroger-connected-badge">
              <span className="kroger-dot" />
              Connected — your name and email are synced from Kroger
            </div>
          ) : (
            <div className="kroger-connect-row">
              <p className="kroger-connect-desc">Connect your Kroger account to send ingredients directly to your cart.</p>
              <button className="kroger-connect-profile-btn" onClick={connectKroger}>Connect Kroger</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
