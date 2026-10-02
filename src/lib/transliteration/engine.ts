export type LetterMapping = {
    name: string;
    isolated: string;
    initial: string;
    medial: string;
    final: string;
    latin: string;
    alts?: string[];
    family?: string;
    note?: string;
};
export const SHORT_VOWELS: Record<string, string> = {
    "\u064E": "a",
    "\u064F": "u",
    "\u0650": "i",
};
export const TANWEEN: Record<string, string> = {
    "\u064B": "an",
    "\u064C": "un",
    "\u064D": "in",
};
export const SUKUN = "\u0652";
export const SHADDA = "\u0651";
export const TATWEEL = "\u0640";
export const LETTERS: LetterMapping[] = [
    {
        name: "alif",
        isolated: "ا",
        initial: "ا",
        medial: "ـا",
        final: "ـا",
        latin: "ā",
        alts: ["a", "aa"],
        note: "Often a long 'aa' sound; sometimes silent as a seat for hamza.",
    },
    {
        name: "ba",
        isolated: "ب",
        initial: "بـ",
        medial: "ـبـ",
        final: "ـب",
        latin: "b",
        family: "ba",
    },
    {
        name: "ta",
        isolated: "ت",
        initial: "تـ",
        medial: "ـتـ",
        final: "ـت",
        latin: "t",
        family: "ba",
    },
    {
        name: "tha",
        isolated: "ث",
        initial: "ثـ",
        medial: "ـثـ",
        final: "ـث",
        latin: "th",
        family: "ba",
        note: "Like English 'th' in think.",
    },
    {
        name: "jim",
        isolated: "ج",
        initial: "جـ",
        medial: "ـجـ",
        final: "ـج",
        latin: "j",
        family: "jim",
    },
    {
        name: "ha",
        isolated: "ح",
        initial: "حـ",
        medial: "ـحـ",
        final: "ـح",
        latin: "ḥ",
        alts: ["h", "H"],
        family: "jim",
        note: "A deeper 'h' from the throat. We write it as ḥ.",
    },
    {
        name: "kha",
        isolated: "خ",
        initial: "خـ",
        medial: "ـخـ",
        final: "ـخ",
        latin: "kh",
        family: "jim",
        note: "Like the 'ch' in Scottish loch. Notice the dot above.",
    },
    {
        name: "dal",
        isolated: "د",
        initial: "د",
        medial: "ـد",
        final: "ـد",
        latin: "d",
        family: "dal",
    },
    {
        name: "dhal",
        isolated: "ذ",
        initial: "ذ",
        medial: "ـذ",
        final: "ـذ",
        latin: "dh",
        family: "dal",
        note: "Like English 'th' in this. One dot above dal.",
    },
    {
        name: "ra",
        isolated: "ر",
        initial: "ر",
        medial: "ـر",
        final: "ـر",
        latin: "r",
        family: "ra",
    },
    {
        name: "zay",
        isolated: "ز",
        initial: "ز",
        medial: "ـز",
        final: "ـز",
        latin: "z",
        family: "ra",
    },
    {
        name: "sin",
        isolated: "س",
        initial: "سـ",
        medial: "ـسـ",
        final: "ـس",
        latin: "s",
        family: "sin",
    },
    {
        name: "shin",
        isolated: "ش",
        initial: "شـ",
        medial: "ـشـ",
        final: "ـش",
        latin: "sh",
        family: "sin",
        note: "Three dots on top. Sounds like English 'sh'.",
    },
    {
        name: "sad",
        isolated: "ص",
        initial: "صـ",
        medial: "ـصـ",
        final: "ـص",
        latin: "ṣ",
        alts: ["s", "S"],
        family: "sad",
        note: "A heavier 's'. We write it as ṣ.",
    },
    {
        name: "dad",
        isolated: "ض",
        initial: "ضـ",
        medial: "ـضـ",
        final: "ـض",
        latin: "ḍ",
        alts: ["d", "D"],
        family: "sad",
        note: "A heavier 'd'. Dot above ṣād shape.",
    },
    {
        name: "ta_emphatic",
        isolated: "ط",
        initial: "طـ",
        medial: "ـطـ",
        final: "ـط",
        latin: "ṭ",
        alts: ["t", "T"],
        family: "ta_emph",
        note: "A heavier 't'. We write it as ṭ.",
    },
    {
        name: "za_emphatic",
        isolated: "ظ",
        initial: "ظـ",
        medial: "ـظـ",
        final: "ـظ",
        latin: "ẓ",
        alts: ["z", "Z", "dh"],
        family: "ta_emph",
        note: "A heavier 'dh/z'. Dot above ṭāʾ shape.",
    },
    {
        name: "ayn",
        isolated: "ع",
        initial: "عـ",
        medial: "ـعـ",
        final: "ـع",
        latin: "ʿ",
        alts: ["'", "a", "3"],
        family: "ayn",
        note: "A throaty catch. We write it as ʿ.",
    },
    {
        name: "ghayn",
        isolated: "غ",
        initial: "غـ",
        medial: "ـغـ",
        final: "ـغ",
        latin: "gh",
        family: "ayn",
        note: "Like a soft French 'r'. Dot above ʿayn.",
    },
    {
        name: "fa",
        isolated: "ف",
        initial: "فـ",
        medial: "ـفـ",
        final: "ـف",
        latin: "f",
        family: "fa",
    },
    {
        name: "qaf",
        isolated: "ق",
        initial: "قـ",
        medial: "ـقـ",
        final: "ـق",
        latin: "q",
        family: "fa",
        note: "A deeper 'k' from the back of the throat. Two dots.",
    },
    {
        name: "kaf",
        isolated: "ك",
        initial: "كـ",
        medial: "ـكـ",
        final: "ـك",
        latin: "k",
    },
    {
        name: "lam",
        isolated: "ل",
        initial: "لـ",
        medial: "ـلـ",
        final: "ـل",
        latin: "l",
    },
    {
        name: "mim",
        isolated: "م",
        initial: "مـ",
        medial: "ـمـ",
        final: "ـم",
        latin: "m",
    },
    {
        name: "nun",
        isolated: "ن",
        initial: "نـ",
        medial: "ـنـ",
        final: "ـن",
        latin: "n",
    },
    {
        name: "ha_light",
        isolated: "ه",
        initial: "هـ",
        medial: "ـهـ",
        final: "ـه",
        latin: "h",
    },
    {
        name: "waw",
        isolated: "و",
        initial: "و",
        medial: "ـو",
        final: "ـو",
        latin: "w",
        alts: ["ū", "uu", "u", "o"],
        note: "Consonant 'w', or long 'uu' after a damma.",
    },
    {
        name: "ya",
        isolated: "ي",
        initial: "يـ",
        medial: "ـيـ",
        final: "ـي",
        latin: "y",
        alts: ["ī", "ii", "i", "ee"],
        note: "Consonant 'y', or long 'ii' after a kasra.",
    },
    {
        name: "taa_marbuta",
        isolated: "ة",
        initial: "ة",
        medial: "ة",
        final: "ـة",
        latin: "a",
        alts: ["ah", "at", "h"],
        note: "Usually 'a/ah' at the end of a word; 'at' when linked.",
    },
    {
        name: "alif_maqsurah",
        isolated: "ى",
        initial: "ى",
        medial: "ى",
        final: "ـى",
        latin: "ā",
        alts: ["a", "aa"],
        note: "Looks like ya without dots — usually a long 'aa' at word end.",
    },
    {
        name: "hamza",
        isolated: "ء",
        initial: "ء",
        medial: "ء",
        final: "ء",
        latin: "ʾ",
        alts: ["'", "a"],
        note: "A brief glottal stop. We write it as ʾ.",
    },
];
const byIsolated = new Map(LETTERS.map((l) => [l.isolated, l]));
const byName = new Map(LETTERS.map((l) => [l.name, l]));
export function getLetter(nameOrChar: string): LetterMapping | undefined {
    return byName.get(nameOrChar) ?? byIsolated.get(nameOrChar);
}
export function latinForLetter(char: string): string | undefined {
    return byIsolated.get(char)?.latin;
}
export function normalizeAnswer(input: string): string {
    return input
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/ā/g, "aa")
        .replace(/ī/g, "ii")
        .replace(/ū/g, "uu")
        .replace(/ḥ/g, "h")
        .replace(/ṣ/g, "s")
        .replace(/ḍ/g, "d")
        .replace(/ṭ/g, "t")
        .replace(/ẓ/g, "z")
        .replace(/ʿ/g, "")
        .replace(/ʾ/g, "")
        .replace(/'|ʼ|ˈ/g, "")
        .replace(/-/g, "");
}
export type Token = {
    kind: "consonant";
    char: string;
    letter: LetterMapping;
    latin: string;
} | {
    kind: "vowel";
    char: string;
    latin: string;
} | {
    kind: "tanween";
    char: string;
    latin: string;
} | {
    kind: "sukun";
    char: string;
} | {
    kind: "shadda";
    char: string;
} | {
    kind: "unknown";
    char: string;
};
const DIACRITICS = new Set([
    ...Object.keys(SHORT_VOWELS),
    ...Object.keys(TANWEEN),
    SUKUN,
    SHADDA,
    TATWEEL,
    "\u0670",
]);
export function tokenize(arabic: string): Token[] {
    const tokens: Token[] = [];
    for (const char of arabic) {
        if (char === TATWEEL || char === " ")
            continue;
        if (SHORT_VOWELS[char]) {
            tokens.push({ kind: "vowel", char, latin: SHORT_VOWELS[char] });
            continue;
        }
        if (TANWEEN[char]) {
            tokens.push({ kind: "tanween", char, latin: TANWEEN[char] });
            continue;
        }
        if (char === SUKUN) {
            tokens.push({ kind: "sukun", char });
            continue;
        }
        if (char === SHADDA) {
            tokens.push({ kind: "shadda", char });
            continue;
        }
        const letter = byIsolated.get(char);
        if (letter) {
            tokens.push({
                kind: "consonant",
                char,
                letter,
                latin: letter.latin,
            });
            continue;
        }
        const stripped = char;
        const found = LETTERS.find((l) => l.isolated === stripped ||
            l.initial.replace(TATWEEL, "") === stripped ||
            l.medial.replace(TATWEEL, "") === stripped ||
            l.final.replace(TATWEEL, "") === stripped);
        if (found) {
            tokens.push({
                kind: "consonant",
                char,
                letter: found,
                latin: found.latin,
            });
            continue;
        }
        if (!DIACRITICS.has(char)) {
            tokens.push({ kind: "unknown", char });
        }
    }
    return tokens;
}
export function transliterate(arabic: string): string {
    const tokens = tokenize(arabic);
    let out = "";
    let i = 0;
    while (i < tokens.length) {
        const t = tokens[i];
        if (t.kind === "consonant") {
            const next = tokens[i + 1];
            const after = tokens[i + 2];
            if (next?.kind === "shadda") {
                const vowel = after?.kind === "vowel"
                    ? after.latin
                    : after?.kind === "tanween"
                        ? after.latin
                        : "";
                const base = simplifyLatin(t.latin);
                out += base + base + vowel;
                i += after?.kind === "vowel" || after?.kind === "tanween" ? 3 : 2;
                continue;
            }
            if (next?.kind === "vowel") {
                const third = tokens[i + 2];
                if (next.latin === "a" &&
                    third?.kind === "consonant" &&
                    (third.letter.name === "alif" || third.letter.name === "alif_maqsurah")) {
                    out += simplifyLatin(t.latin) + "aa";
                    i += 3;
                    continue;
                }
                if (next.latin === "u" &&
                    third?.kind === "consonant" &&
                    third.letter.name === "waw") {
                    const fourth = tokens[i + 3];
                    if (!fourth || fourth.kind !== "vowel") {
                        out += simplifyLatin(t.latin) + "uu";
                        i += 3;
                        continue;
                    }
                }
                if (next.latin === "i" &&
                    third?.kind === "consonant" &&
                    third.letter.name === "ya") {
                    const fourth = tokens[i + 3];
                    if (!fourth || fourth.kind !== "vowel") {
                        out += simplifyLatin(t.latin) + "ii";
                        i += 3;
                        continue;
                    }
                }
                out += simplifyLatin(t.latin) + next.latin;
                i += 2;
                continue;
            }
            if (next?.kind === "tanween") {
                out += simplifyLatin(t.latin) + next.latin;
                i += 2;
                continue;
            }
            if (next?.kind === "sukun") {
                out += simplifyLatin(t.latin);
                i += 2;
                continue;
            }
            if (t.letter.name === "alif") {
                out += "aa";
            }
            else if (t.letter.name === "taa_marbuta") {
                out += "a";
            }
            else {
                out += simplifyLatin(t.latin);
            }
            i += 1;
            continue;
        }
        if (t.kind === "vowel") {
            out += t.latin;
            i += 1;
            continue;
        }
        if (t.kind === "tanween") {
            out += t.latin;
            i += 1;
            continue;
        }
        i += 1;
    }
    return out;
}
function simplifyLatin(latin: string): string {
    const map: Record<string, string> = {
        ā: "aa",
        ī: "ii",
        ū: "uu",
        ḥ: "h",
        ṣ: "s",
        ḍ: "d",
        ṭ: "t",
        ẓ: "z",
        ʿ: "",
        ʾ: "",
    };
    return map[latin] ?? latin;
}
export type ValidationResult = {
    correct: boolean;
    normalizedUser: string;
    normalizedExpected: string[];
    feedback?: string;
};
export function validateAnswer(arabic: string | null | undefined, userAnswer: string, acceptedAnswers: string[]): ValidationResult {
    const normalizedUser = normalizeAnswer(userAnswer);
    const expected = [
        ...acceptedAnswers,
        ...(arabic ? [transliterate(arabic)] : []),
    ].map(normalizeAnswer);
    const uniqueExpected = [...new Set(expected.filter(Boolean))];
    const correct = uniqueExpected.includes(normalizedUser);
    return {
        correct,
        normalizedUser,
        normalizedExpected: uniqueExpected,
    };
}
export function syllable(consonant: string, vowelMark: string): {
    arabic: string;
    latin: string;
} {
    const letter = byIsolated.get(consonant);
    const v = SHORT_VOWELS[vowelMark];
    if (!letter || !v) {
        throw new Error(`Invalid syllable: ${consonant}+${vowelMark}`);
    }
    return {
        arabic: consonant + vowelMark,
        latin: simplifyLatin(letter.latin) + v,
    };
}
export function diacriticLatin(mark: string): string | undefined {
    return SHORT_VOWELS[mark] ?? TANWEEN[mark];
}
export const DIACRITIC_INFO = [
    { char: "َ", name: "fatha", latin: "a", description: "Short 'a' sound above the letter." },
    { char: "ِ", name: "kasra", latin: "i", description: "Short 'i' sound below the letter." },
    { char: "ُ", name: "damma", latin: "u", description: "Short 'u' sound above the letter." },
    { char: "ْ", name: "sukun", latin: "", description: "No vowel — the consonant stands alone." },
    { char: "ّ", name: "shadda", latin: "(double)", description: "Double the consonant sound." },
] as const;
