# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web app that listens to speech and corrects users when they say "Twitter" instead of "X" (the rebranded name). It uses the Web Speech API for real-time speech recognition and plays audio corrections for various Twitter-related terms.

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server with host flag (for mobile testing)
npm run build     # TypeScript compile + Vite build
npm run lint-fix  # Run ESLint and Prettier with auto-fix
```

## Architecture

- **Vite + TypeScript** frontend app with SCSS styling
- Uses Web Speech API (`SpeechRecognition`) for real-time Japanese speech recognition
- No framework - vanilla TypeScript with DOM manipulation

### Key Files

- `src/main.ts` - Main application logic: speech recognition setup, word detection, and audio playback
- `src/buttonState.ts` - Simple state machine class for start/stop button UI

### Speech Recognition Logic

The app detects these word categories with associated corrections:
- "Twitter/ツイッター" → plays X correction
- "ツイート" (tweet) → plays X's (エックセズ) correction
- "リツイート" (retweet) → plays Repost correction
- "引用ツイート/引用リツイート" (quote tweet) → plays Quote correction

Each category has `excludeWords` to prevent false positives (e.g., "リツイート" excludes matching on "引用リツイート").

The recognition uses `interimResults: true` for responsive detection on partial speech results, with debouncing (3-second cooldown) to prevent repeated triggers.
