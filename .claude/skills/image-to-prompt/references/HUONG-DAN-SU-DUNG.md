# Hướng dẫn sử dụng skill `image-to-prompt`

Tài liệu này dành cho **người dùng** — bạn đưa ảnh layout, skill lo phần còn lại.
Các file tiếng Anh trong `references/` là thứ Claude đọc để làm việc; file này là thứ
bạn đọc để biết cần đưa gì và nhận lại gì.

---

## 1. Skill này làm gì cho bạn

Bạn có một ảnh màn hình game (mockup, screenshot tham khảo, concept). Bạn muốn có
từng asset rời: nền sạch, công trình, nhân vật, icon…

Skill sẽ:

1. Đọc ảnh, tách ra danh sách asset cần tạo — và **kiểm tra cái nào đã có rồi để
   không làm lại**.
2. Cắt sẵn các vùng ảnh tham chiếu (hint) từ chính layout của bạn.
3. Gom asset thành từng **sheet**, viết **prompt tiếng Anh dán thẳng vào Gemini**.
4. Nói rõ: sheet này đính kèm file nào, theo thứ tự nào, ảnh tải về lưu tên gì.
5. Sau khi bạn tạo xong: **tự cắt sheet thành từng PNG nền trong suốt**, rồi đối chiếu
   với danh sách để báo thiếu / lỗi.

**Không cần API, không tốn tiền.** Phần tạo ảnh bạn làm bằng tay trên
gemini.google.com hoặc aistudio.google.com.

---

## 2. Bạn cần chuẩn bị gì

| Thứ | Bắt buộc? | Ghi chú |
|---|---|---|
| **Ảnh layout** | ✅ | Màn hình bạn muốn dựng. PNG/JPG, càng to càng dễ đọc chi tiết |
| **Ảnh phong cách** (style reference) | Nên có | 1–4 ảnh art đã duyệt của dự án. Thiếu thì mọi sheet sẽ lệch phong cách nhau |
| **Ảnh shape tham khảo** | Không | Khi bạn muốn một vật có hình dáng cụ thể mà layout không vẽ rõ |

Bỏ tất cả vào `art_inbox/` (hoặc nói Claude đường dẫn, skill sẽ tự chép vào).

**Về ảnh phong cách:** chọn ảnh **cùng loại** với thứ sheet đó vẽ — ảnh công trình
để làm công trình, ảnh nhân vật để làm nhân vật. Dùng sai loại là cách chắc chắn nhất
để ra đúng màu nhưng sai dáng.

---

## 3. Câu lệnh để nhờ Claude — copy dùng luôn

### 3.1. Dựng batch mới từ một layout

```
Dùng skill image-to-prompt.

Layout: art_inbox/.ref/<tên file>.png
Ảnh phong cách: art_inbox/<...>.png (và ... nếu có nhiều)
Tên batch: <area>-<nn>-<chủ đề>     ví dụ: garden-02-props

Yêu cầu:
- Phân tích layout, liệt kê asset cần tạo, nói rõ cái nào đã có sẵn và bỏ qua.
- Những thứ nào giữ lại trong nền, những thứ nào tách ra thành sprite.
- Lập batch.json, cắt hint cần thiết, chạy prep.
- Đưa tôi PROMPT.md và nói tôi làm sheet nào trước.
```

### 3.2. Khi đã tạo xong ảnh trên Gemini

```
Tôi đã lưu các sheet vào art_inbox/.batch/<batch>/.
Dùng skill image-to-prompt: cut rồi check batch này, báo cái nào lỗi và nên làm lại.
```

### 3.3. Làm lại một asset bị hỏng

```
Asset <tên> trong batch <batch> bị <mô tả lỗi: sai màu / bị cắt / có chữ / sai dáng>.
Dùng skill image-to-prompt, sửa lại sheet đó và đưa tôi prompt mới.
Giữ nguyên các asset khác.
```

### 3.4. Duyệt asset

```
Duyệt các asset này: <tên 1> <tên 2> ...
```

### 3.5. Dùng cho dự án khác (phong cách khác hẳn)

```
Dùng skill image-to-prompt cho một game khác, phong cách: <mô tả: ví dụ "pixel art
32x32, bảng màu 16 màu, viền đen 1px"> — không phải phong cách Sobi.
Tạo profile mới trước, rồi mới dựng batch.
```

---

## 4. Quy trình thực tế, từng bước

### Bước 1 — Claude phân tích layout

Claude đọc ảnh và trả về danh sách asset. **Hãy đọc kỹ danh sách này** — đây là lúc sửa
rẻ nhất. Soát hai thứ:

- Có cái gì bị liệt kê nhầm thành sprite trong khi bạn muốn nó nằm luôn trong nền không?
- Có cái gì bạn cần mà Claude bỏ sót không?

### Bước 2 — Claude sinh `PROMPT.md`

File nằm ở `art_inbox/.batch/<batch>/PROMPT.md`. Mở ra, mỗi sheet có 4 thông tin:

```
## Sheet A — Cổng Adventure, bể Aquarium, đài phun nước
- Lưu thành: `art_inbox/.batch/world-01-scene/A.png`      ← tên file phải lưu đúng
- Đính kèm (theo thứ tự): `1_style_building.png`, `A_2_hint.png`, ...
- Kết quả: lưới 1×3: prop_portal_gate, prop_sea_dock, prop_fountain
```

Rồi tới khối ```text``` — đó là prompt để dán.

### Bước 3 — Bạn làm trên Gemini

Với **mỗi sheet**:

1. Mở gemini.google.com hoặc aistudio.google.com, chọn model tạo ảnh.
2. **Mở cuộc trò chuyện MỚI.** Không dùng lại chat cũ — nó sẽ mang lỗi của lần trước sang.
3. Đính kèm đúng các file theo **đúng thứ tự** ghi ở dòng "Đính kèm". Thứ tự này là thứ
   duy nhất cho model biết "Image 2" trong prompt là ảnh nào.
4. Dán prompt, gửi.
5. Tải ảnh về, **lưu đúng tên** ghi ở dòng "Lưu thành", vào đúng thư mục đó.

> 💡 Sheet nào ghi *"sửa từ ảnh mẫu"* thì nên dùng **Google AI Studio** — bản Gemini
> thường có watermark.

> 💡 Muốn thử bản khác: tạo lại ở chat mới, lưu `A-2.png`, `A-3.png`. Đừng đè lên `A.png`
> cho tới khi chắc bản mới đẹp hơn.

### Bước 4 — Claude cắt và kiểm tra

Claude chạy `cut` + `check`, trả về:

- Sheet nào chưa có ảnh.
- Cell nào trống, lưới nhận sai, sprite bị cắt mép.
- Asset nào chưa cắt được.

**Nhưng máy không nhìn được phong cách.** Claude sẽ dựng một ảnh tổng hợp các sprite
đã cắt trên nền caro để bạn xem. Hãy nhìn và soát: màu có đúng không, nét viền có đúng
không, có bị lạc một con sai tông không.

### Bước 5 — Duyệt

Asset nào bạn gật thì được chép ra `art_inbox/<tên>.png`. Đó là thư mục game đọc.
**Duyệt từng asset, không duyệt cả sheet** — sheet 4 con đẹp 3 con thì duyệt 3, làm lại 1.

---

## 5. Hiểu các thư mục

```
art_inbox/
├── <tên>.png           ← ĐÃ DUYỆT. Chỉ những file này mới là asset thật.
├── profile.json        ← Phong cách của dự án. Sửa ở đây để đổi style toàn bộ.
├── .ref/               ← Ảnh layout gốc
├── .hints/<batch>/     ← Vùng ảnh được cắt ra từ layout
├── .batch/<batch>/
│   ├── batch.json      ← Bản kê khai. Claude sửa file này.
│   ├── PROMPT.md       ← SINH TỰ ĐỘNG. Đừng sửa tay, sẽ bị ghi đè.
│   ├── 1_style_*.png   ← File đính kèm, đã xếp sẵn
│   └── A.png, B.png    ← Ảnh bạn tải từ Gemini về
├── .candidates/        ← Đã cắt, CHƯA duyệt. `_a` `_b` là các bản thử
└── .qa/                ← Ảnh để soi: ruler, contact sheet
```

**Ba cột trạng thái** khi Claude báo cáo — đừng nhầm chúng với nhau:

```
batch                sheets       cut  approved
cloud-01-flowers      3/3      24/24      0/24
```

- `sheets` = đã tạo ảnh trên Gemini chưa
- `cut` = đã cắt ra sprite chưa
- `approved` = **bạn đã duyệt chưa**

Dòng trên nghĩa là: ảnh đã tạo đủ, đã cắt đủ, **nhưng chưa có asset nào được duyệt**.

---

## 6. Tự chạy lệnh (nếu bạn muốn)

Chạy từ thư mục theme. Không bắt buộc — Claude làm hộ được hết.

```bash
python .claude/skills/image-to-prompt/scripts/art.py status
```

```bash
python .claude/skills/image-to-prompt/scripts/art.py check cloud-01-flowers
```

Xem thước toạ độ để tự chọn vùng cắt hint:

```bash
python .claude/skills/image-to-prompt/scripts/art.py ruler .ref/my-layout.png
```

Xem phong cách đang áp dụng:

```bash
python .claude/skills/image-to-prompt/scripts/art.py profile
```

---

## 7. Đổi sang dự án / phong cách khác

Toàn bộ "chất Sobi" nằm trong `art_inbox/profile.json`, không nằm trong code. Đổi dự án
= sửa file đó, không cần sửa script.

```bash
python .claude/skills/image-to-prompt/scripts/art.py profile --init   # tạo file mẫu
```

Những khoá hay phải đổi nhất:

| Khoá | Đổi khi nào |
|---|---|
| `style_line` | **Luôn luôn.** Đây là câu mô tả phong cách — viền, đổ bóng, bảng màu, độ chi tiết |
| `framing` | Dự án có loại asset khác (ví dụ `tile`, `ui_panel`, `portrait`) |
| `sheet_bg` + `sheet_bg_name` | Art sáng màu, nền xám bị lẫn → đổi sang nền tối. **Phải đổi cả hai**, nếu không prompt sẽ tự mâu thuẫn |
| `prefixes` | Dự án đặt tên asset theo quy ước khác |
| `shape_line` | Phần trong ngoặc mô tả "ảnh tham khảo sai ở chỗ nào" — viết lại cho đúng loại tham khảo bạn hay nhận |

Khoá nào bạn xoá đi thì rơi về mặc định, nên không sợ làm hỏng file.

---

## 8. Lỗi thường gặp

| Hiện tượng | Nguyên nhân | Xử lý |
|---|---|---|
| Cắt ra bị viền xám quanh sprite | Gemini vẽ nền gradient thay vì màu phẳng | Làm lại sheet ở chat mới. Cắt lại không cứu được |
| Báo "found N row bands, manifest says R" | Model gộp ô hoặc vẽ thiếu vật | Làm lại sheet; hoặc nếu lưới trong `batch.json` ghi sai thì sửa rồi `cut --force` |
| Sprite có chữ | Model bỏ qua lệnh cấm chữ | Làm lại. Đây là xác suất, không phải lỗi prompt |
| Chuỗi giai đoạn bị nhảy khi đổi frame | Cắt sát từng frame | Đặt `"trim": "uniform"` cho sheet đó rồi `cut --force` |
| Model vẽ lại đúng vật trong ảnh phong cách | Nó hiểu nhầm style ref là nội dung | Làm lại ở chat mới |
| Dáng gần đúng nhưng tỉ lệ sai | Hint bị méo hoặc chưa đủ rõ | Cắt lại hint rồi làm lại — **đừng cố mô tả bằng lời** |
| Sheet quá 8 ô thường hỏng | Model mất khả năng giữ lưới | Tách thành 2 sheet, nhưng **không tách giữa một bộ phải khớp nhau** |

---

## 9. Ba điều nên nhớ

1. **Ảnh đã duyệt là thứ duy nhất tính.** `PROMPT.md` tồn tại không có nghĩa là art đã xong.
2. **Sửa `batch.json`, không sửa `PROMPT.md`.** Sửa tay vào PROMPT.md sẽ mất ở lần `prep` kế tiếp.
3. **Một asset chỉ thuộc một sheet.** Nhờ vậy làm lại một con không kéo theo mấy con kia.
