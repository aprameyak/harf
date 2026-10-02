import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { LETTERS, syllable } from "../src/lib/transliteration/engine";
const prisma = new PrismaClient();
type ExInput = {
    type: string;
    promptArabic?: string;
    promptLatin?: string;
    promptText?: string;
    correctAnswers: string[];
    distractors?: string[];
    tokens?: string[];
    options?: string[];
    explanation?: string;
    hint?: string;
    difficulty?: number;
    conceptKeys: string[];
    metadata?: Record<string, unknown>;
};
async function ensureConcept(data: {
    key: string;
    kind: string;
    title: string;
    arabic?: string;
    latin?: string;
    description?: string;
    letterId?: string;
}) {
    return prisma.concept.upsert({
        where: { key: data.key },
        update: {
            title: data.title,
            arabic: data.arabic,
            latin: data.latin,
            description: data.description,
            letterId: data.letterId,
        },
        create: data,
    });
}
async function createExercises(lessonId: string, exercises: ExInput[], conceptMap: Map<string, string>) {
    for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        const conceptIds = ex.conceptKeys
            .map((k) => conceptMap.get(k))
            .filter(Boolean) as string[];
        await prisma.exercise.create({
            data: {
                lessonId,
                type: ex.type,
                promptArabic: ex.promptArabic,
                promptLatin: ex.promptLatin,
                promptText: ex.promptText,
                correctAnswers: JSON.stringify(ex.correctAnswers),
                distractors: ex.distractors ? JSON.stringify(ex.distractors) : null,
                tokens: ex.tokens ? JSON.stringify(ex.tokens) : null,
                options: ex.options ? JSON.stringify(ex.options) : null,
                explanation: ex.explanation,
                hint: ex.hint,
                difficulty: ex.difficulty ?? 1,
                order: i,
                conceptIds: JSON.stringify(conceptIds),
                metadata: ex.metadata ? JSON.stringify(ex.metadata) : null,
            },
        });
    }
}
async function main() {
    console.log("Seeding Harf…");
    await prisma.analyticsEvent.deleteMany();
    await prisma.exerciseAttempt.deleteMany();
    await prisma.reviewQueueItem.deleteMany();
    await prisma.userConceptMastery.deleteMany();
    await prisma.userLessonProgress.deleteMany();
    await prisma.userAchievement.deleteMany();
    await prisma.lessonConcept.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.unit.deleteMany();
    await prisma.course.deleteMany();
    await prisma.letterForm.deleteMany();
    await prisma.concept.deleteMany();
    await prisma.arabicLetter.deleteMany();
    await prisma.readingRule.deleteMany();
    await prisma.achievement.deleteMany();
    const letterRecords = [];
    for (let i = 0; i < LETTERS.length; i++) {
        const L = LETTERS[i];
        const letter = await prisma.arabicLetter.create({
            data: {
                name: L.name,
                isolated: L.isolated,
                initial: L.initial,
                medial: L.medial,
                final: L.final,
                latin: L.latin,
                latinAlts: L.alts ? JSON.stringify(L.alts) : null,
                family: L.family,
                familyOrder: 0,
                order: i,
                difficulty: L.family ? 2 : 1,
                note: L.note,
                forms: {
                    create: [
                        { form: "isolated", glyph: L.isolated },
                        { form: "initial", glyph: L.initial },
                        { form: "medial", glyph: L.medial },
                        { form: "final", glyph: L.final },
                    ],
                },
            },
        });
        letterRecords.push(letter);
    }
    const letterByName = new Map(letterRecords.map((l) => [l.name, l]));
    const conceptMap = new Map<string, string>();
    for (const letter of letterRecords) {
        for (const form of ["isolated", "initial", "medial", "final"] as const) {
            const key = `letter:${letter.name}:${form}`;
            const c = await ensureConcept({
                key,
                kind: "letter_form",
                title: `${letter.name} (${form})`,
                arabic: letter[form],
                latin: letter.latin,
                letterId: letter.id,
            });
            conceptMap.set(key, c.id);
        }
        const base = await ensureConcept({
            key: `letter:${letter.name}`,
            kind: "letter",
            title: letter.name,
            arabic: letter.isolated,
            latin: letter.latin,
            letterId: letter.id,
            description: letter.note ?? undefined,
        });
        conceptMap.set(`letter:${letter.name}`, base.id);
    }
    const diacritics = [
        { key: "diacritic:fatha", title: "Fatha (a)", arabic: "َ", latin: "a" },
        { key: "diacritic:kasra", title: "Kasra (i)", arabic: "ِ", latin: "i" },
        { key: "diacritic:damma", title: "Damma (u)", arabic: "ُ", latin: "u" },
        { key: "diacritic:sukun", title: "Sukun", arabic: "ْ", latin: "" },
        { key: "diacritic:shadda", title: "Shadda", arabic: "ّ", latin: "double" },
    ];
    for (const d of diacritics) {
        const c = await ensureConcept({
            key: d.key,
            kind: "diacritic",
            title: d.title,
            arabic: d.arabic,
            latin: d.latin,
        });
        conceptMap.set(d.key, c.id);
    }
    await prisma.readingRule.createMany({
        data: [
            {
                key: "short_vowels",
                title: "Short vowels",
                description: "Marks above/below letters give short a, i, or u.",
                stage: 4,
                examples: JSON.stringify([
                    { ar: "بَ", la: "ba" },
                    { ar: "بِ", la: "bi" },
                    { ar: "بُ", la: "bu" },
                ]),
            },
            {
                key: "connected_forms",
                title: "Connected forms",
                description: "Most letters change shape at the start, middle, or end of a word.",
                stage: 3,
                examples: JSON.stringify([
                    { ar: "ب", la: "b (isolated)" },
                    { ar: "بـ", la: "b (initial)" },
                ]),
            },
        ],
    });
    await prisma.achievement.createMany({
        data: [
            { key: "first_letter", title: "First Letter", description: "Learned your first Arabic letter.", icon: "sparkles", xpReward: 20 },
            { key: "ten_letters", title: "10 Letters Mastered", description: "Mastered 10 Arabic letters.", icon: "award", xpReward: 50 },
            { key: "alphabet_master", title: "Alphabet Mastered", description: "Mastered the full Arabic alphabet.", icon: "trophy", xpReward: 200 },
            { key: "hundred_words", title: "100 Words Decoded", description: "Decoded 100 Arabic words.", icon: "book", xpReward: 75 },
            { key: "streak_7", title: "7-Day Streak", description: "Practiced 7 days in a row.", icon: "flame", xpReward: 40 },
            { key: "perfect_lesson", title: "Perfect Lesson", description: "Completed a lesson with no mistakes.", icon: "star", xpReward: 30 },
            { key: "connected_master", title: "Connected Letters Mastered", description: "Mastered connected letter forms.", icon: "link", xpReward: 60 },
        ],
    });
    const course = await prisma.course.create({
        data: {
            slug: "arabic-reading",
            title: "Arabic Reading",
            description: "Learn to decode Arabic script into Latin sounds — from first letters to full passages.",
            order: 0,
            published: true,
        },
    });
    const unit1 = await prisma.unit.create({
        data: {
            courseId: course.id,
            slug: "letters-i",
            title: "Letters I",
            description: "Meet your first Arabic letters: shapes that look nothing alike.",
            stage: 1,
            order: 0,
            published: true,
        },
    });
    const l1 = await prisma.lesson.create({
        data: {
            unitId: unit1.id,
            slug: "ba-and-mim",
            title: "ب and م",
            description: "Two clear shapes: ba (b) and mim (m).",
            order: 0,
            xpReward: 15,
            estimatedMin: 4,
            published: true,
        },
    });
    await prisma.lessonConcept.createMany({
        data: [
            { lessonId: l1.id, conceptId: conceptMap.get("letter:ba")! },
            { lessonId: l1.id, conceptId: conceptMap.get("letter:mim")! },
            { lessonId: l1.id, conceptId: conceptMap.get("letter:ba:isolated")! },
            { lessonId: l1.id, conceptId: conceptMap.get("letter:mim:isolated")! },
        ],
    });
    await createExercises(l1.id, [
        {
            type: "intro",
            promptArabic: "ب",
            promptText: "This is ba. It makes a b sound — like the b in book.",
            correctAnswers: ["continue"],
            conceptKeys: ["letter:ba", "letter:ba:isolated"],
            explanation: "One dot under a boat-shaped letter → b",
        },
        {
            type: "intro",
            promptArabic: "م",
            promptText: "This is mim. It makes an m sound — like the m in moon.",
            correctAnswers: ["continue"],
            conceptKeys: ["letter:mim", "letter:mim:isolated"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "ب",
            promptText: "What sound does this letter make?",
            correctAnswers: ["b"],
            distractors: ["m", "t", "n"],
            explanation: "ب = b  (one dot below)",
            conceptKeys: ["letter:ba", "letter:ba:isolated"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "م",
            promptText: "What sound does this letter make?",
            correctAnswers: ["m"],
            distractors: ["b", "n", "w"],
            explanation: "م = m",
            conceptKeys: ["letter:mim", "letter:mim:isolated"],
        },
        {
            type: "latin_to_arabic_mc",
            promptLatin: "b",
            promptText: "Which letter makes the b sound?",
            correctAnswers: ["ب"],
            options: ["ب", "م", "ت", "ن"],
            explanation: "ب = b",
            conceptKeys: ["letter:ba"],
        },
        {
            type: "matching",
            promptText: "Match each letter to its sound",
            correctAnswers: ["ب=b", "م=m"],
            options: ["ب", "م"],
            tokens: ["b", "m"],
            conceptKeys: ["letter:ba", "letter:mim"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "ب",
            promptText: "Quick check — this letter is…",
            correctAnswers: ["b"],
            distractors: ["m", "k", "l"],
            conceptKeys: ["letter:ba"],
        },
        {
            type: "speed_recognition",
            promptArabic: "م",
            promptText: "Tap the sound!",
            correctAnswers: ["m"],
            distractors: ["b", "n", "t"],
            conceptKeys: ["letter:mim"],
            metadata: { timeLimitMs: 8000 },
        },
    ], conceptMap);
    const l2 = await prisma.lesson.create({
        data: {
            unitId: unit1.id,
            slug: "ta-and-nun",
            title: "ت and ن",
            description: "Add ta (t) and nun (n) to your toolkit.",
            order: 1,
            xpReward: 15,
            estimatedMin: 4,
            published: true,
        },
    });
    await prisma.lessonConcept.createMany({
        data: [
            { lessonId: l2.id, conceptId: conceptMap.get("letter:ta")! },
            { lessonId: l2.id, conceptId: conceptMap.get("letter:nun")! },
        ],
    });
    await createExercises(l2.id, [
        {
            type: "intro",
            promptArabic: "ت",
            promptText: "This is ta. Two dots above — sound: t.",
            correctAnswers: ["continue"],
            conceptKeys: ["letter:ta"],
            explanation: "Same boat shape as ب, but two dots on top.",
        },
        {
            type: "intro",
            promptArabic: "ن",
            promptText: "This is nun. One dot above a curved shape — sound: n.",
            correctAnswers: ["continue"],
            conceptKeys: ["letter:nun"],
        },
        {
            type: "similar_letter",
            promptText: "Which letter makes the t sound?",
            promptLatin: "t",
            correctAnswers: ["ت"],
            options: ["ب", "ت", "ن"],
            explanation: "ت = t (two dots above). ب has one dot below.",
            conceptKeys: ["letter:ta", "letter:ba"],
            metadata: { family: "ba", highlight: "dots" },
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "ت",
            correctAnswers: ["t"],
            distractors: ["b", "th", "n"],
            explanation: "ت = t",
            conceptKeys: ["letter:ta"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "ن",
            correctAnswers: ["n"],
            distractors: ["m", "b", "t"],
            conceptKeys: ["letter:nun"],
        },
        {
            type: "latin_to_arabic_mc",
            promptLatin: "n",
            correctAnswers: ["ن"],
            options: ["م", "ن", "ب", "ت"],
            conceptKeys: ["letter:nun"],
        },
        {
            type: "matching",
            promptText: "Match the letters",
            correctAnswers: ["ت=t", "ن=n", "ب=b", "م=m"],
            options: ["ت", "ن", "ب", "م"],
            tokens: ["t", "n", "b", "m"],
            conceptKeys: ["letter:ta", "letter:nun", "letter:ba", "letter:mim"],
        },
        {
            type: "find_mistake",
            promptArabic: "ت",
            promptLatin: "b",
            promptText: "Is this transliteration correct?",
            correctAnswers: ["wrong"],
            explanation: "ت = t, not b. ب (one dot below) is b.",
            conceptKeys: ["letter:ta", "letter:ba"],
            metadata: { correction: "t" },
        },
    ], conceptMap);
    const l3 = await prisma.lesson.create({
        data: {
            unitId: unit1.id,
            slug: "kaf-and-lam",
            title: "ك and ل",
            description: "Learn kaf (k) and lam (l).",
            order: 2,
            xpReward: 15,
            estimatedMin: 4,
            published: true,
        },
    });
    await prisma.lessonConcept.createMany({
        data: [
            { lessonId: l3.id, conceptId: conceptMap.get("letter:kaf")! },
            { lessonId: l3.id, conceptId: conceptMap.get("letter:lam")! },
        ],
    });
    await createExercises(l3.id, [
        {
            type: "intro",
            promptArabic: "ك",
            promptText: "This is kaf — the k sound.",
            correctAnswers: ["continue"],
            conceptKeys: ["letter:kaf"],
        },
        {
            type: "intro",
            promptArabic: "ل",
            promptText: "This is lam — the l sound.",
            correctAnswers: ["continue"],
            conceptKeys: ["letter:lam"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "ك",
            correctAnswers: ["k"],
            distractors: ["l", "q", "m"],
            conceptKeys: ["letter:kaf"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "ل",
            correctAnswers: ["l"],
            distractors: ["k", "n", "b"],
            conceptKeys: ["letter:lam"],
        },
        {
            type: "matching",
            promptText: "Match all six letters so far",
            correctAnswers: ["ب=b", "ت=t", "م=m", "ن=n", "ك=k", "ل=l"],
            options: ["ب", "ت", "م", "ن", "ك", "ل"],
            tokens: ["b", "t", "m", "n", "k", "l"],
            conceptKeys: ["letter:ba", "letter:ta", "letter:mim", "letter:nun", "letter:kaf", "letter:lam"],
        },
        {
            type: "latin_to_arabic_mc",
            promptLatin: "k",
            correctAnswers: ["ك"],
            options: ["ك", "ل", "م", "ن"],
            conceptKeys: ["letter:kaf"],
        },
        {
            type: "speed_recognition",
            promptArabic: "ل",
            correctAnswers: ["l"],
            distractors: ["k", "n", "b"],
            conceptKeys: ["letter:lam"],
        },
    ], conceptMap);
    const l4 = await prisma.lesson.create({
        data: {
            unitId: unit1.id,
            slug: "letters-i-review",
            title: "Letters I Review",
            description: "Lock in ب ت م ن ك ل",
            order: 3,
            xpReward: 20,
            estimatedMin: 5,
            published: true,
        },
    });
    await createExercises(l4.id, [
        {
            type: "arabic_to_latin_mc",
            promptArabic: "ب",
            correctAnswers: ["b"],
            distractors: ["t", "n", "m"],
            conceptKeys: ["letter:ba"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "ت",
            correctAnswers: ["t"],
            distractors: ["b", "th", "n"],
            conceptKeys: ["letter:ta"],
        },
        {
            type: "similar_letter",
            promptText: "Find b",
            promptLatin: "b",
            correctAnswers: ["ب"],
            options: ["ب", "ت", "ن"],
            explanation: "ب has one dot below. ت has two above.",
            conceptKeys: ["letter:ba", "letter:ta"],
        },
        {
            type: "matching",
            promptText: "Match quickly",
            correctAnswers: ["ك=k", "ل=l", "م=m", "ن=n"],
            options: ["ك", "ل", "م", "ن"],
            tokens: ["k", "l", "m", "n"],
            conceptKeys: ["letter:kaf", "letter:lam", "letter:mim", "letter:nun"],
        },
        {
            type: "latin_to_arabic_mc",
            promptLatin: "m",
            correctAnswers: ["م"],
            options: ["م", "ن", "ب", "ل"],
            conceptKeys: ["letter:mim"],
        },
        {
            type: "find_mistake",
            promptArabic: "ن",
            promptLatin: "m",
            promptText: "Correct transliteration?",
            correctAnswers: ["wrong"],
            explanation: "ن = n. م = m.",
            conceptKeys: ["letter:nun", "letter:mim"],
            metadata: { correction: "n" },
        },
        {
            type: "speed_recognition",
            promptArabic: "ك",
            correctAnswers: ["k"],
            distractors: ["l", "q", "t"],
            conceptKeys: ["letter:kaf"],
        },
    ], conceptMap);
    const unit2 = await prisma.unit.create({
        data: {
            courseId: course.id,
            slug: "letters-ii",
            title: "Letters II",
            description: "Letter families — same shape, different dots.",
            stage: 2,
            order: 1,
            published: true,
        },
    });
    const l5 = await prisma.lesson.create({
        data: {
            unitId: unit2.id,
            slug: "ba-family",
            title: "The ب ت ث family",
            description: "One shape, different dots: b, t, th.",
            order: 0,
            xpReward: 18,
            estimatedMin: 5,
            published: true,
        },
    });
    await prisma.lessonConcept.createMany({
        data: [
            { lessonId: l5.id, conceptId: conceptMap.get("letter:tha")! },
            { lessonId: l5.id, conceptId: conceptMap.get("letter:ba")! },
            { lessonId: l5.id, conceptId: conceptMap.get("letter:ta")! },
        ],
    });
    await createExercises(l5.id, [
        {
            type: "intro",
            promptArabic: "ب ت ث",
            promptText: "Same boat shape. Dots tell them apart:\nب = b (1 below)\nت = t (2 above)\nث = th (3 above)",
            correctAnswers: ["continue"],
            conceptKeys: ["letter:ba", "letter:ta", "letter:tha"],
        },
        {
            type: "intro",
            promptArabic: "ث",
            promptText: "ث is tha — like th in think. Three dots on top.",
            correctAnswers: ["continue"],
            conceptKeys: ["letter:tha"],
        },
        {
            type: "similar_letter",
            promptText: "Which one is th?",
            promptLatin: "th",
            correctAnswers: ["ث"],
            options: ["ب", "ت", "ث"],
            explanation: "ث = th — three dots above.",
            conceptKeys: ["letter:tha"],
        },
        {
            type: "similar_letter",
            promptText: "Which one is t?",
            promptLatin: "t",
            correctAnswers: ["ت"],
            options: ["ب", "ت", "ث"],
            explanation: "ت = t — two dots above.",
            conceptKeys: ["letter:ta"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "ث",
            correctAnswers: ["th"],
            distractors: ["t", "b", "sh"],
            explanation: "ث = th",
            conceptKeys: ["letter:tha"],
        },
        {
            type: "matching",
            promptText: "Match the family",
            correctAnswers: ["ب=b", "ت=t", "ث=th"],
            options: ["ب", "ت", "ث"],
            tokens: ["b", "t", "th"],
            conceptKeys: ["letter:ba", "letter:ta", "letter:tha"],
        },
        {
            type: "find_mistake",
            promptArabic: "ث",
            promptLatin: "t",
            promptText: "Is this right?",
            correctAnswers: ["wrong"],
            explanation: "ث = th (3 dots). ت = t (2 dots).",
            conceptKeys: ["letter:tha", "letter:ta"],
            metadata: { correction: "th" },
        },
    ], conceptMap);
    const l6 = await prisma.lesson.create({
        data: {
            unitId: unit2.id,
            slug: "sin-shin",
            title: "س and ش",
            description: "s versus sh — watch the dots.",
            order: 1,
            xpReward: 15,
            estimatedMin: 4,
            published: true,
        },
    });
    await createExercises(l6.id, [
        {
            type: "intro",
            promptArabic: "س",
            promptText: "س is sin — the s sound. No dots.",
            correctAnswers: ["continue"],
            conceptKeys: ["letter:sin"],
        },
        {
            type: "intro",
            promptArabic: "ش",
            promptText: "ش is shin — sh like in ship. Three dots on top.",
            correctAnswers: ["continue"],
            conceptKeys: ["letter:shin"],
        },
        {
            type: "similar_letter",
            promptText: "Which letter is sh?",
            promptLatin: "sh",
            correctAnswers: ["ش"],
            options: ["س", "ش", "ث"],
            explanation: "ش = sh (three dots). س = s (no dots).",
            conceptKeys: ["letter:shin", "letter:sin"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "ش",
            correctAnswers: ["sh"],
            distractors: ["s", "th", "kh"],
            conceptKeys: ["letter:shin"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "س",
            correctAnswers: ["s"],
            distractors: ["sh", "z", "th"],
            conceptKeys: ["letter:sin"],
        },
        {
            type: "matching",
            promptText: "Match",
            correctAnswers: ["س=s", "ش=sh"],
            options: ["س", "ش"],
            tokens: ["s", "sh"],
            conceptKeys: ["letter:sin", "letter:shin"],
        },
    ], conceptMap);
    const unit3 = await prisma.unit.create({
        data: {
            courseId: course.id,
            slug: "connected-letters",
            title: "Connected Letters",
            description: "Letters change shape when they join.",
            stage: 3,
            order: 2,
            published: true,
        },
    });
    const l7 = await prisma.lesson.create({
        data: {
            unitId: unit3.id,
            slug: "ba-forms",
            title: "ب in all positions",
            description: "Recognize ba isolated, initial, medial, and final.",
            order: 0,
            xpReward: 18,
            estimatedMin: 5,
            published: true,
        },
    });
    await prisma.lessonConcept.createMany({
        data: [
            { lessonId: l7.id, conceptId: conceptMap.get("letter:ba:isolated")! },
            { lessonId: l7.id, conceptId: conceptMap.get("letter:ba:initial")! },
            { lessonId: l7.id, conceptId: conceptMap.get("letter:ba:medial")! },
            { lessonId: l7.id, conceptId: conceptMap.get("letter:ba:final")! },
        ],
    });
    await createExercises(l7.id, [
        {
            type: "intro",
            promptArabic: "ب  بـ  ـبـ  ـب",
            promptText: "ب changes shape depending on where it sits in a word — but it always has one dot below and still means b.",
            correctAnswers: ["continue"],
            conceptKeys: ["letter:ba:isolated", "letter:ba:initial", "letter:ba:medial", "letter:ba:final"],
        },
        {
            type: "connected_form",
            promptArabic: "بـ",
            promptText: "This is ba at the start of a word. What sound?",
            correctAnswers: ["b"],
            distractors: ["t", "n", "m"],
            explanation: "Initial بـ = b (dot below still there).",
            conceptKeys: ["letter:ba:initial"],
            metadata: { form: "initial", letter: "ba" },
        },
        {
            type: "connected_form",
            promptArabic: "ـبـ",
            promptText: "Ba in the middle — still…",
            correctAnswers: ["b"],
            distractors: ["t", "th", "n"],
            conceptKeys: ["letter:ba:medial"],
            metadata: { form: "medial", letter: "ba" },
        },
        {
            type: "connected_form",
            promptArabic: "ـب",
            promptText: "Ba at the end of a word:",
            correctAnswers: ["b"],
            distractors: ["t", "k", "l"],
            conceptKeys: ["letter:ba:final"],
            metadata: { form: "final", letter: "ba" },
        },
        {
            type: "connected_form",
            promptArabic: "كتب",
            promptText: "Look at the first letter in this sequence. What is it?",
            correctAnswers: ["k"],
            distractors: ["b", "t", "l"],
            explanation: "The first connected shape is ك (k).",
            conceptKeys: ["letter:kaf:initial"],
            metadata: { highlightIndex: 0, word: "كتب" },
        },
        {
            type: "similar_letter",
            promptText: "Which is medial ba (ـبـ)?",
            correctAnswers: ["ـبـ"],
            options: ["ـبـ", "ـتـ", "ـنـ"],
            explanation: "One dot below = ba, even in the middle.",
            conceptKeys: ["letter:ba:medial", "letter:ta:medial"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "بـ",
            correctAnswers: ["b"],
            distractors: ["t", "n", "y"],
            conceptKeys: ["letter:ba:initial"],
        },
    ], conceptMap);
    const l8 = await prisma.lesson.create({
        data: {
            unitId: unit3.id,
            slug: "more-connected",
            title: "Connecting ت م ن ك ل",
            description: "Practice connected forms for letters you know.",
            order: 1,
            xpReward: 18,
            estimatedMin: 5,
            published: true,
        },
    });
    await createExercises(l8.id, [
        {
            type: "connected_form",
            promptArabic: "تـ",
            promptText: "Initial form — sound?",
            correctAnswers: ["t"],
            distractors: ["b", "th", "n"],
            conceptKeys: ["letter:ta:initial"],
        },
        {
            type: "connected_form",
            promptArabic: "مـ",
            correctAnswers: ["m"],
            distractors: ["n", "b", "h"],
            conceptKeys: ["letter:mim:initial"],
        },
        {
            type: "connected_form",
            promptArabic: "ـنـ",
            promptText: "Medial nun:",
            correctAnswers: ["n"],
            distractors: ["b", "t", "m"],
            conceptKeys: ["letter:nun:medial"],
        },
        {
            type: "connected_form",
            promptArabic: "كـ",
            correctAnswers: ["k"],
            distractors: ["l", "m", "b"],
            conceptKeys: ["letter:kaf:initial"],
        },
        {
            type: "connected_form",
            promptArabic: "لـ",
            correctAnswers: ["l"],
            distractors: ["k", "n", "a"],
            conceptKeys: ["letter:lam:initial"],
        },
        {
            type: "matching",
            promptText: "Match connected forms",
            correctAnswers: ["بـ=b", "تـ=t", "مـ=m", "نـ=n"],
            options: ["بـ", "تـ", "مـ", "نـ"],
            tokens: ["b", "t", "m", "n"],
            conceptKeys: ["letter:ba:initial", "letter:ta:initial", "letter:mim:initial", "letter:nun:initial"],
        },
    ], conceptMap);
    const unit4 = await prisma.unit.create({
        data: {
            courseId: course.id,
            slug: "short-vowels",
            title: "Short Vowels",
            description: "Marks that add a, i, or u.",
            stage: 4,
            order: 3,
            published: true,
        },
    });
    const ba = syllable("ب", "َ");
    const bi = syllable("ب", "ِ");
    const bu = syllable("ب", "ُ");
    const l9 = await prisma.lesson.create({
        data: {
            unitId: unit4.id,
            slug: "fatha-kasra-damma",
            title: "َ ِ ُ with ب",
            description: "Meet fatha (a), kasra (i), and damma (u).",
            order: 0,
            xpReward: 20,
            estimatedMin: 5,
            published: true,
        },
    });
    await createExercises(l9.id, [
        {
            type: "intro",
            promptArabic: "َ",
            promptText: "This small mark above a letter is fatha. It adds a short a sound.",
            correctAnswers: ["continue"],
            conceptKeys: ["diacritic:fatha"],
        },
        {
            type: "intro",
            promptArabic: ba.arabic,
            promptText: `ب + fatha = ${ba.latin}`,
            correctAnswers: ["continue"],
            conceptKeys: ["diacritic:fatha", "letter:ba"],
        },
        {
            type: "intro",
            promptArabic: bi.arabic,
            promptText: "A mark below is kasra → short i. So بِ = bi",
            correctAnswers: ["continue"],
            conceptKeys: ["diacritic:kasra"],
        },
        {
            type: "intro",
            promptArabic: bu.arabic,
            promptText: "A little loop above is damma → short u. So بُ = bu",
            correctAnswers: ["continue"],
            conceptKeys: ["diacritic:damma"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "بَ",
            correctAnswers: ["ba"],
            distractors: ["bi", "bu", "b"],
            explanation: "Fatha (َ) → a, so بَ = ba",
            conceptKeys: ["diacritic:fatha", "letter:ba"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "بِ",
            correctAnswers: ["bi"],
            distractors: ["ba", "bu", "ib"],
            conceptKeys: ["diacritic:kasra"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "بُ",
            correctAnswers: ["bu"],
            distractors: ["ba", "bi", "ub"],
            conceptKeys: ["diacritic:damma"],
        },
        {
            type: "matching",
            promptText: "Match the syllables",
            correctAnswers: ["بَ=ba", "بِ=bi", "بُ=bu"],
            options: ["بَ", "بِ", "بُ"],
            tokens: ["ba", "bi", "bu"],
            conceptKeys: ["diacritic:fatha", "diacritic:kasra", "diacritic:damma"],
        },
    ], conceptMap);
    const l10 = await prisma.lesson.create({
        data: {
            unitId: unit4.id,
            slug: "reading-syllables",
            title: "Reading Syllables",
            description: "Combine known letters with short vowels.",
            order: 1,
            xpReward: 20,
            estimatedMin: 5,
            published: true,
        },
    });
    await createExercises(l10.id, [
        {
            type: "arabic_to_latin_mc",
            promptArabic: "كَ",
            correctAnswers: ["ka"],
            distractors: ["ki", "ku", "ak"],
            conceptKeys: ["letter:kaf", "diacritic:fatha"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "تَ",
            correctAnswers: ["ta"],
            distractors: ["ba", "ti", "at"],
            conceptKeys: ["letter:ta", "diacritic:fatha"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "مِ",
            correctAnswers: ["mi"],
            distractors: ["ma", "mu", "im"],
            conceptKeys: ["letter:mim", "diacritic:kasra"],
        },
        {
            type: "arabic_to_latin_mc",
            promptArabic: "نُ",
            correctAnswers: ["nu"],
            distractors: ["na", "ni", "un"],
            conceptKeys: ["letter:nun", "diacritic:damma"],
        },
        {
            type: "build_transliteration",
            promptArabic: "كَتَ",
            promptText: "Build the sound",
            correctAnswers: ["kata"],
            tokens: ["ka", "ta", "ba", "ma"],
            explanation: "كَ + تَ = kata",
            conceptKeys: ["letter:kaf", "letter:ta", "diacritic:fatha"],
        },
        {
            type: "build_transliteration",
            promptArabic: "بَتَ",
            correctAnswers: ["bata"],
            tokens: ["ba", "ta", "bi", "na"],
            conceptKeys: ["letter:ba", "letter:ta"],
        },
        {
            type: "type_transliteration",
            promptArabic: "لَمَ",
            promptText: "Type how this sounds",
            correctAnswers: ["lama"],
            explanation: "لَ + مَ = lama",
            conceptKeys: ["letter:lam", "letter:mim"],
        },
    ], conceptMap);
    const unit5 = await prisma.unit.create({
        data: {
            courseId: course.id,
            slug: "reading-words",
            title: "Reading Words",
            description: "Decode complete vowelled words.",
            stage: 7,
            order: 4,
            published: true,
        },
    });
    const l11 = await prisma.lesson.create({
        data: {
            unitId: unit5.id,
            slug: "first-words",
            title: "Your First Words",
            description: "Decode fully vowelled words — meaning optional.",
            order: 0,
            xpReward: 25,
            estimatedMin: 6,
            published: true,
        },
    });
    await createExercises(l11.id, [
        {
            type: "intro",
            promptArabic: "كَتَبَ",
            promptText: "You don't need to know what this means. Just decode the sounds: ka-ta-ba → kataba",
            correctAnswers: ["continue"],
            conceptKeys: ["letter:kaf", "letter:ta", "letter:ba"],
        },
        {
            type: "build_transliteration",
            promptArabic: "كَتَبَ",
            promptText: "Build the transliteration",
            correctAnswers: ["kataba"],
            tokens: ["ka", "ta", "ba", "bi", "ku"],
            explanation: "كَ تَ بَ → kataba",
            conceptKeys: ["letter:kaf", "letter:ta", "letter:ba", "diacritic:fatha"],
        },
        {
            type: "type_transliteration",
            promptArabic: "كَتَبَ",
            promptText: "Type the sounds",
            correctAnswers: ["kataba"],
            conceptKeys: ["letter:kaf", "letter:ta", "letter:ba"],
        },
        {
            type: "build_transliteration",
            promptArabic: "مَلَكَ",
            correctAnswers: ["malaka"],
            tokens: ["ma", "la", "ka", "na", "ba"],
            conceptKeys: ["letter:mim", "letter:lam", "letter:kaf"],
        },
        {
            type: "type_transliteration",
            promptArabic: "نَمَلَ",
            correctAnswers: ["namala"],
            conceptKeys: ["letter:nun", "letter:mim", "letter:lam"],
        },
        {
            type: "find_mistake",
            promptArabic: "كَتَبَ",
            promptLatin: "katiba",
            promptText: "Which decoding is shown — is it correct?",
            correctAnswers: ["wrong"],
            explanation: "All three vowels are fatha (a): kataba, not katiba.",
            conceptKeys: ["diacritic:fatha"],
            metadata: { correction: "kataba", segments: ["ka", "ta", "ba"] },
        },
        {
            type: "type_transliteration",
            promptArabic: "بَتَكَ",
            correctAnswers: ["bataka"],
            conceptKeys: ["letter:ba", "letter:ta", "letter:kaf"],
        },
    ], conceptMap);
    const upcoming = [
        { slug: "sukun-shadda", title: "Sukun & Shadda", description: "No-vowel mark and doubled letters.", stage: 5, order: 5 },
        { slug: "long-vowels", title: "Long Vowels", description: "ا و ي as long sounds.", stage: 6, order: 6 },
        { slug: "advanced-marks", title: "Advanced Marks", description: "Tanween, taa marbuta, hamza, and more.", stage: 8, order: 7 },
        { slug: "reduced-vowels", title: "Reading Without Full Vowels", description: "Gradually drop predictable marks.", stage: 9, order: 8 },
        { slug: "challenges", title: "Reading Challenges", description: "Longer vowelled passages to decode.", stage: 10, order: 9 },
    ];
    for (const u of upcoming) {
        const unit = await prisma.unit.create({
            data: {
                courseId: course.id,
                slug: u.slug,
                title: u.title,
                description: u.description,
                stage: u.stage,
                order: u.order,
                published: true,
            },
        });
        await prisma.lesson.create({
            data: {
                unitId: unit.id,
                slug: "coming-soon",
                title: `${u.title} — Coming Soon`,
                description: "This unit expands as you master the earlier path.",
                order: 0,
                published: false,
                xpReward: 20,
                estimatedMin: 5,
            },
        });
    }
    const passwordHash = await hash("harf1234", 10);
    await prisma.user.upsert({
        where: { email: "admin@harf.app" },
        update: { passwordHash, role: "admin" },
        create: {
            email: "admin@harf.app",
            name: "Admin",
            passwordHash,
            role: "admin",
            onboardingDone: true,
            readingLevel: "none",
        },
    });
    console.log("Seed complete.");
    console.log("Admin login: admin@harf.app / harf1234");
    console.log(`Letters: ${letterRecords.length}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
