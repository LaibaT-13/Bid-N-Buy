import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, MessageCircle, Flag, User } from 'lucide-react';
import { formatTaka } from '../utils/currency';
import { reportService, itemService, authService, Item } from '../services/api';

const ItemDetail = () => {
  const { id } = useParams();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const currentUser = authService.getStoredUser();

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const itemData = await itemService.getItemById(Number(id));
        setItem(itemData);
      } catch (err) {
        console.error('Error fetching item:', err);
        setError('Failed to load item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // Mock bids data - keeping for now
  const [mockBids] = useState<any>({
    '1': [
      {
        bid_id: 'bid_1',
        product_id: '1',
        user_id: '127',
        bid_amount: 850,
        timestamp: '2024-09-30T10:30:00Z',
        user: {
          name: 'Sarah Khan',
          avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?w=150',
          verified: true
        }
      },
      {
        bid_id: 'bid_2',
        product_id: '1',
        user_id: '128',
        bid_amount: 900,
        timestamp: '2024-09-30T11:15:00Z',
        user: {
          name: 'Mohammad Ali',
          avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?w=150',
          verified: false
        }
      }
    ],
    '2': [
      {
        bid_id: 'bid_3',
        product_id: '2',
        user_id: '129',
        bid_amount: 82000,
        timestamp: '2024-09-30T09:00:00Z',
        user: {
          name: 'Fatima Rahman',
          avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=150',
          verified: true
        }
      },
      {
        bid_id: 'bid_4',
        product_id: '2',
        user_id: '130',
        bid_amount: 83500,
        timestamp: '2024-09-30T12:30:00Z',
        user: {
          name: 'Ahmed Hassan',
          avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=150',
          verified: true
        }
      }
    ]
  });

  // Mock data - in a real app, you'd fetch this based on the id
  const mockItems = {
    '1': {
      id: '1',
      title: 'Advanced Engineering Mathematics - 10th Edition by Erwin Kreyszig',
      priceMode: 'bidding' as const,
      startingPrice: 600,
      currentHighestBid: 900,
      totalBids: 2,
      buyItNowPrice: 1000,
      biddingEndTime: '2024-10-07T23:59:59Z',
      images: [
        'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/694740/pexels-photo-694740.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      condition: 'like-new',
      category: 'Books',
      location: 'CUET Campus - Near Library',
      timeAgo: '2 hours ago',
      description: `This is the 10th edition of the renowned "Advanced Engineering Mathematics" by Erwin Kreyszig. The book is in excellent condition with minimal wear. Perfect for engineering students taking advanced mathematics courses.

Features:
• Comprehensive coverage of differential equations
• Vector analysis and complex variables
• Probability and statistics for engineers
• All original pages intact
• No markings or highlighting
• Dust cover included

This book has been my companion throughout my engineering degree and I'm passing it on to help another student. Great for Mechanical, Electrical, and Civil Engineering students.`,
      tags: ['Mathematics', 'Engineering', 'Textbook', 'Kreyszig', 'Advanced Math'],
      seller: {
        id: '123',
        name: 'Ahmed Rahman',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
        verified: true,
        joinDate: '2023-01-15',
        totalItems: 12,
        rating: 4.8,
        responseTime: '~2 hours',
        department: 'Mechanical Engineering',
        year: '4th Year'
      },
      views: 24,
      favorites: 5
    },
    '2': {
      id: '2',
      title: 'MacBook Air M1 - 13 inch (2020)',
      priceMode: 'fixed' as const,
      price: 85000,
      images: [
        'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      condition: 'good',
      category: 'Electronics',
      location: 'Hall 5 - CUET',
      timeAgo: '5 hours ago',
      description: `MacBook Air with M1 chip in good working condition. Perfect for students who need a reliable laptop for coding, design work, and general use.

Specifications:
• Apple M1 chip with 8-core CPU
• 8GB unified memory
• 256GB SSD storage
• 13.3-inch Retina display
• Up to 18 hours battery life
• Includes original charger and box

Minor scratches on the lid but screen and keyboard are in excellent condition. Battery health is at 92%. Great for computer science and engineering students.`,
      tags: ['MacBook', 'Apple', 'M1', 'Laptop', 'Programming'],
      seller: {
        id: '124',
        name: 'Fatima Khan',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
        verified: true,
        joinDate: '2023-03-20',
        totalItems: 8,
        rating: 4.9,
        responseTime: '~1 hour',
        department: 'Computer Science',
        year: '3rd Year'
      },
      views: 156,
      favorites: 23
    },
    '3': {
      id: '3',
      title: 'Study Desk with Chair - Wooden',
      priceMode: 'fixed' as const,
      price: 3500,
      images: [
        'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      condition: 'good',
      category: 'Home',
      location: 'Near Gate 2 - CUET',
      timeAgo: '1 day ago',
      description: `Solid wooden study desk with matching chair. Perfect for dorm rooms or study spaces. The desk has ample space for books, laptop, and study materials.

Features:
• Solid wood construction
• Large desktop surface (120cm x 60cm)
• Two storage drawers
• Matching ergonomic chair
• Sturdy and stable design
• Easy to assemble/disassemble for moving

Some minor wear on the surface but structurally sound. Great for students who need a dedicated study space.`,
      tags: ['Furniture', 'Desk', 'Chair', 'Study', 'Wooden'],
      seller: {
        id: '125',
        name: 'Rafiq Islam',
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
        verified: false,
        joinDate: '2023-09-10',
        totalItems: 3,
        rating: 4.5,
        responseTime: '~4 hours',
        department: 'Civil Engineering',
        year: '2nd Year'
      },
      views: 45,
      favorites: 8
    },
    '4': {
      id: '4',
      title: 'Calculus and Analytical Geometry - Complete Set',
      priceMode: 'bidding' as const,
      startingPrice: 800,
      currentHighestBid: 1100,
      totalBids: 5,
      buyItNowPrice: 1400,
      biddingEndTime: '2024-10-05T18:00:00Z',
      images: [
        'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/694740/pexels-photo-694740.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      condition: 'like-new',
      category: 'Books',
      location: 'Library Area - CUET',
      timeAgo: '3 hours ago',
      description: `Complete set of Calculus and Analytical Geometry textbooks. Essential for first and second-year engineering students. Books are in excellent condition with minimal highlighting.

Includes:
• Calculus Volume 1 (Limits, Derivatives, Applications)
• Calculus Volume 2 (Integration, Series, Differential Equations)
• Analytical Geometry supplement
• Solution manual included
• All original pages intact
• Clean, readable condition

These books helped me ace my calculus courses. Perfect for Mechanical, Electrical, Civil, and other engineering disciplines.`,
      tags: ['Calculus', 'Mathematics', 'Engineering', 'Textbook', 'Analytical Geometry'],
      seller: {
        id: '126',
        name: 'Nadia Ahmed',
        avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150',
        verified: true,
        joinDate: '2022-12-05',
        totalItems: 15,
        rating: 4.7,
        responseTime: '~3 hours',
        department: 'Electrical Engineering',
        year: '4th Year'
      },
      views: 67,
      favorites: 12
    }
  };

  // Get the item based on the ID from URL params
  const item = mockItems[id as keyof typeof mockItems];

  // If item not found, show error
  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Item Not Found
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

  const relatedItems = [
    {
      id: '5',
      title: 'Calculus and Analytical Geometry',
      price: 600,
      image: 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=300',
      condition: 'Good'
    },
    {
      id: '6',
      title: 'Engineering Mechanics Statics',
      price: 900,
      image: 'https://images.pexels.com/photos/694740/pexels-photo-694740.jpeg?auto=compress&cs=tinysrgb&w=300',
      condition: 'Like New'
    }
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
  };

  // Handle placing a bid
  const handlePlaceBid = (amount: number) => {
    if (!item || item.priceMode !== 'bidding') return;
    
    const newBid: Bid = {
      bid_id: `bid_${Date.now()}`,
      product_id: item.id,
      user_id: 'current_user', // In real app, get from auth context
      bid_amount: amount,
      timestamp: new Date().toISOString(),
      user: {
        name: 'You',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=150',
        verified: true
      }
    };

    // Update bids
    setMockBids(prev => ({
      ...prev,
      [item.id]: [...(prev[item.id] || []), newBid].sort((a, b) => b.bid_amount - a.bid_amount)
    }));

    alert(`Bid placed successfully for ${formatTaka(amount)}!`);
  };

  // Handle transaction creation
  const handleCreateTransaction = (paymentData: {
    payment_method: 'cash';
    notes?: string;
  }) => {
    if (!item) return;
    
    const price = item.priceMode === 'fixed' 
      ? item.price 
      : item.buyItNowPrice;
    
    if (price) {
      const transaction: Transaction = {
        transaction_id: `txn_${Date.now()}`,
        product_id: item.id,
        buyer_id: 'current_user', // In real app, get from auth context
        seller_id: item.seller.id,
        price: price,
        timestamp: new Date().toISOString(),
        status: 'pending',
        payment_method: 'cash',
        payment_confirmed: false,
        notes: paymentData.notes
      };

      // In a real app, this would be sent to the backend
      console.log('Transaction created:', transaction);
      
      alert(`Transaction created successfully! Transaction ID: ${transaction.transaction_id}`);
    }
  };

  // Get current bids for this item
  const currentBids = mockBids[item?.id || ''] || [];
  const isOwner = false; // In real app, check if current user is the seller

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link to="/search" className="hover:text-blue-600">Search</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{item.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
              <img
                src={item.images[currentImageIndex]}
                alt={item.title}
                className="w-full h-96 object-cover"
              />
              {item.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {item.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {item.images.length > 1 && (
              <div className="flex space-x-2">
                {item.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex
                        ? 'border-blue-500'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.condition === 'like-new' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                  item.condition === 'good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  item.condition === 'fair' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {item.condition === 'like-new' ? 'Like New' : 
                   item.condition === 'good' ? 'Good' :
                   item.condition === 'fair' ? 'Fair' : 'Needs Fixing'}
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {item.title}
              </h1>
              
              {/* Pricing Information */}
              <div className="mb-6">
                {item.priceMode === 'fixed' ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatTaka(item.price || 0)}
                    </span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                      Fixed Price
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {formatTaka(item.currentHighestBid || item.startingPrice || 0)}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium flex items-center">
                      <Gavel className="h-4 w-4 mr-1" />
                      {item.currentHighestBid ? 'Current Bid' : 'Starting Price'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-4 mb-6">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Posted {item.timeAgo}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact Seller Button */}
            <div className="space-y-3">
              <Link 
                to={`/chat?seller=${item.seller.id}&item=${item.id}`}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Contact Seller</span>
              </Link>
            </div>

            {/* Item Stats */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span>{item.views} views</span>
              <button className="flex items-center space-x-1 text-red-600 hover:text-red-700">
                <Flag className="h-4 w-4" />
                <span>Report</span>
              </button>
            </div>
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
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bidding/Price Card */}
            <BidCard
              productId={item.id}
              productTitle={item.title}
              sellerName={item.seller.name}
              priceMode={item.priceMode}
              currentHighestBid={item.priceMode === 'bidding' ? item.currentHighestBid : undefined}
              startingPrice={item.priceMode === 'bidding' ? (item.startingPrice || 0) : (item.price || 0)}
              totalBids={item.priceMode === 'bidding' ? (item.totalBids || 0) : 0}
              bids={currentBids}
              isOwner={isOwner}
              onPlaceBid={handlePlaceBid}
              buyItNowPrice={item.priceMode === 'bidding' ? item.buyItNowPrice : item.price}
              onCreateTransaction={handleCreateTransaction}
              biddingEndTime={item.priceMode === 'bidding' ? item.biddingEndTime : undefined}
            />

            {/* Seller Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Seller Information</h3>
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={item.seller.avatar}
                  alt={item.seller.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {item.seller.name}
                    </h4>
                    {item.seller.verified && (
                      <Star className="h-4 w-4 text-blue-500 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.seller.department} • {item.seller.year}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rating:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.seller.rating}/5.0
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Response time:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.seller.responseTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Items posted:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.seller.totalItems}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Member since:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {new Date(item.seller.joinDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <Link
                to={`/profile/${item.seller.id}`}
                className="block mt-4 text-center py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Related Items
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedItems.map((relatedItem) => (
                <Link
                  key={relatedItem.id}
                  to={`/item/${relatedItem.id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
                >
                  <img
                    src={relatedItem.image}
                    alt={relatedItem.title}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
                    {relatedItem.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatTaka(relatedItem.price)}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {relatedItem.condition === 'like-new' ? 'Like New' : 
                       relatedItem.condition === 'good' ? 'Good' :
                       relatedItem.condition === 'fair' ? 'Fair' : 'Needs Fixing'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetail;