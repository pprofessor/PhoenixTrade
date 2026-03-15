const { sequelize, Broker } = require('./models');

async function insertBrokers() {
    try {
        // ============= بروکر ۱: LiteFinance =============
        await Broker.create({
            name: 'LiteFinance',
            slug: 'litefinance',
            logo: '/uploads/brokers/litefinance.png',
            display_name_fa: 'لایت‌فاینانس',
            display_name_en: 'LiteFinance',
            display_name_ar: 'لايت فاينانس',
            description_fa: 'لایت‌فاینانس یک بروکر معتبر ECN است که از سال ۲۰۰۵ فعالیت می‌کند. این بروکر با ارائه پلتفرم‌های پیشرفته MT4 و MT5، اسپرد رقابتی و امکان کپی‌تریدینگ (SocialTrading)، گزینه‌ای عالی برای معامله‌گران مبتدی و حرفه‌ای است. لایت‌فاینانس دارای رگوله‌های معتبر بین‌المللی و پشتیبانی ۲۴ ساعته است.',
            description_en: 'LiteFinance is a reputable ECN broker operating since 2005. Offering advanced MT4 and MT5 platforms, competitive spreads, and SocialTrading features, it is an excellent choice for both beginner and professional traders. LiteFinance is regulated by international authorities and provides 24/7 support.',
            description_ar: 'لايت فاينانس هو وسيط ECN مرموق يعمل منذ عام ۲۰۰٥. من خلال تقديم منصات MT4 و MT5 المتقدمة، فروقات أسعار تنافسية، وميزات التداول الاجتماعي، فهو خيار ممتاز لكل من المتداولين المبتدئين والمحترفين. لايت فاينانس مرخص من قبل هيئات دولية ويوفر دعماً على مدار الساعة.',
            foundedYear: 2005,
            usersCount: '+۱٬۰۰۰٬۰۰۰',
            rating: 4.7,
            regulations: JSON.stringify(["FCA (UK)", "CySEC (EU)", "SVG"]),
            spread: 'از ۰.۰ پیپ',
            leverage: '۱:۵۰۰',
            minDeposit: '۵۰ دلار',
            registerLink: 'https://litefinance.com/',
            isActive: true,
            isFeatured: true,
            order: 1
        });
        console.log('✅ LiteFinance added');

        // ============= بروکر ۲: ForexChief (xChief) =============
        await Broker.create({
            name: 'ForexChief',
            slug: 'forexchief',
            logo: '/uploads/brokers/forexchief.png',
            display_name_fa: 'ایکس‌چیف',
            display_name_en: 'xChief',
            display_name_ar: 'إكس تشيف',
            description_fa: 'ایکس‌چیف (ForexChief) یک بروکر آنلاین معتبر با بیش از یک دهه تجربه است که خدمات معاملاتی پیشرفته‌ای را در اختیار مشتریان خود قرار می‌دهد. این بروکر با ارائه پلتفرم‌های MT4 و MT5، حساب‌های اسلامی، آنالیزهای اقتصادی و استراتژی‌های معاملاتی، محیطی امن و حرفه‌ای برای معامله‌گران فراهم کرده است.',
            description_en: 'ForexChief (xChief) is a trusted online broker with over a decade of experience, providing advanced trading services to its clients. Offering MT4 and MT5 platforms, Islamic accounts, economic analysis, and trading strategies, this broker provides a secure and professional environment for traders.',
            description_ar: 'إكس تشيف (ForexChief) هو وسيط موثوق على الإنترنت مع أكثر من عقد من الخبرة، يقدم خدمات تداول متقدمة لعملائه. من خلال تقديم منصتي MT4 و MT5، حسابات إسلامية، تحليلات اقتصادية، واستراتيجيات تداول، يوفر هذا الوسيط بيئة آمنة ومهنية للمتداولين.',
            foundedYear: 2014,
            usersCount: '+۵۰۰٬۰۰۰',
            rating: 4.5,
            regulations: JSON.stringify(["FSA", "SVG"]),
            spread: 'از ۰.۲ پیپ',
            leverage: '۱:۱۰۰۰',
            minDeposit: '۱۰ دلار',
            registerLink: 'https://cxchief.com/',
            isActive: true,
            isFeatured: true,
            order: 2
        });
        console.log('✅ ForexChief added');

        // ============= بروکر ۳: IC Markets =============
        await Broker.create({
            name: 'IC Markets',
            slug: 'icmarkets',
            logo: '/uploads/brokers/icmarkets.png',
            display_name_fa: 'آی‌سی مارکتس',
            display_name_en: 'IC Markets',
            display_name_ar: 'آي سي ماركتس',
            description_fa: 'آی‌سی مارکتس یکی از بزرگترین بروکرهای فارکس است که از سال ۲۰۰۷ فعالیت می‌کند. این بروکر استرالیایی با ارائه اسپردهای بسیار کم (از ۰.۰ پیپ) و اجرای سریع معاملات، گزینه‌ای محبوب برای معامله‌گران حرفه‌ای و اسکالپرها است. IC Markets دارای رگوله‌های ASIC و CySEC است.',
            description_en: 'IC Markets is one of the largest Forex brokers operating since 2007. This Australian broker, with ultra-tight spreads (from 0.0 pips) and fast execution, is a popular choice for professional traders and scalpers. IC Markets is regulated by ASIC and CySEC.',
            description_ar: 'آي سي ماركتس هي واحدة من أكبر وسطاء الفوركس التي تعمل منذ عام ۲۰۰۷. هذا الوسيط الأسترالي، مع فروقات أسعار فائقة الضيق (من ۰.۰ نقطة) وتنفيذ سريع، هو خيار شائع للمتداولين المحترفين والمضاربين. آي سي ماركتس مرخص من قبل ASIC و CySEC.',
            foundedYear: 2007,
            usersCount: '+۲۵۰٬۰۰۰',
            rating: 4.8,
            regulations: JSON.stringify(["ASIC (AU)", "CySEC (EU)"]),
            spread: 'از ۰.۰ پیپ',
            leverage: '۱:۵۰۰',
            minDeposit: '۲۰۰ دلار',
            registerLink: 'https://www.icmarkets.com/',
            isActive: true,
            isFeatured: false,
            order: 3
        });
        console.log('✅ IC Markets added');

        // ============= بروکر ۴: Pepperstone =============
        await Broker.create({
            name: 'Pepperstone',
            slug: 'pepperstone',
            logo: '/uploads/brokers/pepperstone.png',
            display_name_fa: 'پپراستون',
            display_name_en: 'Pepperstone',
            display_name_ar: 'بيبرستون',
            description_fa: 'پپراستون یک بروکر پیشرو استرالیایی است که از سال ۲۰۱۰ فعالیت خود را آغاز کرده است. این بروکر با ارائه پلتفرم‌های MT4، MT5 و cTrader، سرعت اجرای بالا و اسپرد رقابتی، به یکی از محبوب‌ترین بروکرها در سطح جهان تبدیل شده است. پپراستون دارای رگوله‌های FCA، ASIC و CySEC است.',
            description_en: 'Pepperstone is a leading Australian broker established in 2010. Offering MT4, MT5, and cTrader platforms, high execution speed, and competitive spreads, it has become one of the most popular brokers globally. Pepperstone is regulated by FCA, ASIC, and CySEC.',
            description_ar: 'بيبرستون هو وسيط أسترالي رائد تأسس في عام ۲۰۱۰. من خلال تقديم منصات MT4 و MT5 و cTrader، سرعة تنفيذ عالية، وفروقات أسعار تنافسية، أصبح واحداً من أكثر الوسطاء شعبية على مستوى العالم. بيبرستون مرخص من قبل FCA و ASIC و CySEC.',
            foundedYear: 2010,
            usersCount: '+۳۰۰٬۰۰۰',
            rating: 4.6,
            regulations: JSON.stringify(["FCA (UK)", "ASIC (AU)", "CySEC (EU)"]),
            spread: 'از ۰.۰ پیپ',
            leverage: '۱:۵۰۰',
            minDeposit: '۲۰۰ دلار',
            registerLink: 'https://pepperstone.com/',
            isActive: true,
            isFeatured: false,
            order: 4
        });
        console.log('✅ Pepperstone added');

        console.log('🎉 All brokers inserted successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error inserting brokers:', error);
        process.exit(1);
    }
}

insertBrokers();