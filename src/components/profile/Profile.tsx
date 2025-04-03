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
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
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
        redirectTo: `${window.location.origin}/update-password`
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

  const handleInviteFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Basic email validation
      if (!friendEmail || !friendEmail.includes('@') || !friendEmail.includes('.')) {
        toast.error('Please enter a valid email address');
        return;
      }
      // using magicLink method - customised by adding emailRedirectTo and using inviteUser email temaplate in Suppabase/Email/Templates
      const { error } = await supabase.auth.signInWithOtp({
        email: friendEmail,
        options: {
          emailRedirectTo: 'https://www.saparchitectprep.com/login',
          data: {
            invited_by: user?.email
          }
        }
      });
      
      if (error) {
        console.error('Invite error:', error);
        if (error.message.includes('rate limit')) {
          toast.error('Please wait a few minutes before sending another invite');
        } else {
          toast.error(error.message || 'Error sending invitation');
        }
        return;
      }
      
      toast.success('Invitation sent successfully. Your friend will receive an email with a link to create their account.');
      setShowInviteForm(false);
      setFriendEmail('');
    } catch (error: any) {
      console.error('Invite error:', error);
      toast.error(error.message || 'Error sending invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Profile Form */}
      <ProfileForm />
      
      {/* Account Actions */}
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
          
          {showInviteForm ? (
            <form onSubmit={handleInviteFriend} className="mt-4">
              <Input
                type="email"
                placeholder="Friend's Email Address"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                required
                className="mb-2"
              />
              <div className="flex space-x-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Sending...' : 'Send Invitation'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button 
              onClick={() => setShowInviteForm(true)} 
              variant="outline"
              className="w-full mt-2"
            >
              Invite a Friend
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