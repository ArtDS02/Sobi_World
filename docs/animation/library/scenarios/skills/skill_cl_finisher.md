# Kịch bản: Tuyệt Kỹ (`skill_cl_finisher`) — lớp Chiến Binh

```json scenario
{
  "id": "skill_cl_finisher", "kind": "skill", "name": "Tuyệt Kỹ (lớp)", "element": "SELF", "tier": 3, "durationMs": 1700,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit", "actions/cast"],
  "assets": [
    { "id": "fxp_finisher_emblem", "state": "have", "layer": "L2" },
    { "id": "fx_slash_long", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô theo hệ)" },
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô theo hệ, size 1,4)" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Bay lên giữa hào quang theo hệ**, **huy hiệu kết liễu xoay sau lưng**, nền tối; **bổ xuống thành vệt sáng** (5 bóng), chém chéo + nổ; **hạ cánh tạo dáng**. Cảm giác: chiêu kết liễu kiểu anh hùng, gần như mini-ultimate nhưng **không** phải tuyệt kỹ thật (không cut-in, không letterbox). T3 (power 3,0 — mạnh nhất skill lớp), nhưng hit-stop vẫn trong rubric (≤ 100).

## 2. Hiện tại
Huy hiệu xoay + lao + `fx_boom` + `fx_slash_arc` + `fx_pow_star`, hit-stop 160, rung 12. Audit: `STATIC_HERO`, `STATIC_SHARE`; hit-stop / rung quá khoảng.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Bay lên | 0–600 | bay lên 30, xoay chậm | **hào quang** theo hệ cuộn quanh, huy hiệu **xoay** sau lưng to dần | ngước | tối 25 % | tụ lực ngân |
| 2 Lặng | 550–600 | khựng đỉnh | huy hiệu sáng chói | — | gần đứng | — |
| 3 Bổ | 600–800 | lao chéo xuống thành **vệt sáng** (5 bóng), kéo giãn | — | — | — | "HAAAH" |
| 4 Chém + nổ | 800 | — | vệt chém chéo theo hệ + nổ 1,4× + bụi vòng | **văng 70** | hit-stop medium 100, punch 1,05, chớp 0,3, rung 6 | "KABOOM" |
| 5 Tạo dáng | 800–1700 | hạ cánh, pose `victory` 250, về | huy hiệu **tan** thành hạt | ngồi dậy | nền về | ngân kết |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | tối nền | — | `tint 0.25` | 0–1100 |
| L1 | vệt chém; nổ | `fx_slash_long`, `fx_hit_burst` (1,4) | `strip` 800, 820 | 800–1100 |
| L2 | huy hiệu; hào quang; vệt bổ | `fxp_finisher_emblem` | `prop grow` `behind` + `spin 0.4` 0–600 → sáng 550 → tan 900–1200; `glow $color` hào quang; `trail every 30` 600–800 | 0–1200 |
| L3 | hạt hào quang; bụi vòng | `fx_dust_ring` | `burst $spark` cuộn quanh 0–600; `strip fx_dust_ring under` 800 | 0–1000 |
| L4 | hit-stop, punch, chớp, rung | — | `stop medium 100` (từ 160); `punch 1.05`; `flash 0.3`; `shake 6` (từ 12) | 800–1100 |
Thân (bay, khựng, bổ kéo giãn, tạo dáng) + vệt chém / nổ 6 khung: đạt 3/3 kèm hào quang (phụ sinh).

## 5. Asset
`fx_slash_long`, `fx_hit_burst`, `fx_dust_ring` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 bay / khựng / bổ / tạo dáng; mục tiêu văng · B3 vệt, nổ · B4 huy hiệu (L2), hào quang, bụi · B5 **hit-stop 100, rung 6** · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture `HITSTOP_RANGE` sạch; khung ~580 gần như đứng yên ở đỉnh; khung ~1000 heo tạo dáng.
