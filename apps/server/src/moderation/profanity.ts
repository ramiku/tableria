/**
 * Filtro de lenguaje propio (sin dependencia externa, igual que el resto del proyecto):
 * lista curada ES+EN de insultos/lenguaje agresivo habitual en chats de partidas. No
 * pretende ser exhaustivo — cubre los casos claros; los límites de palabra evitan falsos
 * positivos con substrings inocentes (p.ej. "clasico" no contiene "asco" como palabra).
 */
const BLOCKLIST = [
  // Español
  'gilipollas',
  'imbecil',
  'idiota',
  'estupido',
  'estupida',
  'subnormal',
  'retrasado',
  'retrasada',
  'cabron',
  'cabrona',
  'hijoputa',
  'hijodeputa',
  'puta',
  'puto',
  'maricon',
  'zorra',
  'mierda',
  'joder',
  'capullo',
  'panda de mierda',
  'tonto del culo',
  // English
  'idiot',
  'moron',
  'stupid',
  'retard',
  'retarded',
  'asshole',
  'bastard',
  'bitch',
  'bullshit',
  'fuck',
  'fucker',
  'fucking',
  'shit',
  'cunt',
  'dumbass',
  'motherfucker',
];

/** @, 0, 1, 3, $, 4, 7 → letras equivalentes — trampeo básico tipo "put4" o "sh1t". */
const LEET_MAP: Record<string, string> = {
  '@': 'a',
  '4': 'a',
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '$': 's',
  '5': 's',
  '7': 't',
};

function normalize(text: string): string {
  const leeted = text
    .toLowerCase()
    .split('')
    .map((ch) => LEET_MAP[ch] ?? ch)
    .join('');
  // Quita acentos (NFD + strip de marcas diacríticas U+0300-U+036F) para que "estúpido" y
  // "estupido" cacen igual.
  return leeted.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const BLOCKLIST_PATTERN = new RegExp(`\\b(${BLOCKLIST.map((w) => w.replace(/\s+/g, '\\s+')).join('|')})\\b`, 'i');

export function containsProfanity(text: string): boolean {
  return BLOCKLIST_PATTERN.test(normalize(text));
}
