# User Research  -  NeuroLearner

**Researcher:** Tanya Hemdev
**Period:** January - March 2026
**Methods:** Semi-structured interviews, observation sessions, contextual inquiry

---

## Research Overview

Before writing a single line of code, I spent two months talking to the people closest to this problem: parents navigating it daily, teachers working within it, and psychologists studying it. I also spent three weeks observing kids at an after-school program interact with existing learning software.

The goal wasn't to validate a product idea. It was to understand the lived experience of learning with a brain that works differently  -  and to figure out where existing tools fail.

**Participants:**
- 5 parents of children (ages 7-12) with ADHD and/or dyslexia
- 3 special education teachers (combined 22 years of experience)
- 2 child psychologists specializing in learning differences
- 15 children observed during after-school program sessions (with parental consent)

All participant names have been changed. All quotes are used with permission.

---

## Parent Interviews

### Parent 1: Sarah (mother of Ethan, age 10, ADHD)

Sarah described a pattern I heard from almost every parent: the homework battle. Ethan is curious and energetic, but by the time he sits down to use a learning app after school, his medication is wearing off and his attention is at its lowest.

> "Every app assumes he can sit and focus for 20 minutes. He can't. Not at 4pm. Not without his meds fully working. So he gets three questions in, gets one wrong, hears that buzzer sound, and he's done. He pushes the iPad away and says 'I hate this.'"

**Key insight:** The timing of feedback matters as much as the content. Ethan doesn't need easier problems  -  he needs to feel like he's making progress in a shorter window.

Sarah also mentioned that she's tried five different apps in the past year. She doesn't know which ones are actually helping because none of them show her anything meaningful. "They all send me an email saying he completed 60% of the module. What does that even mean? Is that good? For him?"

### Parent 2: James (father of Lily, age 8, dyslexia)

James works nights and his wife handles most of the homework support. He feels disconnected from Lily's learning progress and guilty about it.

> "I check the app when I get home at midnight and all I see is a score. I don't know if she struggled. I don't know if she cried. I don't know if she felt proud of herself. I just see 7/10."

James wants qualitative information. He doesn't care about scores  -  he wants to know if Lily felt like she had a good learning day.

### Parent 3: Maria (mother of two, ages 9 and 11, both ADHD)

Maria's perspective was crucial because she has two kids with the same diagnosis who learn completely differently. Her younger son needs movement breaks every few minutes. Her older daughter can hyperfocus for 45 minutes but crashes hard afterward.

> "One app can't work for both of them if it treats ADHD like one thing. It's not one thing. Their brains are different from each other's."

**Key insight:** Even within a single diagnosis, cognitive profiles vary enormously. The adaptive system needs to model individual patterns, not diagnostic categories.

### Parent 4: Kevin (father of Sam, age 7, ADHD + dyslexia)

Kevin was the most skeptical participant. He's tried so many tools that he's cynical about new ones. His primary concern was data privacy.

> "My kid is seven. I don't want some company building a profile on him that follows him around the internet. I don't want his learning data sold to anyone. If you can't guarantee me that, I'm not interested."

This conversation directly shaped our privacy-first architecture. Kevin was right  -  there's no reason to store PII for an adaptive learning tool. We redesigned the data pipeline to anonymize at ingestion after this interview.

### Parent 5: Anika (mother of Priya, age 11, dyslexia)

Anika is a software engineer, so her feedback was particularly technical. She pointed out that most learning apps don't respect the `prefers-reduced-motion` CSS media query, which means her daughter is bombarded with animations that are distracting.

> "I went into the app's source code on the web version and it's all CSS animations everywhere. Confetti when you get an answer right. Bouncing characters. My daughter literally cannot focus when things are moving on screen. It's not a preference  -  it's a processing issue."

**Key insight:** Accessibility settings need to be first-class, not afterthoughts. And "fun" UI elements (confetti, animations, bouncing characters) can be actively harmful for some users.

---

## Special Education Teacher Interviews

### Teacher 1: Ms. Rodriguez (8 years experience, K-5 learning specialist)

Ms. Rodriguez was the teacher who eventually helped us set up the pilot program. Her frustration with existing tools was palpable.

> "I spend more time adapting materials than teaching. I take a worksheet, I enlarge the font, I reduce the number of problems per page, I add more whitespace, I rewrite the instructions in simpler language. Every. Single. Time. Why can't the tool just do this?"

She also raised a point about reward systems that became critical to our design:

> "Points and leaderboards work for maybe 30% of my kids. For the other 70%, it's either stressful or meaningless. The kids with ADHD who are competitive get overstimulated by gamification  -  they get so focused on the points that they stop actually learning. And the kids who are behind just see the leaderboard as proof that they're losing."

This directly led to our decision to avoid traditional gamification (see SPRINT_LOG.md, Sprint 3).

### Teacher 2: Mr. Chen (6 years experience, middle school resource room)

Mr. Chen works with older students and sees the long-term consequences of tools that don't adapt.

> "By the time kids get to me in 6th grade, the ones with learning disabilities have already decided they're dumb. They're not dumb. They're demoralized. They've spent five years using tools that made them feel like failures because the tools couldn't meet them where they are."

He emphasized the importance of framing progress in terms of individual growth rather than grade-level benchmarks.

> "Show a kid they're better than they were last week. Don't show them they're behind where some committee says they should be."

### Teacher 3: Ms. Okafor (8 years experience, 2nd-3rd grade inclusion classroom)

Ms. Okafor had the most specific feedback about what happens when a child's attention drops off during a learning session.

> "There's a moment  -  I can see it on their faces  -  where they go from 'this is hard but I'm trying' to 'I'm done.' It happens fast. Maybe 15 seconds. If you catch them before that moment and give them a win, they'll keep going. If you miss it, you've lost them for the rest of the session."

**This was the single most important insight from the entire research process.** It directly shaped the micro-feedback system. The 30-second feedback window we built into the adaptive engine is based on Ms. Okafor's observation about this critical moment.

---

## Child Psychologist Interviews

### Dr. Amara Osei (clinical child psychologist, 12 years practice)

Dr. Osei validated much of what we heard from parents and teachers, and added the neuroscience framing.

> "Children with ADHD have differences in dopamine signaling that affect how they experience reward. The gap between effort and reward has to be shorter  -  not because they're impatient, but because their neurochemistry processes delayed rewards differently. A neurotypical child can sustain effort for 5 minutes on the promise of eventual success. A child with ADHD might need evidence of progress every 30 to 60 seconds."

She was also firm about what the tool should NOT do:

> "Don't diagnose. Don't even hint at diagnosing. You're building a learning tool, not a clinical instrument. The moment you start saying 'your child might have ADHD,' you've crossed a line. Build a profile of how a child learns, not what condition they have."

### Dr. Rafael Mendez (developmental psychologist, researcher at UC Berkeley)

Dr. Mendez studies attention in children and provided the theoretical foundation for the adaptive model.

> "Attention isn't a single thing you have more or less of. It's a set of processes  -  sustained attention, selective attention, attentional shifting. A child with ADHD might have typical selective attention but very different sustained attention curves. Your model needs to capture that nuance."

He also warned us about a common trap in adaptive learning:

> "Don't just make things easier when a child struggles. Sometimes the problem isn't difficulty  -  it's presentation. A child might be perfectly capable of a hard problem if you present it with less visual clutter. Reducing difficulty when you should be reducing complexity is a category error that most adaptive systems make."

**Key insight:** The adaptive engine needs to distinguish between difficulty (how hard the problem is) and complexity (how much cognitive load the presentation creates). These are independent variables.

---

## Observation Sessions

### Setup

Over three weeks in February 2026, I observed 15 children (ages 7-12, all with ADHD and/or dyslexia diagnoses) using three popular learning apps during after-school sessions at the Berkeley Youth Learning Center. Sessions were 20 minutes each. I tracked:

- Time to first engagement (how long before they started the first task)
- Task completion rate
- Moments of visible frustration (pushing device away, sighing, looking around the room)
- Moments of visible engagement (leaning forward, verbalizing, smiling)
- Points of abandonment (when they stopped and didn't return)

### Key Observations

**1. The 90-second cliff**

Across all three apps, there was a consistent pattern: kids who didn't experience a success moment within the first 90 seconds of starting a task were 4x more likely to abandon the session entirely. The window was even shorter for kids with combined ADHD and dyslexia  -  closer to 45 seconds.

**2. Visual overload is physical**

Three children physically recoiled from screens that had too many elements. One child (age 8, ADHD) put her hand over half the screen to block out a sidebar. Another turned the tablet to landscape to make a distracting animation scroll off-screen. These kids were inventing their own accessibility accommodations because the software didn't provide them.

**3. Sound effects created a negative association loop**

Wrong-answer sounds  -  even "gentle" ones  -  caused visible stress responses. One child flinched every time she heard the soft buzzer on an incorrect answer. After three buzzes in a row, she put the tablet down and asked to go play outside. The sounds weren't just annoying; they were training her to associate the learning tool with failure.

**4. Gamification is not neutral**

Two children became so fixated on earning points that they started guessing randomly to move faster through questions. They weren't learning  -  they were optimizing for the reward metric. Meanwhile, three other children ignored the points entirely and seemed confused about why the screen was celebrating when they didn't feel like they'd accomplished anything meaningful.

**5. The break problem**

No app handled breaks gracefully. When a child looked away, got up, or just needed a moment, the app either timed out and reset their progress or kept presenting new content that they missed. There was no "I see you need a second, I'll be here when you're ready" response from any tool.

---

## Synthesis: Core Design Principles

From all of this research, five design principles emerged:

### 1. Shorten the feedback loop, not the content

The core insight. Kids with ADHD don't need easier material  -  they need faster evidence that their effort is working. Build micro-acknowledgments into 30-second cycles.

### 2. Distinguish difficulty from complexity

A hard problem with a clean presentation is better than an easy problem with a cluttered one. Adapt visual complexity independently from content difficulty.

### 3. Make it calm

No buzzers. No leaderboards. No countdown timers. No celebrations that feel performative. Calm, consistent, predictable. The software should feel like a patient tutor, not a game show.

### 4. Show growth, not grades

Parents and teachers need to see progress  -  but progress defined by individual growth curves, not normative benchmarks. "She's completing tasks 35% more often than she was three weeks ago" is meaningful. "She's at a 2nd grade reading level" is not helpful.

### 5. Privacy is the foundation

These are children. Their data deserves the highest possible protection. Anonymize everything. Store nothing identifiable. Make data deletion trivially easy.

---

*This research was conducted under UC Berkeley IRB Protocol #2026-01-0342. All participants provided informed consent (parents on behalf of children). No child data from observation sessions was stored beyond anonymized behavioral timestamps.*
