# Mẫu brief

Điền các ô `<…>`. Không thêm đoạn văn giải thích. Mỗi brief có: mục tiêu, file đọc, file được sửa, kiểm, đỏ sẵn,
nơi ghi báo cáo, giới hạn thời gian. `R = art_inbox/agent-loop/<task>/<unit>/v<n>` (đã gitignore).

## K0 — checker, baseline (haiku)
```
Baseline cho việc <task> trên nhánh <branch>. Chạy `npm run check` (giới hạn 12 phút, chạy nền, log ra file tạm).
Báo mọi bước đỏ: file:dòng + 1–3 dòng log, và tổng test. Không sửa gì. Ghi kết quả vào <R0>/report.md.
```

## R — research (Explore, sonnet; haiku nếu chỉ liệt kê)
```
Tìm cái có sẵn để việc <task> dùng lại, KHÔNG thiết kế. Đọc: <file / thư mục>. Trả lời ≤ 60 dòng vào
docs/agent-loop/<task>/research.md:
1. Mẫu tốt nhất cùng loại (id, file:dòng, điểm đã duyệt nếu có).
2. Số liệu / bảng liên quan (đường dẫn, không chép bảng dài).
3. Ràng buộc từ decision / chuẩn (số decision, mục).
4. Khoảng trống: cái cần mà chưa có.
Không đọc PROGRESS.md, docs/archive/, asset/, ảnh.
```

## D — designer (opus, một lần)
```
Viết docs/agent-loop/<task>/design.md theo mẫu .claude/skills/agent-loop/references/design.md.
Mục tiêu: <1–3 câu>. Đơn vị: <danh sách, pilot trước>.
Đọc: docs/agent-loop/<task>/research.md, <chuẩn / thước>, <decision>, <file code định dạng dữ liệu>.
Thước: <tên, §>, ngưỡng <x>. Mỗi kiểm phải đo được (ảnh ở điểm nào, % khung, số, test nào).
Ngoài phạm vi: <…>. Cần đổi gameplay / save / art mới → ghi "Cần chủ dự án quyết", không tự quyết.
```

## C — coder, một đơn vị (sonnet; vòng 3 opus mới)
```
Đơn vị <unit> của <task>. Làm đúng design.md §<n> (đọc §<chung> + §<n>; không đọc mục đơn vị khác).
Đọc thêm: <file:dòng>. Được sửa: <file / thư mục>. Không đổi: save, số trong content/ (trừ khi design ghi),
đơn vị đã đạt (<danh sách> — chụp lại <ảnh> để so nếu đụng code dùng chung).
Mốc chuẩn: không thấp hơn <pilot / skill mẫu> (<đường dẫn ảnh / contact sheet>).
Tự kiểm: npx tsc --noEmit, npx eslint <file đã sửa>, npx vitest run <test liên quan> (≤ 5 phút).
<Nếu nhìn thấy:> Chụp sau lần sửa cuối: <lệnh nguyên văn> --out <R> (giới hạn 10 phút).
Báo cáo ≤ 20 dòng VÀ ghi <R>/report.md:
- file đã sửa (đường dẫn + 1 dòng lý do); kết quả tự kiểm;
- bảng hợp đồng: #1 ✅ dựng | #2 ⏳ chưa (lý do) … — đủ mọi mục PHẢI THẤY của §<n>;
- số đo (FPS + tên adapter, thời gian) nếu có.
Không commit, không đổi nhánh, không junction / symlink node_modules.
```

## F — vòng sửa (SendMessage cho coder cũ; vòng 3: coder opus MỚI + brief C + danh sách này)
```
Vòng <n>/3 đơn vị <unit>. Reviewer <điểm> (ngưỡng <x>). Sửa theo thứ tự, không làm thêm:
<chép nguyên danh sách lỗi đánh số của reviewer / lỗi checker>
Chụp lại vào <R mới> (thư mục mới, không ghi đè vòng trước). Báo như brief C.
```

## K — checker, một vòng (haiku)
```
Kiểm đơn vị <unit> v<n>. Đỏ sẵn: <danh sách | rỗng>. Chạy theo thứ tự, dừng ở lỗi MỚI đầu tiên:
typecheck → lint → guard → assets:check → test (giới hạn 12 phút, chạy nền).
<Nếu nhìn thấy và chưa có ảnh:> rồi chạy nguyên văn: <lệnh chụp / đo> (giới hạn 10 phút; in tên adapter GPU).
Không ghép lại đường dẫn / tham số. Ghi kết quả vào <R>/report.md (thêm mục "checker"). Báo ≤ 20 dòng.
```

## V — reviewer (sonnet, MỚI cho mỗi đơn vị; vòng sửa cùng đơn vị thì SendMessage)
```
Chấm đơn vị <unit> v<n>. Kiểm: docs/agent-loop/<task>/design.md §<n> (kiểm #…). Thước: <file §>, ngưỡng <x>.
Ảnh: <R>/ (chỉ thư mục này). Mốc so: <ảnh pilot / contact sheet skill mẫu>.
Chỉ chấm cái thấy được; chuyển động cần dải khung liên tiếp hoặc số đo, ảnh đơn thì tiêu chí chuyển động tối đa 1,5.
Ghi điểm + danh sách lỗi vào <R>/report.md (mục "reviewer"). Báo theo mẫu reviewer.
```
