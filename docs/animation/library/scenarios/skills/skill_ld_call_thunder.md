# Kịch bản: Gọi Sấm (`skill_ld_call_thunder`)

```json scenario
{
  "id": "skill_ld_call_thunder", "kind": "skill", "name": "Gọi Sấm", "element": "LIGHTNING", "tier": 2, "durationMs": 1500,
  "status": "draft", "refs": [], "bibles": ["elements/LIGHTNING"],
  "assets": [
    { "id": "fxp_storm_cloud", "state": "have", "layer": "L1" },
    { "id": "fx_cloud_flash", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_bolt_strike", "state": "have", "layer": "L1" },
    { "id": "fx_crack_spread", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô vàng điện, sóng điện lan trên đất)" },
    { "id": "fxs_drop", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Heo **ngửa cổ gọi**, **mây giông trôi tới** phủ phe địch, **chớp lóe bên trong mây**; sét **đánh từng con** lệch nhịp, cú cuối **to nhất giữa sân** làm sóng điện lan trên đất; mây tan thành mưa. Cảm giác: bão kéo tới. T2 diện rộng, 25 % Choáng.

## 2. Hiện tại
`fxp_storm_cloud hover` 1,5 s (một ảnh mây đứng), `fx_bolt_strike` cùng lúc trên mọi quái, rung 5 dài. Audit: `STATIC_HERO`, `STATIC_SHARE`, `DURATION_OVER`. Mây không chớp, sét không lệch nhịp.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Gọi | 0–420 | pose `cast`, ngửa cổ kêu | mây **trôi vào** từ trên phải, cuộn, **chớp bên trong** 2 lần | ngước | tối dần 30 % | sấm rền xa |
| 2 Đánh | 420–900 | — | sét giáng xuống từng quái, lệch 160 | giật, tô xám | mỗi cú chớp 0,2, hit-stop light 50, rung 3 | "KRAK" ×n |
| 3 Cú cuối | 1000 | — | sét to 1,4× giữa sân, **sóng điện lan** trên đất sang hai bên | giật đồng loạt | hit-stop medium 80, rung 5 | "KRA-KOOM" |
| 4 Tan | 1000–1500 | idle | mây **tan** thành mưa nhỏ; Choáng `st_stun` | — | nền về | mưa |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | tối nền | — | `tint #1a1430 0.3` | 0–1450 |
| L1 | mây; chớp trong mây; sét | `fxp_storm_cloud`, `fx_cloud_flash`, `fx_bolt_strike` | `prop sweep` vào từ phải ease outQuad 0–420, `hover` + `bobY` nhỏ, tan (alpha) 1050–1400; `strip fx_cloud_flash hold` phủ lên mây 200–1050; `strip fx_bolt_strike` per target stagger 160 + cú giữa sân size 1,4 | 0–1400 |
| L2 | — | — | — | — |
| L3 | sóng điện trên đất; mưa | `fx_crack_spread` (vàng), `fxs_drop` | `strip fx_crack_spread under` 1000; `burst drop_fall` 1050 | 1000–1500 |
| L4 | hit-stop, chớp, rung | — | `stop light` ×n, `stop medium` 1000; `flash 0.2` mỗi cú (≤ 3/giây: lệch 160 ms là ~6/giây → chỉ chớp ở cú 1 và cú cuối); `shake 3`, `shake 5` | 420–1150 |
L1 đạt 2/3: biến hình (mây chớp khung, sét) · phụ sinh (mây → mưa).

## 5. Asset
`fx_cloud_flash`, `fx_crack_spread` **mới**; còn lại có. Dự phòng: `glow` nhấp trên mây; `decal ring` vàng.

## 6. Các bước dựng
B1 nhịp `{ release 420, impact 420, end 1500 }`, stagger 160 · B2 ngửa cổ; quái giật · B3 mây trôi → chớp → sét → cú cuối · B4 sóng điện, mưa · B5 hit-stop, **giới hạn chớp** (an toàn quang học) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_OVER`; capture: không quá 3 chớp mạnh / giây (`FLASH_RATE` sạch); khung ~200 mây đang **trôi vào**; sét ở các quái thuộc các khung khác nhau.
