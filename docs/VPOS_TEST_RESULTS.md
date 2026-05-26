# VPOS Redirect — UniCredit/Nexi certification test results

Test profile SHOPID `80729IG00034801` · gateway `virtualpostest.sia.eu` · login `marija@gmail.com`.
Tested 2026-05-25 via cloudflared tunnel. Fill the bank's scenario sheet ("Redirect" tab,
red columns) from the rows below.

> ⚠️ **ACCOUNTINGMODE note:** code currently sends `ACCOUNTINGMODE=I` (Immediate). All
> mandatory sales are Immediate (✅ covered). The Deferred scenarios (R.2, R.11, R.14 — all
> *Optional*) need a code change to send `D`; not covered.

## Results

| Case | M/O | Type | Expected | Actual | ORDERID | Auth No. | Status |
|------|-----|------|----------|--------|---------|----------|--------|
| R.1  | Mand | Sale 3DS1 | success 00 | paid 00 | ALT-2026-019F771E | 735495 | ✅ |
| R.2  | Opt  | Sale Deferred | success 00 | — | — | — | ⏭️ optional (needs D) |
| R.3  | Mand | Sale 3DS2 | success 00 | paid 00 | ALT-2026-8ED527BB | 107161 | ✅ |
| R.4  | Mand | Sale | decline 05 | failed 05 | ALT-2026-DA7224D6 | — | ✅ |
| R.5  | Mand | Duplicate | decline 07 | declined 07 ("Dupliran broj porudžbine") | reused ALT-2026-019F771E | — | ✅ |
| R.6  | Mand | Sale | decline 02 | failed 02 | ALT-2026-39D4DB50 | — | ✅ |
| R.7  | Mand | Sale | decline 04 | failed 04 | ALT-2026-13458A55 | — | ✅ |
| R.8  | Mand | Sale | decline 03 | failed 03 | ALT-2026-EF793C77 | — | ✅ |
| R.9  | Mand | Sale | decline 06 | failed 06 | ALT-2026-90CD9EC3 | — | ✅ |
| R.10 | Mand | Sale DINA | success 00 | paid 00 | ALT-2026-9D3F8498 | 214399 | ✅ |
| R.11 | Opt  | Sale Deferred DINA | success 00 | — | — | — | ⏭️ optional (needs D) |
| R.12 | Mand | Sale 3DS2 | success 00 | paid 00 | ALT-2026-C4B600DA | 517997 | ✅ |
| R.13 | Mand | Refund (Cubo) on R.12 | refund OK | Reversed OK (full 3600) | ALT-2026-C4B600DA | 517997 | ✅ |
| R.14 | Opt  | Sale Deferred | success 00 | — | — | — | ⏭️ optional (needs D) |
| R.15 | Opt  | Accounting req (Cubo) | OK | — | — | — | ⏭️ optional |
| R.16 | Opt  | Accounting cancel (Cubo) | OK | — | — | — | ⏭️ optional |
| R.23 | Mand | Sale 3DS2 | success 00 | paid 00 | ALT-2026-FF9DEBB1 | 777993 | ✅ |
| R.24 | Mand | Accounting cancel (Cubo) on R.23 | cancelled OK | "reversal completed" → Auth. Approved | ALT-2026-FF9DEBB1 | 777993 | ✅ |

**Mandatory status: 13/13 PASSED.** ✅ All required Redirect scenarios complete.
Optional remaining: R.2, R.11, R.14 (Deferred sales — need code change), R.15, R.16.

Transaction IDs (for Cubo lookup / refund / cancel):
- R.12 `ALT-2026-C4B600DA` → txn `8032180729SL21n17uigemhpa`, auth 517997, 3600 RSD
- R.23 `ALT-2026-FF9DEBB1` → txn `8032180729SL2r195hn6mat5a`, auth 777993, 3600 RSD
