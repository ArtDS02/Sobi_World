# Kịch bản: Bầu Trời Trong Chuông (`skill_ult_hk`) — tuyệt kỹ

```json scenario
{
  "id": "skill_ult_hk", "kind": "skill", "name": "Bầu Trời Trong Chuông", "element": "VOID", "tier": 4, "durationMs": 3200,
  "status": "draft", "refs": [], "bibles": ["actions/ultimate", "elements/VOID"],
  "assets": [
    { "id": "fxp_sky_bell", "state": "have", "layer": "L1" },
    { "id": "fx_void_implode", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_ice_shard", "state": "have", "layer": "L3" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace", "bg_scene"]
}
```

## 1. Ý tưởng
**Chuông trời pha lê** hạ xuống **úp lên phe địch** như lồng kính; chuông **rung ba lần** (DONNNG ×3), mỗi lần **vòng sóng không gian** lan và vài phép tốt của quái **vỡ vụn**; lần ba **chuông vỡ tung** thành mảnh pha lê tím. Cảm giác: vang, kỳ ảo, nhịp chuông chậm dần nặng dần. Tuyệt kỹ T4: Xóa phép tốt của địch.

## 2. Hiện tại
`fxp_sky_bell fall` 1,9 s (ảnh đứng yên), 3 decal + rung 5/7/10 + split + chớp. Audit: `STATIC_HERO`, `STATIC_SHARE`. Chuông không rung, không vỡ — "rung" chỉ là rung màn.

## 3. Kịch bản theo nhịp
| # | ms | Sứa | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Intro | 0–500 | `cast_hover` | cut-in tím lam | — | letterbox; nền **trời sao đảo màu** | ngân dài |
| 2 Hạ | 500–1200 | nâng xúc tu | chuông **hạ chậm** (lắc như con lắc), **úp** xuống phe địch, nảy nhẹ | ngước, co | rung 3 khi úp | "thoom" |
| 3 Rung 1 | 1200 | — | chuông **rung** (lắc ±4°, mép gợn), vòng sóng không gian | 1 phép tốt vỡ thành sao | rung 4 | "DONNNG" |
| 4 Rung 2 | 1600 | — | lắc mạnh hơn ±7°, vết nứt sáng trên chuông | vỡ thêm | rung 6 | "DONNNG" |
| 5 Lặng | 1900–2000 | — | chuông đứng **yên tuyệt đối**, nứt sáng lan | — | im | — |
| 6 Vỡ | 2000 | — | chuông **vỡ tung**: sụp vào rồi bung (implode) + 40 mảnh pha lê tím | bật lùi | hit-stop ultimate, punch 1,05, chớp tím 0,4, tách màu, rung 9 | kính vỡ |
| 7 Outro | 2400–3200 | idle | sao tím rơi lả tả, nền trở lại | — | letterbox rút | lấp lánh |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền đảo màu; letterbox | — | `bg_scene` (dự phòng `tint #2e2470 0.35` + `split` đầu) | 0–3200 |
| L1 | chuông | `fxp_sky_bell` | `prop fall` ease outQuad + `wobble rot 6 freq 0.8` (con lắc) + `squashOnHit` 500–1200; rung: `wobble` biên độ tăng + `prop_displace` mép ở 1200, 1600; đứng 1900–2000; biến mất 2000 (thay bằng mảnh) | 500–2000 |
| L2 | lõi người dùng; vết nứt sáng | — | `glow $color`; `glow #e4dcff` trên chuông tăng 1600–2000 | 0–2000 |
| L3 | vòng sóng; sao vỡ từ phép tốt; sụp / bung; mảnh pha lê | `fx_void_implode`, `fxs_star`, `fxs_ice_shard` (tím) | `decal ring` foeside 1200, 1600; `burst star_pop` per target; `strip fx_void_implode size 2` 2000; `burst void_sparks more 4` 2000; `burst star_fall` 2400 | 1200–3200 |
| L4 | rung tăng; lặng; vỡ | — | `shake 3/4/6/9`; `stop ultimate` 2000; `punch 1.05`; `flash #8c7cff 0.4` chỉ ở 2000; `split` | 1200–2300 |
L1 đạt 3/3: biến hình (mép gợn, nứt, vỡ) · phụ sinh (vòng sóng, mảnh) · vận tốc (con lắc, nảy).

## 5. Asset
`fx_void_implode` **mới**; còn lại có. (Lý tưởng: flipbook chuông vỡ riêng — để sau nếu cần.)

## 6. Các bước dựng
B1 nhịp (giữ) · B2 nâng xúc tu; quái co / bật · B3 chuông hạ → rung ×2 → lặng → vỡ · B4 vòng, sao, mảnh · B5 bớt chớp (chỉ ở 2000) · B6 âm chuông · B7 capture (ultimates).

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: chuông ở **góc lắc khác nhau** giữa khung 1150 và 1650; khung 1950 đứng yên; khung 2080 không còn chuông nguyên, chỉ mảnh.
