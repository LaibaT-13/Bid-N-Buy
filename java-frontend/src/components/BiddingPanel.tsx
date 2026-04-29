import React, { useState, useEffect } from 'react';
import { Clock, Gavel, ShoppingCart } from 'lucide-react';
import { Item, Auction, Bid, auctionService, bidService } from '../services/api';

interface BiddingPanelProps {
  item: Item;
  auction: Auction;
  onBidPlaced: () => void;
}

const BiddingPanel: React.FC<BiddingPanelProps> = ({ item, auction, onBidPlaced }) => {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canBid, setCanBid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    loadBids();
    checkBiddingPermission();
    
    // Update countdown every second
    const timer = setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => clearInterval(timer);
  }, [item.itemId]);

  const loadBids = async () => {
    try {
      const bidsData = await bidService.getBidsForItem(item.itemId);
      setBids(bidsData);
    } catch (error) {
      console.error('Failed to load bids:', error);
    }
  };

  const checkBiddingPermission = async () => {
    try {
      const result = await bidService.canBidOnItem(item.itemId);
      setCanBid(result.canBid);
    } catch (error) {
      console.error('Failed to check bidding permission:', error);
      setCanBid(false);
    }
  };

  const updateCountdown = () => {
    const now = new Date().getTime();
    const endTime = new Date(auction.endTime).getTime();
    const distance = endTime - now;

    if (distance > 0) {
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    } else {
      setTimeRemaining('Auction ended');
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const amount = parseFloat(bidAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid bid amount');
      }

      const currentBid = auction.currentHighestBid || auction.startingBid;
      const minBid = currentBid + auction.minimumIncrement;
      if (amount < minBid) {
        throw new Error(`Bid must be at least ৳${minBid.toFixed(2)}`);
      }

      await bidService.placeBid({
        itemId: item.itemId,
        bidAmount: amount
      });

      setBidAmount('');
      loadBids();
      onBidPlaced();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!auction.allowBuyNow || !auction.buyNowPrice) return;

    setLoading(true);
    try {
      await auctionService.buyNow(item.itemId);
      onBidPlaced(); // Refresh the item details
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to purchase item');
    } finally {
      setLoading(false);
    }
  };

  const isAuctionActive = auction.status === 'ACTIVE' && new Date() < new Date(auction.endTime);
  const currentBid = auction.currentHighestBid || auction.startingBid;
  const suggestedBid = currentBid + auction.minimumIncrement;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <Gavel className="h-5 w-5 mr-2 text-blue-600" />
          Auction Details
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isAuctionActive 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {isAuctionActive ? 'Active' : 'Ended'}
        </div>
      </div>

      {/* Auction Info */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Current Bid:</span>
          <span className="text-2xl font-bold text-blue-600">
            ৳{(auction.currentHighestBid || auction.startingBid).toFixed(2)}
          </span>
        </div>
        
        {auction.currentWinner && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Leading Bidder:</span>
            <span className="text-gray-900 dark:text-white">{auction.currentWinner.uName}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Minimum Increment:</span>
          <span className="text-gray-900 dark:text-white">৳{auction.minimumIncrement.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Time Remaining:
          </span>
          <span className={`font-mono font-bold ${
            timeRemaining.includes('ended') 
              ? 'text-red-600' 
              : 'text-green-600'
          }`}>
            {timeRemaining}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Total Bids:</span>
          <span className="text-gray-900 dark:text-white">{bids.length}</span>
        </div>
      </div>

      {/* Buy It Now Option */}
      {isAuctionActive && auction.allowBuyNow && auction.buyNowPrice && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Buy It Now
              </p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                ৳{auction.buyNowPrice.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleBuyNow}
              disabled={loading || !canBid}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy Now
            </button>
          </div>
        </div>
      )}

      {/* Bidding Form */}
      {isAuctionActive && canBid && (
        <form onSubmit={handlePlaceBid} className="mb-6">
          <div className="flex gap-2">
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`Min: ৳${suggestedBid.toFixed(2)}`}
              min={suggestedBid}
              step="0.01"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              {loading ? 'Placing...' : 'Place Bid'}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Minimum bid: ৳{suggestedBid.toFixed(2)}
          </p>
        </form>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Bidding Disabled Messages */}
      {!canBid && isAuctionActive && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 text-gray-600 rounded-md text-sm">
          You cannot bid on this item (you may be the owner or not logged in)
        </div>
      )}

      {!isAuctionActive && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 text-gray-600 rounded-md text-sm">
          This auction has ended
        </div>
      )}

      {/* Bid History */}
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Bid History ({bids.length})
        </h4>
        
        {bids.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No bids yet</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {bids.map((bid, index) => (
              <div
                key={bid.bidId}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  index === 0 
                    ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                    : 'bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {bid.bidder.uName}
                    {index === 0 && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Highest
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(bid.bidDate).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    ৳{bid.bidAmount.toFixed(2)}
                  </p>
                  <p className={`text-xs ${
                    bid.status === 'WINNING' ? 'text-green-600' : 
                    bid.status === 'OUTBID' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {bid.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BiddingPanel;