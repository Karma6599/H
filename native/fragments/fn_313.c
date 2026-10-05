/* CModule C fragments found in function fn_313 (cpool order) */


  #include <gum/guminterceptor.h>
  typedef struct {void *o45caf93c2f,*od271b0be13,*o9e3d0fbcef;unsigned oa16a782a80,oe4975307b0;} ofa58ac09c0;
  extern unsigned char of7b083d525[];
  extern void oe1499f0f86(unsigned,void *);
  int o259d8c4dc8(void *o45caf93c2f,void *od271b0be13,void *o9e3d0fbcef,unsigned oa16a782a80){unsigned o6b825f5e38;ofa58ac09c0 *oc1fe72d40d=(ofa58ac09c0 *)of7b083d525;for(o6b825f5e38=0;o6b825f5e38<24;o6b825f5e38++)if(!oc1fe72d40d[o6b825f5e38].oa16a782a80){oc1fe72d40d[o6b825f5e38].o45caf93c2f=o45caf93c2f;oc1fe72d40d[o6b825f5e38].od271b0be13=od271b0be13;oc1fe72d40d[o6b825f5e38].o9e3d0fbcef=o9e3d0fbcef;oc1fe72d40d[o6b825f5e38].oa16a782a80=oa16a782a80;return (int)o6b825f5e38;}return -1;}
  void o5111176cfe(unsigned oa16a782a80){unsigned o6b825f5e38;ofa58ac09c0 *oc1fe72d40d=(ofa58ac09c0 *)of7b083d525;for(o6b825f5e38=0;o6b825f5e38<24;o6b825f5e38++)if(oc1fe72d40d[o6b825f5e38].oa16a782a80==oa16a782a80){oc1fe72d40d[o6b825f5e38].oa16a782a80=0;oc1fe72d40d[o6b825f5e38].o45caf93c2f=0;oc1fe72d40d[o6b825f5e38].od271b0be13=0;oc1fe72d40d[o6b825f5e38].o9e3d0fbcef=0;}}
  void o481548b4bd(GumInvocationContext *oc937834dc4){unsigned o6b825f5e38,oa16a782a80;void *ocbd30d56fc=gum_invocation_context_get_nth_argument(oc937834dc4,0);ofa58ac09c0 *oc1fe72d40d=(ofa58ac09c0 *)of7b083d525;for(o6b825f5e38=0;o6b825f5e38<24;o6b825f5e38++)if(oc1fe72d40d[o6b825f5e38].oa16a782a80&&(ocbd30d56fc==oc1fe72d40d[o6b825f5e38].o45caf93c2f||ocbd30d56fc==oc1fe72d40d[o6b825f5e38].od271b0be13||ocbd30d56fc==oc1fe72d40d[o6b825f5e38].o9e3d0fbcef)){oa16a782a80=oc1fe72d40d[o6b825f5e38].oa16a782a80;oc1fe72d40d[o6b825f5e38].oa16a782a80=0;oc1fe72d40d[o6b825f5e38].o45caf93c2f=0;oc1fe72d40d[o6b825f5e38].od271b0be13=0;oc1fe72d40d[o6b825f5e38].o9e3d0fbcef=0;oe1499f0f86(oa16a782a80,ocbd30d56fc);}}
 

