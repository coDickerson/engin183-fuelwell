# FuelWell logo concepts

These are editable, transparent-background SVG assets sized for the FuelWell site and presentation slides. The files use the site's teal, clay, cream, and ink palette.

| Concept | Idea | Website | Slide or header | Compact icon |
|---|---|---|---|---|
| 01 Bowl & leaf | Food first; approachable and recognizable | `01-bowl-wordmark.svg` | `01-bowl-wordmark.svg` | `01-bowl-mark.svg` |
| 02 Family table | Parent and caregiver sharing a meal | `02-together-wordmark.svg` | `02-together-wordmark.svg` | `02-together-mark.svg` |
| 03 Steady path | Ongoing care and progress | `03-path-wordmark.svg` | `03-path-wordmark.svg` | `03-path-mark.svg` |

`concept-slide.svg` is a self-contained 16:9 comparison slide. Insert it as a picture in PowerPoint, Keynote, or Google Slides, or use an individual wordmark on your own slide.

The six individual assets are also in `frontend/public/logo-concepts/`, so the website can use them immediately. To try one in a brand link, replace the existing mark and text with:

```html
<img src="/logo-concepts/01-bowl-wordmark.svg" alt="FuelWell" width="228" height="48">
```

Use the matching compact mark for a favicon or social avatar. The wordmark text is live SVG text in Fraunces with Georgia fallback; installing or loading Fraunces keeps it closest to the website typography. The marks themselves use vector paths and have no font dependency.
