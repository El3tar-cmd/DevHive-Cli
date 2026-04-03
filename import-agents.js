const fs = require('fs');
const path = require('path');

const devHiveAgentsDir = path.join(__dirname, 'agents');

const sourceDirs = [
  'D:\\python_proj\\Devy-Core\\.local\\secondary_skills',
  'D:\\python_proj\\Devy-Core\\.local\\skills'
];

if (!fs.existsSync(devHiveAgentsDir)) {
  fs.mkdirSync(devHiveAgentsDir, { recursive: true });
}

let copiedCount = 0;

console.log('🔄 Starting copy process...');

for (const src of sourceDirs) {
  if (fs.existsSync(src)) {
    const folders = fs.readdirSync(src, { withFileTypes: true });
    for (const folder of folders) {
      if (folder.isDirectory()) {
        const srcFolder = path.join(src, folder.name);
        const destFolder = path.join(devHiveAgentsDir, folder.name);
        try {
          // Copy only if it doesn't already exist or overwrite safely
          fs.cpSync(srcFolder, destFolder, { recursive: true, force: true });
          console.log(`  └─ Copied: ${folder.name}`);
          copiedCount++;
        } catch (e) {
          console.error(`  ❌ Failed to copy ${folder.name}: ${e.message}`);
        }
      }
    }
  } else {
    console.warn(`⚠️ Source not found: ${src}`);
  }
}

console.log(`\n✅ Successfully bundled ${copiedCount} agent/skill folders directly into DevHive's core directory!`);
