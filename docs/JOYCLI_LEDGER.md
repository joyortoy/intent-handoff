# JoyCLI visual ledger

JoyCLI verifies rendered Chrome output at 1440×900. Screenshot is the source of truth.

| SCENE | EXPECTED | OBSERVED | VISUAL DIFFERENCE | FIX | RETEST | RESULT |
| --- | --- | --- | --- | --- | --- | --- |
| 01 Landing | Tokyo hero, search card, preferences, empty trip panel | Tokyo Tower dusk hero, FROM/TO/DATES empty, cream hotel layout, Your trip empty | First pass used Akihabara neon; search stacked in narrow Cursor pane | Warmer Tokyo Tower photo; CSS desktop grid; 1440 viewport capture | scene-01.png | PASS |
| 02 Preferences complete | All demo selections, Let AI finish this ready | Singapore→Tokyo, Next week, $200, transit, late, balanced, CTA enabled | Arrival pill contrast read as gray in one capture; state was selected | Kept navy selected pills | scene-02.png | PASS |
| 03 Working | Preferences retained, polished progress | Finding your best match, Preferences understood checked, no developer log | Demo timing is short; progress still readable | Demo sleep cap 280ms retained | scene-03.png | PASS |
| 04 First match | Mitsui Garden Hotel Kyobashi $175, rejected capsule | Mitsui $175, TR808, Best match, Ueno capsule too far from transit | First pass clipped rejected reason below fold | Shorter hero, smaller photo, removed Start over | scene-04.png | PASS |
| 05 Budget change | $200 → $150, other intent retained | Delta card visible, frozen tags still $200/transit/late/balanced, $150 selected | Delta was below match and clipped | Delta moved above match; compact result | scene-05.png | PASS |
| 06 Updated match | Sotetsu Fresa Inn Kanda $136 | Sotetsu $136, Updated match, retained-intent copy | None material | — | scene-06.png | PASS |

## Functional

Singapore, Tokyo, Next week, ≤$200, Near train station, Late arrival, Balanced, handoff, first result, $200→$150, retained intent, updated result, `?demo=true` clean start, `?debug=true` internals, production `npm run build`: PASS.

WebMCP tool handlers unchanged. Headless Chrome has no `document.modelContext`; local adapter executes the same tools.
