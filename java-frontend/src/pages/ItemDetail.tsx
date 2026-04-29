import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, MessageCircle, Flag, Gavel } from 'lucide-react';
import { formatTaka } from '../utils/currency';
import { reportService, itemService, authService, auctionService, Item, Auction } from '../services/api';
import BiddingPanel from '../components/BiddingPanel';

const ItemDetail = () => {
  const { id } = useParams();
  const currentUser = authService.getStoredUser();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loadingAuction, setLoadingAuction] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const itemData = await itemService.getItemById(Number(id));
        setItem(itemData);

        // If item has bidding enabled, load auction data
        if (itemData.biddingEnabled) {
          try {
            setLoadingAuction(true);
            const auctionData = await auctionService.getAuctionByItemId(Number(id));
            setAuction(auctionData);
          } catch (auctionError) {
            console.error('Failed to fetch auction data:', auctionError);
          } finally {
            setLoadingAuction(false);
          }
        }
      } catch (err) {
        console.error('Failed to fetch item:', err);
        setError('Failed to load item details.');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return 'https://via.placeholder.com/400x300?text=No+Image';
    
    // If it's a blob URL (from old uploads), show placeholder
    if (imageUrl.startsWith('blob:')) {
      return 'https://via.placeholder.com/400x300?text=No+Image';
    }
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) return imageUrl;
    
    // If it starts with slash, it's a server path
    if (imageUrl.startsWith('/')) {
      return `http://localhost:8080${imageUrl}`;
    }
    
    // If it's just a filename, try uploads folder
    if (!imageUrl.includes('/')) {
      return `http://localhost:8080/uploads/${imageUrl}`;
    }
    
    // Default case - assume it's a relative path from server root
    return `http://localhost:8080/${imageUrl}`;
  };

  const handleStatusUpdate = async (newStatus: 'SOLD' | 'UNSOLD') => {
    if (!item) return;
    
    try {
      setUpdatingStatus(true);
      console.log('Updating item status:', item.itemId, 'to', newStatus);
      console.log('Current user:', currentUser);
      console.log('Item owner:', item.user);
      console.log('JWT token:', localStorage.getItem('jwt') ? 'Present' : 'Missing');
      
      await itemService.updateItemStatus(item.itemId, newStatus);
      
      // Update local state
      setItem(prev => prev ? {
        ...prev,
        status: newStatus,
        available: newStatus === 'UNSOLD'
      } : null);
      
      alert(`Item marked as ${newStatus.toLowerCase()} successfully`);
    } catch (error: any) {
      console.error('Failed to update item status:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to update item status. ';
      
      if (error?.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error?.message) {
        errorMessage += error.message;
      } else if (typeof error === 'string') {
        errorMessage += error;
      } else {
        errorMessage += 'Please check your connection and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isCurrentUserSeller = () => {
    return currentUser && item && currentUser.uCusMail === item.user.uCusMail;
  };

  const canUpdateStatus = () => {
    if (!isCurrentUserSeller() || !item) return false;
    return item.status === 'APPROVED' || item.status === 'SOLD' || item.status === 'UNSOLD';
  };

  const handleBidPlaced = async () => {
    // Refresh item and auction data after a bid is placed
    if (!id) return;
    try {
      const itemData = await itemService.getItemById(Number(id));
      setItem(itemData);

      if (itemData.biddingEnabled) {
        const auctionData = await auctionService.getAuctionByItemId(Number(id));
        setAuction(auctionData);
      }
    } catch (error) {
      console.error('Failed to refresh item data:', error);
    }
  };



  const handleReportItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim() || !reportDescription.trim() || !item) return;

    try {
      setSubmittingReport(true);
      const reportRequest = {
        reportedUserEmail: item.user.uCusMail || `user${item.user.userId}@example.com`,
        reason: reportReason,
        description: reportDescription,
        itemId: parseInt(id || '0')
      };
      
      await reportService.submitReport(reportRequest);
      
      setReportReason('');
      setReportDescription('');
      setShowReportModal(false);
      
      alert('Report submitted successfully. Our team will review it shortly.');
      
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again later.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const timeAgo = item?.postDate ? new Date(item.postDate).toLocaleDateString() : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Item Not Found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The item you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link to="/search" className="hover:text-blue-600">Browse Items</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{item.iName}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image */}
          <div className="space-y-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
              <img
                src={getImageUrl(item.image)}
                alt={item.iName}
                className="w-full h-96 object-contain bg-gray-100 dark:bg-gray-700"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                }}
              />
            </div>
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  {item.condition || 'Good'}
                </span>
                
                <div className="flex items-center space-x-2">
                  {canUpdateStatus() && (
                    <div className="flex items-center space-x-2">
                      {(item.status === 'APPROVED' || item.status === 'UNSOLD') && (
                        <button
                          onClick={() => handleStatusUpdate('SOLD')}
                          disabled={updatingStatus}
                          className="flex items-center space-x-1 text-green-600 hover:text-green-700 px-3 py-1 border border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50"
                        >
                          <span>Mark as Sold</span>
                        </button>
                      )}
                      {item.status === 'SOLD' && (
                        <button
                          onClick={() => handleStatusUpdate('UNSOLD')}
                          disabled={updatingStatus}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 px-3 py-1 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                        >
                          <span>Mark as Available</span>
                        </button>
                      )}
                    </div>
                  )}
                  {!isCurrentUserSeller() && (
                    <button 
                      onClick={() => setShowReportModal(true)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700 px-3 py-1 border border-red-300 rounded-lg hover:bg-red-50"
                    >
                      <Flag className="h-4 w-4" />
                      <span>Report</span>
                    </button>
                  )}
                </div>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {item.iName}
              </h1>
              
              {/* Pricing Information */}
              <div className="mb-6">
                {item.biddingEnabled ? (
                  <div className="flex items-center space-x-4">
                    {auction ? (
                      <span className="text-3xl font-bold text-blue-600">
                        ৳{auction.currentHighestBid.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-3xl font-bold text-gray-400">
                        Loading...
                      </span>
                    )}
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium flex items-center">
                      <Gavel className="h-4 w-4 mr-1" />
                      Auction
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatTaka(item.price || 0)}
                    </span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                      Fixed Price
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-4 mb-6">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{item.location || 'CUET Campus'}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Posted {timeAgo}</span>
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Item Details</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                  {item.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  item.status === 'SOLD' 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : item.status === 'UNSOLD' || item.status === 'APPROVED'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : item.status === 'PENDING'
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }`}>
                  {item.status === 'APPROVED' ? 'AVAILABLE' : 
                   item.status === 'UNSOLD' ? 'AVAILABLE' : 
                   item.status === 'SOLD' ? 'SOLD' : item.status}
                </span>
              </div>
            </div>

            {/* Contact Seller Button */}
            {!isCurrentUserSeller() && (
              <div className="space-y-3">
                <Link 
                  to={`/chat?seller=${item.user?.userId}&item=${item.itemId}`}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Contact Seller</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Description and Seller Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Description */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bidding Panel for Auction Items */}
            {item.biddingEnabled && auction && (
              <BiddingPanel 
                item={item} 
                auction={auction} 
                onBidPlaced={handleBidPlaced} 
              />
            )}

            {/* Loading auction data */}
            {item.biddingEnabled && !auction && loadingAuction && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading auction details...</p>
                </div>
              </div>
            )}

            {/* Seller Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Seller Information</h3>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {item.user?.uName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {item.user?.uName}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.user?.role} • Member since {item.user?.dateJoined ? new Date(item.user.dateJoined).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Contact:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.user?.uPhone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.user?.uCusMail}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Item Modal */}
        {showReportModal && item && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Report Item: {item.iName}
              </h3>
              
              <form onSubmit={handleReportItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for reporting
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="fraud">Fraud or Fake Item</option>
                    <option value="misleading information">Misleading Information</option>
                    <option value="inappropriate content">Inappropriate Content</option>
                    <option value="spam">Spam or Duplicate Post</option>
                    <option value="prohibited item">Prohibited Item</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Please provide details about the issue..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={4}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportModal(false);
                      setReportReason('');
                      setReportDescription('');
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport || !reportReason.trim() || !reportDescription.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetail;