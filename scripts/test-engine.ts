import { transliterate, validateAnswer, normalizeAnswer, syllable, } from "../src/lib/transliteration/engine";
function assert(cond: boolean, msg: string) {
    if (!cond)
        throw new Error(msg);
}
assert(transliterate("بَ") === "ba", "ba");
assert(transliterate("بِ") === "bi", "bi");
assert(transliterate("بُ") === "bu", "bu");
assert(transliterate("كَتَبَ") === "kataba", "kataba");
assert(syllable("ك", "َ").latin === "ka", "ka syllable");
assert(normalizeAnswer("Ka Ta Ba") === "kataba", "normalize spaces");
assert(validateAnswer("كَتَبَ", "kataba", ["kataba"]).correct, "validate kataba");
assert(validateAnswer("كَتَبَ", "KATABA", ["kataba"]).correct, "validate case");
assert(!validateAnswer("كَتَبَ", "katiba", ["kataba"]).correct, "reject katiba");
console.log("Transliteration engine tests passed.");
