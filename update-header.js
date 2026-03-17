// ===== update-header.js =====
const fs = require('fs');
const path = require('path');

// مسیر پوشه views
const viewsDir = path.join(__dirname, 'views');

// الگوهای مختلف هدر (برای شناسایی)
const headerPatterns = [
    /<header class="header">[\s\S]*?<\/header>/g,
    /<!-- ===== هدر ===== -->[\s\S]*?<header class="header">[\s\S]*?<\/header>/g,
    /<header[\s\S]*?class="header"[\s\S]*?>[\s\S]*?<\/header>/g
];

// کد جدید هدر
const newHeader = '<%- include(\'header\') %>';

// لیست فایل‌هایی که نباید تغییر کنند
const excludeFiles = [
    'header.ejs',
    'footer.ejs',
    'sidebar.ejs'
];

// شمارنده فایل‌های تغییر یافته
let modifiedCount = 0;

// تابع برای خواندن همه فایل‌های .ejs در یک دایرکتوری (به صورت بازگشتی)
function getAllEjsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // اگر پوشه views/admin هم باشد، آن را هم بررسی کن
            getAllEjsFiles(filePath, fileList);
        } else if (file.endsWith('.ejs') && !excludeFiles.includes(file)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// تابع برای جایگزینی هدر در یک فایل
function replaceHeaderInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // بررسی هر الگو
    let hasHeader = false;
    headerPatterns.forEach(pattern => {
        if (pattern.test(content)) {
            pattern.lastIndex = 0;
            content = content.replace(pattern, newHeader);
            hasHeader = true;
        }
    });

    // اگر فایل هدر داشت و تغییری کرده بود
    if (hasHeader && content !== originalContent) {
        // اگر هدر جدید تکراری نیست
        if ((content.match(/<%-\s*include\('header'\)\s*%>/g) || []).length <= 1) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${path.relative(viewsDir, filePath)}`);
            modifiedCount++;
        }
    }
}

// اجرای اصلی
console.log('🔍 در حال جستجوی فایل‌های EJS برای یافتن هدر...\n');

try {
    const ejsFiles = getAllEjsFiles(viewsDir);

    console.log(`📁 ${ejsFiles.length} فایل EJS بررسی می‌شود...\n`);

    ejsFiles.forEach(file => {
        replaceHeaderInFile(file);
    });

    console.log(`\n✨ عملیات کامل شد! ${modifiedCount} فایل به‌روزرسانی شد.`);

    if (modifiedCount === 0) {
        console.log('\n⚠️ هیچ فایلی با هدر قدیمی پیدا نشد. ممکن است هدرها قبلاً تغییر کرده باشند.');
        console.log('   برای اطمینان، این فایل‌ها را دستی بررسی کن:');
        console.log('   - home.ejs');
        console.log('   - brokers.ejs');
        console.log('   - broker-detail.ejs');
        console.log('   - education.ejs');
        console.log('   - education-list.ejs');
        console.log('   - compare.ejs');
        console.log('   - contact.ejs');
        console.log('   - markets.ejs');
    }

} catch (error) {
    console.error('❌ خطا:', error.message);
}