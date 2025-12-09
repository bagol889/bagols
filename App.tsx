import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { UserRole, Profile } from './types';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { generateBotKey, generateBotConfig } from './services/geminiService';
import { Shield, Users, Bot, LogOut, Terminal, Sparkles, Settings, Save, Edit2, Trash2, Activity, Lock, Globe, Key, Server, UserCheck, ShieldCheck, UserPlus, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

// --- STYLES & ANIMATIONS ---
const styleTag = `
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-6px); } 100% { transform: translateY(0px); } }
  @keyframes electricEnter { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
  @keyframes glitchError { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); border-color: #ef4444; } 75% { transform: translateX(4px); border-color: #ef4444; } }
  @keyframes recoilClick { 0% { transform: scale(1); } 50% { transform: scale(0.97); } 100% { transform: scale(1); } }
  
  /* ANIMASI SUKSES BARU */
  @keyframes successExit { 
    0% { transform: scale(1); border-color: #1e293b; } 
    20% { transform: scale(1.05); border-color: #10b981; box-shadow: 0 0 25px rgba(16,185,129,0.3); } 
    100% { transform: scale(0.9); opacity: 0; } 
  }

  .animate-float { animation: float 4s ease-in-out infinite; }
  .animate-electric { animation: electricEnter 0.4s ease-out forwards; }
  .animate-glitch { animation: glitchError 0.3s linear infinite; }
  .animate-recoil { animation: recoilClick 0.15s ease-out forwards; }
  .animate-success { animation: successExit 0.6s ease-in-out forwards; }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
`;

interface DashboardProps {
  user: Profile;
  onLogout: () => void;
}

// ==========================================
// 1. OWNER DASHBOARD (Full Custom UI)
// ==========================================
const OwnerDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  // State: Data
  const [users, setUsers] = useState<Profile[]>([]);
  const [userForm, setUserForm] = useState({ id: '', nomor: '', pw: '', key: '' });
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [owners, setOwners] = useState<Profile[]>([]);
  const [ownerForm, setOwnerForm] = useState({ id: '', username: '', pw: '' });
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- STATE SYSTEM UI (TOAST & MODAL) ---
  // 1. Toast State (Notifikasi Pojok)
  const [toast, setToast] = useState({ show: false, title: '', desc: '', type: 'success' as 'success'|'error' });

  // 2. Confirm Modal State (Popup Tengah)
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; msg: string; action: () => void; dangerous?: boolean } | null>(null);

  // --- HELPER FUNCTIONS ---
  const showToast = (title: string, desc: string, type: 'success'|'error' = 'success') => {
    setToast({ show: true, title, desc, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const closeConfirm = () => setConfirmModal(null);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (isSupabaseConfigured()) {
        const { data: userData } = await supabase.from('profiles').select('*').neq('role', UserRole.OWNER).order('created_at', { ascending: false });
        setUsers(userData || []);
        const { data: ownerData } = await supabase.from('profiles').select('*').eq('role', UserRole.OWNER).order('created_at', { ascending: false });
        setOwners(ownerData || []);
      } else {
        const savedUsers = localStorage.getItem('fuxxy_dummy_users');
        if (savedUsers) setUsers(JSON.parse(savedUsers));
        let savedOwners = JSON.parse(localStorage.getItem('fuxxy_owners_db') || '[]');
        if (savedOwners.length === 0) {
            savedOwners = [{ id: 'root', role: UserRole.OWNER, nomor: 'admin', pw: '123456' }];
            localStorage.setItem('fuxxy_owners_db', JSON.stringify(savedOwners));
        }
        setOwners(savedOwners);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- HANDLERS: USER BOT ---
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.nomor || !userForm.pw) return showToast("Validation Error", "Please fill Number and Password", 'error');

    try {
      if (isSupabaseConfigured()) {
        if (isEditingUser && userForm.id) await supabase.from('profiles').update({ nomor: userForm.nomor, pw: userForm.pw, key: userForm.key }).eq('id', userForm.id);
        else await supabase.from('profiles').insert([{ role: UserRole.USER, nomor: userForm.nomor, pw: userForm.pw, key: userForm.key }]);
        fetchData();
      } else {
        let newList;
        if (isEditingUser) newList = users.map(u => u.id === userForm.id ? { ...u, ...userForm } : u);
        else newList = [{ id: Date.now().toString(), role: UserRole.USER, ...userForm }, ...users];
        setUsers(newList);
        localStorage.setItem('fuxxy_dummy_users', JSON.stringify(newList));
      }
      showToast(isEditingUser ? 'User Updated' : 'User Created', `Bot ${userForm.nomor} has been saved.`);
      setUserForm({ id: '', nomor: '', pw: '', key: '' });
      setIsEditingUser(false);
    } catch (error:any) { showToast('System Error', error.message, 'error'); }
  };

  const confirmUserDelete = (id: string) => {
    // Buka Modal Konfirmasi
    setConfirmModal({
        show: true,
        title: 'Delete Bot User?',
        msg: 'This action cannot be undone. The bot configuration will be lost.',
        dangerous: true,
        action: async () => {
            if (isSupabaseConfigured()) { await supabase.from('profiles').delete().eq('id', id); fetchData(); } 
            else {
                const newList = users.filter(u => u.id !== id);
                setUsers(newList);
                localStorage.setItem('fuxxy_dummy_users', JSON.stringify(newList));
            }
            showToast('User Deleted', 'Data removed from database.');
            closeConfirm();
        }
    });
  };

  // --- HANDLERS: OWNER ADMIN ---
  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerForm.username || !ownerForm.pw) return showToast("Validation Error", "Username & Password required!", 'error');
    const exists = owners.some(o => o.nomor === ownerForm.username && o.id !== ownerForm.id);
    if (exists) return showToast("Duplicate Error", "Username already taken!", 'error');

    try {
        if (isSupabaseConfigured()) {
            if (isEditingOwner && ownerForm.id) await supabase.from('profiles').update({ nomor: ownerForm.username, pw: ownerForm.pw }).eq('id', ownerForm.id);
            else await supabase.from('profiles').insert([{ role: UserRole.OWNER, nomor: ownerForm.username, pw: ownerForm.pw }]);
            fetchData();
        } else {
            let newList;
            if (isEditingOwner) newList = owners.map(o => o.id === ownerForm.id ? { ...o, role: UserRole.OWNER, nomor: ownerForm.username, pw: ownerForm.pw } : o);
            else newList = [...owners, { id: 'ow_' + Date.now(), role: UserRole.OWNER, nomor: ownerForm.username, pw: ownerForm.pw }];
            setOwners(newList);
            localStorage.setItem('fuxxy_owners_db', JSON.stringify(newList));
        }
        showToast('Access Updated', `Admin access for ${ownerForm.username} saved.`);
        setOwnerForm({ id: '', username: '', pw: '' });
        setIsEditingOwner(false);
    } catch (e: any) { showToast('System Error', e.message, 'error'); }
  };

  const confirmOwnerDelete = (id: string) => {
    if (owners.length <= 1) return showToast("Action Denied", "Cannot delete the last owner!", 'error');
    if (id === user.id) return showToast("Action Denied", "Cannot delete yourself!", 'error');
    
    // Buka Modal Konfirmasi
    setConfirmModal({
        show: true,
        title: 'Revoke Owner Access?',
        msg: 'Are you sure you want to remove this admin? They will lose access immediately.',
        dangerous: true,
        action: async () => {
            if (isSupabaseConfigured()) { await supabase.from('profiles').delete().eq('id', id); fetchData(); }
            else {
                const newList = owners.filter(o => o.id !== id);
                setOwners(newList);
                localStorage.setItem('fuxxy_owners_db', JSON.stringify(newList));
            }
            showToast('Access Revoked', 'Owner removed successfully.');
            closeConfirm();
        }
    });
  };

  const stats = [
    { label: 'Bot Users', val: users.length.toString(), icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'System Admins', val: owners.length.toString(), icon: ShieldCheck, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'System Status', val: 'Online', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans overflow-hidden relative">
      <style>{styleTag}</style>
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30"><Shield className="w-8 h-8 text-indigo-400" /></div>
          <div><h1 className="text-3xl font-bold text-white tracking-tight">Owner Area</h1><p className="text-sm text-slate-400 font-medium">Logged in as: <span className="text-emerald-400 font-bold uppercase">{user.nomor}</span></p></div>
        </div>
        <Button variant="secondary" onClick={onLogout} className="bg-slate-900 border border-slate-700 hover:bg-slate-800"><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10">
        {stats.map((s, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}><s.icon className="w-6 h-6" /></div>
            <div><p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{s.label}</p><p className="text-2xl font-bold text-white">{s.val}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10 items-start">
        {/* LEFT COL: USER MANAGEMENT */}
        <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-white border-b border-slate-800 pb-4"><Users className="w-5 h-5 text-cyan-400" /> {isEditingUser ? 'Edit Bot User' : 'Create Bot User'}</h2>
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <Input className="bg-slate-950 border-slate-800" label="Bot Number" value={userForm.nomor} onChange={e => setUserForm({...userForm, nomor: e.target.value})} placeholder="628xxx" required />
                <Input className="bg-slate-950 border-slate-800" label="Password" value={userForm.pw} onChange={e => setUserForm({...userForm, pw: e.target.value})} placeholder="User Pass..." required />
                <Input className="bg-slate-950 border-slate-800" label="License Key" value={userForm.key} onChange={e => setUserForm({...userForm, key: e.target.value})} placeholder="Manual Key" />
                <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1 bg-cyan-700 hover:bg-cyan-600 border-0 font-bold">{isEditingUser ? 'Save User' : 'Add User'}</Button>
                    {isEditingUser && <Button type="button" onClick={() => { setIsEditingUser(false); setUserForm({id:'',nomor:'',pw:'',key:''}); }} className="bg-slate-800">Cancel</Button>}
                </div>
              </form>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 h-[400px] overflow-hidden flex flex-col">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Users List</h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-slate-800 bg-slate-950/50">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 text-slate-300 uppercase text-xs sticky top-0"><tr><th className="p-4">Number</th><th className="p-4">Password</th><th className="p-4">License Status</th><th className="p-4 text-right">Action</th></tr></thead>
                        <tbody className="divide-y divide-slate-800">
                            {users.map(u => {
                                const isKeyActive = !!u.key; // Logika Sederhana: Aktif jika field 'key' ada nilainya
                                return (
                                <tr key={u.id} className="hover:bg-slate-900/40">
                                    <td className="p-4">{u.nomor}</td>
                                    <td className="p-4 text-cyan-300 font-mono">{u.pw}</td>
                                    {/* Kolom Status License Key BARU */}
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isKeyActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                                            {isKeyActive ? <CheckCircle className="w-3 h-3 mr-1"/> : <X className="w-3 h-3 mr-1"/>}
                                            {isKeyActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    {/* Akhir Kolom Status License Key */}
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={() => { setIsEditingUser(true); setUserForm({id:u.id, nomor:u.nomor||'', pw:u.pw, key:u.key||''}); }} className="text-blue-400 bg-blue-500/10 p-2 rounded hover:bg-blue-500 hover:text-white"><Edit2 className="w-3 h-3"/></button>
                                        <button onClick={() => confirmUserDelete(u.id)} className="text-red-400 bg-red-500/10 p-2 rounded hover:bg-red-500 hover:text-white"><Trash2 className="w-3 h-3"/></button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* RIGHT COL: OWNER MANAGEMENT */}
        <div className="space-y-6">
            <div className="bg-slate-900/50 border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck className="w-24 h-24 text-emerald-500" /></div>
               <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-white border-b border-emerald-500/30 pb-4 relative z-10"><UserPlus className="w-5 h-5 text-emerald-400" /> {isEditingOwner ? 'Edit Admin' : 'Create Owner'}</h2>
               <form onSubmit={handleOwnerSubmit} className="space-y-4 relative z-10">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1"><label className="text-xs text-slate-400 font-bold ml-1 mb-1 block">Username</label><Input className="bg-slate-950 border-emerald-500/30 focus:border-emerald-500" value={ownerForm.username} onChange={e => setOwnerForm({...ownerForm, username: e.target.value})} placeholder="e.g. fuxxy" required /></div>
                    <div className="col-span-2 md:col-span-1"><label className="text-xs text-slate-400 font-bold ml-1 mb-1 block">Password</label><Input className="bg-slate-950 border-emerald-500/30 focus:border-emerald-500" value={ownerForm.pw} onChange={e => setOwnerForm({...ownerForm, pw: e.target.value})} placeholder="Secret Key" required /></div>
                 </div>
                 <div className="pt-2 flex gap-2">
                   <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 border-0 font-bold text-white shadow-lg shadow-emerald-500/20">{isEditingOwner ? <><Save className="w-4 h-4 mr-2"/> Update</> : <><UserPlus className="w-4 h-4 mr-2"/> Add Owner</>}</Button>
                   {isEditingOwner && <Button type="button" onClick={() => { setIsEditingOwner(false); setOwnerForm({id:'',username:'',pw:''}); }} className="bg-slate-800 w-1/3">Cancel</Button>}
                 </div>
               </form>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-emerald-900/20 rounded-lg text-emerald-400"><ShieldCheck className="w-4 h-4" /></div><h2 className="text-lg font-bold text-white">Owner Access Table</h2></div>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-bold"><tr><th className="px-6 py-3">Username</th><th className="px-6 py-3">Password</th><th className="px-6 py-3 text-right">Control</th></tr></thead>
                        <tbody className="divide-y divide-slate-800">
                            {owners.map((o) => (
                                <tr key={o.id} className={`group hover:bg-slate-900/30 ${o.id === user.id ? 'bg-emerald-500/5' : ''}`}>
                                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2"><Shield className="w-3 h-3 text-emerald-500" /> {o.nomor} {o.id === user.id && <span className="text-[10px] bg-emerald-500 text-black px-1.5 rounded font-bold">YOU</span>}</td>
                                    <td className="px-6 py-4 font-mono text-emerald-400 tracking-wider">{o.pw}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setIsEditingOwner(true); setOwnerForm({id:o.id, username:o.nomor||'', pw:o.pw}); }} className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition"><Edit2 className="w-3.5 h-3.5" /></button>
                                            {o.id !== user.id && <button onClick={() => confirmOwnerDelete(o.id)} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition"><Trash2 className="w-3.5 h-3.5" /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>

      {/* --- GLOBAL COMPONENTS UI --- */}
      
      {/* 1. TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[60] animate-slide-in">
            <div className={`backdrop-blur-xl border px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] ${toast.type === 'error' ? 'bg-red-950/90 border-red-500/40 text-red-100' : 'bg-slate-900/95 border-emerald-500/40 text-white'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                    {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
                </div>
                <div className="flex-1">
                    <h4 className={`font-bold text-sm ${toast.type === 'error' ? 'text-red-400' : 'text-white'}`}>{toast.title}</h4>
                    <p className={`text-[11px] mt-0.5 ${toast.type === 'error' ? 'text-red-200/70' : 'text-slate-400'}`}>{toast.desc}</p>
                </div>
                <button onClick={() => setToast(p=>({...p,show:false}))} className="opacity-60 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
            </div>
        </div>
      )}

      {/* 2. CONFIRM MODAL (CUSTOM REPLACEMENT FOR BROWSER CONFIRM) */}
      {confirmModal && confirmModal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={closeConfirm}></div>
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl animate-scale-up">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 mx-auto">
                    <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">{confirmModal.title}</h3>
                <p className="text-slate-400 text-sm text-center mb-6 leading-relaxed">{confirmModal.msg}</p>
                
                <div className="flex gap-3">
                    <button onClick={closeConfirm} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition">Cancel</button>
                    <button onClick={confirmModal.action} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition shadow-lg shadow-red-500/20">Delete</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

// ==========================================
// 2. USER DASHBOARD (User Biasa)
// ==========================================
const UserDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [form, setForm] = useState({ nomor: user.nomor || '', pw: user.pw, key: user.key || '' });
  const [aiConfig, setAiConfig] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showToast, setShowToast] = useState(false); 
  const [loading, setLoading] = useState(false);

  // Perubahan Logika Penyimpanan Data
  const handleSave = async () => { 
    setLoading(true);
    try {
        if (isSupabaseConfigured()) {
            // Update Supabase
            await supabase.from('profiles').update({ 
                nomor: form.nomor, 
                pw: form.pw, 
                key: form.key 
            }).eq('id', user.id);
        } else {
            // Update Local Storage (Dummy)
            const storedUsers = JSON.parse(localStorage.getItem('fuxxy_dummy_users') || '[]');
            const updatedUsers = storedUsers.map((u: Profile) => 
                u.id === user.id ? { ...u, nomor: form.nomor, pw: form.pw, key: form.key } : u
            );
            localStorage.setItem('fuxxy_dummy_users', JSON.stringify(updatedUsers));

            // Update user di Local Storage untuk sesi saat ini
            localStorage.setItem('fuxxy_user', JSON.stringify({ ...user, nomor: form.nomor, pw: form.pw, key: form.key }));
        }
        setShowToast(true);
        setTimeout(() => { setShowToast(false); }, 2000); 
    } catch (e) {
        // Logika Error bisa ditambahkan di sini
        console.error("Failed to save user data:", e);
    } finally {
        setLoading(false);
    }
  };

  const handleGenKey = async () => { setAiLoading(true); const k = await generateBotKey(); setForm({ ...form, key: k }); setAiLoading(false); };
  const handleGenConfig = async () => { setAiLoading(true); setAiConfig(await generateBotConfig('MyBot')); setAiLoading(false); };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans relative overflow-hidden">
      <style>{styleTag}</style>
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-800 pb-6 relative z-10">
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative shrink-0"><Bot className="w-10 h-10 text-cyan-400 relative z-10" /></div>
           <div><h1 className="text-xl font-bold text-white flex items-center gap-2">User Area <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/30 text-cyan-400 border border-cyan-500/20">v3</span></h1><p className="text-xs text-slate-500 font-mono flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>System Operational</p></div>
        </div>
        <Button onClick={onLogout} className="w-full md:w-auto bg-slate-900 border border-slate-700 hover:bg-red-900/20 hover:border-red-500/50 hover:text-red-400 transition-all text-sm h-10"><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
      </header>

      <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto relative z-10">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
           <div className="flex items-center gap-3 mb-8"><div className="p-2.5 bg-cyan-900/20 rounded-xl text-cyan-400 border border-cyan-500/20"><Settings className="w-5 h-5" /></div><h2 className="text-lg font-bold text-white">Bot Access</h2></div>
           <div className="space-y-6">
             <div className="group"><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Target Number</label><div className="relative"><Globe className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" /><input className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-cyan-500 transition-all outline-none" value={form.nomor} onChange={e => setForm({...form, nomor: e.target.value})} placeholder="628xxx" /></div></div>
             <div className="group"><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Access Password</label><div className="relative"><Key className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" /><input type="password" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-cyan-500 transition-all outline-none" value={form.pw} onChange={e => setForm({...form, pw: e.target.value})} /></div></div>
             <div className="group"><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block pl-1 flex justify-between">License Key <span className="text-[10px] normal-case text-cyan-400/80 bg-cyan-900/20 px-2 rounded-full border border-cyan-500/20">Manual / Auto</span></label><div className="flex gap-3"><div className="relative flex-1"><Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" /><input className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm font-mono text-cyan-300 focus:border-cyan-500 outline-none transition-all" value={form.key} onChange={e => setForm({...form, key: e.target.value})} placeholder="Paste Key Here..." /></div><button onClick={handleGenKey} disabled={aiLoading} className="shrink-0 w-12 h-[46px] flex items-center justify-center rounded-xl bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-600 hover:text-white transition-all active:scale-95"><Sparkles className={`w-5 h-5 ${aiLoading ? 'animate-spin' : ''}`} /></button></div></div>
             <Button onClick={handleSave} disabled={loading} className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-lg border-0 h-12 text-sm font-bold tracking-wide">{loading ? 'SAVING...' : 'SAVE CHANGES'}</Button>
           </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col h-full">
           <div className="flex items-center gap-3 mb-6"><div className="p-2.5 bg-purple-900/20 rounded-xl text-purple-400 border border-purple-500/20"><Terminal className="w-5 h-5" /></div><h2 className="text-lg font-bold text-white">Config Generator</h2></div>
           <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-hidden relative shadow-inner">
             <div className="h-[250px] overflow-y-auto custom-scrollbar pt-4">
                 {aiLoading ? (
                   <div className="h-full flex flex-col items-center justify-center text-purple-400/50 gap-3"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div><p className="animate-pulse font-sans text-xs">Processing AI Request...</p></div>
                 ) : (
                   <pre className="text-purple-300 leading-relaxed whitespace-pre-wrap">{aiConfig || '// Click "Generate Config" below\n// to create a new setting file.'}</pre>
                 )}
             </div>
           </div>
           <Button onClick={handleGenConfig} className="w-full mt-6 bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white h-12 text-sm"><Server className="w-4 h-4 mr-2" /> Generate JSON Config</Button>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 text-white px-5 py-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-center gap-4 min-w-[320px]">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20"><CheckCircle className="w-5 h-5 text-emerald-400" /></div>
                <div className="flex-1"><h4 className="font-bold text-sm text-white">Configuration Saved</h4><p className="text-[11px] text-slate-400 mt-0.5">System updated successfully.</p></div>
                <button onClick={() => setShowToast(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. MAIN APP (Login & Routing)
// ==========================================
const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  const [loginMode, setLoginMode] = useState<'user' | 'owner'>('user');
  const [cardEffect, setCardEffect] = useState<'float' | 'electric' | 'glitch' | 'recoil' | 'success'>('electric');

  const [currentUser, setCurrentUser] = useState<Profile | null>(() => { const saved = localStorage.getItem('fuxxy_user'); return saved ? JSON.parse(saved) : null; });
  const [loginId, setLoginId] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (currentUser) setView('dashboard'); }, [currentUser]);
  
  // Efek masuk (electric) setiap kali halaman login muncul
  useEffect(() => { 
    if (view === 'login') {
        setCardEffect('electric');
        const timer = setTimeout(() => { setCardEffect('float'); }, 500); 
        return () => clearTimeout(timer); 
    }
  }, [view]); // Ditambah dependency [view] biar jalan pas logout

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardEffect('recoil');
    setLoading(true); setError('');
    
    try {
      let userFound: Profile | null = null;
      if (isSupabaseConfigured()) {
          const { data, error } = await supabase.from('profiles').select('*').eq('role', loginMode).eq('nomor', loginId).eq('pw', password).maybeSingle();
          if (error) throw error;
          if (!data) throw new Error(`${loginMode === 'owner' ? 'Username' : 'Phone'} atau Password salah (DB).`);
          userFound = data as Profile;
      } else {
          await new Promise(r => setTimeout(r, 800)); 
          if (loginMode === 'user') {
              const dummyUsers = JSON.parse(localStorage.getItem('fuxxy_dummy_users') || '[]');
              const found = dummyUsers.find((u: any) => u.nomor === loginId && u.pw === password);
              if (found) userFound = found;
              else if (loginId === '628xxx' && password === '123456') userFound = { id: 'u1', role: UserRole.USER, nomor: loginId, pw: password, key: 'test_key' };
              else throw new Error("Nomor atau Password salah (Local).");
          } else if (loginMode === 'owner') {
              let ownerDB = JSON.parse(localStorage.getItem('fuxxy_owners_db') || '[]');
              if (ownerDB.length === 0) { const defaultOwner = { id: 'root', role: UserRole.OWNER, nomor: 'admin', pw: '123456' }; ownerDB = [defaultOwner]; localStorage.setItem('fuxxy_owners_db', JSON.stringify(ownerDB)); }
              const found = ownerDB.find((o: any) => o.nomor === loginId && o.pw === password);
              if (found) userFound = found;
              else throw new Error("Username atau Password Owner salah (Local).");
          }
      }
      
      setCardEffect('success'); 
      await new Promise(resolve => setTimeout(resolve, 600));
      
      localStorage.setItem('fuxxy_user', JSON.stringify(userFound));
      setCurrentUser(userFound);
      setView('dashboard');

    } catch (err: any) { 
      setCardEffect('glitch'); setTimeout(() => setCardEffect('float'), 300);
      setError(err.message); setLoginId(''); setPassword('');
    } finally { setLoading(false); }
  };

  const handleLogout = () => { 
      localStorage.removeItem('fuxxy_user'); 
      setCurrentUser(null); 
      setView('login'); 
      setLoginId(''); 
      setPassword('');
      // --- FIX BUG DISINI: Reset animasi biar muncul lagi ---
      setCardEffect('electric'); 
  };

  if (view === 'dashboard' && currentUser) { return currentUser.role === UserRole.OWNER ? <OwnerDashboard user={currentUser} onLogout={handleLogout} /> : <UserDashboard user={currentUser} onLogout={handleLogout} />; }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      <style>{styleTag}</style>
      <div className={`w-full max-w-[400px] bg-slate-900/50 backdrop-blur-xl rounded-[30px] border border-slate-800 shadow-2xl p-8 z-10 relative overflow-hidden ${cardEffect === 'float' ? 'animate-float' : ''} ${cardEffect === 'electric' ? 'animate-electric' : ''} ${cardEffect === 'glitch' ? 'animate-glitch border-red-500/30' : ''} ${cardEffect === 'recoil' ? 'animate-recoil' : ''} ${cardEffect === 'success' ? 'animate-success' : ''} `}>
        <div className="text-center mb-8"><div className="inline-flex relative group mb-4"><div className="relative p-4 bg-slate-950 rounded-full border border-slate-800 shadow-xl"><Bot className="w-8 h-8 text-white" /></div></div><h1 className="text-3xl font-bold text-white tracking-tight">Fuxxy<span className="text-cyan-400">MD</span></h1><p className="text-slate-400 text-xs font-medium tracking-widest mt-1">SECURE ACCESS PORTAL</p></div>
        <div className="bg-slate-950 p-1 rounded-xl flex mb-6 border border-slate-800"><button onClick={() => { setLoginMode('user'); setLoginId(''); setPassword(''); }} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${loginMode === 'user' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>USER BOT</button><button onClick={() => { setLoginMode('owner'); setLoginId(''); setPassword(''); }} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${loginMode === 'owner' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-slate-300'}`}>OWNER SYSTEM</button></div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">{loginMode === 'user' ? <Globe className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" /> : <Shield className="absolute left-4 top-3.5 w-4 h-4 text-emerald-500" />}<input className={`w-full bg-slate-950 border rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-all ${loginMode === 'owner' ? 'border-emerald-500/30 focus:border-emerald-500 placeholder-emerald-700' : 'border-slate-800 placeholder-slate-600 focus:border-cyan-500'}`} placeholder={loginMode === 'user' ? "Phone Number" : "Owner Username"} value={loginId} onChange={e=>setLoginId(e.target.value)} required /></div>
          <div className="relative"><Lock className={`absolute left-4 top-3.5 w-4 h-4 ${loginMode === 'owner' ? 'text-emerald-500' : 'text-slate-500'}`} /><input type="password" className={`w-full bg-slate-950 border rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-all ${loginMode === 'owner' ? 'border-emerald-500/30 focus:border-emerald-500 placeholder-emerald-700' : 'border-slate-800 placeholder-slate-600 focus:border-purple-500'}`} placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs text-center">{error}</div>}
          <button disabled={loading} className={`w-full py-3.5 mt-2 rounded-xl font-bold text-sm text-white transition-all shadow-lg ${loginMode === 'owner' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:opacity-90 shadow-cyan-500/20'}`}>{loading ? 'AUTHENTICATING...' : (loginMode === 'owner' ? 'ACCESS SYSTEM' : 'CONNECT SECURELY')}</button>
        </form>
        {!isSupabaseConfigured() && loginMode === 'owner' && <p className="text-center text-[10px] text-slate-500 mt-4">Default Login: admin / 123456</p>}
      </div>
      <p className="mt-8 text-xs text-slate-600 font-mono">Powered by <span className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors cursor-default">Security FuxxyMD</span> • v3</p>
    </div>
  );
};

export default App;
