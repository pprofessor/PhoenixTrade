// ===== update-footer.js =====
const fs = require('fs');
const path = require('path');

// مسیر پوشه views
const viewsDir = path.join(__dirname, 'views');

// الگوی فوتر قدیمی (ممکن است متفاوت باشد - چند حالت مختلف)
const footerPatterns = [
    /<!-- فوتر -->[\s\S]*?<footer class="footer">[\s\S]*?<\/footer>[\s\S]*?<!-- \/فوتر -->/g,
    /<footer class="footer">[\s\S]*?<\/footer>/g,
    /<!-- ===== فوتر ===== -->[\s\S]*?<footer class="footer">[\s\S]*?<\/footer>/g,
    /<footer[\s\S]*?class="footer"[\s\S]*?>[\s\S]*?<\/footer>/g
];

// کد جدید فوتر
const newFooter = '<%- include(\'footer\') %>';

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
        } else if (file.endsWith('.ejs') && !file.includes('footer.ejs')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// تابع برای جایگزینی فوتر در یک فایل
function replaceFooterInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // بررسی هر الگو
    footerPatterns.forEach(pattern => {
        if (pattern.test(content)) {
            // بازنشانی lastIndex
            pattern.lastIndex = 0;
            content = content.replace(pattern, newFooter);
        }
    });

    // اگر فایل شامل فوتر جدید نبود و تغییری کرده بود
    if (content !== originalContent) {
        // اگر فوتر جدید تکراری نیست
        if ((content.match(/<%-\s*include\('footer'\)\s*%>/g) || []).length <= 1) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${path.relative(viewsDir, filePath)}`);
            modifiedCount++;
        }
    }
}

// اجرای اصلی
console.log('🔍 در حال جستجوی فایل‌های EJS...\n');

try {
    const ejsFiles = getAllEjsFiles(viewsDir);

    console.log(`📁 ${ejsFiles.length} فایل EJS پیدا شد (به جز footer.ejs)\n`);

    ejsFiles.forEach(file => {
        replaceFooterInFile(file);
    });

    console.log(`\n✨ عملیات کامل شد! ${modifiedCount} فایل به‌روزرسانی شد.`);

    if (modifiedCount === 0) {
        console.log('\n⚠️ هیچ فایلی با فوتر قدیمی پیدا نشد. ممکن است فوترها قبلاً تغییر کرده باشند.');
        console.log('   برای اطمینان، این فایل‌ها را دستی بررسی کن:');
        console.log('   - home.ejs');
        console.log('   - brokers.ejs');
        console.log('   - education-list.ejs');
        console.log('   - broker-detail.ejs');
        console.log('   - compare.ejs');
        console.log('   - contact.ejs');
        console.log('   - markets.ejs');
    }

} catch (error) {
    console.error('❌ خطا:', error.message);
}