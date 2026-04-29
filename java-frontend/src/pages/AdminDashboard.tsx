import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Trash2, Package, Clock, User, AlertCircle, BarChart3, Users, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { Link } from 'react-router-dom';

interface PendingItem {
  itemId: number; iName: string; description: string; category: string; price?: number;
  condition?: string; location?: string; postDate: string; status: string;
  userId: number; userName: string; userEmail: string;
}

interface PendingReport {
  reportId: number; reason: string; description: string; reportDate: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reporter: { userId: number; uName: string; uCusMail: string };
  reportedUser: { userId: number; uName: string; uCusMail: string };
  item?: { itemId: number; iName: string };
}

const severityConfig = {
  LOW: { class: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', label: 'Low' },
  MEDIUM: { class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Medium' },
  HIGH: { class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'High' },
  CRITICAL: { class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Critical' },
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'reports'>('posts');
  const [pendingPosts, setPendingPosts] = useState<PendingItem[]>([]);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === 'posts') fetchPendingPosts();
    else fetchPendingReports();
  }, [activeTab]);

  const fetchPendingPosts = async () => {
    try { setLoading(true); setError('');
      const r = await apiClient.get<PendingItem[]>('/items/admin/pending');
      setPendingPosts(r);
    } catch { setError('Failed to fetch pending posts'); }
    finally { setLoading(false); }
  };

  const fetchPendingReports = async () => {
    try { setLoading(true); setError('');
      const r = await apiClient.get<PendingReport[]>('/reports/admin/all');
      setPendingReports(r.filter((rep: any) => rep.status === 'PENDING'));
    } catch { setError('Failed to fetch reports'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (itemId: number) => {
    try { setProcessingId(itemId);
      await apiClient.post(`/items/admin/approve/${itemId}`);
      setPendingPosts(prev => prev.filter(p => p.itemId !== itemId));
    } catch { alert('Failed to approve. Please try again.'); }
    finally { setProcessingId(null); }
  };

  const handleReject = async (itemId: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason?.trim()) return;
    try { setProcessingId(itemId);
      await apiClient.post(`/items/admin/reject/${itemId}`, { reason });
      setPendingPosts(prev => prev.filter(p => p.itemId !== itemId));
    } catch { alert('Failed to reject. Please try again.'); }
    finally { setProcessingId(null); }
  };

  const handleReportAction = async (reportId: number, action: string) => {
    const notes = prompt(`Notes for ${action}:`);
    try { setProcessingId(reportId);
      await apiClient.put(`/reports/admin/${reportId}/status`, { status: action, adminNotes: notes || '' });
      setPendingReports(prev => prev.filter(r => r.reportId !== reportId));
    } catch { alert('Failed to update report.'); }
    finally { setProcessingId(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage pending posts and reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Nav */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { to: '/admin', icon: BarChart3, label: 'Dashboard', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { to: '/admin/items', icon: Package, label: 'Item Management', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { to: '/admin/users', icon: Users, label: 'User Management', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          ].map(nav => (
            <Link key={nav.to} to={nav.to} className={`card p-4 flex items-center gap-3 hover:shadow-md transition-shadow ${nav.bg}`}>
              <nav.icon className={`h-6 w-6 ${nav.color}`} />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">{nav.label}</span>
            </Link>
          ))}
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit mb-6">
          {[
            { key: 'posts', label: 'Pending Posts', count: pendingPosts.length, icon: Package },
            { key: 'reports', label: 'Pending Reports', count: pendingReports.length, icon: AlertTriangle },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${activeTab === tab.key ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
          </div>
        ) : activeTab === 'posts' ? (
          pendingPosts.length === 0 ? (
            <div className="card p-16 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-gray-900 dark:text-white">All caught up!</p>
              <p className="text-sm text-gray-500 mt-1">No pending posts to review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPosts.map(post => (
                <div key={post.itemId} className="card p-5 hover:shadow-md transition-shadow animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">PENDING</span>
                        <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">{post.category}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{post.iName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{post.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.userName}</span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span>{post.userEmail}</span>
                        {post.price && <><span className="text-gray-300 dark:text-gray-600">|</span><span className="font-semibold text-gray-700 dark:text-gray-200">৳{post.price.toLocaleString()}</span></>}
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(post.postDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleApprove(post.itemId)} disabled={processingId === post.itemId}
                        className="btn-success flex items-center gap-1.5 text-sm py-2 disabled:opacity-50">
                        <CheckCircle className="h-4 w-4" /> Approve
                      </button>
                      <button onClick={() => handleReject(post.itemId)} disabled={processingId === post.itemId}
                        className="btn-danger flex items-center gap-1.5 text-sm py-2 disabled:opacity-50">
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          pendingReports.length === 0 ? (
            <div className="card p-16 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-gray-900 dark:text-white">No pending reports</p>
              <p className="text-sm text-gray-500 mt-1">All reports have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReports.map(report => (
                <div key={report.reportId} className="card p-5 hover:shadow-md transition-shadow animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`badge ${severityConfig[report.severity].class}`}>{severityConfig[report.severity].label}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{report.reason}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{report.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span><strong>Reporter:</strong> {report.reporter.uName}</span>
                        <span><strong>Reported:</strong> {report.reportedUser.uName}</span>
                        {report.item && <span><strong>Item:</strong> {report.item.iName}</span>}
                        <span><strong>Date:</strong> {new Date(report.reportDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleReportAction(report.reportId, 'RESOLVED')} disabled={processingId === report.reportId}
                        className="btn-success text-sm py-2 disabled:opacity-50">Resolve</button>
                      <button onClick={() => handleReportAction(report.reportId, 'DISMISSED')} disabled={processingId === report.reportId}
                        className="btn-secondary text-sm py-2 disabled:opacity-50">Dismiss</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
