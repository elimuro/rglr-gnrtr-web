const fs = require('fs');

const files = [
  'public/default-scene.json',
  'public/scenes/globules.json',
  'public/scenes/meat-mode.json',
  'public/scenes/matcha-mode.json',
  'public/scenes/worm-mode.json',
  'public/presets/morphing-triggers.json',
  'public/presets/akai-mpk-mini.json',
  'public/presets/sample-multi-channel.json',
  'public/presets/novation-launch-control.json',
  'public/presets/elektron-analog-rytm-mk2.json',
  'public/presets/arturia-beatstep-pro.json'
];

console.log('Checking JSON files...');

files.forEach(file => {
  try {
    JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`✅ ${file} is valid JSON`);
  } catch (e) {
    console.log(`❌ ${file} has JSON error: ${e.message}`);
  }
}); 