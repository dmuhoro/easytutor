const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const REPORTS_DIR = path.join(ROOT_DIR, 'reports/system-analysis');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function generateReport() {
  const reportPath = path.join(REPORTS_DIR, 'latest-analysis.md');
  const timestamp = new Date().toISOString();

  let content = `# System Analysis Report (${timestamp})\n\n`;

  // 1. File size warnings
  content += `## Large File Warnings\n`;
  const largeFiles = [];
  function scan(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (filePath.includes('node_modules') || filePath.includes('.git')) return;
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        scan(filePath);
      } else if (stat.size > 20000) { // 20KB
        largeFiles.push({ path: filePath, size: stat.size });
      }
    });
  }
  scan(ROOT_DIR);
  largeFiles.sort((a, b) => b.size - a.size).forEach(f => {
    content += `- **${path.relative(ROOT_DIR, f.path)}**: ${(f.size / 1024).toFixed(2)} KB\n`;
  });

  // 2. Folder Stats
  content += `\n## Folder Statistics\n`;
  const dirs = ['app', 'lib', 'components', 'store', 'supabase'];
  dirs.forEach(d => {
    const p = path.join(ROOT_DIR, d);
    if (fs.existsSync(p)) {
      const files = fs.readdirSync(p).filter(f => !fs.statSync(path.join(p, f)).isDirectory()).length;
      content += `- **/${d}**: ${files} files\n`;
    }
  });

  fs.writeFileSync(reportPath, content);
  console.log(`[ANALYSIS] Report generated at ${reportPath}`);
}

generateReport();
