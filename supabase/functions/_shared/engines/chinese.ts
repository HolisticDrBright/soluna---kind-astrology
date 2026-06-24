// ChineseEngine — zodiac animal + element + yin/yang, and BaZi Four Pillars.
// Built on lunar-typescript (MIT), which handles the lunisolar calendar + solar
// terms correctly. We map its Chinese Gan/Zhi output to English for the app.

import { Solar } from "lunar-typescript";
import type {
  BaZiPillar,
  ChineseAnimal,
  ChineseDaily,
  ChineseElement,
  ChineseResult,
} from "./types.ts";

// Heavenly Stems (天干): element + polarity.
const STEM: Record<string, { element: ChineseElement; yinYang: "Yin" | "Yang" }> = {
  "甲": { element: "Wood", yinYang: "Yang" },
  "乙": { element: "Wood", yinYang: "Yin" },
  "丙": { element: "Fire", yinYang: "Yang" },
  "丁": { element: "Fire", yinYang: "Yin" },
  "戊": { element: "Earth", yinYang: "Yang" },
  "己": { element: "Earth", yinYang: "Yin" },
  "庚": { element: "Metal", yinYang: "Yang" },
  "辛": { element: "Metal", yinYang: "Yin" },
  "壬": { element: "Water", yinYang: "Yang" },
  "癸": { element: "Water", yinYang: "Yin" },
};

// Earthly Branches (地支) -> zodiac animal.
const BRANCH: Record<string, ChineseAnimal> = {
  "子": "Rat", "丑": "Ox", "寅": "Tiger", "卯": "Rabbit", "辰": "Dragon", "巳": "Snake",
  "午": "Horse", "未": "Goat", "申": "Monkey", "酉": "Rooster", "戌": "Dog", "亥": "Pig",
};

function stemElement(gan: string): ChineseElement {
  return STEM[gan]?.element ?? "Earth";
}

function branchAnimal(zhi: string): ChineseAnimal {
  return BRANCH[zhi] ?? "Rat";
}

export function computeChinese(birthDate: string, birthTime: string | null): ChineseResult {
  const [y, m, d] = birthDate.split("-").map(Number);
  // If time is unknown, compute pillars at local noon to avoid the BaZi
  // day-rollover ambiguity around the 子 hour (23:00). The hour pillar is then
  // flagged as unavailable.
  let hh = 12, mm = 0;
  const hourPillarKnown = !!birthTime;
  if (birthTime) {
    const [h, min] = birthTime.split(":").map(Number);
    hh = h;
    mm = min ?? 0;
  }

  const lunar = Solar.fromYmdHms(y, m, d, hh, mm, 0).getLunar();
  const ec = lunar.getEightChar();

  const pillars: BaZiPillar[] = [
    { pillar: "year", heavenlyStem: ec.getYearGan(), earthlyBranch: branchAnimal(ec.getYearZhi()), element: stemElement(ec.getYearGan()) },
    { pillar: "month", heavenlyStem: ec.getMonthGan(), earthlyBranch: branchAnimal(ec.getMonthZhi()), element: stemElement(ec.getMonthGan()) },
    { pillar: "day", heavenlyStem: ec.getDayGan(), earthlyBranch: branchAnimal(ec.getDayZhi()), element: stemElement(ec.getDayGan()) },
  ];
  if (hourPillarKnown) {
    pillars.push({
      pillar: "hour",
      heavenlyStem: ec.getTimeGan(),
      earthlyBranch: branchAnimal(ec.getTimeZhi()),
      element: stemElement(ec.getTimeGan()),
    });
  }

  const animal = branchAnimal(ec.getYearZhi());
  const element = stemElement(ec.getYearGan());
  const yinYang = STEM[ec.getYearGan()]?.yinYang ?? "Yang";

  return {
    animal,
    element,
    yinYang,
    elementAnimalLabel: `${element} ${animal}`,
    bazi: pillars,
    hourPillarKnown,
  };
}

/** Chinese daily energy (animal + element) for any date — used by the reading. */
export function chineseDaily(forDate: string): ChineseDaily {
  const [y, m, d] = forDate.split("-").map(Number);
  const lunar = Solar.fromYmd(y, m, d).getLunar();
  const ganZhi = lunar.getDayInGanZhi(); // e.g. "己巳"
  const gan = ganZhi.charAt(0);
  const zhi = ganZhi.charAt(1);
  return { animal: branchAnimal(zhi), element: stemElement(gan) };
}
