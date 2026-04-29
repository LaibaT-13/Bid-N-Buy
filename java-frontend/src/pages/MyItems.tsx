import { useState, useEffect } from 'react';
import { Clock, MapPin, Eye, Trash2, Package, Plus, AlertCircle } from 'lucide-react';
import { itemService, Item } from '../services/api';
import { formatTaka } from '../utils/currency';
import { Link } from 'react-router-dom';

const getImageUrl = (url?: string) => {
  if (!url || url.startsWith('blob:')) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `http://localhost:8080${url}`;
  return `http://localhost:8080/uploads/images/${url}`;
};

const statusConfig: Record<string, { class: string; label: string }> = {
  PENDING: { class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Pending Review' },
  APPROVED: { class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Approved' },
  REJECTED: { class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Rejected' },
  SOLD: { class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Sold' },
  UNSOLD: { class: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', label: 'Unsold' },
};

const MyItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    itemService.getMyItems()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      setDeleting(true);
      await itemService.deleteItem(selectedItem.itemId);
      setItems(prev => prev.filter(i => i.itemId !== selectedItem.itemId));
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch { alert('Failed to delete item. Please try again.'); }
    finally { setDeleting(false); }
  };

  const filtered = statusFilter === 'ALL' ? items : items.filter(i => i.status === statusFilter);

  const counts = {
    ALL: items.length,
    PENDING: items.filter(i => i.status === 'PENDING').length,
    APPROVED: items.filter(i => i.status === 'APPROVED').length,
    SOLD: items.filter(i => i.status === 'SOLD').length,
    REJECTED: items.filter(i => i.status === 'REJECTED').length,
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Loading your items...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Items</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''} posted</p>
            </div>
            <Link to="/post" className="btn-primary flex items-center gap-1.5 text-sm">
              <Plus className="h-4 w-4" /> Post New Item
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit mb-6 overflow-x-auto">
          {Object.entries(counts).map(([key, count]) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {key.charAt(0) + key.slice(1).toLowerCase()}
              {count > 0 && <span className="ml-1.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full px-1.5 py-0.5">{count}</span>}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <Package className="h-14 w-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
              {statusFilter === 'ALL' ? 'No items yet' : `No ${statusFilter.toLowerCase()} items`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {statusFilter === 'ALL' ? 'Start selling by posting your first item!' : 'Items with this status will appear here.'}
            </p>
            <Link to="/post" className="btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Post an Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => {
              const imgUrl = getImageUrl(item.image);
              const sc = statusConfig[item.status] || statusConfig['PENDING'];
              return (
                <div key={item.itemId} className="card overflow-hidden hover:shadow-md transition-shadow group animate-fadeIn">
                  <div className="relative h-44 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {imgUrl ? (
                      <img src={imgUrl} alt={item.iName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <Package className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2"><span className={`badge ${sc.class}`}>{sc.label}</span></div>
                    {item.status === 'REJECTED' && item.rejectionReason && (
                      <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 text-white text-xs p-2 line-clamp-2">
                        <AlertCircle className="h-3 w-3 inline mr-1" />Rejected: {item.rejectionReason}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate mb-1">{item.iName}</h3>
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400 mb-2">{formatTaka(item.price || 0)}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {item.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(item.postDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <Link to={`/item/${item.itemId}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" /> View
                      </Link>
                      <button onClick={() => { setSelectedItem(item); setShowDeleteModal(true); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm animate-fadeIn p-6">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">Delete Item</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete "<strong className="text-gray-700 dark:text-gray-200">{selectedItem.iName}</strong>"? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setSelectedItem(null); }} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 btn-danger disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyItems;
