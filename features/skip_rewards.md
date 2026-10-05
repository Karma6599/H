# Skip animations (skip_rewards)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `SKIP_REWARDS`

## Notes

Skips reward/animations screens ("Go straight to the results after a battle"). Key skip_rewards (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `skip_rewards`
- `SKIP_REWARDS`
- `Skip animations`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 12108–12153)

```asm
   33816  push_const                 [2845] num 115.0
   33821  push_const                 [2846] num 107.0
   33826  push_const                 [2847] num 105.0
   33831  push_const                 [2848] num 112.0
   33836  push_const                 [2849] num 95.0
   33841  push_const                 [2850] num 114.0
   33846  push_const                 [2851] num 101.0
   33851  push_const                 [2852] num 119.0
   33856  push_const                 [2853] num 97.0
   33861  push_const                 [2854] num 114.0
   33866  push_const                 [2855] num 100.0
   33871  push_const                 [2856] num 115.0
   33876  put_loc                    2747
   33879  put_loc                    2748
   33882  put_loc                    2749
   33885  put_loc                    2750
   33888  put_loc                    2751
   33891  put_loc                    2752
   33894  put_loc                    2753
   33897  put_loc                    2754
   33900  put_loc                    2755
   33903  put_loc                    2756
   33906  put_loc                    2757
   33909  put_loc                    2758
   33912  swap                       
   33913  get_loc                    2758
   33916  get_loc                    2757
   33919  get_loc                    2756
   33922  get_loc                    2755
   33925  get_loc                    2754
   33928  get_loc                    2753
   33931  get_loc                    2752
   33934  get_loc                    2751
   33937  get_loc                    2750
   33940  get_loc                    2749
   33943  get_loc                    2748
   33946  get_loc                    2747
   33949  call_method                12
   33952  insert3                    
   33953  put_array_el               
   33954  drop                       
   33955  get_loc_check              965
   33958  push_const                 [2857] num 0.0
   33963  get_array_el               
   33964  push_const                 [2858] num 2.0
   33969  get_array_el               
```

