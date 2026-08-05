# Pilot Metrics  -  NeuroLearner

**Pilot Location:** Berkeley Youth Learning Center (after-school program)
**Duration:** 4 weeks (March 31 - April 27, 2026)
**Participants:** 15 students, ages 7-12
**Sessions:** 12 per student (3x/week, 20 minutes structured)
**Design:** Within-subjects pre/post (baseline: 4 weeks of prior tool usage from teacher records)

---

## Headline Results

| Metric | Baseline | With NeuroLearner | Change |
|--------|----------|-------------------|--------|
| Task completion rate | 47% | 63% | **+35%** |
| Frustration indicators (drop-off events per session) | 4.8 | 2.9 | **-40%** |
| Voluntary session extension | 0.6 min | 3.4 min | **+467%** |
| Pilot completion rate |  -  | 100% | All 15 students completed all 12 sessions |

---

## Task Completion by Disability Type

Not all learning differences are the same. The adaptive engine needed to work differently for different profiles, and the results reflect that.

| Group | n | Baseline Completion | Post Completion | Improvement |
|-------|---|-------------------|-----------------|-------------|
| ADHD only | 9 | 51% | 70% | +37% |
| Dyslexia only | 4 | 44% | 58% | +32% |
| ADHD + dyslexia | 2 | 38% | 52% | +37% |

**Notes:**
- The ADHD-only group showed the most absolute improvement, which makes sense  -  the feedback loop optimization was designed primarily around attention dynamics.
- The dyslexia-only group's improvement came largely from visual complexity adjustments (reduced text density, larger fonts, cleaner layouts) rather than pacing changes.
- The combined group started from the lowest baseline and showed strong relative improvement. These students needed the full adaptive system  -  pacing, visual, and feedback adjustments simultaneously. Their profiles took longer to converge (sessions 4-5 vs. sessions 2-3 for other groups) but once converged, the improvement trajectory was steep.
- Sample sizes are small. These are directional findings, not statistical claims.

---

## Engagement Patterns

### Time-to-First-Success

How long until a child completes their first task and receives acknowledgment.

| Metric | Baseline (prior tools) | NeuroLearner |
|--------|----------------------|--------------|
| Mean time-to-first-success | 2 min 14 sec | 38 sec |
| Median | 1 min 48 sec | 31 sec |
| 90th percentile | 4 min 30 sec | 1 min 12 sec |

This was the metric I cared about most. The research told us that kids who don't feel progress within 90 seconds are at high risk of checking out. Getting median time-to-first-success down to 31 seconds means most kids feel a win before their attention has a chance to waver.

### Session Engagement Curves

We tracked engagement (a composite of interaction velocity, time-on-task, and pause patterns) across each 20-minute session.

**Baseline tools:** Engagement peaks around minute 3-5, then drops sharply. Most kids hit a "wall" around minute 8-10.

**NeuroLearner:** Engagement ramps up by minute 2, sustains through minute 15-17, then gradual taper. Many kids voluntarily continued past 20 minutes.

The sustained engagement plateau from minutes 5-17 is the key finding. Baseline tools showed a cliff. NeuroLearner showed a plateau. The adaptive feedback loop is keeping kids in the productive zone longer.

---

## Frustration Indicators

We defined "frustration indicators" as:
- **Engagement drop-off**: A sharp decrease in interaction velocity (> 50% reduction in clicks/scrolls within a 30-second window)
- **Session abandonment attempts**: Trying to close the app or navigate away (captured by facilitator observation)
- **Physical disengagement**: Pushing device away, looking around the room, putting head down (captured by facilitator observation)

| Indicator | Baseline (per session) | NeuroLearner (per session) | Change |
|-----------|----------------------|---------------------------|--------|
| Engagement drop-offs | 3.2 | 1.8 | -44% |
| Abandonment attempts | 0.9 | 0.4 | -56% |
| Physical disengagement events | 0.7 | 0.7 | 0% |

**Note on physical disengagement:** This metric didn't change, and we think that's actually fine. Kids still looked away, stretched, fidgeted. But they came back. The difference is that with baseline tools, physical disengagement often preceded abandonment. With NeuroLearner, kids would look away for a few seconds and then re-engage. The system's break detection helped  -  when it noticed a pause, it didn't advance to new content. It waited.

---

## Adaptive Engine Performance

### Profile Convergence

| Group | Median sessions to convergence | Range |
|-------|-------------------------------|-------|
| ADHD only | 2.5 sessions | 2-3 |
| Dyslexia only | 2 sessions | 1-3 |
| ADHD + dyslexia | 4 sessions | 3-5 |

"Convergence" = profile parameter adjustments between sessions < 5% change.

### Adaptation Accuracy

After convergence, we measured how often the adaptive engine's adjustments matched facilitator judgment ("would you have adjusted the same way?").

- **Difficulty adjustments**: 78% agreement with facilitator judgment
- **Pacing adjustments**: 84% agreement
- **Visual complexity adjustments**: 91% agreement
- **Feedback timing**: 72% agreement

Feedback timing had the lowest agreement because facilitators often felt they would have intervened sooner than the system did. This is fair  -  the system is conservative by design (it would rather wait than interrupt), but there's room to make it more responsive.

---

## Teacher Feedback

Post-pilot survey (3 facilitators + Ms. Rodriguez):

| Statement | Average (1-5) |
|-----------|-------------|
| "The tool adapted appropriately to each student" | 4.3 |
| "Students seemed less frustrated than with other tools" | 4.5 |
| "I would recommend this tool to other teachers" | 4.8 |
| "The progress dashboard gave me useful information" | 3.5 |
| "The tool complemented my teaching approach" | 4.0 |

**Qualitative highlights:**

Ms. Rodriguez:
> "For the first time, I had a tool I could hand to a student and not worry it would make things worse. That's a low bar, but it's a bar most tools don't clear."

Mr. Okonkwo (facilitator):
> "The kid who usually refuses to engage  -  he completed every session. Every single one. I kept waiting for him to push the tablet away and he never did."

Ms. Tran (facilitator):
> "The quiet progress thing works. I was skeptical because it seems like it's not doing much, but the kids just... kept going. No meltdowns about losing points. No arguments about whose score was higher. They just worked."

**Area for improvement:**

The dashboard scored lowest (3.5). Teachers wanted real-time visibility during sessions, not just post-session summaries. They also wanted the ability to map progress to IEP goals. Both are planned for the next version.

---

## Parent Observations

8 of 15 parents responded to a post-pilot check-in (voluntary, not required).

**Themes:**

1. **"They asked to use it at home"** (5 of 8 parents reported this): The most common observation. Children were voluntarily asking to use NeuroLearner outside of the structured sessions. One parent said her daughter hadn't voluntarily done anything school-related in months.

2. **"Less homework drama"** (3 of 8 parents): While NeuroLearner is supplemental, not a homework tool, some parents noticed that their children's overall relationship with learning improved during the pilot. We can't claim causation, but it's worth noting.

3. **"I could actually see progress"** (4 of 8 parents): Parents appreciated the dashboard's growth-oriented framing. One father said: "For once, a report that didn't make me feel like my kid is behind."

4. **"I felt good about the privacy"** (6 of 8 parents): Nearly all responding parents mentioned privacy positively. Kevin (from our user research phase) responded: "You actually did what you said you'd do. No email spam, no weird data requests. Just a tool that works."

---

## The Moment

On Session 9, a child we're calling Marcus  -  8 years old, ADHD and dyslexia  -  finished a set of problems. He'd been using learning tools for two years. He had internalized, at age 8, that these tools were adversarial. That they existed to catch him being wrong.

He looked up at his facilitator and said:

> **"This one doesn't yell at me when I'm wrong."**

Then he went back to the next problem.

We didn't cure anything. We didn't fix his ADHD or his dyslexia. We built a tool that didn't yell at him. And that was enough for him to keep trying.

That's the metric that doesn't fit in a table. But it's the one that matters most.

---

## Limitations

Let's be honest about what this data can and can't tell us.

- **n = 15.** This is a pilot, not a study. These findings are directional. They suggest something is working, but they don't prove it at scale.
- **No control group.** Within-subjects design (pre/post) means we can't rule out novelty effects, facilitator enthusiasm, or simple practice effects.
- **Short duration.** 4 weeks is enough to see initial engagement patterns. It's not enough to know if improvements persist.
- **Self-selected sample.** Parents who enrolled their children in the pilot are likely more engaged than average. The results may not generalize to less-supported families.
- **Facilitator observation is subjective.** Frustration indicators that relied on facilitator judgment introduce bias. We're working on more objective measurement for the next pilot.

### Next Steps

- Larger pilot: 50 students, fall 2026
- Randomized controlled design with waitlist control group
- Extended duration: 12 weeks
- Addition of reading and writing content
- Real-time teacher dashboard
- Longitudinal follow-up at 3 and 6 months

---

*All data collected under UC Berkeley IRB Protocol #2026-01-0342. No individual child data is reported  -  all metrics are aggregated. "Marcus" is a pseudonym; his quote is used with parental permission.*
