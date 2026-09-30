'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (perPage: number) => void;
  syncWithUrl?: boolean;
}

export default function PaginationControls({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  syncWithUrl = true,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  const handlePageSelect = (page: number) => {
    if (page < 1 || page > totalPages || page === safeCurrentPage) return;
    onPageChange(page);

    if (syncWithUrl && typeof window !== 'undefined') {
      const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
      params.set('page', String(page));
      params.set('per_page', String(itemsPerPage));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const handlePerPageSelect = (newPerPage: number) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newPerPage);
    }
    onPageChange(1);

    if (syncWithUrl && typeof window !== 'undefined') {
      const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
      params.set('page', '1');
      params.set('per_page', String(newPerPage));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  // Generate visible page numbers array (e.g. 1 2 3 ... 10)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, safeCurrentPage - 1);
      let end = Math.min(totalPages, safeCurrentPage + 1);

      if (safeCurrentPage <= 2) {
        end = Math.min(totalPages, 4);
      } else if (safeCurrentPage >= totalPages - 1) {
        start = Math.max(1, totalPages - 3);
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="bg-white border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      {/* Items Count & Per-Page Selector */}
      <div className="flex items-center gap-3 text-slate-500 font-medium">
        <span>
          Showing <strong className="font-bold text-slate-900">{startItem}</strong> to{' '}
          <strong className="font-bold text-slate-900">{endItem}</strong> of{' '}
          <strong className="font-bold text-slate-900">{totalItems}</strong> entries
        </span>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="text-[11px] text-slate-400">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handlePerPageSelect(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      {/* Pagination Page Number Navigation */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => handlePageSelect(1)}
          disabled={safeCurrentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => handlePageSelect(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-0.5 font-bold"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 font-bold">
                  ...
                </span>
              );
            }
            const isSelected = p === safeCurrentPage;
            return (
              <button
                key={p}
                onClick={() => handlePageSelect(p)}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => handlePageSelect(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-0.5 font-bold"
          title="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => handlePageSelect(totalPages)}
          disabled={safeCurrentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

