# scripts/

## `check-architecture.mjs`

Guard kiến trúc — kiểm những thứ linter thường không kiểm được.

```bash
node .claude/skills/spec-to-source/scripts/check-architecture.mjs
node .claude/skills/spec-to-source/scripts/check-architecture.mjs --json
node .claude/skills/spec-to-source/scripts/check-architecture.mjs --config path/to/config.mjs
```

Không phụ thuộc gì ngoài Node ≥ 18. Thoát **1** khi có vi phạm → dùng được ở cổng increment và CI.

### Năm nhóm kiểm

| Nhóm | Bắt được gì |
|---|---|
| `layer` | Tầng dưới import tầng trên (domain gọi view, config gọi domain...) |
| `forbidden` | API cấm trong một thư mục (`Date.now()`, `Math.random()`, `localStorage`... trong tầng thuần) |
| `size` | File vượt ngưỡng dòng |
| `name` | Tên file hố rác: `utils`, `helpers`, `misc`, `common`, `shared` |
| `barrel` | File style/module không được liệt kê trong index → **không bao giờ vào bundle** |

### Config

Tìm theo thứ tự: `--config <path>` → `.claude/spec-to-source.config.mjs` → `spec-to-source.config.mjs`.
Không có → thoát 2 kèm hướng dẫn.

Shape đầy đủ ở [../references/project-adapter.md](../references/project-adapter.md) §7.

**`patterns` nên viết bằng RegExp literal** (`/Date\.now\(/`) — config là `.mjs` nên dùng được
trực tiếp, không phải escape chuỗi. Dạng chuỗi vẫn chấp nhận nhưng phải escape đôi
(`'Date\\.now\\('`); sai escape sẽ báo lỗi config rõ ràng chứ không crash.

### Ghi chú hành vi

- **Tầng khớp theo thư mục dài nhất** — `src/core/config` thắng `src/core`, nên tầng lồng nhau khai được.
- **Chỉ xét import tương đối.** Package ngoài không thuộc phạm vi.
- **Dòng comment được bỏ qua** ở nhóm `forbidden` — nhắc tên một API trong comment là tài liệu, không phải lời gọi.
- **Exception dùng đường dẫn repo-relative, dấu `/`** kể cả trên Windows: `src/core/rng.ts`.

### Tự kiểm

Sau khi cài, **thử phá một lần** để chứng minh guard đang chạy, rồi hoàn tác:

```bash
echo "export const x = Date.now();" > src/core/__probe.ts
node .claude/skills/spec-to-source/scripts/check-architecture.mjs   # PHẢI thoát 1
rm src/core/__probe.ts
```

Dán kết quả vào handover. Một guard chưa từng chặn được gì thì chưa chắc đang bật.
