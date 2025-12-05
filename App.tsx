import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { UserRole, Profile } from './types';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { generateBotKey, generateBotConfig } from './services/geminiService';
import { Shield, Users, Bot, LogOut, Terminal, Sparkles, AlertTriangle, Smartphone, Settings, Save, Database, Copy, Check, Trash2, Edit2, X, RefreshCw } from 'lucide-react';

interface DashboardProps {
  user: Profile;
  onLogout: () => void;
}

// --- 1. OWNER DASHBOARD (LENGKAP) ---
const OwnerDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', nomor: '', pw: '', key: '' });
  const [isEditing, setIsEditing] = useState(false);
  
  // State Ganti Password Owner
  const [ownerPw, setOwnerPw] = useState('');
  const [updatingOwner, setUpdatingOwner] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').neq('role', UserRole.OWNER).order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      if (!isSupabaseConfigured()) {
        setUsers([{ id: '1', role: UserRole.USER, nomor: '628xxx', pw: '123456', key: 'sk_test_123' }]);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && formData.id) {
        await supabase.from('profiles').update({ nomor: formData.nomor, pw: formData.pw, key: formData.key }).eq('id', formData.id);
      } else {
        await supabase.from('profiles').insert([{ role: UserRole.USER, nomor: formData.nomor, pw: formData.pw, key: formData.key }]);
      }
      setFormData({ id: '', nomor: '', pw: '', key: '' });
      setIsEditing(false);
      fetchUsers();
    } catch (err) { alert('Gagal menyimpan data'); }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Yakin hapus user ini?')) {
      await supabase.from('profiles').delete().eq('id', id);
      fetchUsers();
    }
  };

  const handleUpdateOwnerPw = async () => {
    if (!ownerPw) return;
    setUpdatingOwner(true);
    try {
      const { error } = await supabase.from('profiles').update({ pw: ownerPw }).eq('id', user.id);
      if (error && isSupabaseConfigured()) throw error;
      alert('Password Owner berhasil diubah!');
      setOwnerPw('');
    } catch (err: any) { alert('Gagal update: ' + err.message); }
    finally { setUpdatingOwner(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Owner Dashboard</h1>
            <p className="text-sm text-slate-400">Control Panel Admin</p>
          </div>
        </div>
        <Button variant="secondary" onClick={onLogout} size="sm"><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: FORM USER & GANTI PASSWORD */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Form Manage User */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> {isEditing ? 'Edit User' : 'Buat User Baru'}
            </h2>
            <form onSubmit={handleSubmitUser} className="space-y-4">
              <Input label="Nomor Bot (Login ID)" value={formData.nomor} onChange={e => setFormData({...formData, nomor: e.target.value})} placeholder="628..." required />
              <Input label="Password User" value={formData.pw} onChange={e => setFormData({...formData, pw: e.target.value})} placeholder="password..." required />
              <Input label="Manual Key (Opsional)" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} placeholder="Kosongkan jika auto..." />
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="w-full shadow-lg shadow-indigo-500/20">{isEditing ? 'Simpan Perubahan' : 'Tambah User'}</Button>
                {isEditing && <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); setFormData({id:'',nomor:'',pw:'',key:''}); }}>Batal</Button>}
              </div>
            </form>
          </div>

          {/* Form Ganti Password Owner (INI YANG DIKEMBALIKAN) */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700 shadow-xl relative overflow-hidden">
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
               <Settings className="w-5 h-5 text-emerald-400" /> Admin Settings
             </h2>
             <div className="space-y-4">
               <Input label="Ganti Password Owner" type="text" value={ownerPw} onChange={(e) => setOwnerPw(e.target.value)} placeholder="Password Baru..." />
               <Button onClick={handleUpdateOwnerPw} isLoading={updatingOwner} className="w-full bg-slate-700 hover:bg-slate-600" disabled={!ownerPw}>
                 <Save className="w-4 h-4 mr-2" /> Simpan Password Baru
               </Button>
             </div>
          </div>

        </div>

        {/* KOLOM KANAN: LIST USER */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
            <h2 className="text-lg font-semibold text-slate-200">Daftar User Aktif</h2>
            <span className="text-xs font-mono bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30">Total: {users.length}</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/50 text-slate-400 uppercase text-xs tracking-wider">
                <tr><th className="px-6 py-4">Nomor</th><th className="px-6 py-4">Password</th><th className="px-6 py-4">Key</th><th className="px-6 py-4 text-right">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{u.nomor}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{u.pw}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${u.key ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>{u.key ? 'Active Key' : 'No Key'}</span></td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => { setIsEditing(true); setFormData({id:u.id, nomor:u.nomor||'', pw:u.pw, key:u.key||''}); }} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded transition"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded transition"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. USER DASHBOARD (PREMIUM UI) ---
const UserDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [profile, setProfile] = useState<Profile>(user);
  const [form, setForm] = useState({ nomor: user.nomor || '', pw: user.pw, key: user.key || '' });
  const [loading, setLoading] = useState(false);
  const [aiConfig, setAiConfig] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await supabase.from('profiles').update(form).eq('id', user.id);
      setProfile({ ...profile, ...form });
      alert('Berhasil disimpan!');
    } catch { alert('Gagal menyimpan'); } finally { setLoading(false); }
  };

  const handleGenKey = async () => {
    setAiLoading(true);
    const k = await generateBotKey();
    setForm({ ...form, key: k });
    setAiLoading(false);
  };

  const handleGenConfig = async () => {
    setAiLoading(true);
    setAiConfig(await generateBotConfig('MyBot'));
    setAiLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">Bot Control Panel</h1>
            <p className="text-sm text-slate-400">User: {profile.nomor || 'Unknown'}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={onLogout} size="sm"><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
      </header>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-xl border border-slate-700 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2"><Terminal className="w-5 h-5 text-emerald-400" /> Pengaturan Akun</h2>
          <div className="space-y-5">
            <Input label="Nomor Bot" value={form.nomor} onChange={e => setForm({...form, nomor: e.target.value})} />
            <Input label="Password Login" value={form.pw} onChange={e => setForm({...form, pw: e.target.value})} />
            <div>
              <label className="text-sm text-slate-300 font-medium">License Key</label>
              <div className="flex gap-2 mt-1">
                <input className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={form.key} onChange={e => setForm({...form, key: e.target.value})} placeholder="Klik tombol di kanan..." />
                <Button onClick={handleGenKey} isLoading={aiLoading} title="Generate Key"><Sparkles className="w-4 h-4 text-yellow-400" /></Button>
              </div>
            </div>
            <Button onClick={handleSave} isLoading={loading} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">Simpan Perubahan</Button>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-400" /> Config Generator</h2>
          <div className="flex-1 bg-slate-950/80 rounded-lg p-4 font-mono text-xs text-green-400 overflow-auto border border-slate-800 mb-4 min-h-[180px] shadow-inner">
            <pre>{aiConfig || '// Klik tombol di bawah untuk membuat config JSON...'}</pre>
          </div>
          <Button onClick={handleGenConfig} variant="ghost" className="border border-slate-600 hover:bg-slate-800 hover:border-slate-500" isLoading={aiLoading}>Generate Config Template</Button>
        </div>
      </div>
    </div>
  );
};

// --- 3. MAIN APP (LOGIN - PREMIUM UI) ---
const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  const [loginMode, setLoginMode] = useState<'user' | 'owner'>('user');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');

    try {
      let userFound: Profile | null = null;
      if (!isSupabaseConfigured()) {
        await new Promise(r => setTimeout(r, 800));
        if (loginMode === 'owner' && password === 'admin123') userFound = { id: 'o1', role: UserRole.OWNER, nomor: null, pw: password, key: null };
        else if (loginMode === 'user' && loginId && password) userFound = { id: 'u1', role: UserRole.USER, nomor: loginId, pw: password, key: 'test_key' };
        else throw new Error("Password Salah / Data Tidak Lengkap");
      } else {
        let q = supabase.from('profiles').select('*');
        if (loginMode === 'owner') q = q.eq('role', 'owner').eq('pw', password);
        else q = q.eq('nomor', loginId).eq('pw', password);
        const { data, error } = await q.maybeSingle();
        if (error) throw error;
        // --- FIX SYNTAX ---
        if (!data) throw new Error(loginMode === 'owner' ? "Password Owner salah." : "Login gagal, cek Nomor/Password.");
        userFound = data as Profile;
      }
      setCurrentUser(userFound);
      setView('dashboard');
    } catch (err: any) { setError(err.message || "Terjadi kesalahan sistem."); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { setCurrentUser(null); setView('login'); setLoginId(''); setPassword(''); };

  if (view === 'dashboard' && currentUser) {
    return currentUser.role === UserRole.OWNER ? <OwnerDashboard user={currentUser} onLogout={handleLogout} /> : <UserDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8 z-10 relative">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-slate-800/50 rounded-2xl mb-4 shadow-inner ring-1 ring-slate-700">
             <Bot className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Security FuxxyMD</h1>
          <p className="text-slate-400 text-sm">Silakan login untuk mengelola bot</p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-xl mb-6 ring-1 ring-slate-700/50">
           <button onClick={() => { setLoginMode('user'); setError(''); }} className={`py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${loginMode === 'user' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>
             <span className="flex items-center justify-center gap-2"><Smartphone className="w-4 h-4" /> User</span>
           </button>
           <button onClick={() => { setLoginMode('owner'); setError(''); }} className={`py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${loginMode === 'owner' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>
             <span className="flex items-center justify-center gap-2"><Shield className="w-4 h-4" /> Owner</span>
           </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {loginMode === 'user' && <Input label="Nomor Bot" placeholder="628..." value={loginId} onChange={(e) => setLoginId(e.target.value)} required className="bg-slate-950/50 border-slate-700 focus:border-indigo-500/50" />}
          <Input label={loginMode === 'owner' ? "Password Owner" : "Password"} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-slate-950/50 border-slate-700 focus:border-indigo-500/50" />
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-200 text-center flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          <Button type="submit" className={`w-full h-11 text-base shadow-xl transition-all duration-300 ${loginMode === 'owner' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'}`} isLoading={loading}>
            {loginMode === 'owner' ? 'Masuk Dashboard Owner' : 'Masuk Dashboard User'}
          </Button>
        </form>
      </div>
      
      <p className="mt-8 text-xs text-slate-600 font-mono">Powered by Security FuxxyMD • v1.3.0</p>
    </div>
  );
};

export default App;
