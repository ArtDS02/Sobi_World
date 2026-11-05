# ANIMATION REVIEW — Vòng 03

> round: 3 · Lab run `20261104-173002-755dce5-11ae3155` (202 case) + game thật run `20261104-183300-755dce5-b77c84b9` (`capture/game/…`, 44 ảnh + số đo `battle_ui.json`) · 2026-11-04 · TD
> Cổng đầu vào: Lab `complete:true`, determinism ✓, canary ✓, `anim:verify -- --manifest latest` xanh. Game: `complete:true`, server riêng.
> Tiêu chuẩn: rubric v1.1 · quyết định D-1, D-2 giữ nguyên.

## 0. Phạm vi đã xem
Lab: sheet tổng ultimate, status (trang 1–3), skill (trang 1, 3, 4, 5), variant; case `ult_qt`, `status.atkDown.apply`, frame giữa cut-in `ult_qt`. Game thật: 12 ảnh màn trận + số đo targeting/HUD, ảnh map `walk_east`. **Lần đầu có bằng chứng cho Targeting và Chuyển lượt + HUD**; Map mới có ảnh tĩnh.

## 1. Bảng trạng thái lỗi
| ID | severity | status | since | tóm tắt |
|---|---|---|---|---|
| ANIM-129 | major | open | 3 | Ultimate: tác động (C5) và dư âm (C2) còn mỏng: chỉ hit-stop + rung nhẹ; chưa có zoom nhấn, chớp, dư âm lúc `impact` (§3) |
| ANIM-128 | minor | open | 3 | Vòng ngắm: `:hover { scale: 1.12 }` **không có tác dụng** (đo `scale` = 1 khi hover): animation vào `both` giữ `scale:1` ở khung cuối và đè lên hover; chỉ còn đổi màu viền |
| ANIM-123 | minor | open | 2 | Họ skill hồi máu cùng bộ hạt (`mend`/`healing_rain`/`purify`/`channel`/`undying` giống nhau ở sheet tổng skill trang 1, 3) |
| ANIM-054 | minor | open | 0 | `wet.loop`: chỉ có huy hiệu giọt nước, sói không đổi nhìn thấy |
| ANIM-117 | minor | open | 1 | Vòng phép phân biệt hệ chủ yếu bằng màu |
| ANIM-113 | minor | taste | 1 | Lấy đà 250–420 ms nhiều skill (khoảng tham khảo 150–300) |
| ANIM-130 | — | needs_evidence | 3 | Chưa chụp: vòng ngắm nhiều mục tiêu, lượt của quái, KO/ultimate/chiến thắng trong trận thật, biểu tượng status ở HUD, map theo chuỗi frame |
| ANIM-112 | — | **fixed** | 1 | Cut-in có tên chiêu ("Tiếng Hát Đại Dương", "Đoàn Kỵ Thép", "Rừng Mẹ Ôm Áp"…), 4 kiểu, nhịp riêng |
| ANIM-114 | — | **fixed** | 1 | Không status nào có chữ ký apply trùng (test; manifest `DUPLICATE_SCRIPT` = 0); Down có hình to hơn |
| ANIM-120 | — | **fixed** | 2 | 25/25 expire đổi ≥ 8% khung (stun 20.6%, wet 19.9%) |
| ANIM-110, 111 | — | fixed | 1 | hit-stop 12/12; `reduce` có vòng tĩnh; KO/crit/win thấy rõ ở biến thể trên skill sát thương |
| ANIM-002 | — | **fixed** (một phần) | 0 | Targeting thật: vòng ngắm 6rem, bấm 5/5 điểm đều trúng, không bị che; nhãn hiệu quả ("Kém"); xem ANIM-128, 130 |
| ANIM-010, 011 | — | **fixed** | 0 | Dock trượt ra khi đến lượt và thu vào khi hiệu ứng chạy (đo: hiện, ẩn ~2 s, hiện lại đúng cuối bước); plate gọn khi hiệu ứng; vòng vàng dưới đơn vị đến lượt, thanh lượt đổi |
| ANIM-090…094 | — | needs_evidence | 0 | Map: ảnh tĩnh cho thấy hướng nhìn, đồng đội đi sau có bóng; chưa có chuỗi frame để chấm nhún bước/easing |
| ANIM-032, 057, 080–082, 100–107 | — | needs_evidence / open | 0 | xem ANIM-130 |

## 2. Điểm theo rubric (mẫu đã xem, neo giữ nguyên)
| Nhóm | C1 | C2 | C3 | C4 | C5 | C6 | C7 | Tổng | Mục tiêu | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|
| Ultimate (12; 5 sheet + sheet tổng) | 4 | 3 | 4 | 4 | 3 | 4 | 4 | **72** | ≥ 90 | tên chiêu + 4 kiểu + nhịp riêng; khoảng cách ở C5/C2 (ANIM-129) |
| Skill thường (100; sheet tổng 5 trang) | 4 | 3 | 4 | 4 | 3 | 4 | 4 | **~74** | ≥ 85 | đa dạng hình theo hệ; họ hồi máu giống nhau; nhịp 250–420 ms |
| Status điều kiện (poison, burn, freeze, disable, doom) | 4 | 3 | 4 | 4 | 3 | 4 | 4 | **77** | ≥ 85 | 3 pha rõ |
| Status buff/debuff | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **~70** | ≥ 85 | expire và hình riêng đã sửa; loop vẫn tinh tế |
| Targeting (game thật) | 4 | 3 | 3 | 3 | N/A | 4 | 4 | **77** | ≥ 80 | thiếu bằng chứng nhiều mục tiêu; hover scale hỏng |
| Chuyển lượt + HUD (game thật) | 4 | 3 | 3 | 3 | 3 | 4 | 4 | **73** | ≥ 80 | dock/plate/vòng lượt đúng; chưa thấy lượt quái |
| `reduce` | 3 | 3 | — | 3 | 3 | 3 | 4 | — | — | đạt §10.4 |

Quy tắc chặn §6: Targeting và Chuyển lượt + HUD đều C1, C7 ≥ 4 ✓. Không tiêu chí nào ≤ 2 ở mẫu đã xem. **Mọi nhóm vẫn dưới mục tiêu; khoảng cách còn lại chủ yếu ở C2 và C5, mà theo rubric §7 chỉ chốt được bằng [Playtest] của chủ dự án.**

## 3. Việc cần sửa (Developer)

### ANIM-129 — Chữ ký tác động của ultimate (MAJOR)
- **Rubric**: Ultimate · C5 (25%) và C2; nâng C5 từ 3 lên 4.
- **Bằng chứng**: sheet `ult_nh`, `ult_tg`, `ult_qt`: tại `impact` chỉ có hit-stop 220 ms (đứng hình) và rung 4–6; không có zoom nhấn hay chớp, hiệu ứng sau đòn tan ngay.
- **Kỳ vọng**: mỗi ultimate có thêm, quanh điểm hit-stop: (1) `punch` zoom 1.05–1.08 (180–260 ms); (2) `flash` màu `$glow` alpha ≤ 0.4 trong ≤ 140 ms (không quá 3 chớp/giây, rubric §10.4); (3) `shake` ≥ 6 nếu chưa có; (4) dư âm: ring `decal` hoặc nổ thứ hai ~350 ms sau hit-stop.
- **Tiêu chí đạt**: manifest mỗi ultimate: `cues` có `act:punch` và `act:flash`, `shake.amp ≥ 6`, `flashesPerSec ≤ 3`; TD thấy rõ ở khung `impact+80`.
- **Ràng buộc**: `reduce` không phát; giữ tổng step ≤ 5600 ms; không đổi nhịp các act khác.

### ANIM-128 — Hover của vòng ngắm (MINOR)
- **Bằng chứng**: `battle_ui.json → hover`: `scale` = "1" khi `hovered:true`; viền đổi màu ✓.
- **Nguyên nhân (code)**: `src/styles/features/_adventure.scss` `.adv-reticle { animation: adventure-reticle-in 0.22s ease-out both; }` — `both` giữ `scale: 1` của keyframe `to`, đè lên `&:hover { scale: 1.12 }`.
- **Đạt**: đo `scale` ≠ 1 khi hover; vẫn có hiệu ứng vào.

### ANIM-123, ANIM-054 (MINOR)
- Họ hồi máu: tách ít nhất 3 phong cách (mend = lá + dấu cộng; healing_rain = mưa giọt xanh; purify = vòng trắng quét + hạt bẩn bay đi; channel/undying: tia sáng nối + hạt). Đạt khi TD phân biệt được 4/5 skill khi bỏ màu.
- `wet.loop`: tint xanh nhẹ + giọt nhỏ theo chu kỳ ≥ 1 lần/1,5 s (`maxChangeVsStart` của loop ≥ 6%).

## 4. needs_evidence / yêu cầu Tester
Mở rộng `battleUi.ts`: (a) vòng ngắm nhiều mục tiêu (skill `allEnemies`: đo `.adv-reticle--side` và bấm 5 điểm); (b) lượt của quái (`turn_start_enemy`); (c) KO và chiến thắng trong trận thật; (d) ultimate trong trận thật (cần Nộ đầy); (e) chuỗi frame di chuyển map (giữ phím, 12 khung/1,5 s) để chấm nhún bước và easing.

## 5. Danh sách cần chủ dự án playtest (rubric §7)
| Đơn vị | Tiêu chí | Câu hỏi |
|---|---|---|
| ultimate | C2, C5 | Sau ANIM-129, cú trúng có "nặng" và dư âm đủ chưa? Wind-up 0,3–0,7 s theo từng chiêu có hợp? |
| skill thường | C2, C5 | Lấy đà 250–420 ms và cả skill 1,5–2,2 s có làm trận chậm khi đánh nhiều lượt? |
| map | C2 | Đi bộ có mượt, nhún bước hợp tốc độ, dừng/đổi hướng không giật? |
| targeting | C1 | Vòng ngắm 6rem trên thân quái có che quá nhiều? Hover có đủ rõ? |

## 6. Phán quyết
**`needs_fix`**: 1 major (ANIM-129), 4 minor. Sau khi Dev xong và Tester chụp lại: nếu hết major thì chuyển **`awaiting_playtest`** (đạt mọi mục khách quan; còn C2/C5 cần chủ dự án xác nhận). Không thể tự chốt `done` theo rubric §7.
