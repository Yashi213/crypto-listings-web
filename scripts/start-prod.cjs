/**
 * Запуск из каталога с package.json, не из process.cwd().
 * На Render иногда cwd = .../src, тогда node dist/main ищет src/dist — файл в корне dist/.
 */
const fs = require('fs');
const path = require('path');

const mainJs = path.join(__dirname, '..', 'dist', 'main.js');

if (!fs.existsSync(mainJs)) {
  console.error('[start-prod] Нет файла:', mainJs);
  process.exit(1);
}

require(mainJs);
