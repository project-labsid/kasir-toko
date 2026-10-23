import React, { useState } from 'react';
import { UserCog, Plus, Shield, UserCheck, Mail } from 'lucide-react';
import { OrganizationMember, OrgRole } from '../../types';
import { tenantStore } from '../../db/tenant-store';

interface StaffViewProps {
  organizationId: string;
  members: OrganizationMember[];
  onRefresh: () => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  organizationId,
  members,
  onRefresh
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('cashier');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newMember: OrganizationMember = {
      id: `mem_${Date.now()}`,
      organizationId,
      userId: `usr_staff_${Date.now()}`,
      userEmail: email.trim(),
      userName: name.trim(),
      role,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    (tenantStore as any).state.members.push(newMember);
    (tenantStore as any).saveState();

    setName('');
    setEmail('');
    setShowInviteModal(false);
    onRefresh();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCog className="w-5 h-5 text-teal-600" />
            Manajemen Pegawai &amp; Hak Akses Toko
          </h1>
          <p className="text-xs text-slate-500">
            Atur staf kasir dan manajer yang diizinkan mengoperasikan toko ini.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Undang Kasir / Staf Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Pegawai</th>
                <th className="py-3 px-3">Email Akun</th>
                <th className="py-3 px-3">Peran / Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Terdaftar Sejak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                      {m.userName.charAt(0)}
                    </div>
                    <span>{m.userName}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                    {m.userEmail}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        m.role === 'owner'
                          ? 'bg-teal-100 text-teal-800'
                          : m.role === 'manager'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {m.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-700 font-semibold text-xs">
                      ● Aktif
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {new Date(m.createdAt).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Undang Staf Baru</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pegawai *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Rian Anggara"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Akun *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="pegawai@email.com"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hak Akses / Role *
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as OrgRole)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
                >
                  <option value="cashier">Kasir (Hanya Akses Terminal POS &amp; Nota)</option>
                  <option value="manager">Manajer (Akses Kasir &amp; Pengelolaan Produk)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-xs"
                >
                  Kirim Undangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
