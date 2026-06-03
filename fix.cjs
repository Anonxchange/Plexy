const fs = require('fs'), path = require('path');
function fix(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) fix(p);
    else if (f.name.match(/\.tsx?$/)) {
      const src = fs.readFileSync(p, 'utf8');
      const out = src.replace(/from ['"]lucide-react['"]/g, "from '@/lib/icons'");
      if (src !== out) { fs.writeFileSync(p, out); console.log('fixed:', p); }
    }
  }
}
fix('client/src');
