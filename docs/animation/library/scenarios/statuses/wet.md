# Kịch bản trạng thái: Ướt (`wet`)

```json scenario
{
  "id": "wet", "kind": "status", "name": "Ướt", "element": "WATER", "tier": 0, "durationMs": 500,
  "status": "draft", "refs": [], "bibles": ["elements/WATER", "actions/status"],
  "assets": [
    { "id": "fx_bubble_pop", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (giọt to đập đầu, K3–K6)" },
    { "id": "fx_splash", "state": "have", "layer": "L1" },
    { "id": "fxs_drop", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Một giọt to rơi đập đầu "tõm"**, bắn giọt; con **lắc người như chó vẩy nước**; khi còn hiệu lực thân **xanh nhạt**, **nhỏ giọt** xuống thành vũng; hết: vẩy khô. Mở phản ứng với Sấm / Lửa (xem `reactions/`).

## 2. Hiện tại
apply: giọt + lắc; loop 1200: giọt rơi + vũng; expire: poof + splash + giọt + bọt; tint. Đạt 3 pha (bible WATER: giữ). Thiếu "giọt to đập đầu" ở lúc dính.

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| Dính | 0–500 | **giật** khi giọt đập đầu, rồi **vẩy nước** (wiggle nhanh 4 nhịp) | giọt to **rơi từ trên** → vỡ trên đầu, 5 giọt bắn | "tõm" |
| Duy trì | mỗi 1,2–1,5 s | — | 1 giọt **nhỏ xuống** + vũng nhỏ dưới chân | không |
| Hết | 300–500 | **vẩy khô** (wiggle) | splash + giọt văng ngang, bọt bay lên | "rũ rũ" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | giọt đập đầu; splash khi hết | `fx_bubble_pop` (K3–K6, `head`), `fx_splash` | `prop fall fxs_drop` size 0,3 từ `above` 0–150 → `strip fx_bubble_pop` 150 |
| L2 | tint xanh nhạt | — | status `tint #bfe4ff 0.3` (giữ) |
| L3 | giọt bắn; nhỏ giọt; vũng | `fxs_drop` | `burst drop_spray` 150; loop `burst drop_fall` + `decal puddle` (giữ) |
| L4 | vẩy nước | — | `move wiggle deg 6 n 4` (giữ) |

## 5. Asset
`fx_bubble_pop` **mới**; dự phòng `burst drop_pop spot head` (hiện tại).

## 6. Các bước dựng
B1 thêm giọt rơi đập đầu vào apply · B2 vẩy · B3 vỡ · B4 giữ loop · B5 không rung · B6 âm "tõm" · B7 capture.

## 7. Nghiệm thu
Capture apply: khung ~100 thấy **giọt to trên đầu**; loop vẫn ≥ 6 % thay đổi khung (ANIM-054).
