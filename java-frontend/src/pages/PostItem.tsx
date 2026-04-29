import React, { useState } from 'react';
import { Camera, X, MapPin, Tag, FileText, Package, CheckCircle, Clock, Gavel, DollarSign, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { itemService, imageService, CreateItemWithAuctionRequest } from '../services/api';

const PostItem = () => {
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', condition: '', price: '',
    location: '', tags: '', contactMethod: 'chat',
    listingType: 'fixed', startingBid: '', minimumIncrement: '',
    auctionDays: '3', auctionHours: '0', reservePrice: '', buyNowPrice: '', allowBuyNow: true
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const categories = ['Books', 'Electronics', 'Home', 'Clothing', 'Other'];
  const conditions = [
    { value: 'like-new', label: 'Like New', desc: 'Barely used, excellent condition' },
    { value: 'good', label: 'Good', desc: 'Used but well maintained' },
    { value: 'fair', label: 'Fair', desc: 'Shows wear but functional' },
    { value: 'needs-fixing', label: 'Needs Fixing', desc: 'Requires repair' }
  ];
  const locations = [
    'CUET Campus', 'Hall 1 (Bangabandhu Hall)', 'Hall 2 (Kazi Nazrul Islam Hall)',
    'Hall 3 (Dr. M. A. Rashid Hall)', 'Hall 4 (Shahjalal Hall)',
    'Hall 5 (Shaheed Abdur Rab Serniabat Hall)', 'Near Main Gate',
    'Academic Area', 'Near Library', 'Faculty Area', 'Staff Quarter', 'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('blob:') || url.startsWith('http')) return url;
    if (url.startsWith('/')) return `http://localhost:8080${url}`;
    return `http://localhost:8080/uploads/images/${url}`;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || images.length >= 8) return;
    setUploading(true);
    setError('');
    try {
      const previews = Array.from(files).map(f => URL.createObjectURL(f));
      setImages(prev => [...prev, ...previews].slice(0, 8));
      const uploaded = await Promise.all(
        Array.from(files).map(async (file, i) => {
          const res = await imageService.uploadImage(file);
          URL.revokeObjectURL(previews[i]);
          return res.url;
        })
      );
      setImages(prev => {
        const withoutPreviews = prev.filter(u => !u.startsWith('blob:'));
        return [...withoutPreviews, ...uploaded].slice(0, 8);
      });
    } catch (err) {
      setImages(prev => prev.filter(u => !u.startsWith('blob:')));
      setError('Failed to upload images. Please try again.');
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (!formData.title || !formData.description || !formData.category || !formData.condition || !formData.location) {
        throw new Error('Please fill in all required fields.');
      }
      if (formData.listingType === 'fixed' && !formData.price) throw new Error('Price is required for fixed price listing.');
      if (formData.listingType === 'auction' && (!formData.startingBid || !formData.minimumIncrement)) {
        throw new Error('Starting bid and minimum increment are required for auctions.');
      }
      const validImages = images.filter(u => !u.startsWith('blob:'));
      const baseItem = {
        iName: formData.title, description: formData.description, category: formData.category,
        condition: formData.condition, location: formData.location,
        image: validImages[0] || undefined,
        status: 'PENDING' as const,
        biddingEnabled: formData.listingType === 'auction',
        price: formData.listingType === 'fixed' ? parseFloat(formData.price) : undefined,
      };
      if (formData.listingType === 'auction') {
        const endTime = new Date();
        endTime.setDate(endTime.getDate() + parseInt(formData.auctionDays));
        endTime.setHours(endTime.getHours() + parseInt(formData.auctionHours));
        await itemService.createItemWithAuction({
          item: baseItem,
          auctionData: {
            startingBid: parseFloat(formData.startingBid),
            minimumIncrement: parseFloat(formData.minimumIncrement),
            endTime: endTime.toISOString(),
            reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : undefined,
            buyNowPrice: formData.buyNowPrice ? parseFloat(formData.buyNowPrice) : undefined,
            allowBuyNow: formData.allowBuyNow,
          }
        });
      } else {
        await itemService.createItem(baseItem);
      }
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post item. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 dark:text-white font-medium">Post an Item</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Post an Item</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Share your item with the CUET community</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-fadeIn">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Images */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-1">Photos</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Add up to 8 photos. First photo will be the main image.</p>
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative group aspect-square">
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover rounded-xl" />
                  {img.startsWith('blob:') && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  {i === 0 && <div className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">MAIN</div>}
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 8 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex flex-col items-center justify-center gap-1.5">
                  <Camera className="h-6 w-6 text-gray-400" />
                  <span className="text-xs text-gray-400 font-medium">Add Photo</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-gray-900 dark:text-white">Item Details</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Title <span className="text-red-500">*</span></label>
              <input name="title" type="text" required value={formData.title} onChange={handleInputChange}
                className="input-field" placeholder="e.g., iPhone 12 - 64GB Blue, Engineering Textbook" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category <span className="text-red-500">*</span></label>
                <select name="category" required value={formData.category} onChange={handleInputChange} className="input-field">
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Condition <span className="text-red-500">*</span></label>
                <select name="condition" required value={formData.condition} onChange={handleInputChange} className="input-field">
                  <option value="">Select condition</option>
                  {conditions.map(c => <option key={c.value} value={c.value}>{c.label} — {c.desc}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5"><MapPin className="inline h-3.5 w-3.5 mr-1" />Pickup Location <span className="text-red-500">*</span></label>
                <select name="location" required value={formData.location} onChange={handleInputChange} className="input-field">
                  <option value="">Select location</option>
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5"><Tag className="inline h-3.5 w-3.5 mr-1" />Tags <span className="text-gray-400 font-normal">(optional)</span></label>
                <input name="tags" type="text" value={formData.tags} onChange={handleInputChange}
                  className="input-field" placeholder="textbook, engineering, math" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5"><FileText className="inline h-3.5 w-3.5 mr-1" />Description <span className="text-red-500">*</span></label>
              <textarea name="description" required rows={4} value={formData.description} onChange={handleInputChange}
                className="input-field resize-none" placeholder="Describe your item — condition, any defects, reason for selling..." />
            </div>
          </div>

          {/* Listing Type */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">Listing Type</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { value: 'fixed', label: 'Fixed Price', desc: 'Set a price for direct purchase', icon: DollarSign },
                { value: 'auction', label: 'Auction', desc: 'Let buyers bid on your item', icon: Gavel }
              ].map(lt => (
                <label key={lt.value} className={`relative flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.listingType === lt.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  <input type="radio" name="listingType" value={lt.value} checked={formData.listingType === lt.value} onChange={handleInputChange} className="sr-only" />
                  <lt.icon className={`h-5 w-5 ${formData.listingType === lt.value ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-bold text-sm ${formData.listingType === lt.value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{lt.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{lt.desc}</span>
                  {formData.listingType === lt.value && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </label>
              ))}
            </div>

            {formData.listingType === 'fixed' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Price (৳) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                  <input name="price" type="number" required min="0" value={formData.price} onChange={handleInputChange}
                    className="input-field pl-8" placeholder="0" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Set to 0 for free items</p>
              </div>
            ) : (
              <div className="space-y-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-sm font-semibold">
                  <Gavel className="h-4 w-4" /> Auction Settings
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Starting Bid (৳) <span className="text-red-500">*</span></label>
                    <input name="startingBid" type="number" required min="1" value={formData.startingBid} onChange={handleInputChange} className="input-field text-sm" placeholder="50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Min. Increment (৳) <span className="text-red-500">*</span></label>
                    <input name="minimumIncrement" type="number" required min="1" value={formData.minimumIncrement} onChange={handleInputChange} className="input-field text-sm" placeholder="10" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5"><Clock className="inline h-3 w-3 mr-1" />Duration (Days)</label>
                    <select name="auctionDays" value={formData.auctionDays} onChange={handleInputChange} className="input-field text-sm">
                      {['1','2','3','5','7'].map(d => <option key={d} value={d}>{d} Day{d !== '1' ? 's' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">+Extra Hours</label>
                    <select name="auctionHours" value={formData.auctionHours} onChange={handleInputChange} className="input-field text-sm">
                      {['0','6','12','18'].map(h => <option key={h} value={h}>+{h}h</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Reserve Price (৳) <span className="text-gray-400 font-normal">opt.</span></label>
                    <input name="reservePrice" type="number" min="0" value={formData.reservePrice} onChange={handleInputChange} className="input-field text-sm" placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Buy Now Price (৳) <span className="text-gray-400 font-normal">opt.</span></label>
                    <input name="buyNowPrice" type="number" min="0" value={formData.buyNowPrice} onChange={handleInputChange} className="input-field text-sm" placeholder="Optional" />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.allowBuyNow} onChange={e => setFormData(p => ({ ...p, allowBuyNow: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Allow "Buy It Now" option</span>
                </label>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-2">📋 Posting Guidelines</p>
            <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
              <li>• Ensure you own the item and have the right to sell it</li>
              <li>• Be honest about condition and any defects</li>
              <li>• Only CUET students, faculty, and staff may use this platform</li>
              <li>• Prohibited: weapons, illegal substances, counterfeit goods</li>
            </ul>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Link to="/" className="flex-1 btn-secondary text-center">Cancel</Link>
            <button type="submit" disabled={loading || uploading}
              className="flex-1 btn-primary py-3 font-bold text-base disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Posting...
                </span>
              ) : 'Post Item'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-9 w-9 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Item Posted!</h3>
            <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400 mb-3">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-semibold">Pending Admin Approval</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Your item has been submitted and is waiting for admin review. Once approved, it will be visible to the entire CUET community.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowSuccess(false); navigate('/profile'); }}
                className="flex-1 btn-secondary">My Items</button>
              <button onClick={() => { setShowSuccess(false); navigate('/'); }}
                className="flex-1 btn-primary">Go Home</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostItem;
