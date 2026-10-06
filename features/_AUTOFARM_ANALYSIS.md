# AutoFarm reconstruction analysis (fn_75 #1048, 84 functions)

## fn_488 const tables (slot -> value)
- 422 = PHASES ('0'-'29'+): idle, retreat, cover, objective, ball, shot, pass, zone, pickup, move, wait, shoot, engage, search, yield, dodge, evade, critical-retreat, ball-shot, ... spawn
- 1504 = STATUS: [idle, running, paused, unavailable]
- 1509 = REASONS ('0'-'29'+): off, error, farming, waiting-result, waiting-home, home-ready, target-complete, selection-required, waiting-selection, character-selected, select-retry, matchmaking, start-retry, ready, waiting-spawn, ..., disposed
- 520 = PLUS1 map {'0':1..'26':27} (obfuscator's x+1 table)
- 463 = SESSION_KEYS: startedAt, wins, losses, trophyDelta, matches, battleStartTrophies, currentTrophies, currentCharacter, lastDelta
- 982 = COUNTER_KEYS: ticks, moves, shots, dodgeYields, retreats, coverMoves, objectiveMoves, ballShots, passes
- 1892 = VIEWS: [setup, brawlers, stats]

## fn_75 factory layout (local slot N = loc_(N-1), arg1 = deps at 0)
- slot 89 (loc_88)  = base (deps[#2330] if typeof function else fn_2768 closure) — battle base accessor
- slot 168 (loc_167)= engine (deps['capture_1594'] || fn_371(global, deps[#1420].toString()))
- slot 8  (loc_7)   = ctx = fn_1566({ native: base, _$82d621c353e8b511991868b6: deps['call_arg_118_14'], _$d59c5e089e027c280678dbe9: fn_2027 })
- slot 172 (loc_171)= fn_1005({ _$959ddfbde0867dbe30d9b573: 2, _$18bf150356dd129b8567a861: 1000 }) — timers? {sampleEvery:2, windowMs:1000}
- slot 95 (loc_94)  = session = {length:9, 0:startedAt,1:wins,2:losses,3:trophyDelta,4:matches,5:battleStartTrophies,6:currentTrophies,7:currentCharacter,8:lastDelta} init [0,0,0,0,0,-1,-1,'',0]
- slot 63 (loc_62)  = farm = {length:6, 0:phaseA,1:phaseB?,2:target,3:reasonIdx,4:?,5:counters[9]} init [0,0,null,0,0,[0×9]]
- slot 130 (loc_129)= options (from deps[#6037] via v1092/v2269/v1189)
- 47 closures: loc_0=fn_1461, loc_32=fn_1965, loc_121=fn_2728, loc_80=fn_1374, loc_113=fn_2411, loc_145=fn_1305, loc_25=fn_1577, loc_98=fn_2864, loc_107=fn_1298, loc_173=fn_2608, loc_179=fn_599, loc_1=fn_686, loc_22=fn_1294, loc_114=fn_2746, loc_95=fn_2432, loc_23=fn_2775, loc_84=fn_2418, loc_24=fn_1376, loc_47=fn_254, loc_14=fn_610, loc_120=fn_1147, loc_116=fn_614, loc_16=fn_1618, loc_140=fn_2417, loc_148=fn_2006, loc_10=fn_2030, loc_112=fn_2735, loc_153=fn_302, loc_69=fn_1880, loc_103=fn_1657, loc_4=fn_2468, loc_142=fn_591, loc_150=fn_1825, loc_11=fn_1616, loc_38=fn_632, loc_71=fn_43, loc_136=fn_784, loc_29=fn_2520, loc_164=fn_2672, loc_104=fn_854, loc_64=fn_980, loc_49=fn_2842, loc_128=fn_2321, loc_66=fn_945, loc_83=fn_77, loc_123=fn_462, loc_91=fn_2442, loc_117=fn_609

## state slots (fn_75 locals, from init sequence)
- slot 59 = false — gate checked in setEnabled: if(!v59) ui.START(); likely 'started'
- slot 79 = false — enabled
- slot 109 = false — disposed
- slot 175 = 0 — revision
- slot 147 (loc_146) = 0 — startedAt (Date.now())
- slot 38 (loc_37) = null — lastError
- slot 13 (loc_12) = V488_1469 = 0 — reason code (index into REASONS)
- slot 140 (loc_139) = new V2485() — ? (constructor)
- slot 83 (loc_82) = new V2485() — ? 
- slot 66 (loc_65) = new V2485() — ?
- slot 86 (loc_85) = new V2485() — ?
- slot 35 (loc_34) = [] (loc 181 dup)
- slot 56 (loc_55) = [] (loc 187)
- slot 20 (loc_19) = -V2484
- slot 163 (loc_162) = -V2484
- slot 69 (loc_68) = -1
- slot 74 (loc_73) = -1
- slot 153 (loc_152) = -1
- slot 131 (loc_130) = ''
- slot 167 (loc_166) = ''

## API object (slot 164, loc_163)
- _$326b40333128b4d78bc7e739 (START) = fn_2426
- _$1458b5e5e1ba5d16cc261b4d (setEnabled) = fn_1633
- _$0e0a1d405897c8f747b1f7d5 = fn_1013 (options setter)
- _$98706144ef6b6cdb9e9923df = fn_2750 (?)
- tick (plain) = slot67 (fn_945)
- _$cc9ef745c7beaad8fcdac2ea = fn_236 (?)
- _$814748ecc47856e7b144daa6 (getState) = fn_1692
- _$6238cfbe1bb46d10e08d6328 (RESET STATS label) = fn_2282
- dispose (plain) = fn_490

## fn_1633 setEnabled(on)
- throw Error('Auto Farm disposed') if disposed
- if (!slot59) slot164ui._$326b40333128b4d78bc7e739()  [press START when not yet started]
- want = !!on; if (want === enabled) return enabled
- enabled = want; revision++
- if (enabled):
  - startedAt = Date.now()
  - session[?] hmm — slot95[V488_1788=2] = slot95[2] || startedAt  (losses?? no — V488_1788=2.0... hmm slot95[2]=losses... `losses = losses || startedAt`?? WEIRD — recheck: get_var 95, get_var 1970(→V488_1788=2.0)... so session[2] ||= Date.now(). Hmm — session[2] = 'losses'... that can't be right. MAYBE V488_1788 isn't 2.0 at that point! (slot 1788 first write = 2.0?) CHECK LATER.
  - lastError = null
  - try { tickFn(fn_488.loc_4=15.0)?? } — slot108(slot?) hmm: get_var 108 (fn_75.loc_107) called with get_var 186 (fn_488.loc_4 = 15.0)
  - catch: loc_98-stop(), enabled=false, loc_123(), loc_173(err)
- else branch at 326

## fn_1692 getState()
- loc_4 = slot26() (fn_1577) — runtime calc?
- loc_1 = session[1] + session[2] (wins + losses = matches?)
- if (!enabled) status = STATUS[0] ('idle'); else status computed at 1191+
- plan snapshot obj: {_$02ba24c1a53c7d4d51555801: PHASES[farm[0]], phase: PHASES[farm[1]], target: farm[2], reason: farm[3]+1 (PLUS1 table), _$668024f76431ae04690f70bf: farm[4], _$9d77b14fac7a1211990eb2e1: fromEntries(COUNTER_KEYS.map(fn_171))}
- main obj: {_$63be9aca05f57f6cf9d7e4df: slot59 (started), enabled, disposed, revision, status, _$6efc9ae1149d626e5ff2b31b: REASONS[reasonCode(slot13)], lastError, options-snapshot(fn_1246(slot130)), selectedCharacters: [...slot130[1]], selectedBrawlers: [...], attack: slot130[5], follow: fn_806(slot130[6]), autoSwitch: slot130[2], _$45345448a194f2a58b520758: slot180() (fn_599), _$05ec49aa245383348d1cac58: engine.call_arg_1532_6 typeof function ? engine._$077067910d6da412e59a307d() : undefined, _$42dff362b2a786e5a82f1f83: slot69, moveTarget stuff, stats: {...}}

## Options record (slot130, built from deps[#6037]):
- key 1 = selectedCharacters/selectedBrawlers array
- key 2 = autoSwitch
- key 5 = attack
- key 6 = follow (mapped via fn_806)
