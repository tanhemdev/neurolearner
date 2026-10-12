# User Research: what we know, what we assume, what to test

This file separates three things on purpose: what came out of my time at the clinic, the design assumptions that followed, and the research still needed to check them. An earlier version of this repo described a different concept (an adaptive platform for ADHD and dyslexia) with pilot numbers that don't apply to this project. Those have been removed.

## Where the idea came from

- **Setting:** 2024 internship at TherapyTales, a speech and swallow therapy clinic in Mumbai run by Dr. Alifia Bharmal.
- **What I saw:** therapy sessions adapted closely to each child, using specialized equipment and personalized approaches. The learning games and worksheets those same children used outside the clinic assumed typical motor control and attention.
- **The question it raised:** if a clinician can adapt to a child in real time, why can't the tools a child uses every day?

## Design assumptions (to be validated)

| Assumption | Why it seems likely | Built into v1.0 as |
|---|---|---|
| Range of motion varies more between children than speed does | Motor differences often limit reach more than timing | Calibration that stretches any small range to full control |
| One "jump" gesture won't suit everyone | Pinch needs fine motor control; raising a hand needs shoulder control | Three gestures, chosen per child |
| Failure states discourage kids who already struggle with games | Repeated failure is a common reason children disengage | No lives, no game over, gentle wrong-answer feedback |
| Adults need to see what the tracker sees | Without feedback, a missed gesture is a mystery | Camera preview with landmarks, steering position and a jump meter |
| Families won't accept a camera that uploads video | Children's video is sensitive data | On-device processing, stated on the start screen |

## Research plan

1. **Clinician walkthroughs (3 to 5 therapists or special-ed teachers):** can they set up a profile in under a minute? Which settings are missing?
2. **Supervised play sessions (with consent, run by the child's therapist):** for each gesture, how often does an intended jump register, and how often does an unintended one fire?
3. **Parent interviews:** setup friction at home, privacy concerns, how often kids would play.

What to measure in each step is defined in [METRICS.md](METRICS.md).
