# Project adapter — cách onboard một dự án

Lõi skill không biết gì về stack của bạn. **Adapter** lấp chỗ đó.

Tạo `references/projects/<tên-dự-án>/index.md`, rồi thêm một dòng vào
[projects/README.md](projects/README.md).

**Không bao giờ sửa lõi để hợp với một dự án.** Lõi phục vụ mọi dự án; adapter phục vụ một.

---

## Adapter phải trả lời 9 câu

Giữ ngắn — mục tiêu ~150 dòng, không phải một cuốn sách. Lõi đã lo phần nguyên tắc.

### 1. Spec nằm ở đâu, file nào là nguồn chân lý

Đường dẫn chính xác. Và **liệt kê rõ file nào KHÔNG được đọc** (bản cũ, bản đã thay thế,
catalogue nặng không liên quan tới code).

### 2. Stack và lệnh

```markdown
| Việc | Lệnh |
|---|---|
| Chạy dev | npm run dev |
| Build | npm run build |
| Test | npm test |
| Typecheck | npm run typecheck |
| Lint | npm run lint |
```

### 3. Cây thư mục và tên tầng

Ánh xạ CONFIG / DOMAIN / ADAPTER / VIEW của lõi sang tên thật của dự án.
Kèm **quy tắc phụ thuộc** dạng bảng: tầng nào được import tầng nào.

### 4. Ngoại lệ của ranh giới

File nào được phép phá quy tắc, và vì sao. Mỗi ngoại lệ cần một block trong `DECISIONS.md`.

### 5. Hệ style

- Vị trí file token, tên biến token (màu / font / spacing / breakpoint)
- Bộ breakpoint (danh sách đóng)
- Cách gọi media query
- Hàm/mixin bắt buộc dùng cho kích thước (nếu có)
- Bộ tiền tố class đã chọn
- Quy tắc scope của feature
- **Danh sách giá trị được phép viết thẳng** (mở rộng danh sách mặc định ở
  [04-styles.md §4](../04-styles.md))

### 6. Ngưỡng

```markdown
| Ngưỡng | Giá trị |
|---|---|
| Dòng / file | 300 |
| Dòng / hàm | 50 |
| Cấp lồng | 3 |
```

### 7. Cấu hình cho `check-architecture.mjs`

```js
// .claude/spec-to-source.config.mjs
export default {
  maxFileLines: 300,
  layers: [
    { name: 'config', dir: 'src/config',  mayImport: [] },
    { name: 'domain', dir: 'src/domain',  mayImport: ['config'] },
    { name: 'adapter', dir: 'src/store',  mayImport: ['config', 'domain'] },
    { name: 'view',   dir: 'src/ui',      mayImport: ['config', 'domain', 'adapter'] },
  ],
  forbidden: [
    // RegExp literals — the config is .mjs, so there is no string escaping to get wrong.
    { dir: 'src/domain', patterns: [/Date\.now\(/, /Math\.random\(/, /window\./, /document\./] },
  ],
  barrels: [
    { index: 'src/styles/features/_index.scss', glob: 'src/styles/features/_*.scss' },
  ],
  bannedFileNames: ['utils', 'helpers', 'misc', 'common', 'shared'],
};
```

### 8. Grep guard riêng của dự án

Chép từ [06-verification.md §2](../06-verification.md) và **sửa đường dẫn cho khớp**.
Bỏ mục không áp dụng; thêm mục đặc thù.

### 9. Freshness check

Vài lệnh chứng minh adapter còn đúng với repo. Chạy **trước khi viết code**.

```bash
ls src/domain/ | head
grep -c "@forward" src/styles/features/_index.scss
```

Output mâu thuẫn với adapter → **sửa adapter trước, ngay trong session đó**, rồi mới làm tiếp.
Tài liệu lệch thực tế còn tệ hơn không có tài liệu.

---

## Mẫu rỗng

```markdown
# Adapter — <tên dự án>

## 0. Freshness check
```bash
<2–4 lệnh>
```

## 1. Spec
- Nguồn chân lý: `<đường dẫn>`
- Phụ trợ: `<đường dẫn>`
- ⛔ KHÔNG đọc: `<đường dẫn>` — lý do

## 2. Stack & lệnh
| Việc | Lệnh |

## 3. Tầng & cây thư mục
```text
<cây>
```
| Tầng | Thư mục | Được import |

## 4. Ngoại lệ ranh giới
| File | Ngoại lệ | Lý do | DECISIONS |

## 5. Hệ style
- Token: `<đường dẫn>` — `$c-*`, `$fs-*`, `$sp-*`
- Breakpoint: <danh sách>
- Media query: `<cách gọi>`
- Tiền tố: <bộ đã chọn>
- Scope feature: <quy tắc>
- Giá trị viết thẳng được: <danh sách>

## 6. Ngưỡng
| Ngưỡng | Giá trị |

## 7. Config guard
`<đường dẫn file config>`

## 8. Grep guard
```bash
<các lệnh>
```

## 9. Chia increment
| # | Tên | Phụ thuộc | Cổng |

## 10. Bẫy đã biết của dự án này
- ...
```

Mục 10 là mục **có giá trị nhất theo thời gian**. Mỗi lần mất hơn 15 phút vì một cái bẫy,
ghi nó vào đây. Adapter tốt là adapter có mục 10 dài dần.
