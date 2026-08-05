# Product Requirements Document  -  NeuroLearner

**Author:** Tanya Hemdev
**Last Updated:** August 2026
**Status:** Pilot complete, iterating

---

## Problem Statement

### The Human Story

Maya is 9. She's funny, she's curious, she loves dinosaurs and can tell you the difference between a Velociraptor and a Deinonychus without blinking. She also has ADHD and mild dyslexia, and she's starting to believe she's stupid.

Not because anyone told her that. Because every learning tool she uses was designed for a brain that works differently from hers. The pacing assumes sustained attention. The feedback comes too late. The visual layouts are cluttered in ways that pull her focus in six directions. By the time a worksheet tells her she got question 3 right, she's already on question 7 and has decided she's failing.

Maya isn't failing. The tools are.

### The Data

- **1 in 5** children in the US have learning differences (ADHD, dyslexia, dyscalculia, and others)
- **4 million** children under 18 have diagnosed learning disabilities
- **18%** of students with learning disabilities drop out of school  -  nearly three times the general population rate
- **45%** of children with ADHD have a co-occurring learning disability, meaning they're navigating multiple cognitive differences simultaneously
- Existing EdTech platforms largely treat accessibility as an afterthought  -  larger fonts, maybe a screen reader. Almost none adapt the actual pedagogical approach to cognitive differences.

### The Insight

From our user research (see [USER_RESEARCH.md](./USER_RESEARCH.md)):

> "It's not about making things easier  -  it's about making the feedback loop shorter so they feel progress before they give up."

Children with ADHD don't lack the ability to learn. They lack tools that match the temporal dynamics of their attention. The window between effort and acknowledgment needs to be shorter  -  not because they can't do hard things, but because their brains need more frequent evidence that effort is working.

---

## Target Users

### Primary: Children ages 7-12 with ADHD and/or dyslexia

These kids are old enough to use learning software independently but young enough that their self-concept around learning is still forming. This is the window where a kid goes from "this is hard" to "I'm bad at this." We want to catch them before that shift.

### Secondary: Parents of children with learning differences

Parents who are often overwhelmed navigating IEPs, tutoring, and a landscape of tools that mostly weren't built for their kids. They need visibility into progress without the anxiety of traditional grading.

### Tertiary: Special education teachers and learning specialists

Teachers who work with these kids daily and need tools that complement their teaching approach rather than contradicting it.

---

## Personas

### Persona 1: Maya (age 9, ADHD + dyslexia)

**Context:** 4th grader. Diagnosed with ADHD (combined type) at age 7, dyslexia identified by school reading specialist at age 8. Currently has an IEP. She's bright and creative but has started saying "I'm not a school person."

**Frustrations:**
- Math apps move too fast and she can't tell if she's doing well until the end
- Reading apps have too much text on screen and she loses her place
- She hates the "wrong answer" buzzer sounds  -  they make her want to quit
- Gamification elements (points, leaderboards) stress her out more than they motivate her

**Needs:**
- Immediate, gentle acknowledgment when she completes something  -  before she has time to doubt herself
- Clean visual layouts with one thing to focus on at a time
- The ability to take breaks without losing progress
- No comparison to other kids

### Persona 2: David (age 42, Maya's father)

**Context:** Works in accounting. Spends evenings helping Maya with homework. Has watched her confidence erode over the past year. Feels guilty that he sometimes loses patience. Wants to help but doesn't have a background in education or psychology.

**Frustrations:**
- Can't tell from report cards whether Maya is actually progressing or just being graded against neurotypical standards
- Every app he downloads seems to assume his daughter is "typical" and just needs more practice
- Doesn't know what's working and what isn't

**Needs:**
- A dashboard that shows Maya's growth in terms she's actually growing in  -  not just "she scored 60% on fractions"
- Confidence that the tool is safe and not collecting data about his minor child
- Something Maya actually wants to use, so homework time doesn't feel like a battle

### Persona 3: Ms. Rodriguez (age 34, special education teacher)

**Context:** 8 years teaching, specializes in learning disabilities. Has 14 students on her caseload, each with different needs. Currently pieces together materials from 5-6 different sources and adapts them by hand.

**Frustrations:**
- Most EdTech tools work against her teaching approach by overwhelming students with stimuli
- She can't customize pacing in existing tools  -  the software decides, and it's usually wrong
- Progress reports from apps don't map to IEP goals
- She's tired of tools that treat accommodation as "just make the font bigger"

**Needs:**
- A tool she can point students to that she trusts to adapt appropriately
- The ability to see what difficulty levels and pacing a student is working at
- Confidence that the tool won't overstimulate kids who are sensitive to visual noise
- Something that respects her expertise  -  assists her teaching, doesn't replace it

---

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Task completion rate | 35% improvement over baseline | Pre/post comparison within subjects |
| Frustration indicators | 40% reduction | Engagement drop-off pattern analysis + teacher observation |
| Time-to-first-success | < 45 seconds | Measured from session start to first positive feedback event |
| Session duration (voluntary) | > 12 minutes | Tracking voluntary engagement beyond required time |
| Parent-reported confidence | Qualitative improvement | Monthly check-in surveys |
| Teacher satisfaction | > 4/5 on utility scale | Post-pilot survey |
| Return rate | > 70% voluntary return within 48 hours | Session tracking |

---

## Feature Requirements

### P0  -  Must Have (Pilot)

| Feature | Description |
|---------|-------------|
| Cognitive Assessment Module | 5-minute initial calibration through game-like tasks. Estimates attention span curve, reading speed, visual processing preferences. Not diagnostic  -  calibration only. |
| Adaptive Content Engine | Real-time adjustment of difficulty, pacing, and visual density based on cognitive profile. Uses TensorFlow model trained on synthetic data. |
| Micro-Feedback System | Positive acknowledgment within 30 seconds of task completion. Tuned to individual attention curves. No negative feedback sounds or visuals. |
| Clean Visual Mode | Reduced visual complexity option. Single-focus layouts. Customizable background colors. Minimal animation. |
| Anonymized Data Pipeline | All child data anonymized at the point of ingestion. No PII stored. COPPA-compliant from day one. |
| Parent Dashboard (Basic) | View child's progress patterns. No grades  -  growth indicators only. |

### P1  -  Should Have (Post-Pilot)

| Feature | Description |
|---------|-------------|
| Teacher Dashboard | Per-student adaptive profile visibility. Difficulty and pacing history. Exportable for IEP documentation. |
| Content Library Expansion | Move beyond math to include reading comprehension and writing prompts. |
| Break System | Guided break suggestions based on detected attention fatigue. Optional breathing/movement prompts. |
| Multiple Profiles | Support for siblings or classrooms. Each profile fully independent. |
| Offline Mode | Core learning modules available without internet. Syncs when reconnected. |

### P2  -  Nice to Have (Future)

| Feature | Description |
|---------|-------------|
| Voice Input | For kids who struggle with typing. Speech-to-text for written response tasks. |
| Co-Learning Mode | Paired activities for parent-child or peer-peer learning. |
| Custom Content Upload | Teachers can upload their own worksheets and the system adapts them to each student's profile. |
| Longitudinal Progress Reports | Semester/year-long growth visualization for IEP meetings. |
| Multi-Language Support | Starting with Spanish  -  the highest-need second language in our target demographic. |

---

## Accessibility Requirements

Accessibility isn't a feature category for NeuroLearner  -  it's the product's reason for existing. But there are specific technical standards we hold ourselves to:

### Visual

- **WCAG 2.1 AA** compliance minimum, targeting AAA where feasible
- **Reduced visual noise**: No background patterns, minimal use of borders, generous whitespace
- **Customizable fonts**: Including OpenDyslexic and other dyslexia-friendly typefaces
- **Adjustable text size**: 14px minimum, scalable to 24px without layout breaking
- **High contrast mode**: Tested with multiple color-blindness profiles
- **Reduced motion**: `prefers-reduced-motion` respected everywhere. All animations optional and off by default for ADHD profiles.

### Cognitive

- **Single-focus layouts**: One primary task visible at a time
- **Predictable navigation**: Same patterns on every screen. No surprises.
- **Clear exit points**: Kids should always know how to pause or leave without losing progress
- **No time pressure**: No countdown timers. No ticking clocks. Nothing that creates urgency.
- **Consistent reward language**: Same acknowledgment patterns so kids know what to expect

### Audio

- **No negative audio cues**: No buzzer sounds, no "wrong" indicators. Silence or gentle redirect.
- **Optional audio narration**: All text content can be read aloud
- **Volume control**: Independent from system volume

---

## Ethical Considerations

### Data Privacy for Minors

This is non-negotiable.

- **COPPA compliance**: Verified parental consent before any data collection. Under-13 data handled per COPPA requirements.
- **No PII stored**: Names, ages, schools  -  none of it touches our database. Each child is an anonymized profile ID.
- **Data minimization**: We collect only what the adaptive engine needs. Nothing more.
- **No third-party data sharing**: Ever. Not for research. Not for analytics. Not for anything.
- **Right to deletion**: Parents can request complete data removal at any time. We comply within 24 hours.

### No Diagnostic Claims

NeuroLearner is **not** a diagnostic tool. It does not diagnose ADHD, dyslexia, or any other condition. It does not replace professional evaluation. The cognitive profile it builds is a learning preference model, not a clinical assessment.

We are explicit about this in:
- Onboarding flow
- Parent-facing materials
- Terms of service
- Any research publications

### Algorithmic Transparency

Parents and teachers can see exactly what the adaptive engine is adjusting and why. No black boxes. If the system is reducing visual complexity for a child, the dashboard says so, in plain language.

### Avoiding Labeling

The system never labels a child as "behind" or "below grade level." Progress is always framed in terms of individual growth. Comparison to peers or norms is architecturally impossible  -  we don't store the data that would make it possible.
