# Sprint Log  -  NeuroLearner

**Team:** Tanya Hemdev (PM/design/backend), + 2 collaborators (frontend, ML)
**Sprint Length:** 2 weeks
**Period:** February - May 2026

---

## Sprint 1: Foundation (Feb 3 - Feb 16)

**Goal:** Get the basic infrastructure up and build the assessment module.

### What We Did
- Set up Flask backend with PostgreSQL
- Designed the cognitive profile schema (first draft  -  this changed a lot)
- Built the initial assessment module: three game-like tasks that estimate attention span, reading speed, and visual processing preferences
- Created the anonymization pipeline  -  decided early that no PII would ever touch the database
- Basic React frontend scaffolding

### What We Learned
- The initial assessment can't feel like a test. Our first version had a progress bar that said "Question 3 of 8" and even that felt too much like school. Removed it. Made the tasks feel like a game with no visible scoring.
- PostgreSQL was the right call. The cognitive profile has relational structure that would have been painful in a document store.

### Decisions Made
- Anonymize at ingestion, not at storage. If PII briefly exists in our system before being scrubbed, that's a liability. It gets stripped before it enters the application layer.
- Assessment capped at 5 minutes. Longer than that and we're asking kids to do the thing they struggle with (sustain attention) before we've even started helping them.

---

## Sprint 2: Adaptive Engine v1 (Feb 17 - Mar 2)

**Goal:** Build the first version of the adaptive engine.

### What We Did
- Trained initial TensorFlow model on synthetic data
- Built the four-axis adaptation system (difficulty, pacing, visual complexity, feedback frequency)
- Created the engagement tracker  -  monitors click velocity, pause patterns, time-on-element
- First integration of adaptive engine with content delivery
- Built the micro-feedback system (positive acknowledgments only)

### What We Learned
- The model converges faster than expected. After about 15 minutes of interaction, it has a reasonable profile. We initially designed for convergence after 5 sessions  -  turns out 3 is enough.
- Separating difficulty from visual complexity was the right move. In testing with ourselves (not kids yet), we noticed that we performed differently on the same problem depending on how cluttered the screen was. This validated the research insight from Dr. Mendez.

### Decisions Made
- No negative feedback of any kind. Not even a subtle red color. The research was clear: wrong-answer indicators cause stress responses in our target users. When a child gets something wrong, the system just... moves on. Or offers a gentle redirect. Never punishes.
- On-device inference for the real-time adjustments. We tested server-side and the latency was noticeable. When a kid's attention is dropping, every millisecond matters.

---

## Sprint 3: The Gamification Pivot (Mar 3 - Mar 16)

**Goal:** Add gamification elements (points, badges, streaks) to increase engagement.

### What Actually Happened

This sprint was supposed to be about gamification. We built it. Points for completing tasks. Badges for streaks. A little progress garden where flowers grew as you learned.

Then we tested it with four kids at the after-school program (pre-pilot informal sessions with parental consent).

It was a disaster.

**What went wrong:**

Two of the four kids (both with ADHD) became hyperfocused on the points. They started clicking through problems as fast as possible without reading them. One child got visibly agitated when he lost a streak  -  more upset than he'd been about any wrong answer. The gamification wasn't motivating learning. It was motivating point-optimization and creating new anxiety.

A third child seemed overwhelmed by the badge animations. She kept looking away from the screen when the badge popup appeared, which meant she missed the transition to the next problem and got confused.

The fourth child ignored the gamification entirely and seemed puzzled by why the screen was celebrating.

**Ms. Rodriguez (our teacher collaborator) was blunt:**

> "You built a dopamine slot machine. These kids already have differences in dopamine processing. You're pouring gasoline on a fire."

She was right.

### The Pivot

We ripped out all gamification elements. All of them. Three days of work, deleted.

In their place, we designed what we called the "quiet progress" system:
- No points. No badges. No leaderboards. No streaks.
- Instead: a simple visual indicator that shows the child they've completed something. A gentle checkmark. A soft color change on a progress path.
- Progress is shown as "you did 4 things today" rather than "you earned 40 points"
- No comparison. No competition. No optimization target.

The change was dramatic. In informal testing the following week, session times increased and the frantic clicking-through behavior disappeared.

### What We Learned

This was the most important sprint of the project. We went in with an assumption (gamification drives engagement) and the kids showed us we were wrong  -  not wrong in general, but wrong for this population. CogSci background should have caught this: gamification exploits dopamine reward pathways, and our users have atypical dopamine signaling. We were designing against their neurology.

**The lesson: "engagement" for kids with ADHD doesn't mean excitement. It means calm, sustained attention. The goal is focus, not stimulation.**

### Decisions Made
- Zero gamification. Not reduced gamification. Zero.
- "Quiet progress" as the only motivational system
- Every design decision now gets filtered through: "does this increase stimulation or decrease it?" If it increases stimulation, it's out.

---

## Sprint 4: Pilot Preparation (Mar 17 - Mar 30)

**Goal:** Prepare for the formal pilot at the Berkeley Youth Learning Center.

### What We Did
- Partnered with the Berkeley Youth Learning Center (after-school program for kids 7-12)
- IRB approval for observation and data collection (UC Berkeley Protocol #2026-01-0342)
- Parental consent forms  -  worked with a privacy attorney to make them readable (most consent forms are written in legalese that parents sign without understanding)
- Trained three after-school program facilitators on the tool
- Built the parent dashboard (basic version): progress patterns, session frequency, engagement trends
- Content library: 120 math exercises across 10 difficulty levels, each with 5 visual complexity variants
- Accessibility review: tested with OpenDyslexic font, high contrast mode, reduced motion, and screen reader
- Load testing (unnecessary for 15 users, but good practice)

### What We Learned
- Writing consent forms that are both legally sound and actually readable is really hard. We went through 4 drafts. The final version is at a 6th grade reading level and clearly states what we collect (almost nothing), what we don't (everything identifiable), and what parents can do (delete all data anytime).
- Teachers wanted to be able to see real-time engagement during sessions. We hadn't planned for this. Added a lightweight teacher view to P1.

### Decisions Made
- Pilot size: 15 students. Small enough to observe individually, large enough for meaningful patterns.
- Pilot duration: 4 weeks, 3 sessions per week (Tuesday, Wednesday, Thursday after school)
- Each session: 20 minutes of NeuroLearner use, followed by 5 minutes of teacher observation notes
- Control condition: same students' task completion rates from previous 4 weeks using their regular tools (pre/post within-subjects design)

---

## Sprint 5: Pilot Weeks 1-2 (Mar 31 - Apr 13)

**Goal:** Run the first two weeks of the pilot and iterate based on live data.

### What We Did
- Launched pilot with 15 students (9 with ADHD, 4 with dyslexia, 2 with both)
- Collected baseline comparison data from teachers' records of previous 4 weeks
- Daily check-ins with facilitators
- Mid-pilot profile accuracy review (are the cognitive profiles converging?)

### What We Observed

**Week 1:**
- 12 of 15 students' profiles converged by session 3 (as predicted)
- 3 students needed more calibration time  -  all three had combined ADHD + dyslexia, which makes sense (more variables to model)
- Average session engagement: 14.2 minutes (we allocated 20, but voluntary engagement past the structured time was the real signal)
- One child asked if she could use it at home. That felt good.

**Week 2:**
- Task completion rates already trending upward for 11 of 15 students
- Two students showed no change  -  their profiles suggested they needed even shorter feedback loops than our system provided. We adjusted the minimum feedback interval from 30 seconds to 15 seconds.
- The "quiet progress" system was working. No frantic clicking. No anxiety about points. Kids were just... working.
- Ms. Rodriguez reported that one student who usually refuses to do schoolwork sat down and completed 8 math problems without prompting. "That's never happened," she said.

### Hot Fixes
- Reduced minimum feedback interval from 30s to 15s for profiles with very short attention curves
- Fixed a bug where the visual complexity wasn't resetting between sessions (a child would start a new session at the previous session's reduced complexity instead of the profile default)
- Added a "take a break" suggestion that triggers when engagement drops below a threshold for more than 60 seconds

---

## Sprint 6: Pilot Weeks 3-4 + Analysis (Apr 14 - Apr 27)

**Goal:** Complete the pilot, analyze results, and document findings.

### What We Did
- Completed pilot: all 15 students finished 12 sessions each (100% completion  -  no dropouts)
- Compiled engagement data and task completion metrics
- Conducted post-pilot interviews with facilitators, parents (who volunteered), and teachers
- Analyzed results (full analysis in METRICS.md)

### Results Summary
- **35% improvement** in task completion rates across all 15 students
- **40% reduction** in frustration indicators (engagement drop-off patterns)
- **100% pilot completion rate**  -  every child completed all 12 sessions
- Average voluntary session extension: 3.4 minutes beyond the structured 20 minutes

### What Happened on Day 9

On the 9th session  -  a Wednesday, third week  -  a kid named (we'll call him) Marcus finished a set of problems and looked up at his facilitator. He's 8, ADHD and dyslexia, and his teacher had told us he "shuts down" with most learning tools.

He said: **"This one doesn't yell at me when I'm wrong."**

That's it. That's the whole sentence. He went back to the next problem.

His facilitator wrote it down and texted it to me. I sat in the campus library and cried. Not because it was poetic. Because a child had been using tools that felt like they were yelling at him, and the bar for making him feel safe was just... not doing that.

That's the bar. We barely cleared it. But for Marcus, barely clearing it was enough to keep going.

### Post-Pilot Priorities
- Teacher dashboard (real-time session view)
- Content expansion beyond math
- Break system refinement (guided breaks, not just suggestions)
- Prepare for larger pilot (targeting 50 students, fall 2026)

### What We Learned (Overall)
- Small interventions matter enormously. We didn't revolutionize education. We shortened a feedback loop and removed some noise. And it changed how these kids felt about learning.
- Designing for the margins improves things for everyone. Three of the 15 students didn't have formal diagnoses  -  their parents enrolled them because they "seemed to struggle with focus." Those kids showed the same improvement patterns. Designing for ADHD and dyslexia just means designing for how attention actually works.
- You can't A/B test empathy. The numbers are important, but what made this project real was watching a child feel safe enough to try again after getting something wrong.
