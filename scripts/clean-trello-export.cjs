const fs = require('fs');
const path = require('path');

const SRC_PATH = path.join(__dirname, '..', 'mocks', 'abZSlGfP - spiros-menu.json');
const OUT_PATH = path.join(__dirname, '..', 'src', 'data', 'cleaned-recipes.json');

const raw = fs.readFileSync(SRC_PATH, 'utf8');
const trello = JSON.parse(raw);

// ---------------------------------------------------------------------------
// Description parser
//
// Trello card descriptions are free-form Russian markdown-ish text. The shape
// is consistent enough to parse reliably:
//   - ingredient lines: "- Name - 0,06кг" / "1. Name - 0,06кг" / "Name - 0,06"
//   - step lines: numbered lines without a trailing amount, or a prose
//     paragraph following a "Технология приготовления" style header
//   - yield lines: "Выход: 0,11кг"
//   - an optional trailing "Аллергены и время приготовления" block
//   - optional sub-recipe headers ("### Пирог:", "**На выбор:**", ...) that
//     group a component's own ingredients/steps/yield
// This mirrors the heuristics already validated in
// src/utils/parseRecipeDescription.ts, adapted here to flatten everything
// into the single ingredients/steps/yield/notes shape the data layer needs.
// ---------------------------------------------------------------------------

const ZERO_WIDTH_RE = /​|‌|‍|﻿/g;

const UNITS = 'кг|гр|г|л|мл|шт\\.?|порц\\.?|п\\.?';
const AMOUNT_WITH_UNIT_RE = new RegExp(
  `([\\d]+(?:[.,/]\\d+)?\\s*(?:${UNITS}))\\s*(\\([^)]*\\))?\\s*[;,.]*\\s*$`,
  'iu',
);
const BARE_NUMBER_TAIL_RE = /[\s\-–—]([\d]+(?:[.,]\d+)?)\s*[;,.]*\s*$/u;

const YIELD_LINE_RE = /^Выход\s*:\s*(.+?)\s*$/iu;
const ALLERGENS_HEADER_RE = /^#*\s*\*{0,2}Аллергены и время приготовления\*{0,2}:?\s*$/iu;

const GENERIC_HEADERS = new Set([
  'состав и технология приготовления',
  'технология приготовления',
  'описание',
  'состав',
]);

function stripZeroWidth(text) {
  return text.replace(ZERO_WIDTH_RE, '');
}

function normalizeHeaderText(line) {
  return line
    .trim()
    .replace(/^#+\s*/, '')
    .replace(/^\*{1,2}/, '')
    .replace(/\*{1,2}$/, '')
    .replace(/:\s*$/, '')
    .trim();
}

function isHeaderLine(line) {
  const t = line.trim();
  if (!t) return false;
  if (/^#+\s*/.test(t)) return true;
  if (/^\*\*.+\*\*:?$/.test(t)) return true;
  if (ALLERGENS_HEADER_RE.test(t)) return true;
  return false;
}

function extractAmount(text) {
  let match = text.match(AMOUNT_WITH_UNIT_RE);
  if (match && typeof match.index === 'number') {
    const amount = [match[1], match[2]].filter(Boolean).join(' ').trim();
    const name = text.slice(0, match.index).replace(/[\s\-–—:]+$/, '').trim();
    return { name: name || text.trim(), amount };
  }
  match = text.match(BARE_NUMBER_TAIL_RE);
  if (match && typeof match.index === 'number') {
    const name = text.slice(0, match.index).replace(/[\s\-–—:]+$/, '').trim();
    return { name: name || text.trim(), amount: match[1].trim() };
  }
  return { name: text.trim(), amount: null };
}

function splitIntoSentences(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/(?<=[.!?])\s+(?=[А-ЯA-ZЁ0-9])/u);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function classifyLine(line) {
  const bulletMatch = line.match(/^[-•]\s*(.*)$/);
  const numberedMatch = !bulletMatch ? line.match(/^(\d+)[.)]\s*(.*)$/) : null;
  const content = (bulletMatch ? bulletMatch[1] : numberedMatch ? numberedMatch[2] : line).trim();
  if (!content) return null;

  const hasUnit = AMOUNT_WITH_UNIT_RE.test(content);
  const hasBareNumber = Boolean(bulletMatch) && BARE_NUMBER_TAIL_RE.test(content);

  if (hasUnit || hasBareNumber) {
    return { type: 'ingredient', raw: content };
  }
  if (bulletMatch) {
    return { type: 'ingredient', raw: content };
  }
  if (numberedMatch) {
    return { type: 'step', raw: content };
  }
  return { type: 'prose', raw: content };
}

function createSection(title) {
  return { title, ingredients: [], steps: [], yield: null };
}

function parseRecipeDescription(description) {
  const result = { sections: [], yield: null, allergens: null, cookTime: null };
  if (!description || !description.trim()) {
    return result;
  }

  const cleaned = stripZeroWidth(description).replace(/\r\n/g, '\n');
  const lines = cleaned.split('\n');

  let currentSection = null;
  let proseBuffer = [];
  let inAllergensBlock = false;
  const allergensLines = [];

  const flushProse = () => {
    if (!proseBuffer.length) return;
    const text = proseBuffer.join(' ');
    proseBuffer = [];
    if (!currentSection) {
      currentSection = createSection(null);
      result.sections.push(currentSection);
    }
    for (const sentence of splitIntoSentences(text)) {
      currentSection.steps.push(sentence);
    }
  };

  const ensureSection = () => {
    if (!currentSection) {
      currentSection = createSection(null);
      result.sections.push(currentSection);
    }
    return currentSection;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushProse();
      continue;
    }

    const yieldMatch = line.match(YIELD_LINE_RE);
    if (yieldMatch) {
      flushProse();
      const value = yieldMatch[1].trim();
      if (result.yield === null) result.yield = value;
      if (currentSection) currentSection.yield = value;
      continue;
    }

    if (inAllergensBlock) {
      allergensLines.push(line);
      continue;
    }

    if (isHeaderLine(line)) {
      flushProse();
      if (ALLERGENS_HEADER_RE.test(line)) {
        inAllergensBlock = true;
        continue;
      }
      const headerText = normalizeHeaderText(line);
      if (GENERIC_HEADERS.has(headerText.toLowerCase())) {
        continue;
      }
      currentSection = createSection(headerText);
      result.sections.push(currentSection);
      continue;
    }

    const classified = classifyLine(line);
    if (!classified) continue;

    if (classified.type === 'ingredient') {
      flushProse();
      const section = ensureSection();
      const { name, amount } = extractAmount(classified.raw);
      section.ingredients.push({ raw: classified.raw, name, amount });
    } else if (classified.type === 'step') {
      flushProse();
      const section = ensureSection();
      section.steps.push(classified.raw);
    } else {
      proseBuffer.push(classified.raw);
    }
  }
  flushProse();

  if (allergensLines.length) {
    result.allergens = allergensLines[0]?.replace(/[;.]\s*$/, '').trim() || null;
    if (allergensLines.length > 1) {
      result.cookTime = allergensLines.slice(1).join(' ').trim() || null;
    }
  }

  result.sections = result.sections.filter(
    (s) => s.ingredients.length > 0 || s.steps.length > 0 || s.yield !== null,
  );

  return result;
}

// ---------------------------------------------------------------------------
// Flattening: sections -> {ingredients, steps, yield, notes}
// ---------------------------------------------------------------------------

function flattenParsedDescription(parsed) {
  const ingredients = [];
  const steps = [];
  const yieldParts = [];

  for (const section of parsed.sections) {
    const prefix = section.title ? `${section.title}: ` : '';
    for (const ing of section.ingredients) {
      ingredients.push({ name: `${prefix}${ing.name}`, amount: ing.amount ?? '' });
    }
    for (const step of section.steps) {
      steps.push(`${prefix}${step}`);
    }
    if (section.yield) {
      yieldParts.push(section.title ? `${section.title}: ${section.yield}` : section.yield);
    }
  }

  let yieldValue = '';
  if (yieldParts.length > 1) {
    yieldValue = yieldParts.join('; ');
  } else if (yieldParts.length === 1) {
    yieldValue = yieldParts[0];
  } else if (parsed.yield) {
    yieldValue = parsed.yield;
  }

  const notesParts = [];
  if (parsed.allergens) notesParts.push(`Аллергены: ${parsed.allergens}`);
  if (parsed.cookTime) notesParts.push(`Время приготовления: ${parsed.cookTime}`);
  const notes = notesParts.join('\n');

  return {
    ingredients,
    steps: steps.map((text, i) => ({ order: i + 1, text })),
    yield: yieldValue,
    notes,
  };
}

// ---------------------------------------------------------------------------
// Gallery: pick the largest preview per attachment
// ---------------------------------------------------------------------------

function buildGallery(card) {
  const attachments = card.attachments || [];
  const gallery = [];
  for (const att of attachments) {
    const previews = att.previews || [];
    if (!previews.length) continue;
    const largest = previews.reduce((best, p) => {
      const area = (p.width || 0) * (p.height || 0);
      const bestArea = (best.width || 0) * (best.height || 0);
      return area > bestArea ? p : best;
    }, previews[0]);
    gallery.push({ url: largest.url, width: largest.width, height: largest.height });
  }
  return gallery;
}

// ---------------------------------------------------------------------------
// Checklists: attach full checklist objects (with items) to their card
// ---------------------------------------------------------------------------

function cleanCheckItem(item) {
  return {
    id: item.id,
    name: item.name,
    checked: item.state === 'complete',
  };
}

function cleanChecklist(checklist) {
  return {
    id: checklist.id,
    name: checklist.name,
    items: (checklist.checkItems || []).map(cleanCheckItem),
  };
}

const checklistsByCardId = new Map();
for (const checklist of trello.checklists) {
  const list = checklistsByCardId.get(checklist.idCard) || [];
  list.push(cleanChecklist(checklist));
  checklistsByCardId.set(checklist.idCard, list);
}

// ---------------------------------------------------------------------------
// Categories: Trello lists
// ---------------------------------------------------------------------------

const categoryNameById = new Map(trello.lists.map((list) => [list.id, list.name]));

// ---------------------------------------------------------------------------
// Build recipes
// ---------------------------------------------------------------------------

const recipes = trello.cards.map((card) => {
  const parsed = parseRecipeDescription(card.desc);
  const { ingredients, steps, yield: yieldValue, notes } = flattenParsedDescription(parsed);

  return {
    id: card.id,
    title: card.name,
    categoryId: card.idList,
    categoryName: categoryNameById.get(card.idList) || '',
    gallery: buildGallery(card),
    ingredients,
    steps,
    yield: yieldValue,
    notes,
    checklists: checklistsByCardId.get(card.id) || [],
  };
});

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(recipes, null, 2), 'utf8');

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

const categoryCount = new Set(recipes.map((r) => r.categoryId)).size;
const imageCount = recipes.reduce((sum, r) => sum + r.gallery.length, 0);
const ingredientCount = recipes.reduce((sum, r) => sum + r.ingredients.length, 0);
const stepCount = recipes.reduce((sum, r) => sum + r.steps.length, 0);
const checklistCount = recipes.reduce((sum, r) => sum + r.checklists.length, 0);

console.log('--- Статистика пересборки cleaned-recipes.json ---');
console.log(`Рецептов:               ${recipes.length}`);
console.log(`Категорий:              ${categoryCount}`);
console.log(`Изображений:            ${imageCount}`);
console.log(`Ингредиентов:           ${ingredientCount}`);
console.log(`Шагов приготовления:    ${stepCount}`);
console.log(`Чек-листов:             ${checklistCount}`);
console.log(`Файл сохранён в:        ${path.relative(process.cwd(), OUT_PATH)}`);
