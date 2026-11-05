# Kịch bản: Đoàn Kỵ Thép (`skill_ult_tg`) — tuyệt kỹ

```json scenario
{
  "id": "skill_ult_tg", "kind": "skill", "name": "Đoàn Kỵ Thép", "element": "METAL", "tier": 4, "durationMs": 3300,
  "status": "draft", "refs": [], "bibles": ["actions/ultimate", "elements/METAL"],
  "assets": [
    { "id": "fxp_bronze_knight", "state": "have", "layer": "L1" },
    { "id": "fxp_bronze_shield", "state": "have", "layer": "L1" },
    { "id": "fx_slash_long", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô vàng đồng)" },
    { "id": "fx_shield_form", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô đồng)" },
    { "id": "fx_metal_spark", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_metal_bit", "state": "have", "layer": "L3" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": ["bg_scene"]
}
```

## 1. Ý tưởng
**Ba kỵ binh heo đồng** xếp mũi tên sau phe ta, giơ thương; **lần lượt phi qua** phe địch — mỗi kỵ binh để lại **vệt chém vàng** trên từng quái, giáp quái **vỡ mảnh**; rồi **quay về hóa khiên** che chủ. Cảm giác: xung trận, vó ngựa dồn dập, nhịp 1-2-**3**. Tuyệt kỹ T4: Giảm thủ cả phe địch + khiên 25 % cho người dùng.

## 2. Hiện tại
3 `fxp_bronze_knight sweep` (cùng một ảnh trượt ngang 3 lần), `fx_slash_arc` chung, hit-stop ultimate. Audit: `STATIC_HERO`, `STATIC_SHARE` (L2 đã thêm). Kỵ binh không "phi" (không nhấp nhô vó), không có đội hình.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Intro | 0–500 | `cast_charge` | cut-in bạc thép | — | letterbox; nền **bình minh chiến trường** | kèn xung trận |
| 2 Tập hợp | 500–1200 | giơ móng | 3 kỵ binh **hiện từ bụi** sau phe ta (lệch 150), xếp **mũi tên**, **nhấp nhô** tại chỗ như ngựa giậm | — | rung 2 liên tục | vó giậm |
| 3 Phi 1 | 1200–1500 | — | kỵ binh 1 phi qua, **nhấp nhô vó** + nghiêng tới, bụi sau chân; vệt chém vàng trên từng quái | giáp mẻ, giật | hit-stop light, rung 5 | vó + "CLANG" |
| 4 Phi 2 | 1450–1750 | — | kỵ binh 2 (đường thấp hơn) | giật | hit-stop light, rung 5 | "CLANG" |
| 5 Phi 3 | 1700–2200 | — | kỵ binh 3 (to nhất), chém **mạnh nhất**; giáp quái **vỡ** mảnh | bật lùi | hit-stop ultimate 2200, punch 1,05, chớp 0,3, rung 8 | "CLANG!!" |
| 6 Hóa khiên | 2300–3000 | đứng vững | 3 kỵ binh quay về, **thu nhỏ** thành khiên đồng, **ghép** thành vòm trước người dùng | `st_def_down` | — | "clang" ×3 nhỏ |
| 7 Outro | 3000–3300 | idle | vòm đứng, viền sáng | — | nền về, letterbox rút | kèn kết |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền chiến trường; letterbox | — | `bg_scene` (dự phòng `tint #ffb070 0.2`) | 0–3300 |
| L1 | 3 kỵ binh; vệt chém; khiên | `fxp_bronze_knight` ×3, `fx_slash_long`, `fxp_bronze_shield`, `fx_shield_form` | kỵ binh: `prop pop` từ bụi 500–700 → `hover` + `bobY amp 6 freq 4` (giậm) → `prop sweep` + `bobY amp 10 freq 5` (vó) + `wobble rot 4` + nghiêng tới, stagger 250, đường cao / thấp / giữa, size 0,5 / 0,5 / 0,65 → về + co thành khiên 2300–2700; `strip fx_slash_long` per target theo từng kỵ binh; `strip fx_shield_form` 2700 | 500–3000 |
| L2 | lõi người dùng; vệt bụi sau kỵ binh | — | `glow $color`; `trail` mỗi kỵ binh | 0–2200 |
| L3 | bụi; mảnh giáp; tia kim; bụi vòng | `fxs_puff`, `fxs_metal_bit`, `fx_metal_spark`, `fx_dust_ring` | `burst puff_pop` 500; `prop … trail puff_trail`; `burst metal_spray` per target; `strip fx_metal_spark` per target; `strip fx_dust_ring` 2200 | 500–2500 |
| L4 | hit-stop tăng dần, rung | — | `stop light` 1350, 1600; `stop ultimate` 2200; `shake 5/5/8`; `punch 1.05`; `flash 0.3` chỉ ở 2200 | 1350–2400 |
L1 đạt 2/3 (không có flipbook kỵ binh): phụ sinh (bụi vó) · vận tốc (nhấp nhô vó, nghiêng, co thành khiên); vệt chém 6 khung bù phần biến hình.

## 5. Asset
`fx_slash_long`, `fx_shield_form`, `fx_metal_spark`, `fx_dust_ring` **mới**; còn lại có. Nếu sau này có ảnh kỵ binh 2 pose (chân co / duỗi) thì luân phiên khi phi.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 giơ móng; quái giật / bật · B3 kỵ binh tập hợp → phi ×3 (ba đường khác nhau) → hóa khiên · B4 bụi, mảnh, tia · B5 hit-stop tăng dần; bớt chớp (chỉ nhịp 3) · B6 âm vó dồn · B7 capture (ultimates).

## 7. Nghiệm thu
Audit hết `STATIC_HERO` khi tính vệt chém là hình chủ đạo của nhịp đánh (hoặc ghi lý do); capture: ba kỵ binh ở **ba độ cao khác nhau**; khung ~2600 khiên đang ghép.
