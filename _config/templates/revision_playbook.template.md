# Revision Playbook — Chapter [X]
*Project: [Book Title]*
*Date: [Date]*

This playbook facilitates a Human-in-the-Loop (HITL) review and revision process for Chapter [X] between the author and the agent.

---

## 1. Critique & Diagnostics
*The agent compiles the results of mechanical and qualitative audits.*

### A. Mechanical Audit Summary (`node scripts/soundboard.js audit`)
- **Dialogue-to-Narration Ratio:** [Score] (Target: ≥ 30%)
- **Rhythm Variance (Coefficient of Variation):** [Score] (Target: ≥ 0.5)
- **Smell (Olfactory) density:** [Count] per 1,000 words (Target: Used only when earned)
- **Em-dash rate:** [Count] per 1,000 words (Target: < 4 per 1,000 words)
- **Triad / Rule-of-three stack count:** [Count] (Target: ≤ 1 per chapter)
- **Lexical Tells Detected:** [List of words like "delve", "tapestry", "seemed to", etc.]

### B. Judgment Audit Summary (`_config/narrative_audit_rubric.md`)
- **Theme/Moralizing:** [Critique of theme-explaining or moralizing tails]
- **Plot Shape & Continuity:** [Critique of loose ends, causal chains, subplot integration]
- **Time Handling:** [Critique of linear progression vs. flashbacks/skips]
- **Emotion Modes:** [Critique of embodied-sensation overload vs. naming feelings/actions]
- **Character Introductions:** [Critique of physical-description dumps vs. action introduction]

---

## 2. Proposed Interventions & Author Options
*For every major critique point, the agent proposes 2-3 different ways to resolve it. The author selects their preferred option or writes in a custom solution.*

### Issue 1: [Name of Issue, e.g., Theme Explaining at Chapter End]
* **Option A (Cut):** Delete the narrator's explaining sentence entirely (Lines [X-Y]) and end the chapter on the character's silence.
* **Option B (Re-render as Action):** Replace the explaining sentence with a minor physical action that implies the shift (e.g., she closes the book and locks it in the desk).
* **Option C (Dialogue Option):** Shift the realization into dialogue with [Character Name] in the preceding scene.
* **Author Choice / Direction:** [Fill in choice: Option A, B, C, or custom note]

### Issue 2: [Name of Issue, e.g., Low Rhythm Variance / Flat Prose]
* **Option A (Vary Sentence Length):** Rewrite paragraph 4 to break up the uniform sentence lengths, converting long descriptive sentences into punchy fragments and combining others.
* **Option B (POV register shift):** Rewrite the paragraph in a closer, more immediate third-person stream of consciousness.
* **Author Choice / Direction:** [Fill in choice]

### Issue 3: [Name of Issue, e.g., Embodied Emotion Overload]
* **Option A (Rotate to Name of Feeling):** Replace "his heart hammered against his ribs" with "he was afraid."
* **Option B (Rotate to Behavioral Cue):** Replace the bodily reaction with a physical behavior (e.g., he reached into his pocket and squeezed the key).
* **Author Choice / Direction:** [Fill in choice]

---

## 3. Final Approved Revision Plan
*Consolidated list of approved changes after the author reviews the options.*

- `[ ]` **Revision 1:** [Detail based on author choice]
- `[ ]` **Revision 2:** [Detail based on author choice]
- `[ ]` **Revision 3:** [Detail based on author choice]

---

## 4. Execution & Re-Audit Log
*The agent executes the changes and runs a final check to confirm the gate passes.*

### A. Code/Prose Replacements
*Record of key sections changed.*
```diff
- [Old passage]
+ [New passage]
```

### B. Final Re-Audit Metrics
- **Soundboard Audit Verdict:** [PASS / FAIL]
- **Updated Dialogue Ratio:** [Score]
- **Updated Rhythm Variance:** [Score]
- **Lexical Tells remaining:** [Count]
- **Status in `manuscript.json`:** Changed from `audited` to `passed` ✓
