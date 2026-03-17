// ============= controllers/footerController.js =============
const { FooterSettings } = require('../models');

const footerController = {
    // ============= صفحه مدیریت فوتر =============
    index: async (req, res) => {
        try {
            // دریافت تنظیمات فعلی
            let settings = await FooterSettings.findOne();

            // اگر تنظیمی وجود نداشت، یک نمونه پیش‌فرض ایجاد کن
            if (!settings) {
                settings = await FooterSettings.create({
                    email: 'info@phoenixtrade.info',
                    phones: JSON.stringify([{ number: '۰۲۱-۱۲۳۴۵۶۷۸', icon: 'fa-phone' }]),
                    social: JSON.stringify({
                        telegram: 'https://t.me/PhoenixTradeBot',
                        instagram: '#',
                        whatsapp: '#',
                        twitter: '#'
                    }),
                    awards: JSON.stringify([
                        { title: 'FCA Regulated', emoji: '🏆', image: '' },
                        { title: 'CySEC Regulated', emoji: '🏅', image: '' },
                        { title: 'Best Broker 2024', emoji: '⭐', image: '' },
                        { title: 'International Forex Award', emoji: '🌍', image: '' }
                    ]),
                    copyright_fa: '© ۲۰۲۶ تمامی حقوق برای ققنوس محفوظ است',
                    copyright_en: '© 2026 All rights reserved for Phoenix',
                    copyright_ar: '© ٢٠٢٦ جميع الحقوق محفوظة للعنقاء'
                });
            }

            // تبدیل JSONها به آبجکت برای نمایش در فرم
            const footerData = {
                id: settings.id,
                email: settings.email,
                phones: JSON.parse(settings.phones || '[]'),
                social: JSON.parse(settings.social || '{}'),
                awards: JSON.parse(settings.awards || '[]'),
                copyright_fa: settings.copyright_fa,
                copyright_en: settings.copyright_en,
                copyright_ar: settings.copyright_ar
            };

            res.render('admin/footer', {
                title: 'مدیریت فوتر',
                user: req.session.adminUsername,
                activePage: 'footer',
                footer: footerData
            });

        } catch (error) {
            console.error('❌ Error in footer index:', error);
            res.status(500).render('error', {
                title: 'خطا',
                message: 'خطا در بارگذاری صفحه مدیریت فوتر',
                error: process.env.NODE_ENV === 'development' ? error : {},
                user: req.session.adminUsername
            });
        }
    },

    // ============= ذخیره تنظیمات فوتر =============
    save: async (req, res) => {
        try {
            const {
                email,
                phones,
                social_telegram,
                social_instagram,
                social_whatsapp,
                social_twitter,
                awards,
                award_titles,
                award_emojis,
                award_images,
                copyright_fa,
                copyright_en,
                copyright_ar
            } = req.body;

            // دریافت تنظیمات فعلی
            let settings = await FooterSettings.findOne();

            if (!settings) {
                settings = await FooterSettings.create();
            }

            // پردازش شماره‌های تماس
            let phonesArray = [];
            if (phones) {
                if (Array.isArray(phones)) {
                    phonesArray = phones.map((number, index) => ({
                        number,
                        icon: req.body[`phone_icon_${index}`] || 'fa-phone'
                    })).filter(p => p.number && p.number.trim() !== '');
                } else if (phones.trim() !== '') {
                    phonesArray = [{ number: phones, icon: req.body.phone_icon_0 || 'fa-phone' }];
                }
            }

            // پردازش آواردها (ساختار جدید: آرایه‌ای از آبجکت‌ها)
            let awardsArray = [];

            // روش اول: دریافت از فیلدهای جداگانه
            if (award_titles && Array.isArray(award_titles)) {
                for (let i = 0; i < award_titles.length; i++) {
                    if (award_titles[i] && award_titles[i].trim() !== '') {
                        awardsArray.push({
                            title: award_titles[i].trim(),
                            emoji: (award_emojis && award_emojis[i]) ? award_emojis[i] : '🏆',
                            image: (award_images && award_images[i]) ? award_images[i] : ''
                        });
                    }
                }
            }

            // روش دوم: دریافت از فیلد awards (برای سازگاری با عقب)
            if (awardsArray.length === 0 && awards) {
                if (Array.isArray(awards)) {
                    awardsArray = awards.map((title, index) => ({
                        title,
                        emoji: (award_emojis && award_emojis[index]) ? award_emojis[index] : '🏆',
                        image: (award_images && award_images[index]) ? award_images[index] : ''
                    })).filter(a => a.title && a.title.trim() !== '');
                } else if (awards.trim() !== '') {
                    awardsArray = [{
                        title: awards,
                        emoji: (award_emojis && award_emojis[0]) ? award_emojis[0] : '🏆',
                        image: (award_images && award_images[0]) ? award_images[0] : ''
                    }];
                }
            }

            // به‌روزرسانی تنظیمات
            await settings.update({
                email: email || 'info@phoenixtrade.info',
                phones: JSON.stringify(phonesArray),
                social: JSON.stringify({
                    telegram: social_telegram || '',
                    instagram: social_instagram || '',
                    whatsapp: social_whatsapp || '',
                    twitter: social_twitter || ''
                }),
                awards: JSON.stringify(awardsArray),
                copyright_fa: copyright_fa || '© ۲۰۲۶ تمامی حقوق برای ققنوس محفوظ است',
                copyright_en: copyright_en || '© 2026 All rights reserved for Phoenix',
                copyright_ar: copyright_ar || '© ٢٠٢٦ جميع الحقوق محفوظة للعنقاء'
            });

            res.redirect('/pprofessor/footer?success=1');

        } catch (error) {
            console.error('❌ Error saving footer:', error);
            res.redirect('/pprofessor/footer?error=1');
        }
    },

    // ============= آپلود تصویر آوارد =============
    uploadAwardImage: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'فایلی آپلود نشده' });
            }

            const imageUrl = '/uploads/awards/' + req.file.filename;
            res.json({ success: true, url: imageUrl });

        } catch (error) {
            console.error('❌ Error uploading award image:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // ============= دریافت تنظیمات فوتر برای استفاده در ویوها =============
    getSettings: async () => {
        try {
            const settings = await FooterSettings.findOne();

            if (!settings) {
                return {
                    email: 'info@phoenixtrade.info',
                    phones: [{ number: '۰۲۱-۱۲۳۴۵۶۷۸', icon: 'fa-phone' }],
                    social: {
                        telegram: 'https://t.me/PhoenixTradeBot',
                        instagram: '#',
                        whatsapp: '#',
                        twitter: '#'
                    },
                    awards: [
                        { title: 'FCA Regulated', emoji: '🏆', image: '' },
                        { title: 'CySEC Regulated', emoji: '🏅', image: '' },
                        { title: 'Best Broker 2024', emoji: '⭐', image: '' },
                        { title: 'International Forex Award', emoji: '🌍', image: '' }
                    ],
                    copyright: {
                        fa: '© ۲۰۲۶ تمامی حقوق برای ققنوس محفوظ است',
                        en: '© 2026 All rights reserved for Phoenix',
                        ar: '© ٢٠٢٦ جميع الحقوق محفوظة للعنقاء'
                    }
                };
            }

            return {
                email: settings.email,
                phones: JSON.parse(settings.phones || '[]'),
                social: JSON.parse(settings.social || '{}'),
                awards: JSON.parse(settings.awards || '[]'),
                copyright: {
                    fa: settings.copyright_fa,
                    en: settings.copyright_en,
                    ar: settings.copyright_ar
                }
            };

        } catch (error) {
            console.error('❌ Error getting footer settings:', error);
            return {
                email: 'info@phoenixtrade.info',
                phones: [{ number: '۰۲۱-۱۲۳۴۵۶۷۸', icon: 'fa-phone' }],
                social: {},
                awards: [],
                copyright: {
                    fa: '© ۲۰۲۶ تمامی حقوق برای ققنوس محفوظ است',
                    en: '© 2026 All rights reserved for Phoenix',
                    ar: '© ٢٠٢٦ جميع الحقوق محفوظة للعنقاء'
                }
            };
        }
    }
};

module.exports = footerController;