import { Link } from 'react-router-dom';
import { BookOpen, Laptop, Sofa, Shirt, Coffee, Users, Recycle, ArrowRight, Gavel, ShieldCheck, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import ItemCard from '../components/ItemCard';
import { itemService, userService, Item } from '../services/api';

const Homepage = () => {
  const [featuredItems, setFeaturedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const categories = [
    { id: 'Books', name: 'Books', icon: BookOpen, color: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    { id: 'Electronics', name: 'Electronics', icon: Laptop, color: 'bg-purple-500', light: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
    { id: 'Home', name: 'Home', icon: Sofa, color: 'bg-green-500', light: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
    { id: 'Clothing', name: 'Clothing', icon: Shirt, color: 'bg-pink-500', light: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400' },
    { id: 'Other', name: 'Other', icon: Coffee, color: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
  ];

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const items = await itemService.getAllItems();
        setFeaturedItems(items.slice(0, 8));
      } catch (err) {
        setFeaturedItems([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const [itemCount, userCount] = await Promise.all([
          itemService.getTotalCount(),
          userService.getTotalCount()
        ]);
        setTotalItems(itemCount);
        setTotalUsers(userCount);
      } catch (err) {
        // Keep defaults
      } finally {
        setStatsLoading(false);
      }
    };

    fetchItems();
    fetchStats();
  }, []);

  const transformItemForCard = (item: Item) => ({
    id: item.itemId.toString(),
    title: item.iName,
    price: item.price || 0,
    image: item.image || '',
    condition: (item.condition || 'good') as 'like-new' | 'good' | 'fair' | 'needs-fixing',
    category: item.category,
    location: item.location || 'CUET Campus',
    timeAgo: new Date(item.postDate).toLocaleDateString('en-BD'),
    seller: { name: item.user.uName, verified: true }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-blue-200 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            CUET Campus Marketplace
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">
            Bid<span className="text-blue-400">&</span>Buy
          </h1>
          <p className="text-lg md:text-xl text-blue-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Buy, sell, and trade items within the CUET community. Safe, affordable, and built for students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-900 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/30 hover:shadow-xl">
              Browse Items
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/post"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all border border-blue-500 shadow-lg shadow-blue-900/30">
              Post an Item
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 mt-14 pt-10 border-t border-white/10">
            <div className="text-center">
              <div className="text-3xl font-black text-white">{statsLoading ? '—' : totalItems}</div>
              <div className="text-sm text-blue-300 mt-0.5">Items Listed</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-black text-white">{statsLoading ? '—' : totalUsers}</div>
              <div className="text-sm text-blue-300 mt-0.5">Registered Users</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-black text-white">100%</div>
              <div className="text-sm text-blue-300 mt-0.5">CUET Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">Browse by Category</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Find exactly what you're looking for</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/search?category=${cat.id}`}
                className={`group ${cat.light} rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-700`}>
                <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                  <cat.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className={`font-bold ${cat.text} text-sm`}>{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-14 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">Latest Listings</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Recently posted items from CUET community</p>
            </div>
            <Link to="/search"
              className="hidden sm:flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold hover:gap-2.5 transition-all text-sm">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredItems.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Recycle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">No Items Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Be the first to list an item on the marketplace.</p>
              <Link to="/post" className="btn-primary">Post the First Item</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredItems.map((item) => (
                <ItemCard key={item.itemId} item={transformItemForCard(item)} />
              ))}
            </div>
          )}

          {featuredItems.length > 0 && (
            <div className="text-center mt-8">
              <Link to="/search" className="inline-flex items-center gap-2 btn-primary">
                View All Items <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why Bid & Buy */}
      <section className="py-14 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">Why Bid & Buy?</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Built specifically for the CUET community</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', title: 'CUET Verified Only', desc: 'Every user is verified with an institutional CUET email. No strangers, only trusted community members.' },
              { icon: Gavel, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', title: 'Live Auctions', desc: 'Real-time bidding with countdown timers, bid history, and automatic winner selection.' },
              { icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', title: 'In-App Messaging', desc: 'Chat directly with buyers and sellers without sharing your personal contact details.' },
            ].map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Ready to Start Trading?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">Join hundreds of CUET students already buying and selling on campus.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search" className="px-8 py-3.5 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">
              Browse Items
            </Link>
            <Link to="/post" className="px-8 py-3.5 bg-transparent border-2 border-white/60 text-white rounded-xl font-bold hover:bg-white/10 transition-colors">
              Post an Item
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
