import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { reportService, ReportRequest } from '../services/api';

interface UserReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName: string;
}

const UserReportModal: React.FC<UserReportModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { value: 'NO_SHOW', label: 'Agreed to purchase but didn\'t show up', icon: '🚫' },
    { value: 'FALSE_PROMISE', label: 'Made false promises about buying', icon: '🤥' },
    { value: 'SCAM_FRAUD', label: 'Attempted scam or fraud', icon: '🚨' },
    { value: 'HARASSMENT', label: 'Harassment or inappropriate behavior', icon: '😠' },
    { value: 'FAKE_BUYER', label: 'Fake buyer wasting time', icon: '👤' },
    { value: 'PAYMENT_ISSUES', label: 'Payment problems or disputes', icon: '💳' },
    { value: 'UNRELIABLE', label: 'Unreliable or unprofessional behavior', icon: '⏰' },
    { value: 'OTHER', label: 'Other reason', icon: '📝' }
  ];

  const resetForm = () => {
    setSelectedReason('');
    setDescription('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason || !description.trim()) {
      alert('Please select a reason and provide a description.');
      return;
    }

    if (description.length > 500) {
      alert('Description must be 500 characters or less.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const reportData: ReportRequest = {
        reportedUserEmail: userEmail,
        reason: selectedReason,
        description: description.trim()
      };

      await reportService.submitReport(reportData);
      
      alert('Report submitted successfully. Our team will review it shortly.');
      handleClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      
      if (error instanceof Error && error.message.includes('400')) {
        alert('Unable to submit report. Please make sure you\'re not trying to report yourself.');
      } else {
        alert('Failed to submit report. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <Flag className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Report User
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Reporting: {userName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Warning */}
          <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-6">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <p className="font-medium mb-1">Important</p>
              <p>Reports are reviewed by our team. False reports may result in action against your account.</p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Why are you reporting this user? *
            </label>
            <div className="space-y-2">
              {reportReasons.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedReason === reason.value
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-lg mr-3">{reason.icon}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {reason.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Details *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide specific details about the issue..."
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white resize-none"
              disabled={isSubmitting}
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
              {description.length}/500 characters
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedReason || !description.trim()}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserReportModal;