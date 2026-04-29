import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Clock, Package, User, Calendar, AlertCircle, Search, Filter } from 'lucide-react';
import { itemService, Item } from '../services/api';
import { Link } from 'react-router-dom';

const getImageUrl = (url?: string) => {
  if (!url || url.startsWith('blob:')) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `http://localhost:8080${url}`;
  return `http://localhost:8080/uploads/images/${url}`;
};

const statusConfig: Record<string, { class: string; label: string }> = {
  PENDING: { class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Pending' },
  APPROVED: { class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Approved' },
  REJECTED: { class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Rejected' },
  SOLD: { class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Sold' },
  UNSOLD: { class: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', label: 'Unsold' },
};

const AdminItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadItems(); }, [statusFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      let all = await itemService.getAllItemsForAdmin();
      if (statusFilter !== 'ALL') all = all.filter(i => i.status === statusFilter);
      setItems(all);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleApprove = async (itemId: number) => {
    try {
      setSubmitting(true);
      await itemService.approveItem(itemId);
      await loadItems();
    } catch { alert('Failed to approve item.'); }
    finally { setSubmitting(false); }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !rejectReason.trim()) return;
    try {
      setSubmitting(true);
      await itemService.rejectItem(selectedItem.itemId, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedItem(null);
      await loadItems();
    } catch { alert('Failed to reject item.'); }
    finally { setSubmitting(false); }
  };

  const tabs = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];
  const filtered = items.filter(i =>
    i.iName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.user.uName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">Item Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review and moderate user-submitted items</p>
            </div>
            <Link to="/admin" className="btn-secondary text-sm">← Dashboard</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === tab ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                {tab.charAt(0) + tab.slice(1).toLowerCase()} {statusFilter === tab && items.length > 0 && <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">{items.length}</span>}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search items..." className="input-field pl-10 text-sm py-2" />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="card h-48 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="font-bold text-gray-900 dark:text-white">No items found</p>
            <p className="text-sm text-gray-500 mt-1">
              {statusFilter === 'PENDING' ? 'No items pending review.' : `No ${statusFilter.toLowerCase()} items.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => {
              const imageUrl = getImageUrl(item.image);
              const sc = statusConfig[item.status] || statusConfig['PENDING'];
              return (
                <div key={item.itemId} className="card overflow-hidden hover:shadow-md transition-shadow animate-fadeIn">
                  <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.iName} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <Package className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2"><span className={`badge ${sc.class}`}>{sc.label}</span></div>
                    <div className="absolute top-2 right-2"><span className="badge bg-black/50 text-white">{item.category}</span></div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{item.iName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{item.user.uName}</span>
                      {item.price && <span className="font-semibold text-gray-700 dark:text-gray-200">৳{item.price.toLocaleString()}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <Link to={`/item/${item.itemId}`} target="_blank"
                        className="flex items-center gap-1 btn-secondary text-xs py-1.5 px-3">
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                      {item.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleApprove(item.itemId)} disabled={submitting}
                            className="flex-1 btn-success text-xs py-1.5 flex items-center justify-center gap-1 disabled:opacity-50">
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button onClick={() => { setSelectedItem(item); setShowRejectModal(true); }} disabled={submitting}
                            className="flex-1 btn-danger text-xs py-1.5 flex items-center justify-center gap-1 disabled:opacity-50">
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Reject Item</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Provide a reason for rejecting "<strong>{selectedItem.iName}</strong>"</p>
              <form onSubmit={handleReject}>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} required rows={3}
                  placeholder="Enter rejection reason..." className="input-field resize-none mb-4" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowRejectModal(false); setRejectReason(''); setSelectedItem(null); }} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 btn-danger disabled:opacity-50">
                    {submitting ? 'Rejecting...' : 'Reject Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminItems;
