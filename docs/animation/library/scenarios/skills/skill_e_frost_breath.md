# Kịch bản: Hơi Thở Băng (`skill_e_frost_breath`) — quái Dê Tuyết

```json scenario
{
  "id": "skill_e_frost_breath", "kind": "skill", "name": "Hơi Thở Băng", "element": "WATER", "tier": 2, "durationMs": 1250,
  "status": "draft", "refs": ["REF-ICE-ENCASE-001"], "bibles": ["motifs/ice", "elements/WATER"],
  "assets": [
    { "id": "fx_ice_grow", "state": "new", "layer": "L1", "spec": "Xem skill_cl_freeze (dùng chung). Ở skill này chỉ phát K1–K3 (sương đóng thành gai băng ở chân mục tiêu), size 0,9." },
    { "id": "fxs_snowflake", "state": "have", "layer": "L3" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" },
    { "id": "fx_ice_encase", "state": "have", "layer": "L1" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Dê tuyết **hít sâu** (ngực phồng, má tô xanh), **thở ra luồng sương băng hình nón** trải rộng dần quét qua mục tiêu; sương **bám lại thành gai băng ở chân**, mục tiêu **run cầm cập**. Cảm giác: lạnh buốt, kéo dài, khác đòn đánh nhanh. T2, 25 % Đóng băng.
Nguồn: thiết kế gốc; motif [ice](../../bibles/motifs/ice.md) §2 (hơi thở băng).

## 2. Hiện tại
`cone` 500 ms + hạt tuyết / khói + `fx_ice_encase`; đã thêm hit-stop medium + rung 3 + tuyết rơi (2026-11-05). Hình chủ đạo cone vẽ bằng code (sống), nhưng không có giai đoạn **hít vào** rõ, sương không bám lại.

## 3. Kịch bản theo nhịp
| # | ms | Dê | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Hít | 0–350 | ngả đầu ra sau, ngực phồng (`puff_up 1.08`), má xanh | hơi lạnh bị **hút vào** miệng | — | tint lạnh 8 % | "hhhhh" hít |
| 2 Thở | 350–850 | rướn cổ tới trước, giữ, thân rung nhẹ | nón sương **mở rộng dần** (rộng 0 → đủ trong 200 ms), 30 bông tuyết + 8 khói trắng xanh chảy theo nón | rùng mình, lùi 6 px | — | "HAAAA" |
| 3 Bám | 850 | khép miệng | sương đóng thành **gai băng ở chân** (`fx_ice_grow` K1→K3) | run cầm cập (rung ngang nhanh) | hit-stop medium 80, rung 3 | "krr" |
| 4 Dư âm | 850–1250 | idle | hơi lạnh tan lên, tuyết rơi; nếu Đóng băng: status `freeze` phát `apply` | răng lập cập | tint về | lập cập |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | tint lạnh | — | `tint #bfe8ff 0.08` | 0–1200 |
| L1 | nón sương; gai băng ở chân | `fx_ice_grow` K1–K3 | `cone` 350–850, độ rộng tăng dần (`width` qua 2 act nối hoặc [ENGINE] cone mở dần — dùng 2 cone: hẹp 350–550, rộng 500–850); `strip fx_ice_grow frames [0,2]` 850 | 350–1050 |
| L2 | má / ngực sáng xanh khi hít | — | `glow #bfe8ff tint` 0–350 | 0–350 |
| L3 | hơi hút vào; tuyết + khói theo nón; tuyết rơi | `fxs_snowflake`, `fxs_puff` | `burst snow_rise` hút vào 0; `burst snow_spray` + `puff_spray` 360–800; `burst snow_fall` 1050 | 0–1250 |
| L4 | hit-stop, rung; run cầm cập | — | `stop medium` 850; `shake 3`; `move shake x 3 n 8` mục tiêu 850–1250 | 850–1250 |
L1 đạt 2/3: biến hình (nón vẽ bằng code mở dần + gai băng khung) · phụ sinh (tuyết / khói từ nón).

## 5. Asset
| Asset | Lớp | Trạng thái |
|---|---|---|
| `fx_ice_grow` | L1 | **mới** (chung với `skill_cl_freeze`) |
| `fx_ice_encase`, `fxs_snowflake`, `fxs_puff` | | có |
Dự phòng: chưa có `fx_ice_grow` → `fx_ice_encase frames [0,1]` size 0,9 `under`.

## 6. Các bước dựng
1. B1 nhịp (giữ `{ release 350, impact 850, end 1250 }`). 2. B2 thân: hít (ngả đầu, phồng), thở (rướn), mục tiêu lùi + run. 3. B3 L1: hai cone hẹp → rộng; gai băng. 4. B4 L3: hút vào → chảy theo nón → rơi. 5. B5 L4 (đã có). 6. B6 âm hít / thở. 7. B7 capture.

## 7. Nghiệm thu
- `anim:audit`: không `NO_AFTERMATH`, `IMPACT_UNDER_TIER`.
- Capture: khung ~200 thấy dê **ngả ra sau, phồng** (khác khung 0); khung ~420 nón hẹp, ~700 nón rộng; khung `impact+80` thấy gai băng ở chân mục tiêu.
