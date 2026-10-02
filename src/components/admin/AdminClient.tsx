"use client";
import { useState } from "react";
import { adminUpsertLesson, adminUpsertExercise, adminUpsertUnit, adminToggleLessonPublish, } from "@/lib/actions/admin";
import { ExerciseRenderer, type ExerciseDTO } from "@/components/exercises/ExerciseRenderer";
type Concept = {
    id: string;
    key: string;
    title: string;
};
type Exercise = {
    id: string;
    type: string;
    promptArabic: string | null;
    promptLatin: string | null;
    promptText: string | null;
    correctAnswers: string;
    distractors: string | null;
    tokens: string | null;
    options: string | null;
    explanation: string | null;
    difficulty: number;
    order: number;
    conceptIds: string;
};
type Lesson = {
    id: string;
    slug: string;
    title: string;
    description: string;
    order: number;
    xpReward: number;
    estimatedMin: number;
    published: boolean;
    exercises: Exercise[];
};
type Unit = {
    id: string;
    slug: string;
    title: string;
    description: string;
    stage: number;
    order: number;
    published: boolean;
    lessons: Lesson[];
};
type Course = {
    id: string;
    title: string;
    units: Unit[];
};
export function AdminClient({ course, concepts, }: {
    course: Course;
    concepts: Concept[];
}) {
    const [selectedUnitId, setSelectedUnitId] = useState(course.units[0]?.id ?? "");
    const unit = course.units.find((u) => u.id === selectedUnitId) ?? course.units[0];
    const [selectedLessonId, setSelectedLessonId] = useState(unit?.lessons[0]?.id ?? "");
    const lesson = unit?.lessons.find((l) => l.id === selectedLessonId) ?? unit?.lessons[0];
    const [selectedExerciseId, setSelectedExerciseId] = useState(lesson?.exercises[0]?.id ?? "");
    const exercise = lesson?.exercises.find((e) => e.id === selectedExerciseId) ??
        lesson?.exercises[0];
    const [message, setMessage] = useState("");
    const [preview, setPreview] = useState(false);
    const [lessonForm, setLessonForm] = useState({
        title: "",
        slug: "",
        description: "",
        order: 0,
        xpReward: 15,
        estimatedMin: 4,
        published: true,
    });
    const [exForm, setExForm] = useState({
        type: "arabic_to_latin_mc",
        promptArabic: "",
        promptLatin: "",
        promptText: "",
        correctAnswers: '["b"]',
        distractors: '["t","m","n"]',
        tokens: "",
        options: "",
        explanation: "",
        difficulty: 1,
        order: 0,
        conceptIds: "[]",
    });
    function loadExercise(ex: Exercise) {
        setSelectedExerciseId(ex.id);
        setExForm({
            type: ex.type,
            promptArabic: ex.promptArabic ?? "",
            promptLatin: ex.promptLatin ?? "",
            promptText: ex.promptText ?? "",
            correctAnswers: ex.correctAnswers,
            distractors: ex.distractors ?? "",
            tokens: ex.tokens ?? "",
            options: ex.options ?? "",
            explanation: ex.explanation ?? "",
            difficulty: ex.difficulty,
            order: ex.order,
            conceptIds: ex.conceptIds,
        });
        setPreview(false);
    }
    async function saveLesson(existing?: Lesson) {
        if (!unit)
            return;
        await adminUpsertLesson({
            id: existing?.id,
            unitId: unit.id,
            ...lessonForm,
            title: existing ? existing.title : lessonForm.title,
            slug: existing ? existing.slug : lessonForm.slug,
            description: existing ? existing.description : lessonForm.description,
            order: existing ? existing.order : lessonForm.order,
            xpReward: existing ? existing.xpReward : lessonForm.xpReward,
            estimatedMin: existing ? existing.estimatedMin : lessonForm.estimatedMin,
            published: existing ? existing.published : lessonForm.published,
        });
        setMessage("Lesson saved — refresh to see updates");
    }
    async function saveExercise() {
        if (!lesson)
            return;
        await adminUpsertExercise({
            id: selectedExerciseId || undefined,
            lessonId: lesson.id,
            ...exForm,
        });
        setMessage("Exercise saved — refresh to see updates");
    }
    const previewDto: ExerciseDTO | null = preview
        ? {
            id: "preview",
            type: exForm.type,
            promptArabic: exForm.promptArabic || null,
            promptLatin: exForm.promptLatin || null,
            promptText: exForm.promptText || null,
            correctAnswers: JSON.parse(exForm.correctAnswers || "[]"),
            distractors: exForm.distractors ? JSON.parse(exForm.distractors) : null,
            tokens: exForm.tokens ? JSON.parse(exForm.tokens) : null,
            options: exForm.options ? JSON.parse(exForm.options) : null,
            explanation: exForm.explanation || null,
            conceptIds: JSON.parse(exForm.conceptIds || "[]"),
        }
        : null;
    return (<div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Units
        </p>
        {course.units.map((u) => (<button key={u.id} type="button" onClick={() => {
                setSelectedUnitId(u.id);
                setSelectedLessonId(u.lessons[0]?.id ?? "");
            }} className={`focus-ring block w-full rounded-xl px-3 py-2 text-left text-sm ${u.id === unit?.id ? "bg-teal-soft font-semibold text-teal-deep" : "hover:bg-white"}`}>
            {u.title}
            <span className="mt-0.5 block text-xs font-normal text-ink-muted">
              Stage {u.stage} · {u.lessons.length} lessons
            </span>
          </button>))}
        <NewUnitForm courseId={course.id} onDone={() => setMessage("Unit created — refresh")}/>
      </aside>

      <div className="space-y-6">
        {message && (<p className="rounded-xl bg-teal-soft px-3 py-2 text-sm text-teal-deep">
            {message}
          </p>)}

        {unit && (<section className="surface rounded-3xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{unit.title}</h2>
              <button type="button" className="btn btn-secondary text-sm" onClick={async () => {
                await adminUpsertUnit({
                    id: unit.id,
                    courseId: course.id,
                    slug: unit.slug,
                    title: unit.title,
                    description: unit.description,
                    stage: unit.stage,
                    order: unit.order,
                    published: !unit.published,
                });
                setMessage("Unit publish toggled — refresh");
            }}>
                {unit.published ? "Unpublish unit" : "Publish unit"}
              </button>
            </div>

            <ul className="mt-4 space-y-2">
              {unit.lessons.map((l) => (<li key={l.id}>
                  <button type="button" onClick={() => {
                    setSelectedLessonId(l.id);
                    if (l.exercises[0])
                        loadExercise(l.exercises[0]);
                }} className={`focus-ring flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${l.id === lesson?.id
                    ? "border-teal bg-teal-soft/50"
                    : "border-black/5 bg-white"}`}>
                    <span>
                      {l.title}{" "}
                      <span className="text-ink-muted">
                        ({l.exercises.length} ex)
                      </span>
                    </span>
                    <span className="text-xs">
                      {l.published ? "Published" : "Draft"}
                    </span>
                  </button>
                </li>))}
            </ul>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <input placeholder="New lesson title" className="rounded-xl border border-black/10 px-3 py-2 text-sm" value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({
                ...f,
                title: e.target.value,
                slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
            }))}/>
              <button type="button" className="btn btn-secondary text-sm" onClick={() => saveLesson()}>
                Add lesson
              </button>
            </div>

            {lesson && (<div className="mt-3">
                <button type="button" className="text-sm text-teal hover:underline" onClick={async () => {
                    await adminToggleLessonPublish(lesson.id, !lesson.published);
                    setMessage("Lesson publish toggled — refresh");
                }}>
                  Toggle publish for “{lesson.title}”
                </button>
              </div>)}
          </section>)}

        {lesson && (<section className="surface rounded-3xl p-5">
            <h3 className="font-semibold">Exercises in {lesson.title}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {lesson.exercises.map((ex) => (<button key={ex.id} type="button" onClick={() => loadExercise(ex)} className={`focus-ring rounded-lg border px-2 py-1 text-xs ${ex.id === exercise?.id
                    ? "border-teal bg-teal-soft"
                    : "border-black/10"}`}>
                  {ex.order + 1}. {ex.type}
                </button>))}
              <button type="button" className="rounded-lg border border-dashed border-black/20 px-2 py-1 text-xs" onClick={() => {
                setSelectedExerciseId("");
                setExForm((f) => ({
                    ...f,
                    order: lesson.exercises.length,
                    promptArabic: "",
                    promptText: "",
                }));
            }}>
                + New
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Type" value={exForm.type} onChange={(v) => setExForm((f) => ({ ...f, type: v }))}/>
              <Field label="Order" value={String(exForm.order)} onChange={(v) => setExForm((f) => ({ ...f, order: Number(v) || 0 }))}/>
              <Field label="Arabic prompt" value={exForm.promptArabic} onChange={(v) => setExForm((f) => ({ ...f, promptArabic: v }))} dir="rtl"/>
              <Field label="Latin prompt" value={exForm.promptLatin} onChange={(v) => setExForm((f) => ({ ...f, promptLatin: v }))}/>
              <div className="sm:col-span-2">
                <Field label="Instruction text" value={exForm.promptText} onChange={(v) => setExForm((f) => ({ ...f, promptText: v }))}/>
              </div>
              <Field label="Correct answers (JSON)" value={exForm.correctAnswers} onChange={(v) => setExForm((f) => ({ ...f, correctAnswers: v }))}/>
              <Field label="Distractors (JSON)" value={exForm.distractors} onChange={(v) => setExForm((f) => ({ ...f, distractors: v }))}/>
              <Field label="Tokens (JSON)" value={exForm.tokens} onChange={(v) => setExForm((f) => ({ ...f, tokens: v }))}/>
              <Field label="Options (JSON)" value={exForm.options} onChange={(v) => setExForm((f) => ({ ...f, options: v }))}/>
              <div className="sm:col-span-2">
                <Field label="Explanation" value={exForm.explanation} onChange={(v) => setExForm((f) => ({ ...f, explanation: v }))}/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-ink-muted">
                  Concept IDs (JSON array)
                  <textarea className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 font-mono text-xs" rows={2} value={exForm.conceptIds} onChange={(e) => setExForm((f) => ({ ...f, conceptIds: e.target.value }))}/>
                </label>
                <p className="mt-1 text-[11px] text-ink-muted">
                  Available: {concepts.slice(0, 8).map((c) => c.key).join(", ")}…
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={saveExercise}>
                Save exercise
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setPreview((p) => !p)}>
                {preview ? "Hide preview" : "Preview"}
              </button>
            </div>

            {previewDto && (<div className="mt-6 rounded-2xl border border-dashed border-teal/30 bg-white p-4">
                <p className="mb-3 text-xs font-medium text-ink-muted">Preview</p>
                <ExerciseRenderer exercise={previewDto} onResult={() => undefined}/>
              </div>)}
          </section>)}
      </div>
    </div>);
}
function Field({ label, value, onChange, dir, }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    dir?: "rtl" | "ltr";
}) {
    return (<label className="text-xs font-medium text-ink-muted">
      {label}
      <input dir={dir} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink" value={value} onChange={(e) => onChange(e.target.value)}/>
    </label>);
}
function NewUnitForm({ courseId, onDone, }: {
    courseId: string;
    onDone: () => void;
}) {
    const [title, setTitle] = useState("");
    return (<div className="mt-4 space-y-2 rounded-xl border border-dashed border-black/15 p-3">
      <input placeholder="New unit title" className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-sm" value={title} onChange={(e) => setTitle(e.target.value)}/>
      <button type="button" className="btn btn-secondary w-full text-xs" onClick={async () => {
            if (!title.trim())
                return;
            await adminUpsertUnit({
                courseId,
                slug: title.toLowerCase().replace(/\s+/g, "-"),
                title,
                description: title,
                stage: 1,
                order: 99,
                published: false,
            });
            setTitle("");
            onDone();
        }}>
        Add unit
      </button>
    </div>);
}
