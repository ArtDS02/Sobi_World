# Hướng dẫn cho chủ dự án — Animation trận Adventure

Viết cho bạn (chủ dự án) làm theo từng bước. Mỗi bước ghi rõ **bạn làm gì** và **Claude làm gì**. Không bước nào đụng tới save thật của bạn.

---

## Phần 1 — Xem kết quả lần này (10 phút)

### 1.1. Xem ảnh tham chiếu đã chụp

Mở thư mục `art_inbox/sobi_adventure_reference/` (Explorer):

| Thư mục | Có gì |
| --- | --- |
| `00_index/` | `README.md` (cách đọc) + `screenshot_manifest_before.csv` (trước khi sửa) + `screenshot_manifest_after.csv` (sau khi sửa). Mở CSV bằng Excel. |
| `01_lobby/` | Trại: mặc định, tranh Guardians, lọc hệ, tìm không thấy, chọn đội, chọn từng vùng, Vết Nứt |
| `02_adventure_maps/` | Bản đồ Rừng: vừa vào, bản đồ nhỏ (M), các bước đi bộ |
| `03_combat/` | Trận: đầu trận, hover, thẻ kỹ năng, chọn mục tiêu, số bay, vật phẩm, nhật ký, Phòng thủ, hiệu ứng, thắng tầng |
| `05_animal_details_and_skills/` | Hồ sơ chiến binh, 5 tab |
| `06_rewards_and_progression/` | Tổng kết chuyến, tổng kết Vết Nứt |
| `07_other_screens/` | Màn vào Vết Nứt, Kho đồ mở giữa trận |
| `09_motion_slice/` | **Animation mới** chụp đóng băng từng mốc: `poison_thorn_0080ms … 1500ms` (Gai Độc), `basic_attack_*` (đánh thường + lượt địch) |

Mỗi ảnh có hai bản: `_before` (code cũ) và `_after` (code mới). So hai bản cùng số thứ tự trong `03_combat/` để thấy khác biệt. Ảnh 1600×900, không chỉnh sửa.

### 1.2. Chơi thử animation mới

1. Trong Claude Code, mở preview **`sandbox-anim`** (hoặc chạy `npm run dev:sandbox`), mở `http://localhost:5190`. Đây là bản sao save thử nghiệm cấp tối đa, không phải save của bạn.
2. Sảnh → cửa **Sobi Adventure** → thẻ **Vết Nứt Umbraflux** → chọn 3 bạn (có **Cu Ủn**) → **Vào Vết Nứt** → **Lên tầng 1**.
3. Tới lượt Cu Ủn, bấm thẻ **Gai Độc** → chọn kẻ địch. Bạn sẽ thấy: Cu Ủn sáng lên và nhô người (tụ lực) → chiếc gai xanh bay vồng sang → nổ lá khi trúng, kẻ địch bị đẩy lùi, số sát thương hiện **đúng lúc trúng** → kẻ địch có ánh tím (Trúng độc).
4. Bấm **Đánh thường**: chiến binh lùi lấy đà rồi lao tới, vệt chém, kẻ địch loé trắng. Sau đó **từng kẻ địch đánh lần lượt** (trước đây cả bọn hiện số cùng lúc).
5. Để ý: mọi con đều "thở" nhẹ, mỗi loại một kiểu (heo phập phồng, chim nhún, hồn ma lơ lửng, quái to thở chậm).
6. Bật **Tự động** + **x2**: trận vẫn nhanh nhưng mỗi đòn đọc được (Auto chờ đòn chiếu xong, tối đa 3,2 giây).
7. Thử **Menu → Cài đặt → Giảm chuyển động: Bật**: không còn chuyển động nào (đúng thiết kế).

**👉 Bạn cần trả lời:** nhịp có vừa không (nhanh / chậm hơn?), cú lao có quá xa không, hình gai / vụ nổ có ổn để giữ làm dự phòng không. Các con số nằm một chỗ: `src/areas/adventure/ui/motionProfiles.ts` (Claude sửa theo ý bạn).

---

## Phần 2 — Duyệt quyết định (5 phút)

Đọc `docs/decisions/040-battle-motion.md` (1 trang). Những điều Claude đã tự quyết và cần bạn đồng ý:

- Animation trận làm **bằng code (CSS)** trên ảnh tĩnh có sẵn + VFX riêng; không vẽ hàng trăm khung cho mỗi con.
- **Auto chờ** mỗi bước chiếu xong (≤ 3,2 giây) — trận Auto sẽ chậm hơn trước một chút.
- Quy ước hình **Umbraflux = vệt tím chảy xuống**, Essence = hạt ấm bay lên (chỉ là đề xuất hình ảnh, chưa phải lore chính thức).

---

## Phần 3 — Tạo art thật bằng Gemini (theo thứ tự ưu tiên)

Mỗi lần làm một mục. Cách chung (giống các batch trước, decision 022):

1. Mở file prompt trong `docs/animation/prompts/`.
2. Thay các trường `[...]` theo bảng "Ví dụ" trong file (hoặc nhờ Claude điền: *"điền prompt 06 cho sheet 9 hệ"*).
3. Mở Gemini, **đính kèm ảnh tham chiếu** ghi trong file, dán prompt, tạo ảnh.
4. Lưu ảnh về `art_inbox/` (tên gợi nhớ, vd. `art_inbox/vfx_elements_sheet.png`).
5. Nói với Claude: *"cắt và đưa vào game sheet VFX trong art_inbox"*. Claude dùng skill `image-to-prompt` / `image-to-asset` cắt, làm sạch nền, thêm manifest, chạy kiểm tra, chụp lại ảnh `_after`.

| Thứ tự | Việc | Prompt | Kết quả |
| --- | --- | --- | --- |
| 1 | **Sheet VFX 9 hệ** (9 vật bay + 9 vụ nổ) | `06_elemental_vfx.md` (phần "sheet 9 hệ") | Mọi kỹ năng có VFX theo hệ — không cần sửa code |
| 2 | Gai Độc riêng (gai + vỡ gai) | `06_elemental_vfx.md` (phần "Ví dụ Gai Độc") | Hoàn tất vertical slice |
| 3 | Overlay Nhiễm Umbraflux | `07_corruption_umbraflux.md` | Quái Vết Nứt / biến thể có hào quang động (cần Claude nối thêm code sheet) |
| 4 | Key pose tấn công 3 trùm | `01` rồi `03_attack_animation.md` | Trùm có tư thế đánh riêng (cần Claude nối code) |
| 5 | Biểu cảm thắng / thua cho heo hay dùng | `05_hit_victory_defeat.md` | Dùng cho màn thắng / thua sau này |

Kiểm ảnh trước khi đưa Claude: đúng màu / đốm của con vật, nền trắng hoặc trong suốt, không chữ, không bị cắt mép. Tiêu chí chi tiết: `animation_style_guide.md` §6 và phần "Nghiệm thu" cuối mỗi prompt.

---

## Phần 4 — Chụp lại ảnh sau mỗi lần thay art

Claude làm bước này, nhưng bạn tự chạy được:

1. Mở preview **`sandbox-anim`** (dev server cổng 5190 phải đang chạy).
2. Chạy (một lệnh):

```bash
npx tsx scripts/capture/adventureShots.ts --tag vfx1
```

3. Chờ ~4 phút; cửa sổ game tự mở, tự bấm, tự đóng. Ảnh mới có đuôi `_vfx1`, danh sách ở `00_index/screenshot_manifest_vfx1.csv`. Dòng `blocked` ghi lý do màn đó không chụp được.

Tuỳ chọn: `--save <đường dẫn save.json>` (save thử nghiệm khác), `--url <dev server>`, `--out <thư mục>`. Save mặc định: `%TEMP%\sobiworld-anim\fixture\save.json` (bản sao save cấp tối đa). Script **không bao giờ** mở save thật.

---

## Phần 5 — Chụp tay những màn script chưa chụp được

`docs/animation/manual_capture_checklist.md`: 10 trạng thái (trận chạm quái trên bản đồ, trùm, cut-in Tuyệt kỹ, phản ứng, thua trận, cổng / rương, Đi nhanh, Giảm chuyển động…), mỗi dòng ghi cách mở và thư mục lưu. Không bắt buộc — chỉ cần khi bạn muốn bộ tham chiếu đủ 100%.

---

## Phần 6 — Việc còn lại (Claude đề xuất, chờ bạn chọn)

1. Hiện đòn kết thúc trận trước khi về bản đồ (hiện màn chuyển ngay, mất số bay cuối).
2. Sửa: bật "Giảm chuyển động" thì số bay / banner không hiện chữ nào (lỗi có từ trước).
3. Chuyển cảnh vào trận / thắng / thua, giới thiệu trùm.
4. Âm thanh trùng lúc trúng đòn.
5. Dải xanh đậm ở mép trên bản đồ khi đứng sát mép.

Nói *"làm mục 1 và 2"* (hoặc số khác) để Claude làm tiếp.
