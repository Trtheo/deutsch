import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, X, Eye, UserX, UserCheck, ShieldCheck, ShieldOff, Trash2, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowUpDown, Users, UserRound, Ban, SlidersHorizontal, RotateCcw,
} from 'lucide-react';
import { adminListUsers, adminSetUserStatus, adminUpdateRole, adminDeleteUser } from '../../api';
import { useDialog } from '../Dialog';
import { useToast } from '../Toast';
import UserDetailsModal from './UserDetailsModal';

const DEFAULT_FILTERS = { q: '', role: '', status: '', level: '', verified: '' };
const PAGE_SIZES = [10, 25, 50];
const fullName = u => [u.firstName, u.lastName].filter(Boolean).join(' ');

// Page numbers with ellipses: 1 … 4 5 6 … 12
function pageList(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1].filter(p => p >= 1 && p <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['…', p] : [p]));
}

function StatusBadge({ u }) {
  return u.deactivated
    ? <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Deactivated</span>
    : <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active</span>;
}

function RoleBadge({ role }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${role === 'admin'
      ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{role === 'admin' ? 'Admin' : 'Student'}</span>
  );
}

function IconButton({ label, onClick, className, children }) {
  return (
    <button type="button" title={label} aria-label={label}
      onClick={e => { e.stopPropagation(); onClick(); }}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-gray-400 ${className}`}>
      {children}
    </button>
  );
}

const SELECT = 'input py-2 text-sm w-full sm:w-auto';

export default function UsersTable({ currentUserId, onUsersChanged }) {
  const { confirm } = useDialog();
  const toast = useToast();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');       // what is typed; copied to filters.q after a short pause
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState({ users: [], total: 0, pages: 1, counts: null });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Search 300 ms after typing stops
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => (f.q === search.trim() ? f : { ...f, q: search.trim() }));
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = { page, limit, sort, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
    adminListUsers(params)
      .then(r => {
        if (!alive) return;
        // Deleting the last user on a page: step back a page
        if (r.data.users.length === 0 && page > 1) setPage(p => p - 1);
        else setData(r.data);
      })
      .catch(e => alive && toast.error(e.response?.data?.error || 'Failed to load users'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [filters, sort, page, limit, reloadKey, toast]);

  const setFilter = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1); };
  const hasFilters = useMemo(() => Object.values(filters).some(Boolean) || search, [filters, search]);
  const clearFilters = () => { setFilters(DEFAULT_FILTERS); setSearch(''); setPage(1); };

  const refresh = useCallback(() => { setReloadKey(k => k + 1); onUsersChanged?.(); }, [onUsersChanged]);
  const replaceUser = (updated) => {
    setData(d => ({ ...d, users: d.users.map(x => (x._id === updated._id ? { ...x, ...updated } : x)) }));
    setSelected(s => (s && s._id === updated._id ? { ...s, ...updated } : s));
  };

  // ── Actions (from the table or the details popup) ──
  const toggleStatus = async (u) => {
    const activating = !!u.deactivated;
    const ok = await confirm(activating
      ? { tone: 'info', title: 'Activate this user?', confirmLabel: 'Activate',
          message: `${u.username} will be able to log in again with their existing password and progress.` }
      : { tone: 'warning', title: 'Deactivate this user?', confirmLabel: 'Deactivate',
          message: `${u.username} will be signed out right away and can’t log in until you activate the account again. Their progress is kept.` });
    if (!ok) return;
    try {
      const res = await adminSetUserStatus(u._id, activating);
      replaceUser(res.data);
      toast.success(activating ? `${u.username} has been activated.` : `${u.username} has been deactivated.`);
      refresh();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to update the account'); }
  };

  const toggleRole = async (u) => {
    const makeAdmin = u.role !== 'admin';
    const ok = await confirm(makeAdmin
      ? { tone: 'warning', title: 'Make this user an admin?', confirmLabel: 'Make admin',
          message: `${u.username} will be able to manage all users, read messages and send broadcasts.` }
      : { tone: 'warning', title: 'Revoke admin rights?', confirmLabel: 'Revoke',
          message: `${u.username} will become a regular student and lose access to the admin panel.` });
    if (!ok) return;
    try {
      const res = await adminUpdateRole(u._id, makeAdmin ? 'admin' : 'user');
      replaceUser(res.data);
      toast.success(makeAdmin ? `${u.username} is now an admin.` : `${u.username} is no longer an admin.`);
      refresh();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to update role'); }
  };

  const deleteUser = async (u) => {
    const ok = await confirm({
      title: 'Delete this user?',
      message: `The account of ${u.username} (${u.email}) will be permanently deleted. This can’t be undone.`,
      confirmLabel: 'Delete user',
    });
    if (!ok) return;
    try {
      await adminDeleteUser(u._id);
      setSelected(null);
      toast.success(`${u.username} has been deleted.`);
      refresh();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to delete user'); }
  };

  // ── Sortable column header ──
  const SortHeader = ({ label, asc, desc }) => {
    const active = sort === asc || sort === desc;
    const next = sort === asc ? desc : asc;
    const Icon = !active ? ArrowUpDown : sort === asc ? ArrowUp : ArrowDown;
    return (
      <button type="button" onClick={() => { setSort(next); setPage(1); }}
        className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200 ${active ? 'text-gray-700 dark:text-gray-200' : ''}`}>
        {label} <Icon size={12} />
      </button>
    );
  };

  const counts = data.counts;
  const from = data.total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, data.total);

  const actionsFor = (u) => u._id === currentUserId ? (
    <span className="text-xs text-gray-400 px-2">—</span>
  ) : (
    <div className="flex items-center justify-end gap-0.5">
      <IconButton label="View details" onClick={() => setSelected(u)} className="hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600"><Eye size={16} /></IconButton>
      <IconButton label={u.deactivated ? 'Activate' : 'Deactivate'} onClick={() => toggleStatus(u)}
        className={u.deactivated ? 'hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-600' : 'hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600'}>
        {u.deactivated ? <UserCheck size={16} /> : <UserX size={16} />}
      </IconButton>
      <IconButton label={u.role === 'admin' ? 'Revoke admin' : 'Make admin'} onClick={() => toggleRole(u)} className="hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600">
        {u.role === 'admin' ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
      </IconButton>
      <IconButton label="Delete" onClick={() => deleteUser(u)} className="hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600"><Trash2 size={16} /></IconButton>
    </div>
  );

  const statCards = [
    { label: 'Total users', value: counts?.all, Icon: Users, color: 'text-blue-600 dark:text-blue-400', active: !filters.status && !filters.role, apply: () => { setFilters(f => ({ ...f, status: '', role: '' })); setPage(1); } },
    { label: 'Active', value: counts?.active, Icon: UserCheck, color: 'text-green-600 dark:text-green-400', active: filters.status === 'active', apply: () => setFilter('status', filters.status === 'active' ? '' : 'active') },
    { label: 'Deactivated', value: counts?.deactivated, Icon: Ban, color: 'text-red-600 dark:text-red-400', active: filters.status === 'deactivated', apply: () => setFilter('status', filters.status === 'deactivated' ? '' : 'deactivated') },
    { label: 'Admins', value: counts?.admins, Icon: ShieldCheck, color: 'text-purple-600 dark:text-purple-400', active: filters.role === 'admin', apply: () => setFilter('role', filters.role === 'admin' ? '' : 'admin') },
  ];

  return (
    <div className="space-y-4">
      {/* Summary cards (click to filter) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(c => (
          <button key={c.label} type="button" onClick={c.apply} aria-pressed={c.active}
            className={`card text-left py-3 transition-all hover:shadow-md ${c.active ? 'ring-2 ring-yellow-400' : ''}`}>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${c.color}`}><c.Icon size={14} /> {c.label}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{c.value ?? '–'}</div>
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9 pr-9 py-2 text-sm" placeholder="Search by name, username or email…"
                value={search} onChange={e => setSearch(e.target.value)} aria-label="Search users" />
              {search && (
                <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={15} /></button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2 items-center">
              <SlidersHorizontal size={16} className="hidden sm:block text-gray-400" />
              <select className={SELECT} value={filters.role} onChange={e => setFilter('role', e.target.value)} aria-label="Filter by role">
                <option value="">All roles</option><option value="user">Students</option><option value="admin">Admins</option>
              </select>
              <select className={SELECT} value={filters.status} onChange={e => setFilter('status', e.target.value)} aria-label="Filter by status">
                <option value="">All statuses</option><option value="active">Active</option><option value="deactivated">Deactivated</option>
              </select>
              <select className={SELECT} value={filters.level} onChange={e => setFilter('level', e.target.value)} aria-label="Filter by level">
                <option value="">All levels</option>{['A1', 'A2', 'B1', 'B2'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select className={SELECT} value={filters.verified} onChange={e => setFilter('verified', e.target.value)} aria-label="Filter by email verification">
                <option value="">Any email</option><option value="yes">Verified</option><option value="no">Not verified</option>
              </select>
              <select className={SELECT} value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} aria-label="Sort users">
                <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
                <option value="name">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="level">Level</option>
              </select>
            </div>
          </div>
          {hasFilters && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">{loading ? 'Searching…' : `${data.total} matching user${data.total === 1 ? '' : 's'}`}</span>
              <button onClick={clearFilters} className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-semibold hover:underline"><RotateCcw size={12} /> Clear filters</button>
            </div>
          )}
        </div>

        {/* Table (tablet and desktop) */}
        <div className="hidden md:block">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 bg-gray-50/60 dark:bg-gray-800/30">
                <th className="px-4 py-3 w-[40%]"><SortHeader label="User" asc="name" desc="name-desc" /></th>
                <th className="px-3 py-3 w-[9%]">Level</th>
                <th className="px-3 py-3 w-[11%]">Role</th>
                <th className="px-3 py-3 w-[15%]">Status</th>
                <th className="px-3 py-3 w-[12%]"><SortHeader label="Joined" asc="oldest" desc="newest" /></th>
                <th className="px-4 py-3 w-[13%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.users.length === 0 && Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3" colSpan={6}><div className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" /></td>
                </tr>
              ))}
              {data.users.map(u => (
                <tr key={u._id} onClick={() => setSelected(u)}
                  className={`border-t border-gray-100 dark:border-gray-800 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40
                    ${u.deactivated ? 'bg-red-50/40 dark:bg-red-500/5' : ''} ${loading ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg flex-shrink-0">{u.avatar || '🧑'}</span>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white truncate">
                          {fullName(u) || u.username}
                          {u._id === currentUserId && <span className="ml-1.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">(you)</span>}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username} · {u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><span className="bg-yellow-100 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">{u.level || 'A1'}</span></td>
                  <td className="px-3 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-3 py-3"><StatusBadge u={u} /></td>
                  <td className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{actionsFor(u)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards (phones) */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {data.users.map(u => (
            <div key={u._id} onClick={() => setSelected(u)} className={`p-4 cursor-pointer ${u.deactivated ? 'bg-red-50/40 dark:bg-red-500/5' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl flex-shrink-0">{u.avatar || '🧑'}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white truncate">{fullName(u) || u.username}{u._id === currentUserId && <span className="ml-1 text-xs text-yellow-600">(you)</span>}</div>
                  <div className="text-xs text-gray-500 truncate">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex flex-wrap gap-1.5"><RoleBadge role={u.role} /><StatusBadge u={u} /></div>
                {actionsFor(u)}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!loading && data.users.length === 0 && (
          <div className="text-center py-14">
            <UserRound size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <div className="font-semibold text-gray-900 dark:text-white">No users found</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try a different search or remove some filters.</p>
            {hasFilters && <button onClick={clearFilters} className="btn-secondary text-sm mt-4">Clear filters</button>}
          </div>
        )}

        {/* Footer: range, page size, pagination */}
        {data.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm">
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <span>Showing <strong className="text-gray-900 dark:text-white">{from}–{to}</strong> of <strong className="text-gray-900 dark:text-white">{data.total}</strong></span>
              <select className="input py-1 px-2 text-xs w-auto" value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} aria-label="Rows per page">
                {PAGE_SIZES.map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} aria-label="Previous page"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none"><ChevronLeft size={16} /></button>
              {pageList(page, data.pages).map((p, i) => p === '…'
                ? <span key={`gap${i}`} className="w-8 text-center text-gray-400">…</span>
                : <button key={p} onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined}
                    className={`min-w-8 h-8 px-2 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-yellow-400 text-gray-900' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{p}</button>)}
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pages} aria-label="Next page"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none"><ChevronRight size={16} /></button>
            </nav>
          </div>
        )}
      </div>

      {selected && (
        <UserDetailsModal
          user={selected}
          isSelf={selected._id === currentUserId}
          onClose={() => setSelected(null)}
          onToggleStatus={toggleStatus}
          onToggleRole={toggleRole}
          onDelete={deleteUser}
        />
      )}
    </div>
  );
}
