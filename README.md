# yusuke-iw.github.io

Yusuke Iwasaki's profile site (GitHub Pages).

The top is a serious profile. Scroll to the bottom and you reach "The Useless Corner": an assortment of 18 deliberately pointless games. Playing them unlocks sound loops that you can layer in the "Groove Machine". Plain HTML / CSS / JS, no build step.

Live site: https://yusuke-iw.github.io/

## Layout

```
index.html              Top page (profile, the gift box, game list, Groove Machine, save)
core/core.js            Shared core: saving, sound drops, unlock notice, goal strip on game pages, save codes, language
core/core.css           Shared styles (header, language toggle, unlock notice, goal strip)
data/profile.json       Profile (EN / JA)
data/apps.json          Game list (18 games)
data/unlocks.json       Sounds, goals ("drops"), presets, max sounds at once (same for everyone)
apps/<id>/index.html    Each game
sounds/*.wav            The first six 120 BPM loops
sounds/120|180|400|1280/*.wav   Loops for each tempo
tools/make_sounds.py    Synthesizes every loop (numpy only)
tests/                  Jest tests (see "Tests")
icon.svg                Favicon (navy "YI" monogram)
manifest.webmanifest    Name and colors when added to a home screen
CLAUDE.md               Working rules (TDD etc.)
```

## Games (18)

None of them has anything to do with BPM or tempo; each one stands on its own as a pointless game. Themes lean towards monotonous, empty tasks and actions that produce nothing, and stay away from office / boss jokes (a test checks that no office or boss words appear).

| id | Name (JA) | What you do |
|---|---|---|
| muda-button | 無駄ボタン | Press it. Nothing happens |
| natto | 納豆まぜまぜ | Trace circles around the bowl to stir the natto |
| kyomu | 虚無タイマー | Do nothing for as long as you can. Touch anything and you lose |
| somen | 流しそうめん | Catch only the noodles. Slippers and an old man float by too |
| pan | 菓子パンの向きそろえ | Tap the sweet buns on the conveyor until they are the right way up. They never stop coming |
| nekosui | 猫吸い | Hold to sniff the cat. Let go before it gets angry |
| puchipuchi | プチプチ | Pop the bubble wrap. There is always another sheet |
| usb | USB一発 | Plug it in on the first try. It is usually the wrong way |
| haguruma | 謎の歯車 | Step left, right, forever to turn a wheel connected to nothing ("What is it for?" Nobody knows) |
| ana | 穴を掘って埋める | Dig a hole, fill it back in, back to how it was |
| label | ラベル剥がし | Peel the bottle label off in one piece. Too fast and it tears |
| kaisatsu | 改札タッチ | Touch your card at the ticket gate. Too short or too long and it beeps at you |
| seidenki | 静電気 | Shuffle on the carpet, then touch the doorknob |
| cupmen | 体内時計カップ麺 | Eat the cup noodles at exactly 30 seconds, without a timer |
| tsurikawa | 満員電車 | Lean against the train's sway (← → / A D, ◀ ▶, or tap either side of the car) |
| nidone | 二度寝 | Snooze for 5 more minutes at a time. Lose your blanket and you lose it all |
| kushami | くしゃみ | Sneeze at the exact peak of the tickle |
| kutsushita | 靴下の片割れ | Find the one pair that actually matches among 12 socks |

## How sounds are unlocked

- Every game has "goals" (6 each for the first six games, 4 each for the other twelve, 84 in total). Each time you reach one, **a random sound you do not own yet, from any tempo,** drops. There are exactly as many goals as sounds (84), so playing everything unlocks everything.
- Goals are variations in how you play, not just "a bigger number of the same thing". For example:
  - Counts and records (press 10 times, do nothing for 30 seconds, …)
  - Getting it wrong in a row (same foot 5 times in a row, scratched by the cat 3 times in a row, USB the wrong way 4 times in a row, …)
  - Odd ways to play (turn a bun that is already right, "fill" flat ground, ask "what is it for?", touch the doorknob with no charge, leave the noodles for over a minute, …)
- When a sound drops, a small notice ("NEW SOUND!" with the sound name, its BPM and the goal you reached) and some confetti appear at the bottom, and the sound plays once. **It never blocks play**: no dimmed screen, every tap goes through to the game, and it fades out by itself after about 3 seconds (several are shown one after another).
  - If you already own every sound, reaching a goal shows "Achievement unlocked!" instead.
  - "Unlock everything" (the cheat on the top page) shows no notice.
- Each game page lists that game's goals (condition, progress, and the sound it gave) in a single line at the top. If they do not fit, only that strip scrolls sideways; the page itself never scrolls. `core.js` adds it automatically on `/apps/<id>/`.

## Groove Machine

- Sounds come in sets per tempo: 120 (24) / 180, DnB (20) / 400, speedcore (20) / 1280, extratone (20). The UI only shows the BPM number.
- Switch with the tabs at the top. Only one set ever plays; switching stops the previous tempo before starting the new one (rapid tapping while loading never mixes them).
- Up to `maxOn` (6) sounds at once; a seventh is refused. The selection is remembered per tempo.
- Six recommended presets per tempo (24 in total), on a single sideways-scrolling row. Presets you cannot complete yet show "🔒 N to go" and cannot be picked (complete ones show just their name). Each tempo starts with its first complete preset. Every preset includes a bass, and every sound of the tempo appears in at least one preset.
- At least 25% of each tempo is bass (`bass: true`).
- While playing, the panel glows in time with the BPM (lamps and slowly rotating beams). Each pulse has a **1/128 chance of FEVER** (8 pulses of a rainbow border and background, and "★ FEVER ★").
  - Photosensitivity care: at most 2 pulses per second (faster tempos pulse every 2, 4 or 16 beats), soft fades instead of flashes, and only inside the panel.
  - Off from the start if the OS "reduce motion" setting is on; toggled with the "Lights" button (stored in the browser as `fz-fx`).

## Top page

- Tap the box ("an assortment of uselessness") to open or close it. Its state is remembered.
- The game list is paged, 6 per page (‹ ›, dots, or swipe). Two columns × three rows on phones.
- Coming back from a game scrolls straight to "The Useless Corner" heading (if the box is open) and opens the page that game is on.
- Titles and the footer never show a silly name (the page title is "Yusuke Iwasaki"; each game is "<game name> | Yusuke Iwasaki").

## Data

- Progress lives in the browser's localStorage under `fuzake-box-v1`. **Never change this key**: visitors would lose their progress. There is no server.
- Shape: `{ v: 1, stats: { <app id>: { <stat>: number } }, unlocked: [<sound id>], drops: [<goal id>], dropSounds: { <goal id>: <sound id> }, since }`.
- `data/unlocks.json`:
  - `maxOn` … how many sounds can play at once (6)
  - `sounds` … `{ id, bpm, file, name: {en, ja}, bass? }`. Names must not reveal the instrument. When replacing a sound, **keep its id** so people who already own it keep it.
  - `drops` … `{ id, app, stat, gte, label: {en, ja} }`. Reached when the `app`'s `stat` is at least `gte`. `label` is the condition shown on the game page.
  - `presets` … `{ id, bpm, name: {en, ja}, sounds: [<sound id>] }`
- A save code (a string starting with `FZ1.`) moves progress to another device or restores it.
- "Erase everything" does not use `confirm()`; you tap it twice to confirm (in-app browsers sometimes make `confirm()` silently return false).

## Adding a game

1. Create `apps/<new id>/index.html` (copy an existing game). Load `/core/core.css` and `/core/core.js` with `?v=`, and link the favicon.
2. Report what the player did:
   - Add to a total … `FZ.add('<id>', '<stat>', 1)`
   - Best or longest run … `FZ.max('<id>', '<stat>', value)`
3. Add a line to `data/apps.json` (it appears in the list on the top page).
4. Add the game's goals to `drops` in `data/unlocks.json`, and the same number of sounds to `sounds`.
5. Check that the page does not scroll on small screens (375×667 / 320×568).

`core.js` handles drops, the unlock notice, saving and the goal strip, so a game only has to report.

Sound effects: call `FZ.sfx('ok')` and friends (synthesized on the spot, no files). The full list is `FZ.sfxNames` (tap / pop / ok / ng / chime / fanfare / thud / swoosh / clunk / connect / rustle / rip / beep / pingpong / crackle / zap / pour / slurp / clack / ring / fizzle / achoo). The game name sits in the middle of the header (`core.css`).

## Making the sounds

```
python3 tools/make_sounds.py
```

- Synthesizes every WAV with numpy alone. 22050 Hz, mono, 16-bit. Every loop in a tempo set has the same length (120: 4 s / 180: 5.33 s / 400: 2.4 s / 1280: 3 s).
- **Never change an existing sound by a single byte.** Changing the order or the number of random draws changes every sound after it. Replaced generators are still called (without saving) to keep the random sequence intact.
- Hits sit on the beat grid (16ths for 120/180/400, whole beats for 1280). Tests check this.

## Cache busting

GitHub Pages caches files for about 10 minutes. After changing `core/` or `data/`, bump `V` in `core/core.js` and every `?v=` in the HTML files to the same number (currently 14). Tests fail if they disagree.

## English / Japanese

- English by default. Switch with `EN / JA` at the top right (applied in place). The choice is stored in the browser as `fuzake-box-lang` (not included in save codes).
- Text in JSON is written as `{ "en": "...", "ja": "..." }` (`FZ.t(value)` picks the current language).
- Fixed page text lives in `const T = { en: {...}, ja: {...} }`; give elements `data-i18n="key"` (or `data-i18n-html` for text with line breaks) and call `FZ.apply(T)`.

## Running locally

Paths are root-relative (`/core/...`), so serve the repository root:

```
python3 -m http.server 8000
# → http://localhost:8000/
```

## Tests (we work test-first)

```
npm install        # first time only
npm test           # everything
npm run test:watch
```

- Jest + jsdom. `openPage('/apps/pan/', {...})` in `tests/helpers/page.js` opens a page from the repository as if in a browser.
  fetch, AudioContext, the clock (`page.clock.ms`), randomness (`opts.random`) and `confirm()` (false by default) are replaced.
- `tests/helpers/wav.js` … reads WAV files and finds where each hit starts
- `tests/data.test.js` … data and file consistency (loop lengths, beat grid, bass share, presets, goal count, cache version, favicon, README language, …)
- `tests/core.test.js` … saving, drops, unlock notice, save codes, language, goal strip
- `tests/top.test.js` … top page (profile, box, paged game list, Groove Machine, presets, limit, lights, FEVER, save)
- `tests/apps.test.js` … the basic play of each game
- `tests/behaviors.test.js` … the play variations behind the goals (getting it wrong in a row, …)
- `tests/sfx.test.js` … sound effects (the shared ones and where each game uses them) and the centered header title
- `tests/games3.test.js` … the bun, wheel and dig games, Snooze, and that no office or boss words appear
- How we work: **write a failing test → make it pass → tidy up**. Every bug fix also gets a test that stops it coming back.
- GitHub Actions runs `npm test` on every push and pull request (`.github/workflows/test.yml`).
- Commit messages are written in English.
