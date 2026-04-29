import { useState, useEffect } from 'react';
import { Search, AlertTriangle, Shield, User, Mail, Phone, Calendar, Ban, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserData {
  id: string; name: string; email: string; phone: string;
  address: string | null; verified: boolean; joinDate: string;
  status: string; role: string; totalItems: number;
}

const statusConfig: Record<string, { class: string; label: string }> = {
  ACTIVE: { class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Active' },
  WARNED: { class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Warned' },
  BANNED: { class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Banned' },
  SUSPENDED: { class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Suspended' },
};

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('jwt');
        if (!token) { setLoading(false); return; }
        const response = await fetch('http://localhost:8080/api/users/admin/all', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          const transformed = data.map((u: any) => ({
            id: (u.userId || u.id || '').toString(),
            name: u.uName || u.name || 'Unknown',
            email: u.uCusMail || u.email || '',
            phone: u.uPhone || u.phone || 'N/A',
            address: u.address || null,
            verified: true,
            joinDate: u.dateJoined || u.joinDate || new Date().toISOString(),
            status: u.status || 'ACTIVE',
            role: u.role || 'USER',
            totalItems: u.totalItems || 0,
          }));
          setUsers(transformed);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchUsers();
  }, []);

  const handleWarn = async (userId: string) => {
    const reason = prompt('Enter warning reason:');
    if (!reason?.trim()) return;
    try {
      setProcessingId(userId);
      const token = localStorage.getItem('jwt');
      const res = await fetch(`http://localhost:8080/api/users/admin/warn/${userId}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'WARNED' } : u));
        alert('Warning issued successfully.');
      } else alert('Failed to warn user.');
    } catch { alert('Failed to warn user.'); }
    finally { setProcessingId(null); }
  };

  const handleBan = async (userId: string) => {
    const reason = prompt('Enter ban reason:');
    if (!reason?.trim()) return;
    if (!confirm('Are you sure you want to ban this user?')) return;
    try {
      setProcessingId(userId);
      const token = localStorage.getItem('jwt');
      const res = await fetch(`http://localhost:8080/api/users/admin/ban/${userId}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'BANNED' } : u));
        alert('User banned successfully.');
      } else alert('Failed to ban user.');
    } catch { alert('Failed to ban user.'); }
    finally { setProcessingId(null); }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = [
    { label: 'Total Users', value: users.length, color: 'text-blue-600' },
    { label: 'Active', value: users.filter(u => u.status === 'ACTIVE').length, color: 'text-green-600' },
    { label: 'Warned', value: users.filter(u => u.status === 'WARNED').length, color: 'text-yellow-600' },
    { label: 'Banned', value: users.filter(u => u.status === 'BANNED').length, color: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">User Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Monitor and manage registered users</p>
            </div>
            <Link to="/admin" className="btn-secondary text-sm">← Dashboard</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} className="card p-4 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..." className="input-field pl-10 text-sm" />
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {['ALL', 'ACTIVE', 'WARNED', 'BANNED'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <User className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="font-bold text-gray-900 dark:text-white">No users found</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map(u => {
                    const sc = statusConfig[u.status] || statusConfig['ACTIVE'];
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">{u.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">{u.name}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[180px]">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-sm text-gray-600 dark:text-gray-300">{u.phone}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(u.joinDate).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${sc.class}`}>{sc.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {u.status !== 'WARNED' && u.status !== 'BANNED' && (
                              <button onClick={() => handleWarn(u.id)} disabled={processingId === u.id}
                                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg font-semibold transition-colors disabled:opacity-50">
                                <AlertTriangle className="h-3 w-3" /> Warn
                              </button>
                            )}
                            {u.status !== 'BANNED' && (
                              <button onClick={() => handleBan(u.id)} disabled={processingId === u.id}
                                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-semibold transition-colors disabled:opacity-50">
                                <Ban className="h-3 w-3" /> Ban
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
