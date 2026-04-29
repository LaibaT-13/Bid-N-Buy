import React, { useState } from 'react';
import { Shield, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';

interface MakeAdminButtonProps {
  userId: number;
  userName: string;
  userEmail: string;
  isCurrentAdmin?: boolean;
}

const MakeAdminButton: React.FC<MakeAdminButtonProps> = ({ 
  userId, 
  userName, 
  userEmail,
  isCurrentAdmin = false 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Check if current user is admin
  const isAdminUser = user && user.isAdmin;

  const handlePromoteToAdmin = async () => {
    try {
      setLoading(true);
      setError('');
      
      await apiClient.post(`/admin/promote-user/${userId}`);
      
      setSuccess(true);
      setShowConfirmModal(false);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to promote user to admin');
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if:
  // - Current user is not admin
  // - Target user is already admin
  // - Target user is the current user
  if (!isAdminUser || isCurrentAdmin || user?.id === userId.toString()) {
    return null;
  }

  return (
    <div className="relative">
      {/* Success Message */}
      {success && (
        <div className="absolute -top-12 left-0 right-0 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm z-10">
          ✅ User promoted to admin successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute -top-12 left-0 right-0 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm z-10">
          ❌ {error}
        </div>
      )}

      {/* Make Admin Button */}
      <button
        onClick={() => setShowConfirmModal(true)}
        disabled={loading}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <Crown className="w-4 h-4" />
        )}
        Make Admin
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Make Admin
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Are you sure you want to promote <strong>{userName}</strong> to admin?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Email: {userEmail}
              </p>
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  ⚠️ This user will gain admin privileges and be able to:
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-500 mt-1 ml-4 list-disc">
                  <li>Approve/reject posts</li>
                  <li>Review reports and ban users</li>
                  <li>Promote other users to admin</li>
                  <li>Access admin dashboard</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePromoteToAdmin}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-md transition-colors font-medium"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Crown className="w-4 h-4" />
                )}
                Promote to Admin
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MakeAdminButton;