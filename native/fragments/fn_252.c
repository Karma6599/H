/* CModule C fragments found in function fn_252 (cpool order) */


   #include <gum/guminterceptor.h>
   #include <glib.h>
   typedef unsigned char o94466d48ab;
   typedef struct {void *o182f1bdb0d,*o6e7e72c6ff,*ob6ec6b9428,*o7157e95ffe,*o688396f2e4;unsigned oe9d356eece,o6e68bea3f0;} oc472932ccc;
   typedef struct {volatile int o0d1e0bf927;int o21dfacda70;volatile oc472932ccc of45ea47c91;void *o275408ca45,*obb3713317b,*o0e6e524d28;unsigned o4c6a6a369d,o64b15fb54f,oba0d514da1,off1fcfee39,o141faf9fe4,o6c5251f213,oe218b40e8e,o6f518d28d6;} oa41f27ddae;
   typedef struct {void *o182f1bdb0d,*o6e7e72c6ff,*ob6ec6b9428,*o7157e95ffe,*o688396f2e4;unsigned oe9d356eece,o6e68bea3f0,o64b15fb54f,oba0d514da1,off1fcfee39,o141faf9fe4,o6c5251f213,oe218b40e8e,o6f518d28d6;} oe6bcb6cc6e;
   typedef struct {void *o655f52da3a;} o0750538657;
   extern o94466d48ab o95d412de88[];
   extern void *o4b9f0e807d,*ocb1ac58eb2,*o032f102b30;
   extern o94466d48ab o3a904db084[],of306cfd778[],o49b48565fb[];
   extern void o97f981ffeb(void);
   #define o513a9403e2 ((oa41f27ddae *)o95d412de88)
   #define oe87154ea29(o9e465d19ad,o84df25f637) (*(void **)((o94466d48ab *)(o9e465d19ad)+(o84df25f637)))
   #define o16772ddc71(o9e465d19ad,o84df25f637) (*(int *)((o94466d48ab *)(o9e465d19ad)+(o84df25f637)))
   #define o48583264cf(o9e465d19ad,o84df25f637) (*((o94466d48ab *)(o9e465d19ad)+(o84df25f637)))
   static int o655f52da3a(void *o9e465d19ad){return o9e465d19ad && ((gsize)o9e465d19ad&7)==0;}
   static int of737d7c250(void *o9e465d19ad){return o655f52da3a(o9e465d19ad)&&o48583264cf(o9e465d19ad,8)!=0&&o48583264cf(o9e465d19ad,12)!=0;}
   static void o17bd091ae1(void *o182f1bdb0d,void *o6e7e72c6ff,void *ob6ec6b9428,void *o7157e95ffe,void *o688396f2e4,unsigned o64b15fb54f){
    unsigned oe9d356eece=ob6ec6b9428!=0;
    o513a9403e2->o64b15fb54f=o64b15fb54f;
    if(o513a9403e2->of45ea47c91.oe9d356eece==oe9d356eece&&o513a9403e2->of45ea47c91.o182f1bdb0d==o182f1bdb0d&&o513a9403e2->of45ea47c91.o6e7e72c6ff==o6e7e72c6ff&&o513a9403e2->of45ea47c91.ob6ec6b9428==ob6ec6b9428&&o513a9403e2->of45ea47c91.o7157e95ffe==o7157e95ffe&&o513a9403e2->of45ea47c91.o688396f2e4==o688396f2e4)return;
    g_atomic_int_add(&o513a9403e2->o0d1e0bf927,1);
    o513a9403e2->of45ea47c91.o182f1bdb0d=o182f1bdb0d;o513a9403e2->of45ea47c91.o6e7e72c6ff=o6e7e72c6ff;o513a9403e2->of45ea47c91.ob6ec6b9428=ob6ec6b9428;o513a9403e2->of45ea47c91.o7157e95ffe=o7157e95ffe;o513a9403e2->of45ea47c91.o688396f2e4=o688396f2e4;o513a9403e2->of45ea47c91.oe9d356eece=oe9d356eece;o513a9403e2->of45ea47c91.o6e68bea3f0++;
    g_atomic_int_add(&o513a9403e2->o0d1e0bf927,1);
    o513a9403e2->off1fcfee39++;o513a9403e2->o4c6a6a369d=1;
   }
   static void o73639f7fcb(unsigned oefef939d5c,void *o9e465d19ad){
    if(!o513a9403e2->o21dfacda70||!o9e465d19ad)return;
    if(oefef939d5c==1)o513a9403e2->o275408ca45=o9e465d19ad;
    if(oefef939d5c==2)o513a9403e2->obb3713317b=o9e465d19ad;
    if(oefef939d5c==3)o513a9403e2->o0e6e524d28=o9e465d19ad;
    if((oefef939d5c==1&&o513a9403e2->of45ea47c91.o182f1bdb0d==o9e465d19ad)||(oefef939d5c==2&&o513a9403e2->of45ea47c91.o6e7e72c6ff==o9e465d19ad)||(oefef939d5c==3&&o513a9403e2->of45ea47c91.ob6ec6b9428==o9e465d19ad)){
     o513a9403e2->o141faf9fe4++;o17bd091ae1(0,0,0,0,0,12);
    }
   }
   static void o2bcdf8cb5b(void){
    void *o9df8dea764,*o182f1bdb0d,*o6e7e72c6ff,*ob6ec6b9428,*o7157e95ffe,*o20650ea9b3,*o688396f2e4,*oe1b6a16f72;unsigned o64b15fb54f=1;
    if(!o513a9403e2->o21dfacda70)return;
    o9df8dea764=o4b9f0e807d;
    if(!o655f52da3a(o9df8dea764))goto o03cd0d41ca;
    o64b15fb54f=2;if(o16772ddc71(o9df8dea764,0x50)!=5)goto o03cd0d41ca;
    o182f1bdb0d=oe87154ea29(o9df8dea764,0x48);o64b15fb54f=4;
    if(!o655f52da3a(o182f1bdb0d)||o182f1bdb0d==o513a9403e2->o275408ca45||oe87154ea29(o182f1bdb0d,0)!=o3a904db084)goto o03cd0d41ca;
    o64b15fb54f=3;if(o16772ddc71(o182f1bdb0d,0x0c)!=7)goto o03cd0d41ca;
    o6e7e72c6ff=oe87154ea29(o182f1bdb0d,0x10);o64b15fb54f=5;if(!o655f52da3a(o6e7e72c6ff))goto o03cd0d41ca;
    o64b15fb54f=6;if(o6e7e72c6ff==o513a9403e2->obb3713317b||oe87154ea29(o6e7e72c6ff,0)!=of306cfd778)goto o03cd0d41ca;
    ob6ec6b9428=oe87154ea29(o6e7e72c6ff,0xa08);o64b15fb54f=7;if(!o655f52da3a(ob6ec6b9428))goto o03cd0d41ca;
    o64b15fb54f=8;if(ob6ec6b9428==o513a9403e2->o0e6e524d28||oe87154ea29(ob6ec6b9428,0)!=o49b48565fb)goto o03cd0d41ca;
    o7157e95ffe=ocb1ac58eb2;o20650ea9b3=o032f102b30;o64b15fb54f=9;
    if(!o655f52da3a(o7157e95ffe)||!o655f52da3a(o20650ea9b3))goto o03cd0d41ca;
    o688396f2e4=oe87154ea29(o20650ea9b3,0x70);oe1b6a16f72=oe87154ea29(o7157e95ffe,0x90);
    if(!o655f52da3a(o688396f2e4)||!o655f52da3a(oe1b6a16f72)||oe87154ea29(ob6ec6b9428,0x38)!=o688396f2e4||oe87154ea29(o688396f2e4,0x38)!=oe1b6a16f72||oe87154ea29(ob6ec6b9428,0x30)!=o7157e95ffe||oe87154ea29(o688396f2e4,0x30)!=o7157e95ffe||oe87154ea29(oe1b6a16f72,0x30)!=o7157e95ffe)goto o03cd0d41ca;
    o64b15fb54f=10;if(!of737d7c250(ob6ec6b9428)||!of737d7c250(o688396f2e4)||!of737d7c250(oe1b6a16f72))goto o03cd0d41ca;
    o17bd091ae1(o182f1bdb0d,o6e7e72c6ff,ob6ec6b9428,o7157e95ffe,o688396f2e4,11);return;
    o03cd0d41ca:if(o64b15fb54f>=4&&o64b15fb54f<=9)o513a9403e2->o6f518d28d6++;o17bd091ae1(0,0,0,0,0,o64b15fb54f);
   }
   static void o150ce5a24f(void){if(o513a9403e2->o21dfacda70&&o513a9403e2->o4c6a6a369d){o513a9403e2->o4c6a6a369d=0;o513a9403e2->oe218b40e8e++;o97f981ffeb();}}
   void o0bbc1c4d9c(GumInvocationContext *o5db7a25a44){if(!o513a9403e2->o21dfacda70)return;o513a9403e2->oba0d514da1++;o2bcdf8cb5b();o150ce5a24f();}
   void o3323b50a0c(GumInvocationContext *o5db7a25a44){o73639f7fcb(1,gum_invocation_context_get_nth_argument(o5db7a25a44,0));}
   void of7dd03f2b6(GumInvocationContext *o5db7a25a44){o73639f7fcb(2,gum_invocation_context_get_nth_argument(o5db7a25a44,0));}
   void od97716582c(GumInvocationContext *o5db7a25a44){o73639f7fcb(3,gum_invocation_context_get_nth_argument(o5db7a25a44,0));}
   void o020e9fcef3(GumInvocationContext *o5db7a25a44){void *o9e465d19ad=gum_invocation_context_get_nth_argument(o5db7a25a44,0);if(o513a9403e2->o21dfacda70&&o9e465d19ad==o4b9f0e807d&&o16772ddc71(o9e465d19ad,0x50)==5)o73639f7fcb(1,oe87154ea29(o9e465d19ad,0x48));}
   void oba35de4370(GumInvocationContext *o5db7a25a44){o0750538657 *o358815aae4=GUM_IC_GET_INVOCATION_DATA(o5db7a25a44,o0750538657);o358815aae4->o655f52da3a=gum_invocation_context_get_nth_argument(o5db7a25a44,0);}
   void o758d7e0707(GumInvocationContext *o5db7a25a44){o0750538657 *o358815aae4=GUM_IC_GET_INVOCATION_DATA(o5db7a25a44,o0750538657);if(o358815aae4->o655f52da3a==o513a9403e2->o275408ca45)o513a9403e2->o275408ca45=0;if(o358815aae4->o655f52da3a==o513a9403e2->obb3713317b)o513a9403e2->obb3713317b=0;if(o358815aae4->o655f52da3a==o513a9403e2->o0e6e524d28)o513a9403e2->o0e6e524d28=0;}
   unsigned oeb62264ecc(void){return sizeof(oa41f27ddae);}
   unsigned ob0840b43ad(void){return sizeof(oe6bcb6cc6e);}
   void o59cae5b6dd(void){o513a9403e2->o21dfacda70=1;}
   void o6c5251f213(void){if(o513a9403e2->o21dfacda70){o513a9403e2->o6c5251f213++;o2bcdf8cb5b();o150ce5a24f();}}
   void o9d22adf141(void){o513a9403e2->o21dfacda70=0;o17bd091ae1(0,0,0,0,0,13);o513a9403e2->o4c6a6a369d=0;}
   int o8f95230373(oe6bcb6cc6e *od347fdd485){
    unsigned oa10bb9d53a;int o0d1e0bf927;
    for(oa10bb9d53a=0;oa10bb9d53a<8;oa10bb9d53a++){
     o0d1e0bf927=g_atomic_int_add(&o513a9403e2->o0d1e0bf927,0);if(o0d1e0bf927&1)continue;
     od347fdd485->o182f1bdb0d=o513a9403e2->of45ea47c91.o182f1bdb0d;od347fdd485->o6e7e72c6ff=o513a9403e2->of45ea47c91.o6e7e72c6ff;od347fdd485->ob6ec6b9428=o513a9403e2->of45ea47c91.ob6ec6b9428;od347fdd485->o7157e95ffe=o513a9403e2->of45ea47c91.o7157e95ffe;od347fdd485->o688396f2e4=o513a9403e2->of45ea47c91.o688396f2e4;od347fdd485->oe9d356eece=o513a9403e2->of45ea47c91.oe9d356eece;od347fdd485->o6e68bea3f0=o513a9403e2->of45ea47c91.o6e68bea3f0;
     if(o0d1e0bf927!=g_atomic_int_add(&o513a9403e2->o0d1e0bf927,0))continue;
     od347fdd485->o64b15fb54f=o513a9403e2->o64b15fb54f;od347fdd485->oba0d514da1=o513a9403e2->oba0d514da1;od347fdd485->off1fcfee39=o513a9403e2->off1fcfee39;od347fdd485->o141faf9fe4=o513a9403e2->o141faf9fe4;od347fdd485->o6c5251f213=o513a9403e2->o6c5251f213;od347fdd485->oe218b40e8e=o513a9403e2->oe218b40e8e;od347fdd485->o6f518d28d6=o513a9403e2->o6f518d28d6;return 1;
    }
    return 0;
   }
  

