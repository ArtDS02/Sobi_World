# Integration spec — animation trận Adventure (decision 040)

## 1. Luồng dữ liệu

```
battleAct / auto (logic, không đổi)
   └─ run.log = BattleEvent[] của cả bước (lượt ta + mọi lượt địch)
        └─ battleFxView.stepEffects(run, battle, fast)      ← chạy 1 lần khi bước mới hiện (khoá theo seed:counter:log.length)
             ├─ battleMotion.stepMotion()  → beats[], reactions[], eventAt[], total
             └─ battleFloaters.stepFx(..., eventAt) → số bay / banner / rung có mốc `at`
        └─ battleView.renderBattle()
             ├─ unit: .adventure-ui__unit > __body (tư thế + phản ứng) > __idle (vòng nghỉ) > img (lật phe ta)
             ├─ battleMotionView.fieldEffects() → .adventure-vfx (charge / projectile / impact / slash / slam / aura)
             └─ số bay, banner, rung: --fx-delay / --shake-delay
adventureUi: Auto chỉ bước tiếp khi stepRemaining() = 0 (≤ 3,2 s)
```

Mọi mốc thời gian tính từ lúc bước hiện lần đầu; vẽ lại giữa chừng (store đổi, ~1 lần/giây) dùng `animation-delay` âm nên tiếp đúng chỗ. Animation đã xong bị bỏ khỏi danh sách.

## 2. Trạng thái (state machine thu gọn)

| State | Vào khi (sự kiện) | Ra khi | Ghi chú |
| --- | --- | --- | --- |
| idle | luôn (đơn vị chưa gục) | — | vòng lặp theo body plan, lệch pha theo id |
| attack / cast / support / ultimate | `use` (theo category, target, `ultimate`) | hết beat | `deliveryOf()` |
| guard | `guard` | hết beat | |
| stunned | `skip` | hết beat | |
| hit / hit-heavy | `damage` (crit hoặc mult > 1 → heavy) | 360 / 520 ms | tại `impact` của beat |
| heal / buff / debuff / miss | `heal`, `revive`, `tick regen` / `status` cùng phe / khác phe / `miss` | 420–560 ms | |
| ko | `defeat` | giữ trạng thái gục | 120 ms sau impact; trước đó vẫn đứng |

Không có trạng thái "busy" chặn input: trận đã tính xong trước khi animation chạy. Bấm hành động mới giữa chừng → bước mới thay bước cũ (animation cũ bị bỏ, không treo).

## 3. Một nguồn dữ liệu

`src/areas/adventure/ui/motionProfiles.ts`:
- `BODY`, `ENEMY_BODY`, `bodyOf(unitId)` — vòng nghỉ, độ dài cú lao.
- `TIMING`, `QUIET_MS`, `BEAT_GAP_MS`, `STEP_MAX_MS`, `FAST_SHARE` — nhịp.
- `ELEMENT_LOOK`, `NEUTRAL_LOOK` — hình / màu dự phòng của 9 hệ.
- `SKILL_MOTION` — kỹ năng có chuyển động / hình / art riêng (hiện: `skill_mm_poison_thorn`).
- `vfxArt(skillId, element, phase)` — thứ tự tìm ảnh: kỹ năng → hệ → hình CSS.

Thêm quái mới: thêm dòng `ENEMY_BODY` (test `battleMotion.test.ts` bắt thiếu). Thêm kỹ năng: không cần gì (theo category); muốn riêng thì thêm `SKILL_MOTION`.

## 4. Fallback và an toàn

| Tình huống | Kết quả |
| --- | --- |
| Thiếu ảnh VFX | hình CSS theo hệ (`.adventure-vfx:not(.has-art)::before`) |
| Kỹ năng không có trong content | `cast` + `burst` |
| Ảnh lỗi tải | `<img>` vỡ chỉ trong 0,5 s; nhân vật / trận không bị ảnh hưởng |
| Bước rất dài (nhiều quái, nhiều hiệu ứng) | nén về 3,2 s |
| Giảm chuyển động (OS hoặc Cài đặt) | không animation; VFX ẩn; gục hiện ngay |
| Rời trận giữa chừng | DOM bị thay; không hẹn giờ nào còn chạy |

Không có `setTimeout` riêng nào trong animation: tất cả là CSS, nên không thể kẹt hoặc rò bộ nhớ.

## 5. Bước tích hợp tiếp theo (đề xuất, chưa làm)

1. **Ảnh VFX 9 hệ** — chỉ cần thêm manifest (không sửa code).
2. **Sheet nhiều khung cho VFX** — trong `vfx()` của `battleMotionView.ts`: nếu dòng manifest có `frames`, dùng `background-image` + `steps(n)` thay `<img>`; cần thêm tra cứu `frames` từ registry (hiện `art()` chỉ trả URL).
3. **Key pose nhân vật** (`<artId>_attack` …) — đổi `src` của ảnh trong `__idle` trong khoảng [release, end] của beat; thiếu ảnh thì giữ tween hiện tại.
4. **Hiện đòn kết thúc** — giữ màn trận thêm `stepRemaining()` trước khi chuyển (cần đổi luồng UI `adventureUi.render`, không đổi logic).
5. **Âm thanh theo beat** — FeedbackDirector hiện phát theo GameEvent của cả bước; muốn trùng impact cần lịch phát theo `eventAt`.
