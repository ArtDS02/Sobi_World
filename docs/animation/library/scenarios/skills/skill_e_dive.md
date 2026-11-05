# Kịch bản: Bổ Nhào (`skill_e_dive`) — quái

```json scenario
{
  "id": "skill_e_dive", "kind": "skill", "name": "Bổ Nhào", "element": "LIGHTNING", "tier": 3, "durationMs": 1300,
  "status": "draft", "refs": [], "bibles": ["elements/LIGHTNING", "actions/melee-and-hit"],
  "assets": [
    { "id": "fx_bolt_strike", "state": "have", "layer": "L1" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_spark_arc", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_bolt_mini", "state": "have", "layer": "L3" },
    { "id": "fxs_feather", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Chim **vút ra khỏi khung hình**, **bóng đổ co lại** dưới mục tiêu (báo trước), rồi **bổ nhào thẳng xuống** kéo vệt sét — **KRAK-BOOM**: sét + bụi; chim **nảy lên** bay về. Cảm giác: rình trên cao, bổ dứt khoát. T3 (power 1,6). Ưng Vách Đá, Cừu Sừng Sấm.

## 2. Hiện tại
exit_top + dive + `fx_bolt_strike` + `fx_boom` chung, rung 8. Audit: `DURATION_UNDER`, `SHARED_FLIPBOOK_HERO` (dư âm đã thêm).

## 3. Kịch bản theo nhịp
| # | ms | Chim | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Vút | 0–350 | bay **vút lên** khỏi màn (kéo giãn dọc), lông rơi | — | ngước | — | vù |
| 2 Bóng | 350–600 | (ngoài màn) | **bóng** dưới mục tiêu **co dần** (to → nhỏ = đang lao xuống) | run | — | gió rít xuống |
| 3 Bổ | 600–700 | lao **thẳng xuống**, kéo giãn mạnh, vệt sét | — | — | — | rít |
| 4 Chạm | 700 | bẹp khi chạm | **sét giáng** + bụi vòng + tia nhỏ | dẹp nhẹ, giật | hit-stop medium 90, punch 1,04, chớp 0,2, rung 6 | "KRAK-BOOM" |
| 5 Về | 700–1300 | **nảy lên**, bay về chỗ | hồ quang trên mục tiêu; lông rơi | — | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | sét giáng | `fx_bolt_strike` (0,8) | `strip` 700 | 700–900 |
| L2 | vệt sét khi bổ; bóng báo | — | `trail #ffe14a every 30` 600–700; `marker` size giảm 350–700 | 350–700 |
| L3 | lông; bụi vòng; tia; hồ quang | `fxs_feather`, `fx_dust_ring`, `fxs_bolt_mini`, `fx_spark_arc` | `burst feather_fall` 100, 900; `strip fx_dust_ring under` 700; `burst bolt_pop` 700; `strip fx_spark_arc size 0.5` 800 | 100–1300 |
| L4 | hit-stop, punch, chớp | — | `stop medium`; `punch 1.04`; `flash 0.2`; `shake 6` (từ 8) | 700–950 |
Thân chim (vút / bổ kéo giãn / bẹp / nảy) + sét khung: đạt 3/3 kèm hồ quang.

## 5. Asset
`fx_dust_ring`, `fx_spark_arc` **mới**; dự phòng `fx_boom` tô nâu.

## 6. Các bước dựng
B1 nhịp `{ release 600, impact 700, end 1300 }` · B2 vút, bổ, bẹp, nảy, về; mục tiêu dẹp · B3 sét · B4 bóng, lông, bụi, hồ quang · B5 hit-stop + punch · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết 2 cờ; capture: khung ~400 bóng **to**, ~650 bóng **nhỏ**; khung ~200 chim không còn trong khung sân.
