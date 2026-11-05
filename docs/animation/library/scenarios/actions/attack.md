# Kịch bản: Đánh thường (`attack`)

```json scenario
{
  "id": "attack", "kind": "action", "name": "Đánh thường", "element": "NONE", "tier": 2, "durationMs": 780,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit"],
  "assets": [
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Flipbook 6 khung, mỗi khung 256×256, ghép ngang 1536×256, nền trong suốt, pivot giữa khung, vẽ TRẮNG (game tô màu theo hệ của con đánh). Thay fx_pow_star (đang dùng cho 17 skill). K1 chấm sáng tròn nhỏ · K2 sao va chạm 6 cánh không đều bung ra, lõi đặc · K3 sao lớn nhất, cánh dài mảnh, vòng sóng mỏng quanh · K4 cánh tách khỏi lõi thành 6 vệt, lõi rỗng · K5 vệt mảnh văng xa, mờ dần · K6 vài đốm cuối. Nét Sobi: cạnh bo nhẹ, viền tối mảnh để đọc được trên nền sáng." },
    { "id": "fx_pow_star", "state": "have", "layer": "L1" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": ["action_by_body"]
}
```

## 1. Ý tưởng
Cú đánh tay đôi **gọn, có lực, đọc được trong nửa giây**. Mỗi kiểu thân một động tác (thiết kế gốc): bốn chân **húc đầu**, bay **mổ 2 nhát**, bơi **quẫy đuôi tát**, nặng **đấm từ trên xuống**. Đây là animation người chơi xem nhiều nhất → ưu tiên *cảm giác lực* hơn hoành tráng; không được làm chậm trận.
Nguồn: thiết kế gốc; bible [melee-and-hit](../../bibles/actions/melee-and-hit.md).

## 2. Hiện tại
Lùi 22 + bẹp 0,92 → dash + trail → `$boom` (= `fx_pow_star` cho Không hệ / flipbook va chạm của hệ) + `star_pop` + `stop medium` + rung 3 → tilt. **Đạt khuôn nhịp**; điểm yếu: (1) mọi kiểu thân cùng một động tác dash, (2) va chạm `fx_pow_star` 4 khung dùng chung 17 skill, (3) không có dư âm. Hạt trúng đòn đã theo hệ (`$spark`, 2026-11-05).

## 3. Kịch bản theo nhịp
| # | ms | Người đánh | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Lấy đà | 0–200 | lùi 22 px, **bẹp 0,92**, pose `attack` | — | — | — | — |
| 2 Lao | 200–330 | dash, **kéo giãn 1,08** theo hướng, smear 1–2 khung | — | — | — | "whff" |
| 3 Trúng | 330 | động tác theo kiểu thân (bảng dưới) | `fx_hit_burst` tô màu hệ tại điểm chạm | pose `hurt`, bật lùi 12 theo hướng đòn | hit-stop medium 60–80, rung 3 có hướng | "pak!" |
| 4 Dư âm | 330–600 | bật ngược nhẹ khỏi mục tiêu | hạt theo hệ văng thấp; bụi nhỏ ở chân mục tiêu | lò xo về | — | — |
| 5 Về | 400–780 | về theo **đường vồng thấp**, trượt quá rồi lắng | — | — | — | bước chân |

Động tác ở nhịp 3 theo kiểu thân (`bodies` trong `battle_fx.json`):
| Kiểu thân | Động tác | Khác biệt |
|---|---|---|
| quadruped (bốn chân) | húc đầu: cúi thấp lúc lao, ngóc lên khi chạm | `move tilt` −10° → +8° |
| flyer (bay) | mổ **2 nhát** cách 90 ms | 2 `fx_hit_burst` size 0,6; hit-stop light ×2 |
| aquatic (bơi) | xoay ngang quẫy đuôi tát | `move spin` nửa vòng tại chỗ chạm |
| heavy (nặng) | nhảy lên rồi đấm xuống | `move jump` → `slam`, rung dọc 4 |
| floater / sprout | lao lắc lư, chạm nhẹ | như quadruped, biên độ nhỏ |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | — | — | — | — |
| L1 | sao va chạm | `fx_hit_burst` (dự phòng `$boom`) | `strip` size 0,9 tô `$glow`, tại `chest` mục tiêu | 330–530 |
| L2 | smear khi lao | — | `trail dur 140 every 40` | 200–340 |
| L3 | hạt theo hệ; bụi chân | `fxs_star` | `burst $spark`; `burst plain_dust` nhỏ ở chân mục tiêu | 330–600 |
| L4 | hit-stop, rung có hướng; mục tiêu bật | — | `stop medium`; `shake 3 dir [1,0.12]`; phản ứng thân (code `battlePose.ts`) | 330–500 |
Hình chủ đạo ở đánh thường là **chính thân người đánh** (dash có kéo giãn + bẹp = vận tốc) + sao va chạm 6 khung (biến hình): 2/3.

## 5. Asset
| Asset | Lớp | Trạng thái | Ghi chú |
|---|---|---|---|
| `fx_hit_burst` | L1 | **mới** | thay `fx_pow_star` ở đánh thường và các skill dùng nó làm va chạm (17), giảm cờ `SHARED_FLIPBOOK_HERO` |
| `fx_pow_star`, `fxs_star` | | có | |
Dự phòng: giữ `$boom` như hiện tại.

## 6. Các bước dựng
1. B1 nhịp (giữ 780). 2. B2 thân: tách 5 biến thể theo kiểu thân — cần engine chọn script theo `body` (hiện `actions.attack` là một script) → cần `action_by_body` (README kịch bản) ghi vào decision trước khi dựng; trong lúc chờ: chỉ thêm kéo giãn khi lao + đường về vồng. 3. B3 L1: `fx_hit_burst`. 4. B4 L3: bụi chân. 5. B5 L4 (giữ). 6. B6 âm. 7. B7 capture (đánh thường của heo, cá, chim, quái nặng).

## 7. Nghiệm thu
- Capture: khung `release-50` người đánh bẹp + lùi; khung giữa lao thấy kéo giãn / smear; khung `impact+80` mục tiêu lệch khỏi chỗ đứng theo hướng đòn; khung `end` mọi thứ về chỗ.
- Bốn kiểu thân cho ra 4 ảnh impact khác nhau (khi có engine theo kiểu thân).
- Tổng ≤ 800 ms ở x1; ở x2 hit-stop ≥ 40 ms.
