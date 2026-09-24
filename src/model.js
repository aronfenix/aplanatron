const zeroes = () => Array(8).fill(0);
const sheetIds = new Set(['q2', 'q6', 'q10', 'q15', 'q3', 'q9', 'q28', 'q1', 'q11', 'q27', 'q7', 'q19']);

export const emptyProgress = () => ({
  stars: zeroes(), best: zeroes(), miss: {}, diff: 'normal',
  seenIntro: false, seen: {}, sheets: [], hubPos: null, avs: []
});

export function profileKey(studentId, partnerId = null) {
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(studentId)) throw new Error('Identidad inválida');
  if (partnerId == null) return `solo:${studentId}`;
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(partnerId) || partnerId === studentId) throw new Error('Pareja inválida');
  return `pair:${[studentId, partnerId].sort().join(':')}`;
}

function boundedArray(value, length, maximum, label) {
  if (!Array.isArray(value) || value.length !== length ||
      value.some(n => !Number.isSafeInteger(n) || n < 0 || n > maximum)) throw new Error(`${label} inválidos`);
  return [...value];
}

function counters(value, maxKeys, maxValue) {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Datos inválidos');
  const entries = Object.entries(value);
  if (entries.length > maxKeys) throw new Error('Demasiados datos');
  const result = Object.create(null);
  for (const [key, n] of entries) {
    if (!key || key.length > 80 || key === '__proto__' || !Number.isSafeInteger(n) || n < 0 || n > maxValue) throw new Error('Datos inválidos');
    if (n) result[key] = n;
  }
  return result;
}

export function cleanProgress(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Progreso inválido');
  const stars = boundedArray(value.stars ?? zeroes(), 8, 3, 'Estrellas');
  const best = boundedArray(value.best ?? zeroes(), 8, 100000000, 'Puntos');
  const diff = value.diff ?? 'normal';
  if (!['tranqui', 'normal', 'turbo'].includes(diff)) throw new Error('Dificultad inválida');
  const sheets = value.sheets ?? [];
  if (!Array.isArray(sheets) || sheets.length > 12 || sheets.some(s => !sheetIds.has(s))) throw new Error('Hojas inválidas');
  const avs = value.avs ?? [];
  if (!Array.isArray(avs) || avs.length > 2 || avs.some(n => !Number.isInteger(n) || n < 0 || n > 5)) throw new Error('Personajes inválidos');
  const hubPos = value.hubPos ?? null;
  if (hubPos !== null && (!Array.isArray(hubPos) || hubPos.length !== 2 || hubPos.some(n => !Number.isFinite(n) || Math.abs(n) > 100000))) throw new Error('Posición inválida');
  return { stars, best, miss: counters(value.miss, 500, 6), diff,
    seenIntro: value.seenIntro === true, seen: counters(value.seen, 100, 1),
    sheets: [...new Set(sheets)], hubPos: hubPos && [...hubPos], avs: [...avs] };
}

function highMap(a, b) {
  const result = { ...b };
  for (const [key, n] of Object.entries(a)) result[key] = Math.max(n, result[key] || 0);
  return result;
}

export function mergeProgress(local, remote) {
  const a = cleanProgress(local), b = cleanProgress(remote);
  return { stars: a.stars.map((n, i) => Math.max(n, b.stars[i])),
    best: a.best.map((n, i) => Math.max(n, b.best[i])),
    miss: highMap(a.miss, b.miss), diff: a.diff,
    seenIntro: a.seenIntro || b.seenIntro, seen: highMap(a.seen, b.seen),
    sheets: [...new Set([...a.sheets, ...b.sheets])],
    hubPos: a.hubPos || b.hubPos, avs: a.avs.length ? a.avs : b.avs };
}

export function preserveAchievements(incoming, stored) {
  const a = cleanProgress(incoming), b = cleanProgress(stored);
  return { ...a,
    stars: a.stars.map((n, i) => Math.max(n, b.stars[i])),
    best: a.best.map((n, i) => Math.max(n, b.best[i])),
    seenIntro: a.seenIntro || b.seenIntro,
    seen: highMap(a.seen, b.seen),
    sheets: [...new Set([...a.sheets, ...b.sheets])] };
}
