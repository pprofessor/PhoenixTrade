// ===== add-i18n-script.js =====
const fs = require('fs');
const path = require('path');

// مسیر پوشه views
const viewsDir = path.join(__dirname, 'views');

// لیست فایل‌هایی که نباید تغییر کنند
const excludeFiles = [
    'header.ejs',
    'footer.ejs',
    'sidebar.ejs'
];

// اسکریپتی که باید به head اضافه شود
const i18nScript = '    <script src="/js/i18n.js"></script>';

// شمارنده فایل‌های تغییر یافته
let modifiedCount = 0;

// تابع برای خواندن همه فایل‌های .ejs
function getAllEjsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getAllEjsFiles(filePath, fileList);
        } else if (file.endsWith('.ejs') && !excludeFiles.includes(file)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// تابع برای اضافه کردن اسکریپت به فایل
function addScriptToFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // اگر فایل قبلاً اسکریپت را دارد، اسکیپ کن
    if (content.includes('i18n.js')) {
        return false;
    }

    // پیدا کردن تگ head و اضافه کردن اسکریپت
    const headPattern = /<head>([\s\S]*?)<\/head>/i;
    const match = content.match(headPattern);

    if (match) {
        const headContent = match[1];
        const newHeadContent = headContent + '\n' + i18nScript;
        const newContent = content.replace(headContent, newHeadContent);

        fs.writeFileSync(filePath, newContent, 'utf8');
        return true;
    }

    return false;
}

// اجرای اصلی
console.log('🔍 در حال جستجوی فایل‌های EJS...\n');

try {
    const ejsFiles = getAllEjsFiles(viewsDir);

    console.log(`📁 ${ejsFiles.length} فایل EJS بررسی می‌شود...\n`);

    ejsFiles.forEach(file => {
        if (addScriptToFile(file)) {
            console.log(`✅ اسکریپت به ${path.relative(viewsDir, file)} اضافه شد`);
            modifiedCount++;
        }
    });

    console.log(`\n✨ عملیات کامل شد! اسکریپت به ${modifiedCount} فایل اضافه شد.`);

} catch (error) {
    console.error('❌ خطا:', error.message);
}