# Quy trình Animation Review — Sobi Adventure

Vòng lặp **Test → Review → Fix → Re-test** cho animation (chiến đấu + map) mà AI tự chạy được, không cần chủ dự án giải thích lại.
Nguồn sự thật vẫn theo `CLAUDE.md` (spec > decisions > ARCHITECTURE > code). Thư mục này chỉ là quy trình, không đổi luật dự án.

## 1. Vòng lặp

```
 needs_harness ──► SESSION 0 (Tester, chế độ BUILD)  xây harness, qua cổng xác định (determinism gate)
        │
        ▼
 needs_capture ──► SESSION 0 (Tester, chế độ RUN)    chụp → contact sheet → CAPTURE_MANIFEST
        │
        ▼
 needs_review  ──► SESSION 1 (Technical Director)    xem ảnh + đo số + đối chiếu code → feedback vòng N
        │
        ├── không còn blocker/major ─────────────────► done
        ├── round == maxRounds mà vẫn còn lỗi ───────► escalated (chủ dự án quyết)
        ▼
 needs_fix     ──► SESSION 2 (Developer)             sửa theo ID, npm run check xanh
        │
        └──────────► needs_capture (round+1) ──► Tester RUN lại ──► TD so TRƯỚC/SAU
```

Mỗi session mở bằng đúng một prompt ngắn trong [`PROMPTS.md`](PROMPTS.md). Chi tiết nằm ở `roles/*.md`.

## 2. Sáu nguyên tắc (đừng phá)

1. **Bằng chứng trước, ý kiến sau.** TD không được kết luận "nhìn ra sao" nếu không có ảnh/số của đúng run đang review. Review chỉ dựa code (như bản v1) phải ghi rõ là *chưa xác nhận bằng hình*.
2. **Run bất biến.** Mỗi lần chụp ghi vào thư mục mới `capture/runs/<runId>/`. Không ghi đè, không "bỏ qua nếu đã có". Xem [`ANTI_CACHE.md`](ANTI_CACHE.md).
3. **Mọi bằng chứng mang dấu vân tay (stamp)** của code lúc chụp. TD/Dev chỉ tin run có stamp khớp `STATE.json`.
4. **Mỗi file một chủ.** Chỉ role sở hữu mới ghi (bảng §3). Trao đổi qua file, không qua trí nhớ session.
5. **ID ổn định.** Lỗi có ID `ANIM-###` (tiếp nối bản v1) và mang suốt các vòng; vòng sau chỉ đổi trạng thái, không đánh số lại.
6. **Vòng lặp có đáy.** `maxRounds` (xem `STATE.json`; chủ dự án đã nâng lên 8 ngày 2026-11-04 để chạy liên tục tới khi đạt chuẩn) (xem `STATE.json`). Hết vòng mà còn blocker/major → `escalated`, dừng và báo chủ dự án.

## 3. Ai đọc / ghi gì

| File / thư mục | Ghi | Đọc |
|---|---|---|
| `STATE.json` | mỗi role cập nhật phần của mình, khi **kết thúc** | cả ba, **đầu tiên** |
| `capture/runs/<runId>/**`, `capture/LATEST.json`, `capture/CAPTURE_MANIFEST.md` | Tester | TD, Dev |
| `rounds/round-NN/FEEDBACK.md` | TD | Dev, Tester |
| `rounds/round-NN/COMPARE.md` (TRƯỚC/SAU của vòng NN-1 → NN) | TD | Dev, chủ dự án |
| `rounds/round-NN/FIX_REPORT.md` | Dev | Tester, TD |
| `scripts/anim-review/**`, `package.json` script `anim:*` | Tester (BUILD) | Tester |
| `audit/AUDIT.md`, `audit/inventory.json` (sinh bằng `npm run anim:audit`, không sửa tay; cách đọc: [`audit/README.md`](audit/README.md)) | script | TD, Dev, Designer |
| `src/**`, `content/**`, `tools/**`, `tests/**` | Dev (và Tester chỉ khi thêm hook chụp, ghi rõ) | — |

`ANIMATION_REVIEW_FEEDBACK.md` (cũ, review qua code, 2026-11-03) = **baseline vòng 0**. Không sửa; các `ANIM-###` trong đó là danh sách ứng viên. Vòng 1 của TD phải **phân loại lại từng ID** (đã sửa / còn / không tái hiện) dựa trên ảnh — vì các batch 4–8 đã sửa nhiều mục.

## 4. Tiêu chí dừng

- **done**: theo [`ANIMATION_QUALITY_RUBRIC.md`](ANIMATION_QUALITY_RUBRIC.md): không còn `blocker`/`major` ở `open`/`regressed`, mọi đơn vị chấm đạt mục tiêu tối thiểu §6 và không vi phạm quy tắc chặn, mọi `minor` còn lại đã được TD ghi "chấp nhận", `npm run check` xanh, run cuối `complete: true` và qua cổng.
- **awaiting_playtest**: đủ điều kiện trên nhưng còn mục [Playtest] (rubric §7, cảm giác C2/C5 của Ultimate, Skill thường, Map) chờ chủ dự án chơi thử xác nhận. Chủ dự án trả lời xong thì TD chốt `done` hoặc mở lại lỗi.
- **escalated**: `round == maxRounds` còn lỗi; hoặc cổng xác định/cache canary fail 2 lần liên tiếp; hoặc 2 vòng liền một ID không đổi trạng thái.
- **blocked** (bất kỳ role): thiếu quyền/công cụ/dữ liệu → ghi `BLOCKED.md` ở thư mục round, đặt `phase` giữ nguyên + `blocked: true`, dừng. Không đoán, không giả bằng chứng.

## 5. Cấu trúc

```
docs/animation-review/
├─ README.md  ANTI_CACHE.md  PROMPTS.md  STATE.json
├─ ANIMATION_QUALITY_RUBRIC.md   # tiêu chuẩn chấm (v1.0 của chủ dự án + §10 bổ sung v1.1); TD chấm, Dev đọc để biết "đạt" là gì
├─ roles/            0-tester.md  1-technical-director.md  2-developer.md
├─ templates/        FEEDBACK_TEMPLATE.md  COMPARE_TEMPLATE.md  MANIFEST_SPEC.md
├─ capture/          LATEST.json  CAPTURE_MANIFEST.md (bản của run mới nhất)  runs/<runId>/ (gitignore phần ảnh)
├─ rounds/round-NN/  FEEDBACK.md  COMPARE.md  FIX_REPORT.md  manifest.snapshot.json
└─ ANIMATION_REVIEW_FEEDBACK.md   (baseline vòng 0, giữ nguyên)
scripts/anim-review/ (Tester xây)  →  npm run anim:capture | anim:compare | anim:verify
```

## 6. Quy ước chung

- Trả lời/ghi tài liệu tiếng Việt; comment code tiếng Anh. Báo cáo cuối phiên theo mẫu `docs/AGENT_RULES.md` §7.
- Animation chỉ làm ở GĐ14 (nhánh `phase-14-art`); asset/VFX mới qua id → manifest, tên gốc, **không** gợi IP bên thứ ba (AGENT_RULES §9).
- Harness **chỉ đọc**: không gọi API lưu của Admin (không ghi `battle_fx.json`), không mở save thật của người chơi.

## 7. Dung lượng
Một run `--suite all` nặng ~1.5 GB (mọi frame). Chỉ giữ `LATEST` và run liền trước (cần cho `anim:compare`); xóa các run cũ hơn trong `capture/runs/` (gitignore, không mất lịch sử vì manifest đã chép vào `rounds/round-NN/manifest.snapshot.json`).

## 8. Chụp game thật (Targeting, HUD, lượt, map)
`npm run anim:game [-- --map]` dựng server riêng, tạo save mới (`dev:rich-save`, mở Vết Nứt), chạy `battleUi.ts` (ảnh màn trận + số đo vùng bấm/hover/dock, trận tự động 70 s) và với `--map` thêm tour map cũ. Ghi vào `capture/game/<runId>/`; `GAME_LATEST.json` trỏ run mới nhất. Chủ dự án playtest theo `PLAYTEST_REQUEST.md`.
