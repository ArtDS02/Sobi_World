# Kịch bản: Cắn Trong Bóng Tối (`skill_e_shadow_bite`) — quái sói

```json scenario
{
  "id": "skill_e_shadow_bite", "kind": "skill", "name": "Cắn Trong Bóng Tối", "element": "DARK", "tier": 3, "durationMs": 1300,
  "status": "draft", "refs": [], "bibles": ["elements/DARK", "actions/melee-and-hit"],
  "assets": [
    { "id": "fx_bite", "state": "have", "layer": "L1" },
    { "id": "fx_smoke_curl", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô tím đậm)" },
    { "id": "fx_ink_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Sói **tối dần, chỉ còn đôi mắt**, **chìm vào bóng** (khói tím cuộn), **hiện sau lưng** mục tiêu từ một **khe tối**, **cắn** — mực loang; nhảy về qua khói. Cảm giác: rình rập, bất ngờ, chậm–chậm–NHANH. T3 (power 1,4), 30 % Giảm chính xác. Sói Đêm, Sói Đầu Đàn.

## 2. Hiện tại
`fx_poof` + vanish / appear + `fx_bite`, 1050 ms. Audit: `FEW_LAYERS`, `DURATION_UNDER`; bậc có T2.

## 3. Kịch bản theo nhịp
| # | ms | Sói | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Tối dần | 0–350 | thân **tối dần** còn đôi mắt sáng | khói tím cuộn quanh chân | — | vignette tối | gầm trầm |
| 2 Chìm | 350–450 | **biến** | khói co lại tại chỗ | — | — | "fsh" |
| 3 Khe | 450–600 | — | **khe tối** mở sau lưng mục tiêu (khói cuộn), đôi mắt hiện trước | rùng mình | — | im |
| 4 Cắn | 600 | **hiện** + cắn | hàm cắn tím + **mực loang** | bật tới trước (bị cắn từ sau) | hit-stop medium 90, punch 1,04, rung 4 | "CHOMP" |
| 5 Về | 600–1300 | nhảy về qua khói | khói tan; `st_acc_down` | — | nền về | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | vignette tối | — | `vignette #100818 0.35` | 0–1000 |
| L1 | khói chìm / khe; cắn | `fx_smoke_curl` (tím), `fx_bite` (tím) | `strip fx_smoke_curl` tại actor 0–450, tại `behind` target 450–700; `strip fx_bite` 600 | 0–900 |
| L2 | đôi mắt | — | `glow #d9b8ff` actor khi tối (tint thân tối + mắt sáng) | 0–600 |
| L3 | mực loang | `fx_ink_bloom` | `strip` 620 | 620–900 |
| L4 | hit-stop, punch | — | `stop medium`; `punch 1.04`; `shake 4`; `move knock x -12` (bật tới) | 600–850 |
L1 đạt 3/3: biến hình (khói loop, cắn khung) · phụ sinh (mực) · vận tốc (biến → hiện).

## 5. Asset
`fx_smoke_curl`, `fx_ink_bloom` **mới**; dự phòng `fx_poof`, `fx_ink_splat`.

## 6. Các bước dựng
B1 nhịp `{ release 450, impact 600, end 1300 }` · B2 tối dần, biến, hiện sau, nhảy về; mục tiêu bật tới · B3 khói, khe, cắn · B4 mực · B5 hit-stop medium + punch (lên T3) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `FEW_LAYERS`, `DURATION_UNDER`; capture: khung ~550 sói **sau lưng** mục tiêu.
