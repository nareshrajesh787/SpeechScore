# SpeechScore - Design Language System

## 1. Visual Identity
* **Philosophy:** Professional, focused, and encouraging. The aesthetic balances the productivity of a workspace tools (e.g., Linear, Notion) with the training focus of a fitness app (e.g., Strava).
* **Primary Color:** **Indigo-600** (`#4f46e5`) - Used for primary actions, active states, and brand definition.
* **Secondary/Accent:** **Purple-600** (`#9333ea`) - Used for AI features, insights, and key highlights ("Magic" moments).
* **Backgrounds:**
    * **App Background:** Zinc-50 (`#fafafa`) - Provides a low-strain reading surface compared to pure white.
    * **Surface/Cards:** White (`#ffffff`) - Creates separation and depth against the Zinc background.
* **Semantic Colors:**
    * **Success:** Emerald-600 - High scores, positive feedback.
    * **Warning:** Amber-500 - Pacing cautions, minor issues.
    * **Error:** Red-600 - Filler words, critical failures.

## 2. Typography
* **Font Family:** System Default / Sans-Serif (Inter equivalent).
* **Scale:**
    * **H1 (Page Title):** `text-3xl` (Desktop) / `text-2xl` (Mobile), `font-bold`, `text-gray-900`, `tracking-tight`.
    * **H2 (Section Header):** `text-xl`, `font-semibold`, `text-gray-800`.
    * **H3 (Card Title):** `text-lg`, `font-semibold`, `text-gray-700`.
    * **Body:** `text-base`, `text-gray-600`, `leading-relaxed`.
    * **Label/Meta:** `text-xs` or `text-sm`, `font-medium`, `text-gray-400`, `uppercase`, `tracking-wide`.

## 3. Spacing & Layout
* **Container:** `max-w-5xl` centered (`mx-auto`) for the main workspace; `max-w-7xl` for marketing/landing.
* **Grid System:**
    * Mobile: Single column (`grid-cols-1`).
    * Desktop: Asymmetric 2-column (`grid-cols-3` where main content is `col-span-2`), or standard 3-column.
* **Gaps:** Standardize on `gap-6` (24px) for major sections, `gap-4` (16px) for inner card content.
* **Border Radius:** `rounded-2xl` for containers/cards; `rounded-xl` for inner elements/buttons.

## 4. Core Components

### Card (`<Card>`)
The primary container for organizing content.
* **Props:** `children`, `className`, `padding` (default: `p-6`).
* **Base Styles:** `bg-white rounded-2xl shadow-sm border border-indigo-50/50 hover:shadow-md transition-shadow duration-200`.

### Button (`<Button>`)
Standard interactive element.
* **Variants:**
    * **Primary:** `bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1`.
    * **Secondary:** `bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200`.
    * **Ghost:** `bg-transparent text-indigo-600 hover:bg-indigo-50`.
* **Base Styles:** `px-4 py-2 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2`.

### Metric Tile (`<MetricTile>`)
Displays a single quantitative data point.
* **Structure:** Icon (Top Left), Value (Center/Large), Label (Bottom).
* **Style:** `bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-100 rounded-xl p-4`.

### Alerts / Feedback
* **Success:** `bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg p-3`.
* **Error:** `bg-red-50 text-red-800 border border-red-100 rounded-lg p-3`.

## 5. States & Interaction
* **Buttons:**
    * **Hover:** Slight brightness shift (e.g., `hover:bg-indigo-700`).
    * **Active:** `active:scale-95` primarily.
    * **Disabled:** `opacity-50 cursor-not-allowed grayscale`.
    * **Loading:** Show spinner, maintain width (`opacity-80`).
* **Empty States:**
    * Visual: Grayed-out icon or illustration centered in the container.
    * Text: Clear instruction on how to populate the view (e.g., "Start your first project").
    * CTA: Prominent primary button.
* **Motions:**
    * Transitions: `transition-all duration-200 ease-in-out` for hover/focus.
    * No aggressive animations; prefer subtle fades and slides.

## 6. Workspace vs. Marketing
* **Marketing (Landing Pages):**
    * **Density:** Low. maximize whitespace.
    * **Typography:** Larger headings (Display size), slightly looser line height.
    * **Imagery:** Rich visuals, device mockups, gradients.
* **Workspace (App):**
    * **Density:** Moderate to High. Optimize for data visibility.
    * **Typography:** Tighter scale, efficient data display.
    * **Controls:** Prominent, reachable actions. Functional minimalism.

## 7. Voice & Microcopy
* **Tone:** Encouraging, Specific, Objective.
    * *Avoid:* "Oops!", "Awesome!", vague praise.
    * *Prefer:* "Analysis complete.", "Try checking your pacing.", "Great improvement on clarity."
* **Examples:**
    * **Primary CTAs:** "Start a practice run", "Record draft 2", "Ask the coach".
    * **Descriptions:** "Track your speaking pace over time.", "AI Coach analyzes your transcript for filler words."
    * **Error Messages:** "Microphone access denied. Check your browser settings." (Clear, actionable, no blame).