# Join page: short demo animation (plan)

Status: built Nov 20, 2026 (draft PR #17).
- Source project: `tools/join-demo-video/` (Remotion). The frames in `public/frames/` are real captures of the live demo.
- Re-render: `cd tools/join-demo-video && npm install && npm run render`, then copy `out/join-demo.mp4` and `out/join-demo-poster.jpg` to `frontend/images/`.
- Page code: `frontend/scripts/join-demo-video.js`. Its shot timings must match `src/JoinDemo.tsx`.
- Decisions taken: captions in all 4 languages; plays twice, then stops on the congee answer.
- What changed from the plan: MP4 only, with no WebM. MP4 plays in every current browser, and the WebM came out larger. Rendered at 960×720, 1.3 MB.

## Goal

Visitors to /join should see FuelWell working in about 12 seconds, then want to open the live demo.
It shows three things, in this order:

1. **Recipes:** a quick glimpse.
2. **Browse swaps.**
3. **Swap & eat out:** the payoff. The AI answers a real question.

It replaces the still screenshot beside the headline, in the same browser frame.

## Format: a real screen recording, edited

- **Why a recording:** it looks real. The first attempt (commit `6fb72e8`) drew the app in HTML. It moved well, but it looked like a mock-up, not the product.
- **How:** record the live demo in Chrome at 2× resolution. Edit it in the existing Remotion project (`~/Desktop/FuelwellVideo`, the same tool as the launch video). Use quick cuts, short cross-fades and gentle zooms.
- **Export:** MP4 (H.264) plus WebM, 1200×800, muted, 24–30 fps, at most 1.5 MB.
- **Poster:** the congee screenshot already on the page (`frontend/images/demo-congee.jpg`). Anyone who doesn't get the video sees exactly what's there today.

## Shot list (about 12.5 s, loops)

| Time | Shot | What's on screen | Caption (3–5 words) |
|---|---|---|---|
| 0.0–3.0 s | **Recipes** | Meals → Recipes. The grid of NIH recipes scrolls a little, with the sodium and potassium on each card. "Marinated Chicken (Adobong Manok)" opens, then zoom on **Na 330 mg / K 370 mg**. | "54 recipes, sodium and potassium listed" |
| 3.0–6.5 s | **Browse swaps** | Swap cards with photos glide up. Zoom on one card: the **Na / K / P** badges, then "Why it matters". The heart is tapped to save it. | "70 swaps with photos" |
| 6.5–11.0 s | **Swap & eat out** | Typing (sped up): "Can Mom have congee with salted egg?". Then "Get swaps". The answer card appears and the camera eases down: "Keep it, tweak it", then the Sodium, Potassium and Phosphorus rows. | "Ask about any meal" |
| 11.0–12.5 s | **End card** | The answer card holds, with a soft "Try the live demo" button. | none |

Rules for the edit:
- No visible mouse cursor wandering around.
- Every cut is under 250 ms.
- Zooms stay at or under 1.08×.
- Each caption stays up for its whole shot.
- One accent color only (the existing FuelWell green).

## On the page

- Plays only while it's on screen, muted, looping and inline. It starts after the page has loaded, so it doesn't slow sign-up.
- A small pause/play button sits in the corner. Motion that runs longer than 5 seconds needs a way to stop it (WCAG 2.2.2).
- With reduced motion turned on, it shows the poster, not the video.
- Captions are HTML on top of the video, not baked in, so they switch with the language buttons (EN / 简体 / 繁體 / ES). The app inside the video stays in English. A Chinese or Spanish recording can come later.
- The question bubble and the "Personalized for Mom · CKD stage 3b" tag stay outside the frame, as they are now.

## Things to avoid

- **Don't show the demo dietitian label "Mei Chen, RD"** unless a real dietitian has reviewed the content. Crop it out.
- **Don't show made-up numbers.** Only the real NIH values (330 mg, 370 mg) and real AI output from the live demo.
- **Don't let it run longer than about 13 seconds.** People should want to click through to the real thing.

## Steps

1. Record the three flows in the live demo, 2× resolution, English. About 1 hour.
2. Edit in Remotion: cuts, zooms, timing. Export MP4, WebM and the poster. About 2–3 hours.
3. Put it in the hero frame:
   - `<video>` with the poster
   - play only when visible
   - pause button
   - reduced-motion fallback
   - HTML captions in 4 languages
   
   About 1–2 hours.
4. Check on a phone and a laptop, with reduced motion on, and in all 4 languages.

## Decisions for Megan

- Captions in all 4 languages (recommended), or English only for now?
- Loop forever, or play once and stop on the end card? Recommended: play twice, then stop on the end card.
