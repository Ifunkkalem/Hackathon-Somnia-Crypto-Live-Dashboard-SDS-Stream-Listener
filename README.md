# DreamStream Airdrop Monitor — Neon Terminal 

This upgraded demo is tailored for the Somnia Data Streams Hackathon.


## Features
- Mocked real-time points & mission simulator (no backend required)
- Live pair prices via Binance WebSocket (public)
- Chart.js visualization for points history
- Responsive, mobile-friendly, neon terminal UI
- Clear adapter file for replacing mock with Somnia Data Streams SDK

## How to run locally / on GitHub Pages
1. Upload all files to GitHub repo root (index.html, style.css, app.js, stream_adapter.js, README.md)
2. Enable GitHub Pages: Settings → Pages → branch: main, folder: root
3. Open the Pages URL (wait 30–60s)

## Integrate Somnia Data Streams
Edit `stream_adapter.js` and replace mock logic with Somnia SDK subscription. Ensure to call:
- `window.onPointsUpdate(wallet, points)`
- `window.onMissionUpdate(wallet, mission)`
- `window.onStreamStatus(text)`
- `window.onStreamLog(text)`

## Submission tips
- Record 1–2 minute demo using mock simulator, explain how Somnia streams will be plugged in.
- Include repo and Pages link in DoraHacks submission.
- Add short roadmap & next steps in README if you want grants/mentorship.


Built by Hilldanime Labs — Good luck!

🇮🇩ifunkkalem91 
