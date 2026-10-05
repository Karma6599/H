# Player trophies (player_trophies)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `PLAYER_TROPHIES`

## Notes

Shows other players’ trophy counts. Key player_trophies (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `player_trophies`
- `PLAYER_TROPHIES`
- `Player trophies`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 11018–11063)

```asm
   30491  push_const                 [2636] num 112.0
   30496  push_const                 [2637] num 108.0
   30501  push_const                 [2638] num 97.0
   30506  push_const                 [2639] num 121.0
   30511  push_const                 [2640] num 101.0
   30516  push_const                 [2641] num 114.0
   30521  push_const                 [2642] num 95.0
   30526  push_const                 [2643] num 116.0
   30531  push_const                 [2644] num 114.0
   30536  push_const                 [2645] num 111.0
   30541  push_const                 [2646] num 112.0
   30546  push_const                 [2647] num 104.0
   30551  push_const                 [2648] num 105.0
   30556  push_const                 [2649] num 101.0
   30561  push_const                 [2650] num 115.0
   30566  put_loc                    2582
   30569  put_loc                    2583
   30572  put_loc                    2584
   30575  put_loc                    2585
   30578  put_loc                    2586
   30581  put_loc                    2587
   30584  put_loc                    2588
   30587  put_loc                    2589
   30590  put_loc                    2590
   30593  put_loc                    2591
   30596  put_loc                    2592
   30599  put_loc                    2593
   30602  put_loc                    2594
   30605  put_loc                    2595
   30608  put_loc                    2596
   30611  swap                       
   30612  get_loc                    2596
   30615  get_loc                    2595
   30618  get_loc                    2594
   30621  get_loc                    2593
   30624  get_loc                    2592
   30627  get_loc                    2591
   30630  get_loc                    2590
   30633  get_loc                    2589
   30636  get_loc                    2588
   30639  get_loc                    2587
   30642  get_loc                    2586
   30645  get_loc                    2585
   30648  get_loc                    2584
   30651  get_loc                    2583
   30654  get_loc                    2582
```

