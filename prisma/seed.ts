import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { LETTERS } from "../src/lib/transliteration/engine";
import { UNITS } from "./curriculum";
import type { ExInput } from "./seed-types";

const prisma = new PrismaClient();

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

async function createExercises(
  lessonId: string,
  exercises: ExInput[],
  conceptMap: Map<string, string>
) {
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

  const extraConcepts = [
    { key: "diacritic:fatha", title: "Fatha (a)", arabic: "َ", latin: "a", kind: "diacritic" },
    { key: "diacritic:kasra", title: "Kasra (i)", arabic: "ِ", latin: "i", kind: "diacritic" },
    { key: "diacritic:damma", title: "Damma (u)", arabic: "ُ", latin: "u", kind: "diacritic" },
    { key: "diacritic:sukun", title: "Sukun", arabic: "ْ", latin: "", kind: "diacritic" },
    { key: "diacritic:shadda", title: "Shadda", arabic: "ّ", latin: "double", kind: "diacritic" },
    { key: "diacritic:tanween_an", title: "Tanween an", arabic: "ً", latin: "an", kind: "diacritic" },
    { key: "diacritic:tanween_un", title: "Tanween un", arabic: "ٌ", latin: "un", kind: "diacritic" },
    { key: "diacritic:tanween_in", title: "Tanween in", arabic: "ٍ", latin: "in", kind: "diacritic" },
    {
      key: "reading_rule:definite_article",
      title: "Definite article ال",
      arabic: "ال",
      latin: "al-",
      kind: "reading_rule",
    },
    {
      key: "reading_rule:sun_letters",
      title: "Sun letters",
      arabic: "الشّ",
      latin: "ash-/ad-/an-",
      kind: "reading_rule",
    },
  ];

  for (const d of extraConcepts) {
    const c = await ensureConcept(d);
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
      {
        key: "sukun_shadda",
        title: "Sukun and shadda",
        description: "Sukun = no vowel. Shadda = doubled consonant.",
        stage: 5,
        examples: JSON.stringify([
          { ar: "مِنْ", la: "min" },
          { ar: "كَتَّ", la: "katta" },
        ]),
      },
      {
        key: "long_vowels",
        title: "Long vowels",
        description: "ا و ي can lengthen preceding short vowels.",
        stage: 6,
        examples: JSON.stringify([
          { ar: "بَا", la: "baa" },
          { ar: "بُو", la: "buu" },
          { ar: "بِي", la: "bii" },
        ]),
      },
      {
        key: "definite_article",
        title: "Definite article",
        description: "ال reads as al-, or assimilates before sun letters.",
        stage: 8,
        examples: JSON.stringify([
          { ar: "الْكِتَاب", la: "alkitaab" },
          { ar: "الشَّمْس", la: "ash-shams" },
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
      { key: "long_vowel_master", title: "Long Vowel Reader", description: "Finished the long vowels unit.", icon: "stretch", xpReward: 40 },
      { key: "challenge_finisher", title: "Reading Challenger", description: "Completed a reading challenge lesson.", icon: "flag", xpReward: 80 },
    ],
  });

  const course = await prisma.course.create({
    data: {
      slug: "arabic-reading",
      title: "Arabic Reading",
      description:
        "Learn to decode Arabic script into Latin sounds — from first letters to full passages.",
      order: 0,
      published: true,
    },
  });

  let lessonCount = 0;
  let exerciseCount = 0;

  for (let ui = 0; ui < UNITS.length; ui++) {
    const unitDef = UNITS[ui];
    const unit = await prisma.unit.create({
      data: {
        courseId: course.id,
        slug: unitDef.slug,
        title: unitDef.title,
        description: unitDef.description,
        stage: unitDef.stage,
        order: ui,
        published: true,
      },
    });

    for (let li = 0; li < unitDef.lessons.length; li++) {
      const lessonDef = unitDef.lessons[li];
      const lesson = await prisma.lesson.create({
        data: {
          unitId: unit.id,
          slug: lessonDef.slug,
          title: lessonDef.title,
          description: lessonDef.description,
          order: li,
          xpReward: lessonDef.xpReward ?? 15,
          estimatedMin: lessonDef.estimatedMin ?? 4,
          published: true,
        },
      });
      lessonCount += 1;

      const conceptKeys = new Set<string>(lessonDef.conceptKeys ?? []);
      for (const ex of lessonDef.exercises) {
        for (const k of ex.conceptKeys) conceptKeys.add(k);
      }

      for (const key of conceptKeys) {
        const conceptId = conceptMap.get(key);
        if (!conceptId) continue;
        await prisma.lessonConcept.create({
          data: { lessonId: lesson.id, conceptId },
        });
      }

      await createExercises(lesson.id, lessonDef.exercises, conceptMap);
      exerciseCount += lessonDef.exercises.length;
    }
  }

  const passwordHash = await hash("harf1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@harf.app" },
    update: { passwordHash, role: "admin", onboardingDone: true },
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
  console.log(`Units: ${UNITS.length}`);
  console.log(`Lessons: ${lessonCount}`);
  console.log(`Exercises: ${exerciseCount}`);
  console.log(`Letters: ${letterRecords.length}`);
  console.log("Admin login: admin@harf.app / harf1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
