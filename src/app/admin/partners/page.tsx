'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useThrottleCallback } from '@/hooks/useThrottle';
import PaginationControls from '@/components/admin/PaginationControls';
import {
  Building2,
  Plus,
  X,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Percent,
  IndianRupee,
  Link as LinkIcon,
  Tag,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  category: 'both' | 'low_cibil' | 'high_cibil';
  low_cibil_roi: string;
  high_cibil_roi: string;
  low_cibil_amount: string;
  high_cibil_amount: string;
  badge: string;
  url: string;
  is_active: boolean;
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  
  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'low_cibil' | 'high_cibil'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Partner, 'id'>>({
    name: '',
    category: 'both',
    low_cibil_roi: '14.99% p.a.',
    high_cibil_roi: '10.99% p.a.',
    low_cibil_amount: 'Up to ₹4,00,000',
    high_cibil_amount: 'Up to ₹50,00,000',
    badge: 'POPULAR CHOICE',
    url: 'https://',
    is_active: true,
  });

  // Sync URL params on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qPage = params.get('page');
      const qPerPage = params.get('per_page');
      const qSearch = params.get('search');

      if (qPage) setCurrentPage(Number(qPage));
      if (qPerPage) setItemsPerPage(Number(qPerPage));
      if (qSearch) setSearchQuery(qSearch);
    }
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/partners');
      if (res && res.data && Array.isArray(res.data)) {
        setPartners(res.data);
      } else {
        setPartners([]);
      }
    } catch (err) {
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleOpenAddModal = () => {
    setEditingPartnerId(null);
    setFormData({
      name: '',
      category: 'both',
      low_cibil_roi: '14.99% p.a.',
      high_cibil_roi: '10.49% p.a.',
      low_cibil_amount: 'Up to ₹4,00,000',
      high_cibil_amount: 'Up to ₹50,00,000',
      badge: 'POPULAR CHOICE',
      url: 'https://',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (partner: Partner) => {
    setEditingPartnerId(partner.id);
    setFormData({
      name: partner.name,
      category: partner.category || 'both',
      low_cibil_roi: partner.low_cibil_roi || '14.99% p.a.',
      high_cibil_roi: partner.high_cibil_roi || '10.49% p.a.',
      low_cibil_amount: partner.low_cibil_amount || 'Up to ₹4,00,000',
      high_cibil_amount: partner.high_cibil_amount || 'Up to ₹50,00,000',
      badge: partner.badge || 'POPULAR CHOICE',
      url: partner.url || 'https://',
      is_active: partner.is_active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSavePartnerThrottled = useThrottleCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    let updatedList: Partner[] = [];
    if (editingPartnerId) {
      updatedList = partners.map((p) =>
        p.id === editingPartnerId ? { ...formData, id: editingPartnerId } : p
      );
    } else {
      const newId = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
      updatedList = [{ ...formData, id: newId }, ...partners];
    }

    try {
      await apiRequest('/admin/partners', {
        method: 'POST',
        body: JSON.stringify({ partners: updatedList }),
      });
      setPartners(updatedList);
      setMsg(editingPartnerId ? 'Partner details updated successfully!' : 'New lending partner added successfully!');
      setIsModalOpen(false);
    } catch (err: any) {
      setMsg('Failed to save partner. Please try again.');
    } finally {
      setSaving(false);
    }
  }, 1000);

  const handleToggleActiveThrottled = useThrottleCallback(async (partnerId: string) => {
    const updatedList = partners.map((p) =>
      p.id === partnerId ? { ...p, is_active: !p.is_active } : p
    );
    setPartners(updatedList);

    try {
      await apiRequest('/admin/partners', {
        method: 'POST',
        body: JSON.stringify({ partners: updatedList }),
      });
      setMsg('Partner status updated.');
    } catch (err) {
      fetchPartners();
    }
  }, 800);

  const handleDeletePartnerThrottled = useThrottleCallback(async (partnerId: string, partnerName: string) => {
    if (!confirm(`Are you sure you want to delete ${partnerName}?`)) return;

    try {
      const res = await apiRequest(`/admin/partners/${partnerId}`, {
        method: 'DELETE',
      });
      if (res && res.data) {
        setPartners(res.data);
      } else {
        setPartners(partners.filter((p) => p.id !== partnerId));
      }
      setMsg(`Partner ${partnerName} deleted.`);
    } catch (err) {
      fetchPartners();
    }
  }, 1000);

  const filteredPartners = React.useMemo(() => {
    return partners.filter((p) => {
      const matchesSearch = !debouncedSearchQuery ||
                            p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                            p.badge?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      if (categoryFilter === 'all') return matchesSearch;
      return matchesSearch && (p.category === categoryFilter || p.category === 'both');
    });
  }, [partners, debouncedSearchQuery, categoryFilter]);

  const paginatedPartners = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPartners.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPartners, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {msg}
          </span>
          <button onClick={() => setMsg('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Affiliate Lending Partners & Lenders</h2>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
              {partners.length} Configured
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage partner banks, separate Low CIBIL vs High CIBIL interest rates, loan limits & affiliate URLs for user portal.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Partner / Lender</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Debounced Search bank or badge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 mr-1">Filter:</span>
          {(['all', 'low_cibil', 'high_cibil'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Partners' : cat === 'low_cibil' ? '🟠 Low CIBIL Focus' : '🟢 High CIBIL Focus'}
            </button>
          ))}
        </div>
      </div>

      {/* Partners List / Grid */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-xs font-bold text-slate-600">Loading lending partners...</p>
        </div>
      ) : paginatedPartners.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-2 shadow-2xs">
          <Building2 className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No Lending Partners Found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || categoryFilter !== 'all'
              ? 'No partners match your current filter. Try adjusting your search criteria.'
              : 'No lending partners exist in the database. Click "Add New Partner" above to create your first lender offer.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedPartners.map((p) => (
              <div
                key={p.id}
                className={`bg-white border-2 rounded-2xl p-4 space-y-3 shadow-2xs relative transition-all ${
                  p.is_active ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/70 opacity-75'
                }`}
              >
                {/* Partner Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-2xs ${
                      p.category === 'low_cibil'
                        ? 'bg-orange-500'
                        : p.category === 'high_cibil'
                        ? 'bg-emerald-600'
                        : 'bg-purple-600'
                    }`}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-extrabold rounded-md uppercase border border-slate-200">
                          {p.badge || 'PARTNER'}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase border ${
                          p.category === 'low_cibil'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : p.category === 'high_cibil'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {p.category === 'low_cibil' ? '🟠 Low CIBIL' : p.category === 'high_cibil' ? '🟢 High CIBIL' : '🟣 Both CIBIL'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle Switch */}
                  <button
                    onClick={() => handleToggleActiveThrottled(p.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 transition-colors ${
                      p.is_active
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600 border border-slate-300'
                    }`}
                    title="Click to toggle active status on user portal"
                  >
                    {p.is_active ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                    <span>{p.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                  </button>
                </div>

                {/* Interest Rate & Limits Grid */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-rose-700 uppercase">
                      <ShieldAlert className="w-3 h-3 text-rose-500" /> Low CIBIL Rate
                    </div>
                    <p className="font-black text-slate-900">{p.low_cibil_roi || '14.99% p.a.'}</p>
                    <p className="text-[11px] text-slate-500 font-semibold">{p.low_cibil_amount || 'Up to ₹4,00,000'}</p>
                  </div>

                  <div className="space-y-0.5 border-l border-slate-200 pl-2.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> High CIBIL Rate
                    </div>
                    <p className="font-black text-slate-900">{p.high_cibil_roi || '10.49% p.a.'}</p>
                    <p className="text-[11px] text-slate-500 font-semibold">{p.high_cibil_amount || 'Up to ₹50,00,000'}</p>
                  </div>
                </div>

                {/* Affiliate Redirect URL */}
                <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] truncate flex-1 min-w-0">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{p.url}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                      title="Test affiliate link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs transition-colors"
                      title="Edit Partner Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePartnerThrottled(p.id, p.name)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs transition-colors"
                      title="Delete Partner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* QUERY-BASED PAGINATION CONTROLS */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <PaginationControls
              currentPage={currentPage}
              totalItems={filteredPartners.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>
      )}

      {/* ADD / EDIT PARTNER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {editingPartnerId ? 'Edit Lending Partner' : 'Add New Lending Partner'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePartnerThrottled} className="space-y-4 text-xs">
              {/* Partner Name & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Partner / Bank Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kotak Mahindra Bank"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target CIBIL Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="both">🟣 Both Low & High CIBIL</option>
                    <option value="low_cibil">🟠 Low CIBIL Focus Only</option>
                    <option value="high_cibil">🟢 High CIBIL Focus Only</option>
                  </select>
                </div>
              </div>

              {/* Low CIBIL Settings */}
              <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-orange-800 font-extrabold text-xs">
                  <ShieldAlert className="w-4 h-4 text-orange-600" />
                  <span>Low CIBIL Configuration (Orange Zone 300 - 620)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Low CIBIL Interest Rate</label>
                    <input
                      type="text"
                      placeholder="e.g. 14.99% p.a."
                      value={formData.low_cibil_roi}
                      onChange={(e) => setFormData({ ...formData, low_cibil_roi: e.target.value })}
                      className="w-full p-2.5 bg-white border border-rose-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Low CIBIL Max Amount</label>
                    <input
                      type="text"
                      placeholder="e.g. Up to ₹4,00,000"
                      value={formData.low_cibil_amount}
                      onChange={(e) => setFormData({ ...formData, low_cibil_amount: e.target.value })}
                      className="w-full p-2.5 bg-white border border-rose-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* High CIBIL Settings */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>High CIBIL Configuration (Green Zone 750 - 900)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">High CIBIL Interest Rate</label>
                    <input
                      type="text"
                      placeholder="e.g. 10.49% p.a."
                      value={formData.high_cibil_roi}
                      onChange={(e) => setFormData({ ...formData, high_cibil_roi: e.target.value })}
                      className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">High CIBIL Max Amount</label>
                    <input
                      type="text"
                      placeholder="e.g. Up to ₹50,00,000"
                      value={formData.high_cibil_amount}
                      onChange={(e) => setFormData({ ...formData, high_cibil_amount: e.target.value })}
                      className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Badge Tag & Affiliate URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Feature Tag Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. LOW CIBIL SPECIAL, INSTANT"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Active & Visible on User App</span>
                  </label>
                </div>
              </div>

              {/* Affiliate URL */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Affiliate / Redirect URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-medium"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingPartnerId ? 'Update Partner' : 'Save New Partner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
