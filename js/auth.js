// ثبت‌نام و ورود واقعی با Supabase.
// اگر تنظیمات Supabase هنوز وارد نشده باشد، به حالت نمایشی محلی برمی‌گردد.
const Auth = (() => {
  const cfg = window.TM_CONFIG || {};
  const configured =
    !!window.supabase &&
    cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("YOUR-PROJECT") &&
    cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("YOUR-ANON-KEY");
  const client = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  let profile = null; // کش پروفایل برای دسترسی همگام در بقیه برنامه

  const today = () => new Date().toISOString().slice(0, 10);

  function fromRow(row, userId) {
    return {
      id: userId,
      email: row.email,
      plan: row.plan,
      msgsToday: row.msgs_today,
      day: row.day,
    };
  }

  async function loadProfile(userId) {
    const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();
    profile = !error && data ? fromRow(data, userId) : null;
  }

  function translate(msg = "") {
    if (/Invalid login credentials/i.test(msg)) return "ایمیل یا رمز عبور اشتباه است.";
    if (/already registered|already been registered/i.test(msg)) return "این ایمیل قبلاً ثبت شده است.";
    if (/Password should be at least/i.test(msg)) return "رمز عبور باید حداقل ۶ کاراکتر باشد.";
    if (/Email not confirmed/i.test(msg)) return "ابتدا ایمیل خود را تأیید کنید.";
    if (/rate limit|too many/i.test(msg)) return "تعداد تلاش‌ها زیاد است؛ کمی صبر کنید.";
    return "خطا: " + msg;
  }

  async function init() {
    if (!client) return;
    const { data: { session } } = await client.auth.getSession();
    if (session) await loadProfile(session.user.id);
    client.auth.onAuthStateChange(async (_event, s) => {
      if (s) await loadProfile(s.user.id);
      else profile = null;
      window.dispatchEvent(new Event("auth-changed"));
    });
    window.dispatchEvent(new Event("auth-changed"));
  }

  async function register(email, password) {
    if (!client) throw new Error("سرویس ثبت‌نام هنوز تنظیم نشده است.");
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw new Error(translate(error.message));
    // اگر تأیید ایمیل فعال باشد، session نداریم
    if (!data.session) return { needsConfirm: true };
    await loadProfile(data.user.id);
    return { needsConfirm: false };
  }

  async function login(email, password) {
    if (!client) throw new Error("سرویس ورود هنوز تنظیم نشده است.");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(translate(error.message));
    await loadProfile(data.user.id);
    return profile;
  }

  async function logout() {
    if (client) await client.auth.signOut();
    profile = null;
  }

  function current() {
    return profile;
  }

  // به‌روزرسانی شمارنده پیام (کش فوری + ذخیره در پایگاه داده)
  // پلن فقط از سمت سرور تغییر می‌کند و کاربر نمی‌تواند آن را عوض کند.
  function update(patch) {
    if (!profile) return null;
    const allowed = {};
    if ("msgsToday" in patch) allowed.msgsToday = patch.msgsToday;
    if ("day" in patch) allowed.day = patch.day;
    profile = { ...profile, ...allowed };
    if (client) {
      client.from("profiles")
        .update({ msgs_today: profile.msgsToday, day: profile.day })
        .eq("id", profile.id)
        .then(() => {});
    } else {
      // حالت نمایشی بدون سرور
      const users = JSON.parse(localStorage.getItem("tm_local_profile") || "{}");
      localStorage.setItem("tm_local_profile", JSON.stringify({ ...users, ...profile }));
    }
    return profile;
  }

  return { init, register, login, logout, current, update, today, isBackend: () => !!client };
})();
