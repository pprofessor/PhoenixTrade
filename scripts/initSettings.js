// ============= scripts/initSettings.js =============
const { WebappSetting } = require('../models');

async function initSettings() {
    try {
        const settings = [
            // تنظیمات عمومی
            { key: 'site_title', value_fa: 'ققنوس', value_en: 'Phoenix', value_ar: 'العنقاء', category: 'general' },
            { key: 'site_description', value_fa: 'پلتفرم آموزش و معرفی بروکرها', value_en: 'Trading education and brokers platform', value_ar: 'منصة تعليم التداول ووسطاء', category: 'general' },

            // اطلاعات تماس
            { key: 'phone', value_fa: '۰۲۱-۱۲۳۴۵۶۷۸', category: 'contact' },
            { key: 'email', value_fa: 'info@phoenixtrade.info', category: 'contact' },
            { key: 'address', value_fa: 'تهران، ایران', value_en: 'Tehran, Iran', value_ar: 'طهران، ایران', category: 'contact' },

            // شبکه‌های اجتماعی
            { key: 'telegram', value_fa: 'https://t.me/PhoenixTradeBot', category: 'social' },
            { key: 'instagram', value_fa: 'https://instagram.com/phoenix_trade', category: 'social' },
            { key: 'twitter', value_fa: 'https://twitter.com/phoenix_trade', category: 'social' },

            // لوگو
            { key: 'logo_text', value_fa: 'ققنوس', value_en: 'Phoenix', value_ar: 'العنقاء', category: 'logo' }
        ];

        for (const setting of settings) {
            await WebappSetting.findOrCreate({
                where: { key: setting.key },
                defaults: setting
            });
        }

        console.log('✅ Settings initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing settings:', error);
    }
}

initSettings();