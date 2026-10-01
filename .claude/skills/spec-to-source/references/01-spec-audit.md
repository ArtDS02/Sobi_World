# 01 — Spec Audit

> Giai đoạn 0. **Không viết dòng code nào.** Đầu ra là 3 file markdown.

Mục đích: mọi thứ spec **không** trả lời được phát hiện **trước** khi nó biến thành code.
Một mâu thuẫn phát hiện ở giai đoạn này tốn 10 phút. Phát hiện sau khi đã có dữ liệu lưu
tốn một migration.

---

## 1. Đọc gì, theo thứ tự nào

1. File "bản đồ tài liệu" nếu có (`README.md` của bộ spec) — nó nói file nào là nguồn chân lý.
2. Spec chính, **toàn bộ**, kể cả phụ lục. Phụ lục thường chứa config viết sẵn và chuỗi hiển thị —
   đó là thứ phải chép nguyên văn, không diễn giải.
3. Các tài liệu vệ tinh (style guide, asset spec, data dictionary).
4. **Tài liệu đã bị thay thế: KHÔNG đọc.** Nếu bộ spec có thư mục `archive/` hoặc ghi "superseded",
   bỏ qua hoàn toàn. Đọc nó là cách nhanh nhất để đưa số liệu cũ vào code.

Ghi vào `SPEC_INDEX.md` ngay trong lúc đọc — đừng để cuối mới làm.

---

## 2. Bốn loại vấn đề phải tìm

### 2.1. MÂU THUẪN — spec tự chống lại chính nó

Hai chỗ trong cùng bộ tài liệu nói hai điều không cùng đúng được.

**Cách tìm:** với mỗi hằng số, mỗi invariant, mỗi tên định danh — tìm **mọi** chỗ nhắc tới nó và
so sánh. Đặc biệt soi:

- **Invariant vs. vòng đời.** "Tối đa 3 phần tử" nhưng TTL dài hơn chu kỳ sinh → có lúc 6 phần tử.
- **Hai nguồn chân lý cho cùng một giá trị.** Cùng một `price` khai ở cả file config lẫn file manifest.
- **Type thiếu field mà hành vi cần.** Có action `equipX` nhưng data model không có `ownedX`.
- **Tham chiếu tới thứ không tồn tại.** "field đã dành sẵn ở §5.4" nhưng §5.4 không có field đó.
- **Hai bộ tên cho cùng một thứ.** Danh sách sự kiện ở tài liệu A và tài liệu B lệch nhau.

**Xử lý:** ghi cả hai vế + số section + phương án đề xuất. Có khuyến nghị sẵn trong tài liệu dự án → áp dụng. Không có → gom tất cả vào MỘT khối BLOCKED.

### 2.2. THIẾU — spec nói "làm X" nhưng không đủ để làm

Ví dụ điển hình: "chọn ngẫu nhiên có trọng số" nhưng không cho bảng trọng số; "hash ổn định"
nhưng không cho công thức; nhắc tên một màn hình nhưng không mô tả nội dung.

**Xử lý:** chọn phương án đơn giản nhất, ghi vào `DECISIONS.md` với nhãn `DEFAULT`, và **khoá lại
bằng test** nếu nó ảnh hưởng tới kết quả tái lập được (hash, thứ tự, seed).

### 2.3. XẤP XỈ CÓ CHỦ Ý — spec biết là không chính xác và chấp nhận

Thường có câu "chấp nhận", "đủ tốt", "lưu ý thứ tự". Đây **không phải** lỗi.

**Xử lý:** ghi vào `README.md` mục *Implementation assumptions*, và ghi rõ **cấm sửa mà không sửa
luôn test/golden value đi kèm**. Nếu không ghi, session sau sẽ "sửa cho đúng" và làm vỡ test.

### 2.4. CODE CHẾT — hằng số hoặc nhánh không bao giờ đạt tới

Ví dụ: cap 120 nhưng công thức tối đa chỉ ra 110.

**Xử lý:** không sửa. Ghi một dòng chú thích để người chỉnh về sau không tưởng nhầm.

---

## 3. Đầu ra bắt buộc

### 3.1. `DECISIONS.md`

Mỗi quyết định một block. Không gộp, không tóm tắt.

```markdown
## D-07 — Trọng số chọn phần tử khi sinh đơn hàng

**Loại:** DEFAULT (spec thiếu)
**Bằng chứng:** spec §8.14 dùng `weightedPick(rng, discovered)` nhưng không cho bảng trọng số.
**Quyết định:** phân bố đều trên tập đã khám phá.
**Lý do:** đơn giản nhất; spec §0 chỉ dẫn chọn phương án đơn giản khi chưa rõ.
**Ảnh hưởng:** Increment 11 (orders). Cần test khoá phân bố.
**Ngày chốt:** 2026-XX-XX
```

Loại: `CONTRADICTION` · `DEFAULT` · `ASSUMPTION` · `DEAD_CODE` · `ARCH` (quyết định kiến trúc
do adapter chứ không do spec).

**Quy tắc:** quyết định đã ghi thì **không bàn lại**. Session sau đọc `DECISIONS.md` là xong,
không mở lại spec cho mục đó.

### 3.2. `SPEC_INDEX.md`

Bảng "cần biết X → đọc section nào". Đây là thứ **tiết kiệm usage nhiều nhất** trong cả dự án:
nó cho phép prompt nói *"đọc §7.3 và §14.2"* thay vì *"đọc spec"*.

```markdown
| Cần biết | Đọc |
|---|---|
| Công thức mô phỏng thời gian | spec §7.2 |
| Bảng giá trị kiểm chứng | spec §14.1 |
| Toàn bộ chuỗi hiển thị | spec Phụ lục B |
| Quy tắc đặt tên asset | art-standard §7.1 |
```

Tối thiểu 25 dòng. Càng chi tiết càng rẻ về sau.

### 3.3. `PROJECT_STATUS.md`

Khởi tạo theo format state ở [SKILL.md §5](../SKILL.md).

---

## 4. Checklist đóng giai đoạn 0

- [ ] Đã đọc toàn bộ spec chính, kể cả phụ lục
- [ ] Không đọc tài liệu đã bị thay thế
- [ ] Mọi MÂU THUẪN đã ghi, có trích dẫn hai vế; chưa chốt được → BLOCKED (một lần, gom mọi câu)
- [ ] Mọi chỗ THIẾU đã có giá trị mặc định + lý do
- [ ] Mọi XẤP XỈ đã vào *Implementation assumptions*
- [ ] `SPEC_INDEX.md` ≥ 25 dòng
- [ ] `PROJECT_STATUS.md` tồn tại
- [ ] **Không có file mã nguồn nào được tạo**

---

## 5. Sai lầm hay gặp ở giai đoạn này

| Sai lầm | Vì sao hỏng |
|---|---|
| "Tôi sẽ xử lý chỗ này lúc code cho tiện" | Lúc code, quyết định bị chôn trong một commit và không ai review nó |
| Tóm tắt lại spec vào một file mới | Tốn token, và ngay lập tức thành bản sao lỗi thời. `SPEC_INDEX.md` trỏ, không chép |
| Ghi quyết định mà không trích section | Session sau không kiểm chứng được, phải đọc lại cả spec |
| Sửa spec gốc | Spec là đầu vào. Ghi chênh lệch vào `DECISIONS.md`, để chủ spec tự cập nhật |
| Gộp 12 quyết định thành một đoạn văn | Không tra cứu được. Mỗi quyết định một block, có ID |
