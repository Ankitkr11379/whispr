# Whispr Branding Guidelines

This document serves as the single source of truth for the **Whispr** product branding, visual language, and UI patterns. Any AI or developer working on the Whispr product should use these guidelines to maintain a consistent look and feel across all interfaces.

## 1. Color Palette

### Primary Colors
*   **Main Background:** `#0D0D0D` (Very Dark Gray/Black)
*   **Text (Primary):** `white` (`#FFFFFF`)
*   **Text (Secondary/Muted):** `#9CA3AF` (Tailwind `gray-400`), `#D1D5DB` (Tailwind `gray-300`)

### The Brand Gradient
The core identity of Whispr relies on a vibrant, 4-stop linear gradient. It is used in buttons, text highlights, and ambient background glows.
*   **Gradient:** `linear-gradient(135deg, #FB2BB6, #D210FA, #3E36FA, #01D7F7)`
*   **Stops:**
    *   Stop 1: `#FB2BB6` (Vibrant Pink)
    *   Stop 2: `#D210FA` (Neon Purple)
    *   Stop 3: `#3E36FA` (Electric Blue/Indigo)
    *   Stop 4: `#01D7F7` (Cyan)

### Accent & Interactive Colors
*   **Focus Rings & Active States:** `#A855F7` (Tailwind `purple-500`)
*   **Text Selection:** `bg-purple-500/30`
*   **Error / Danger / Destructive:**
    *   Backgrounds: `bg-red-500/15` or `bg-red-400/10`
    *   Borders: `border-red-500/30` or `border-red-400/20`
    *   Text: `text-red-300` or `text-red-400`

---

## 2. Typography

Whispr uses modern, clean typography mixing standard sans-serif for readability and stylized fonts for headings and interactive elements.

*   **Body Font:** `Inter`, sans-serif (Assigned to `--font-inter` and `body`)
*   **Heading Font:** `Poppins`, sans-serif (Assigned to `--font-poppins` for `h1` through `h6`)
*   **Button Text Font:** `Poppins`, Medium weight (`500`)

---

## 3. UI Components & Shapes

The UI heavily features fully rounded elements (pill shapes) for interactive components, and smooth, large border-radiuses for containers.

### Buttons
*   **Primary Button (`.btn-primary`):**
    *   Background: The Brand Gradient (`linear-gradient(135deg, #FB2BB6, #D210FA, #3E36FA, #01D7F7)`)
    *   Text: White, `Poppins` font, Weight `500`
    *   Shape: Fully rounded (`border-radius: 9999px`)
    *   Height: `48px`
    *   Effects: Small shadow (`box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1)`), scales down to `0.98` on hover and `0.95` on active.

*   **Secondary Button (`.btn-secondary`):**
    *   Background: White with 10% opacity (`rgba(255, 255, 255, 0.1)`)
    *   Border: White with 20% opacity (`1px solid rgba(255, 255, 255, 0.2)`)
    *   Shape: Fully rounded (`border-radius: 9999px`)
    *   Height: `48px`
    *   Effects: Backdrop blur (`8px`), Background changes to `rgba(255, 255, 255, 0.15)` on hover.

### Inputs
*   **Input Fields (`.input-field`):**
    *   Background: `rgba(255, 255, 255, 0.1)`
    *   Border: `1px solid rgba(255, 255, 255, 0.2)`
    *   Shape: Fully rounded (`border-radius: 9999px`)
    *   Padding: `10px 16px`
    *   Effects: Backdrop blur (`4px`). Focus state adds a `0 0 0 2px #a855f7` box-shadow ring.

### Cards, Modals, and Containers
*   **Radius:** Large radius `rounded-3xl` (approx. `24px`) is used for main content containers and dialogs.
*   **Chat Bubbles:** `rounded-[18px]` with contextual cut corners (`rounded-br-sm` or `rounded-bl-sm`).

---

## 4. Glassmorphism & Ambient Effects

Whispr utilizes a "Dark Glass" aesthetic. 

### Glass Cards
Standard styling for floating elements, containers, and onboarding cards:
*   Background: `bg-black/30`
*   Backdrop Filter: `backdrop-blur-lg` or `backdrop-blur-md`
*   Border: `border border-white/20` or `border-white/10`
*   Shadow: `shadow-2xl`

### Ambient Background Glows
A signature visual of Whispr is the out-of-focus colored orbs placed in the corners of screens, utilizing the colors from the Brand Gradient.
*   **Construction:** `w-36 h-36 rounded-full blur-[90px] opacity-60 absolute`
*   **Positioning Examples:**
    *   Top Left: `bg-[#FB2BB6]`
    *   Top Right: `bg-[#D210FA]`
    *   Bottom Right: `bg-[#3E36FA]`
    *   Bottom Left: `bg-[#01D7F7]`

---

## 5. CSS Utility Classes & Variables (Reference)

When writing vanilla CSS or extending Tailwind, these variables and utilities are the standard:

```css
@theme {
  --color-whispr-bg: #0D0D0D;
  --font-poppins: 'Poppins', ui-sans-serif, system-ui, sans-serif;
  --font-inter: 'Inter', sans-serif;
}

/* Gradient Utilities */
.bg-gradient-whispr {
  background: linear-gradient(135deg, #FB2BB6, #D210FA, #3E36FA, #01D7F7);
}

.text-gradient-whispr {
  background: linear-gradient(135deg, #FB2BB6, #D210FA, #3E36FA, #01D7F7);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## AI / Developer Prompt Injection
*When prompting an AI to create a new UI component for Whispr, include this snippet:*
> "Design this component using the Whispr brand guidelines: Dark theme (#0D0D0D background), glassmorphism (black/30 backgrounds, white/20 borders, backdrop-blur-lg), fully rounded interactive elements (pill shapes for buttons/inputs), Inter for body text, Poppins for headings. Use the 4-stop brand gradient (#FB2BB6, #D210FA, #3E36FA, #01D7F7) for primary actions and ambient background glows."
