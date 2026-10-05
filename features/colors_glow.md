# Colors & Glow (colors)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `COLOR & GLOW`

## Notes

Native color registry (CModule-backed): solid/spectrum modes, RGB+hue/saturation/brightness, glow, opacity, cycle speed, 4 presets (ice/violet/sunset/mint). Events menu:colors, chroma:settings, mode:solid/spectrum.

## Key strings / constants

- `mode:solid`
- `mode:spectrum`
- `red`
- `green`
- `blue`
- `hue`
- `cycleSeconds`
- `saturation`
- `brightness`
- `opacity`
- `glow`
- `menu:colors`
- `chroma:settings`
- `COLOR & GLOW`
- `COLORS & SPEED`
- `OPACITY`
- `SPECTRUM`
- `SOLID`
- `Live colors and animation speed`
- `Color gradient table 46 is not ready`
- `Color registration capacity exceeded`
- `Reset colors`
- `Solid color`
- `preset:ice`
- `preset:violet`
- `preset:sunset`
- `preset:mint`

## Disassembly (entry)

_(no dedicated entry function — state lives in the shared config `fn_488` / visual runtime `fn_888`; see `ui/menu_structure.md`)_
