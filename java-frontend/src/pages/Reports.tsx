import { useState, useEffect } from 'react';
import { Eye, Trash2, AlertTriangle, MessageSquare, Package, User, Check, X, AlertOctagon } from 'lucide-react';
import { reportService, Report as ApiReport } from '../services/api';

interface Reporter {
  id: string;
  name: string;
  email: string;
  avatar: string;
  verified: boolean;
}

interface ReportedUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  verified: boolean;
  joinDate: string;
  totalItems: number;
  warningsCount: number;
}

interface ItemInfo {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  condition: string;
}

interface ConversationInfo {
  id: string;
  lastMessage: string;
  messageCount: number;
  startDate: string;
}

interface Report {
  id: string;
  reporter: Reporter;
  reportedUser: ReportedUser;
  reason: string;
  description: string;
  screenshots: string[];
  itemInfo?: ItemInfo;
  conversationInfo?: ConversationInfo;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportDate: string;
  reviewedBy?: string;
  reviewDate?: string;
  adminNotes?: string;
}

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Fetch reports from API
  const fetchReports = async () => {
    try {
      const apiReports = await reportService.getAllReports();
      
      // Transform API reports to match the existing interface format
      const transformedReports: Report[] = apiReports.map((apiReport: ApiReport) => ({
        id: apiReport.reportId.toString(),
        reporter: {
          id: apiReport.reporter.userId.toString(),
          name: apiReport.reporter.uName,
          email: apiReport.reporter.uCusMail,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apiReport.reporter.uName)}&background=random`,
          verified: true
        },
        reportedUser: {
          id: apiReport.reportedUser.userId.toString(),
          name: apiReport.reportedUser.uName,
          email: apiReport.reportedUser.uCusMail,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apiReport.reportedUser.uName)}&background=random`,
          verified: true,
          joinDate: apiReport.reportedUser.dateJoined,
          totalItems: 0, // This would need to be calculated separately
          warningsCount: 0 // This would need to be calculated separately
        },
        reason: apiReport.reason,
        description: apiReport.description,
        screenshots: [], // Screenshots feature would need to be implemented
        itemInfo: apiReport.item ? {
          id: apiReport.item.itemId.toString(),
          title: apiReport.item.iName,
          price: apiReport.item.price || 0,
          image: apiReport.item.image || 'https://via.placeholder.com/300',
          category: apiReport.item.category,
          condition: apiReport.item.condition || 'unknown'
        } : undefined,
        status: apiReport.status.toLowerCase() as 'pending' | 'reviewed' | 'resolved' | 'dismissed',
        severity: apiReport.severity.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
        reportDate: apiReport.reportDate,
        reviewedBy: apiReport.reviewedBy?.uName,
        reviewDate: apiReport.reviewDate,
        adminNotes: apiReport.adminNotes
      }));
      
      setReports(transformedReports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      // If API fails, show empty state or keep existing reports
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filter reports by status only
  const filteredReports = reports.filter(report => {
    return statusFilter === 'all' || report.status === statusFilter;
  });

  const handleReviewReport = async (reportId: string, _status: 'resolved' | 'dismissed') => {
    try {
      // TODO: API call to update report status
      // await fetch(`/api/admin/reports/${reportId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status, adminNotes })
      // });

      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              status: 'reviewed',
              reviewedBy: 'Admin User',
              reviewDate: new Date().toISOString(),
              adminNotes 
            }
          : report
      ));
      
      setSelectedReport(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Failed to review report:', error);
    }
  };

  // Ban functionality removed as requested

  const handleWarnUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/admin/${userId}/warn`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: warnReason })
      });

      if (response.ok) {
        console.log(`User ${userId} warned for: ${warnReason}`);
        setShowWarnModal(false);
        setWarnReason('');
        setSelectedReport(null);
        
        // Refresh reports to update the status
        fetchReports();
        
        // Show success message
        alert('User warned successfully');
      } else {
        const error = await response.text();
        alert(`Failed to warn user: ${error}`);
      }
    } catch (error) {
      console.error('Failed to warn user:', error);
      alert('Error warning user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/admin/${userId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log(`User ${userId} deleted`);
        setShowDeleteModal(false);
        
        if (selectedReport) {
          handleReviewReport(selectedReport.id, 'resolved');
        }
        
        // Refresh reports to update the status
        fetchReports();
        
        // Show success message
        alert('User deleted successfully. Their email cannot be used to sign up again.');
      } else {
        const error = await response.text();
        alert(`Failed to delete user: ${error}`);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Error deleting user. Please try again.');
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'reviewed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'resolved': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'dismissed': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
            User Reports Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage user reports to maintain community safety
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reports.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Reports</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reports.filter(r => r.status === 'reviewed').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reviewed</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reports.filter(r => r.status === 'resolved').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reports.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="w-64">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredReports.length} of {reports.length} reports
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-6">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {report.reason}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Report #{report.id} • {new Date(report.reportDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Reporter and Reported User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <User className="h-4 w-4 mr-2 text-green-500" />
                      Reporter
                    </h4>
                    <div className="flex items-center space-x-3">
                      <img
                        src={report.reporter.avatar}
                        alt={report.reporter.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {report.reporter.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {report.reporter.email}
                        </p>
                        {report.reporter.verified && (
                          <span className="text-xs text-green-600">✓ Verified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                      Reported User
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {report.reportedUser.avatar ? (
                          <img
                            src={report.reportedUser.avatar}
                            alt={report.reportedUser.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {report.reportedUser.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.reportedUser.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {report.reportedUser.email}
                          </p>
                          <div className="flex items-center space-x-2 text-xs">
                            <span>Items: {report.reportedUser.totalItems}</span>
                            <span>Warnings: {report.reportedUser.warningsCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300">{report.description}</p>
                </div>

                {/* Item and Conversation Info */}
                {(report.itemInfo || report.conversationInfo) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {report.itemInfo && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                          <Package className="h-4 w-4 mr-2 text-blue-500" />
                          Related Item
                        </h4>
                        <div className="flex items-center space-x-3">
                          <img
                            src={report.itemInfo.image}
                            alt={report.itemInfo.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {report.itemInfo.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ৳{report.itemInfo.price.toLocaleString()} • {report.itemInfo.category}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {report.conversationInfo && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2 text-purple-500" />
                          Conversation
                        </h4>
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                            "{report.conversationInfo.lastMessage}"
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {report.conversationInfo.messageCount} messages • Started {new Date(report.conversationInfo.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Screenshots */}
                {report.screenshots.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Evidence Screenshots</h4>
                    <div className="flex space-x-2">
                      {report.screenshots.map((screenshot, index) => (
                        <img
                          key={index}
                          src={screenshot}
                          alt={`Evidence ${index + 1}`}
                          className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80"
                          onClick={() => setSelectedScreenshot(screenshot)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {report.adminNotes && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Admin Notes</h4>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">{report.adminNotes}</p>
                    {report.reviewedBy && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Reviewed by {report.reviewedBy} on {report.reviewDate && new Date(report.reviewDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review Report
                  </button>

                  {report.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowWarnModal(true);
                        }}
                        className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                      >
                        <AlertOctagon className="h-4 w-4 mr-2" />
                        Warn User
                      </button>
                      {/* Ban option removed as requested */}
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowDeleteModal(true);
                        }}
                        className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No reports found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter !== 'all' ? 'No reports match the selected status filter' : 'No reports have been submitted yet'}
            </p>
          </div>
        )}

        {/* Review Modal */}
        {selectedReport && !showDeleteModal && !showWarnModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Review Report #{selectedReport.id}
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Add your notes about this report..."
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => handleReviewReport(selectedReport.id, 'resolved')}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleReviewReport(selectedReport.id, 'dismissed')}
                    className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Dismiss
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ban modal removed as requested */}

        {/* Warn Modal */}
        {showWarnModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-yellow-600 mb-4">
                  Warn User: {selectedReport.reportedUser.name}
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Warning Reason
                  </label>
                  <textarea
                    value={warnReason}
                    onChange={(e) => setWarnReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Specify the reason for warning this user..."
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => handleWarnUser(selectedReport.reportedUser.id)}
                    disabled={!warnReason.trim()}
                    className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    <AlertOctagon className="h-4 w-4 mr-2" />
                    Warn User
                  </button>
                  <button
                    onClick={() => setShowWarnModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-red-600 mb-4">
                  Delete User: {selectedReport.reportedUser.name}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  This action cannot be undone. This will permanently delete the user account and all associated data.
                </p>

                <div className="flex space-x-4">
                  <button
                    onClick={() => handleDeleteUser(selectedReport.reportedUser.id)}
                    className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Screenshot Modal */}
        {selectedScreenshot && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setSelectedScreenshot(null)}>
            <div className="max-w-4xl max-h-[90vh] overflow-hidden">
              <img
                src={selectedScreenshot}
                alt="Evidence screenshot"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;