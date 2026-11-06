/* Niyara — app.js: bilingual i18n, mobile menu, form validation + WhatsApp submit */
(function () {
  'use strict';

  /* ===== i18n dictionary ===== */
  var T = {
    fa: {
      skip: 'پرش به محتوای اصلی',
      brand: 'نیارا',
      navServices: 'خدمات', navGallery: 'گالری', navAbout: 'درباره من',
      navTesti: 'نظرات', navBook: 'رزرو نوبت', navContact: 'تماس',
      badge: '✦ مرکز تخصصی پاکسازی پوست و فیشال',
      heroTitle: 'پوستی که <em>لایق شماست</em>…',
      heroText: 'تجربه‌ای کاملاً خصوصی و VIP — فقط شما و من، در فضایی آرام و بهداشتی در خیابان پیروزی.',
      ctaBook: 'رزرو نوبت آنلاین', ctaServices: 'مشاهده خدمات',
      pt1: 'جلسات کاملاً خصوصی', pt2: 'محصولات متناسب با پوست شما', pt3: 'بهداشت و ایمنی کامل',
      servicesTitle: 'خدمات ما',
      servicesSub: 'هر خدمت در جلسه‌ای کاملاً خصوصی، متناسب با نوع پوست شما انجام می‌شود.',
      svc1Title: 'پاکسازی تخصصی پوست', svc1Text: 'پاکسازی عمیق منافذ، جرم‌گیری و آبرسانی برای پوستی شفاف و یکدست.',
      svc2Title: 'فیشال تخصصی', svc2Text: 'فیشال کامل با ماسک و ماساژ متناسب با نوع پوست شما.',
      svc3Title: 'هیدرودرم', svc3Text: 'آبرسانی عمیق با دستگاه، برای پوست‌های خشک و کم‌نور.',
      svc4Title: 'مشاوره پوست', svc4Text: 'تحلیل نوع پوست و طراحی روتین مراقبتی اختصاصی برای خانه.',
      priceNote: 'برای اطلاع از تعرفه‌ها، تماس بگیرید یا در واتساپ پیام دهید.',
      galleryTitle: 'گالری نتایج', gallerySub: 'نمونه‌ی نتایج واقعی — عکس‌های واقعی به‌زودی اینجا قرار می‌گیرند.',
      gal1: '📷 قبل / بعد — پاکسازی عمیق پوست', gal2: '📷 قبل / بعد — فیشال تخصصی',
      gal3: '📷 نمونه‌کار هیدرودرم', gal4: '🎬 ویدیو حین کار',
      aboutTitle: 'درباره من',
      aboutText1: 'سلام! من رویا هستم، متخصص پاکسازی پوست و فیشال. در نیارا، هر جلسه فقط مخصوص شماست — بدون شلوغی، بدون نوبت‌های روی‌هم‌چیده. اسم «نیارا» از همین ایده آمد: جایی که هر مراجعه‌کننده تنها تمرکز من است.',
      aboutText2: 'تمام وسایل استریل، محصولات متناسب با پوست شما، و قبل از هر کار یک گفت‌وگوی کامل درباره وضعیت پوستتان.',
      aboutImg: '🖼️ عکس واقعی از محیط نیارا',
      ab1: 'محیط کاملاً خصوصی و تک‌نفره', ab2: 'استریل‌سازی کامل بین هر جلسه', ab3: 'مشاوره صادقانه قبل از هر خدمت',
      testiTitle: 'نظرات مشتریان',
      t1: 'پوستم بعد از دو جلسه واقعاً فرق کرد. فضای خصوصی و آرامش‌بخش هم عالی بود.', t1who: '— سارا م.',
      t2: 'برای اولین بار بود فیشال می‌گرفتم و همه‌چیز با حوصله و طبق نوع پوستم پیش رفت.', t2who: '— نگین ک.',
      t3: 'بهداشت و تمیزی محیط برام خیلی مهمه و نیارا توی این زمینه بی‌نقصه.', t3who: '— مریم ر.',
      bookTitle: 'رزرو نوبت', bookSub: 'فرم زیر را پر کنید — به‌سرعت برای هماهنگی نهایی با شما تماس می‌گیرم.',
      lblName: 'نام و نام خانوادگی', lblPhone: 'شماره تماس', lblService: 'خدمت موردنظر',
      lblDate: 'تاریخ پیشنهادی', lblGender: 'جنسیت', gF: 'خانم', gM: 'آقا',
      lblNotes: 'توضیحات (اختیاری)', phNotes: 'مثلاً: پوستم حساس است و…',
      opt1: 'پاکسازی تخصصی پوست', opt2: 'فیشال تخصصی', opt3: 'هیدرودرم', opt4: 'مشاوره پوست',
      errName: 'لطفاً نامتان را وارد کنید.', errPhone: 'شماره تماس معتبر وارد کنید (مثلاً 0912…).',
      msgOk: '✅ درخواست شما ثبت شد — به‌زودی تماس می‌گیرم!',
      msgErr: 'لطفاً خطاهای فرم را برطرف کنید.',
      privacy: 'اطلاعات شما فقط برای هماهنگی نوبت استفاده می‌شود.',
      btnSend: 'ارسال درخواست رزرو', btnSending: 'در حال ارسال…',
      contactTitle: 'تماس با ما', addrLabel: 'آدرس', addr: 'تهران، خیابان پیروزی',
      phoneLabel: 'تلفن', hoursLabel: 'ساعات کاری', hours: 'شنبه تا پنجشنبه — ۱۰ صبح تا ۸ شب',
      wa: 'واتساپ', ig: 'اینستاگرام',
      footer: 'مرکز تخصصی پاکسازی پوست و فیشال',
      toastSent: 'درخواست رزرو آماده ارسال شد ✓',
      toastLang: 'زبان تغییر کرد'
    },
    en: {
      skip: 'Skip to main content',
      brand: 'Niyara',
      navServices: 'Services', navGallery: 'Gallery', navAbout: 'About',
      navTesti: 'Reviews', navBook: 'Book', navContact: 'Contact',
      badge: '✦ Specialized Deep Cleansing & Facial Center',
      heroTitle: 'Skin that <em>deserves you</em>…',
      heroText: 'A fully private VIP experience — just you and me, in a calm, hygienic space on Pirouzi St.',
      ctaBook: 'Book an Appointment', ctaServices: 'View Services',
      pt1: 'Fully private sessions', pt2: 'Products matched to your skin', pt3: 'Complete hygiene & safety',
      servicesTitle: 'Our Services',
      servicesSub: 'Every service is delivered in a fully private session, tailored to your skin type.',
      svc1Title: 'Deep Skin Cleansing', svc1Text: 'Deep pore cleansing, exfoliation and hydration for clear, even skin.',
      svc2Title: 'Specialized Facial', svc2Text: 'Full facial with mask and massage tailored to your skin type.',
      svc3Title: 'Hydroderm', svc3Text: 'Device-assisted deep hydration for dry, dull skin.',
      svc4Title: 'Skin Consultation', svc4Text: 'Skin type analysis and a personalized at-home routine.',
      priceNote: 'For pricing, please call or message on WhatsApp.',
      galleryTitle: 'Results Gallery', gallerySub: 'Real results — photos will be added soon.',
      gal1: '📷 Before / After — Deep Cleansing', gal2: '📷 Before / After — Specialized Facial',
      gal3: '📷 Hydroderm Sample', gal4: '🎬 Behind the Scenes',
      aboutTitle: 'About Me',
      aboutText1: "Hi! I'm Roya, a deep cleansing and facial specialist. At Niyara, every session is exclusively yours — no crowds, no back-to-back bookings. The name comes from exactly that: here, you are my only focus.",
      aboutText2: 'Fully sterilized tools, products matched to your skin, and a complete skin conversation before every service.',
      aboutImg: '🖼️ Real photo of the Niyara space',
      ab1: 'Fully private, single-client space', ab2: 'Complete sterilization between sessions', ab3: 'Honest consultation before every service',
      testiTitle: 'Client Reviews',
      t1: 'My skin really changed after two sessions. The private, calming space was wonderful too.', t1who: '— Sara M.',
      t2: 'It was my first facial ever and everything was done patiently, tailored to my skin.', t2who: '— Negin K.',
      t3: 'Hygiene matters a lot to me, and Niyara is flawless in that regard.', t3who: '— Maryam R.',
      bookTitle: 'Book an Appointment', bookSub: 'Fill in the form below — I will contact you shortly to confirm.',
      lblName: 'Full Name', lblPhone: 'Phone Number', lblService: 'Service',
      lblDate: 'Preferred Date', lblGender: 'Gender', gF: 'Female', gM: 'Male',
      lblNotes: 'Notes (optional)', phNotes: 'e.g.: My skin is sensitive and…',
      opt1: 'Deep Skin Cleansing', opt2: 'Specialized Facial', opt3: 'Hydroderm', opt4: 'Skin Consultation',
      errName: 'Please enter your name.', errPhone: 'Please enter a valid phone number (e.g. 0912…).',
      msgOk: '✅ Your request was submitted — I will call you soon!',
      msgErr: 'Please fix the form errors.',
      privacy: 'Your information is used only for appointment coordination.',
      btnSend: 'Send Booking Request', btnSending: 'Sending…',
      contactTitle: 'Contact Us', addrLabel: 'Address', addr: 'Pirouzi St, Tehran',
      phoneLabel: 'Phone', hoursLabel: 'Working Hours', hours: 'Sat–Thu — 10 AM to 8 PM',
      wa: 'WhatsApp', ig: 'Instagram',
      footer: 'Specialized Deep Cleansing & Facial Center',
      toastSent: 'Booking request ready ✓',
      toastLang: 'Language changed'
    }
  };

  var state = { lang: 'fa' };
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  /* ===== Language switch ===== */
  function applyLang(lang) {
    state.lang = lang;
    var dict = T[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.title = lang === 'fa'
      ? 'نیارا | مرکز تخصصی پاکسازی پوست و فیشال'
      : 'Niyara | Specialized Deep Cleansing & Facial Center';

    $$('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] != null) el.innerHTML = dict[key];
    });
    $$('[data-i18n-attr]').forEach(function (el) {
      var spec = el.getAttribute('data-i18n-attr').split(':');
      if (dict[spec[1]] != null) el.setAttribute(spec[0], dict[spec[1]]);
    });
    var ph = $('[data-i18n-ph]');
    if (ph && dict.phNotes) ph.placeholder = dict.phNotes;
    $('#langBtn').textContent = lang === 'fa' ? 'EN' : 'فا';
    try { localStorage.setItem('niyara-lang', lang); } catch (e) {}
    toast(dict.toastLang);
  }

  $('#langBtn').addEventListener('click', function () {
    applyLang(state.lang === 'fa' ? 'en' : 'fa');
  });

  /* ===== Mobile menu ===== */
  var burger = $('#burger'), menu = $('#menu');
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      menu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      menu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      burger.focus();
    }
  });

  /* ===== Form validation & WhatsApp submit ===== */
  var form = $('#bookForm');
  var btn = $('#submitBtn');
  var msgOk = $('#formOk'), msgErr = $('#formErr');

  function setError(input, errEl, show) {
    errEl.classList.toggle('show', show);
    input.setAttribute('aria-invalid', show ? 'true' : 'false');
  }

  function validate() {
    var name = $('#fName'), phone = $('#fPhone');
    var nameBad = name.value.trim().length < 2;
    var phoneBad = !/^(\+?98|0)?9\d{9}$/.test(phone.value.replace(/[\s-]/g, ''));
    setError(name, $('#eName'), nameBad);
    setError(phone, $('#ePhone'), phoneBad);
    if (nameBad) { name.focus(); return false; }
    if (phoneBad) { phone.focus(); return false; }
    return true;
  }

  ['#fName', '#fPhone'].forEach(function (sel) {
    $(sel).addEventListener('input', function () {
      setError($(sel), $('#eName' === sel ? 'eName' : 'ePhone') ? $(sel === '#fName' ? '#eName' : '#ePhone') : null, false);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msgOk.classList.remove('ok');
    msgErr.classList.remove('err');
    if (!validate()) { msgErr.classList.add('err'); msgErr.focus && msgErr.focus(); return; }

    btn.disabled = true;
    btn.textContent = state.lang === 'fa' ? 'در حال ارسال…' : 'Sending…';

    var d = T[state.lang];
    var serviceSel = $('#fService');
    var service = serviceSel.options[serviceSel.selectedIndex].text;
    var gender = form.querySelector('input[name="gender"]:checked').parentElement.textContent.trim();
    var date = $('#fDate').value || '—';
    var notes = $('#fNotes').value.trim() || '—';

    var lines = [
      '🌟 ' + d.brand + ' — ' + d.bookTitle,
      d.lblName + ': ' + $('#fName').value.trim(),
      d.lblPhone + ': ' + $('#fPhone').value.trim(),
      d.lblService + ': ' + service,
      d.lblDate + ': ' + date,
      d.lblGender + ': ' + gender,
      d.lblNotes + ': ' + notes
    ];
    var waUrl = 'https://wa.me/989120000000?text=' + encodeURIComponent(lines.join('\n'));

    /* Simulated local record — replace with a real endpoint when available */
    try { localStorage.setItem('niyara-last-booking', JSON.stringify({ at: new Date().toISOString(), name: $('#fName').value.trim() })); } catch (err) {}

    setTimeout(function () {
      btn.disabled = false;
      btn.textContent = d.btnSend;
      msgOk.classList.add('ok');
      toast(d.toastSent);
      form.reset();
      window.open(waUrl, '_blank', 'noopener');
    }, 600);
  });

  /* ===== Footer year (Intl-safe) ===== */
  $('#year').textContent = String(new Date().getFullYear());

  /* ===== Init language from storage ===== */
  var saved = null;
  try { saved = localStorage.getItem('niyara-lang'); } catch (e) {}
  if (saved === 'en') applyLang('en');
})();
