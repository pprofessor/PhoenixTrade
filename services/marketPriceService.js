// ============= services/marketPriceService.js =============
// سرویس دریافت قیمت‌های لحظه‌ای از FCS API

const axios = require('axios');

// ============= تنظیمات =============
const API_KEY = "Je9DHWVdGHvC4dOWFBHvUhIo";
const BASE_URL = 'https://fcsapi.com/api-v3';

// نمادهای مورد نیاز
const SYMBOLS = [
    { symbol: 'XAU/USD', display: 'XAUUSD' },  // طلا
    { symbol: 'XAG/USD', display: 'XAGUSD' },  // نقره
    { symbol: 'WTI/USD', display: 'WTI' },     // نفت
    { symbol: 'NGAS/USD', display: 'NG' },     // گاز طبیعی
    { symbol: 'CORN/USD', display: 'CORN' },   // ذرت
    { symbol: 'BTC/USD', display: 'BTCUSD' }   // بیت‌کوین
];

// حافظه کش
let priceCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 60 ثانیه

// ============= دریافت قیمت‌ها از FCS API =============
async function fetchPrices() {
    try {
        const now = Date.now();

        // استفاده از کش
        if (now - lastFetchTime < CACHE_DURATION && Object.keys(priceCache).length > 0) {
            console.log('📦 Using cached prices (age: ' + Math.round((now - lastFetchTime) / 1000) + 's)');
            return priceCache;
        }

        console.log('🌐 Fetching live prices from FCS API...');

        const result = {};

        // دریافت قیمت برای هر نماد
        for (const item of SYMBOLS) {
            try {
                // تعیین نوع نماد
                let endpoint = 'forex';
                if (item.symbol.includes('BTC')) endpoint = 'crypto';
                else if (['WTI', 'NGAS', 'CORN'].some(s => item.symbol.includes(s))) endpoint = 'commodity';

                const response = await axios.get(`${BASE_URL}/${endpoint}/latest`, {
                    params: {
                        symbol: item.symbol,
                        access_key: API_KEY
                    },
                    timeout: 5000
                });

                if (response.data && response.data.response && response.data.response[0]) {
                    const data = response.data.response[0];

                    // قیمت
                    let price = data.c;
                    // تغییر درصدی
                    let change = data.cp || '0';
                    change = change.toString().replace('%', '');

                    // تنظیم تعداد اعشار
                    const decimals = item.display === 'BTCUSD' ? 0 : 2;
                    price = parseFloat(price).toFixed(decimals);

                    // فرمت اعداد فارسی
                    const formattedPrice = new Intl.NumberFormat('fa-IR', {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals
                    }).format(price);

                    result[item.display] = {
                        price: formattedPrice,
                        change: change,
                        changePercent: change
                    };

                    console.log(`✅ ${item.display}: ${formattedPrice} (${change}%)`);
                } else {
                    console.log(`⚠️ No data for ${item.display}, using default`);
                    result[item.display] = getDefaultPrice(item.display);
                }
            } catch (err) {
                console.log(`❌ Error fetching ${item.display}:`, err.message);
                result[item.display] = getDefaultPrice(item.display);
            }

            // کمی صبر بین درخواست‌ها
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // ذخیره در کش
        priceCache = result;
        lastFetchTime = now;

        return result;

    } catch (error) {
        console.error('❌ FCS API error:', error.message);

        // برگشت مقادیر پیش‌فرض در صورت خطا
        return getDefaultPrices();
    }
}

// ============= مقادیر پیش‌فرض =============
function getDefaultPrices() {
    return {
        'XAUUSD': { price: '۲٬۳۴۵٫۵۰', change: '۰.۸', changePercent: '۰.۸' },
        'XAGUSD': { price: '۳۰٫۲۵', change: '۱.۲', changePercent: '۱.۲' },
        'WTI': { price: '۷۸٫۳۲', change: '-۰.۳', changePercent: '-۰.۳' },
        'NG': { price: '۲٫۱۵', change: '۲.۵', changePercent: '۲.۵' },
        'CORN': { price: '۴۴۵٫۷۵', change: '-۰.۵', changePercent: '-۰.۵' },
        'BTCUSD': { price: '۵۶٬۲۳۰', change: '۲.۱', changePercent: '۲.۱' }
    };
}

function getDefaultPrice(symbol) {
    const defaults = getDefaultPrices();
    return defaults[symbol] || { price: '۰', change: '۰', changePercent: '۰' };
}

// ============= تابع عمومی =============
async function getMarketPrices() {
    return await fetchPrices();
}

module.exports = { getMarketPrices };