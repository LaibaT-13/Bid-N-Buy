import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, Gavel } from 'lucide-react';

interface ItemCardProps {
  item: {
    id: string;
    title: string;
    price: number;
    image: string;
    condition: string;
    category: string;
    location: string;
    timeAgo: string;
    seller: { name: string; verified: boolean };
    isAuction?: boolean;
    currentBid?: number;
    timeLeft?: string;
  };
}

const ItemCard: React.FC<ItemCardProps> = memo(({ item }) => {
  const [imgError, setImgError] = useState(false);

  const conditionConfig: Record<string, { label: string; class: string }> = {
    'like-new': { label: 'Like New', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    'good': { label: 'Good', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    'fair': { label: 'Fair', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    'needs-fixing': { label: 'Needs Fixing', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  const cond = conditionConfig[item.condition?.toLowerCase()] || conditionConfig['good'];

  const formatTaka = (amount: number) => `৳${amount.toLocaleString('en-BD')}`;

  const getImageUrl = (url?: string) => {
    if (!url || url.trim() === '' || url.startsWith('blob:')) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `http://localhost:8080${url}`;
    if (!url.includes('/')) return `http://localhost:8080/uploads/images/${url}`;
    return `http://localhost:8080/${url}`;
  };

  const imageUrl = getImageUrl(item.image);

  return (
    <Link to={`/item/${item.id}`}
      className="group block bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {imageUrl && !imgError ? (
          <img src={imageUrl} alt={item.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <svg className="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">No Image</span>
          </div>
        )}

        {/* Auction badge */}
        {item.isAuction && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow">
            <Gavel className="h-3 w-3" />
            AUCTION
          </div>
        )}

        {/* Category chip */}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-lg">
          {item.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`badge ${cond.class}`}>{cond.label}</span>
        </div>

        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
          {item.title || 'Untitled Item'}
        </h3>

        <div className="mb-3">
          {item.isAuction && item.currentBid ? (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Current Bid</p>
              <p className="text-lg font-black text-orange-600 dark:text-orange-400">{formatTaka(item.currentBid)}</p>
            </div>
          ) : (
            <p className="text-lg font-black text-gray-900 dark:text-white">{formatTaka(item.price)}</p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-3">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.timeAgo}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-[9px] font-bold text-white">{item.seller.name.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-[80px]">{item.seller.name}</span>
            {item.seller.verified && <Star className="h-3 w-3 text-blue-500 fill-current flex-shrink-0" />}
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">View →</span>
        </div>
      </div>
    </Link>
  );
});

export default ItemCard;
