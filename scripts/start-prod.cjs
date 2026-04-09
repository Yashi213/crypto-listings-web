/**
 * Render: скрипт может резолвиться как .../src/scripts (cwd/src), а nest build кладёт dist в корень репо.
 * Пробуем несколько путей к dist/main.js.
 */
const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, '..', 'dist', 'main.js'),
  path.join(__dirname, '..', '..', 'dist', 'main.js'),
];

const mainJs = candidates.find((p) => fs.existsSync(p));

if (!mainJs) {
  console.error('[start-prod] Не найден dist/main.js. Проверьте:');
  candidates.forEach((p) => console.error('  -', p));
  process.exit(1);
}

require(mainJs);
