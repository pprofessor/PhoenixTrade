// ===== public/js/i18n.js =====
// متغیر سراسری برای ذخیره زبان فعلی
let currentLang = 'fa';

// تابع تغییر زبان
function changeLanguage(lang) {
    currentLang = lang;

    // تغییر عنوان صفحه
    const titleElement = document.querySelector('title');
    if (titleElement) {
        const newTitle = titleElement.getAttribute('data-' + lang);
        if (newTitle) {
            titleElement.textContent = newTitle;
        }
    }

    // تغییر متن المنت‌های دارای data-*
    document.querySelectorAll('[data-' + lang + ']').forEach(element => {
        const translation = element.getAttribute('data-' + lang);
        if (translation) {
            element.textContent = translation;
        }
    });

    // تغییر کلاس دکمه‌های زبان
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`.lang-btn[data-lang="${lang}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // ذخیره زبان در localStorage
    localStorage.setItem('preferredLanguage', lang);

    // رویداد سفارشی برای اطلاع سایر اسکریپت‌ها
    const event = new CustomEvent('languageChanged', { detail: { language: lang } });
    document.dispatchEvent(event);

    console.log('زبان به ' + lang + ' تغییر یافت');
}

// تابع مقداردهی اولیه زبان
function initLanguage() {
    // بررسی زبان ذخیره شده در localStorage
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && ['fa', 'en', 'ar'].includes(savedLang)) {
        changeLanguage(savedLang);
    } else {
        changeLanguage('fa');
    }
}

// اضافه کردن رویداد به دکمه‌های زبان
document.addEventListener('DOMContentLoaded', function () {
    // مقداردهی اولیه زبان
    initLanguage();

    // اضافه کردن رویداد کلیک به دکمه‌های زبان
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            changeLanguage(this.dataset.lang);
        });
    });
});

// برای سازگاری با مرورگرهای قدیمی‌تر
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { changeLanguage, initLanguage, currentLang };
}