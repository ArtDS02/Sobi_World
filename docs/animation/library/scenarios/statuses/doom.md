# Kịch bản trạng thái: Diệt vong (`doom`)

```json scenario
{
  "id": "doom", "kind": "status", "name": "Diệt vong", "element": "NONE", "tier": 0, "durationMs": 700,
  "status": "draft", "refs": [], "bibles": ["actions/status", "elements/DARK"],
  "assets": [
    { "id": "fxp_doom_clock", "state": "have", "layer": "L1" },
    { "id": "fx_smoke_curl", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tím đen, nhỏ)" },
    { "id": "fx_star_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (khi được cứu: vàng)" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Đếm ngược 3 → 0. Lúc dính (cùng `skill_e_doom_mark`): đồng hồ rune hiện trên đầu, **kim quay một vòng**, "DONG". Khi còn hiệu lực: đồng hồ **nhỏ lơ lửng** trên đầu, **số chấm sáng** = lượt còn, mỗi đầu lượt **tắt một chấm "tick"**, nhịp **lắc nhanh dần** khi gần 0. Về 0: đồng hồ **vỡ**, con **gục mệt** (KO, không gợi chết). Được cứu: đồng hồ **vỡ thành sao vàng**.

## 2. Hiện tại
apply: `fxp_doom_clock` + tint + âm; layers orbit đồng hồ; expire: stop + khói + rung. Không có nhịp đếm, không phân biệt "về 0" và "được cứu".

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| Dính | 0–700 | giật mình | đồng hồ hiện, quay 1 vòng, co về nhỏ trên đầu; nền tối 15 % 400 ms | "DONG" |
| Duy trì | liên tục | — | đồng hồ nhỏ **nhấp nhô**, khói tím quanh; 3 / 2 / 1 chấm sáng; lắc **nhanh dần** (1,6 s → 0,8 s) | tích tắc nhỏ (tùy) |
| Đầu lượt | 300 | — | **một chấm tắt** + đồng hồ giật | "tick" |
| Về 0 | 600 | gục (`actions.ko`) | đồng hồ **vỡ tím** + khói | "DONG" trầm |
| Được cứu | 400 | thở phào | đồng hồ **vỡ thành sao vàng** | chuông sáng |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | đồng hồ | `fxp_doom_clock` | apply: `prop pop` + `spin 1` → co; layer `orbit` → đổi thành `hover` trên đầu + `wobble` tần số tăng theo lượt (cần engine đọc số lượt còn — ghi engine nếu thiếu) |
| L2 | chấm đếm | — | icon `st_doom` (số chấm) — đã có ở HUD |
| L3 | khói; vỡ; sao vàng | `fx_smoke_curl`, `fx_star_bloom`, `fxs_star` | khói loop nhỏ; về 0: `burst dark_smoke`; cứu: `strip fx_star_bloom` + `burst star_fall` |
| L4 | giật | — | `move hop` nhỏ; về 0: `stop 60` (giữ) |

## 5. Asset
`fx_smoke_curl`, `fx_star_bloom` **mới**; còn lại có.

## 6. Các bước dựng
B1 apply ≤ 700 · B2 giật / thở phào · B3 đồng hồ hover + wobble nhanh dần · B4 khói, vỡ, sao · B5 không rung (trừ về 0) · B6 âm tick · B7 capture (apply / loop / expire hai nhánh).

## 7. Nghiệm thu
Hai nhánh hết (về 0 / được cứu) cho **ảnh khác nhau** (tím vs vàng); KO sau về 0 theo `idle-and-states` (không gợi chết).
