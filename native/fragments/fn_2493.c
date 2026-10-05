/* CModule C fragments found in function fn_2493 (cpool order) */

#include <gum/guminterceptor.h>
      typedef unsigned long long o88764f2b10;
      typedef struct { long o01cd72d20c; long o5ee9b1430d; } o5e6b8fbc58;
      typedef struct { volatile unsigned o17f8b6143c; volatile unsigned o2112241a29; volatile unsigned ob40a79257f; volatile unsigned o665cc5295e; o88764f2b10 ocf46d2c9e5; void *o790fa63443; o88764f2b10 o6170d6980f; o88764f2b10 o3c9266ca2a; o88764f2b10 o91a1ed09cb; volatile unsigned o968a396075; } od17d73ee7c;
      typedef struct { void *o790fa63443; unsigned ocd9e9fabde; } o532621a820;
      extern unsigned char o55b751e1be[];
      extern int clock_gettime(int,o5e6b8fbc58 *);
      extern void *oc3234c868e(void);
      extern void o03dc5747d1(void *,unsigned);
      extern void o589e79b41c(void);
      #define o9e5826748f ((od17d73ee7c *)o55b751e1be)
      void o0fbdfc9363(GumInvocationContext *o17c2583ee6){o532621a820 *oac8603898a=gum_invocation_context_get_listener_invocation_data(o17c2583ee6,sizeof(o532621a820));o5e6b8fbc58 o6cf2983450;o88764f2b10 od7d025bfb0;oac8603898a->ocd9e9fabde=0;oac8603898a->o790fa63443=gum_invocation_context_get_nth_argument(o17c2583ee6,0);if(!o9e5826748f->o17f8b6143c)return;if(clock_gettime(1,&o6cf2983450))return;od7d025bfb0=(o88764f2b10)o6cf2983450.o01cd72d20c*1000000000ULL+(o88764f2b10)o6cf2983450.o5ee9b1430d;if(od7d025bfb0<o9e5826748f->ocf46d2c9e5)return;o9e5826748f->ocf46d2c9e5=od7d025bfb0+(o88764f2b10)o9e5826748f->o2112241a29*1000000ULL;oac8603898a->ocd9e9fabde=1;}
      void o477e28d274(GumInvocationContext *o17c2583ee6){o532621a820 *oac8603898a=gum_invocation_context_get_listener_invocation_data(o17c2583ee6,sizeof(o532621a820));unsigned o665cc5295e;if(!o9e5826748f->o17f8b6143c||!oac8603898a->ocd9e9fabde)return;oac8603898a->ocd9e9fabde=0;o665cc5295e=o9e5826748f->o665cc5295e;o9e5826748f->o665cc5295e=0;o9e5826748f->o6170d6980f++;o03dc5747d1(oac8603898a->o790fa63443,o665cc5295e);}
      void of6548bcf51(GumInvocationContext *o17c2583ee6){if(o9e5826748f->o17f8b6143c&&o9e5826748f->o968a396075)o9e5826748f->o665cc5295e=1;}
      void oc5bed13bee(GumInvocationContext *o17c2583ee6){void *oc3930e2b64,*o790fa63443;if(!o9e5826748f->o790fa63443)return;oc3930e2b64=oc3234c868e();o790fa63443=oc3930e2b64?*(void **)((unsigned char *)oc3930e2b64+40):0;if(o790fa63443==o9e5826748f->o790fa63443)return;o9e5826748f->o91a1ed09cb++;o589e79b41c();}
      void o9c00c61be7(GumInvocationContext *o17c2583ee6){if(o9e5826748f->ob40a79257f)o9e5826748f->o3c9266ca2a++;}
    

