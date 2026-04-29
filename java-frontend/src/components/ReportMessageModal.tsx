import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { messageService, ReportReason, ReportMessageRequest } from '../services/api';
interface ReportMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: number;
  messageContent: string;
}

const ReportMessageModal: React.FC<ReportMessageModalProps> = ({
  isOpen,
  onClose,
  messageId,
  messageContent
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { value: ReportReason.SPAM, label: 'Spam or Unwanted Messages', icon: '🚫' },
    { value: ReportReason.HARASSMENT, label: 'Harassment or Bullying', icon: '😠' },
    { value: ReportReason.INAPPROPRIATE_CONTENT, label: 'Inappropriate Content', icon: '🔞' },
    { value: ReportReason.SCAM_FRAUD, label: 'Scam or Fraud', icon: '🚨' },
    { value: ReportReason.HATE_SPEECH, label: 'Hate Speech', icon: '💬' },
    { value: ReportReason.VIOLENCE_THREATS, label: 'Violence or Threats', icon: '⚠️' },
    { value: ReportReason.FAKE_INFORMATION, label: 'False Information', icon: '❌' },
    { value: ReportReason.OTHER, label: 'Other', icon: '📝' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      alert('Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData: ReportMessageRequest = {
        messageId,
        reason: selectedReason,
        additionalDetails: additionalDetails.trim() || undefined
      };

      await messageService.reportMessage(reportData);
      
      alert('Message reported successfully. Thank you for helping keep our community safe.');
      onClose();
      
      // Reset form
      setSelectedReason(null);
      setAdditionalDetails('');
    } catch (error: any) {
      console.error('Error reporting message:', error);
      if (error.message.includes('already reported')) {
        alert('You have already reported this message');
      } else if (error.message.includes('Cannot report own message')) {
        alert('You cannot report your own message');
      } else {
        alert('Failed to report message. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Flag className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Report Message</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Message Preview */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Message being reported:</h3>
            <div className="bg-gray-50 p-3 rounded-md border">
              <p className="text-sm text-gray-600 line-clamp-3">
                {messageContent.length > 150 
                  ? messageContent.substring(0, 150) + '...' 
                  : messageContent}
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Why are you reporting this message?</h3>
            <div className="space-y-2">
              {reportReasons.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedReason === reason.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={() => setSelectedReason(reason.value)}
                    className="sr-only"
                  />
                  <span className="text-lg mr-3">{reason.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Provide any additional context that might help us understand the issue..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {additionalDetails.length}/500 characters
            </p>
          </div>

          {/* Warning */}
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">Please note:</p>
                <ul className="text-xs space-y-1">
                  <li>• False reports may result in account restrictions</li>
                  <li>• All reports are reviewed by our moderation team</li>
                  <li>• You will be notified of the outcome</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedReason || isSubmitting}
              className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${
                !selectedReason || isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportMessageModal;