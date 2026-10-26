# TradeMind — دستیار هوشمند ترید

## امکانات
- نمودار زنده TradingView با اندیکاتورهای RSI، MACD و میانگین متحرک
- تحلیل لحظه‌ای بر اساس داده Binance (EMA20/50، RSI، MACD، حمایت و مقاومت)
- چت‌بات هوش مصنوعی (با کلید API) و پاسخ محلی بدون کلید
- ثبت‌نام و ورود کاربر، محدودیت پیام برای پلن رایگان
- صفحه اشتراک (نمونه)، پس‌زمینه سه‌بعدی با Three.js

## اجرای محلی
فقط یک سرور استاتیک کافی است، مثلاً:
```
npx serve trade-assistant
```

## دیپلوی روی GitHub Pages (فقط بخش استاتیک)
1. مخزن جدید در GitHub بسازید و این فایل‌ها را push کنید.
2. Settings → Pages → Source را روی `main` و پوشه `/ (root)` بگذارید.
3. آدرس سایت بعد از چند دقیقه فعال می‌شود.

> توجه: GitHub Pages فقط فایل استاتیک اجرا می‌کند، پس `api/chat.js` در آن کار نمی‌کند.
> برای چت هوش مصنوعی واقعی، پروژه را روی **Vercel** دیپلوی کنید (همین مخزن را وصل کنید)
> و متغیر `ANTHROPIC_API_KEY` را در Settings → Environment Variables بگذارید.

## راه‌اندازی ثبت‌نام واقعی (Supabase)
1. در https://supabase.com یک پروژه بسازید.
2. در **SQL Editor** محتوای `supabase/schema.sql` را اجرا کنید.
3. در **Project Settings → API** مقدار `Project URL` و `anon public` key را کپی کنید و در `js/config.js` بگذارید.
4. در **Authentication → Providers → Email** تنظیم کنید. برای تأیید ایمیل، گزینه Confirm email را روشن نگه دارید یا خاموش کنید.
5. **Authentication → URL Configuration** را روی آدرس سایت GitHub Pages (`https://amin-525.github.io/trade-assistant/`) بگذارید.

تغییر پلن به «حرفه‌ای» فقط باید از سرور انجام شود (مثلاً بعد از پرداخت موفق با service_role)، نه از مرورگر.

## قبل از عرضه عمومی (حتماً)
- ثبت‌نام را به Supabase یا Firebase Auth منتقل کنید (فعلاً در مرورگر ذخیره می‌شود).
- درگاه پرداخت واقعی (زرین‌پال، Stripe) را به‌جای `Billing.upgradeDemo` وصل کنید.
- اشتراک را سمت سرور بررسی کنید، نه فقط در مرورگر.
- سایت را به‌عنوان ابزار آموزشی معرفی کنید و هشدار ریسک را نمایش دهید.
