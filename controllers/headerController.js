// ============= controllers/headerController.js =============
const { HeaderSettings, WebappMenu } = require('../models');

const headerController = {
    // ============= صفحه مدیریت هدر =============
    index: async (req, res) => {
        try {
            // دریافت تنظیمات فعلی
            let settings = await HeaderSettings.findOne();

            // اگر تنظیمی وجود نداشت، یک نمونه پیش‌فرض ایجاد کن
            if (!settings) {
                settings = await HeaderSettings.create({
                    logo_text_fa: 'ققنوس',
                    logo_text_en: 'Phoenix',
                    logo_text_ar: 'العنقاء',
                    logo_icon: '🦅',
                    logo_image: '',
                    telegram_link: 'https://t.me/PhoenixTradeBot',
                    telegram_text_fa: 'کانال تلگرام',
                    telegram_text_en: 'Telegram',
                    telegram_text_ar: 'تيليجرام',
                    menu_items: JSON.stringify([
                        { id: 1, title_fa: 'صفحه اصلی', title_en: 'Home', title_ar: 'الرئيسية', link: '/', order: 1, isActive: true },
                        { id: 2, title_fa: 'بروکرها', title_en: 'Brokers', title_ar: 'الوسطاء', link: '/brokers', order: 2, isActive: true },
                        { id: 3, title_fa: 'آموزش', title_en: 'Education', title_ar: 'التعليم', link: '/education', order: 3, isActive: true },
                        { id: 4, title_fa: 'بازارها', title_en: 'Markets', title_ar: 'الأسواق', link: '/markets', order: 4, isActive: true },
                        { id: 5, title_fa: 'ارتباط با ما', title_en: 'Contact', title_ar: 'اتصل بنا', link: '/contact', order: 5, isActive: true }
                    ]),
                    header_style: 'default',
                    sticky_header: true,
                    show_lang_selector: true,
                    background_color: 'rgba(10, 40, 25, 0.25)',
                    text_color: '#ffffff',
                    hover_color: '#ffd700'
                });
            }

            // تبدیل JSON منوها به آرایه
            const headerData = {
                id: settings.id,
                logo_text_fa: settings.logo_text_fa,
                logo_text_en: settings.logo_text_en,
                logo_text_ar: settings.logo_text_ar,
                logo_icon: settings.logo_icon,
                logo_image: settings.logo_image,
                telegram_link: settings.telegram_link,
                telegram_text_fa: settings.telegram_text_fa,
                telegram_text_en: settings.telegram_text_en,
                telegram_text_ar: settings.telegram_text_ar,
                menu_items: JSON.parse(settings.menu_items || '[]'),
                header_style: settings.header_style,
                sticky_header: settings.sticky_header,
                show_lang_selector: settings.show_lang_selector,
                background_color: settings.background_color,
                text_color: settings.text_color,
                hover_color: settings.hover_color
            };

            // دریافت منوهای وب‌اپ برای انتخاب
            const webappMenus = await WebappMenu.findAll({
                where: { isActive: true, location: 'header' },
                order: [['order', 'ASC']]
            });

            res.render('admin/header', {
                title: 'مدیریت هدر',
                user: req.session.adminUsername,
                activePage: 'header',
                header: headerData,
                webappMenus: webappMenus
            });

        } catch (error) {
            console.error('❌ Error in header index:', error);
            res.status(500).render('error', {
                title: 'خطا',
                message: 'خطا در بارگذاری صفحه مدیریت هدر',
                error: process.env.NODE_ENV === 'development' ? error : {},
                user: req.session.adminUsername
            });
        }
    },

    // ============= ذخیره تنظیمات هدر =============
    save: async (req, res) => {
        try {
            const {
                logo_text_fa,
                logo_text_en,
                logo_text_ar,
                logo_icon,
                logo_image,
                telegram_link,
                telegram_text_fa,
                telegram_text_en,
                telegram_text_ar,
                menu_items,
                header_style,
                sticky_header,
                show_lang_selector,
                background_color,
                text_color,
                hover_color
            } = req.body;

            // دریافت تنظیمات فعلی
            let settings = await HeaderSettings.findOne();

            if (!settings) {
                settings = await HeaderSettings.create();
            }

            // پردازش منوها
            let menuItemsArray = [];
            if (menu_items) {
                if (Array.isArray(menu_items)) {
                    menuItemsArray = menu_items.map((item, index) => ({
                        id: index + 1,
                        title_fa: req.body[`menu_title_fa_${index}`] || '',
                        title_en: req.body[`menu_title_en_${index}`] || '',
                        title_ar: req.body[`menu_title_ar_${index}`] || '',
                        link: req.body[`menu_link_${index}`] || '',
                        order: parseInt(req.body[`menu_order_${index}`]) || index + 1,
                        isActive: req.body[`menu_active_${index}`] === 'on'
                    })).filter(item => item.title_fa && item.link);
                }
            }

            // به‌روزرسانی تنظیمات
            await settings.update({
                logo_text_fa: logo_text_fa || 'ققنوس',
                logo_text_en: logo_text_en || 'Phoenix',
                logo_text_ar: logo_text_ar || 'العنقاء',
                logo_icon: logo_icon || '🦅',
                logo_image: logo_image || '',
                telegram_link: telegram_link || 'https://t.me/PhoenixTradeBot',
                telegram_text_fa: telegram_text_fa || 'کانال تلگرام',
                telegram_text_en: telegram_text_en || 'Telegram',
                telegram_text_ar: telegram_text_ar || 'تيليجرام',
                menu_items: JSON.stringify(menuItemsArray),
                header_style: header_style || 'default',
                sticky_header: sticky_header === 'on',
                show_lang_selector: show_lang_selector === 'on',
                background_color: background_color || 'rgba(10, 40, 25, 0.25)',
                text_color: text_color || '#ffffff',
                hover_color: hover_color || '#ffd700'
            });

            res.redirect('/pprofessor/header?success=1');

        } catch (error) {
            console.error('❌ Error saving header:', error);
            res.redirect('/pprofessor/header?error=1');
        }
    },

    // ============= آپلود تصویر لوگو =============
    uploadLogo: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'فایلی آپلود نشده' });
            }

            const imageUrl = '/uploads/logo/' + req.file.filename;
            res.json({ success: true, url: imageUrl });

        } catch (error) {
            console.error('❌ Error uploading logo:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // ============= دریافت تنظیمات هدر برای استفاده در ویوها =============
    getSettings: async () => {
        try {
            const settings = await HeaderSettings.findOne();

            if (!settings) {
                return {
                    logo_text: { fa: 'ققنوس', en: 'Phoenix', ar: 'العنقاء' },
                    logo_icon: '🦅',
                    logo_image: '',
                    telegram: {
                        link: 'https://t.me/PhoenixTradeBot',
                        text: { fa: 'کانال تلگرام', en: 'Telegram', ar: 'تيليجرام' }
                    },
                    menu_items: [
                        { id: 1, title_fa: 'صفحه اصلی', title_en: 'Home', title_ar: 'الرئيسية', link: '/', order: 1, isActive: true },
                        { id: 2, title_fa: 'بروکرها', title_en: 'Brokers', title_ar: 'الوسطاء', link: '/brokers', order: 2, isActive: true },
                        { id: 3, title_fa: 'آموزش', title_en: 'Education', title_ar: 'التعليم', link: '/education', order: 3, isActive: true },
                        { id: 4, title_fa: 'بازارها', title_en: 'Markets', title_ar: 'الأسواق', link: '/markets', order: 4, isActive: true },
                        { id: 5, title_fa: 'ارتباط با ما', title_en: 'Contact', title_ar: 'اتصل بنا', link: '/contact', order: 5, isActive: true }
                    ],
                    style: {
                        header_style: 'default',
                        sticky_header: true,
                        show_lang_selector: true,
                        background_color: 'rgba(10, 40, 25, 0.25)',
                        text_color: '#ffffff',
                        hover_color: '#ffd700'
                    }
                };
            }

            return {
                logo_text: {
                    fa: settings.logo_text_fa,
                    en: settings.logo_text_en,
                    ar: settings.logo_text_ar
                },
                logo_icon: settings.logo_icon,
                logo_image: settings.logo_image,
                telegram: {
                    link: settings.telegram_link,
                    text: {
                        fa: settings.telegram_text_fa,
                        en: settings.telegram_text_en,
                        ar: settings.telegram_text_ar
                    }
                },
                menu_items: JSON.parse(settings.menu_items || '[]'),
                style: {
                    header_style: settings.header_style,
                    sticky_header: settings.sticky_header,
                    show_lang_selector: settings.show_lang_selector,
                    background_color: settings.background_color,
                    text_color: settings.text_color,
                    hover_color: settings.hover_color
                }
            };

        } catch (error) {
            console.error('❌ Error getting header settings:', error);
            return null;
        }
    }
};

module.exports = headerController;