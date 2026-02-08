# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EVE Online universe map app for Android built with Expo. Renders ~5,000 K-space solar systems as an interactive pan/zoom map using GPU-accelerated Skia canvas. All UI text is in Japanese.

## Commands

```bash
npx expo start --android   # Start dev server for Android
npx tsc --noEmit            # Type check
npm run lint                # Oxlint (src/ and app/)
npm run format              # Prettier write
npm run format:check        # Prettier check
```

Install new dependencies with `npx expo install` for Expo-managed packages (Skia, Reanimated, etc.) and `npm install --legacy-peer-deps` for pure JS packages (react-dom peer dep conflict with react@19.1.0).

## Architecture

### Data Pipeline

```
ESI API (language=ja) → Zod validation → neverthrow Result<T, ApiError> → Zustand store → React components
```

- **API layer** (`src/api/`): `client.ts` wraps `fetch` returning `Result<T, ApiError>`. `esi.ts` provides typed functions for each ESI endpoint. All responses validated against Zod schemas in `schemas.ts`.
- **State** (`src/store/`): `universeStore` holds all universe data (systems, constellations, regions, connections, derived adjacency list). `mapStore` holds ephemeral UI state (selection, route, detail level).
- **Cache** (`src/utils/cache.ts`): 7-day filesystem cache via expo-file-system v19 class API (`File`, `Directory`, `Paths`).

### Loading Sequence

On first launch, `universeStore.loadUniverse()` orchestrates: cache check → fetch region IDs → fetch all regions → fetch all constellations → fetch all systems (batched, 20 concurrent, 100ms delay) → fetch all stargates → build adjacency list → save cache. Subsequent launches load from cache in <1 second.

### Rendering

`MapCanvas.tsx` uses `@shopify/react-native-skia` Canvas with Reanimated SharedValues for transform. All stargate connections are batched into a single `Skia.Path` (one draw call). System nodes are individual `Circle` elements. Gestures compose Pan + Pinch (simultaneous) racing with Tap.

### Routing (Expo Router)

- `app/index.tsx` — Map screen (conditionally shows LoadingScreen or MapCanvas + overlays)
- `app/search.tsx` — Modal search with in-memory fuzzy matching
- `app/system/[id].tsx` — System detail with live ESI stats and route calculation

## Key Conventions

### Error Handling

All fallible operations return `Result<T, ApiError>` from `neverthrow`. No try-catch. Use `.match()`, `.map()`, `.isOk()`/`.isErr()` for control flow. Error messages are in Japanese.

### Zod v4

Import from `'zod/v4'`, not `'zod'`.

### expo-file-system v19

Uses the new class-based API. `File.text()` returns `Promise<string>`. The legacy `documentDirectory`/`getInfoAsync`/`writeAsStringAsync` functions throw at runtime in v19.

### Skia 2.2.12

- Use `PaintStyle.Stroke` enum, not literal `1`
- `Group` transform accepts `Transforms3d` or `{ value: Transforms3d }` (SharedValue-compatible)
- `matchFont()` for canvas text rendering

### SharedValue Typing

When `useSharedValue` is initialized with a `const` literal (e.g., `MAP.INITIAL_ZOOM` which is `3 as const`), TypeScript infers the type as the literal. Explicitly annotate: `useSharedValue<number>(MAP.INITIAL_ZOOM)`.

### Coordinate System

EVE coordinates (~10^17 range) are normalized by dividing by 1e16. Systems store `nx`, `nz` (normalized X and Z axes, top-down projection; Y axis ignored). These normalized coordinates are what the Skia canvas renders.

### ESI API

Base URL: `https://esi.evetech.net/latest`. Always pass `datasource=tranquility` and `language=ja`. K-space regions are IDs 10000001–10000070. Rate limit: 20 req/s unauthenticated; the batch fetcher uses 20 concurrency with 50–100ms delays.

## Japanese UI

All user-facing strings are centralized in `src/constants/strings.ts`. Security classifications: ハイセク/ローセク/ヌルセク. System/region/constellation names come from ESI with `language=ja`.
