# Kịch bản trạng thái: Đóng băng (`freeze`)

```json scenario
{
  "id": "freeze", "kind": "status", "name": "Đóng băng", "element": "WATER", "tier": 0, "durationMs": 500,
  "status": "draft", "refs": ["REF-ICE-ENCASE-001"], "bibles": ["motifs/ice", "actions/status"],
  "assets": [
    { "id": "fx_ice_grow", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_ice_encase", "state": "have", "layer": "L1" },
    { "id": "fx_ice_shatter", "state": "have", "layer": "L1" },
    { "id": "fxs_snowflake", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Theo [REF-ICE-ENCASE-001](../../refs/REF-ICE-ENCASE-001.json): băng **kết tinh từ chân lên theo nấc**, khóa thân **bất động**; khi còn hiệu lực **lấp lánh chạy dọc mặt băng**, tuyết rơi chậm; hết / bị vỡ: **nứt 1 khung** → **vỡ mảnh sắc**. Rubric MUST-HAVE: "khối băng bao bọc, nhân vật đứng hình, vỡ băng khi hết".

## 2. Hiện tại
apply: `fx_ice_encase` 360 ms + hold; `cover` khung 3 (0,75); `freezeBody`; loop 1600: sao + tuyết; expire: stop 60 + `fx_ice_shatter` + `ice_pop` + rung 3. Đạt 3 pha; thiếu nấc kết tinh và khung nứt.

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| Dính | 0–500 | khựng, tint lạnh | băng **mọc theo 4 nấc** (120 ms/nấc) → khóa: lấp lánh 1 điểm | "krr-krr-KRRK" |
| Duy trì | mỗi 1,6 s | **bất động** (`freezeBody`) | vệt sáng **chạy dọc** mặt băng (chéo); tuyết rơi chậm | không |
| Hết / vỡ | 0–60 nứt, 60–450 vỡ | rùng mình trở lại | **1 khung vết nứt sáng** → hit-stop 60 → vỡ mảnh sắc văng thẳng → mảnh rơi tan | "rắc… CHOANG" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | băng mọc; băng phủ; vỡ | `fx_ice_grow` (apply), `fx_ice_encase` khung 3 (cover), `fx_ice_shatter` | apply: `strip fx_ice_grow` theo nấc; cover giữ; expire `strip fx_ice_shatter` |
| L2 | vệt sáng chạy dọc băng; tint lạnh | — | loop: `glow` lướt (hoặc `burst star_pop` dọc 3 điểm lệch 80 ms); `tint #bfe8ff` |
| L3 | tuyết; mảnh băng | `fxs_snowflake` | loop `burst snow_fall`; expire `burst ice_pop` |
| L4 | khựng; nứt → hit-stop → vỡ | — | expire: khung nứt (decal crack trắng 60 ms) → `stop 60` → `shake 3` |

## 5. Asset
`fx_ice_grow` **mới**; dự phòng `fx_ice_encase` chia nấc `[0,0]`/`[1,1]`/`[2,3]` hold 60.

## 6. Các bước dựng
B1 apply ≤ 500 theo nấc · B2 khựng / rùng mình · B3 băng mọc, phủ, vỡ · B4 tuyết, mảnh · B5 nứt → hit-stop 60 → rung 3 · B6 âm · B7 capture (apply / loop / expire + `reaction_shatter`).

## 7. Nghiệm thu
Capture: 3 khung apply có băng ở **3 độ cao**; expire có một khung **nứt** trước khung vỡ; sinh vật nhận ra dưới băng (alpha ≤ 0,75).
