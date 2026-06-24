/**
 * ChineseEngine — Chinese zodiac, element, BaZi Four Pillars.
 * Uses simplified deterministic calculation (lunar year approximation).
 * Time-dependent pillar needs birth_time; returns flag if missing.
 */

export interface ChineseInput {
  birthDate: Date;
  birthTime?: string | null; // HH:MM
}

export interface Pillar {
  stem: string;
  branch: string;
  stemElement: string;
  branchAnimal: string;
}

export interface ChineseOutput {
  animal: string;
  animalEmoji: string;
  element: string;
  yinYang: "Yin" | "Yang";
  fourPillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null; // null if birth time unknown
  };
  hourPillarMissing: boolean;
}

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const STEM_ELEMENTS = ["Wood", "Wood", "Fire", "Fire", "Earth", "Earth", "Metal", "Metal", "Water", "Water"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const BRANCH_ANIMALS = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
const BRANCH_EMOJIS: Record<string, string> = {
  Rat:"🐀", Ox:"🐂", Tiger:"🐅", Rabbit:"🐇", Dragon:"🐉", Snake:"🐍",
  Horse:"🐎", Goat:"🐐", Monkey:"🐒", Rooster:"🐓", Dog:"🐕", Pig:"🐖",
};

// Simplified: year pillar based on sexagenary cycle
// Chinese year starts around Feb 4 (Li Chun). Approximation for prototype.
function getYearPillar(year: number): Pillar {
  // The sexagenary cycle: stem index = (year - 4) % 10, branch index = (year - 4) % 12
  const stemIdx = ((year - 4) % 10 + 10) % 10;
  const branchIdx = ((year - 4) % 12 + 12) % 12;
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    stemElement: STEM_ELEMENTS[stemIdx],
    branchAnimal: BRANCH_ANIMALS[branchIdx],
  };
}

function getMonthPillar(year: number, month: number): Pillar {
  // Month stem based on year stem
  const yearStemIdx = ((year - 4) % 10 + 10) % 10;
  const monthStemBase = (yearStemIdx * 2) % 10;
  // Chinese month index: 0 = Feb (寅), 1 = Mar (卯), etc.
  // Simplified: month 0 = January, map to Chinese month
  const chineseMonth = month; // 0-indexed
  const monthStemIdx = (monthStemBase + chineseMonth) % 10;
  const monthBranchIdx = (chineseMonth + 2) % 12; //寅 starts at month index 2 (Feb)
  return {
    stem: STEMS[monthStemIdx],
    branch: BRANCHES[monthBranchIdx],
    stemElement: STEM_ELEMENTS[monthStemIdx],
    branchAnimal: BRANCH_ANIMALS[monthBranchIdx],
  };
}

function getDayPillar(date: Date): Pillar {
  // Simplified: day-based calculation using known epoch
  const epoch = new Date(1900, 0, 31);
  const days = Math.floor((date.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
  const stemIdx = ((days + 0) % 10 + 10) % 10;
  const branchIdx = ((days + 0) % 12 + 12) % 12;
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    stemElement: STEM_ELEMENTS[stemIdx],
    branchAnimal: BRANCH_ANIMALS[branchIdx],
  };
}

function getHourPillar(dayStemIdx: number, hour: number): Pillar | null {
  // Hour branch: 2-hour blocks starting at 23:00 = Rat hour
  const branchIdx = Math.floor(((hour + 1) % 24) / 2);
  const hourStemBase = (dayStemIdx * 2) % 10;
  const stemIdx = (hourStemBase + branchIdx) % 10;
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    stemElement: STEM_ELEMENTS[stemIdx],
    branchAnimal: BRANCH_ANIMALS[branchIdx],
  };
}

export function computeChinese(input: ChineseInput): ChineseOutput {
  const { birthDate, birthTime } = input;

  const yearPillar = getYearPillar(birthDate.getFullYear());
  const monthPillar = getMonthPillar(birthDate.getFullYear(), birthDate.getMonth());
  const dayPillar = getDayPillar(birthDate);

  let hourPillar: Pillar | null = null;
  let hourPillarMissing = true;

  if (birthTime) {
    const [h] = birthTime.split(":").map(Number);
    if (!isNaN(h)) {
      const dayStemIdx = STEMS.indexOf(dayPillar.stem);
      hourPillar = getHourPillar(dayStemIdx, h);
      hourPillarMissing = false;
    }
  }

  return {
    animal: yearPillar.branchAnimal,
    animalEmoji: BRANCH_EMOJIS[yearPillar.branchAnimal] ?? "🐉",
    element: yearPillar.stemElement,
    yinYang: STEMS.indexOf(yearPillar.stem) % 2 === 0 ? "Yang" : "Yin",
    fourPillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    },
    hourPillarMissing,
  };
}
