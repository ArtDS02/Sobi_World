# Ủn Ỉn Homemade — Solo Edition

Tài liệu thiết kế + spec kỹ thuật cho một game nuôi heo chơi đơn, chạy offline, dữ liệu lưu trên máy người chơi.

**Trạng thái:** Tài liệu hoàn chỉnh, chưa viết code. Bộ này đủ để một AI agent chạy một lượt ra dự án.

---

## 1. Bản đồ tài liệu

```text
Un_In/
├── README.md                              ← bạn đang ở đây
├── UN_IN_GAME_SPEC_v4_SOLO.md             ← LUẬT CHƠI. Nguồn chân lý về hành vi.
│                                             Có Phụ lục A (config TS), B (i18n vi), C (checklist).
├── archive/
│   └── UN_IN_GAME_SPEC_v3_SOLO.md         ← ĐÃ THAY THẾ. Đừng đọc. Giữ để đối chiếu.
└── asset/
    ├── ASSET_PRODUCTION_STANDARD_v1.md    ← LUẬT VẼ. Format, hướng, state, đặt tên, giao nộp.
    ├── AI_ASSET_GENERATION_PACK.md        ← Prompt dán-là-chạy + quy trình hậu kỳ.
    ├── animals/PIG_CATALOGUE.md           ← 116 concept heo + 129 phụ kiện.
    ├── building/ENVIRONMENT_CATALOGUE.md  ← Công trình, prop, UI, âm thanh.
    └── reference/
        ├── style_reference_pigs.png       ← ẢNH CHUẨN STYLE
        ├── style_reference_pigs_alt.png   ← style thay thế, đã loại
        └── style_reference_environment.png
```

**Thứ tự đọc:**

| Bạn muốn | Đọc |
|---|---|
| Hiểu game là gì | Spec v4 §1 → §3 |
| Code game | Spec v4 toàn bộ, kèm Phụ lục A/B/C |
| Vẽ / sinh asset bằng AI | Production Standard → Generation Pack → 2 catalogue |
| Biết vì sao v3 bị thay | Spec v4 §1 và §19 |

**Quy tắc phân xử khi 2 tài liệu mâu thuẫn:** luật chơi theo spec, luật vẽ theo production standard. Catalogue chỉ nói *vẽ cái gì*, không nói *vẽ thế nào*.

---

## 2. Game này là gì

Nuôi heo, cho ăn, tắm rửa, chữa bệnh, lai giống ra giống hiếm hơn, bán lấy vàng, mở thêm chuồng, sưu tập bộ đồ.

- **PWA (web)** — một codebase cho cả PC và điện thoại, cài được vào màn hình chính, chơi offline hoàn toàn sau lần tải đầu.
- **Chơi đơn tuyệt đối** — không server, không tài khoản, không bạn bè, không gọi mạng lúc chạy. Dữ liệu nằm trên máy người chơi.
- **Không kiếm tiền** — không quảng cáo, không gacha, không mua bằng tiền thật.
- **Thời gian thật** — heo lớn theo đồng hồ, kể cả lúc đóng app. Quay lại sau vài tiếng là có chuyện đã xảy ra.

Vòng lặp lõi:

```text
Đổ đầy máng ăn ──► heo tự ăn và lớn trong lúc bạn đi vắng
        │
        ▼
Quay lại ──► tắm, chữa bệnh, xem độ vui vẻ ──► bán được giá
        │                                          │
        ├──► lai giống ──► giống hiếm hơn ─────────┤
        │                                          ▼
        └──► giao đơn NPC ──► thưởng vàng ──► bộ đồ, chuồng, giống tốt
```

---

## 3. Cho AI agent chạy dự án — prompt khởi động

Mở một agent trong thư mục dự án **trống** (không phải thư mục này), rồi dán nguyên khối dưới đây. Đính kèm hoặc trỏ tới `UN_IN_GAME_SPEC_v4_SOLO.md`.

```text
Bạn sẽ xây dựng game "Ủn Ỉn Homemade — Solo Edition" từ đầu.

TÀI LIỆU
Đọc TOÀN BỘ UN_IN_GAME_SPEC_v4_SOLO.md trước khi viết dòng code đầu tiên,
bao gồm cả Phụ lục A (file config viết sẵn), B (toàn bộ chuỗi tiếng Việt)
và C (checklist tự kiểm). Đó là nguồn chân lý. Không tự chế luật chơi đã
được định nghĩa trong đó.

KHÔNG ĐỌC archive/UN_IN_GAME_SPEC_v3_SOLO.md — nó đã bị thay thế và chứa
các giá trị cân bằng sai.

CÁCH LÀM
- Theo đúng thứ tự phát triển ở §16. Không nhảy cóc.
- DỪNG LẠI ở bước 8 và báo cáo. Bước 8 là lúc game phải chơi được bằng
  DOM thuần, chưa có Phaser, chưa có art. Nếu nó chưa vui ở đó thì art
  cũng không cứu được.
- Mọi logic chơi nằm trong src/core/ dưới dạng TypeScript thuần: không DOM,
  không Phaser, không Date.now(), không Math.random(). now và rng luôn được
  inject từ ngoài.
- Viết test cùng lúc với code, không để dồn cuối. Các bảng test ở §14 là
  bắt buộc, đặc biệt §14.1 (golden values) và §14.2 (máng ăn).
- Dùng nguyên văn các file config ở Phụ lục A. Đừng đặt lại số ở chỗ khác.
- Mọi chuỗi tiếng Việt lấy từ Phụ lục B. Không hard-code text ở nơi khác.

ART
Chưa có asset thật. Tạo placeholder: hình chữ nhật bo góc có màu, đặt tên
pig_classic.png, pig_watermelon.png, pig_superhero.png, pig_thienlong.png.
Game PHẢI chạy được trên placeholder. Mọi asset nạp qua
public/assets/manifest/assets.json, không hard-code đường dẫn ở bất kỳ đâu
— art thật sẽ được thay vào sau mà không sửa code.

KHÔNG LÀM
Backend, database server, tài khoản, analytics, quảng cáo, mua bán bằng
tiền thật, multiplayer, gọi mạng lúc runtime. Không bắt đầu §20 (Backlog).
Không sao chép sprite, âm thanh, logo, UI hay code từ bất kỳ game thương
mại nào.

KHI CHƯA RÕ
Chọn phương án đơn giản nhất và ghi lại vào README.md mục
"Implementation assumptions". Đừng hỏi lại những gì tài liệu đã trả lời.

XONG THÌ
Chạy hết checklist ở Phụ lục C và báo cáo từng dòng.
```

### Nếu muốn chia nhỏ

Một lượt duy nhất là khả thi nhưng dài. Cắt theo 4 phase ở §15 cũng được, mỗi phase một lượt agent:

| Phase | Bước §16 | Xong khi |
|---|---|---|
| 1 | 1–8 | Chơi được bằng DOM thuần, test lõi xanh |
| 2 | 9 | Máng ăn, shop, cấp độ, chuồng |
| 3 | 10–11 | Lai giống, đơn hàng, bộ sưu tập |
| 4 | 12–16 | Phaser, âm thanh, PWA, offline |

Cách này tốt hơn nếu bạn muốn chơi thử sau mỗi phase — mà bạn nên làm thế.

---

## 4. Sinh asset bằng AI

Quy trình đầy đủ ở `asset/AI_ASSET_GENERATION_PACK.md`. Tóm tắt:

```text
1. SINH       ─ dán prompt có sẵn (đã điền concept cho từng con)
2. SÀNG LỌC   ─ loại ngay theo checklist §2, mất 10 giây
3. HẬU KỲ     ─ tách nền, canh đường chân 82%, đặt tên     ← BẮT BUỘC
4. ĐĂNG KÝ    ─ thêm 1 dòng vào assets.json
```

Vài điều quan trọng:

- **Dự trù 3–5 lần sinh cho 1 asset dùng được.** Không model nào ra đúng ngay lần đầu.
- **Phải dùng ảnh tham chiếu (img2img).** Vẽ 116 con heo từ 116 prompt text độc lập sẽ ra 116 style khác nhau — đó đúng là cách `style_reference_pigs_alt.png` lệch style khỏi `style_reference_pigs.png`. Sinh `pig_classic` thật ưng trước, rồi lấy nó làm mốc cho mọi con sau.
- **Heo chỉ vẽ 1 hướng: nhìn ngang, quay phải.** Quay trái là lật ngang lúc chạy. Không vẽ mặt trước, không vẽ lưng. Lý do đầy đủ ở Production Standard §2.
- **Mỗi con heo chỉ cần 2 ảnh** (`idle` + `_sleep`). 6 state còn lại làm bằng code + 8 file `fx_*` dùng chung cho cả 116 con.

Khối lượng để game "trông như hoàn thiện": **38 ảnh** (wave 1). Để shop có hàng và nông trại có cảnh: thêm **33 ảnh** (wave 2).

---

## 5. Những quyết định bạn nên xem lại

Đã chốt sẵn để agent chạy được ngay, nhưng đây là lựa chọn thiết kế chứ không phải chân lý. Bảng đầy đủ ở spec §18.

| # | Câu hỏi | Đang chốt |
|---|---|---|
| Q1 | `cleanAll` có nên cho ăn luôn không? | Không — máng ăn lo phần ăn |
| Q2 | Hết máng, heo hồng kẹt 3 tiếng có quá nặng? | Không — chỉ mất thời gian, không mất gì |
| Q3 | Mở khoá lai heo Thần Thoại ở cấp 10? | Không — nhưng đây là "kết" duy nhất game có |
| Q4 | Giá bộ đồ 2k/6k/15k/40k | Chạy `sim:economy` rồi chỉnh |
| Q5 | Thưởng đơn hàng 1.5/1.8/2.2 lần | Nếu đơn hàng át hẳn việc bán thường thì hạ xuống 1.9 |

Ngoài ra, một lựa chọn art chưa quyết dứt điểm: **chọn style sheet 1 hay sheet 2.** Đang chốt sheet 1 (`style_reference_pigs.png`) vì nó khớp art direction đã viết và thu nhỏ vẫn đọc được. Nếu bạn thích nét mềm của sheet 2 hơn thì được — nhưng phải vẽ lại sheet 1 theo nó trước khi sản xuất số lượng lớn, và sửa Production Standard §1.

---

## 6. Giới hạn đã biết

Ghi ra trước để không bất ngờ:

- **Web không gửi được thông báo nền khi app đã đóng.** Không có "Ủn đẻ rồi!" nhảy lên màn hình khóa. Thay bằng modal tổng kết "Trong lúc bạn vắng mặt" lúc mở lại. Muốn có thông báo thật thì phải bọc Capacitor — kiến trúc này bọc được mà không viết lại gì (spec §20 mục 6).
- **Dữ liệu nằm trên từng trình duyệt, từng máy.** Không đồng bộ giữa điện thoại và máy tính.
- **Safari/iOS có thể xóa dữ liệu site *chưa cài* sau ~7 ngày không dùng.** Với game idle bỏ đi vài ngày, đây là rủi ro thật. Cài PWA vào màn hình chính và xuất file định kỳ mới là lưới an toàn — UI phải nói rõ điều này với người chơi.
- **Client được tin tưởng hoàn toàn.** Không chống gian lận. Người chơi sửa được file lưu nếu muốn — game chơi đơn, không sao.
