import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Calendar, MapPin, Package, MessageCircle, Phone, Mail } from 'lucide-react';
import { userService, itemService, User as UserType, Item } from '../services/api';
import ItemCard from '../components/ItemCard';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserType | null>(null);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) { setError('User not found'); setLoading(false); return; }
    const fetch = async () => {
      try {
        const profileData = await userService.getUserById(parseInt(userId));
        setUser(profileData);
        const items = await itemService.getAllItems();
        setUserItems(items.filter(i => i.user.userId === parseInt(userId) && i.status === 'APPROVED'));
      } catch { setError('Failed to load profile.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [userId]);

  const transformItemForCard = (item: Item) => ({
    id: item.itemId.toString(), title: item.iName, price: item.price || 0,
    image: item.image || '', condition: (item.condition || 'good') as any,
    category: item.category, location: item.location || 'CUET Campus',
    timeAgo: new Date(item.postDate).toLocaleDateString('en-BD'),
    seller: { name: item.user.uName, verified: true }
  });

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
      </div>
    </div>
  );

  if (error || !user) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <User className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error || 'User not found'}</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="h-28 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="card -mt-14 mb-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800 flex-shrink-0">
              <span className="text-2xl font-black text-white">{getInitials(user.uName)}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">{user.uName}</h1>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{user.uCusMail}</span>
                {user.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.address}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {new Date(user.dateJoined).toLocaleDateString('en-BD', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            <Link to={`/chat?user=${user.uCusMail}`}
              className="flex items-center gap-2 btn-primary flex-shrink-0 text-sm">
              <MessageCircle className="h-4 w-4" /> Message
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-black text-blue-600">{userItems.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Active Listings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-600">{user.role}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Member Type</div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-5">{user.uName.split(' ')[0]}'s Listings ({userItems.length})</h2>
          {userItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 dark:text-white mb-1">No active listings</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">This user hasn't posted any items yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {userItems.map(item => <ItemCard key={item.itemId} item={transformItemForCard(item)} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
