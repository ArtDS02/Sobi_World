# Animation Pipeline — từ layer art tới puppet trong game (decision 050)

## 1. Thứ tự bắt buộc
**kịch bản (decision 049) → template body plan → layer art → rig (xương) → clip → xem trong Xưởng rig → tích hợp → nghiệm thu (`ACCEPTANCE.md`)**. Không làm clip trước khi khớp xương đúng; không vẽ art cuối trước khi clip trên bản rig-proof đã duyệt (art vẽ lại tốn hơn sửa clip).

## 2. Thêm một sinh vật mới
1. Chọn body plan (§6) và rig mẫu gần nhất (`pig_boar` quadruped, `pig_turtle` heavy, `fish_betta` aquatic, `octopus` cephalopod).
2. Tạo `asset/rigs/<art>/`:
   - nhanh để thử: `<art>.svg` — một nhóm `part-<NAME>` mỗi bộ phận, canvas 512, đất y = 470 (xem 4 file có sẵn); hoặc
   - art cuối: `layers/<NAME>.png` 1024² (quy chuẩn `art_inbox/rig_README.md`). Layer PNG thắng SVG cùng tên.
3. `npm run rig:parts <art>` → cắt sát, ghi `public/assets/props/rig/<art>/rig_<art>_<NAME>.png`, thêm / sửa dòng manifest (`placeholder` từ SVG, `production` từ layer), ghi `parts.<NAME>.box` vào `content/anim/rigs/<art>.json`.
4. Viết phần còn lại của `content/anim/rigs/<art>.json` (chép rig mẫu): `bones` (`at` = khớp trong canvas, trừ (256, 470)), `chains`, `springs`, `feel`, `clips`. `npm run rig:fmt` để gọn file.
5. Thêm import vào `src/systems/animation/rigs.ts` (`RAW`).
6. `npm run rig:guide <art>` → `art_inbox/rig_<art>_guide.png` (bố cục + khớp cho người vẽ).
7. Admin → **Xưởng rig sinh vật** (`#/rig-lab`): từng clip, ×0,25, "Hiện xương", "Dải 8 khung", "So với ảnh cũ".
8. Trận: art id của chiến binh / quái **trùng** id rig → tự vẽ bằng puppet (`rigOf(art)`); không có rig → ảnh cũ như trước. Thử ở **Xưởng animation trận** (`#/battle-lab`).
9. `npm run check` (test `animationRig.test.ts` kiểm mọi rig: đủ clip, đủ ảnh, mark đúng thứ tự, đủ bộ phận chuyển động, có fidget, có mặt).

## 3. Quy chuẩn asset (tóm tắt — đầy đủ ở `art_inbox/rig_README.md`)
- Canvas 512 (layer PNG 1024 = ×2), quay phải, ba phần tư, đất y = 470 (940 ở 1024), tư thế nghỉ.
- Vẽ đủ phần bị che; mép khớp kéo vào 15–20 px.
- Mặt: mỗi biểu cảm một layer, chồng khít. Bộ tối thiểu: `eyes_open/half/closed/angry/hurt/dizzy/happy`, `mouth_neutral/open/grit/smile/cry`.
- Dải: duỗi ngang, gốc trái; dải hướng sang trái (đuôi cá, thân cá) hiện **lật dọc** — vẽ mép sẽ hiện ở dưới lên trên.
- Tên: `rig_<art>_<NAME>` trong manifest; `<NAME>` chữ thường + gạch dưới.

## 4. Quy chuẩn clip
- Đơn vị ms, `rot` độ (+ = theo chiều kim đồng hồ: đầu cúi, chân đưa ra sau), `x/y` px canvas (y âm = lên), `sx/sy` hệ số.
- Ease theo key **bên trái** của đoạn: `out` (nhanh rồi chậm — bắt đầu chuyển động), `in` (tích lực trước khi bung), `inOut`, `outBack` / `outElastic` (vượt quá rồi về — follow-through, tiếp đất), `hold` (giữ nguyên tới key sau — chụp khung, chống quay ngược 360°).
- Hành động có lực **phải có** `marks`: `windup` (hết chuẩn bị), `release` (bung), `contact` (chạm — trùng số sát thương), `recover`. Trận warp clip vào nhịp theo các mốc này.
- Mỗi clip đánh / cast / hurt đổi mặt (`faces`). Idle có ít nhất một fidget `idle_*`.
- `life`: 1 cho idle / di chuyển, 0,2–0,4 khi đánh / bị đánh (thở / chớp tắt bớt), 0 cho KO.
- `fade`: 30–60 ms vào hurt (đòn phải đọc ngay), 80–140 ms vào attack / cast, 200–300 ms vào idle / victory của loài nặng.
- Dùng lò xo cho phần mềm thay vì keyframe tay (tai, bờm, lá, vây ngực, mai) — keyframe chỉ cho ý đồ diễn (tai cụp khi buồn).

## 4b. Clip cử chỉ skill
- Tên: `g_<gesture>` (10 cử chỉ: `shoot`, `breath`, `summon_ground`, `summon_sky`, `channel`, `brace`, `slam`, `charge`, `lash`, `roar`), `ultimate`, và tuỳ chọn `skill_<skillId>`.
- Bắt buộc `marks.windup < marks.release`; cử chỉ có va chạm (`slam`, `lash`) có `contact`. Mỗi clip đổi mặt và chuyển ≥ 3 bộ phận (test).
- Diễn theo thân loài: tự hỏi "con này làm việc đó bằng bộ phận nào?" (bắn: heo hất mõm, cá phụt miệng, bạch tuộc bóp túi đầu).
- Một rig tối thiểu nên có các cử chỉ mà skill dòng máu của nó cần (test `battlePerf.test.ts` kiểm cho prototype); thiếu thì rơi về cử chỉ gần nhất → `cast`.
- Gán cử chỉ cho skill: `"gesture"` trong `battle_fx.json` khi cử chỉ suy từ kịch bản (`cast_*`) chưa đúng ý.
- VFX muốn phát từ miệng / đuôi: spot `mouth` / `tail` (rig khai `anchors`).

## 5. Tích hợp với code / VFX
- `Want { action, key, timing }` là hợp đồng duy nhất giữa một Area và puppet. Adventure: `ui/battlePerf.ts`. Area khác viết hàm tương tự (đi dạo → `move`, ăn → `idle_eat`…).
- Root motion (dash, knock-back, nhảy cao) vẫn do Area tính; `feel.root` giảm phần xoay / squash cả thân vì rig tự làm.
- VFX: kịch bản `battle_fx.json` không đổi; anchor `head` lấy mắt / đầu thật của puppet; bóng mờ chép từng bộ phận.
- Hit-stop / slow-mo: puppet dùng đồng hồ của sân (`BattlePuppets.tick`).
- Giảm chuyển động: puppet đứng tư thế nghỉ, đồng hồ dừng (không thở, không chớp, không lò xo).

## 6. Nguyên tắc chuyển động theo body plan
| Plan | Trọng tâm & nhịp | Phối hợp bộ phận | Bắt buộc có |
|---|---|---|---|
| **quadruped** (heo, sói, cáo) | trọng tâm giữa thân, nảy 2 lần / chu kỳ đi | chân chéo cùng pha (trước gần + sau xa), đầu nảy ngược pha thân, đuôi trễ | chuẩn bị bằng cách hạ thân / lùi trọng tâm; tai lò xo |
| **heavy** (rùa, golem, gấu) | tempo ≤ 0,9, nảy thấp, settle dài | thân dẫn, đầu / phụ kiện trễ nhiều (lò xo mềm, damp thấp) | anticipation dài, squash lớn khi tiếp đất, ít bị đẩy lùi (`weight`) |
| **small** (chuột, chim sẻ, mầm) | tempo ≥ 1,2, chuyển động ngắn, hold nhiều | ít bộ phận, mặt lớn | không lặp đều: fidget dày |
| **biped** (hiệp sĩ heo đứng) | trọng tâm trên hông, dồn chân | vai – hông đối pha, tay vung | tay cầm vũ khí là bone riêng |
| **aquatic** (cá) | trôi, không chạm đất; tilt theo vận tốc | sóng chạy đầu → đuôi, vây trễ, vây ngực vỗ | thân là dải uốn; KO lật bụng |
| **cephalopod** (bạch tuộc, mực) | túi đầu co bóp = nhịp thở & phản lực | xúc tu lệch pha (tốc độ sóng khác nhau từng cái), cuộn đổi theo hành động | xúc tu là dải; `sy` của dải = cuộn |
| **flyer** (chim, rồng nhỏ) | vỗ cánh = nhịp, nhấp nhô theo cánh | cánh xuống = thân lên; đuôi lái | cánh là bone + lò xo lông |
| **floater** (tinh linh, ma) | lơ lửng chậm, không trọng lực | phần đuôi / áo là dải | biến dạng mềm, không squash cứng |
| **possessed** (lớp phủ Umbraflux, lore) | nhịp bị "ghi đè": khựng, giật, đồng bộ với đồng loại | chậm pha sai chỗ, mắt đổi | 📝 R4 |
