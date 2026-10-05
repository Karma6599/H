# Real names (real_names)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `REAL_NAMES`

## Notes

Shows real player names (decodes display names). Key real_names (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `real_names`
- `REAL_NAMES`
- `Real names`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 10965–11010)

```asm
   30330  push_const                 [2623] num 114.0
   30335  push_const                 [2624] num 101.0
   30340  push_const                 [2625] num 97.0
   30345  push_const                 [2626] num 108.0
   30350  push_const                 [2627] num 95.0
   30355  push_const                 [2628] num 110.0
   30360  push_const                 [2629] num 97.0
   30365  push_const                 [2630] num 109.0
   30370  push_const                 [2631] num 101.0
   30375  push_const                 [2632] num 115.0
   30380  put_loc                    2572
   30383  put_loc                    2573
   30386  put_loc                    2574
   30389  put_loc                    2575
   30392  put_loc                    2576
   30395  put_loc                    2577
   30398  put_loc                    2578
   30401  put_loc                    2579
   30404  put_loc                    2580
   30407  put_loc                    2581
   30410  swap                       
   30411  get_loc                    2581
   30414  get_loc                    2580
   30417  get_loc                    2579
   30420  get_loc                    2578
   30423  get_loc                    2577
   30426  get_loc                    2576
   30429  get_loc                    2575
   30432  get_loc                    2574
   30435  get_loc                    2573
   30438  get_loc                    2572
   30441  call_method                10
   30444  insert3                    
   30445  put_array_el               
   30446  drop                       
   30447  get_loc_check              965
   30450  push_const                 [2633] num 0.0
   30455  get_array_el               
   30456  push_const                 [2634] num 2.0
   30461  get_array_el               
   30462  get_loc_check              1375
   30465  get_loc_check              629
   30468  get_loc_check              1375
   30471  get_array_el               
   30472  insert3                    
   30473  put_array_el               
```

