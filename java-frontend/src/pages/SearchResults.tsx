import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, Grid, List, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { itemService, Item } from '../services/api';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [condition, setCondition] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoryParam ? [categoryParam] : []);
  const [allResults, setAllResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['Books', 'Electronics', 'Home', 'Clothing', 'Other'];
  const conditions = [
    { value: 'all', label: 'All Conditions' },
    { value: 'like-new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'needs-fixing', label: 'Needs Fixing' },
  ];

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const items = await itemService.getAllItems();
        setAllResults(items);
      } catch (error) {
        setAllResults([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const transformItemForCard = (item: Item) => ({
    id: item.itemId.toString(),
    title: item.iName,
    price: item.price || 0,
    image: item.image || '',
    condition: item.condition || 'good',
    category: item.category,
    location: item.location || 'CUET Campus',
    timeAgo: new Date(item.postDate).toLocaleDateString('en-BD'),
    seller: { name: item.user.uName, verified: true }
  });

  const filteredResults = allResults.filter(item => {
    const matchesQuery = !query || item.iName.toLowerCase().includes(query.toLowerCase()) || item.description?.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
    const matchesPrice = (item.price || 0) >= priceRange[0] && (item.price || 0) <= priceRange[1];
    const matchesCondition = condition === 'all' || item.condition === condition;
    return matchesQuery && matchesCategory && matchesPrice && matchesCondition;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
    return new Date(b.postDate).getTime() - new Date(a.postDate).getTime();
  });

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setCondition('all');
    setPriceRange([0, 50000]);
  };

  const hasActiveFilters = selectedCategories.length > 0 || condition !== 'all' || priceRange[0] > 0 || priceRange[1] < 50000;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                {query ? `Results for "${query}"` : categoryParam ? categoryParam : 'All Items'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {loading ? 'Loading...' : `${filteredResults.length} item${filteredResults.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${showFilters ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-300'}`}>
                <SlidersHorizontal className="h-4 w-4" />
                Filters {hasActiveFilters && <span className="bg-white/30 text-white text-xs rounded-full px-1.5">!</span>}
              </button>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="input-field py-2 text-sm pr-8 max-w-[160px]">
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Grid className="h-4 w-4" />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <aside className="hidden lg:block w-64 flex-shrink-0 animate-slideIn">
              <div className="card p-5 sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white">Filters</h3>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1">
                      <X className="h-3 w-3" /> Clear all
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Category</h4>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                        <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => toggleCategory(cat)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Condition</h4>
                  <div className="space-y-2">
                    {conditions.map(c => (
                      <label key={c.value} className="flex items-center gap-2.5 cursor-pointer group">
                        <input type="radio" name="condition" value={c.value} checked={condition === c.value} onChange={() => setCondition(c.value)}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Price Range
                    <span className="text-gray-400 font-normal ml-2">৳{priceRange[0].toLocaleString()} – ৳{priceRange[1].toLocaleString()}</span>
                  </h4>
                  <input type="range" min="0" max="50000" step="500" value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-blue-600" />
                </div>
              </div>
            </aside>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Active filter pills */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategories.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                    {c}
                    <button onClick={() => toggleCategory(c)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {condition !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                    {conditions.find(c => c.value === condition)?.label}
                    <button onClick={() => setCondition('all')}><X className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-20 card">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2">No items found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filters or search terms.</p>
                <div className="flex gap-3 justify-center">
                  {hasActiveFilters && <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>}
                  <Link to="/post" className="btn-primary">Post an Item</Link>
                </div>
              </div>
            ) : (
              <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredResults.map(item => (
                  <ItemCard key={item.itemId} item={transformItemForCard(item)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
