# Architecture  -  NeuroLearner

**Author:** Tanya Hemdev
**Last Updated:** August 2026

---

## System Overview

NeuroLearner is built around one architectural principle: the system should adapt to the child, not the other way around. Every design decision flows from that.

```
+----------------------------------------------------------+
|                      React Frontend                       |
|  +----------+  +--------------+  +-------------------+   |
|  |Assessment|  | Learning     |  | Dashboard         |   |
|  |  Module  |  | Module       |  | (Parent/Teacher)  |   |
|  +----+-----+  +------+-------+  +--------+----------+   |
|       |               |                    |              |
|  +----v---------------v--------------------v----------+   |
|  |          Accessibility Context Layer               |   |
|  |   (font prefs, contrast, motion, visual density)   |   |
|  +--------------------+-------------------------------+   |
+------------------------|---------------------------------+
                         | REST API
+------------------------|---------------------------------+
|                  Flask Backend                            |
|  +---------------------v-----------------------------+   |
|  |              Anonymization Layer                   |   |
|  |         (PII stripped at ingestion)                |   |
|  +---------------------+-----------------------------+   |
|                        |                                 |
|  +------------+  +-----v------+  +--------------------+  |
|  | Assessment |  | Adaptive   |  | Engagement         |  |
|  | Service    |  | Engine     |  | Tracker            |  |
|  +-----+------+  +-----+------+  +---------+----------+  |
|        |               |                    |            |
|  +-----v---------------v--------------------v----------+ |
|  |              Cognitive Profile Store                 | |
|  |                (PostgreSQL)                          | |
|  +-----------------------------------------------------+ |
+----------------------------------------------------------+
```

---

## Adaptive Engine

The adaptive engine is the core of NeuroLearner. It makes real-time decisions about what to show a child and how to show it.

### What It Adjusts

The engine controls four independent dimensions:

| Dimension | What It Means | Example |
|-----------|--------------|--------|
| **Difficulty** | How hard the content is | Single-digit vs. multi-digit addition |
| **Pacing** | How fast new content appears | 30s between problems vs. 90s |
| **Visual Complexity** | How much is on screen | Single element vs. multi-panel layout |
| **Feedback Frequency** | How often the child gets acknowledgment | Every task vs. every third task |

These are independent. A child might need high difficulty but low visual complexity. Or slow pacing but infrequent feedback (some kids find too-frequent feedback patronizing). The engine learns each child's combination.

### How It Decides

The adaptive engine uses a TensorFlow model that takes in:

**Inputs:**
- Current cognitive profile (see below)
- Session history (last 5 minutes of interaction data)
- Engagement signal (time-on-task, interaction velocity, pause patterns)
- Current content difficulty level
- Current visual complexity level

**Outputs:**
- Next difficulty adjustment (-1, 0, +1 on a 10-point scale)
- Pacing recommendation (seconds until next content)
- Visual complexity target (1-5 scale)
- Feedback timing (immediate, delayed, or none)

The model is not a classifier  -  it's a regression model that outputs continuous adjustments. Small, frequent adjustments rather than big jumps. The child should never feel the system shifting underneath them.

### Training Approach

We don't train on real child data. The model was trained on synthetic data generated from:
- Published research on attention curves in children with ADHD (Castellanos & Tannock, 2002; Huang-Pollock et al., 2012)
- Reading speed distributions for children with dyslexia (Shaywitz, 2003)
- Simulated engagement patterns based on our observation session data (aggregated, anonymized)

The model is then fine-tuned per child through online learning  -  each session updates the child's profile, and the model adapts. After ~3 sessions, the model has typically converged on a stable adaptation strategy for that child.

### Feedback Engine

The feedback engine is a subsystem specifically responsible for micro-acknowledgments. It's separated from the adaptive engine because its timing requirements are strict.

```
Engagement Signal --> Attention Estimator --> Feedback Timer
                                                   |
                                             +-----v-----+
                                             | Threshold  |
                                             | Check      |
                                             +-----+--+--+
                                           below   |  |  above
                                        threshold  |  |  threshold
                                                   |  |
                                             +-----v+ +v------+
                                             | Send | | Wait  |
                                             | Ack  | |       |
                                             +------+ +-------+
```

The attention estimator runs on a sliding 15-second window. If engagement signals (click velocity, scroll behavior, time-on-element) suggest attention is dropping toward the child's personal threshold, the feedback engine sends an acknowledgment of whatever progress has been made  -  even partial progress.

The threshold is different for every child and shifts throughout a session (attention typically degrades over time, so thresholds adjust downward).

---

## Cognitive Profile Model

Each child has a cognitive profile. This is not a diagnosis. It's a learning preference model that captures how this specific child interacts with content.

### Profile Schema

```python
CognitiveProfile:
    profile_id: str           # Anonymous UUID, no PII linkage
    
    # Attention model
    sustained_attention_curve: list[float]   # Estimated attention over time (normalized)
    attention_recovery_time: float            # Seconds to recover after a break
    optimal_session_length: float             # Minutes before attention degrades significantly
    
    # Reading model
    reading_speed_wpm: float                 # Words per minute (estimated, not tested)
    preferred_font_size: int                 # Learned from interaction patterns
    line_length_preference: int              # Characters per line before comprehension drops
    
    # Visual processing
    visual_complexity_tolerance: int          # 1-5 scale
    motion_sensitivity: bool                 # Does animation degrade performance?
    color_contrast_preference: str           # "standard", "high", "dark"
    
    # Feedback preferences
    feedback_frequency_optimal: float         # Seconds between acknowledgments
    feedback_modality: str                   # "visual", "audio", "haptic", "none"
    negative_feedback_tolerance: str          # "none", "gentle_redirect", "standard"
    
    # Engagement patterns
    session_history: list[SessionSummary]     # Last 20 sessions
    avg_time_to_first_frustration: float      # Seconds (estimated from drop-off patterns)
    break_pattern: list[float]               # Typical break intervals
    
    # Model state
    last_updated: datetime
    model_confidence: float                  # 0-1, increases with more sessions
```

### How Profiles Are Built

1. **Initial Assessment** (5 minutes): Game-like tasks that estimate baseline values for attention curve, reading speed, and visual processing. This is intentionally short  -  we'd rather start with rough estimates and refine than make a child sit through a long assessment.

2. **Continuous Refinement**: Every interaction updates the profile. If a child starts pausing longer between tasks, the sustained attention curve adjusts. If she starts ignoring feedback popups, the feedback frequency adjusts down. This happens silently  -  the child never knows the system is learning.

3. **Convergence**: After approximately 3 sessions (about 30-40 minutes of total interaction), the profile typically stabilizes. Adjustments continue but become smaller.

### What Profiles Are NOT

- Not diagnostic instruments
- Not comparable across children (each profile is self-referencing)
- Not stored with any identifying information
- Not shared with anyone without explicit parental consent
- Not used for any purpose beyond adapting the learning experience

---

## Content Delivery Pipeline

```
Content Library --> Difficulty Tagger --> Complexity Analyzer --> Profile Matcher --> Renderer
                                                                                       |
                                                                       +---------------v------+
                                                                       | Accessibility Layer  |
                                                                       | - Font adjustment    |
                                                                       | - Color mapping      |
                                                                       | - Motion removal     |
                                                                       | - Layout simplify    |
                                                                       +----------------------+
```

Content goes through four stages before reaching a child:

1. **Difficulty Tagging**: Each piece of content is tagged on a 1-10 difficulty scale within its subject area. Tagging is done manually by educators during content creation and verified via pilot testing.

2. **Complexity Analysis**: Automated analysis of visual complexity  -  number of elements, color variety, text density, spatial layout. This is independent from difficulty. A simple addition problem can have high visual complexity if it's surrounded by decorative elements.

3. **Profile Matching**: The adaptive engine selects content at the appropriate difficulty level and flags whether the content's visual complexity matches the child's tolerance. If not, it passes to the renderer with transformation instructions.

4. **Rendering**: The React frontend applies the accessibility context  -  adjusting font, colors, layout density, and motion based on the child's profile. The same math problem might render as a single centered equation for one child and a multi-step guided walkthrough for another.

---

## Privacy-First Architecture

### Design Principles

Privacy isn't a feature we added. The system was designed from the ground up so that identifying a child from our data is architecturally impossible.

### Anonymization Pipeline

```
User Input --> Anonymization Layer --> Application
                     |
                     +-- Strip name (if entered anywhere)
                     +-- Strip location data
                     +-- Strip device identifiers
                     +-- Generate anonymous profile UUID
                     +-- Log anonymization event (auditable)
```

The anonymization layer sits between all user input and the application. Nothing passes through without being scrubbed. Even if a child types their name into a text field during an exercise, it's stripped before it reaches the database.

### What We Store

| Data | Stored? | Purpose |
|------|---------|--------|
| Child's name | No | Never needed |
| Age | Approximate range only (7-9, 10-12) | Content appropriateness |
| Diagnosis | No | We adapt to behavior, not labels |
| School | No | Never needed |
| Device ID | No | Stripped at ingestion |
| Cognitive profile | Yes (anonymous) | Core adaptive function |
| Session interaction data | Yes (anonymous, 90-day retention) | Profile refinement |
| Parent email | Hashed, stored separately | Account recovery only |

### COPPA Compliance

- Verifiable parental consent required before any data collection
- No behavioral advertising. No data monetization. Ever.
- Parents can view all stored data associated with their child's anonymous profile
- Parents can request complete deletion at any time
- Data automatically purged after 12 months of inactivity
- Annual third-party privacy audit (planned for post-launch)

### Data Flow Isolation

The parent dashboard and the child's learning environment are completely isolated data paths. A parent can see aggregate progress indicators, but cannot replay individual session interactions. This protects the child's sense of autonomy  -  the learning space is theirs.

---

## Infrastructure

### Current (Pilot)

- **Hosting**: Local development server during pilot sessions
- **Database**: PostgreSQL (single instance)
- **ML Inference**: On-device (model is small enough to run client-side for latency reasons)
- **Monitoring**: Basic Flask logging + custom engagement event tracking

### Planned (Post-Pilot)

- **Hosting**: AWS (us-west-2), chosen for COPPA-compliant data handling options
- **Database**: PostgreSQL on RDS with encryption at rest
- **ML Inference**: Hybrid  -  lightweight adjustments client-side, profile updates server-side
- **Monitoring**: Structured logging, anomaly detection on engagement patterns
- **Backup**: Daily encrypted snapshots, 30-day retention

---

## Key Technical Decisions

| Decision | Rationale |
|----------|----------|
| Flask over Django | We needed speed of iteration, not batteries included. The API surface is small. |
| TensorFlow over PyTorch | Better deployment story for on-device inference (TensorFlow Lite). |
| React over Vue/Svelte | Component architecture maps well to swappable complexity levels. Same math problem, different component rendering. |
| PostgreSQL over MongoDB | Cognitive profiles have relational structure. Profile fields reference content difficulty scales, session histories, etc. Relational model is more natural. |
| On-device inference | Latency matters. When a kid's attention is dropping, we can't afford a 200ms round trip to adjust the UI. Client-side inference gives us < 50ms response. |
| No WebSocket for real-time | Polling at 5-second intervals is sufficient for profile updates. WebSocket complexity wasn't justified for the pilot. Will revisit at scale. |
