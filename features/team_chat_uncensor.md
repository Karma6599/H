# Team chat uncensor (team_chat_uncensor)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `TEAM_CHAT_UNCENSOR`

## Notes

Uncensors team chat messages. Key team_chat_uncensor (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `team_chat_uncensor`
- `TEAM_CHAT_UNCENSOR`
- `Team chat uncensor`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 11742–11787)

```asm
   32674  push_const                 [2751] num 116.0
   32679  push_const                 [2752] num 101.0
   32684  push_const                 [2753] num 97.0
   32689  push_const                 [2754] num 109.0
   32694  push_const                 [2755] num 95.0
   32699  push_const                 [2756] num 99.0
   32704  push_const                 [2757] num 104.0
   32709  push_const                 [2758] num 97.0
   32714  push_const                 [2759] num 116.0
   32719  push_const                 [2760] num 95.0
   32724  push_const                 [2761] num 117.0
   32729  push_const                 [2762] num 110.0
   32734  push_const                 [2763] num 99.0
   32739  push_const                 [2764] num 101.0
   32744  push_const                 [2765] num 110.0
   32749  push_const                 [2766] num 115.0
   32754  push_const                 [2767] num 111.0
   32759  push_const                 [2768] num 114.0
   32764  put_loc                    2671
   32767  put_loc                    2672
   32770  put_loc                    2673
   32773  put_loc                    2674
   32776  put_loc                    2675
   32779  put_loc                    2676
   32782  put_loc                    2677
   32785  put_loc                    2678
   32788  put_loc                    2679
   32791  put_loc                    2680
   32794  put_loc                    2681
   32797  put_loc                    2682
   32800  put_loc                    2683
   32803  put_loc                    2684
   32806  put_loc                    2685
   32809  put_loc                    2686
   32812  put_loc                    2687
   32815  put_loc                    2688
   32818  swap                       
   32819  get_loc                    2688
   32822  get_loc                    2687
   32825  get_loc                    2686
   32828  get_loc                    2685
   32831  get_loc                    2684
   32834  get_loc                    2683
   32837  get_loc                    2682
   32840  get_loc                    2681
   32843  get_loc                    2680
```

