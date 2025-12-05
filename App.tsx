
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { UserRole, Profile } from './types';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { generateBotKey, generateBotConfig } from './services/geminiService';
import { Shield, Users, Bot, LogOut, Terminal, Sparkles, AlertTriangle, Smartphone, Settings, Save, Database, Copy, Check, Trash2, Edit2, X, RefreshCw } from 'lucide-react';

// --- Tipe Props ---

interface DashboardProps {
  user: Profile;
  onLogout: () => void;
}

// ==========================================
// 0. DATABASE SETUP GUIDE
// ==========================================
const DatabaseSetupGuide: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const [copied, setCopied] = useState(false);
  const [customPw, setCustomPw] = useState('satrio0987');

  const sqlCode = `-- 1. Buka Supabase Dashboard > SQL Editor
-- 2. Paste kode ini dan klik RUN

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('owner', 'user')),
  nomor text,
  pw text NOT NULL,
  key text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Matikan RLS agar aplikasi demo ini bisa akses data tanpa auth ribet
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Buat Akun Owner Pertama
INSERT INTO public.profiles (role, pw)
VALUES ('owner', '${customPw}');
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex items-start gap-4">
          <div className="p-3 bg-red-900/30 rounded-lg">
            <Database className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Setup Database Diperlukan</h2>
            <p className="text-slate-400 text-sm mt-1">
              Tabel <code className="bg-slate-800 px-1 py-0.5 rounded text-red-300">profiles</code> belum ditemukan di Supabase.
            </p>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              Untuk memulai, silakan buat password awal untuk akun <strong>Owner</strong> di bawah ini, lalu jalankan SQL yang muncul.
            </p>

            {/* Input Dynamic Password Owner */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Set Password Awal Owner
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={customPw}
                  onChange={(e) => setCustomPw(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ketik password owner..."
                />
                <Button 
                  variant="ghost" 
                  onClick={() => setCustomPw('password' + Math.floor(Math.random() * 1000))}
                  title="Generate Random"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute right-2 top-2 z-10">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-white text-xs font-medium transition-colors shadow-lg"
                  title="Copy SQL"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Tersalin!' : 'Copy SQL'}
                </button>
              </div>
              <pre className="bg-slate-950 p-4 pt-10 rounded-lg border border-slate-800 text-xs sm:text-sm font-mono text-green-400 overflow-x-auto whitespace-pre-wrap relative">
                {sqlCode}
              </pre>
            </div>

            <div className="bg-blue-900/20 border border-blue-800/50 p-4 rounded-lg text-sm text-blue-200">
              <strong className="block mb-1 text-blue-100">Instruksi:</strong>
              1. Copy kode SQL di atas.<br/>
              2. Buka Dashboard Supabase project kamu.<br/>
              3. Masuk ke menu <strong>SQL Editor</strong>, paste kode, lalu klik <strong>Run</strong>.<br/>
              4. Kembali ke sini dan klik tombol "Coba Lagi" di bawah.
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-xl">
          <Button onClick={onRetry} className="w-full">
            Saya Sudah Menjalankan SQL, Coba Login Lagi
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 1. OWNER DASHBOARD
// ==========================================
const OwnerDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // State untuk Form User (Create & Edit)
  const [formData, setFormData] = useState({
    id: '',
    nomor: '',
    pw: '',
    key: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // State untuk Ganti Password Owner
  const [ownerPw, setOwnerPw] = useState('');
  const [updatingOwner, setUpdatingOwner] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Mengambil daftar user dari Supabase
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', UserRole.OWNER) 
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      if (!isSupabaseConfigured()) {
        // Simulasi data jika tidak ada Supabase key
        setUsers([
          { id: '1', role: UserRole.USER, nomor: '628xxx', pw: '123456', key: 'sk_test_123' },
          { id: '2', role: UserRole.USER, nomor: '628xxx', pw: 'password', key: null }
        ]);
      } else {
         console.error("Error fetching users:", err);
         setFetchError(err.message || "Gagal mengambil data user.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Form Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setFormData({ id: '', nomor: '', pw: '', key: '' });
    setIsEditing(false);
    setMessage(null);
  };

  // Fungsi Create / Update User
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomor || !formData.pw) return;
    setSubmitting(true);
    setMessage(null);

    try {
      if (isEditing && formData.id) {
        // UPDATE Existing User
        const { error } = await supabase
          .from('profiles')
          .update({
            nomor: formData.nomor,
            pw: formData.pw,
            key: formData.key || null
          })
          .eq('id', formData.id);

        if (error && isSupabaseConfigured()) throw error;
        setMessage({ type: 'success', text: `User ${formData.nomor} berhasil diupdate.` });

      } else {
        // CREATE New User
        const newProfile = {
          role: UserRole.USER,
          nomor: formData.nomor,
          pw: formData.pw,
          key: formData.key || null, // Allow manual key setup
          created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('profiles').insert([newProfile]);
        
        if (error && isSupabaseConfigured()) throw error;
        setMessage({ type: 'success', text: `User ${formData.nomor} berhasil dibuat.` });
      }

      resetForm();
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || JSON.stringify(err);
      setMessage({ type: 'error', text: 'Operasi gagal: ' + errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  // Fungsi Hapus User
  const handleDeleteUser = async (id: string, nomor: string) => {
    if (!window.confirm(`Yakin ingin menghapus user ${nomor}?`)) return;
    
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error && isSupabaseConfigured()) throw error;
      
      // Jika simulasi, filter manual
      if (!isSupabaseConfigured()) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        fetchUsers();
      }
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  // Fungsi Edit (Populate Form)
  const handleEditClick = (u: Profile) => {
    setFormData({
      id: u.id,
      nomor: u.nomor || '',
      pw: u.pw,
      key: u.key || ''
    });
    setIsEditing(true);
    setMessage(null);
  };

  // Fungsi Update Password Owner
  const handleUpdateOwnerPw = async () => {
    if (!ownerPw) return;
    setUpdatingOwner(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pw: ownerPw })
        .eq('id', user.id); 

      if (error && isSupabaseConfigured()) throw error;
      
      alert('Password Owner berhasil diubah!');
      setOwnerPw('');
    } catch (err: any) {
      alert('Gagal update password: ' + (err.message || 'Error'));
    } finally {
      setUpdatingOwner(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Owner Dashboard</h1>
            <p className="text-sm text-slate-400">Panel Kontrol Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-sm text-slate-400">Mode Owner</span>
          <Button variant="secondary" onClick={onLogout} size="sm">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Forms */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Form Manage User */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 relative">
            {isEditing && (
              <button 
                onClick={resetForm}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                title="Batal Edit"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              {isEditing ? 'Edit Data User' : 'Buat User Baru'}
            </h2>
            <form onSubmit={handleSubmitUser} className="space-y-4">
              <Input 
                label="Nomor Bot (Login ID)" 
                name="nomor"
                type="text" 
                placeholder="Contoh: 62812..." 
                value={formData.nomor}
                onChange={handleInputChange}
                required
              />
              <Input 
                label="Password User" 
                name="pw"
                type="text" 
                placeholder="Password..." 
                value={formData.pw}
                onChange={handleInputChange}
                required
              />
              <Input 
                label="Manual API Key (Opsional)" 
                name="key"
                type="text" 
                placeholder="Kosongkan jika ingin user generate sendiri" 
                value={formData.key}
                onChange={handleInputChange}
              />

              {message && (
                <div className={`p-3 rounded-md text-sm break-words ${message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                  {message.text}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button type="submit" className="w-full" isLoading={submitting}>
                  {isEditing ? 'Simpan Perubahan' : 'Tambah User'}
                </Button>
                {isEditing && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Form Ganti Password Owner */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              Admin Settings
            </h2>
            <div className="space-y-4">
              <Input 
                label="Ganti Password Owner" 
                type="text" 
                placeholder="Password Baru..." 
                value={ownerPw}
                onChange={(e) => setOwnerPw(e.target.value)}
              />
              <Button 
                variant="secondary" 
                onClick={handleUpdateOwnerPw} 
                isLoading={updatingOwner}
                className="w-full"
                disabled={!ownerPw}
              >
                <Save className="w-4 h-4 mr-2" /> Simpan Password Baru
              </Button>
            </div>
          </div>

        </div>

        {/* Kolom Kanan: List User */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Daftar User Aktif</h2>
              <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded">Total: {users.length}</span>
            </div>
            
            <div className="overflow-x-auto flex-1 relative">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Memuat data...</div>
              ) : fetchError ? (
                <div className="p-8 text-center text-red-400 flex flex-col items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  <span>{fetchError}</span>
                  <Button size="sm" variant="ghost" onClick={() => fetchUsers()}>Coba Lagi</Button>
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Belum ada user.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/50 text-slate-400 uppercase font-medium">
                    <tr>
                      <th className="px-6 py-4">Nomor</th>
                      <th className="px-6 py-4">Password</th>
                      <th className="px-6 py-4">Key</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-700/50 transition-colors group">
                        <td className="px-6 py-4 font-medium text-white">{u.nomor}</td>
                        <td className="px-6 py-4 font-mono text-slate-400">{u.pw}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.key ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                            {u.key ? u.key.substring(0, 8) + '...' : 'Kosong'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEditClick(u)}
                              className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id, u.nomor || '')}
                              className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                              title="Hapus User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. USER DASHBOARD
// ==========================================
const UserDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [profile, setProfile] = useState<Profile>(user);
  
  // State Edit Data
  const [nomor, setNomor] = useState(user.nomor || '');
  const [pw, setPw] = useState(user.pw || '');
  const [key, setKey] = useState(user.key || '');
  
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiConfig, setAiConfig] = useState('');

  // Sync state if user prop changes
  useEffect(() => {
    setProfile(user);
    setNomor(user.nomor || '');
    setPw(user.pw || '');
    setKey(user.key || '');
  }, [user]);

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          nomor: nomor,
          pw: pw,
          key: key
        })
        .eq('id', user.id);

      if (error && isSupabaseConfigured()) throw error;
      
      const updatedProfile = { ...profile, nomor, pw, key };
      setProfile(updatedProfile);
      alert('Data berhasil disimpan! Jika Anda mengubah Nomor atau Password, ingatlah saat login berikutnya.');
    } catch (err: any) {
      console.error(err);
      const msg = err.message || JSON.stringify(err);
      alert('Gagal menyimpan: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    setAiGenerating(true);
    try {
      const newKey = await generateBotKey();
      setKey(newKey); 
    } catch (err: any) {
      console.error(err);
      alert('Gagal generate key');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAskAI = async () => {
    setAiGenerating(true);
    const config = await generateBotConfig('Security Script FuxxyMD');
    setAiConfig(config);
    setAiGenerating(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Bot Control Panel</h1>
            <p className="text-sm text-slate-400">User: {profile.nomor || 'No Number'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={onLogout} size="sm">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        
        {/* Card Pengaturan Akun */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            Pengaturan Akun & Bot
          </h2>
          
          <div className="space-y-6">
            <Input 
              label="Nomor Bot (ID Login)"
              value={nomor} 
              onChange={(e) => setNomor(e.target.value)} 
              placeholder="628..." 
            />

            <Input 
              label="Password Login"
              type="text"
              value={pw} 
              onChange={(e) => setPw(e.target.value)} 
              placeholder="Password Anda" 
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">License Key / API Key</label>
              <div className="flex gap-2">
                 <input
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-green-400 font-mono text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Generate or paste key..."
                  />
                 <Button 
                  onClick={handleGenerateKey} 
                  variant="secondary" 
                  isLoading={aiGenerating}
                  title="Generate Random Key"
                 >
                   <Sparkles className="w-4 h-4 text-yellow-400" />
                 </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Key ini digunakan untuk validasi bot Anda.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-700">
               <Button onClick={handleSaveChanges} isLoading={loading} className="w-full">
                 Simpan Perubahan
               </Button>
            </div>
          </div>
        </div>

        {/* Card AI Assistant */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl flex flex-col">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Config Template Generator
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Buat template konfigurasi JSON dasar untuk bot Anda.
          </p>
          
          <div className="flex-1 bg-slate-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-auto border border-slate-800 mb-4 min-h-[200px]">
            {aiGenerating && !aiConfig ? (
              <span className="animate-pulse">Sedang memuat...</span>
            ) : (
              <pre>{aiConfig || '// Hasil config akan muncul di sini...'}</pre>
            )}
          </div>

          <Button onClick={handleAskAI} variant="ghost" className="border border-slate-600" isLoading={aiGenerating}>
            Generate Contoh Config
          </Button>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN APP (LOGIN & ROUTING)
// ==========================================

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  const [loginMode, setLoginMode] = useState<'user' | 'owner'>('user'); // Tab State
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  
  // Login Form States
  const [loginId, setLoginId] = useState(''); // Nomor (Hanya untuk User)
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowSetup(false);

    try {
      let userFound: Profile | null = null;

      // --- SIMULASI (Jika Supabase belum disetup) ---
      if (!isSupabaseConfigured()) {
        await new Promise(r => setTimeout(r, 600)); // Delay efek loading
        
        if (loginMode === 'owner') {
          // Owner Check: Hanya PW, default simulasi 'admin123'
          if (password === 'admin123') {
             userFound = {
               id: 'owner-1',
               role: UserRole.OWNER,
               nomor: null,
               pw: password,
               key: null
             };
          } else {
            throw new Error("Password Salah");
          }
        } else {
          // User Check: Nomor + PW
          if (loginId && password) {
            userFound = {
              id: 'user-1',
              role: UserRole.USER,
              nomor: loginId,
              pw: password,
              key: 'key_simulasi_123'
            };
          } else {
             throw new Error("Harap masukkan Nomor dan Password");
          }
        }
      } 
      // --- SUPABASE LIVE ---
      else {
        let query = supabase.from('profiles').select('*');
        
        if (loginMode === 'owner') {
          // Owner Login: Cek role='owner' DAN password cocok
          query = query.eq('role', 'owner').eq('pw', password);
        } else {
          // User Login: Cek nomor DAN password
          query = query.eq('nomor', loginId).eq('pw', password);
        }

        // maybeSingle() aman jika return null (tidak ketemu)
        const { data, error } = await query.maybeSingle();
        
        if (error) {
           throw error; // Lempar error agar ditangkap catch block
        }
        if (!data) {
           throw new Error(loginMode === 'owner' ? "Password Owner salah." : "Login gagal.");
        }
        
        userFound = data as Profile;
      }

      setCurrentUser(userFound);
      setView('dashboard');

    } catch (err: any) {
      // DETEKSI ERROR TABEL BELUM DIBUAT
      const errorMessage = err.message || JSON.stringify(err);
      if (errorMessage.includes('relation "profiles" does not exist') || err.code === '42P01') {
        setShowSetup(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    setLoginId('');
    setPassword('');
  };

  if (showSetup) {
    return <DatabaseSetupGuide onRetry={() => setShowSetup(false)} />;
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800 p-8 z-10">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Security FuxxyMD</h1>
            <p className="text-slate-400 text-sm">Silakan pilih tipe login Anda</p>
          </div>

          {/* Login Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-lg mb-6">
             <button 
               onClick={() => { setLoginMode('user'); setError(''); setPassword(''); }}
               className={`py-2 text-sm font-medium rounded-md transition-all ${loginMode === 'user' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
             >
               <span className="flex items-center justify-center gap-2">
                 <Smartphone className="w-4 h-4" /> User
               </span>
             </button>
             <button 
               onClick={() => { setLoginMode('owner'); setError(''); setPassword(''); }}
               className={`py-2 text-sm font-medium rounded-md transition-all ${loginMode === 'owner' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
             >
               <span className="flex items-center justify-center gap-2">
                 <Shield className="w-4 h-4" /> Owner
               </span>
             </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {!isSupabaseConfigured() && (
               <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg flex items-start gap-2">
                 <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                 <p className="text-xs text-yellow-200">
                   <strong>Mode Simulasi:</strong><br/>
                   User: Isi Bebas<br/>
                   Owner PW: "admin123"
                 </p>
               </div>
            )}

            <div className="space-y-4">
              {loginMode === 'user' && (
                <Input 
                  label="Nomor Bot"
                  type="text" 
                  placeholder="62812..."
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                />
              )}
              
              <Input 
                label={loginMode === 'owner' ? "Password Owner" : "Password"} 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded text-sm text-red-200 text-center break-words">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-indigo-500/25" isLoading={loading}>
              {loginMode === 'owner' ? 'Login Owner' : 'Login User'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // View setelah login
  if (currentUser?.role === UserRole.OWNER) {
    return <OwnerDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return <UserDashboard user={currentUser!} onLogout={handleLogout} />;
};

export default App;
