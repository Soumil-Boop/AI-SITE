# The AI Classroom 🧠

A free, interactive educational website that teaches Artificial Intelligence to students of all ages. Built with plain HTML, CSS, and JavaScript — no frameworks, no build tools, no dependencies.

**Live site:** [soumil-boop.github.io/AI-SITE](https://soumil-boop.github.io/AI-SITE)
**Repo:** [github.com/Soumil-Boop/AI-SITE](https://github.com/Soumil-Boop/AI-SITE)

---

## What It Does

The AI Classroom explains AI concepts in plain language for students from age 8 to adult. It covers what AI is, its history, the different types, how to use it responsibly, and provides hands-on interactive tools for learning and exam preparation.

---

## Features

| Feature | Description |
|---|---|
| 📖 **11 Content Panels** | Home, What is AI, History, Types, Study Tools, Ethics, Quiz, Lab, Finder, Resources, Contact |
| 🤖 **Felix the Mascot** | Custom SVG robot mascot with animations, floating effect, and blinking eyes |
| 🧪 **Visual Learning Lab** | AI-generated questions via Claude API across 5 subjects and 5 curricula |
| 📝 **Exam Prep Centre** | Timed practice questions for CUET, Railways, Bank PO, SSC, and UPSC |
| 🔍 **AI Tool Finder** | Keyword-scored search across 20+ AI tools with subject and curriculum filters |
| ❓ **AI Quiz** | 5-question quiz with progress bar, instant feedback, and 4-tier result scoring |
| 🎬 **Per-page Animations** | 9 unique entrance animations, one per content panel |
| 📱 **Fully Responsive** | Works on mobile, tablet, and desktop |
| ♿ **Accessibility** | Reduced motion support, aria labels, keyboard navigation |

---

## Project Structure

```
ai-classroom/
├── index.html                  # Main single-page app entry point
│
├── pages/                      # Individual content pages
│   ├── what-is-ai.html
│   ├── history.html
│   ├── types.html
│   ├── study-tools.html
│   ├── more-study.html
│   ├── ethics.html
│   ├── quiz.html
│   ├── lab.html
│   ├── finder.html
│   ├── resources.html
│   └── contact.html
│
├── css/
│   ├── base/
│   │   ├── variables.css       # Design tokens (colours, spacing, radius)
│   │   ├── reset.css           # CSS reset and base styles
│   │   └── typography.css      # Font rules, headings, body text
│   ├── components/
│   │   ├── nav.css             # Navigation bar styles
│   │   ├── buttons.css         # Button variants
│   │   ├── cards.css           # Card components
│   │   └── forms.css           # Form inputs and labels
│   ├── layout/
│   │   ├── grid.css            # Grid, timeline, section layouts
│   │   └── sections.css        # Section wrappers and spacing
│   └── pages/
│       ├── hero.css            # Hero banner styles
│       ├── lab.css             # Visual Learning Lab styles
│       ├── quiz.css            # Quiz styles
│       ├── finder.css          # Tool Finder styles
│       └── study.css           # Study Tools page styles
│
├── js/
│   ├── core/
│   │   ├── nav.js              # Navigation mounting and active state
│   │   └── utils.js            # Shared utility functions
│   ├── components/
│   │   ├── lab.js              # Visual Learning Lab logic
│   │   ├── finder.js           # Tool Finder search and scoring logic
│   │   ├── quiz.js             # Quiz logic and scoring
│   │   └── contact.js          # Contact form handling
│   └── pages/
│       └── hero.js             # Home page hero animations and canvas
│
└── data/
    └── tools-data.js           # AI tool database (20+ tools with tags and metadata)
```

---

## Design System

### Colour Tokens (`css/base/variables.css`)

| Token | Value | Used For |
|---|---|---|
| `--brand` | `#1D4ED8` | Primary blue, buttons, links |
| `--brand-dark` | `#1E3A8A` | Nav, dark hero backgrounds |
| `--brand-light` | `#DBEAFE` | Light blue tints, hover states |
| `--accent` | `#F97316` | Orange accent, CTAs, highlights |
| `--accent-dark` | `#C2410C` | Darker orange for text on light |
| `--green` | `#059669` | Correct answers, success states |
| `--purple` | `#7C3AED` | History and secondary accents |
| `--text` | `#111827` | Primary body text |
| `--muted` | `#6B7280` | Secondary/descriptive text |

### Typography

| Role | Font | Weight |
|---|---|---|
| Headings (h1–h4) | Nunito | 700–900 |
| Body, labels, inputs | Inter | 400–600 |
| Eyebrow labels | Inter | 700, uppercase, tracked |

### Layout Rules

- **60-30-10 colour rule:** White/gray neutral (60%), Brand blue (30%), Accent orange (10%)
- **Border radius:** `--radius: 16px` for cards, `--radius-sm: 10px` for inputs and tags
- Max content width: `1100px` centred with `padding: 0 2rem`

---

## Pages and Panels

### Home
- Felix the mascot with floating animation
- Neural network canvas background (animated dots and connecting lines)
- Scrolling quote carousel with 9 real AI pioneer quotes
- Stats bar, feature cards, mission statement, and personal statement

### What is AI? (Chapter 1)
- Definition with analogy cards (child learning, recipe, sports coach)
- Everyday AI examples with accordion expand/collapse
- Clickable heading accordions throughout

### History of AI (Chapter 2)
- Interactive timeline from 1950 to today
- 6 milestones: Turing Test, Dartmouth, AI Winters, Deep Blue, Deep Learning, ChatGPT era
- Each milestone expands on click

### Types of AI (Chapter 3)
- 6 type cards: Machine Learning, Neural Networks, NLP, Computer Vision, Generative AI, Reinforcement Learning
- Each card has icon, description, and expand-on-click content

### Study Tools (Chapter 4)
- 6 study tips with accordion content
- 9 AI tool pills linking to the Finder

### Ethics (Chapter 5)
- 6 ethics cards: Academic Integrity, Fact-Checking, Privacy, Bias, Credit, Environment

### Quiz
- 5 questions covering AI history, types, and responsible use
- Progress bar, instant feedback, 4-tier result (Beginner / Curious / Informed / Expert)

### Visual Learning Lab
**Tab 1 — Curriculum Lab**
- AI-generated questions via Claude API (`claude-sonnet-4-6`)
- 5 curricula: CBSE, ICSE, UK National Curriculum, US Common Core, IB
- 4 age groups: 5–7, 8–10, 11–13, 14–16
- 5 subjects: Maths, Science, English, History, Geography
- MCQ and numeric question modes
- Visual number blocks for young maths learners
- Hint system, Explain button, streak tracker, celebration overlay

**Tab 2 — Exam Prep**
- AI-generated exam-pattern questions via Claude API
- 5 exams: CUET, Railways (RRB NTPC/Group D), Bank PO (IBPS/SBI), SSC (CGL/CHSL/MTS), UPSC Prelims
- 4 subjects: General Knowledge, Quantitative Aptitude, Logical Reasoning, English
- Difficulty levels: Easy, Medium, Hard
- Optional countdown timer: 30s, 60s, 90s, 2 minutes
- Live scoreboard: Correct, Wrong, Accuracy %, Streak

### Find My AI Tool
- 20+ tools in the database with tags, subjects, age groups, and free/paid flags
- Keyword and tag scoring algorithm returns ranked results
- Subject filter, free-only toggle
- Quick search chips for common use cases

### Resources
- 9 resource cards: Videos, Books, Courses, Troubleshooting, Glossary, For Teachers, Job Hunting, Community, FAQs
- All accordion-expand on click

### Contact
- Contact form with HTML5 validation
- Success state on submission (frontend only, no backend yet)

---

## How to Run Locally

1. Clone the repo:
   ```bash
   git clone https://github.com/Soumil-Boop/AI-SITE.git
   cd AI-SITE
   ```

2. Open in VS Code:
   ```bash
   code .
   ```

3. Right-click `index.html` and select **Open with Live Server** (requires the Live Server extension by Ritwick Dey).

4. Opens at `http://127.0.0.1:5500/index.html`

> **Note:** The Visual Learning Lab and Exam Prep tabs require an internet connection to call the Claude API. The Tool Finder works offline using the local scoring algorithm.

---

## How to Deploy

```bash
git add .
git commit -m "your message here"
git push
```

GitHub Pages automatically deploys from the `main` branch. Changes go live at [soumil-boop.github.io/AI-SITE](https://soumil-boop.github.io/AI-SITE) within a minute or two.

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — live on GitHub Pages |
| `dev` | Active development — merge into main when ready |

**Workflow:**
```bash
# Switch to dev to work
git checkout dev

# Make changes, then commit
git add .
git commit -m "describe changes"
git push

# When ready to go live, merge into main
git checkout main
git merge dev
git push

# Switch back to keep working
git checkout dev
```

---

## API Usage

The Lab and Exam Prep use the Anthropic Claude API:

- **Model:** `claude-sonnet-4-6`
- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Max tokens:** 600–700 per request
- **Fallback:** If the API is unavailable, a friendly error message is shown

The Tool Finder uses a local scoring algorithm — no API call required.

---

## Planned Features

- [ ] Firebase Authentication (student accounts)
- [ ] Firestore progress tracking (save scores across sessions)
- [ ] Teacher dashboard (track student progress)
- [ ] Real contact form email backend
- [ ] Custom domain (theaiclassroom.com)
- [ ] More exam types and question banks
- [ ] Dark mode toggle

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | Vanilla CSS (custom design system, no framework) |
| Scripting | Vanilla JavaScript (ES6+, no framework) |
| Fonts | Google Fonts (Nunito + Inter) |
| AI | Anthropic Claude API (claude-sonnet-4-6) |
| Hosting | GitHub Pages |
| Dev server | VS Code Live Server |

---

## Mascot

**Felix** is the AI Classroom robot mascot. He's a friendly custom SVG robot with:
- Blinking eyes (`blink` keyframe animation)
- Floating body (`mascotFloat` 4s loop)
- Pulsing antenna (`antennaPulse`)
- Chest lights in orange, green, and blue
- Rosy cheeks and a curved smile

Felix appears on the home page and as the tutor avatar in the Visual Learning Lab and Exam Prep tabs.

---

## Content Guidelines

- No em dashes (`—`) in display content — use commas or restructure the sentence
- Contractions encouraged (`it's`, `you're`, `don't`) for a human, friendly tone
- No jargon without explanation
- Every concept explained with at least one analogy or real-world example

---

*Made with ❤️ for curious learners everywhere. AI is a tool. You're the thinker.*
