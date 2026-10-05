/* CModule C fragments found in function fn_488 (cpool order) */

#include <float.h>
                                                       
extern float sqrtf(float);
extern float tanf(float);

static inline int o2a2af1b7ed(float o4472fc74d6) {
  return o4472fc74d6 == o4472fc74d6 && o4472fc74d6 >= -FLT_MAX && o4472fc74d6 <= FLT_MAX;
}

static inline int o73522181ca(const float *o4472fc74d6, int o6063515690) {
  int oe395b49995;
  if (!o4472fc74d6) return 0;
  for (oe395b49995 = 0; oe395b49995 < o6063515690; oe395b49995++) if (!o2a2af1b7ed(o4472fc74d6[oe395b49995])) return 0;
  return 1;
}

static inline int oc56c417881(const float *o4472fc74d6, float *o2cf69c4772) {
  float ocd6815b72e, ofe6a6bf878;
  if (!o73522181ca(o4472fc74d6, 3)) return 0;
  ocd6815b72e = o4472fc74d6[0] * o4472fc74d6[0] + o4472fc74d6[1] * o4472fc74d6[1] + o4472fc74d6[2] * o4472fc74d6[2];
  if (!o2a2af1b7ed(ocd6815b72e) || ocd6815b72e <= 1e-10f) return 0;
  ofe6a6bf878 = 1.0f / sqrtf(ocd6815b72e);
  o2cf69c4772[0] = o4472fc74d6[0] * ofe6a6bf878;
  o2cf69c4772[1] = o4472fc74d6[1] * ofe6a6bf878;
  o2cf69c4772[2] = o4472fc74d6[2] * ofe6a6bf878;
  return o73522181ca(o2cf69c4772, 3);
}

static inline int odb138cc0c6(float o497a8deb02, float o340267e77f, float o89fde00c86, float ob27df3fcf8, float *o2cf69c4772) {
  float ofe6a6bf878, ocd1cca6480;
  int oe395b49995;
  if (!o2cf69c4772 || !o2a2af1b7ed(o497a8deb02) || !o2a2af1b7ed(o340267e77f) || !o2a2af1b7ed(o89fde00c86) || !o2a2af1b7ed(ob27df3fcf8)) return 0;
  if (o497a8deb02 <= 0.0f || o497a8deb02 >= 180.0f || o340267e77f <= 0.0f || o89fde00c86 <= 0.0f || ob27df3fcf8 <= o89fde00c86) return 0;
  ofe6a6bf878 = 1.0f / tanf(o497a8deb02 * 0.008726646259971648f);
  ocd1cca6480 = ob27df3fcf8 - o89fde00c86;
  for (oe395b49995 = 0; oe395b49995 < 16; oe395b49995++) o2cf69c4772[oe395b49995] = 0.0f;
  o2cf69c4772[0] = ofe6a6bf878 / o340267e77f;
  o2cf69c4772[5] = ofe6a6bf878;
  o2cf69c4772[10] = -(ob27df3fcf8 + o89fde00c86) / ocd1cca6480;
  o2cf69c4772[11] = -1.0f;
  o2cf69c4772[14] = -2.0f * o89fde00c86 * ob27df3fcf8 / ocd1cca6480;
  return o73522181ca(o2cf69c4772, 16);
}

static inline int o9c48beaed1(const float *o2a89e941fd, const float *o3d0c9e8d0e, const float *o06a2d2559c, float *o2cf69c4772) {
  float oeab1c8b68b[3], o4502a729ce[3], o8e32f77c5d[3], o3ff050f319[3], ob780d32abf[3];
  int oe395b49995;
  if (!o2cf69c4772 || !o73522181ca(o2a89e941fd, 3) || !oc56c417881(o3d0c9e8d0e, oeab1c8b68b) || !oc56c417881(o06a2d2559c, o4502a729ce)) return 0;
  o8e32f77c5d[0] = oeab1c8b68b[1] * o4502a729ce[2] - oeab1c8b68b[2] * o4502a729ce[1];
  o8e32f77c5d[1] = oeab1c8b68b[2] * o4502a729ce[0] - oeab1c8b68b[0] * o4502a729ce[2];
  o8e32f77c5d[2] = oeab1c8b68b[0] * o4502a729ce[1] - oeab1c8b68b[1] * o4502a729ce[0];
  if (!oc56c417881(o8e32f77c5d, o3ff050f319)) return 0;
  ob780d32abf[0] = o3ff050f319[1] * oeab1c8b68b[2] - o3ff050f319[2] * oeab1c8b68b[1];
  ob780d32abf[1] = o3ff050f319[2] * oeab1c8b68b[0] - o3ff050f319[0] * oeab1c8b68b[2];
  ob780d32abf[2] = o3ff050f319[0] * oeab1c8b68b[1] - o3ff050f319[1] * oeab1c8b68b[0];
  for (oe395b49995 = 0; oe395b49995 < 16; oe395b49995++) o2cf69c4772[oe395b49995] = 0.0f;
  o2cf69c4772[0] = o3ff050f319[0];
  o2cf69c4772[1] = ob780d32abf[0];
  o2cf69c4772[2] = -oeab1c8b68b[0];
  o2cf69c4772[4] = o3ff050f319[1];
  o2cf69c4772[5] = ob780d32abf[1];
  o2cf69c4772[6] = -oeab1c8b68b[1];
  o2cf69c4772[8] = o3ff050f319[2];
  o2cf69c4772[9] = ob780d32abf[2];
  o2cf69c4772[10] = -oeab1c8b68b[2];
  o2cf69c4772[12] = -(o3ff050f319[0] * o2a89e941fd[0] + o3ff050f319[1] * o2a89e941fd[1] + o3ff050f319[2] * o2a89e941fd[2]);
  o2cf69c4772[13] = -(ob780d32abf[0] * o2a89e941fd[0] + ob780d32abf[1] * o2a89e941fd[1] + ob780d32abf[2] * o2a89e941fd[2]);
  o2cf69c4772[14] = oeab1c8b68b[0] * o2a89e941fd[0] + oeab1c8b68b[1] * o2a89e941fd[1] + oeab1c8b68b[2] * o2a89e941fd[2];
  o2cf69c4772[15] = 1.0f;
  return o73522181ca(o2cf69c4772, 16);
}

static inline int oaa181db82d(const float *o42747f1354, const float *o3ff050f319, float *o2cf69c4772) {
  int o317580fe61, o7f70152996;
  if (!o2cf69c4772 || !o73522181ca(o42747f1354, 16) || !o73522181ca(o3ff050f319, 16)) return 0;
  for (o317580fe61 = 0; o317580fe61 < 4; o317580fe61++) {
    for (o7f70152996 = 0; o7f70152996 < 4; o7f70152996++) o2cf69c4772[o317580fe61 * 4 + o7f70152996] = o42747f1354[o7f70152996] * o3ff050f319[o317580fe61 * 4] + o42747f1354[4 + o7f70152996] * o3ff050f319[o317580fe61 * 4 + 1] + o42747f1354[8 + o7f70152996] * o3ff050f319[o317580fe61 * 4 + 2] + o42747f1354[12 + o7f70152996] * o3ff050f319[o317580fe61 * 4 + 3];
  }
  return o73522181ca(o2cf69c4772, 16);
}

static inline int o993c94a67d(const float *o741770049f, float *o2cf69c4772) {
  double oef745d97fc, o217c0619a2, o9e8ade9e9e, of45421b582, ob8f8e799d5, o75c24fd7f6, oe8efd4de41, o786265e394, obc7d4fbe6a, o5c24143f45, odab85e3e3e, o3f13758c68, oe2ad49eddc, o4d74ba20bc, o18f365708c, od2cd993701;
  double o6a76741772, o70e0e109e1, obb384cd008, o12cfcbe4a8, o7a53557895, ocbab1f51f8, o07bca84251, o86451e913a, o33ec3abea8, ofdea9c1ba2, o838d373032, offa828b222, o10d301fef2, ofe6a6bf878;
  if (!o2cf69c4772 || !o73522181ca(o741770049f, 16)) return 0;
  oef745d97fc = o741770049f[0]; o217c0619a2 = o741770049f[1]; o9e8ade9e9e = o741770049f[2]; of45421b582 = o741770049f[3];
  ob8f8e799d5 = o741770049f[4]; o75c24fd7f6 = o741770049f[5]; oe8efd4de41 = o741770049f[6]; o786265e394 = o741770049f[7];
  obc7d4fbe6a = o741770049f[8]; o5c24143f45 = o741770049f[9]; odab85e3e3e = o741770049f[10]; o3f13758c68 = o741770049f[11];
  oe2ad49eddc = o741770049f[12]; o4d74ba20bc = o741770049f[13]; o18f365708c = o741770049f[14]; od2cd993701 = o741770049f[15];
  o6a76741772 = oef745d97fc * o75c24fd7f6 - o217c0619a2 * ob8f8e799d5; o70e0e109e1 = oef745d97fc * oe8efd4de41 - o9e8ade9e9e * ob8f8e799d5; obb384cd008 = oef745d97fc * o786265e394 - of45421b582 * ob8f8e799d5;
  o12cfcbe4a8 = o217c0619a2 * oe8efd4de41 - o9e8ade9e9e * o75c24fd7f6; o7a53557895 = o217c0619a2 * o786265e394 - of45421b582 * o75c24fd7f6; ocbab1f51f8 = o9e8ade9e9e * o786265e394 - of45421b582 * oe8efd4de41;
  o07bca84251 = obc7d4fbe6a * o4d74ba20bc - o5c24143f45 * oe2ad49eddc; o86451e913a = obc7d4fbe6a * o18f365708c - odab85e3e3e * oe2ad49eddc; o33ec3abea8 = obc7d4fbe6a * od2cd993701 - o3f13758c68 * oe2ad49eddc;
  ofdea9c1ba2 = o5c24143f45 * o18f365708c - odab85e3e3e * o4d74ba20bc; o838d373032 = o5c24143f45 * od2cd993701 - o3f13758c68 * o4d74ba20bc; offa828b222 = odab85e3e3e * od2cd993701 - o3f13758c68 * o18f365708c;
  o10d301fef2 = o6a76741772 * offa828b222 - o70e0e109e1 * o838d373032 + obb384cd008 * ofdea9c1ba2 + o12cfcbe4a8 * o33ec3abea8 - o7a53557895 * o86451e913a + ocbab1f51f8 * o07bca84251;
  if (o10d301fef2 != o10d301fef2 || o10d301fef2 == 0.0 || o10d301fef2 > DBL_MAX || o10d301fef2 < -DBL_MAX) return 0;
  ofe6a6bf878 = 1.0 / o10d301fef2;
  if (ofe6a6bf878 != ofe6a6bf878 || ofe6a6bf878 > DBL_MAX || ofe6a6bf878 < -DBL_MAX) return 0;
  o2cf69c4772[0] = (o75c24fd7f6 * offa828b222 - oe8efd4de41 * o838d373032 + o786265e394 * ofdea9c1ba2) * ofe6a6bf878;
  o2cf69c4772[1] = (o9e8ade9e9e * o838d373032 - o217c0619a2 * offa828b222 - of45421b582 * ofdea9c1ba2) * ofe6a6bf878;
  o2cf69c4772[2] = (o4d74ba20bc * ocbab1f51f8 - o18f365708c * o7a53557895 + od2cd993701 * o12cfcbe4a8) * ofe6a6bf878;
  o2cf69c4772[3] = (odab85e3e3e * o7a53557895 - o5c24143f45 * ocbab1f51f8 - o3f13758c68 * o12cfcbe4a8) * ofe6a6bf878;
  o2cf69c4772[4] = (oe8efd4de41 * o33ec3abea8 - ob8f8e799d5 * offa828b222 - o786265e394 * o86451e913a) * ofe6a6bf878;
  o2cf69c4772[5] = (oef745d97fc * offa828b222 - o9e8ade9e9e * o33ec3abea8 + of45421b582 * o86451e913a) * ofe6a6bf878;
  o2cf69c4772[6] = (o18f365708c * obb384cd008 - oe2ad49eddc * ocbab1f51f8 - od2cd993701 * o70e0e109e1) * ofe6a6bf878;
  o2cf69c4772[7] = (obc7d4fbe6a * ocbab1f51f8 - odab85e3e3e * obb384cd008 + o3f13758c68 * o70e0e109e1) * ofe6a6bf878;
  o2cf69c4772[8] = (ob8f8e799d5 * o838d373032 - o75c24fd7f6 * o33ec3abea8 + o786265e394 * o07bca84251) * ofe6a6bf878;
  o2cf69c4772[9] = (o217c0619a2 * o33ec3abea8 - oef745d97fc * o838d373032 - of45421b582 * o07bca84251) * ofe6a6bf878;
  o2cf69c4772[10] = (oe2ad49eddc * o7a53557895 - o4d74ba20bc * obb384cd008 + od2cd993701 * o6a76741772) * ofe6a6bf878;
  o2cf69c4772[11] = (o5c24143f45 * obb384cd008 - obc7d4fbe6a * o7a53557895 - o3f13758c68 * o6a76741772) * ofe6a6bf878;
  o2cf69c4772[12] = (o75c24fd7f6 * o86451e913a - ob8f8e799d5 * ofdea9c1ba2 - oe8efd4de41 * o07bca84251) * ofe6a6bf878;
  o2cf69c4772[13] = (oef745d97fc * ofdea9c1ba2 - o217c0619a2 * o86451e913a + o9e8ade9e9e * o07bca84251) * ofe6a6bf878;
  o2cf69c4772[14] = (o4d74ba20bc * o70e0e109e1 - oe2ad49eddc * o12cfcbe4a8 - o18f365708c * o6a76741772) * ofe6a6bf878;
  o2cf69c4772[15] = (obc7d4fbe6a * o12cfcbe4a8 - o5c24143f45 * o70e0e109e1 + odab85e3e3e * o6a76741772) * ofe6a6bf878;
  return o73522181ca(o2cf69c4772, 16);
}

int od825d99fb3(const float *o2a89e941fd, const float *o3d0c9e8d0e, const float *o06a2d2559c, float o497a8deb02, float o340267e77f, float o89fde00c86, float ob27df3fcf8, float *o2cf69c4772) {
  float o99ed0652e7[64], o5b6dc8fac7[3];
  int oe395b49995;
  if (!o2cf69c4772 || !o73522181ca(o2a89e941fd, 3) || !o73522181ca(o3d0c9e8d0e, 3)) return 0;
  for (oe395b49995 = 0; oe395b49995 < 3; oe395b49995++) o5b6dc8fac7[oe395b49995] = o2a89e941fd[oe395b49995] + o3d0c9e8d0e[oe395b49995];
  if (!o73522181ca(o5b6dc8fac7, 3) || (o5b6dc8fac7[0] == o2a89e941fd[0] && o5b6dc8fac7[1] == o2a89e941fd[1] && o5b6dc8fac7[2] == o2a89e941fd[2])) return 0;
  if (!odb138cc0c6(o497a8deb02, o340267e77f, o89fde00c86, ob27df3fcf8, o99ed0652e7)) return 0;
  if (!o9c48beaed1(o2a89e941fd, o3d0c9e8d0e, o06a2d2559c, o99ed0652e7 + 16)) return 0;
  if (!oaa181db82d(o99ed0652e7, o99ed0652e7 + 16, o99ed0652e7 + 32)) return 0;
  if (!o993c94a67d(o99ed0652e7 + 32, o99ed0652e7 + 48)) return 0;
  for (oe395b49995 = 0; oe395b49995 < 64; oe395b49995++) o2cf69c4772[oe395b49995] = o99ed0652e7[oe395b49995];
  return 1;
}

#include <gum/guminterceptor.h>

typedef unsigned char oeacf125434;
typedef struct {
  volatile unsigned o3f950d7322;
  volatile unsigned o314db0f150;
  float o497a8deb02;
  float o81141a1ce2;
  unsigned ocf3e79794f;
  unsigned o5e7a9f6673;
  volatile unsigned o4f3bde06a8;
} o28ea67db93;
extern o28ea67db93 o5e1b8da804;
extern oeacf125434 *o6ba5329997(oeacf125434 *o48cf1978de);
extern oeacf125434 *o61be0054a7(void);
extern const oeacf125434 *oe3780137c2;

typedef struct {
  oeacf125434 *o253f3b8c1c;
  unsigned o4f3bde06a8;
  int o6f67a5295f;
  float o7a8db55bf0;
  float o38cf86362c;
  unsigned o3c765c843b;
  unsigned o034bd5853f;
} o75e377f830;
extern o75e377f830 oc8c4d41587;

static void o5bd77f9821(oeacf125434 *o253f3b8c1c) {
  if (oc8c4d41587.o253f3b8c1c == o253f3b8c1c && oc8c4d41587.o4f3bde06a8 == o5e1b8da804.o4f3bde06a8) return;
  oc8c4d41587.o253f3b8c1c = o253f3b8c1c;
  oc8c4d41587.o4f3bde06a8 = o5e1b8da804.o4f3bde06a8;
  oc8c4d41587.o6f67a5295f = -1;
  oc8c4d41587.o7a8db55bf0 = 0.0f;
  oc8c4d41587.o38cf86362c = 0.0f;
  oc8c4d41587.o3c765c843b = 0;
}

static void o32cfa914f3(oeacf125434 *o253f3b8c1c, int o9f3e05f9e2) {
  if (!o253f3b8c1c[2412] || *(int *)(o253f3b8c1c + 2416) != o9f3e05f9e2) return;
  o253f3b8c1c[2412] = 0;
  *(int *)(o253f3b8c1c + 2416) = -1;
  *(float *)(o253f3b8c1c + 2440) = 0.0f;
  *(float *)(o253f3b8c1c + 2444) = 0.0f;
  *(float *)(o253f3b8c1c + 2448) = 0.0f;
  *(float *)(o253f3b8c1c + 2452) = 0.0f;
  *(float *)(o253f3b8c1c + 2456) = 0.0f;
  *(float *)(o253f3b8c1c + 2460) = 0.0f;
}

void oe510cb3c99(void) {
  oeacf125434 *o253f3b8c1c = o61be0054a7();
  if (oc8c4d41587.o3c765c843b && o253f3b8c1c && o253f3b8c1c == oc8c4d41587.o253f3b8c1c
      && oc8c4d41587.o4f3bde06a8 == o5e1b8da804.o4f3bde06a8)
    o32cfa914f3(o253f3b8c1c, oc8c4d41587.o6f67a5295f);
  oc8c4d41587.o3c765c843b = 0;
  oc8c4d41587.o6f67a5295f = -1;
}

typedef struct {
  oeacf125434 *o253f3b8c1c;
  unsigned o314db0f150;
  unsigned o4f3bde06a8;
  int oa40fc7cef7;
  int o6f67a5295f;
  int ocd3b611a8b;
  int oc04e8ebe53;
} oc429b1f8de;

static oc429b1f8de *od7258f6d3c(GumInvocationContext *o6206215e88) {
  oc429b1f8de *o92e58e7996 = GUM_IC_GET_INVOCATION_DATA(o6206215e88, oc429b1f8de);
  oeacf125434 *o253f3b8c1c;
  o92e58e7996->o253f3b8c1c = 0;
  if (!o5e1b8da804.o3f950d7322) return o92e58e7996;
  o253f3b8c1c = gum_invocation_context_get_nth_argument(o6206215e88, 0);
  if (!o253f3b8c1c || o253f3b8c1c != o61be0054a7()) return o92e58e7996;
  o5bd77f9821(o253f3b8c1c);
  o92e58e7996->o253f3b8c1c = o253f3b8c1c;
  o92e58e7996->o314db0f150 = o5e1b8da804.o314db0f150;
  o92e58e7996->o4f3bde06a8 = o5e1b8da804.o4f3bde06a8;
  o92e58e7996->oa40fc7cef7 = *(int *)(o253f3b8c1c + 2348);
  o92e58e7996->o6f67a5295f = -1;
  o92e58e7996->ocd3b611a8b = o253f3b8c1c[2412] != 0;
  o92e58e7996->oc04e8ebe53 = *(int *)(o253f3b8c1c + 2416);
  *(int *)(o253f3b8c1c + 2348) = 4;
  return o92e58e7996;
}

void o0072c3ae33(GumInvocationContext *o6206215e88) { od7258f6d3c(o6206215e88); }

void o22ed2dd71d(GumInvocationContext *o6206215e88) {
  oc429b1f8de *o92e58e7996 = od7258f6d3c(o6206215e88);
  oeacf125434 *o370fe8adf2;
  if (!o92e58e7996->o253f3b8c1c) return;
  o370fe8adf2 = gum_invocation_context_get_nth_argument(o6206215e88, 1);
  if (o370fe8adf2) o92e58e7996->o6f67a5295f = *(int *)(o370fe8adf2 + 80);
}

void o7eef6d5bdf(GumInvocationContext *o6206215e88) {
  oc429b1f8de *o92e58e7996 = od7258f6d3c(o6206215e88);
  if (o92e58e7996->o253f3b8c1c) o92e58e7996->o6f67a5295f = (int)(gssize)gum_invocation_context_get_nth_argument(o6206215e88, 1);
}

static oc429b1f8de *o1f71e25d9a(GumInvocationContext *o6206215e88) {
  oc429b1f8de *o92e58e7996 = GUM_IC_GET_INVOCATION_DATA(o6206215e88, oc429b1f8de);
  oeacf125434 *o253f3b8c1c = o92e58e7996->o253f3b8c1c;
  if (!o253f3b8c1c || o92e58e7996->o4f3bde06a8 != o5e1b8da804.o4f3bde06a8
      || o253f3b8c1c != o61be0054a7()) return 0;
  if (*(int *)(o253f3b8c1c + 2348) == 4) *(int *)(o253f3b8c1c + 2348) = o92e58e7996->oa40fc7cef7;
  if (!o5e1b8da804.o3f950d7322 || o92e58e7996->o314db0f150 != o5e1b8da804.o314db0f150) return 0;
  return o92e58e7996;
}

void o8bde4ebe57(GumInvocationContext *o6206215e88) { o1f71e25d9a(o6206215e88); }

void o49e9cc94bd(GumInvocationContext *o6206215e88) {
  oc429b1f8de *o26f7c1adff = GUM_IC_GET_INVOCATION_DATA(o6206215e88, oc429b1f8de);
  oc429b1f8de *o92e58e7996 = o1f71e25d9a(o6206215e88);
  oeacf125434 *o253f3b8c1c;
  if (!o92e58e7996) {
                                                                      
                                                                       
                                                                  
    o253f3b8c1c = o26f7c1adff->o253f3b8c1c;
    if (o253f3b8c1c && o26f7c1adff->o6f67a5295f >= 0
        && o26f7c1adff->o4f3bde06a8 == o5e1b8da804.o4f3bde06a8
        && o253f3b8c1c == o61be0054a7()
        && (!o26f7c1adff->ocd3b611a8b || o26f7c1adff->oc04e8ebe53 != o26f7c1adff->o6f67a5295f))
      o32cfa914f3(o253f3b8c1c, o26f7c1adff->o6f67a5295f);
    return;
  }
  if (o92e58e7996->o6f67a5295f < 0) return;
  o253f3b8c1c = o92e58e7996->o253f3b8c1c;
                                                                     
  if (!o253f3b8c1c[2412] || *(int *)(o253f3b8c1c + 2416) != o92e58e7996->o6f67a5295f) return;
  oc8c4d41587.o6f67a5295f = o92e58e7996->o6f67a5295f;
  oc8c4d41587.o38cf86362c = oc8c4d41587.o7a8db55bf0;
  oc8c4d41587.o3c765c843b = 1;
  oc8c4d41587.o034bd5853f++;
}

void o77ef569938(GumInvocationContext *o6206215e88) {
  oc429b1f8de *o92e58e7996 = o1f71e25d9a(o6206215e88);
  oeacf125434 *o253f3b8c1c;
  float o0dc0100be3, o401c877869, o7a8db55bf0;
  if (!o92e58e7996 || !oc8c4d41587.o3c765c843b || o92e58e7996->o6f67a5295f != oc8c4d41587.o6f67a5295f) return;
  o253f3b8c1c = o92e58e7996->o253f3b8c1c;
  if (!o253f3b8c1c[2412] || *(int *)(o253f3b8c1c + 2416) != o92e58e7996->o6f67a5295f) return;
  o0dc0100be3 = *(float *)(o253f3b8c1c + 2312);
  o401c877869 = *(float *)(o253f3b8c1c + 2452);
  if (!o2a2af1b7ed(o0dc0100be3) || o0dc0100be3 <= 0.0f || !o2a2af1b7ed(o401c877869)) return;
  o7a8db55bf0 = oc8c4d41587.o38cf86362c - o401c877869 * 2.4f / o0dc0100be3;
  if (o7a8db55bf0 > 1.3962634f) o7a8db55bf0 = 1.3962634f;
  if (o7a8db55bf0 < -1.3962634f) o7a8db55bf0 = -1.3962634f;
  oc8c4d41587.o7a8db55bf0 = o7a8db55bf0;
}

void ob949e021f5(GumInvocationContext *o6206215e88) {
  oc429b1f8de *o92e58e7996 = o1f71e25d9a(o6206215e88);
  if (!o92e58e7996 || !oc8c4d41587.o3c765c843b || o92e58e7996->o6f67a5295f != oc8c4d41587.o6f67a5295f) return;
  oc8c4d41587.o3c765c843b = 0;
  oc8c4d41587.o6f67a5295f = -1;
}

void oe244e7cc39(GumInvocationContext *o6206215e88) {
  oc429b1f8de *o92e58e7996 = o1f71e25d9a(o6206215e88);
  if (!o92e58e7996 || !oc8c4d41587.o3c765c843b || o92e58e7996->o6f67a5295f != oc8c4d41587.o6f67a5295f) return;
  o32cfa914f3(o92e58e7996->o253f3b8c1c, o92e58e7996->o6f67a5295f);
  oc8c4d41587.o3c765c843b = 0;
  oc8c4d41587.o6f67a5295f = -1;
}

typedef struct {
  oeacf125434 *o253f3b8c1c;
  unsigned o314db0f150;
  unsigned o4f3bde06a8;
  int oa40fc7cef7;
  float o497a8deb02;
  float o81141a1ce2;
} odd966e5ae9;

void o1de2d20548(GumInvocationContext *o6206215e88) {
  odd966e5ae9 *o92e58e7996 = GUM_IC_GET_INVOCATION_DATA(o6206215e88, odd966e5ae9);
  oeacf125434 *o253f3b8c1c;
  o92e58e7996->o253f3b8c1c = 0;
  if (!o5e1b8da804.o3f950d7322) return;
  o253f3b8c1c = gum_invocation_context_get_nth_argument(o6206215e88, 0);
  if (!o253f3b8c1c || o61be0054a7() != o253f3b8c1c) return;
  o5bd77f9821(o253f3b8c1c);
  o92e58e7996->o314db0f150 = o5e1b8da804.o314db0f150;
  o92e58e7996->o4f3bde06a8 = o5e1b8da804.o4f3bde06a8;
  o92e58e7996->o497a8deb02 = o5e1b8da804.o497a8deb02;
  o92e58e7996->o81141a1ce2 = o5e1b8da804.o81141a1ce2;
  o92e58e7996->oa40fc7cef7 = *(int *)(o253f3b8c1c + 2348);
  o92e58e7996->o253f3b8c1c = o253f3b8c1c;
                                                                       
  *(int *)(o253f3b8c1c + 2348) = 4;
}

void od3366c5403(GumInvocationContext *o6206215e88) {
  odd966e5ae9 *o92e58e7996 = GUM_IC_GET_INVOCATION_DATA(o6206215e88, odd966e5ae9);
  oeacf125434 *o253f3b8c1c = o92e58e7996->o253f3b8c1c, *of741fa7795, *o48cf1978de, *o834d4aac84, *oa7309ae9f6;
  float o2a89e941fd[3], o3d0c9e8d0e[3], o06a2d2559c[3] = {0.0f, 0.0f, 1.0f};
  float o99ed0652e7[64], o7d7b6192c7, o0dc0100be3, o162499318e, odedafe2759;
  int oe395b49995;
  if (!o253f3b8c1c || o92e58e7996->o4f3bde06a8 != o5e1b8da804.o4f3bde06a8
      || o61be0054a7() != o253f3b8c1c) return;
                                                                              
  if (*(int *)(o253f3b8c1c + 2348) == 4)
    *(int *)(o253f3b8c1c + 2348) = o92e58e7996->oa40fc7cef7;
  if (!o5e1b8da804.o3f950d7322 || o92e58e7996->o314db0f150 != o5e1b8da804.o314db0f150)
    return;
  if (o253f3b8c1c[2473] || !o253f3b8c1c[2472]) goto o5e7a9f6673;
  of741fa7795 = *(oeacf125434 **)(o253f3b8c1c + 2328);
  oa7309ae9f6 = *(oeacf125434 **)(o253f3b8c1c + 2560);
  if (!of741fa7795 || !oa7309ae9f6) goto o5e7a9f6673;
  o48cf1978de = *(oeacf125434 **)(of741fa7795 + 40);
  if (!o48cf1978de || !*(oeacf125434 **)(o48cf1978de + 40)) goto o5e7a9f6673;
  o834d4aac84 = o6ba5329997(o48cf1978de);
  if (!o834d4aac84 || *(int *)(o834d4aac84 + 196) <= 0) goto o5e7a9f6673;
  o7d7b6192c7 = *(float *)(o253f3b8c1c + 2308);
  o0dc0100be3 = *(float *)(o253f3b8c1c + 2312);
  if (!o2a2af1b7ed(o7d7b6192c7) || !o2a2af1b7ed(o0dc0100be3) || o7d7b6192c7 <= 0.0f || o0dc0100be3 <= 0.0f)
    goto o5e7a9f6673;
                                                                     
                                                                  
  o3d0c9e8d0e[0] = *(float *)(o253f3b8c1c + 2292) - *(float *)(o253f3b8c1c + 2280);
  o3d0c9e8d0e[1] = *(float *)(o253f3b8c1c + 2296) - *(float *)(o253f3b8c1c + 2284);
  o3d0c9e8d0e[2] = sqrtf(o3d0c9e8d0e[0] * o3d0c9e8d0e[0] + o3d0c9e8d0e[1] * o3d0c9e8d0e[1])
      * tanf(oc8c4d41587.o7a8db55bf0);
                                                                          
                                                                                   
  o162499318e = (float)*(int *)(o834d4aac84 + 48) + *(float *)(oa7309ae9f6 + 172) * 6.25f;
  odedafe2759 = -(float)*(int *)(o834d4aac84 + 52) + *(float *)(oa7309ae9f6 + 176) * 6.25f;
  if (oe3780137c2 && *oe3780137c2)
    odedafe2759 = odedafe2759 + (odedafe2759 - *(float *)(oa7309ae9f6 + 36) * 8.3333f - 5.0f);
  o2a89e941fd[0] = o162499318e;
  o2a89e941fd[1] = odedafe2759;
  o2a89e941fd[2] = o92e58e7996->o81141a1ce2 + (float)*(int *)(o834d4aac84 + 56);
  if (!od825d99fb3(o2a89e941fd, o3d0c9e8d0e, o06a2d2559c, o92e58e7996->o497a8deb02, o7d7b6192c7 / o0dc0100be3,
                16.0f, 30000.0f, o99ed0652e7)) goto o5e7a9f6673;
                                                                                 
  for (oe395b49995 = 0; oe395b49995 < 64; oe395b49995++) ((float *)(o253f3b8c1c + 2024))[oe395b49995] = o99ed0652e7[oe395b49995];
  for (oe395b49995 = 0; oe395b49995 < 3; oe395b49995++) {
    ((float *)(o253f3b8c1c + 2280))[oe395b49995] = o2a89e941fd[oe395b49995];
    ((float *)(o253f3b8c1c + 2292))[oe395b49995] = o2a89e941fd[oe395b49995] + o3d0c9e8d0e[oe395b49995];
  }
  o5e1b8da804.ocf3e79794f++;
  return;
o5e7a9f6673:
  o5e1b8da804.o5e7a9f6673++;
}


#include <gum/guminterceptor.h>
#include <glib.h>
#include <string.h>

                                                                              
                                                                              
                                                                  
#define obb877ee1f4(of7cf3e015c,oa1cb7f34d9) (*(void **)((char *)(of7cf3e015c)+(oa1cb7f34d9)))
#define o106d977612(of7cf3e015c,oa1cb7f34d9) (*(int *)((char *)(of7cf3e015c)+(oa1cb7f34d9)))
#define o9afe03dc58(of7cf3e015c,oa1cb7f34d9) (*(float *)((char *)(of7cf3e015c)+(oa1cb7f34d9)))
#define o6fa92560f8(of7cf3e015c,oa1cb7f34d9) (*(unsigned char *)((char *)(of7cf3e015c)+(oa1cb7f34d9)))
extern unsigned char o159a0017e1[];
extern void *o288a863c1f(void);
extern void *od605cf1bb3(void);
extern void *oe44e7d5e55(void);
extern void *o090e809113(void);
extern void *o4d6a731437(void *);
extern int o585346244d(void *);
extern int o3ebdf6e0b3(void *);
extern void *ob121f5a646(void *,void *);
extern void *od8ce46446c(void *,void *);
extern void *ob197127b2d(void *,int);
extern void o13df6fa621(void *,int,float);
extern void o08287ce9b8(void *,int,float);
extern void oa919d539d3(void *,int,float);
extern float o9c15ebc852(void *);

typedef struct {
  int oda5143d59c,of5f79479e5,o068b8643e0,oa813d4cbb9,o53985df7d9,o38c90dabef,od620a9fb17[96];
  void *oa64b72e965,*o3a66e387a2,*o9e64dc1d3a;
  int o1850ffc71f,o9039841b3c,o39ede14c63,o5340995ade,o71ee99555a,o482405bdf3,o13787a0269;
  int o54ea322f87,ob230ba1fd3,odf0a660894,o79777e895a,oe562d4b019,obd18ec4a11,of2f9b10b85,o01b87111b1,o764dadbc65;
  float o26d6713af4,ob7d597bee7,o0724ef363c; int o753c718b0d,o487410f436;
  gint64 o8363338823,od6a1c464b0,o2ca9f84939;
} o616eeb2ff8;
#define o38d61a30d5 ((o616eeb2ff8 *)o159a0017e1)
typedef struct { void *oa64b72e965; } ob15ffc74d5;
static int o730300c86b(void){if(g_atomic_int_add(&o38d61a30d5->oda5143d59c,1)==0)return 1;g_atomic_int_add(&o38d61a30d5->oda5143d59c,-1);return 0;}
static void oefefe2441b(void){g_atomic_int_add(&o38d61a30d5->oda5143d59c,-1);}
static int o376ccd89ee(void){void *odd126bb200=o288a863c1f();return odd126bb200?o106d977612(odd126bb200,80):0;}
static int oac00a9ad94(int obc5f6cc63d,int o9039841b3c){
  if(obc5f6cc63d==1)return o9039841b3c==2||o9039841b3c==3||o9039841b3c==4||o9039841b3c==5||o9039841b3c==6||o9039841b3c==7||o9039841b3c==8||o9039841b3c==9||o9039841b3c==10||o9039841b3c==11||o9039841b3c==12||o9039841b3c==13||o9039841b3c==14||o9039841b3c==15||o9039841b3c==24||o9039841b3c==25||o9039841b3c==26||o9039841b3c==27||o9039841b3c==28||o9039841b3c==29||o9039841b3c==30||o9039841b3c==31;
                                                                     
                                                                            
  return obc5f6cc63d==2&&(o9039841b3c==11||o9039841b3c==12||o9039841b3c==13||o9039841b3c==14||o9039841b3c==40);
}
static int o463581ac47(void *o4ea414f7da){
  gsize oe3c439f72f,ob3da47790c,o8765f8bfe3;
  if(!o4ea414f7da)return 0;oe3c439f72f=(gsize)obb877ee1f4(o4ea414f7da,8);ob3da47790c=(gsize)obb877ee1f4(o4ea414f7da,16);o8765f8bfe3=(gsize)obb877ee1f4(o4ea414f7da,24);
  return oe3c439f72f&&ob3da47790c>=oe3c439f72f&&o8765f8bfe3>=ob3da47790c&&o8765f8bfe3-oe3c439f72f<=4096&&(ob3da47790c-oe3c439f72f)%8==0;
}
static int o8cb41a75ca(void *o4ea414f7da){
  void **of7cf3e015c=(void **)obb877ee1f4(o4ea414f7da,8),**of82ad0b2e2=(void **)obb877ee1f4(o4ea414f7da,16);int o9039841b3c=-1;float o27a5e5359c=-1;
  for(;of7cf3e015c!=of82ad0b2e2;of7cf3e015c++)if(*of7cf3e015c&&o9afe03dc58(*of7cf3e015c,60)>o27a5e5359c){o27a5e5359c=o9afe03dc58(*of7cf3e015c,60);o9039841b3c=o106d977612(*of7cf3e015c,28);}return o9039841b3c;
}
static void o4172f51c31(o616eeb2ff8 *oafa94d67f5,int of2f9b10b85){
  oafa94d67f5->o1850ffc71f=0;oafa94d67f5->o487410f436=0;oafa94d67f5->o5340995ade=0;oafa94d67f5->o53985df7d9=0;oafa94d67f5->oa813d4cbb9=0;oafa94d67f5->o38c90dabef=0;
  oafa94d67f5->oa64b72e965=0;oafa94d67f5->o3a66e387a2=0;oafa94d67f5->o9e64dc1d3a=0;oafa94d67f5->o8363338823=0;oafa94d67f5->o068b8643e0++;oafa94d67f5->of2f9b10b85=of2f9b10b85;
}
static void o45a110aa46(o616eeb2ff8 *oafa94d67f5,void *o4ea414f7da){
  void **of7cf3e015c=(void **)obb877ee1f4(o4ea414f7da,8),**of82ad0b2e2=(void **)obb877ee1f4(o4ea414f7da,16);int of08c83a14c=0,of6149b8dab,o9039841b3c,ofbcf7b3112;
  for(;of7cf3e015c!=of82ad0b2e2&&of08c83a14c<96;of7cf3e015c++){if(!*of7cf3e015c)continue;o9039841b3c=o106d977612(*of7cf3e015c,28);if(!oac00a9ad94(oafa94d67f5->oa813d4cbb9,o9039841b3c))continue;
    ofbcf7b3112=0;for(of6149b8dab=0;of6149b8dab<of08c83a14c;of6149b8dab++)if(oafa94d67f5->od620a9fb17[of6149b8dab]==o9039841b3c)ofbcf7b3112=1;
    if(!ofbcf7b3112)oafa94d67f5->od620a9fb17[of08c83a14c++]=o9039841b3c;
  }oafa94d67f5->o38c90dabef=of08c83a14c;
}
static void ocdb0d5199c(o616eeb2ff8 *oafa94d67f5,void *o4ea414f7da,int o044d8e7895,int of2f9b10b85){
  void *o746226c7ce=ob197127b2d(o4ea414f7da,oafa94d67f5->o9039841b3c);if(o746226c7ce)o9afe03dc58(o746226c7ce,24)=oafa94d67f5->ob7d597bee7;
  int o5306761d20=oafa94d67f5->oa813d4cbb9==2?o044d8e7895:oafa94d67f5->o54ea322f87;
  if(o5306761d20>=0&&ob197127b2d(o4ea414f7da,o5306761d20))o13df6fa621(o4ea414f7da,o5306761d20,.14f);
                                                                                 
  if(oafa94d67f5->oa813d4cbb9==1&&oafa94d67f5->ob230ba1fd3>=0&&ob197127b2d(o4ea414f7da,oafa94d67f5->ob230ba1fd3))o08287ce9b8(o4ea414f7da,oafa94d67f5->ob230ba1fd3,oafa94d67f5->o26d6713af4);
  else o08287ce9b8(o4ea414f7da,-1,0);
  oafa94d67f5->o1850ffc71f=0;oafa94d67f5->o5340995ade=0;oafa94d67f5->o764dadbc65++;oafa94d67f5->of2f9b10b85=of2f9b10b85;
}
static void o484a54147a(o616eeb2ff8 *oafa94d67f5,void *oa64b72e965,void *o4ea414f7da,void *o9e64dc1d3a,int oa813d4cbb9,void *o43dfc85c37,int o044d8e7895){
  gint64 o6f3e1c35c3=g_get_monotonic_time();void *o746226c7ce,*o8c70b15635;int obef76c332d,o807a7e5278=0,o79777e895a=0,oe562d4b019=0,obd18ec4a11=0,o9039841b3c;
  if(!o463581ac47(o4ea414f7da))return;
  if(!oafa94d67f5->of5f79479e5){return;}
  obef76c332d=oafa94d67f5->oa64b72e965!=oa64b72e965||oafa94d67f5->o3a66e387a2!=o4ea414f7da||oafa94d67f5->o9e64dc1d3a!=o9e64dc1d3a||oafa94d67f5->oa813d4cbb9!=oa813d4cbb9;
  if(obef76c332d){o4172f51c31(oafa94d67f5,1);oafa94d67f5->oa64b72e965=oa64b72e965;oafa94d67f5->o3a66e387a2=o4ea414f7da;oafa94d67f5->o9e64dc1d3a=o9e64dc1d3a;oafa94d67f5->oa813d4cbb9=oa813d4cbb9;}
  oafa94d67f5->o8363338823=o6f3e1c35c3;oafa94d67f5->o53985df7d9=1;
  if(obef76c332d||o6f3e1c35c3-oafa94d67f5->o2ca9f84939>500000){o45a110aa46(oafa94d67f5,o4ea414f7da);oafa94d67f5->o2ca9f84939=o6f3e1c35c3;}
  if(oa813d4cbb9==2){
    o79777e895a=o106d977612(o43dfc85c37,196);oe562d4b019=o585346244d(o43dfc85c37);obd18ec4a11=o3ebdf6e0b3(o43dfc85c37);o8c70b15635=o090e809113();
    o807a7e5278=o79777e895a<=0||!o8c70b15635||o6fa92560f8(o8c70b15635,3960)||(o044d8e7895!=0&&o044d8e7895!=18&&o044d8e7895!=41);
    if(oafa94d67f5->o1850ffc71f&&(o79777e895a<oafa94d67f5->o79777e895a||oe562d4b019-oafa94d67f5->oe562d4b019>8||oafa94d67f5->oe562d4b019-oe562d4b019>8||obd18ec4a11-oafa94d67f5->obd18ec4a11>8||oafa94d67f5->obd18ec4a11-obd18ec4a11>8))o807a7e5278=1;
  }
  if(oafa94d67f5->o1850ffc71f&&o807a7e5278&&(!oafa94d67f5->o39ede14c63||o79777e895a<=0)){ocdb0d5199c(oafa94d67f5,o4ea414f7da,o044d8e7895,3);return;}
  if(oafa94d67f5->o5340995ade){
    if(oafa94d67f5->o482405bdf3!=oafa94d67f5->o068b8643e0){oafa94d67f5->o5340995ade=0;oafa94d67f5->of2f9b10b85=4;return;}
    if(oafa94d67f5->o5340995ade==2){if(oafa94d67f5->o1850ffc71f)ocdb0d5199c(oafa94d67f5,o4ea414f7da,o044d8e7895,2);else oafa94d67f5->o5340995ade=0;return;}
    o9039841b3c=oafa94d67f5->o71ee99555a;oafa94d67f5->o5340995ade=0;
    o746226c7ce=oac00a9ad94(oa813d4cbb9,o9039841b3c)?ob197127b2d(o4ea414f7da,o9039841b3c):0;
    if((o807a7e5278&&!oafa94d67f5->o13787a0269)||(oa813d4cbb9==2&&o79777e895a<=0)||!o746226c7ce){oafa94d67f5->of2f9b10b85=o807a7e5278?3:5;return;}
    if(!oafa94d67f5->o1850ffc71f){oafa94d67f5->o54ea322f87=o8cb41a75ca(o4ea414f7da);oafa94d67f5->ob230ba1fd3=o106d977612(o4ea414f7da,52);oafa94d67f5->o26d6713af4=o9afe03dc58(o4ea414f7da,56);}
    if(oafa94d67f5->o1850ffc71f){void *o3ddbd22f37=ob197127b2d(o4ea414f7da,oafa94d67f5->o9039841b3c);if(o3ddbd22f37)o9afe03dc58(o3ddbd22f37,24)=oafa94d67f5->ob7d597bee7;}oafa94d67f5->ob7d597bee7=o9afe03dc58(o746226c7ce,24);
    oafa94d67f5->o9039841b3c=o9039841b3c;oafa94d67f5->o39ede14c63=oafa94d67f5->o13787a0269;oafa94d67f5->o1850ffc71f=1;oafa94d67f5->od6a1c464b0=o6f3e1c35c3;oafa94d67f5->odf0a660894=o044d8e7895;oafa94d67f5->o79777e895a=o79777e895a;oafa94d67f5->oe562d4b019=oe562d4b019;oafa94d67f5->obd18ec4a11=obd18ec4a11;oafa94d67f5->o01b87111b1++;oafa94d67f5->of2f9b10b85=0;
    o13df6fa621(o4ea414f7da,o9039841b3c,.18f);oa919d539d3(o4ea414f7da,o9039841b3c,.18f);o08287ce9b8(o4ea414f7da,-1,0);oafa94d67f5->o0724ef363c=o9afe03dc58(o746226c7ce,12);oafa94d67f5->o487410f436=1;
  }
  if(oafa94d67f5->o1850ffc71f){
    o746226c7ce=ob197127b2d(o4ea414f7da,oafa94d67f5->o9039841b3c);
    if(!o746226c7ce){ocdb0d5199c(oafa94d67f5,o4ea414f7da,o044d8e7895,5);return;}
                                                                                                     
    o9afe03dc58(o746226c7ce,24)=oafa94d67f5->ob7d597bee7*((oafa94d67f5->o753c718b0d>=25&&oafa94d67f5->o753c718b0d<=200?oafa94d67f5->o753c718b0d:100)/100.0f);
    if(oafa94d67f5->o39ede14c63){if(o8cb41a75ca(o4ea414f7da)!=oafa94d67f5->o9039841b3c)o13df6fa621(o4ea414f7da,oafa94d67f5->o9039841b3c,.08f);o08287ce9b8(o4ea414f7da,-1,0);}

    if(!oafa94d67f5->o39ede14c63&&o6f3e1c35c3-oafa94d67f5->od6a1c464b0>300000&&o9afe03dc58(o746226c7ce,60)<.01f){ocdb0d5199c(oafa94d67f5,o4ea414f7da,o044d8e7895,3);return;}
    if(!oafa94d67f5->o39ede14c63&&(o6f3e1c35c3-oafa94d67f5->od6a1c464b0>6000000||(!o6fa92560f8(o746226c7ce,8)&&o6f3e1c35c3-oafa94d67f5->od6a1c464b0>250000&&o9c15ebc852(o746226c7ce)<=.025f))){ocdb0d5199c(oafa94d67f5,o4ea414f7da,o044d8e7895,6);return;}
    if(oafa94d67f5->o39ede14c63&&!o6fa92560f8(o746226c7ce,8)&&o6f3e1c35c3-oafa94d67f5->od6a1c464b0>150000&&o9c15ebc852(o746226c7ce)<=.025f){oa919d539d3(o4ea414f7da,oafa94d67f5->o9039841b3c,0);oafa94d67f5->o0724ef363c=o9afe03dc58(o746226c7ce,12);}
  }
  
}
static void o1a2606c881(int of2f9b10b85){o4172f51c31(o38d61a30d5,of2f9b10b85);}
static void o475a76979c(void *oa64b72e965,void *o4ea414f7da,void *o9e64dc1d3a,int oa813d4cbb9,void *o43dfc85c37,int o044d8e7895){
 if(!o730300c86b())return;o484a54147a(o38d61a30d5,oa64b72e965,o4ea414f7da,o9e64dc1d3a,oa813d4cbb9,o43dfc85c37,o044d8e7895);oefefe2441b();
}
#define o1b9262720c 24
typedef struct {unsigned o31e0e1852a,o384103b33f,o431112df9a;int oa813d4cbb9,o9039841b3c,o39ede14c63,o753c718b0d;gint64 o55c1921659,o8363338823;o616eeb2ff8 o422897bb7f;} o31529de80b;
extern unsigned char od7bf4bd6c5[];
#define od4ad25238c ((o31529de80b *)od7bf4bd6c5)
static o31529de80b *o51323c1b24(unsigned o31e0e1852a,unsigned o384103b33f,int oe030275165){
 int of6149b8dab,o61fa5f2100=-1;gint64 o6f3e1c35c3=g_get_monotonic_time();
 if(o31e0e1852a>255||(!o31e0e1852a&&!o384103b33f))return 0;
 for(of6149b8dab=0;of6149b8dab<o1b9262720c;of6149b8dab++){if(od4ad25238c[of6149b8dab].o31e0e1852a==o31e0e1852a&&od4ad25238c[of6149b8dab].o384103b33f==o384103b33f)return &od4ad25238c[of6149b8dab];if(o61fa5f2100<0&&(!od4ad25238c[of6149b8dab].o8363338823||o6f3e1c35c3-od4ad25238c[of6149b8dab].o8363338823>3000000)&&od4ad25238c[of6149b8dab].o55c1921659<o6f3e1c35c3)o61fa5f2100=of6149b8dab;}
 if(!oe030275165||o61fa5f2100<0)return 0;memset(&od4ad25238c[o61fa5f2100],0,sizeof(o31529de80b));od4ad25238c[o61fa5f2100].o31e0e1852a=o31e0e1852a;od4ad25238c[o61fa5f2100].o384103b33f=o384103b33f;od4ad25238c[o61fa5f2100].o422897bb7f.of5f79479e5=1;od4ad25238c[o61fa5f2100].o422897bb7f.o753c718b0d=100;return &od4ad25238c[o61fa5f2100];
}
static void o8209b9479d(unsigned o31e0e1852a,unsigned o384103b33f,void *oa64b72e965,void *o4ea414f7da,void *o9e64dc1d3a,int oa813d4cbb9,void *o43dfc85c37,int o044d8e7895){
 o31529de80b *o54842337d8;o616eeb2ff8 *oafa94d67f5;gint64 o6f3e1c35c3=g_get_monotonic_time();int obef76c332d;
 if(!o463581ac47(o4ea414f7da)||!o730300c86b())return;o54842337d8=o51323c1b24(o31e0e1852a,o384103b33f,1);if(!o54842337d8){oefefe2441b();return;}oafa94d67f5=&o54842337d8->o422897bb7f;o54842337d8->o8363338823=o6f3e1c35c3;
 obef76c332d=oafa94d67f5->oa64b72e965!=oa64b72e965||oafa94d67f5->o3a66e387a2!=o4ea414f7da||oafa94d67f5->o9e64dc1d3a!=o9e64dc1d3a||oafa94d67f5->oa813d4cbb9!=oa813d4cbb9;
 if(obef76c332d){o4172f51c31(oafa94d67f5,1);oafa94d67f5->oa64b72e965=oa64b72e965;oafa94d67f5->o3a66e387a2=o4ea414f7da;oafa94d67f5->o9e64dc1d3a=o9e64dc1d3a;oafa94d67f5->oa813d4cbb9=oa813d4cbb9;oafa94d67f5->o2ca9f84939=0;}
 if(o54842337d8->o55c1921659<=o6f3e1c35c3||o54842337d8->oa813d4cbb9!=oa813d4cbb9||o54842337d8->o9039841b3c<0){if(oafa94d67f5->o1850ffc71f)ocdb0d5199c(oafa94d67f5,o4ea414f7da,o044d8e7895,2);oafa94d67f5->o5340995ade=0;}
 else if(obef76c332d||oafa94d67f5->o482405bdf3!=(int)o54842337d8->o431112df9a){
  oafa94d67f5->o71ee99555a=o54842337d8->o9039841b3c;oafa94d67f5->o13787a0269=o54842337d8->o39ede14c63;oafa94d67f5->o5340995ade=1;oafa94d67f5->o482405bdf3=oafa94d67f5->o068b8643e0;
 }
 oafa94d67f5->o753c718b0d=o54842337d8->o753c718b0d;
 o484a54147a(oafa94d67f5,oa64b72e965,o4ea414f7da,o9e64dc1d3a,oa813d4cbb9,o43dfc85c37,o044d8e7895);
                                                                                 
 oafa94d67f5->o482405bdf3=(int)o54842337d8->o431112df9a;
 oefefe2441b();
}
int o35699ecb7c(unsigned o31e0e1852a,unsigned o384103b33f,int oa813d4cbb9,int o9039841b3c,int o39ede14c63,int o753c718b0d,unsigned o431112df9a,int o7cc6374403){
 o31529de80b *o54842337d8;int od0e0b35573=0;if(oa813d4cbb9<1||oa813d4cbb9>2||o9039841b3c<-1||(o9039841b3c>=0&&!oac00a9ad94(oa813d4cbb9,o9039841b3c))||o753c718b0d<25||o753c718b0d>200||o7cc6374403<0||o7cc6374403>6000)return 0;
 if(!o730300c86b())return 0;o54842337d8=o51323c1b24(o31e0e1852a,o384103b33f,1);if(o54842337d8){o54842337d8->oa813d4cbb9=oa813d4cbb9;o54842337d8->o9039841b3c=o9039841b3c;o54842337d8->o39ede14c63=o39ede14c63!=0;o54842337d8->o753c718b0d=o753c718b0d;o54842337d8->o431112df9a=o431112df9a;o54842337d8->o55c1921659=g_get_monotonic_time()+(gint64)o7cc6374403*1000;od0e0b35573=1;}oefefe2441b();return od0e0b35573;
}
int o3c4b16869d(unsigned *o469efb3455){int of6149b8dab,of08c83a14c=0;gint64 o6f3e1c35c3=g_get_monotonic_time();if(!o730300c86b())return -1;
 for(of6149b8dab=0;of6149b8dab<o1b9262720c;of6149b8dab++)if(od4ad25238c[of6149b8dab].o8363338823&&o6f3e1c35c3-od4ad25238c[of6149b8dab].o8363338823<1500000){o469efb3455[of08c83a14c*3]=od4ad25238c[of6149b8dab].o31e0e1852a;o469efb3455[of08c83a14c*3+1]=od4ad25238c[of6149b8dab].o384103b33f;o469efb3455[of08c83a14c*3+2]=od4ad25238c[of6149b8dab].o422897bb7f.oa813d4cbb9;of08c83a14c++;}oefefe2441b();return of08c83a14c;
}
void o363eba7040(int o753c718b0d){if(o753c718b0d<25||o753c718b0d>200)return;if(o730300c86b()){o38d61a30d5->o753c718b0d=o753c718b0d;oefefe2441b();}}
                                                                             
                                                                               
                                                                                
static o616eeb2ff8 *oc4c0b30d1b(void *o4ea414f7da){
 int of6149b8dab,odd126bb200=o376ccd89ee();gint64 o6f3e1c35c3=g_get_monotonic_time();
 if(o38d61a30d5->o1850ffc71f&&o38d61a30d5->o3a66e387a2==o4ea414f7da&&o6f3e1c35c3-o38d61a30d5->o8363338823<500000&&odd126bb200==(o38d61a30d5->oa813d4cbb9==1?4:5))return o38d61a30d5;
 for(of6149b8dab=0;of6149b8dab<o1b9262720c;of6149b8dab++)if(od4ad25238c[of6149b8dab].o55c1921659>o6f3e1c35c3&&od4ad25238c[of6149b8dab].o422897bb7f.o1850ffc71f&&od4ad25238c[of6149b8dab].o422897bb7f.o3a66e387a2==o4ea414f7da&&o6f3e1c35c3-od4ad25238c[of6149b8dab].o8363338823<500000&&odd126bb200==(od4ad25238c[of6149b8dab].oa813d4cbb9==1?4:5))return &od4ad25238c[of6149b8dab].o422897bb7f;
 return 0;
}
void o54ea8b452c(GumInvocationContext *ob74b75eee6){
 void *o4ea414f7da=gum_invocation_context_get_nth_argument(ob74b75eee6,0),*o746226c7ce;o616eeb2ff8 *oafa94d67f5;
 ob15ffc74d5 *obc5f6cc63d=GUM_IC_GET_INVOCATION_DATA(ob74b75eee6,ob15ffc74d5);obc5f6cc63d->oa64b72e965=o4ea414f7da;
 if(!o38d61a30d5->of5f79479e5||!o730300c86b())return;oafa94d67f5=oc4c0b30d1b(o4ea414f7da);
 if(oafa94d67f5&&o463581ac47(o4ea414f7da)&&(o746226c7ce=ob197127b2d(o4ea414f7da,oafa94d67f5->o9039841b3c))){
  if(o8cb41a75ca(o4ea414f7da)!=oafa94d67f5->o9039841b3c||o9afe03dc58(o746226c7ce,60)<.999f)o13df6fa621(o4ea414f7da,oafa94d67f5->o9039841b3c,0);
  if(oafa94d67f5->o487410f436)o9afe03dc58(o746226c7ce,12)=oafa94d67f5->o0724ef363c;
  o9afe03dc58(o746226c7ce,24)=oafa94d67f5->ob7d597bee7*(oafa94d67f5->o753c718b0d/100.0f);o08287ce9b8(o4ea414f7da,-1,0);
 }
 oefefe2441b();
}
void o757c796916(GumInvocationContext *ob74b75eee6){
 ob15ffc74d5 *obc5f6cc63d=GUM_IC_GET_INVOCATION_DATA(ob74b75eee6,ob15ffc74d5);void *o4ea414f7da=obc5f6cc63d->oa64b72e965,*o746226c7ce;o616eeb2ff8 *oafa94d67f5;
 if(!o38d61a30d5->of5f79479e5||!o730300c86b())return;oafa94d67f5=oc4c0b30d1b(o4ea414f7da);
 if(oafa94d67f5&&o463581ac47(o4ea414f7da)&&(o746226c7ce=ob197127b2d(o4ea414f7da,oafa94d67f5->o9039841b3c))){oafa94d67f5->o0724ef363c=o9afe03dc58(o746226c7ce,12);oafa94d67f5->o487410f436=1;}
 oefefe2441b();
}
void occd79b0859(GumInvocationContext *ob74b75eee6){
  ob15ffc74d5 *obc5f6cc63d=GUM_IC_GET_INVOCATION_DATA(ob74b75eee6,ob15ffc74d5);obc5f6cc63d->oa64b72e965=gum_invocation_context_get_nth_argument(ob74b75eee6,0);
}
                                                                      
                                                            
                                                                  
                                                                               
static int o8b245e1bc5(void *o5e3c9dffab){
  void *o0dc0a63abc=obb877ee1f4(o5e3c9dffab,256),*o9039841b3c,*o014a622706;
  if(!o0dc0a63abc)return 0;o9039841b3c=obb877ee1f4(o0dc0a63abc,8);if(!o9039841b3c)return 0;
  o014a622706=od605cf1bb3();if(!o014a622706)return 0;
  return o106d977612(o9039841b3c,0)==o106d977612(o014a622706,28)&&o106d977612(o9039841b3c,4)==o106d977612(o014a622706,32);
}
void o1bf2f67d91(GumInvocationContext *ob74b75eee6){
  ob15ffc74d5 *obc5f6cc63d=GUM_IC_GET_INVOCATION_DATA(ob74b75eee6,ob15ffc74d5);void *of7cf3e015c=obc5f6cc63d->oa64b72e965,*o708c208ce6,*o9e64dc1d3a,*o1542dce31b,*o5b5e113b84,*oa64b72e965;
  if(!o38d61a30d5->of5f79479e5||o376ccd89ee()!=4||!of7cf3e015c||!obb877ee1f4(of7cf3e015c,256)||!obb877ee1f4(obb877ee1f4(of7cf3e015c,256),8))return;
  o708c208ce6=obb877ee1f4(of7cf3e015c,248);o9e64dc1d3a=obb877ee1f4(of7cf3e015c,280);if(!o708c208ce6||!o9e64dc1d3a)return;
  o1542dce31b=ob121f5a646(o708c208ce6,o9e64dc1d3a);if(!o1542dce31b)o1542dce31b=od8ce46446c(o708c208ce6,o9e64dc1d3a);
  if(!o1542dce31b)return;o5b5e113b84=obb877ee1f4(o1542dce31b,184);if(!o5b5e113b84||(gsize)obb877ee1f4(o1542dce31b,192)<(gsize)o5b5e113b84+24)return;
  oa64b72e965=obb877ee1f4(o5b5e113b84,0);if(!oa64b72e965)return;
  if(o8b245e1bc5(of7cf3e015c))o475a76979c(oa64b72e965,obb877ee1f4(oa64b72e965,296),obb877ee1f4(oa64b72e965,240),1,0,0);
  else {void *o9039841b3c=obb877ee1f4(obb877ee1f4(of7cf3e015c,256),8);o8209b9479d((unsigned)o106d977612(o9039841b3c,0),(unsigned)o106d977612(o9039841b3c,4),oa64b72e965,obb877ee1f4(oa64b72e965,296),obb877ee1f4(oa64b72e965,240),1,0,0);}
}
static void o2242224e91(void *o398f6473ab,void *o6165a3c6fe,void *o43dfc85c37,void *o7bff828766,void *o4e818bf38f){
 void *o8594c9feb8,*o0dc0a63abc,*obcd01ac107=obb877ee1f4(o7bff828766,40);int o0c7210d165,o38c90dabef;
 if(o43dfc85c37==o4e818bf38f){o475a76979c(o398f6473ab,obb877ee1f4(o398f6473ab,256),obb877ee1f4(o6165a3c6fe,2840),2,o43dfc85c37,o106d977612(o398f6473ab,336));return;}
 o0c7210d165=o106d977612(o43dfc85c37,60);o38c90dabef=o106d977612(obcd01ac107,12);o8594c9feb8=obb877ee1f4(obcd01ac107,0);
 if(o0c7210d165<0||o38c90dabef<1||o38c90dabef>64||o0c7210d165>=o38c90dabef||!o8594c9feb8||o106d977612(o43dfc85c37,8)!=o106d977612(obcd01ac107,256))return;
 o0dc0a63abc=obb877ee1f4(o8594c9feb8,o0c7210d165*8);if(!o0dc0a63abc)return;
 o8209b9479d((unsigned)o106d977612(o0dc0a63abc,0),(unsigned)o106d977612(o0dc0a63abc,4),o398f6473ab,obb877ee1f4(o398f6473ab,256),obb877ee1f4(o6165a3c6fe,2840),2,o43dfc85c37,o106d977612(o398f6473ab,336));
}
void o115013a567(GumInvocationContext *ob74b75eee6){
  ob15ffc74d5 *obc5f6cc63d=GUM_IC_GET_INVOCATION_DATA(ob74b75eee6,ob15ffc74d5);void *of7cf3e015c=obc5f6cc63d->oa64b72e965,*o6165a3c6fe,*o43dfc85c37,*o7bff828766,*o4e818bf38f;
  if(!o38d61a30d5->of5f79479e5||o376ccd89ee()!=5||!of7cf3e015c)return;
  o7bff828766=oe44e7d5e55();if(!o7bff828766||o106d977612(o7bff828766,12)!=7||!obb877ee1f4(o7bff828766,40))return;
  o6165a3c6fe=obb877ee1f4(of7cf3e015c,280);if(!o6165a3c6fe)return;o43dfc85c37=obb877ee1f4(o6165a3c6fe,16);o4e818bf38f=o4d6a731437(obb877ee1f4(o7bff828766,40));
  if(!o43dfc85c37)return;
  o2242224e91(of7cf3e015c,o6165a3c6fe,o43dfc85c37,o7bff828766,o4e818bf38f);
}
                                                                             
                                                                          
                                                                     
void obe86f22f6e(GumInvocationContext *ob74b75eee6){
  ob15ffc74d5 *obc5f6cc63d=GUM_IC_GET_INVOCATION_DATA(ob74b75eee6,ob15ffc74d5);void *o6165a3c6fe=obc5f6cc63d->oa64b72e965,*o43dfc85c37,*o7bff828766,*o4e818bf38f,*o398f6473ab;
  if(!o38d61a30d5->of5f79479e5||o376ccd89ee()!=5||!o6165a3c6fe)return;
  o7bff828766=oe44e7d5e55();if(!o7bff828766||o106d977612(o7bff828766,12)!=7||!obb877ee1f4(o7bff828766,40))return;
  o43dfc85c37=obb877ee1f4(o6165a3c6fe,16);o4e818bf38f=o4d6a731437(obb877ee1f4(o7bff828766,40));if(!o43dfc85c37)return;
  o398f6473ab=obb877ee1f4(o6165a3c6fe,2776);if(!o398f6473ab||obb877ee1f4(o398f6473ab,280)!=o6165a3c6fe)return;
  o2242224e91(o398f6473ab,o6165a3c6fe,o43dfc85c37,o7bff828766,o4e818bf38f);
}
                                                                               
                                                                               
int o44dbeea1ba(int o9039841b3c,int o068b8643e0,int o39ede14c63){
  int od0e0b35573=0;if(!o730300c86b())return 0;
  if(o38d61a30d5->of5f79479e5&&o38d61a30d5->o53985df7d9&&o38d61a30d5->o068b8643e0==o068b8643e0&&g_get_monotonic_time()-o38d61a30d5->o8363338823<500000){
    if(o9039841b3c==-1||oac00a9ad94(o38d61a30d5->oa813d4cbb9,o9039841b3c)){o38d61a30d5->o71ee99555a=o9039841b3c;o38d61a30d5->o482405bdf3=o068b8643e0;o38d61a30d5->o13787a0269=o39ede14c63!=0;o38d61a30d5->o5340995ade=o9039841b3c==-1?2:1;od0e0b35573=1;}
  }oefefe2441b();return od0e0b35573;
}
int od6ab268af8(int *o469efb3455){
  int of6149b8dab,o1fe97e47d5;if(!o730300c86b())return 0;
  o1fe97e47d5=o38d61a30d5->of5f79479e5&&o38d61a30d5->o8363338823&&g_get_monotonic_time()-o38d61a30d5->o8363338823<600000;
  o469efb3455[0]=o38d61a30d5->o068b8643e0;o469efb3455[1]=o1fe97e47d5?o38d61a30d5->oa813d4cbb9:0;o469efb3455[2]=o1fe97e47d5&&o38d61a30d5->o53985df7d9;o469efb3455[3]=o1fe97e47d5&&o38d61a30d5->o1850ffc71f;o469efb3455[4]=o38d61a30d5->o9039841b3c;
  o469efb3455[5]=o1fe97e47d5?o38d61a30d5->o38c90dabef:0;o469efb3455[6]=o38d61a30d5->o39ede14c63;o469efb3455[7]=o38d61a30d5->of2f9b10b85;o469efb3455[8]=o38d61a30d5->o01b87111b1;o469efb3455[9]=o38d61a30d5->o764dadbc65;o469efb3455[10]=o38d61a30d5->o5340995ade;o469efb3455[11]=o38d61a30d5->o753c718b0d;
  for(of6149b8dab=0;of6149b8dab<96;of6149b8dab++)o469efb3455[16+of6149b8dab]=of6149b8dab<o469efb3455[5]?o38d61a30d5->od620a9fb17[of6149b8dab]:-1;
  oefefe2441b();return 1;
}
void o397c54e87b(void){if(o730300c86b()){o1a2606c881(4);memset(od4ad25238c,0,sizeof(o31529de80b)*o1b9262720c);oefefe2441b();}}
void oed53c41b7e(void){memset(o38d61a30d5,0,sizeof(o616eeb2ff8));o38d61a30d5->of5f79479e5=1;o38d61a30d5->o9039841b3c=-1;o38d61a30d5->o753c718b0d=100;memset(od4ad25238c,0,sizeof(o31529de80b)*o1b9262720c);}
void odea6c5137d(void){if(o730300c86b()){o38d61a30d5->of5f79479e5=0;o1a2606c881(7);oefefe2441b();}}


