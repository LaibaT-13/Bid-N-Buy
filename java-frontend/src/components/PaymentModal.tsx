import React, { useState } from 'react';
import { CreditCard, X, CheckCircle } from 'lucide-react';
import { formatTaka } from '../utils/currency';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: {
    payment_method: 'cash';
    notes?: string;
  }) => void;
  productTitle: string;
  amount: number;
  sellerName: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productTitle,
  amount,
  sellerName
}) => {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onConfirm({
      payment_method: 'cash',
      notes: notes.trim() || undefined
    });
    
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Confirm Purchase
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Purchase Summary */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Purchase Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Product:</span>
              <span className="text-gray-900 dark:text-white font-medium max-w-48 text-right truncate">
                {productTitle}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Seller:</span>
              <span className="text-gray-900 dark:text-white font-medium">{sellerName}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
              <span className="text-gray-900 dark:text-white font-semibold">Total Amount:</span>
              <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                {formatTaka(amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Payment Method</h4>
          <div className="p-4 border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full border-2 border-green-500 bg-green-500 mr-3 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <CreditCard className="h-5 w-5 mr-3 text-green-600" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Cash Payment
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Pay in cash during pickup
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any special instructions or notes for the seller..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Payment Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Payment Security</p>
              <p>
                Your transaction will be recorded once confirmed. Pay in cash 
                directly to the seller during pickup at the agreed location.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Processing...
              </>
            ) : (
              'Confirm Purchase'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;