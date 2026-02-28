const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const backupController = {
  // صفحه اصلی بکاپ
  index: (req, res) => {
    const backups = [];
    const backupDir = path.join(__dirname, '../backups');
    
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      files.forEach(file => {
        const stat = fs.statSync(path.join(backupDir, file));
        backups.push({
          name: file,
          size: (stat.size / 1024 / 1024).toFixed(2) + ' MB',
          date: stat.mtime
        });
      });
    }
    
    res.render('backup', { 
      title: 'مدیریت بکاپ',
      backups,
      error: null,
      user: req.session.adminUsername
    });
  },

  // ایجاد بکاپ جدید
  create: (req, res) => {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const fileName = `backup-${Date.now()}.sqlite`;
    const filePath = path.join(backupDir, fileName);
    
    // کپی فایل دیتابیس
    fs.copyFileSync(
      path.join(__dirname, '../database.sqlite'),
      filePath
    );
    
    res.redirect('/pprofessor/backup');
  },

  // دانلود بکاپ
  download: (req, res) => {
    const filePath = path.join(__dirname, '../backups', req.params.file);
    res.download(filePath);
  },

  // حذف بکاپ
  delete: (req, res) => {
    const filePath = path.join(__dirname, '../backups', req.params.file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.redirect('/pprofessor/backup');
  }
};

module.exports = backupController;