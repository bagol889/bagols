// KITA HAPUS IMPORT GOOGLE GENAI
// import { GoogleGenAI } from "@google/genai"; 

// Fungsi 1: Generate Key Acak (Lokal)
// Menghasilkan string acak 32 karakter (Huruf & Angka)
export const generateBotKey = async (): Promise<string> => {
  // Simulasi delay sedikit agar terasa seperti "proses" (opsional)
  await new Promise(resolve => setTimeout(resolve, 500));

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const length = 32;

  // Prefix agar terlihat rapi (Opsional, bisa dihapus)
  const prefix = 'sk_live_'; 
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return prefix + result;
};

// Fungsi 2: Generate Config Template (Lokal)
// Mengembalikan JSON Template statis yang rapi
export const generateBotConfig = async (botType: string): Promise<string> => {
  // Simulasi delay
  await new Promise(resolve => setTimeout(resolve, 600));

  // Template standar yang bersih
  const config = {
    bot_name: botType || "MyBot",
    version: "1.0.0",
    settings: {
      auto_reply: true,
      max_retry: 3,
      debug_mode: false,
      timezone: "Asia/Jakarta"
    },
    owner: {
      name: "Admin",
      contact: "628xxx"
    }
  };

  return JSON.stringify(config, null, 2); // Format JSON rapi (indent 2 spasi)
};
