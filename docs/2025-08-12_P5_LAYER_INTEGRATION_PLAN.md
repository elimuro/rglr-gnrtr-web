## P5 Layer Integration Plan

### Overview

Add an optional p5.js visual layer that renders on top of the existing Three.js scene and can be controlled via the current MIDI and audio mapping systems. The core UX is manual-first: users explicitly expose parameters from their sketches with a tiny helper, and can then map those parameters to MIDI CC or audio inputs. An optional smart-detection mode suggests likely parameters for pasted sketches.

### Goals

- Enable a p5.js canvas overlay without disturbing the Three.js pipeline
- Let users expose parameters from their p5 sketches in a simple, explicit way
- Reuse the existing MIDI and audio mapping flows (no special cases)
- Keep the UI lean for complex sketches; avoid overwhelming lists
- Persist sketch code and parameter mappings in scenes/presets

### Non-Goals (for v1)

- No node-based editor
- No full type-checking of user code
- No advanced sandboxing beyond basic scoping and error capture

## User Stories

- As a performer, I can enable a p5 overlay and paste or write a sketch
- As a creator, I can expose a p5 parameter and map it to a MIDI knob in seconds
- As a user pasting existing code, I can get quick suggestions for parameters to expose
- As a user, my p5 sketch and mappings are saved with my scene/preset

## UX Flow (manual-first)

1. Open the “P5 Sketch” panel and toggle “Enable p5 Layer”
2. Write or paste a sketch into the editor
3. Expose parameters in code using a helper and see them appear in a “P5 Parameters” list
4. Check “Expose to MIDI” for parameters to include in the mapping list
5. Click “Learn” and turn a knob (or map via the existing MIDI drawer → Target: `p5:<name>`)
6. Turn the knob to see immediate changes; optionally add audio mappings to the same targets
7. Save the scene/preset; reloading restores the sketch and mappings

### Example sketch (explicit parameter exposure)

```javascript
function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);
  const size = p5Param('ballSize', 50, { min: 10, max: 400 });
  circle(width / 2, height / 2, size);
}
```

## Architecture

### New module: `src/modules/P5LayerManager.js`

Responsibilities:
- Create, attach, and manage the p5 canvas overlay
- Maintain a registry of p5 parameters (name → { value, min, max, step, label })
- Provide an API to set/get parameters and to compile/run sketches
- Inject `p5Param` into the sketch’s runtime scope

Proposed public API:
- `compileAndRun(code: string): Promise<void>`: compiles and hot-reloads the sketch; shows inline errors
- `registerParam(name: string, config: { defaultValue: number, min?: number, max?: number, step?: number, label?: string }): void`
- `setParam(name: string, value: number): void`
- `getParam(name: string): number`
- `getExposedParams(): Array<{ name: string, min: number, max: number, label?: string }>`
- `destroy(): void`

Runtime helper injected into sketch:
- `p5Param(name: string, defaultValue: number, options?: { min?: number, max?: number, step?: number, label?: string }): number`
  - Registers the parameter on first call
  - Returns the current value (updated by MIDI/audio)

### Parameter routing (single hook)

- Extend `App.updateAnimationParameter(target, value)` in `src/core/App.js`:
  - If `target` starts with `p5:` then route to `this.p5LayerManager.setParam(name, value)` and return
  - Otherwise, fall through to existing switch logic

### Targets and mapping integration

- Dynamic targets use the format `p5:<paramName>`
- `midi-controls.js` target dropdown is augmented at runtime with a “P5 Parameters” group populated from `p5LayerManager.getExposedParams()`
- Audio mapping UI (`src/audio-mapping.js`) can target `p5:` items just like any other target because both MIDI and audio call `App.updateAnimationParameter`

### Editor integration

- A “P5 Sketch” card with:
  - Enable toggle
  - Code editor (basic syntax highlighting)
  - Run/Auto-run toggle; compile errors shown inline
  - “P5 Parameters” list: rows show name, current value, min/max, “Expose to MIDI”, “Learn”
  - Optional “Suggest parameters” toggle (smart detection)

## Smart Detection (optional fallback)

Purpose: assist less-technical users pasting sketches that don’t use `p5Param`.

Behavior (opt-in):
- Parse the code (Acorn/Babel) and collect simple candidates:
  - Numeric variables with reasonable initial values used inside `draw()` or top-level constants
  - Variables marked by `//@expose` or JSDoc `/** @expose */`
- Present suggested variables in a separate “Suggested” section with “+ Add” buttons to register them as `p5:` params
- No automatic exposure; explicit user confirmation required

## Persistence

Extend scene/preset serialization to include:
- `state.p5.enabled: boolean`
- `state.p5.code: string`
- `state.p5.params: Record<string, { min?: number, max?: number, step?: number, label?: string }>`
- `state.midiCCMappings` and `state.midiNoteMappings` already persist targets; they will include `p5:<name>` entries
- `state.audioMappings` can also include `p5:<name>` targets

## Performance Considerations

- Overlay setup: p5 canvas positioned above Three.js with `alpha: true`; ensure proper z-index and sizing
- Prefer 2D renderer for p5 (`P2D`) to avoid a second WebGL context unless needed
- Allow pausing p5 layer when hidden or when animation is paused (optional)
- Debounce/high-frequency updates (current MIDI path already debounces to ~60fps)

## Error Handling

- Catch compile/runtime errors in sketches; display an inline error panel in the P5 card
- Keep the last-good sketch running if hot-reload fails (optional)
- Clear errors on successful compile

## Security Notes

- User sketches run in the same origin; avoid exposing privileged app internals
- Provide only a narrow bridge (the `p5Param` API); avoid direct references to core app objects in the sketch scope

## Milestones

### Phase 1 (MVP)
- `P5LayerManager` with overlay canvas, `p5Param` injection, param registry
- Extend `App.updateAnimationParameter` for `p5:` targets
- “P5 Sketch” panel with basic editor and parameter list (manual exposure)
- MIDI learn from param row; target list shows `p5:` entries
- Save/load sketch and params with scene/preset

### Phase 2
- Smart detection (opt-in suggestions) for pasted code
- Basic range editors and live value display in the param list
- Audio mappings to `p5:` targets

### Phase 3
- Advanced editor ergonomics (lint, error gutter, quick fixes)
- Optional performance toggles (pause when hidden, target FPS)
- Multiple p5 layers (stretch goal; not required if one overlay suffices)

## Open Questions

- Do we support multiple independent p5 layers (stacked), or only one overlay for v1?
- Should we allow p5 WebGL mode in v1, or keep it 2D-only for simplicity?
- How should we theme p5 canvas transparency and blending against the Three.js scene (add blend modes later)?
- Do we want to record p5 output in the existing `VideoRecorder` pipeline in v1, or add later?

## Implementation Touch Points

- `src/modules/P5LayerManager.js` (new)
- `src/core/App.js`: handle `p5:` targets in `updateAnimationParameter`
- `src/midi-controls.js`: populate target dropdown with dynamic `p5:` params
- `src/audio-mapping.js`: no change required; works via `updateAnimationParameter`
- UI: add a new “P5 Sketch” card (editor + param list + suggestions)


