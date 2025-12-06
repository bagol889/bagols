import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { UserRole, Profile } from './types';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { generateBotKey, generateBotConfig } from './services/geminiService';
import { Shield, Users, Bot, LogOut, Terminal, Sparkles, AlertTriangle, Settings, Save, Edit2, Trash2, Cpu, Activity, Lock, Globe, Key, Server } from 'lucide-react';

// --- STYLES ---
const styleTag = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  .animate-float { animation: float 6s ease-in-out infinite; }
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
`;

interface DashboardProps {
  user: Profile;
  onLogout: () => void;
}

// --- 1. OWNER DASHBOARD ---
const OwnerDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', nomor: '', pw: '', key: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [ownerPw, setOwnerPw] = useState('');
  const [updatingOwner, setUpdatingOwner] = useState(false);
  
  const stats = [
    { label: 'Active Bots', val: users.length.toString(), icon: Bot, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Server Load', val: '34%', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Security', val: 'Secure', icon: Shield, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  ];

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.from('profiles').select('*').neq('role', UserRole.OWNER).order('created_at', { ascending: false });
        if (error) throw error;
        setUsers(data || []);
      } else {
        // Ambil data dummy dari localStorage jika ada, kalau tidak pakai default
        const savedUsers = localStorage.getItem('fuxxy_dummy_users');
        if (savedUsers) {
            setUsers(JSON.parse(savedUsers));
        } else {
            const defaultUser = [{ id: '1', role: UserRole.USER, nomor: '628xxx', pw: '123456', key: 'sk_test_123' }];
            setUsers(defaultUser);
            localStorage.setItem('fuxxy_dummy_users', JSON.stringify(defaultUser));
        }
      }
    } catch (err: any) {
       console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // LOGIKA SIMPAN USER (DENGAN LOCALSTORAGE)
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!isSupabaseConfigured()) {
        let newUsersList;
        if (isEditing) {
          newUsersList = users.map(u => u.id === formData.id ? { ...u, ...formData } : u);
        } else {
          const newUser: Profile = {
            id: Date.now().toString(),
            role: UserRole.USER,
            nomor: formData.nomor,
            pw: formData.pw,
            key: formData.key
          };
          newUsersList = [newUser, ...users];
        }
        setUsers(newUsersList);
        localStorage.setItem('fuxxy_dummy_users', JSON.stringify(newUsersList));
        alert(isEditing ? 'User updated!' : 'User created!');
      } else {
        if (isEditing && formData.id) {
          await supabase.from('profiles').update({ nomor: formData.nomor, pw: formData.pw, key: formData.key }).eq('id', formData.id);
        } else {
          await supabase.from('profiles').insert([{ role: UserRole.USER, nomor: formData.nomor, pw: formData.pw, key: formData.key }]);
        }
        await fetchUsers();
        alert('Success!');
      }
      setFormData({ id: '', nomor: '', pw: '', key: '' });
      setIsEditing(false);
    } catch (err: any) { alert('Error: ' + err.message); }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Hapus user ini?')) {
      if (!isSupabaseConfigured()) {
        const newUsersList = users.filter(u => u.id !== id);
        setUsers(newUsersList);
        localStorage.setItem('fuxxy_dummy_users', JSON.stringify(newUsersList));
      } else {
        await supabase.from('profiles').delete().eq('id', id);
        fetchUsers();
      }
    }
  };

  // --- PERBAIKAN: UPDATE PASSWORD OWNER ---
  const handleUpdateOwnerPw = async () => {
    if (!ownerPw) return;
    setUpdatingOwner(true);
    
    // Simpan password baru ke LocalStorage
    localStorage.setItem('fuxxy_owner_pw', ownerPw);
    
    // Simulasi loading
    setTimeout(() => {
        alert('Password Owner berhasil diubah! Silakan login ulang dengan password baru.');
        setOwnerPw('');
        setUpdatingOwner(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans overflow-hidden relative">
      <style>{styleTag}</style>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30">
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Command Center</h1>
            <p className="text-sm text-slate-400 font-medium">System Status: <span className="text-emerald-400">Online</span></p>
          </div>
        </div>
        <Button variant="secondary" onClick={onLogout} className="bg-slate-900 border border-slate-700 hover:bg-slate-800"><LogOut className="w-4 h-4 mr-2" /> End Session</Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10">
        {stats.map((s, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 items-start">
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <Users className="w-5 h-5 text-indigo-400" /> {isEditing ? 'Modify Access' : 'Grant Access'}
              </h2>
              <form onSubmit={handleSubmitUser} className="space-y-5">
                <div className="space-y-4">
                  <Input className="bg-slate-950 border-slate-800" label="Bot ID (WhatsApp)" value={formData.nomor} onChange={e => setFormData({...formData, nomor: e.target.value})} placeholder="628..." required />
                  <Input className="bg-slate-950 border-slate-800" label="Access Token" value={formData.pw} onChange={e => setFormData({...formData, pw: e.target.value})} placeholder="Secret..." required />
                  <Input className="bg-slate-950 border-slate-800" label="License Key" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} placeholder="Auto-generated" />
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full h-12 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 border-0">
                    {isEditing ? 'Update Credentials' : 'Create User'}
                  </Button>
                  {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData({id:'',nomor:'',pw:'',key:''}); }} className="w-full mt-3 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>}
                </div>
              </form>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
               <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-white uppercase tracking-wider">
                 <Shield className="w-4 h-4 text-emerald-400" /> Owner Security
               </h2>
               <div className="space-y-3">
                 <Input className="bg-slate-950 border-slate-800" placeholder="New Owner Password..." value={ownerPw} onChange={(e) => setOwnerPw(e.target.value)} />
                 <Button onClick={handleUpdateOwnerPw} isLoading={updatingOwner} disabled={!ownerPw} className="w-full bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700">
                    <Save className="w-4 h-4 mr-2" /> Update Password
                 </Button>
               </div>
            </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-xl font-bold text-white">Active Users Database</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-slate-800 bg-slate-950/50 relative">
            <table className="w-full text-left text-sm relative">
              <thead className="bg-slate-900 text-slate-300 uppercase text-xs tracking-wider sticky top-0 z-10 shadow-sm">
                <tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Credentials</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Control</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-white">{u.nomor}</td>
                    <td className="px-6 py-4 font-mono text-emerald-400 font-bold">{u.pw}</td>
                    <td className="px-6 py-4">
                      {u.key ? <span className="text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Licensed</span> : <span className="text-slate-500 text-xs bg-slate-800 px-2 py-1 rounded">Unlicensed</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setIsEditing(true); setFormData({id:u.id, nomor:u.nomor||'', pw:u.pw, key:u.key||''}); }} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                   <tr><td colSpan={4} className="p-8 text-center text-slate-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. USER DASHBOARD ---
const UserDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [profile, setProfile] = useState<Profile>(user);
  const [form, setForm] = useState({ nomor: user.nomor || '', pw: user.pw, key: user.key || '' });
  const [aiConfig, setAiConfig] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleSave = async () => { alert('Saved (Simulasi)'); };
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans relative overflow-hidden">
      <style>{styleTag}</style>

      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-800 pb-6 relative z-10">
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative shrink-0">
             <Bot className="w-10 h-10 text-cyan-400 relative z-10" />
           </div>
           <div>
             <h1 className="text-xl font-bold text-white flex items-center gap-2">
                User Area <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/30 text-cyan-400 border border-cyan-500/20">v2.1</span>
             </h1>
             <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                System Operational
             </p>
           </div>
        </div>
        <Button onClick={onLogout} className="w-full md:w-auto bg-slate-900 border border-slate-700 hover:bg-red-900/20 hover:border-red-500/50 hover:text-red-400 transition-all text-sm h-10">
            <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </header>

      <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto relative z-10">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
           <div className="flex items-center gap-3 mb-8">
             <div className="p-2.5 bg-cyan-900/20 rounded-xl text-cyan-400 border border-cyan-500/20"><Settings className="w-5 h-5" /></div>
             <h2 className="text-lg font-bold text-white">Bot Access</h2>
           </div>

           <div className="space-y-6">
             <div className="group">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Target Number</label>
                <div className="relative">
                    <Globe className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-cyan-500 transition-all outline-none" value={form.nomor} onChange={e => setForm({...form, nomor: e.target.value})} placeholder="628xxx" />
                </div>
             </div>

             <div className="group">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Access Password</label>
                <div className="relative">
                    <Key className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                    <input type="password" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-cyan-500 transition-all outline-none" value={form.pw} onChange={e => setForm({...form, pw: e.target.value})} />
                </div>
             </div>

             <div className="group">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block pl-1 flex justify-between">
                    License Key 
                    <span className="text-[10px] normal-case text-cyan-400/80 bg-cyan-900/20 px-2 rounded-full border border-cyan-500/20">Auto-Generate Available</span>
                </label>
                <div className="flex gap-3">
                   <div className="relative flex-1">
                      <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm font-mono text-cyan-300 focus:border-cyan-500 outline-none transition-all" value={form.key} readOnly placeholder="NO_KEY_DETECTED" />
                   </div>
                   <button onClick={handleGenKey} disabled={aiLoading} className="shrink-0 w-12 h-[46px] flex items-center justify-center rounded-xl bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-600 hover:text-white transition-all active:scale-95" title="Generate New Key">
                      <Sparkles className={`w-5 h-5 ${aiLoading ? 'animate-spin' : ''}`} />
                   </button>
                </div>
             </div>

             <Button onClick={handleSave} className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-lg border-0 h-12 text-sm font-bold tracking-wide">
                SAVE CHANGES
             </Button>
           </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col h-full">
           <div className="flex items-center gap-3 mb-6">
             <div className="p-2.5 bg-purple-900/20 rounded-xl text-purple-400 border border-purple-500/20"><Terminal className="w-5 h-5" /></div>
             <h2 className="text-lg font-bold text-white">Config Generator</h2>
           </div>
           
           <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-hidden relative shadow-inner group">
             <div className="absolute top-3 right-3 flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
             </div>
             
             <div className="h-[250px] overflow-y-auto custom-scrollbar pt-4">
                 {aiLoading ? (
                   <div className="h-full flex flex-col items-center justify-center text-purple-400/50 gap-3">
                     <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                     <p className="animate-pulse font-sans text-xs">Processing AI Request...</p>
                   </div>
                 ) : (
                   <pre className="text-purple-300 leading-relaxed whitespace-pre-wrap">{aiConfig || '// Click "Generate Config" below\n// to create a new setting file.'}</pre>
                 )}
             </div>
           </div>

           <Button onClick={handleGenConfig} className="w-full mt-6 bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white h-12 text-sm">
             <Server className="w-4 h-4 mr-2" /> Generate JSON Config
           </Button>
        </div>
      </div>
    </div>
  );
};

// --- 3. MAIN APP (LOGIN) ---
const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  const [loginMode, setLoginMode] = useState<'user' | 'owner'>('user');
  
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem('fuxxy_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) setView('dashboard');
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await new Promise(r => setTimeout(r, 1000));
      let userFound: Profile | null = null;
      
      // AMBIL PASSWORD OWNER DARI STORAGE (Kalau ga ada, default admin123)
      const currentOwnerPw = localStorage.getItem('fuxxy_owner_pw') || 'admin123';

      if (!isSupabaseConfigured()) {
        // --- LOGIKA LOGIN DEMO ---
        if (loginMode === 'owner' && password === currentOwnerPw) {
            userFound = { id: 'o1', role: UserRole.OWNER, nomor: null, pw: currentOwnerPw, key: null };
        } 
        else if (loginMode === 'user') {
            // Cek di daftar user dummy
            const dummyUsers = JSON.parse(localStorage.getItem('fuxxy_dummy_users') || '[]');
            const found = dummyUsers.find((u: any) => u.nomor === loginId && u.pw === password);
            
            // Backdoor untuk test user
            if (found) userFound = found;
            else if (loginId === '628xxx' && password === '123456') userFound = { id: 'u1', role: UserRole.USER, nomor: loginId, pw: password, key: 'test_key' };
            else throw new Error("Invalid ID or Password");
        }
        else {
             throw new Error("Invalid ID or Password");
        }
      } else {
        // --- LOGIKA LOGIN REAL ---
        let q = supabase.from('profiles').select('*');
        if (loginMode === 'owner') q = q.eq('role', 'owner').eq('pw', password);
        else q = q.eq('nomor', loginId).eq('pw', password);
        const { data, error } = await q.maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Credentials Invalid.");
        userFound = data as Profile;
      }
      
      localStorage.setItem('fuxxy_user', JSON.stringify(userFound));
      setCurrentUser(userFound);
      setView('dashboard');

    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { 
    localStorage.removeItem('fuxxy_user');
    setCurrentUser(null); 
    setView('login'); 
    setLoginId(''); 
    setPassword(''); 
  };

  if (view === 'dashboard' && currentUser) {
    return currentUser.role === UserRole.OWNER ? <OwnerDashboard user={currentUser} onLogout={handleLogout} /> : <UserDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      <style>{styleTag}</style>

      <div className="w-full max-w-[400px] bg-slate-900/50 backdrop-blur-xl rounded-[30px] border border-slate-800 shadow-2xl p-8 z-10 relative overflow-hidden animate-float">
        <div className="text-center mb-8">
          
          <div className="inline-flex relative group mb-4">
             <div className="relative p-4 bg-slate-950 rounded-full border border-slate-800 shadow-xl">
               <Bot className="w-8 h-8 text-white" />
             </div>
          </div>

          <h1 className="text-3xl font-bold text-white tracking-tight">Fuxxy<span className="text-cyan-400">MD</span></h1>
          <p className="text-slate-400 text-xs font-medium tracking-widest mt-1">SECURE ACCESS PORTAL</p>
        </div>

        <div className="bg-slate-950 p-1 rounded-xl flex mb-6 border border-slate-800">
          <button onClick={() => setLoginMode('user')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${loginMode === 'user' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>USER</button>
          <button onClick={() => setLoginMode('owner')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${loginMode === 'owner' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>OWNER</button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {loginMode === 'user' && (
             <div className="relative">
                 <Globe className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                 <input className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-slate-600 focus:border-cyan-500 transition-all outline-none" placeholder="Phone Number" value={loginId} onChange={e=>setLoginId(e.target.value)} required />
             </div>
          )}
          <div className="relative">
               <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
               <input type="password" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-slate-600 focus:border-purple-500 transition-all outline-none" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs text-center">{error}</div>}

          <button disabled={loading} className="w-full py-3.5 mt-2 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-purple-600 hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20">
            {loading ? 'AUTHENTICATING...' : 'CONNECT SECURELY'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;