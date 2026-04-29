import { useState, useEffect } from 'react';
import { User, Calendar, MapPin, Package, Phone, Mail, Edit3, TrendingUp, ShoppingBag, Star, Link as LinkIcon } from 'lucide-react';
import { userService, itemService, User as UserType, UserStats, Item } from '../services/api';
import ItemCard from '../components/ItemCard';
import { Link } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'listings' | 'sold'>('listings');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const [profileData, statsData] = await Promise.all([
          userService.getCurrentProfile(),
          userService.getCurrentStats()
        ]);
        setUser(profileData);
        setStats(statsData);
        try {
          const items = await itemService.getAllItems();
          setUserItems(items.filter(item => item.user.uCusMail === profileData.uCusMail));
        } catch { setUserItems([]); }
      } catch {
        setError('Failed to load profile. Please try again.');
      } finally { setLoading(false); }
    };
    fetchProfileData();
  }, []);

  const transformItemForCard = (item: Item) => ({
    id: item.itemId.toString(),
    title: item.iName,
    price: item.price || 0,
    image: item.image || '',
    condition: (item.condition || 'good') as any,
    category: item.category,
    location: item.location || 'CUET Campus',
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
        <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
      </div>
    </div>
  );

  const activeItems = userItems.filter(i => i.status === 'APPROVED');
  const soldItems = userItems.filter(i => i.status === 'SOLD');
  const displayItems = activeTab === 'listings' ? activeItems : soldItems;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Banner */}
      <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile Card */}
        <div className="card -mt-16 mb-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800">
                <span className="text-3xl font-black text-white">{getInitials(user.uName)}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white dark:border-gray-800" title="Active" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">{user.uName}</h1>
              <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{user.uCusMail}</span>
                {user.uPhone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{user.uPhone}</span>}
                {user.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.address}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {new Date(user.dateJoined).toLocaleDateString('en-BD', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Link to="/post" className="btn-primary flex items-center gap-1.5 text-sm">
                <Package className="h-4 w-4" /> Post Item
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            {[
              { label: 'Items Posted', value: stats?.itemsPosted ?? userItems.length, icon: TrendingUp, color: 'text-blue-600' },
              { label: 'Items Sold', value: stats?.itemsSold ?? soldItems.length, icon: ShoppingBag, color: 'text-green-600' },
              { label: 'Active Listings', value: activeItems.length, icon: Star, color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Listings */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button onClick={() => setActiveTab('listings')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'listings' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                Active Listings ({activeItems.length})
              </button>
              <button onClick={() => setActiveTab('sold')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'sold' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                Sold ({soldItems.length})
              </button>
            </div>
          </div>

          {displayItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                {activeTab === 'listings' ? 'No active listings' : 'No sold items yet'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {activeTab === 'listings' ? 'Start by posting your first item to the marketplace.' : 'Sold items will appear here.'}
              </p>
              {activeTab === 'listings' && <Link to="/post" className="btn-primary text-sm">Post an Item</Link>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayItems.map(item => (
                <ItemCard key={item.itemId} item={transformItemForCard(item)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
