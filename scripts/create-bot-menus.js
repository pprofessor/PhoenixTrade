// ===== scripts/create-bot-menus.js =====
const { BotMenu, EducationalContent, Broker, sequelize } = require('../models');
const { Op } = require('sequelize');

async function createBotMenus() {
    try {
        console.log('🤖 شروع ایجاد منوهای ربات...');

        // ============= ۱. پاک کردن منوهای قبلی (اختیاری) =============
        console.log('📝 پاک کردن منوهای قبلی...');
        await BotMenu.destroy({ where: {} });
        console.log('✅ منوهای قبلی پاک شدند');

        // ============= ۲. ایجاد منوی اصلی =============
        console.log('📝 ایجاد منوی اصلی...');
        const mainMenu = await BotMenu.create({
            text: 'منوی اصلی',
            emoji: '🏠',
            content: 'به ربات خوش آمدید! لطفاً یکی از گزینه‌های زیر را انتخاب کنید:',
            order: 1,
            isActive: true
        });
        console.log('✅ منوی اصلی ایجاد شد (ID: ' + mainMenu.id + ')');

        // ============= ۳. ایجاد زیرمنوهای سطح اول =============
        console.log('📝 ایجاد زیرمنوهای سطح اول...');

        // منوی آموزش
        const educationMenu = await BotMenu.create({
            text: 'آموزش‌ها',
            emoji: '📚',
            parentId: mainMenu.id,
            content: '📚 **آموزش‌های فارکس**\n\nلطفاً دسته‌بندی مورد نظر خود را انتخاب کنید:',
            order: 1,
            isActive: true
        });
        console.log('   ✅ منوی آموزش ایجاد شد');

        // منوی بروکرها
        const brokersMenu = await BotMenu.create({
            text: 'بروکرها',
            emoji: '💹',
            parentId: mainMenu.id,
            content: '💹 **بروکرهای معتبر**\n\nاز گزینه‌های زیر انتخاب کنید:',
            order: 2,
            isActive: true
        });
        console.log('   ✅ منوی بروکرها ایجاد شد');

        // منوی درباره ما
        const aboutMenu = await BotMenu.create({
            text: 'درباره ما',
            emoji: 'ℹ️',
            parentId: mainMenu.id,
            content: 'ℹ️ **درباره ققنوس**\n\nشرکت ققنوس (PhoenixTrade) از سال ۲۰۱۷ در زمینه آموزش و ارائه خدمات تحلیلی بازارهای مالی فعالیت می‌کند.\n\nما با تیمی از تحلیلگران و معامله‌گران حرفه‌ای، مسیر موفقیت را برای هزاران معامله‌گر هموار کرده‌ایم.',
            order: 3,
            isActive: true
        });
        console.log('   ✅ منوی درباره ما ایجاد شد');

        // ============= ۴. ایجاد زیرمنوهای آموزش =============
        console.log('📝 ایجاد زیرمنوهای آموزش...');

        // دریافت دسته‌بندی‌های موجود از محتوای آموزشی
        const categories = await EducationalContent.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
            where: { isActive: true }
        });

        // ایجاد منو برای هر دسته‌بندی
        const categoryMenus = {};

        for (const cat of categories) {
            const category = cat.category;
            let categoryText = '';
            let categoryEmoji = '';

            switch (category) {
                case 'basic':
                    categoryText = 'مبتدی';
                    categoryEmoji = '🔰';
                    break;
                case 'strategy':
                    categoryText = 'استراتژی';
                    categoryEmoji = '🎯';
                    break;
                case 'technical':
                    categoryText = 'تحلیل تکنیکال';
                    categoryEmoji = '📊';
                    break;
                case 'fundamental':
                    categoryText = 'تحلیل بنیادی';
                    categoryEmoji = '📈';
                    break;
                default:
                    categoryText = category;
                    categoryEmoji = '📚';
            }

            const menu = await BotMenu.create({
                text: categoryText,
                emoji: categoryEmoji,
                parentId: educationMenu.id,
                content: `📚 **آموزش‌های ${categoryText}**\n\nلطفاً یکی از آموزش‌های زیر را انتخاب کنید:`,
                order: Object.keys(categoryMenus).length + 1,
                isActive: true
            });

            categoryMenus[category] = menu.id;
            console.log(`   ✅ منوی ${categoryText} ایجاد شد (ID: ${menu.id})`);
        }

        // اگر هیچ دسته‌بندی وجود نداشت، منوهای پیش‌فرض ایجاد کن
        if (Object.keys(categoryMenus).length === 0) {
            console.log('   ⚠️ هیچ دسته‌بندی آموزشی یافت نشد. ایجاد منوهای پیش‌فرض...');

            const defaultCategories = [
                { key: 'basic', text: 'مبتدی', emoji: '🔰' },
                { key: 'strategy', text: 'استراتژی', emoji: '🎯' },
                { key: 'technical', text: 'تحلیل تکنیکال', emoji: '📊' },
                { key: 'fundamental', text: 'تحلیل بنیادی', emoji: '📈' }
            ];

            for (const cat of defaultCategories) {
                const menu = await BotMenu.create({
                    text: cat.text,
                    emoji: cat.emoji,
                    parentId: educationMenu.id,
                    content: `📚 **آموزش‌های ${cat.text}**\n\nلطفاً یکی از آموزش‌های زیر را انتخاب کنید:`,
                    order: Object.keys(categoryMenus).length + 1,
                    isActive: true
                });

                categoryMenus[cat.key] = menu.id;
                console.log(`   ✅ منوی ${cat.text} ایجاد شد (ID: ${menu.id})`);
            }
        }

        // ============= ۵. ایجاد زیرمنوهای بروکرها =============
        console.log('📝 ایجاد زیرمنوهای بروکرها...');

        // زیرمنوی "بروکر چیست؟"
        const whatIsBroker = await BotMenu.create({
            text: 'بروکر چیست؟',
            emoji: '❓',
            parentId: brokersMenu.id,
            content: '❓ **بروکر چیست؟**\n\nبروکر (کارگزار) یک نهاد مالی است که به عنوان واسطه بین معامله‌گران و بازارهای مالی عمل می‌کند. بروکرها امکان خرید و فروش دارایی‌های مختلف مانند ارز، سهام، کالا و ارزهای دیجیتال را فراهم می‌کنند.\n\n✅ **انواع بروکرها:**\n• بروکرهای ECN\n• بروکرهای STP\n• بروکرهای مارکت میکر\n• بروکرهای NDD\n\n✅ **ویژگی‌های یک بروکر خوب:**\n• رگوله‌شده\n• اسپرد رقابتی\n• سرعت اجرا بالا\n• پشتیبانی مناسب',
            order: 1,
            isActive: true
        });
        console.log('   ✅ منوی "بروکر چیست؟" ایجاد شد');

        // زیرمنوی "انواع بروکرها"
        const brokerTypes = await BotMenu.create({
            text: 'انواع بروکرها',
            emoji: '📋',
            parentId: brokersMenu.id,
            content: '📋 **انواع بروکرها**\n\n✅ **ECN**\nشبکه ارتباط الکترونیکی، دسترسی مستقیم به بازار و اسپرد متغیر\n\n✅ **STP**\nپردازش مستقیم، سفارشات مستقیماً به تأمین‌کننده نقدینگی ارسال می‌شود\n\n✅ **Market Maker**\nایجاد بازار، ممکن است با معامله‌گران معامله کند\n\n✅ **NDD** (No Dealing Desk)\nبدون میز معامله، ترکیبی از ECN و STP',
            order: 2,
            isActive: true
        });
        console.log('   ✅ منوی "انواع بروکرها" ایجاد شد');

        // زیرمنوی "لیست بروکرها برای ثبت‌نام"
        const brokerListMenu = await BotMenu.create({
            text: 'لیست بروکرها',
            emoji: '📊',
            parentId: brokersMenu.id,
            content: '📊 **لیست بروکرهای معتبر**\n\nبرای مشاهده اطلاعات کامل هر بروکر و ثبت‌نام، روی آن کلیک کنید:',
            order: 3,
            isActive: true
        });
        console.log('   ✅ منوی "لیست بروکرها" ایجاد شد');

        // ============= ۶. ایجاد زیرمنوهای داینامیک برای هر بروکر =============
        console.log('📝 ایجاد زیرمنوهای بروکرها...');

        const brokers = await Broker.findAll({
            where: { isActive: true },
            order: [['order', 'ASC'], ['rating', 'DESC']],
            limit: 10
        });

        if (brokers.length > 0) {
            let brokerOrder = 1;
            for (const broker of brokers) {
                const brokerName = broker.display_name_fa || broker.name;
                const regulations = JSON.parse(broker.regulations || '[]');
                const regText = regulations.length > 0 ? `\n✅ **رگوله‌ها:** ${regulations.join('، ')}` : '';

                await BotMenu.create({
                    text: brokerName,
                    emoji: '🏢',
                    parentId: brokerListMenu.id,
                    content: `🏢 **${brokerName}**\n\n⭐ **امتیاز:** ${broker.rating}/5\n📅 **سال تأسیس:** ${broker.foundedYear || 'نامشخص'}\n👥 **کاربران:** ${broker.usersCount || '۰'}\n💰 **اسپرد:** ${broker.spread || 'رقابتی'}\n📊 **اهرم:** ${broker.leverage || '۱:۵۰۰'}\n💵 **حداقل سپرده:** ${broker.minDeposit || '۱۰۰ دلار'}${regText}\n\n🔗 **لینک ثبت‌نام:** ${broker.registerLink || 'مراجعه به وب‌سایت'}`,
                    order: brokerOrder++,
                    isActive: true
                });
            }
            console.log(`   ✅ ${brokers.length} منوی بروکر ایجاد شد`);
        } else {
            // اگر بروکری وجود نداشت، نمونه‌های پیش‌فرض ایجاد کن
            console.log('   ⚠️ هیچ بروکری یافت نشد. ایجاد منوهای پیش‌فرض...');

            const defaultBrokers = [
                { name: 'آلپاری', rating: 4.8, foundedYear: '۱۹۹۸', usersCount: '+۲ میلیون', spread: '۰.۰ پیپ', leverage: '۱:۱۰۰۰', minDeposit: '۱۰۰ دلار', registerLink: 'https://alpari.com' },
                { name: 'ای‌تی‌گلوبال', rating: 4.7, foundedYear: '۲۰۰۸', usersCount: '+۱ میلیون', spread: '۰.۰ پیپ', leverage: '۱:۵۰۰', minDeposit: '۱۰۰ دلار', registerLink: 'https://etoro.com' }
            ];

            let brokerOrder = 1;
            for (const broker of defaultBrokers) {
                await BotMenu.create({
                    text: broker.name,
                    emoji: '🏢',
                    parentId: brokerListMenu.id,
                    content: `🏢 **${broker.name}**\n\n⭐ **امتیاز:** ${broker.rating}/5\n📅 **سال تأسیس:** ${broker.foundedYear}\n👥 **کاربران:** ${broker.usersCount}\n💰 **اسپرد:** ${broker.spread}\n📊 **اهرم:** ${broker.leverage}\n💵 **حداقل سپرده:** ${broker.minDeposit}\n\n🔗 **لینک ثبت‌نام:** ${broker.registerLink}`,
                    order: brokerOrder++,
                    isActive: true
                });
            }
            console.log(`   ✅ ${defaultBrokers.length} منوی بروکر پیش‌فرض ایجاد شد`);
        }

        // ============= ۷. اضافه کردن منوی انتخاب زبان =============
        console.log('📝 ایجاد منوی انتخاب زبان...');

        const languageMenu = await BotMenu.create({
            text: 'انتخاب زبان',
            emoji: '🌐',
            parentId: mainMenu.id,
            content: '🌐 **انتخاب زبان**\n\nلطفاً زبان مورد نظر خود را انتخاب کنید:',
            order: 4,
            isActive: true
        });
        console.log('   ✅ منوی انتخاب زبان ایجاد شد');

        // زیرمنوهای زبان
        await BotMenu.create({
            text: 'فارسی',
            emoji: '🇮🇷',
            parentId: languageMenu.id,
            content: '🇮🇷 **زبان فارسی انتخاب شد**\n\nزبان ربات به فارسی تغییر یافت.',
            order: 1,
            isActive: true
        });

        await BotMenu.create({
            text: 'English',
            emoji: '🇬🇧',
            parentId: languageMenu.id,
            content: '🇬🇧 **English language selected**\n\nBot language changed to English.',
            order: 2,
            isActive: true
        });

        await BotMenu.create({
            text: 'العربية',
            emoji: '🇸🇦',
            parentId: languageMenu.id,
            content: '🇸🇦 **تم اختيار اللغة العربية**\n\nتم تغيير لغة البوت إلى العربية.',
            order: 3,
            isActive: true
        });

        console.log('   ✅ زیرمنوهای زبان ایجاد شد');

        console.log('\n✅✅✅ ایجاد منوهای ربات با موفقیت به پایان رسید! ✅✅✅');
        console.log('📊 خلاصه منوها:');
        console.log(`   • منوی اصلی: ۱ عدد`);
        console.log(`   • زیرمنوهای سطح اول: ۴ عدد`);
        console.log(`   • زیرمنوهای آموزش: ${Object.keys(categoryMenus).length} عدد`);
        console.log(`   • زیرمنوهای بروکرها: ${brokers.length || 2} عدد`);
        console.log(`   • منوی زبان: ۴ عدد`);

    } catch (error) {
        console.error('❌ خطا در ایجاد منوهای ربات:', error);
    } finally {
        process.exit();
    }
}

createBotMenus();