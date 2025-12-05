import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { UserRole, Profile } from './types';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { generateBotKey, generateBotConfig } from './services/geminiService';
import { Shield, Bot, LogOut, Terminal, Sparkles, Edit2, Trash2 } from 'lucide-react';

interface DashboardProps { user: Profile; onLogout: () => void; }

const OwnerDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: '', nomor: '', pw: '', key: '' });
  const [isEditing, setIsEditing] = useState(false);
  
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').neq('role', UserRole.OWNER).order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      if (!isSupabaseConfigured()) {
        setUsers([{ id: '1', role: UserRole.USER, nomor: '628xxx', pw: '123456', key: 'sk_test' }]);
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
    } catch (err) { alert('Gagal'); }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Hapus user?')) {
      await supabase.from('profiles').delete().eq('id', id);
      fetchUsers();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <header className="flex justify-between mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold flex gap-2"><Shield /> Owner Dashboard</h1>
        <Button variant="secondary" onClick={onLogout}><LogOut className="w-4 h-4 mr-2"/> Logout</Button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">{isEditing ? 'Edit User' : 'Tambah User'}</h2>
          <form onSubmit={handleSubmitUser} className="space-y-4">
            <Input label="Nomor" value={formData.nomor} onChange={e => setFormData({...formData, nomor: e.target.value})} required />
            <Input label="Password" value={formData.pw} onChange={e => setFormData({...formData, pw: e.target.value})} required />
            <Input label="Key (Opsional)" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} />
            <div className="flex gap-2">
              <Button type="submit" className="w-full">{isEditing ? 'Simpan' : 'Tambah'}</Button>
              {isEditing && <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); setFormData({id:'',nomor:'',pw:'',key:''}); }}>Batal</Button>}
            </div>
          </form>
        </div>
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Daftar User</h2>
          {loading ? <p>Loading...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-400 bg-slate-900/50"><tr><th className="p-3">Nomor</th><th className="p-3">Password</th><th className="p-3">Key</th><th className="p-3">Aksi</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t border-slate-700">
                      <td className="p-3">{u.nomor}</td>
                      <td className="p-3 font-mono">{u.pw}</td>
                      <td className="p-3 font-mono text-green-400">{u.key || '-'}</td>
                      <td className="p-3 flex gap-2">
                        <button onClick={() => { setIsEditing(true); setFormData({id:u.id, nomor:u.nomor||'', pw:u.pw, key:u.key||''}); }} className="text-blue-400"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-400"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState({ nomor: user.nomor||'', pw: user.pw, key: user.key||'' });
  const [aiConfig, setAiConfig] = useState('');

  const handleSave = async () => {
    await supabase.from('profiles').update(form).eq('id', user.id);
    setProfile({ ...profile, ...form });
    alert('Disimpan!');
  };

  const handleGenKey = async () => {
    const k = await generateBotKey();
    setForm({ ...form, key: k });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <header className="flex justify-between mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold flex gap-2"><Bot /> Bot Panel</h1>
        <Button variant="secondary" onClick={onLogout}><LogOut className="w-4 h-4 mr-2"/> Logout</Button>
      </header>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Pengaturan Akun</h2>
          <div className="space-y-4">
            <Input label="Nomor" value={form.nomor} onChange={e => setForm({...form, nomor: e.target.value})} />
            <Input label="Password" value={form.pw} onChange={e => setForm({...form, pw: e.target.value})} />
            <div>
              <label className="text-sm text-slate-300">API Key</label>
              <div className="flex gap-2 mt-1">
                <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 text-green-400" value={form.key} onChange={e => setForm({...form, key: e.target.value})} />
                <Button onClick={handleGenKey}><Sparkles className="w-4 h-4"/></Button>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full mt-4">Simpan</Button>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Config Generator</h2>
          <pre className="bg-slate-900 p-4 rounded text-xs text-green-400 h-40 overflow-auto mb-4">{aiConfig || '// Config...'}</pre>
          <Button onClick={async () => setAiConfig(await generateBotConfig('MyBot'))} variant="ghost" className="border border-slate-600">Generate Config</Button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<Profile | null>(null);
  const [mode, setMode] = useState<'user'|'owner'>('user');
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      if (!isSupabaseConfigured()) {
        await new Promise(r => setTimeout(r, 1000));
        if (mode === 'owner' && pw === 'admin123') setUser({ id:'o', role:UserRole.OWNER, nomor:null, pw, key:null });
        else if (mode === 'user' && id && pw) setUser({ id:'u', role:UserRole.USER, nomor:id, pw, key:'test' });
        else throw new Error("Password Salah / Data Kurang");
      } else {
        let q = supabase.from('profiles').select('*');
        if (mode === 'owner') q = q.eq('role', 'owner').eq('pw', pw);
        else q = q.eq('nomor', id).eq('pw', pw);
        
        const { data, error } = await q.maybeSingle();
        if (error) throw error;
        if (!data) throw new Error(mode === 'owner' ? "Password Owner salah." : "Login gagal.");
        setUser(data as Profile);
      }
    } catch (e: any) { setErr(e.message || "Login Error"); }
    finally { setLoading(false); }
  };

  if (user) return user.role === UserRole.OWNER ? <OwnerDashboard user={user} onLogout={() => setUser(null)} /> : <UserDashboard user={user} onLogout={() => setUser(null)} />;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-xl">
        <h1 className="text-2xl font-bold text-white text-center mb-6">Security FuxxyMD</h1>
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button onClick={() => setMode('user')} className={`p-2 rounded ${mode==='user'?'bg-indigo-600':'bg-slate-700'}`}>User</button>
          <button onClick={() => setMode('owner')} className={`p-2 rounded ${mode==='owner'?'bg-indigo-600':'bg-slate-700'}`}>Owner</button>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {mode === 'user' && <Input placeholder="Nomor Bot" value={id} onChange={e => setId(e.target.value)} />}
          <Input type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} />
          {err && <p className="text-red-400 text-sm text-center">{err}</p>}
          <Button type="submit" className="w-full" isLoading={loading}>Login</Button>
        </form>
      </div>
    </div>
  );
};
export default App;
