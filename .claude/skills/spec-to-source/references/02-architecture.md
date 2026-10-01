# 02 — Kiến trúc & phân chia file

> Mục tiêu duy nhất của tài liệu này: **sửa một chỗ không làm vỡ chỗ khác.**
> Mọi quy tắc dưới đây đều phục vụ mục tiêu đó.

---

## 1. Phân tầng — quy tắc phụ thuộc một chiều

Đặt tên tầng theo dự án, nhưng hình dạng luôn là:

```text
┌─────────────────────────────────────────────┐
│  VIEW        giao diện, render, sự kiện DOM │  ── được import từ mọi tầng dưới
├─────────────────────────────────────────────┤
│  ADAPTER     store, controller, I/O, mạng   │  ── nơi DUY NHẤT chạm thế giới bên ngoài
├─────────────────────────────────────────────┤
│  DOMAIN      luật nghiệp vụ, tính toán      │  ── THUẦN. Không I/O, không global, không thời gian thật
├─────────────────────────────────────────────┤
│  CONFIG      hằng số, token, kiểu dữ liệu   │  ── không phụ thuộc gì
└─────────────────────────────────────────────┘

Mũi tên import CHỈ đi xuống. Không bao giờ đi lên, không bao giờ vòng.
```

### Vì sao tầng DOMAIN phải thuần

Thuần = cùng đầu vào cho cùng đầu ra, không đọc đồng hồ, không sinh số ngẫu nhiên, không chạm
lưu trữ. Hệ quả thực tế:

- Test được **không cần** mở app, không cần mock trình duyệt.
- Tái lập được bug: chỉ cần đầu vào, không cần "lúc đó máy đang ở trạng thái gì".
- Đổi giao diện không đụng luật; đổi luật không đụng giao diện.

Cách làm: **inject** mọi thứ không thuần (`now`, `rng`, `storage`, `fetch`) từ tầng ADAPTER xuống.

```ts
// ❌ domain tự lấy thời gian → không test được, không tái lập được
export function advance(state: State) {
  const dt = Date.now() - state.lastAt;
}

// ✅ thời gian là tham số
export function advance(state: State, now: number): State {
  const dt = now - state.lastAt;
}
```

### Ngoại lệ phải được khai báo

Đôi khi một file trong DOMAIN buộc phải chạm API bên ngoài (ví dụ lớp lưu trữ mà spec xếp
trong domain). **Cô lập vào đúng một file**, ghi vào `DECISIONS.md` loại `ARCH`, và thêm
ngoại lệ đó vào cấu hình lint — chứ không bỏ luôn rule.

---

## 2. Một file = một trách nhiệm

### Kiểm tra bằng câu hỏi

> "Mô tả file này bằng **một** câu không có chữ 'và'."

Không làm được → tách. Ví dụ: *"validate đơn hàng **và** tính tiền thưởng"* → hai file.

### Ngưỡng cứng

| Ngưỡng | Mặc định | Ý nghĩa |
|---|---|---|
| Dòng / file nguồn | **300** | Vượt → tách, hoặc giải trình trong handover |
| Dòng / hàm | **50** | Vượt → thường là đang làm 2 việc |
| Cấp lồng | **3** | Vượt → tách hàm, hoặc early-return |
| Export / file | **1 khái niệm chính** | Barrel file là ngoại lệ |

Adapter được phép chỉnh các con số này. Nhưng phải có script kiểm — xem `scripts/check-architecture.mjs`.

### Tách theo FEATURE, không tách theo LOẠI KỸ THUẬT

Đây là khác biệt quyết định độ "dễ sửa":

```text
❌ Tách theo loại — sửa 1 feature phải mở 5 thư mục
src/
├── types/        allTypes.ts          ← mọi feature chen nhau trong 1 file
├── utils/        helpers.ts           ← file rác, ai cũng thêm vào
├── components/   Everything.tsx
└── styles/       main.css             ← 3000 dòng, sửa là run rẩy

✅ Tách theo feature — sửa 1 feature chỉ mở 1 thư mục
src/
├── config/                     hằng số + token dùng chung
├── domain/
│   ├── pricing/                giá: quy tắc + test, không biết gì về UI
│   ├── inventory/
│   └── schedule/
├── adapter/
│   ├── store.ts
│   └── persistence/
└── view/
    ├── cart/       cart.ts   cart.css        ← style nằm CẠNH feature
    └── checkout/   checkout.ts checkout.css
```

Quy tắc: **thứ thay đổi cùng nhau thì nằm cạnh nhau.**

### Cấm file "đủ thứ"

`utils.ts`, `helpers.ts`, `common.ts`, `misc.ts`, `shared.ts` — cấm. Mỗi cái là một hố rác
mà ai cũng thêm vào và không ai dám xoá.

Thay bằng tên **theo việc nó làm**: `formatDate.ts`, `clampRange.ts`, `parseQuery.ts`.
Một helper chỉ dùng ở một nơi → để ngay trong file đó, không "cho ra ngoài cho gọn".

---

## 3. Barrel file khai báo tường minh

Mỗi thư mục có nhiều file cùng loại (page, feature, style) cần **một file index liệt kê tường minh**:

```scss
// styles/features/_index.scss
@forward 'cart';
@forward 'checkout';
@forward 'profile';
```

```ts
// domain/index.ts
export * from './pricing';
export * from './inventory';
```

**Thiếu một dòng ở đây thì file đó không bao giờ được nạp.** Đó là **tính năng, không phải lỗi**:
nó buộc việc thêm một feature phải là một hành động có chủ ý, nhìn thấy được trong diff.

> Bẫy: khi đọc "style của tôi không có tác dụng", việc **đầu tiên** cần kiểm là file có nằm trong
> barrel không. Đây là nguyên nhân số 1.

### Thứ tự trong barrel có thể mang ý nghĩa

Với CSS, thứ tự = cascade. Nếu một nhóm rule cần thắng tie về specificity thì nó phải nằm **cuối**.
Nếu thứ tự là load-bearing, **ghi comment ngay trong barrel** nói rõ vì sao — nếu không, session
sau sẽ sắp lại theo alphabet và làm vỡ giao diện một cách âm thầm.

---

## 4. Token hoá — không có hằng số ma thuật

Mọi con số và chuỗi có ý nghĩa nghiệp vụ nằm ở **một** chỗ:

| Loại | Chỗ duy nhất |
|---|---|
| Hằng số nghiệp vụ (giá, thời gian, ngưỡng) | `config/<nhóm>.ts` |
| Token hình ảnh (màu, font, spacing, breakpoint) | file token của hệ style |
| Chuỗi hiển thị | `i18n/<lang>.ts` |
| Đường dẫn asset | manifest, hoặc một hằng gốc |

Kiểm bằng grep, xem [06-verification.md](06-verification.md).

**Spec cho sẵn file config thì chép nguyên văn.** Không đổi tên biến, không "tối ưu", không rút gọn,
không bỏ comment. Comment trong đó thường giải thích *vì sao* con số là như vậy — đó là thứ đắt
nhất trong cả file.

---

## 5. Ranh giới do máy canh

Ghi trong tài liệu là chưa đủ. Cài ít nhất 3 hàng rào:

1. **Lint chặn import sai chiều** — ví dụ `no-restricted-imports` cấm `domain/**` import từ `view/**`.
2. **Lint chặn API cấm trong tầng thuần** — cấm `Date.now()`, `Math.random()`, `window`, `document`
   trong `domain/**`.
3. **Script kiểm cấu trúc** — kích thước file, file mồ côi (không ai import), barrel thiếu dòng.

Ngay sau khi cài, **thử phá một lần** để chứng minh hàng rào hoạt động, rồi hoàn tác. Dán kết quả
thử vào handover. Một hàng rào chưa từng chặn được gì thì chưa chắc đang chạy.

---

## 6. Thứ tự xây dựng

```text
CONFIG  →  DOMAIN  →  ADAPTER  →  VIEW
 token     luật       store/IO    giao diện
 kiểu      test đi     lưu trữ
           cùng code
```

Lý do: mỗi tầng chỉ phụ thuộc tầng dưới nó. Xây ngược lại sẽ phải sửa lui liên tục.

**Nếu spec có nêu thứ tự phát triển riêng — theo spec.** Spec biết rõ chỗ nào phải chứng minh
trước (ví dụ "phải chơi được bằng giao diện thô trước khi làm đồ hoạ"). Đó là những cổng
có chủ ý, không phải thứ tự tuỳ tiện.

---

## 7. Anti-pattern

| ❌ | Vì sao hỏng | ✅ |
|---|---|---|
| `utils.ts` 800 dòng | Không ai dám xoá gì trong đó | 1 file/1 hàm, tên theo việc |
| Type của mọi feature trong `types.ts` | Sửa 1 feature làm dirty cả file, conflict liên miên | Type nằm cạnh feature dùng nó |
| `main.css` 3000 dòng | Sửa nút ở trang A làm vỡ trang B | 1 file style / 1 feature, có scope |
| Domain gọi `fetch`/`localStorage` trực tiếp | Không test được, không tái lập được | Inject từ adapter |
| Import vòng giữa 2 module | Thứ tự khởi tạo thành may rủi | Tách phần chung xuống tầng dưới |
| Barrel `export *` từ file chưa tồn tại | Lỗi build khó hiểu | Thêm dòng barrel cùng lúc tạo file |
| Copy một khối 3 lần "để nhanh" | Lần sửa thứ 4 sẽ sót 1 chỗ | Lần thứ 2 là lúc tách, không phải lần thứ 3 |
| Sửa lõi skill/thư viện dùng chung cho hợp 1 dự án | Dự án sau kế thừa thứ nó không cần | Đặt vào adapter |
