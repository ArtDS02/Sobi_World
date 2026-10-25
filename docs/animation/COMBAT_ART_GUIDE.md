# Art chiến đấu Adventure — quy ước và cách tự thêm (decision 042)

> Phần "Quy ước" có hiệu lực ngay. Phần "Key pose", "Thêm combat animal" và "Animation skill bằng JSON" là **đề xuất** của decision 042 §3–4, dùng được khi chủ dự án duyệt và hệ mới được làm xong.

## 1. Quy ước (có hiệu lực)
- **Mọi sinh vật vẽ quay sang PHẢI** (nhìn 3/4 sang phải). Phe ta đứng trái giữ nguyên ảnh; quái đứng phải được game tự lật để nhìn sang trái.
- Ảnh cũ chưa đúng quy ước được ghi ngoại lệ trong `src/areas/adventure/ui/motionProfiles.ts → ART_FACING` (`left` = ảnh nhìn trái, `front` = chính diện, không lật). Khi ảnh mới quay phải được đưa vào game, **xóa dòng của nó** trong bảng.
- Khung **512×512**, nền trong suốt, **chân chạm giữa cạnh dưới** (chừa ~4% lề), thân chiếm ~80% chiều cao khung; trùm có thể chạm 95%. Cùng một con thì mọi pose cùng tỉ lệ, cùng vị trí chân.
- Phong cách Sobi Farm (nét nâu mềm, tô màu phẳng có bóng nhẹ, mắt to, má hồng) — xem ảnh mẫu trong `asset/reference/`.

## 2. Key pose (đề xuất)
Mỗi con tối đa 6 ảnh tĩnh; chỉ `idle` là bắt buộc, thiếu pose nào game dùng `idle` + chuyển động bằng code.

| Pose | Tên file | Mô tả |
| --- | --- | --- |
| idle | `cb_<art>_idle.png` | Đứng sẵn sàng, quay phải |
| attack | `cb_<art>_attack.png` | Lao / vung đòn về bên phải, thân nghiêng tới |
| cast | `cb_<art>_cast.png` | Giơ chân / vũ khí, mắt nhắm hoặc sáng, tư thế niệm phép |
| hurt | `cb_<art>_hurt.png` | Ngả ra sau (sang trái), mắt nhắm chặt, nước mắt, miệng méo |
| ko | `cb_<art>_ko.png` | Ngồi bệt / nằm nghiêng, mắt xoắn ốc, không máu me |
| victory | `cb_<art>_victory.png` | Nhảy vui, giơ vũ khí |

`<art>` = id ảnh đang dùng (vd. `pig_knight`, `fish_betta`, `enemy_forest_wolf`).

### Prompt Gemini (một con, 6 pose trên một sheet)
Đính kèm: ảnh hiện tại của con đó + 1–2 ảnh mẫu Sobi Farm.

```
Character sheet for a cute 2D game creature in the attached Sobi Farm style (soft brown outlines, flat colors with gentle shading,
big eyes, pink cheeks). Keep the creature IDENTICAL to the attached reference (same colors, outfit, proportions).
Draw 6 poses in a 3x2 grid, each in its own square cell of equal size, plain white background, no text, no shadows on the ground.
EVERY pose faces RIGHT (3/4 view looking to the right). Feet touch the bottom center of the cell, same size in every cell.
1 idle: standing ready. 2 attack: lunging forward to the right, mid-swing. 3 cast: raising [paw/weapon], eyes glowing, casting.
4 hurt: knocked back to the left, eyes squeezed shut with tears, wobbly mouth (cute, no blood).
5 knocked out: sitting down dizzy with swirly eyes (cute, no blood). 6 victory: happy jump, cheering.
Creature: [tên + mô tả ngắn, vd. "pink pig knight in silver helmet with red plume, small shield"].
```

Lưu sheet vào `art_inbox/adventure-combat-art/<art>.png`, nói với Claude: *"cắt sheet combat art trong art_inbox"* — Claude cắt 6 ô, căn chân, đặt tên `cb_<art>_<pose>.png`, thêm manifest, chạy `npm run assets:check`, xóa dòng `ART_FACING` nếu có.

Thứ tự ưu tiên: idle + hurt của mọi con → attack + cast → ko + victory.

## 3. Thêm combat animal mới (đề xuất)
1. Thêm loài trong Admin (Farm → Giống) như mọi giống heo, bật **Chiến binh** (`fighter`), chọn dòng Guardian.
2. Tạo ảnh `idle` quay phải (mục 2), đưa vào game như trên. Có ảnh là đánh được ngay; các pose khác thêm dần.

## 4. Animation skill bằng JSON (đề xuất)
File `content/adventure/battle_fx.json` (Admin → "Xưởng animation trận" có nút xem thử):

```json
{
  "elements": { "fire": { "circle": "#ff8a3a", "travel": "embers", "impact": "fx_fire_burst", "sound": "adv_hit_fire" } },
  "skills": {
    "poison_thorn": { "pose": "cast", "delivery": "projectile", "vfx": { "travel": "fx_thorn", "impact": "fx_leaf_burst" }, "shake": 4 }
  }
}
```
- Skill không có dòng riêng → dùng công thức của hệ + kiểu ra đòn (`melee`, `slam`, `projectile`, `burst`, `aura`).
- `vfx.*` là id ảnh trong manifest (sprite sheet ngang, khung vuông, game tự đếm khung) hoặc preset hạt: `sparks`, `embers`, `leaves`, `petals`, `drops`, `bubbles`, `rocks`, `stars`, `smoke`, `runes`.
- Đổi nhịp: `"timing": { "release": 260, "impact": 520, "end": 760 }` (ms).
