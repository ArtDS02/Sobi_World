# 042 — Trận Adventure: sửa giựt lag, hướng quay; đề xuất animation nhẹ, dễ tự cập nhật

**Ngày:** 2026-10-25 · **Trạng thái:** phần 1–2 đã làm; phần 3–4 là **đề xuất, chờ chủ dự án duyệt** (thay đổi lớn, AGENT_RULES §6).
**Bối cảnh:** chủ dự án báo: HUD kỹ năng và dấu tấn công giựt mạnh, phải click nhiều lần; cả màn trận lag; combat animal và quái quay sai phía. Đề xuất của chủ dự án: (1) tạo lại hình mọi sinh vật cho đúng chiều, nhiều trạng thái hơn; (2) sửa HUD / dấu tấn công; (3) animation nhẹ hơn, dễ tự thêm combat animal / skill / sửa animation về sau.

## 1. Nguyên nhân giựt lag, mất click (đã sửa)
- **Gốc:** `ui/dom.ts patch()` so `outerHTML` của DOM đang hiện với DOM mới để quyết định vẽ lại. Vòng canvas của trận (`battleStage.ts`) ghi `style.transform / filter / opacity` lên thân từng con **mỗi khung**, nên hai chuỗi luôn khác → **mỗi tick 1 giây của store, cả màn trận bị dựng lại**: dấu ngắm bị thay giữa lúc bấm chuột (mất click), ảnh và animation CSS chạy lại (chớp chớp), canvas phải đo lại.
- **Sửa:** `patch()` so với markup lúc node được dựng (WeakMap), không so với DOM đã bị animation chạm vào. Áp dụng cho mọi màn (cùng lỗi tiềm ẩn ở nơi khác). Số bay / banner tính độ trễ từ lúc bước trận hiện lần đầu (`shown`), không theo đồng hồ, nên markup không đổi giữa các lần vẽ; con bị hạ trong bước được vẽ "đứng" tới hết bước (stage diễn cú ngã).
- **Nhẹ hơn:** stage chỉ đo vị trí khi sân được vẽ lại / đổi cỡ / mỗi 1 giây (trước: mỗi khung, và còn đọc layout sau khi ghi style = ép layout mỗi khung); chỉ ghi style khi giá trị đổi; canvas tối đa 1,25× DPR (trước 2×); không xóa / vẽ canvas khi không có hiệu ứng; hạt phát sáng / khói / tàn lửa dùng sprite vẽ sẵn theo màu (trước: tạo gradient cho từng hạt mỗi khung); tối đa 420 hạt cùng lúc.
- **Kiểm tra trong sandbox:** 5 giây đứng yên trong trận: 0 lần dựng lại (trước: dựng lại mỗi tick, vì DOM đang hiện mang `style` inline do stage ghi); dấu ngắm còn nguyên sau 1,5 giây; một click ra chiêu; không có long task khi đòn chạy.

## 2. Hướng quay (đã sửa)
- Ảnh heo và cá chiến đấu **đều quay phải**, nhưng CSS lật cả phe ta (`scaleX(-1)`) → phe ta quay trái. Quái thì ảnh lẫn lộn (trái / phải / chính diện) và không lật.
- **Quy ước mới: mọi ảnh sinh vật quay phải.** Phe ta giữ nguyên, quái được lật để nhìn sang trái. Ảnh cũ lệch quy ước ghi trong `ui/motionProfiles.ts → ART_FACING` (ảnh quay trái: không lật; chính diện: không bao giờ lật); xóa dòng khi có ảnh mới. Bỏ lật ở ảnh đội trong dock và thẻ Trại.

## 3. Đề xuất: animation "key pose + tween" vẽ bằng Phaser, khai báo bằng JSON (chờ duyệt)
**Vì sao không làm tiếp kiểu hiện tại:** thân con là ảnh DOM, hiệu ứng là 2 canvas 2D phủ toàn màn hình + CSS filter đổi mỗi khung → nặng; công thức hiệu ứng viết bằng code (`ui/fx/*.ts`), chủ dự án không tự sửa được.
**Vì sao không làm sprite sheet nhiều khung cho mọi con:** 44 sinh vật × 7 trạng thái × 6–8 khung ≈ 2.000 hình; AI tạo ảnh không giữ nhân vật đồng nhất qua nhiều khung.

Đề xuất:
1. **Sân trận vẽ trong Phaser (WebGL)** — Phaser đã chạy sẵn bên dưới để vẽ tranh nền trận. Sinh vật, VFX, hạt, rung, chớp đều là sprite / particle GPU, gom lô; không đo DOM, không CSS filter. DOM chỉ còn HUD: bảng tên, thanh lượt, dock, dấu ngắm (vẽ lại khi có thay đổi thật).
2. **Sinh vật = vài key pose + tween bằng code.** Mỗi con 6 ảnh tĩnh cùng khung, cùng chiều (quay phải): `idle`, `attack`, `cast`, `hurt` (mặt khóc), `ko`, `victory`. Code nội suy giữa các pose (lao tới, ngả lui, nhún, rung) như hiện nay. Thiếu pose nào thì dùng ảnh `idle` + tween → **thêm con mới chỉ cần 1 ảnh là chơi được**, ảnh thêm sau.
3. **Animation skill khai báo bằng JSON** (`content/adventure/battle_fx.json`, có schema + màn Admin "Xưởng animation trận" xem thử từng skill trên sân mẫu):
   - 9 hệ có công thức mặc định (vòng phép, đạn, va chạm, màu, âm thanh); 5 kiểu ra đòn (`melee / slam / projectile / burst / aura`) có nhịp mặc định.
   - Skill chỉ cần ghi phần khác: `{ "skill": "poison_thorn", "pose": "cast", "delivery": "projectile", "vfx": { "travel": "fx_thorn", "impact": "fx_leaf_burst" }, "shake": 4, "sound": "adv_hit_nature" }`. 112 skill hiện có dùng mặc định theo hệ + kiểu, không cần khai báo.
   - VFX là sprite sheet ngang (`fx_<tên>.png`, khung vuông, số khung tự tính từ kích thước), hoặc preset hạt có sẵn (`sparks`, `embers`, `leaves`, `drops`, `rocks`, `stars`, `smoke`).
4. **Thêm combat animal mới tự làm được:** thả ảnh `cb_<art>_<pose>.png` vào `art_inbox/`, chạy `npm run art:process`; bật cờ `fighter` cho loài trong Admin. Chi tiết: `docs/animation/COMBAT_ART_GUIDE.md`.

**Phạm vi khi được duyệt (ước lượng 2–3 phiên):** schema + loader `battle_fx.json`; `BattleScene` Phaser (sân, sinh vật, VFX, hạt) thay `battleStage.ts` + `ui/fx/*`; chuyển công thức 9 hệ hiện tại sang JSON; Admin xem thử; test (nội dung hợp lệ, mọi skill có animation, thiếu ảnh → dự phòng). Giảm chuyển động: không tween, không hạt (như nay). Không đổi save, không đổi logic trận.

## 4. Đề xuất: tạo lại art sinh vật (chờ duyệt)
Batch `adventure-combat-art` (prompt + CSV trong `COMBAT_ART_GUIDE.md`): 22 combat animal + 22 quái, mỗi con 6 key pose, quay phải, khung 512×512, chân ở giữa cạnh dưới. Thứ tự: idle + hurt của mọi con trước (sửa hướng quay + mặt khóc), rồi attack / cast, cuối cùng ko / victory.
