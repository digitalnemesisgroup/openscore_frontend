'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useThrottleCallback } from '@/hooks/useThrottle';
import PaginationControls from '@/components/admin/PaginationControls';
import { Users, UserPlus, CheckCircle2, X, Eye, EyeOff, Copy, Check, Database, Loader2, UserX, Edit3, Trash2, AlertTriangle, Search } from 'lucide-react';

export default function AdminUsersPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [visiblePins, setVisiblePins] = useState<{ [key: number]: boolean }>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [addUserModalOpen, setAddUserModalOpen] = useState<boolean>(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState<boolean>(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');
  
  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const [newUserForm, setNewUserForm] = useState<any>({ name: '', mobile: '', email: '', role: 'user', pin: '1234' });
  const [editUserForm, setEditUserForm] = useState<any>({ id: null, name: '', mobile: '', email: '', role: 'user', pin: '' });
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Sync URL search params on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qPage = params.get('page');
      const qPerPage = params.get('per_page');
      const qSearch = params.get('search');

      if (qPage) setCurrentPage(Number(qPage));
      if (qPerPage) setItemsPerPage(Number(qPerPage));
      if (qSearch) setSearchTerm(qSearch);
    }
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let res: any;
      try {
        res = await apiRequest('/admin/users');
      } catch (e1) {
        try {
          res = await apiRequest('/users');
        } catch (e2) {
          throw e1;
        }
      }

      if (res && res.data && Array.isArray(res.data)) {
        const formattedUsers = res.data.map((u: any) => ({
          id: u.id,
          user_code: `USR-${String(u.id).padStart(4, '0')}`,
          name: u.name,
          mobile: u.mobile || 'N/A',
          email: u.email,
          role: u.role || 'user',
          pin: u.plain_pin || (u.is_pin_set ? '1234' : 'Not Set'),
          pin_set: !!u.is_pin_set,
          applications_count: u.loan_applications_count || 0,
          created_at: new Date(u.created_at || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
        }));
        setUsersList(formattedUsers);
        setIsLiveDb(true);
      } else {
        setUsersList([]);
        setIsLiveDb(false);
      }
    } catch (err) {
      setUsersList([]);
      setIsLiveDb(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered Users using Debounced Search
  const filteredUsers = React.useMemo(() => {
    if (!debouncedSearchTerm) return usersList;
    const query = debouncedSearchTerm.toLowerCase().trim();
    return usersList.filter((u) => {
      const nameMatch = (u.name || '').toLowerCase().includes(query);
      const mobileMatch = (u.mobile || '').includes(query);
      const emailMatch = (u.email || '').toLowerCase().includes(query);
      const codeMatch = (u.user_code || '').toLowerCase().includes(query);
      return nameMatch || mobileMatch || emailMatch || codeMatch;
    });
  }, [usersList, debouncedSearchTerm]);

  // Paginated Slice of Users
  const paginatedUsers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const togglePinVisibility = (id: number) => {
    setVisiblePins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPinToClipboard = (id: number, pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Throttled Handlers for API Mutations
  const handleCreateNewUserThrottled = useThrottleCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.mobile) return;
    setSubmitting(true);

    try {
      await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({
          name: newUserForm.name,
          email: newUserForm.email || `${newUserForm.mobile}@msmeloan.sbs`,
          mobile: newUserForm.mobile,
          password: 'password123',
          pin: newUserForm.pin || '1234',
        }),
      });

      setActionSuccessMsg(`User account "${newUserForm.name}" created directly in Database!`);
      fetchUsers();
    } catch (err) {
      setActionSuccessMsg(`Could not create user in database: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setSubmitting(false);
      setNewUserForm({ name: '', mobile: '', email: '', role: 'user', pin: '1234' });
      setAddUserModalOpen(false);
    }
  }, 1000);

  const openEditModal = (usr: any) => {
    setSelectedUser(usr);
    setEditUserForm({
      id: usr.id,
      name: usr.name || '',
      mobile: usr.mobile || '',
      email: usr.email || '',
      role: usr.role || 'user',
      pin: usr.pin !== 'Not Set' ? usr.pin : '1234',
    });
    setEditUserModalOpen(true);
  };

  const handleUpdateUserThrottled = useThrottleCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserForm.id || !editUserForm.name || !editUserForm.mobile) return;
    setSubmitting(true);

    try {
      await apiRequest(`/admin/users/${editUserForm.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editUserForm.name.trim(),
          mobile: editUserForm.mobile.trim(),
          email: editUserForm.email.trim(),
          role: editUserForm.role,
          pin: editUserForm.pin.trim(),
        }),
      });

      setActionSuccessMsg(`User account "${editUserForm.name}" updated successfully in Database!`);
      setEditUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  }, 1000);

  const openDeleteConfirmModal = (usr: any) => {
    setSelectedUser(usr);
    setDeleteConfirmModalOpen(true);
  };

  const handleDeleteUserThrottled = useThrottleCallback(async () => {
    if (!selectedUser) return;
    setSubmitting(true);

    try {
      await apiRequest(`/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      setActionSuccessMsg(`User account "${selectedUser.name}" (${selectedUser.user_code}) deleted successfully from Database.`);
      setDeleteConfirmModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    } finally {
      setSubmitting(false);
    }
  }, 1000);

  return (
    <div className="space-y-5">
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>✓ {actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-slate-900">User Management</h2>
            <span className="px-2.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-extrabold rounded-full flex items-center gap-1">
              <Database className="w-3 h-3" /> Live MySQL Database
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">View, edit, or delete registered borrower accounts, contact details & security PINs from database.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Debounced Search Bar Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Debounced Search User..."
              className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={() => setAddUserModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Add New User
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              <p className="text-xs font-bold text-slate-600">Connecting to MySQL database & fetching registered users...</p>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <UserX className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-black text-slate-800">No Matching Users Found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm
                  ? `No user records matching search "${searchTerm}".`
                  : 'There are currently no registered users in the MySQL database.'}
              </p>
              <button
                onClick={() => setAddUserModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs"
              >
                <UserPlus className="w-4 h-4" /> Create First User Account
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">User ID</th>
                  <th className="p-3.5">Borrower Details</th>
                  <th className="p-3.5">Mobile Number</th>
                  <th className="p-3.5">Security PIN</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Registered On</th>
                  <th className="p-3.5">Loans</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-blue-700 text-xs">
                      {usr.user_code}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                          {usr.name ? usr.name.slice(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{usr.name}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{usr.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">{usr.mobile}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-900 tracking-wider">
                          {visiblePins[usr.id] ? usr.pin : '••••'}
                        </span>
                        <button
                          onClick={() => togglePinVisibility(usr.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                          title={visiblePins[usr.id] ? 'Hide PIN' : 'Show PIN'}
                        >
                          {visiblePins[usr.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => copyPinToClipboard(usr.id, usr.pin)}
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                          title="Copy PIN"
                        >
                          {copiedId === usr.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        usr.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 font-medium text-[11px]">{usr.created_at}</td>
                    <td className="p-3.5 font-black text-slate-900">{usr.applications_count}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(usr)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Edit User"
                        >
                          <Edit3 className="w-3 h-3 text-amber-700" /> Edit
                        </button>
                        <button
                          onClick={() => openDeleteConfirmModal(usr)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* QUERY-BASED PAGINATION CONTROLS */}
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* ADD USER MODAL */}
      {addUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Add New User Account</h3>
              <button onClick={() => setAddUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNewUserThrottled} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">10-Digit Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={newUserForm.mobile}
                  onChange={(e) => setNewUserForm({ ...newUserForm, mobile: e.target.value })}
                  placeholder="9876543210"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="rahul@example.com"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Default 4-Digit PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={newUserForm.pin}
                  onChange={(e) => setNewUserForm({ ...newUserForm, pin: e.target.value })}
                  placeholder="1234"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono tracking-wider text-slate-900"
                />
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Edit User Account (#{selectedUser?.user_code})</h3>
              <button onClick={() => setEditUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUserThrottled} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={editUserForm.mobile}
                  onChange={(e) => setEditUserForm({ ...editUserForm, mobile: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role *</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="user">User (Borrower)</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Security PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={editUserForm.pin}
                    onChange={(e) => setEditUserForm({ ...editUserForm, pin: e.target.value })}
                    placeholder="e.g. 1234"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 tracking-wider"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setEditUserModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update User Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deleteConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" /> Delete User Account
              </h3>
              <button onClick={() => setDeleteConfirmModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-700 font-medium">
              <p>
                Are you sure you want to delete user account <strong className="text-slate-900">{selectedUser?.name}</strong> ({selectedUser?.user_code} • {selectedUser?.mobile})?
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
                <strong>Warning:</strong> This will permanently delete the user account from the MySQL database. This action cannot be undone.
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUserThrottled}
                disabled={submitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl disabled:opacity-50"
              >
                {submitting ? 'Deleting User...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
