import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { Input } from '@/components/ui/input';

export const Profile = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDirectUpdate, setShowDirectUpdate] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showEmailUpdate, setShowEmailUpdate] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      toast.error('Error signing out');
      console.error('Error:', error);
    }
  };

  const handleResetRequest = async () => {
    if (!user?.email) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/update-password`,
        options: {
          emailRedirectTo: `${window.location.origin}/update-password`
        }
      });

      if (error) {
        console.error('Reset password error:', error);
        
        // Check for specific error messages
        if (error.message.includes('rate limit')) {
          toast.error('Please wait a few minutes before trying again');
        } else if (error.message.includes('email provider') || error.message.includes('sending recovery email')) {
          toast.error('Email service not configured. Please contact support.');
          console.error('Email provider not configured in Supabase. Go to Authentication > Email Templates > Email Provider to set up.');
        } else {
          toast.error('Error sending reset email. Please try again later.');
        }
        return;
      }

      toast.success('Check your email for the reset link');
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectPasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error('Update password error:', error);
        toast.error('Error updating password');
        return;
      }
      
      toast.success('Password updated successfully');
      setShowDirectUpdate(false);
      setNewPassword('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Basic email validation
      if (!newEmail || !newEmail.includes('@') || !newEmail.includes('.')) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });
      
      if (error) {
        console.error('Email update error:', error);
        toast.error(error.message || 'Error updating email');
        return;
      }
      
      toast.success('Email updated successfully');
      setShowEmailUpdate(false);
      setNewEmail('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Profile Form */}
      <ProfileForm />
      
      {/* Password Reset and Logout Buttons */}
      <div className="mt-6 space-y-4 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
        <div className="flex flex-col space-y-3">
          <Button 
            onClick={handleResetRequest} 
            disabled={loading}
            variant="secondary"
            className="w-full"
          >
            {loading ? 'Sending...' : 'Reset Password'}
          </Button>
          
          {showDirectUpdate ? (
            <form onSubmit={handleDirectPasswordUpdate} className="mt-4">
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mb-2"
              />
              <div className="flex space-x-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDirectUpdate(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button 
              onClick={() => setShowDirectUpdate(true)} 
              variant="outline"
              className="w-full mt-2"
            >
              Update Password Directly
            </Button>
          )}          
          
          <Button 
            onClick={handleLogout} 
            variant="destructive"
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}; 