# Bot sync (sync_bot)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `SYNC_BOT`

## Notes

Bot sync — synchronizes behavior with bots (sync_bot key, obfuscated via String.fromCharCode). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `sync_bot`
- `SYNC_BOT`
- `Bot sync`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 10862–10907)

```asm
   30019  push_const                 [2598] num 115.0
   30024  push_const                 [2599] num 121.0
   30029  push_const                 [2600] num 110.0
   30034  push_const                 [2601] num 99.0
   30039  push_const                 [2602] num 95.0
   30044  push_const                 [2603] num 98.0
   30049  push_const                 [2604] num 111.0
   30054  push_const                 [2605] num 116.0
   30059  put_loc                    2553
   30062  put_loc                    2554
   30065  put_loc                    2555
   30068  put_loc                    2556
   30071  put_loc                    2557
   30074  put_loc                    2558
   30077  put_loc                    2559
   30080  put_loc                    2560
   30083  swap                       
   30084  get_loc                    2560
   30087  get_loc                    2559
   30090  get_loc                    2558
   30093  get_loc                    2557
   30096  get_loc                    2556
   30099  get_loc                    2555
   30102  get_loc                    2554
   30105  get_loc                    2553
   30108  call_method                8
   30111  insert3                    
   30112  put_array_el               
   30113  drop                       
   30114  get_loc_check              965
   30117  push_const                 [2606] num 0.0
   30122  get_array_el               
   30123  push_const                 [2607] num 2.0
   30128  get_array_el               
   30129  get_loc_check              1098
   30132  get_loc_check              629
   30135  get_loc_check              1098
   30138  get_array_el               
   30139  insert3                    
   30140  put_array_el               
   30141  drop                       
   30142  get_loc_check              629
   30145  get_loc_check              762
   30148  get_var                    11
   30151  push_const                 [2608] str 'fromCharCode'
   30156  get_array_el2              
```

