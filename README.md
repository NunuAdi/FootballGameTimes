# שעון משחק 7 דקות

Hebrew RTL match clock for a 7-minute football game. Built for a phone on the sideline: a full-screen timer, a giant start/pause target, a Bluetooth shutter remote, and a stadium buzzer.

The clock is timestamp-based (`Date.now()`), so it stays accurate if the browser throttles background timers. Match state is stored in `localStorage`. While the clock runs, the screen wake lock stays on.

## Scripts

```bash
npm install
npm run dev
npm test
npm run build
```

Open the dev server on a phone on the same Wi-Fi via the Network URL Vite prints (`host: true`).

## Deploy on GitHub + Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from Git**.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Deploy. `netlify.toml` already sets the Node version, the SPA fallback, and wake-lock permission.

Install it from the browser: **Add to Home Screen**. The web manifest is Hebrew, RTL, portrait, and `standalone`.

## Sideline controls

- Lower half: **התחל משחק** / **השהה שעון / כדור עף**.
- Bluetooth shutter, Space, Enter, or media play/pause: same toggle. Volume and Camera keys are included because cheap selfie remotes emit those.
- Reset: hold the corner button for 1.5 seconds. The ring has to complete, so a bump does not zero the match.
- First tap unlocks Web Audio and Hebrew speech (`he-IL`).

Cues: double whistle + "דקה לסיום!" at 01:00, a beep + "שלושים שניות!" at 00:30, Hebrew seconds from 00:10, then a 3-second horn and a red flash at 00:00.
