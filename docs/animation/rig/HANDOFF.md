# Bàn giao — Animation sinh vật (decision 050), 2026-11-06

> Viết cho agent tiếp nhận. Đọc hết file này trước, rồi `CLAUDE.md` → `docs/AGENT_RULES.md` → `docs/PROGRESS.md` (mục 2026-11-06 đầu nhật ký) → `docs/decisions/050-puppet-rig-animation.md` (đặc biệt **Bổ sung (5)**). Trả lời chủ dự án **bằng tiếng Việt**, báo cáo theo mẫu AGENT_RULES §7; comment code tiếng Anh.

## 1. Trạng thái một dòng
Chủ dự án **đã duyệt** hướng hiện tại: **pose to pose trên 6 key pose đã duyệt** (`cb_<art>_{idle,attack,cast,hurt,victory,ko}`), lưới skin chỉ thêm lấy đà / nén giãn / chân bám đất / đầu trễ nhịp. 43 sinh vật (21 chiến binh, 22 quái) đã chạy; `npm run check` xanh (1794 test); commit cuối `48ea038` trên nhánh `phase-14-art` (chưa push, chưa PR).

## 2. Lịch sử ngắn (để không lặp lại sai lầm)
| Bước | Kết quả | Chủ dự án |
|---|---|---|
| R1 puppet cắt bộ phận vector (agent vẽ) + clip | chuyển động tốt, nét xấu | "đi đúng hướng chuyển động" |
| Cử chỉ skill (10 gesture `g_*`, `ultimate`, điểm neo `mouth`/`tail`) | giữ nguyên tới giờ | ok |
| Bộ phận rời vẽ bằng Gemini (batch `rig-01-layers`) | ghép xấu hơn ảnh duyệt | **bác** |
| Skin một ảnh idle (lưới bẻ ảnh) | đẹp lúc đứng, chuyển động yếu | tạm chấp nhận |
| Tự động hoá skin cho 40 con + mặt vẽ nét | đòn đánh không giống tranh attack, biểu cảm đè lên tai / mũ | **bác gay gắt ("cẩu thả")** |
| **Pose to pose trên key pose đã duyệt** | mỗi động tác = đúng tranh của nó | **"tốt hơn rất nhiều, đồng ý"** |

**Bài học bắt buộc:** mọi thay đổi chuyển động phải **đặt cạnh tranh mẫu đã duyệt** (key pose) và soi ở **độ phân giải đầy đủ** trước khi báo xong. Không vẽ thêm gì đè lên mặt / bộ phận. Không báo "đạt" khi chưa so khung với tranh.

## 3. Kiến trúc hiện tại (file chính)
- **Schema** `content/schemas/anim/rig.ts`: `skin { part, grid, soft, regions[{bind, poly, soft?}], z, poses{pose→part}, poseFade }`; chain `part` tuỳ chọn; clip có khe mặt đặc biệt `faces.pose` (giá trị: `rest` | `attack` | `cast` | `hurt` | `victory` | `ko`).
- **Runtime thuần** `src/systems/animation/`: `skin.ts` (`buildSkin(rig, maxStrip, pose)`, `deformSkin` — linear blend skinning, vùng bám xương hoặc dải), `performer.ts` (`Frame.pose`, `Frame.chains`), `skeleton.ts` (xuất điểm dải), `rigs.ts` (registry — **mỗi rig mới phải thêm import vào đây**; script trong mục 5 tự sinh lại danh sách).
- **Vẽ** `src/ui/puppet/skinView.ts` (mỗi pose một lưới, mỗi dải hàng lưới là một Phaser Rope — lô rope giữ tối đa **1536 đỉnh**; hoà 70 ms giữa pose), `src/ui/puppet/puppet.ts` (post-FX chỉ gắn khi look cần — **container bị lật + post-FX = bạc màu**, đừng gắn FX thường trực).
- **Dữ liệu** `content/anim/rigs/<art>.json` (44 file: 43 pose rig + `octopus` skin một ảnh). Layer nguồn `asset/rigs/<art>/layers/skin*.png` (1024², ×2 canvas 512, đất y=940). Ảnh game `public/assets/props/rig/<art>/rig_<art>_*.png` + manifest `rig_*`.
- **Trận** `src/areas/adventure/scene/battle/battlePuppets.ts` (puppet theo `rigOf(u.art)`, neo VFX `head` → bone `eyes`/`head`, `anchor(mouth|tail)`), `ui/battlePerf.ts` (beat → action + mốc, cử chỉ skill `gestureOf` / `altOf`).
- **Clip chung** `scripts/rig/poseClips.py` (25 clip: idle + `idle_look`/`idle_hop`, move, attack, cast, hurt, hurt_heavy, ko, victory, guard, stunned, buff, dodge, `g_shoot/breath/charge/lash/roar/slam/summon_ground/summon_sky/channel/brace`, ultimate). Kênh chỉ trên `body` (pivot ở chân, rot + = ngả tới), `head` (trễ), và `faces.pose`. Mốc `windup/release/contact/recover` khớp beat.

## 4. Quy trình (lệnh)
```
npm run rig:pose <art…>        # 6 key pose → layers skin*.png + content/anim/rigs/<art>.json (giữ plan/tempo/weight cũ)
npm run rig:parts <art>        # cắt layer → ảnh game + manifest + box (CHẠY TỪNG CON: chạy nhiều con một lệnh hay chết giữa chừng vì khoá file manifest)
npx tsx scripts/rig/fmt.ts     # định dạng rig JSON
npm run rig:snap <art> <clip> 8 && python scripts/rig/snap.py <art> <clip> 0.5   # dải 8 khung → art_inbox/.qa/rig_<art>_<clip>.png
npm run check                  # trước mọi commit (TẮT server admin trước — nó làm test timeout, ví dụ phase11 "balance guard")
```
- Vùng đầu = đĩa quanh mắt, lấy mắt từ `asset/rigs/<art>/skin_spec.json` (đã sửa tay cho các con dò sai) hoặc `SPEC` trong `scripts/rig/skin.py` (4 prototype).
- So với tranh mẫu: ghép `cb_<art>_<pose>.png` cạnh dải khung (xem mục 8 cách làm nhanh).
- Admin: `npm run admin` → `http://localhost:5175/admin.html#/rig-lab` (Xưởng rig: "So với ảnh cũ", ×0,25, "Dải 8 khung") và `#/battle-lab` (Xưởng trận; `window.labGame`, `window.battleLabState` để debug).

## 5. Việc dang dở / tiếp theo (thứ tự đề xuất)
1. **Chờ chủ dự án chấm chi tiết** bản pose-to-pose (đã đồng ý hướng). Nếu có góp ý từng con → sửa clip trong `poseClips.py` (chung) hoặc tinh chỉnh riêng trong rig JSON của con đó; luôn so với key pose.
2. **Tranh trung gian (đề xuất, chưa làm)**: giữa hai pose hiện chỉ hoà 70 ms. Muốn mượt hơn: batch Gemini cho mỗi con thêm `cb_<art>_windup` (lấy đà trước đòn) và có thể `cb_<art>_recover`. Theo quy tắc batch: `art_inbox/.batch/<batch>/batch.json` → `python .claude/skills/image-to-prompt/scripts/art.py prep <batch>` → PROMPT.md + hint; ảnh đính kèm: ảnh style + `cb_<art>_idle` (nhận diện) + `cb_<art>_attack` (đích). Sau khi chủ dự án render: `art.py cut`, đặt vào `public/assets/props/combat/`, thêm pose `windup` vào `poseRig.py` (POSES) và clip attack (`faces.pose` tại windup). **Hỏi chủ dự án trước khi tạo batch lớn.**
3. **Chớp mắt idle**: hiện không chớp (không có tranh mắt nhắm duyệt). Chỉ làm nếu có tranh nhắm mắt được duyệt; không vẽ nét đè lên mặt.
4. **Bạch Tuộc** (`octopus`, không phải chiến binh, không có key pose): vẫn skin một ảnh (`asset/rigs/octopus/look.png`). Thấp ưu tiên.
5. **Quái biển** (`enemy_drift_jelly`, `brine_wraith`, `coral_eel`, `abyss_kraken`, `reef_crab`, `salt_gull`, `shell_knight` — có trong `battle_fx.json` creatures) chưa có `cb_*` key pose → cần art trước (batch Gemini), rồi `rig:pose`.
6. Roadmap còn lại (`docs/animation/rig/ROADMAP.md`): R2 clip `skill_<id>` riêng + flipbook tuyệt kỹ; R4 lớp tha hoá Umbraflux; R5 Farm (heo đi dạo / ăn / ngủ) + Aquarium; R6 đo FPS (6 puppet + VFX ≥ 55 fps), thử không WebGL.
7. Tài liệu cần cập nhật khi làm tiếp: `docs/animation/rig/{ACCEPTANCE,ROADMAP,PIPELINE}.md` (PIPELINE §2b/§2c còn mô tả skin một ảnh / autoskin — thêm mục pose-to-pose `rig:pose` làm mặc định), `docs/PROGRESS.md`, decision 050.

## 6. Thay đổi KHÔNG phải của agent trước (đừng ghi đè, đừng commit lẫn)
`tools/admin/rigLab.ts` (sửa) và `tools/admin/rigLab.css` (mới) đang **chưa commit** trong cây làm việc: làm lại giao diện Xưởng rig (thanh bên, lọc nhóm Heo / Kẻ địch / Thủy sinh, tên tiếng Việt, nhãn động tác). Không rõ do chủ dự án hay phiên khác làm → **hỏi chủ dự án** trước khi commit; khi commit phần của mình chỉ `git add` đúng đường dẫn của mình.

## 7. Bẫy đã gặp (tiết kiệm thời gian)
- **Vite admin phục vụ module cũ** sau khi sửa JSON / TS (hmr tắt): reload trang không đủ → dừng và khởi động lại server admin.
- **Khoá file trên Windows** (vite / trình duyệt giữ file): ghi `package.json` / manifest đôi khi `EINVAL` → thử lại; **đừng dùng `git stash`** khi server đang chạy (lần trước stash hỏng giữa chừng, phải khôi phục tay).
- `rig:parts` nhiều rig một lệnh có thể dừng giữa chừng → chạy từng con, kiểm `grep -c '"id": "rig_' public/assets/manifest/assets.json`.
- Khung pane trình duyệt chậm (~5 fps) và đôi khi canvas dựng sai kích thước → `window.rigLab.game.scale.resize(w,h)` hoặc tải lại; ưu tiên `rig:snap` + `snap.py` để soi khung.
- Test thời gian dài (`phase11` balance guard 20 s) timeout khi máy bận → tắt server admin rồi chạy lại.
- Heredoc Python trong Bash dễ hỏng với chuỗi dài / dấu `'` → viết script ra file trong scratchpad rồi chạy.
- Guard: file ≤ 300 dòng; `src/core` thuần; `ui` chỉ import core/systems/i18n (kiểu từ content phải re-export qua `systems/animation/index.ts`).

## 8. Kiểm tra nhanh trạng thái khi nhận
```
git log --oneline -6            # 48ea038 pose to pose; 07cd9ba / fc08e67 / d3413da (các bước skin trước)
npm run check                   # kỳ vọng xanh (tắt server admin trước)
npm run rig:snap pig_thienlong attack 8 && python scripts/rig/snap.py pig_thienlong attack 0.5
```
So nhanh với tranh mẫu (Python): mở `art_inbox/.qa/rig_<art>_<clip>.png` (lưới 4×2) cạnh `public/assets/props/combat/cb_<art>_<clip>.png`; khung ở mốc contact của attack phải **là** tranh attack.

## 9. Quy tắc làm việc với chủ dự án (đã thống nhất)
- Chủ dự án giao tự quyết chuyện animation (thư viện, quy trình); vẫn hỏi về gameplay, IP (decision 048: mọi thiết kế gốc, prompt không nhắc IP), việc chỉ chủ dự án làm (render ảnh, chấm cảm giác).
- Asset cần render → tạo hint + PROMPT theo quy tắc `.batch` (art.py prep), không chỉ mô tả bằng lời.
- Commit chỉ khi được bảo hoặc được giao tự quyết; `npm run check` xanh trước commit; cuối commit ghi `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Báo cáo trung thực: cái gì đã kiểm (cách kiểm), cái gì chưa (ví dụ: chưa playtest trận thật).
