# Kịch bản trạng thái: Phong ấn (`disable`)

```json scenario
{
  "id": "disable", "kind": "status", "name": "Phong ấn", "element": "NONE", "tier": 0, "durationMs": 450,
  "status": "draft", "refs": [], "bibles": ["actions/status"],
  "assets": [
    { "id": "fx_rune_lock", "state": "have", "layer": "L1" },
    { "id": "fxs_rune_a", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Vòng khóa rune khép** trước ngực "click"; khi còn hiệu lực **rune nhỏ quay quanh vai**, **lóe tím** mỗi 2 s; khi người chơi định chọn skill bị chặn: khóa **rung "cạch"**; hết: khóa **mở bung** "clack". Cảm giác: bị trói phép, gọn gàng.

## 2. Hiện tại
apply: `fx_rune_lock`; loop 2000: rune pop; layers orbit rune; expire: poof + decal + rune lock + rune + rung. Đạt 3 pha; expire có **rung màn** (không cần cho T0).

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| Dính | 0–450 | giật nhẹ, co tay | vòng rune **khép** trước ngực (frames 0→3) | "click" |
| Duy trì | mỗi 2 s | — | rune nhỏ **quay quanh vai**, lóe tím 1 nhịp | không |
| Hết | 300–450 | duỗi tay, nhẹ nhõm | khóa **mở bung** (frames 3→0 ngược + rune văng ra) | "clack" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | vòng khóa | `fx_rune_lock` | apply `frames [0,3]`; expire `frames [3,0]` (ngược) |
| L2 | lóe tím | — | loop `glow #b06aff` 200 ms |
| L3 | rune quanh vai; rune văng | `fxs_rune_a` | layer `orbit` (giữ); expire `burst rune_a_spray` |
| L4 | giật / duỗi | — | `move squash 0.97`; **bỏ rung màn** ở expire |

## 5. Asset
Đủ.

## 6. Các bước dựng
B1 apply ≤ 450 · B2 giật / duỗi · B3 khóa khép / mở ngược · B4 rune · B5 bỏ rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture expire: khóa ở trạng thái **mở dần** (không chỉ poof); không rung màn.
