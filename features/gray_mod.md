# Gray mod (gray_mod)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `GRAY_MOD`

## Notes

Gray mod — desaturates the game visuals. Key gray_mod (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `gray_mod`
- `GRAY_MOD`
- `Gray mod`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 11819–11864)

```asm
   32923  push_const                 [2772] num 103.0
   32928  push_const                 [2773] num 114.0
   32933  push_const                 [2774] num 97.0
   32938  push_const                 [2775] num 121.0
   32943  push_const                 [2776] num 95.0
   32948  push_const                 [2777] num 109.0
   32953  push_const                 [2778] num 111.0
   32958  push_const                 [2779] num 100.0
   32963  put_loc                    2689
   32966  put_loc                    2690
   32969  put_loc                    2691
   32972  put_loc                    2692
   32975  put_loc                    2693
   32978  put_loc                    2694
   32981  put_loc                    2695
   32984  put_loc                    2696
   32987  swap                       
   32988  get_loc                    2696
   32991  get_loc                    2695
   32994  get_loc                    2694
   32997  get_loc                    2693
   33000  get_loc                    2692
   33003  get_loc                    2691
   33006  get_loc                    2690
   33009  get_loc                    2689
   33012  call_method                8
   33015  insert3                    
   33016  put_array_el               
   33017  drop                       
   33018  get_loc_check              965
   33021  push_const                 [2780] num 0.0
   33026  get_array_el               
   33027  push_const                 [2781] num 2.0
   33032  get_array_el               
   33033  get_loc_check              757
   33036  get_loc_check              629
   33039  get_loc_check              757
   33042  get_array_el               
   33043  insert3                    
   33044  put_array_el               
   33045  drop                       
   33046  get_loc_check              629
   33049  get_loc_check              674
   33052  get_var                    11
   33055  push_const                 [2782] str 'fromCharCode'
   33060  get_array_el2              
```

