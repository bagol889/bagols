export const generateBotKey = async (): Promise<string> => {
  await new Promise(r => setTimeout(r, 500));
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sk_live_';
  for (let i = 0; i < 32; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

export const generateBotConfig = async (botType: string): Promise<string> => {
  await new Promise(r => setTimeout(r, 600));
  return JSON.stringify({
    bot_name: botType || "MyBot",
    version: "1.0.0",
    settings: { auto_reply: true, max_retry: 3, timezone: "Asia/Jakarta" },
    owner: { name: "Admin", contact: "628xxx" }
  }, null, 2);
};
