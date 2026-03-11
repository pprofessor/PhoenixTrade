// ============= controllers/databaseController.js =============
// کنترلر مخصوص صفحه مدیریت دیتابیس

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

// ============= صفحه اصلی مدیریت دیتابیس =============
const databaseIndex = async (req, res) => {
  try {
    // ===== ۱. دریافت آمار دیتابیس =====
    // دریافت لیست جداول
    const tables = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
      { type: QueryTypes.SELECT }
    );
    
    // دریافت تعداد رکوردهای هر جدول
    let totalRecords = 0;
    const tableSchemas = [];
    
    for (const table of tables) {
      // تعداد رکوردها
      const countResult = await sequelize.query(
        `SELECT COUNT(*) as count FROM \`${table.name}\`;`,
        { type: QueryTypes.SELECT }
      );
      const recordCount = countResult[0].count;
      totalRecords += recordCount;
      
      // ساختار جدول
      const columns = await sequelize.query(
        `PRAGMA table_info(\`${table.name}\`);`,
        { type: QueryTypes.SELECT }
      );
      
      tableSchemas.push({
        name: table.name,
        recordCount: recordCount,
        columns: columns.map(col => col.name)
      });
    }
    
    // حجم دیتابیس
    let dbSize = '0';
    try {
      const stats = fs.statSync(path.join(__dirname, '../database.sqlite'));
      dbSize = (stats.size / (1024 * 1024)).toFixed(1);
    } catch (err) {
      console.error('خطا در خواندن حجم دیتابیس:', err);
    }
    
    // آمار نهایی
    const stats = {
      totalTables: tables.length,
      totalRecords: totalRecords,
      dbSize: dbSize
    };
    
    // ===== ۲. جدول انتخاب شده =====
    const selectedTable = req.query.table || (tables.length > 0 ? tables[0].name : '');
    
    let currentColumns = [];
    let currentData = [];
    
    if (selectedTable) {
      // دریافت ستون‌های جدول انتخاب شده
      const columns = await sequelize.query(
        `PRAGMA table_info(\`${selectedTable}\`);`,
        { type: QueryTypes.SELECT }
      );
      currentColumns = columns.map(c => c.name);
      
      // دریافت داده‌های جدول انتخاب شده
      currentData = await sequelize.query(
        `SELECT * FROM \`${selectedTable}\` ORDER BY id DESC LIMIT 50;`,
        { type: QueryTypes.SELECT }
      );
    }
    
    // ===== ۳. دستورات پرکاربرد =====
    const commonCommands = [
      { command: "SELECT * FROM Admins;", title: "لیست مدیران", description: "مشاهده همه مدیران" },
      { command: "SELECT * FROM Lessons WHERE isActive = 1;", title: "درس‌های فعال", description: "لیست درس‌های فعال" },
      { command: "SELECT COUNT(*) FROM Users;", title: "تعداد کاربران", description: "شمارش کاربران" },
      { command: ".tables", title: "لیست جداول", description: "نمایش همه جداول" },
      { command: "PRAGMA table_info(Admins);", title: "ساختار Admins", description: "مشاهده ستون‌های جدول" }
    ];
    
    // ===== ۴. رندر صفحه =====
    res.render('database', {
      title: 'مدیریت دیتابیس',
      user: req.session.adminUsername,
      activePage: 'database',
      stats: stats,
      tables: tables.map(t => ({ name: t.name, recordCount: tableSchemas.find(s => s.name === t.name)?.recordCount || 0 })),
      selectedTable: selectedTable,
      currentColumns: currentColumns,
      currentData: currentData,
      tableSchemas: tableSchemas,
      terminalHistory: [],
      lastCommand: '',
      commonCommands: commonCommands
    });
    
  } catch (error) {
    console.error('❌ خطا در صفحه دیتابیس:', error);
    res.status(500).render('error', {
      title: 'خطا',
      message: 'خطا در بارگذاری صفحه دیتابیس',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.session.adminUsername
    });
  }
};

// ============= اجرای دستور SQL =============
const executeQuery = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'دستور وارد نشده است' });
    }
    
    let results = [];
    const cleanQuery = query.trim();
    
    if (cleanQuery.startsWith('.')) {
      // دستورات خاص SQLite
      if (cleanQuery === '.tables') {
        const tables = await sequelize.query(
          "SELECT name FROM sqlite_master WHERE type='table';",
          { type: QueryTypes.SELECT }
        );
        results = tables.map(t => t.name);
      } else if (cleanQuery.startsWith('.schema')) {
        const tableName = cleanQuery.split(' ')[1];
        const schema = await sequelize.query(
          `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}';`,
          { type: QueryTypes.SELECT }
        );
        results = [schema[0]?.sql || 'جدول یافت نشد'];
      } else {
        results = ['دستور پشتیبانی نمی‌شود'];
      }
    } else {
      // دستورات SQL معمولی
      const isSelect = cleanQuery.toLowerCase().startsWith('select');
      
      if (isSelect) {
        const data = await sequelize.query(cleanQuery, { type: QueryTypes.SELECT });
        results = data.map(row => JSON.stringify(row));
      } else {
        await sequelize.query(cleanQuery);
        results = ['دستور با موفقیت اجرا شد'];
      }
    }
    
    res.json({ success: true, results });
    
  } catch (error) {
    console.error('❌ خطا در اجرای دستور SQL:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ============= جستجو در داده‌ها =============
const searchData = async (req, res) => {
  try {
    const { table, field, term } = req.body;
    
    if (!table) {
      return res.status(400).json({ success: false, error: 'جدول مشخص نشده است' });
    }
    
    let query = `SELECT * FROM \`${table}\``;
    const replacements = {};
    
    if (term && term.trim() !== '') {
      if (field && field !== 'all') {
        query += ` WHERE \`${field}\` LIKE :term`;
        replacements.term = `%${term}%`;
      } else {
        // جستجو در همه فیلدها - نیاز به اطلاعات ستون‌ها دارد
        const columns = await sequelize.query(
          `PRAGMA table_info(\`${table}\`);`,
          { type: QueryTypes.SELECT }
        );
        
        const conditions = columns.map(col => `\`${col.name}\` LIKE :term`).join(' OR ');
        query += ` WHERE ${conditions}`;
        replacements.term = `%${term}%`;
      }
    }
    
    query += ' ORDER BY id DESC LIMIT 50;';
    
    const data = await sequelize.query(query, { 
      type: QueryTypes.SELECT,
      replacements: replacements
    });
    
    res.json({ success: true, data });
    
  } catch (error) {
    console.error('❌ خطا در جستجو:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= حذف رکورد =============
const deleteRow = async (req, res) => {
  try {
    const { table, id } = req.body;
    
    if (!table || !id) {
      return res.status(400).json({ success: false, error: 'اطلاعات ناقص است' });
    }
    
    await sequelize.query(`DELETE FROM \`${table}\` WHERE id = :id`, {
      replacements: { id }
    });
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ خطا در حذف رکورد:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  databaseIndex,
  executeQuery,
  searchData,
  deleteRow
};