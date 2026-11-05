# Ghi chú của Tester — run vòng 2

> runId `20261104-161729-755dce5-36236937` · stamp `755dce5`/`36236937` · 200 case ok, 0 lỗi, 0 absent · canary ✓ determinism ✓ · `anim:verify -- --manifest latest` xanh · scope: `full` (suite all, grid 200)
> Đây là phần TD cần đọc **trước khi** dùng `COMPARE` hoặc cờ `DUPLICATE_SCRIPT`.

## 1. Cái đã sửa ở harness (theo FEEDBACK vòng 1 §5)
1. Status: đòn thường mang status đứng một mình; mỗi status có `apply`, `loop`, `expire` (25 × 3 = 75 case); không còn `absent`.
2. `t=0` sạch: sau khởi động có bước rỗng + đợi 1,5 s. Bằng chứng: sheet so sánh `skill_tg_steel_charge` ô `start`: run cũ còn sao stun trên sói, run mới sạch.
3. Sheet tổng chọn khung đổi nhiều nhất (nhãn `@t` ms).
4. `ULT_SKIPPABLE` chuyển thành ghi chú cấp manifest.

## 2. Hạn chế đã biết của run này (đọc kỹ)
- **Cờ `DUPLICATE_SCRIPT` trên case status của run này KHÔNG đáng tin.** Chữ ký lấy từ cue đã phát; pha `loop`/`expire` không có cue nên gần như mọi status "trùng nhau". Harness đã sửa **sau** run này (chữ ký theo nội dung `statuses.<id>.apply`, loại màu và âm thanh); run kế tiếp sẽ đúng. Dùng bảng dưới (tính từ content hiện tại):
  - `defUp` ≡ `mdefUp` và `matkUp` ≡ `accUp`: **apply dùng cùng act và cùng hình, chỉ khác màu**; khác nhau chỉ ở `layers` duy trì (matkUp: vòng rune quay, accUp: tâm ngắm). Nhận định vòng trước của Tester/Dev "matkUp≡accUp là dương tính giả" là **sai một phần**: giữa hai skill mang chúng thì đúng là trùng do lab, nhưng ở mức content, hai script apply thực sự giống nhau. TD quyết ANIM-114 còn mở hay không cho 2 cặp này.
  - Bảy debuff Down giờ khác nhau (Dev đã sửa) — sig không trùng.
- **So TRƯỚC/SAU với run vòng 1 chỉ có giá trị cho case Dev nhắm tới** (12 ultimate, `variant.*.reduce`). Case status: đổi cách chụp (đòn thường thay vì skill mang nó) nên không so được. Với skill không bị sửa (vd `skill_tg_steel_charge`) vẫn thấy khác 4–16%: ô `start` khác vì t=0 sạch (đã giải thích ở §1); ô `impact+80`/`+200` có lệch vị trí nhẹ của con heo mà tôi **chưa giải thích được** (không phải thay đổi game: Dev không đụng skill này). Nghi do thay đổi trạng thái nền của harness (bước rỗng). Cần coi các khác biệt ở case không bị sửa là **nhiễu harness** cho tới khi run vòng 3 so với run này (cùng harness) cho 0%.
- Cổng determinism vẫn pass (hai lần chụp liền nhau trong cùng run giống nhau từng pixel).
- Hạn chế chưa đổi: không chụp map, targeting, chỉ báo lượt, HUD; không có video; `OVERFLOW` chưa đo.

## 3. Việc cần Dev/TD biết từ số đo [Auto]
- 12 ultimate: `hitStopMs` = 220 cho cả 12 (qs/qt/mm có rồi); `anticipationMs` 300–700 (12 giá trị, 11 khác nhau); `circleMs` 420–1000. Cờ còn lại: `ANTICIPATION_RANGE`/`CIRCLE_RANGE` (gợi ý, rubric §5).
- `variant.skill_cl_taunt.reduce`: khung đổi 4/13 (trước 1/13); `variant.skill_ult_nh.reduce`: 8/28 (trước 1/28).
- Cờ trên 145/200 case chủ yếu là `ANTICIPATION_RANGE`/`HITSTOP_RANGE` (gợi ý).
