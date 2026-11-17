# Nehodovka

Road crashes in Czechia, from raw Czech Police data, as a mobile web app (PWA) that teaches through dark humour.

- **Dnes / Today**: a live countdown to the next crash, injury and death (statistically), a 24-hour "rhythm of death" chart, "on this day", a card of the day, and a daily-quiz streak.
- **Karty / Cards**: a full-screen swipe feed of 44 data-driven "black cards" in 7 categories and three colours. Each card has a statistic, a dark joke about the behaviour behind it, and a lesson, and can be shared as a 1080×1350 image.
- **Mapa / Map**: a heatmap of every injury crash since 2023. Tap a crash for details, analyse a 1 km radius around you, or browse the **100 black spots**: places with 10+ injury crashes within 300 m, ranked by severity.
- **Hry / Games**:
  - a daily quiz (the same for everyone, with streaks) and a random quiz;
  - **"What killed more?"**, an endless higher/lower game over about 50 real death counts;
  - **"How will it get you?"**, a playful risk profile built from how you travel, your age, your region and when you travel.
- Czech and English, and it can be installed to the home screen.

House rule for the humour: jokes target **behaviour** (speed, phones, alcohol, overconfidence), never victims.
Individual crashes on the map get facts and a safety tip only, never a joke.

## Data

Source: [Policie ČR – Statistiky dopravní nehodovosti](https://policie.gov.cz/statistiky-dopravni-nehodovosti).
The police publish one RAR per year at `policie.gov.cz/statistiky-dopravni-nehodovosti-za-rok-YYYY`. It contains
complete records as HTML tables disguised as `.xls`, encoded in windows-1250:

| file | content |
|---|---|
| `Inehody` | one row per accident (time, place, cause, alcohol, casualties …) |
| `IntGPS` | coordinates in S-JTSK (EPSG:5514) |
| `IVozidla` | vehicles |
| `Inasledky` | people in vehicles and what happened to them |
| `Ichodci` | pedestrians |

The codebook ("Položky formuláře") is linked from the same pages. Raw records exist **from 2023 onwards**; older
years are only published as PDF yearbooks.

Caveats shown in the app:
- Deaths are counted **within 24 hours** (as recorded per accident). Official yearly totals use 30 days and are slightly higher.
- The map shows injury crashes only. Damage-only crashes appear in the statistics.

### Pipeline

```
npm run data              # discover → download → parse → aggregate → public/data/
npm run data -- --offline # rebuild from .cache/raw without network
npm run data -- --force   # publish even if the safety check fails
npm test                  # parser / coordinate / validation tests
```

`scripts/pipeline/`:
- `sources.mjs`: scrapes each year page for the archive link. It prefers the complete-year `dataYYYY` and falls back to the rolling `datawebMMYYYY`, and caches by ETag.
- `parse.mjs`: decodes the HTML tables and converts S-JTSK to WGS84 (proj4).
- `build.mjs`: joins the tables and builds the aggregates (`stats.json`, `days.json`), compact per-region map points (`points/*.json`) and `blackspots.json` (a 250 m grid scored as deaths×25 + serious×6 + light, at least 10 crashes, spots at least 1.5 km apart).
- `validate.mjs`: refuses to publish if a year shrinks by more than 10 %, a complete year has fewer than 50k rows, or rows stop parsing. A broken police export therefore never replaces good data.

Output is committed in `public/data/` (about 1 MB gzipped in total).

### Automatic updates

`.github/workflows/deploy.yml` runs **every Monday** and can also be started by hand:
1. It runs the pipeline, which picks up a new month, a newly completed year, or a new year page by itself.
2. If the data changed, it commits `public/data` to `main`.
3. It builds and deploys to GitHub Pages.

If validation fails, the run fails, GitHub emails the repo owner, and the live site keeps the last good data.

## Development

```
npm install
npm run dev       # http://localhost:5173
npm run build     # → dist/
```

Stack: React + TypeScript + Vite, MapLibre GL with the OpenFreeMap basemap (free, no API key), and vite-plugin-pwa.

### One-time GitHub setup
- Settings → Pages → Source: **GitHub Actions**.
- Merge to `main`. The deploy workflow serves the app from `https://<user>.github.io/nehodovka/`.
