// Parses the free-form Russian markdown-ish text stored in Recipe.description
// into a structured shape the UI can render consistently.

export interface ParsedIngredient {
  raw: string;
  name: string;
  amount: string | null;
}

export interface ParsedSection {
  title: string | null;
  ingredients: ParsedIngredient[];
  steps: string[];
  /** Optional per-section yield, e.g. a sub-recipe's own "Выход: ...". */
  yield: string | null;
}

export interface ParsedDescription {
  sections: ParsedSection[];
  yield: string | null;
  allergens: string | null;
  cookTime: string | null;
}

// Zero-width space / non-joiner / joiner / BOM characters used as stray separators in the source data.
const ZERO_WIDTH_RE = /\u200B|\u200C|\u200D|\uFEFF/g;

const UNITS = 'кг|гр|г|л|мл|шт\\.?|порц\\.?|п\\.?';
// Amount with an explicit unit, optionally followed by a parenthetical note, at the end of the line.
const AMOUNT_WITH_UNIT_RE = new RegExp(
  `([\\d]+(?:[.,/]\\d+)?\\s*(?:${UNITS}))\\s*(\\([^)]*\\))?\\s*[;,.]*\\s*$`,
  'iu',
);
// A bare trailing number with no unit (data entry omitted the unit), e.g. "Семена кунжутные - 0,5".
const BARE_NUMBER_TAIL_RE = /[\s\-–—]([\d]+(?:[.,]\d+)?)\s*[;,.]*\s*$/u;

const YIELD_LINE_RE = /^Выход\s*:\s*(.+?)\s*$/iu;
const ALLERGENS_HEADER_RE = /^#*\s*\*{0,2}Аллергены и время приготовления\*{0,2}:?\s*$/iu;

const GENERIC_HEADERS = new Set([
  'состав и технология приготовления',
  'технология приготовления',
  'описание',
  'состав',
]);

function stripZeroWidth(text: string): string {
  return text.replace(ZERO_WIDTH_RE, '');
}

function normalizeHeaderText(line: string): string {
  return line
    .trim()
    .replace(/^#+\s*/, '')
    .replace(/^\*{1,2}/, '')
    .replace(/\*{1,2}$/, '')
    .replace(/:\s*$/, '')
    .trim();
}

function isHeaderLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^#+\s*/.test(t)) return true;
  if (/^\*\*.+\*\*:?$/.test(t)) return true;
  if (ALLERGENS_HEADER_RE.test(t)) return true;
  return false;
}

function extractAmount(text: string): { name: string; amount: string | null } {
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

function splitIntoSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/(?<=[.!?])\s+(?=[А-ЯA-ZЁ0-9])/u);
  return parts.map((p) => p.trim()).filter(Boolean);
}

type Line = { type: 'ingredient'; raw: string } | { type: 'step' | 'prose'; raw: string };

function classifyLine(line: string): Line | null {
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

function createSection(title: string | null): ParsedSection {
  return { title, ingredients: [], steps: [], yield: null };
}

export function parseRecipeDescription(description: string | null | undefined): ParsedDescription {
  const result: ParsedDescription = { sections: [], yield: null, allergens: null, cookTime: null };
  if (!description || !description.trim()) {
    return result;
  }

  const cleaned = stripZeroWidth(description).replace(/\r\n/g, '\n');
  const lines = cleaned.split('\n');

  let currentSection: ParsedSection | null = null;
  let proseBuffer: string[] = [];
  let inAllergensBlock = false;
  const allergensLines: string[] = [];

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

  const ensureSection = (): ParsedSection => {
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
        // Generic boilerplate header - keep collecting into the current/main section.
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

  // Sections that ended up completely empty (e.g. a header followed only by a yield line) add noise - drop them.
  result.sections = result.sections.filter(
    (s) => s.ingredients.length > 0 || s.steps.length > 0 || s.yield !== null,
  );

  return result;
}
