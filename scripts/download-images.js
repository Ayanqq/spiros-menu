// Одноразовый миграционный скрипт.
//
// Скачивает все фото рецептов (cleaned-recipes.json -> gallery[].url),
// которые сейчас ссылаются на вложения Trello, в public/images/recipes/,
// и переписывает cleaned-recipes.json так, чтобы он указывал на локальные
// файлы. После успешного запуска приложение больше не обращается к Trello.
//
// КАК ЗАПУСТИТЬ:
//   1. Откройте .env в корне проекта и впишите свои реальные значения:
//        TRELLO_KEY=...
//        TRELLO_TOKEN=...
//      Ключ берётся на https://trello.com/power-ups/admin (он же
//      https://trello.com/app-key), токен — там же, через авторизацию
//      приложения от имени пользователя с доступом к нужным карточкам.
//      Без них вложения Trello отвечают 401, и скрипт сразу завершится
//      с ошибкой, ничего не скачивая.
//   2. node scripts/download-images.js
//
// Скрипт идемпотентен: уже скачанные файлы не перекачиваются повторно,
// так что его безопасно перезапускать (например, после того как вы
// дозаполнили ключи или поправили rate-limit).
//
// Примечание: бинарные download-эндпоинты вложений Trello не принимают
// key/token как query-параметры (отвечают 401) — авторизация передаётся
// заголовком `Authorization: OAuth oauth_consumer_key="...", oauth_token="..."`.
// Скрипт делает это автоматически, см. authHeader() ниже.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const DATA_PATH = path.join(ROOT, 'src', 'data', 'cleaned-recipes.json');
const BACKUP_PATH = path.join(ROOT, 'src', 'data', 'cleaned-recipes.backup.json');
const IMAGES_ROOT = path.join(ROOT, 'public', 'images', 'recipes');

const TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_DELAY_MS = 250;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// .env + проверка ключей
// ---------------------------------------------------------------------------

try {
  process.loadEnvFile(ENV_PATH);
} catch {
  console.error(`Не удалось прочитать ${path.relative(ROOT, ENV_PATH)}. Создайте файл .env с TRELLO_KEY и TRELLO_TOKEN.`);
  process.exit(1);
}

const TRELLO_KEY = (process.env.TRELLO_KEY || '').trim();
const TRELLO_TOKEN = (process.env.TRELLO_TOKEN || '').trim();

if (!TRELLO_KEY || !TRELLO_TOKEN) {
  console.error('Заполните TRELLO_KEY и TRELLO_TOKEN в .env перед запуском.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Загрузка данных
// ---------------------------------------------------------------------------

const recipes = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const allImages = [];
for (const recipe of recipes) {
  (recipe.gallery || []).forEach((image, index) => {
    allImages.push({ recipe, index, originalUrl: image.url });
  });
}

console.log(`Найдено изображений в исходных данных: ${allImages.length}`);

// ---------------------------------------------------------------------------
// Скачивание
// ---------------------------------------------------------------------------

function authHeader() {
  return `OAuth oauth_consumer_key="${TRELLO_KEY}", oauth_token="${TRELLO_TOKEN}"`;
}

async function fetchImage(downloadUrl) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(downloadUrl, {
        signal: controller.signal,
        headers: { Authorization: authHeader() },
      });
    } catch (err) {
      clearTimeout(timer);
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      return { ok: false, reason: `сетевая ошибка: ${err.message}` };
    }
    clearTimeout(timer);

    if (res.status >= 500) {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      return { ok: false, reason: `HTTP ${res.status}` };
    }

    if (res.status !== 200) {
      return { ok: false, reason: `HTTP ${res.status}` };
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return { ok: false, reason: `неожиданный content-type "${contentType}"` };
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return { ok: true, buffer };
  }
  return { ok: false, reason: 'не удалось скачать после повторных попыток' };
}

const mapping = new Map(); // originalUrl -> локальный путь вида /images/recipes/<id>/<i>.webp
const failures = []; // { recipeId, url, reason }

for (const { recipe, index, originalUrl } of allImages) {
  const recipeDir = path.join(IMAGES_ROOT, recipe.id);
  const localFsPath = path.join(recipeDir, `${index}.webp`);
  const localUrlPath = `/images/recipes/${recipe.id}/${index}.webp`;

  if (fs.existsSync(localFsPath) && fs.statSync(localFsPath).size > 0) {
    mapping.set(originalUrl, localUrlPath);
    console.log(`[уже есть] ${recipe.id}/${index}.webp`);
    continue;
  }

  let downloadUrl;
  try {
    downloadUrl = new URL(originalUrl);
  } catch {
    console.error(`[ошибка] ${recipe.id} ${originalUrl}: некорректный URL`);
    failures.push({ recipeId: recipe.id, url: originalUrl, reason: 'некорректный URL' });
    continue;
  }

  // Trello отвечает 401 на бинарные download-эндпоинты вложений, если key/token
  // переданы как query-параметры — авторизация для них принимается только через
  // заголовок Authorization (см. authHeader()).
  const result = await fetchImage(downloadUrl);

  if (result.ok) {
    fs.mkdirSync(recipeDir, { recursive: true });
    fs.writeFileSync(localFsPath, result.buffer);
    mapping.set(originalUrl, localUrlPath);
    console.log(`[ok] ${recipe.id}/${index}.webp`);
  } else {
    console.error(`[ошибка] ${recipe.id} ${originalUrl}: ${result.reason}`);
    failures.push({ recipeId: recipe.id, url: originalUrl, reason: result.reason });
  }

  await sleep(REQUEST_DELAY_MS);
}

// ---------------------------------------------------------------------------
// Бэкап + перезапись cleaned-recipes.json
// ---------------------------------------------------------------------------

if (!fs.existsSync(BACKUP_PATH)) {
  fs.copyFileSync(DATA_PATH, BACKUP_PATH);
  console.log(`\nБэкап сохранён: ${path.relative(ROOT, BACKUP_PATH)}`);
} else {
  console.log(`\nБэкап уже существует (${path.relative(ROOT, BACKUP_PATH)}), не перезаписываю.`);
}

for (const recipe of recipes) {
  recipe.gallery = (recipe.gallery || [])
    .map((image) => {
      const localUrlPath = mapping.get(image.url);
      if (!localUrlPath) return null;
      return { ...image, url: localUrlPath };
    })
    .filter((image) => image !== null);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(recipes, null, 2) + '\n', 'utf8');
console.log(`Данные перезаписаны: ${path.relative(ROOT, DATA_PATH)}`);

// ---------------------------------------------------------------------------
// Отчёт
// ---------------------------------------------------------------------------

console.log('\n--- Отчёт ---');
console.log(`Всего изображений найдено:   ${allImages.length}`);
console.log(`Успешно (скачано/уже было):  ${mapping.size}`);
console.log(`Не удалось скачать:          ${failures.length}`);

if (failures.length) {
  console.log('\nНе удалось скачать (перезапустите скрипт после исправления, чтобы докачать):');
  for (const f of failures) {
    console.log(`  recipeId=${f.recipeId} url=${f.url} — ${f.reason}`);
  }
}
