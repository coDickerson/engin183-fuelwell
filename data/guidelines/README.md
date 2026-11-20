# Guideline sources

The AI may only cite what is in this folder (after `npm run ingest` loads it into Supabase).
`sources.json` lists every source. The files themselves are **not committed**: they are
copyrighted, and this repository is public.

| Source | How to get it |
|---|---|
| NKF patient pages (`nkf-*.txt`, `nkf-*.pdf`) | `npm run fetch:guidelines` |
| KDOQI 2020 nutrition guideline | Download the PDF from https://doi.org/10.1053/j.ajkd.2020.05.006, save as `kdoqi-2020-nutrition.pdf` |
| KDIGO 2024 CKD guideline | Download https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf, save as `kdigo-2024-ckd.pdf` |
| SELF Principle Kidney Guide v2 (Dr. Sean Hashmi) | Free PDF from selfprinciple.org (newsletter download), save as `selfprinciple-kidney-guide-v2.pdf`. Only pages 9-10 are loaded. |
| KDIGO 2022 diabetes in CKD | Download from https://kdigo.org/guidelines/diabetes-ckd/, save as `kdigo-2022-diabetes-ckd.pdf` |

The KDIGO PDFs are long. To load only the diet and nutrition chapters, add a page range to
that source in `sources.json`, for example `"pages": [60, 75]`. Then run `npm run ingest`.

`npm run ingest -- --dry-run` shows how each file will be split without touching the database.
