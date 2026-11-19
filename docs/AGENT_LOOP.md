# Vòng lặp nhiều agent — quy trình tiết kiệm token

Áp dụng khi chủ dự án giao việc lớn, nhiều bước (ví dụ làm lại map Adventure). Sửa nhỏ (≤ vài file, rõ cách làm) thì phiên chính tự làm, không mở vòng lặp.

## 1. Vai trò và model

| Vai | Ở đâu | Model | Khi nào chạy |
|---|---|---|---|
| **Chỉ đạo** | phiên chính | model của phiên | luôn — lập kế hoạch, giao việc, đọc báo cáo, quyết dừng |
| **designer** | `.claude/agents/designer.md` | opus | 1 lần mỗi việc có phần nhìn thấy / thiết kế mới; bỏ qua với sửa lỗi |
| **coder** | `.claude/agents/coder.md` | sonnet | mỗi vòng; vòng 3 nâng lên opus (tham số `model`) |
| **checker** | `.claude/agents/checker.md` | haiku | mỗi vòng sau coder — cổng máy móc |
| **reviewer** | `.claude/agents/reviewer.md` | sonnet | chỉ khi checker xanh **và** việc có phần nhìn thấy |

Lý do: phần đắt (opus) chỉ dùng cho quyết định cần óc thẩm mỹ / kiến trúc và chỉ chạy một lần; phần lặp nhiều lần (code, chạy test, đọc log) dùng model rẻ hơn.

## 2. Vòng lặp

```
Chỉ đạo: brief + tiêu chí xong
  └─ designer (nếu cần) → docs/agent-loop/<việc>/design.md
  └─ vòng n (tối đa 3):
       coder   → sửa + tự kiểm nhanh → báo cáo ngắn
       checker → cổng máy móc (rẻ trước, đắt sau, dừng ở lỗi đầu tiên)
                 đỏ → về Chỉ đạo, bỏ qua reviewer
       reviewer (chỉ việc nhìn thấy) → chấm theo thước 10 điểm
  └─ đạt tiêu chí → Chỉ đạo báo chủ dự án (mẫu AGENT_RULES §7)
  └─ hết 3 vòng chưa đạt → dừng, báo chủ dự án kèm lỗi còn lại
```

## 3. Luật tiết kiệm token

1. **Brief tự đủ.** Chỉ đạo ghi rõ: mục tiêu, file cần đọc (đường dẫn, dòng nếu biết), file được sửa, tiêu chí xong, đỏ sẵn đã biết. Agent con **không** đọc `PROGRESS.md` (1700+ dòng), không đọc `docs/archive/`, không dò cả repo.
2. **Tiếp tục agent cũ thay vì mở mới.** Vòng sửa gửi `SendMessage` cho coder / checker đã chạy (giữ ngữ cảnh, khỏi đọc lại). Chỉ mở coder mới khi nâng model ở vòng 3.
3. **Báo cáo ngắn, có cấu trúc** (≤ 25 dòng): kết quả, `file:dòng`, lỗi kèm 1–3 dòng log. Không dán nguyên file, nguyên diff, nguyên log.
4. **Log dài ghi ra file.** Lệnh có output dài: ghi ra file tạm rồi `grep` / `tail` phần lỗi.
5. **Kiểm rẻ trước.** coder tự chạy typecheck + lint + test liên quan tới file đã sửa; checker chạy `npm run check` đầy đủ một lần; ảnh / FPS chỉ khi việc có phần nhìn thấy và mọi cổng trước đã xanh.
6. **Chỉ báo lỗi mới.** So với danh sách đỏ sẵn ở mục 6; lỗi có từ trước không làm hỏng vòng.
7. **Chỉ đạo không đọc lại toàn bộ.** Xem `git diff --stat` + báo cáo; chỉ mở đoạn diff rủi ro (save, core, tiền).
8. **Không chạy song song hai coder trên cùng file.** Việc chia được theo vùng / file thì mỗi coder dùng `isolation: "worktree"`.
9. **Chỉ hai file trên đĩa cho mỗi việc:** `docs/agent-loop/<việc>/design.md` (thiết kế) và `STATE.md` (sổ trạng thái, mục 5), đều được commit. Báo cáo đầy đủ của agent chỉ nằm trong phiên; STATE giữ một dòng tóm tắt mỗi báo cáo.

## 4. Điểm dừng chờ chủ dự án

Vòng lặp tự dừng, không tự quyết, khi: thay đổi gameplay / phạm vi / cấu trúc save (AGENT_RULES §6), cần art mới (chủ dự án tạo bằng Gemini), cổng duyệt thẩm mỹ (G0, G1…), hoặc hết 3 vòng.

## 5. Sổ trạng thái và tiếp tục sau sự cố

Vòng lặp có thể dừng giữa chừng (hết limit, mất điện, app tắt). Context của phiên và mọi subagent khi đó mất hết, chỉ còn đĩa và git. Vì vậy trạng thái phải luôn nằm trên đĩa.

**Sổ trạng thái** `docs/agent-loop/<việc>/STATE.md`: Chỉ đạo tạo ngay khi bắt đầu việc. Ghi lại **trước** mỗi lần giao việc cho agent và **ngay sau** khi nhận báo cáo, không đợi cuối mốc. Mẫu:

```
# STATE — <việc>
Nhánh: <tên>   Commit xanh gần nhất: <hash> (<mốc>)
Mốc hiện tại: M3 — <tên>   Vòng: 2/3
Đang làm: coder — <một dòng>   (bắt đầu <giờ>)
Brief đang chạy: <5–15 dòng, đủ để giao lại nguyên văn>
Xong: M0 ✅ <hash> | M1 ✅ <hash> | M2 ✅ <hash> | M4 forest_deep ✅ 8,0 ...
Còn lại: <danh sách theo thứ tự>
Điểm reviewer: <map: điểm, ảnh>   FPS: <map: số>
Lỗi đang mở: <file:dòng — một dòng>
Chờ chủ dự án: <câu hỏi, nếu có>
```

**Commit sau mỗi bước xanh** (không chỉ cuối mốc), kèm `STATE.md`. Một sự cố chỉ làm mất tối đa một bước.

**Khi chủ dự án nói "tiếp tục việc còn đang dang dở"** (hoặc câu tương tự), Chỉ đạo:
1. Không lập lại kế hoạch, không đọc lại tài liệu đã tóm trong STATE. Chỉ đọc: `STATE.md` mới nhất (tìm trong `docs/agent-loop/*/`), `git log --oneline -10`, `git status --short`.
2. Đối chiếu:
   - Các bước có trong "Xong" và có commit → **bỏ qua, không làm lại**.
   - Bước "Đang làm" chưa có commit, nhưng `git status` có thay đổi → **không xóa, không làm lại từ đầu**. Giao checker kiểm phần dở. Xanh: commit và đi tiếp. Đỏ: giao coder **mới**, brief = "Brief đang chạy" + "đã có sẵn phần dở này, chỉ hoàn thiện / sửa", kèm lỗi checker.
   - Bước "Đang làm" chưa có thay đổi nào → giao lại nguyên văn "Brief đang chạy".
   - Bước đang ở reviewer, có ảnh mà chưa có điểm → chỉ chấm lại, không chụp / code lại.
3. Báo chủ dự án 2–3 dòng: đang ở đâu, làm tiếp bước nào, rồi làm luôn, không chờ trả lời.
4. Subagent cũ không tiếp tục được sau sự cố (mất ID): luôn mở agent mới với brief trong STATE.

Sổ STATE thắng trí nhớ của phiên. Nếu STATE và git mâu thuẫn, tin git (commit có thật) và sửa STATE.

## 6. Đỏ sẵn đã biết (cập nhật khi thay đổi)

Ngày 2026-11-19, nhánh `new-ideas/update-3d-adventure`:
- guard: `src/areas/adventure/scene/AdventureScene.ts` quá dài (311 dòng, từ `b15376af`).
- test: `assets`, `decor`, balance guard `phase11`.

Baseline 2026-11-19, nhánh `map-diorama-forest` (checker, `npm run check` đủ 5 bước): typecheck, lint, assets:check xanh; guard đỏ (trên); test 11 đỏ / 2127 ở 4 file:
- `tests/unit/assets.test.ts:128` (A4 decor cắt sai cỡ), `tests/unit/decor.test.ts:74` (`DECOR_HAY_BALE` thiếu chỗ đặt).
- `tests/unit/phase11.test.ts:248` balance guard: **quá giờ** khi chạy cả bộ (55 s), chạy riêng thì xanh.
- `tests/scripts/assetsCheck.test.ts`: 8 / 9 quá giờ **kể cả chạy riêng** — `beforeEach` chép cả `public/assets` (561 MB) cho mỗi test.
Việc `forest-diorama` M1 sửa hết các đỏ này.
