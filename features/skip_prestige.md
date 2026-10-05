# Skip prestige (skip_prestige)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `SKIP_PRESTIGE`

## Notes

Skips prestige animations. Key skip_prestige (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `skip_prestige`
- `SKIP_PRESTIGE`
- `Skip prestige`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 12046–12091)

```asm
   33622  push_const                 [2829] num 115.0
   33627  push_const                 [2830] num 107.0
   33632  push_const                 [2831] num 105.0
   33637  push_const                 [2832] num 112.0
   33642  push_const                 [2833] num 95.0
   33647  push_const                 [2834] num 112.0
   33652  push_const                 [2835] num 114.0
   33657  push_const                 [2836] num 101.0
   33662  push_const                 [2837] num 115.0
   33667  push_const                 [2838] num 116.0
   33672  push_const                 [2839] num 105.0
   33677  push_const                 [2840] num 103.0
   33682  push_const                 [2841] num 101.0
   33687  put_loc                    2734
   33690  put_loc                    2735
   33693  put_loc                    2736
   33696  put_loc                    2737
   33699  put_loc                    2738
   33702  put_loc                    2739
   33705  put_loc                    2740
   33708  put_loc                    2741
   33711  put_loc                    2742
   33714  put_loc                    2743
   33717  put_loc                    2744
   33720  put_loc                    2745
   33723  put_loc                    2746
   33726  swap                       
   33727  get_loc                    2746
   33730  get_loc                    2745
   33733  get_loc                    2744
   33736  get_loc                    2743
   33739  get_loc                    2742
   33742  get_loc                    2741
   33745  get_loc                    2740
   33748  get_loc                    2739
   33751  get_loc                    2738
   33754  get_loc                    2737
   33757  get_loc                    2736
   33760  get_loc                    2735
   33763  get_loc                    2734
   33766  call_method                13
   33769  insert3                    
   33770  put_array_el               
   33771  drop                       
   33772  get_loc_check              965
   33775  push_const                 [2842] num 0.0
```

