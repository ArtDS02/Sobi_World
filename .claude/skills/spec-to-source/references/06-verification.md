# 06 — Cổng kiểm tra

> Nguyên tắc: **thứ gì kiểm được bằng lệnh thì phải kiểm bằng lệnh.**
> "Tôi đã tuân thủ quy ước" không phải bằng chứng. Output của một lệnh mới là bằng chứng.

---

## 1. Cổng mỗi increment

Chạy trước khi commit. Adapter điền lệnh cụ thể.

```bash
<lệnh typecheck>     # 0 lỗi
<lệnh lint>          # 0 lỗi
<lệnh test>          # tất cả xanh, KỂ CẢ test của increment trước
<lệnh build>         # thành công
node .claude/skills/spec-to-source/scripts/check-architecture.mjs
```

Cộng thêm:

- [ ] `git diff --stat` — mọi file thuộc phạm vi task; file ngoài phạm vi đã revert (không giải thích trong chat)
- [ ] Không file mới nào vượt ngưỡng dòng
- [ ] File style mới đã có dòng trong barrel
- [ ] Acceptance criteria của increment này đạt hết

---

## 2. Grep guard — kiểm tra tĩnh

Đây là bộ kiểm rẻ nhất và bắt được nhiều lỗi nhất. Adapter chỉnh đường dẫn cho khớp dự án.

```bash
# 1. Tầng thuần không chạm thế giới bên ngoài
grep -rn "Date.now()\|Math.random()\|localStorage\|window\.\|document\." src/domain/
# → phải RỖNG

# 2. Không có chuỗi hiển thị ngoài file i18n
grep -rnP "[\p{L}]{3,}" --include=*.ts src/view/ | grep -v "i18n\|import"
# → soi bằng mắt: không được có chuỗi hiển thị cứng

# 3. Không hard-code đường dẫn asset
grep -rn "\.png\|\.webp\|\.mp3" src/ | grep -v "manifest\|loader"
# → phải RỖNG

# 4. Không màu hard-code trong style
grep -rnE "#[0-9a-fA-F]{3,8}\b" styles/features/
# → phải RỖNG (màu nằm ở token)

# 5. Không px cứng cho kích thước responsive (nếu dự án dùng hệ quy đổi)
grep -rnE ":\s*[0-9]+px" styles/features/ | grep -v "1px"
# → soi từng dòng

# 6. Breakpoint lạ
grep -rn "@media" styles/ | grep -v "mq("
# → phải RỖNG nếu dự án bắt dùng mixin

# 7. Tên file/thư mục bị cấm
find src -name "utils.*" -o -name "helpers.*" -o -name "misc.*" -o -name "common.*"
# → phải RỖNG

# 8. File style thiếu trong barrel
for f in styles/features/_*.scss; do
  n=$(basename "$f" .scss); n=${n#_}
  grep -q "forward '$n'" styles/features/_index.scss || echo "THIẾU BARREL: $n"
done

# 9. Nest sâu / selector chung chung
grep -rnE "^\s{12,}&?[.#]" styles/
# → soi: nest quá sâu

# 10. TODO còn sót
grep -rn "TODO\|FIXME\|XXX\|HACK" src/
# → mỗi cái phải có issue hoặc dòng Known issues trong PROJECT_STATUS.md
```

> **Kết quả grep phải được dán vào checkpoint**, không chỉ nói "đã kiểm".

---

## 3. Chứng minh hàng rào đang chạy

Một lint rule chưa từng chặn được gì thì chưa chắc đang bật.

Ngay sau khi cài hàng rào — và **một lần nữa ở cổng cuối** — hãy **cố tình phá**:

```bash
# tạo file vi phạm
echo "export const x = Date.now();" > src/domain/__probe.ts
<lệnh lint>     # PHẢI báo lỗi
rm src/domain/__probe.ts
```

Làm tương tự với: ngưỡng kích thước file, ranh giới import, và assertion quan trọng nhất của
dự án (nếu spec có một assertion chặn build — ví dụ một bất biến về cân bằng — hãy phá nó một
lần để xác nhận build thật sự fail, rồi trả lại).

Dán kết quả vào handover.

---

## 4. Cổng cuối

### 4.1. Checklist của chính spec

Nếu spec có phần tự kiểm, chạy **từng dòng**, báo `PASS`/`FAIL` **kèm bằng chứng**
(lệnh đã chạy, hoặc file + số dòng). Không được đánh `PASS` cho thứ chưa kiểm thật.

### 4.2. 12 điều của một source chuẩn

| # | Kiểm | Bằng cách |
|---|---|---|
| 1 | Mọi quyết định ngoài spec đã ghi | đọc `DECISIONS.md`, đối chiếu `TODO`/`FIXME` |
| 2 | Mỗi file một trách nhiệm | mô tả từng file bằng 1 câu không có "và" |
| 3 | Không file nào quá ngưỡng | `check-architecture.mjs` |
| 4 | Ranh giới do máy canh | thử phá (§3) |
| 5 | Không hằng số ma thuật | grep #4, #5 |
| 6 | Không chuỗi hiển thị lạc chỗ | grep #2 |
| 7 | Mỗi feature một file style có scope | grep #8 + đọc barrel |
| 8 | Class CSS có scope | grep #9 + soi tên |
| 9 | Asset qua manifest | grep #3 |
| 10 | Test đi cùng code, test cũ xanh | chạy toàn bộ test |
| 11 | `PROJECT_STATUS.md` đúng thực tế | đối chiếu `git log` |
| 12 | Người mới đọc là làm tiếp được | đọc `README.md` như người lạ |

### 4.3. Thử "người lạ"

Đọc `README.md` + `PROJECT_STATUS.md` **như thể chưa từng thấy repo này**. Trả lời được không:

- Chạy dự án bằng lệnh gì?
- Thêm một feature mới thì đặt file ở đâu?
- Đổi một hằng số nghiệp vụ thì sửa ở đâu?
- Thêm một chuỗi hiển thị mới thì sửa ở đâu?
- Đang làm dở cái gì?

Câu nào không trả lời được → sửa tài liệu, đó là một phần của cổng cuối.

---

## 5. Cái gì KHÔNG phải verify

- "Code chạy được" — chưa đủ. Cấu trúc sai vẫn chạy được, và chỉ tính tiền sau ba tháng.
- "Test xanh" — chưa đủ, nếu test đã bị nới điều kiện cho xanh.
- "Tôi đã theo quy ước" — không có output lệnh thì không phải bằng chứng.
- "Sẽ dọn sau" — increment sau sẽ xây lên trên nó. Dọn bây giờ, hoặc ghi vào Known issues trong `PROJECT_STATUS.md`
  với lý do cụ thể.

---

## 6. Báo cáo kết quả trung thực

- Test fail → **nói rõ**, trích dòng lỗi (không dán cả log). Đừng lặng lẽ bỏ qua hoặc sửa test.
- Bỏ qua một mục → **nói là đã bỏ qua** và vì sao.
- Chỉ làm được một phần → liệt kê chính xác phần chưa làm.
- Xong và đã kiểm → nói thẳng, không rào đón.

Một cổng kiểm tra bị báo cáo sai còn tệ hơn không có cổng: nó tạo cảm giác an toàn giả.
