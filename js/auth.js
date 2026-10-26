// ثبت‌نام و ورود کاربر.
// نکته امنیتی: این نسخه کاربران را در مرورگر ذخیره می‌کند (نمایشی).
// برای محیط واقعی، Supabase یا Firebase Auth را جایگزین کنید.
const Auth = (() => {
  const USERS_KEY = "tm_users";
  const SESSION_KEY = "tm_session";

  const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));

  async function hash(text) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function register(email, password) {
    const users = getUsers();
    const key = email.toLowerCase();
    if (users[key]) throw new Error("این ایمیل قبلاً ثبت شده است.");
    users[key] = { email: key, pass: await hash(password), plan: "free", msgsToday: 0, day: today() };
    saveUsers(users);
    setSession(key);
    return users[key];
  }

  async function login(email, password) {
    const users = getUsers();
    const key = email.toLowerCase();
    const u = users[key];
    if (!u || u.pass !== (await hash(password))) throw new Error("ایمیل یا رمز عبور اشتباه است.");
    setSession(key);
    return u;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function setSession(email) {
    localStorage.setItem(SESSION_KEY, email);
  }

  function current() {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;
    return getUsers()[email] || null;
  }

  function update(patch) {
    const users = getUsers();
    const u = current();
    if (!u) return null;
    users[u.email] = { ...u, ...patch };
    saveUsers(users);
    return users[u.email];
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  return { register, login, logout, current, update, today };
})();
