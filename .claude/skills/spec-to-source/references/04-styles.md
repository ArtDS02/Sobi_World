# 04 — Chia file style theo từng phần

> Vấn đề cần chặn: **một file style khổng lồ, sửa nút ở màn A làm vỡ màn B, và không ai biết
> cho tới khi khách báo.**
>
> Tài liệu này áp dụng cho CSS, SCSS, Less, hay CSS-in-JS có tách file. Cú pháp ví dụ là SCSS.

---

## 1. Hình dạng thư mục

```text
styles/
├── main.scss                 # gốc — CHỈ có @use, KHÔNG có rule nào
│
├── core/                     # dùng chung, ảnh hưởng toàn site
│   ├── _index.scss           # @forward theo ĐÚNG thứ tự cascade (§3)
│   ├── _tokens.scss          # màu, font, spacing, breakpoint, z-index — CHỈ khai báo
│   ├── _functions.scss       # hàm tính (ví dụ quy đổi kích thước)
│   ├── _mixins.scss          # mixin dùng lại
│   ├── _reset.scss           # reset + style cho tag
│   ├── _layout.scss          # khung trang: header, footer, grid chính
│   ├── _components.scss      # component dùng chung: nút, thẻ, ô nhập
│   └── _utilities.scss       # lớp đơn mục đích .u-*
│
└── features/                 # mỗi màn / mỗi feature MỘT FILE
    ├── _index.scss           # @forward từng file bên dưới — thiếu dòng = không ship
    ├── _cart.scss
    ├── _checkout.scss
    └── _profile.scss
```

Nếu dự án đặt style **cạnh** component (`view/cart/cart.css`) thì vẫn giữ nguyên tinh thần:
**một feature một file, một gốc scope, khai báo tường minh.** Chỉ đổi vị trí vật lý.

---

## 2. Quy tắc "không gom chung"

### 2.1. Một feature = một file. Không ngoại lệ vì "chỉ 10 dòng"

10 dòng hôm nay là 200 dòng sau ba tháng, và lúc đó không ai tách nữa.

### 2.2. File gốc không chứa rule

`main.scss` chỉ có `@use`. Một rule lọt vào đó là rule không ai tìm ra.

### 2.3. Feature không được style thứ của feature khác

```scss
// ❌ file _cart.scss động vào header
.cart { }
.header__logo { width: 120px; }   // sửa cart làm vỡ header

// ✅ cần header khác đi khi ở màn cart → đặt biến thể, khai báo ở đúng chỗ của header
// core/_layout.scss
.header--compact .header__logo { width: 120px; }
```

Quy tắc: **file style chỉ được chứa selector bắt đầu bằng gốc scope của chính nó** (hoặc biến thể
được khai báo tường minh). Script kiểm tra ở [06](06-verification.md) soi đúng điều này.

### 2.4. Sửa component dùng chung là hành động có cân nhắc

`core/_components.scss` ảnh hưởng toàn site. Trước khi sửa: grep xem có bao nhiêu nơi dùng.
Cần một biến thể riêng cho một màn → thêm **modifier**, đừng đổi mặc định.

```scss
// ❌ đổi mặc định vì 1 màn cần khác
.c-button { border-radius: 0; }

// ✅ thêm biến thể
.c-button--square { border-radius: 0; }
```

### 2.5. Khi nào một khối được "lên" core

Khi nó xuất hiện ở **feature thứ hai** — không phải thứ ba.

Đợi tới lần thứ ba là quá muộn: lúc đó đã có ba bản sao lệch nhau, và việc hợp nhất trở thành
một cuộc thương lượng chứ không còn là refactor. Lần thứ hai là lúc rẻ nhất.

---

## 3. Thứ tự cascade là load-bearing

`core/_index.scss` phải `@forward` theo thứ tự có chủ ý:

```scss
// core/_index.scss
// THỨ TỰ NÀY QUAN TRỌNG — đọc comment trước khi sắp lại.
@forward 'tokens';       // không sinh CSS, phải đứng đầu để mọi file sau dùng được
@forward 'functions';
@forward 'mixins';
@forward 'reset';        // đứng trước mọi thứ sinh CSS
@forward 'layout';
@forward 'components';
@forward 'utilities';    // CUỐI — utility phải thắng component ở cùng specificity
```

Hai điểm bắt buộc:

- **Thứ gì không sinh CSS (token, function, mixin) đứng đầu.**
- **Thứ cần thắng tie về specificity đứng cuối.** Utility ở cuối. Nếu có nhóm rule nào khác cũng
  cần thắng (ví dụ hệ animation có giá trị mặc định), nó cũng phải ở cuối và **phải có comment
  giải thích**, nếu không người sau sẽ sắp lại theo alphabet và làm vỡ giao diện âm thầm.

Khi một file cần thắng một mặc định ở cuối cascade, nâng specificity chứ đừng đổi thứ tự:

```scss
// ❌ thua vì source order
.cart__item { --delay: 300ms; }

// ✅ (0,2,0) thắng (0,1,0)
.cart__item.is-animated { --delay: 300ms; }
```

---

## 4. Token — không hard-code giá trị

```scss
// ❌
.cart__total {
  color: #c0392b;
  font-size: 18px;
  margin-bottom: 24px;
}

// ✅
.cart__total {
  color: $c-danger;
  font-size: $fs-lg;
  margin-bottom: $sp-6;
}
```

Giá trị được phép viết thẳng — danh sách đóng, adapter có thể mở rộng:

- `0`
- `1px` cho đường kẻ mảnh
- `50%`, `100%`, `auto`
- `9999px` cho bo tròn hoàn toàn
- `translate(-50%, -50%)`
- `letter-spacing` theo `em`

Ngoài danh sách đó, **mọi giá trị đều là token**. Một màu xuất hiện lần thứ hai dưới dạng hex là
một màu sẽ bị lệch ở lần thứ ba.

---

## 5. Breakpoint — ít và cố định

Khai báo **một** bộ breakpoint ở token, dùng mixin để gọi. Không tạo breakpoint mới giữa chừng.

```scss
// ❌ mỗi file một mốc — không bao giờ khớp nhau
@media (max-width: 768px)  { }
@media (max-width: 992px)  { }
@media (max-width: 1100px) { }

// ✅ một bộ, gọi qua mixin
@include mq(md) { }
```

Số lượng breakpoint nên đếm trên một bàn tay. Adapter chốt danh sách.

**Media query nằm cạnh rule nó sửa**, không dồn xuống cuối file:

```scss
// ✅ đọc một mạch là hiểu, xoá block là xoá cả responsive của nó
.cart__list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  @include mq(md) {
    grid-template-columns: 1fr;
  }
}
```

Gom hết media query xuống cuối file nghĩa là mỗi lần sửa phải sửa hai nơi cách xa nhau — và
lần thứ ba sẽ quên một nơi.

> **Bẫy đi kèm:** nếu ở desktop bạn nâng specificity (ví dụ `#page .cart__list`) thì ở media query
> cũng **phải** nâng tương đương. Nếu không, rule desktop `(0,2,0)` thắng rule mobile `(0,1,0)`
> ngay *bên trong* media query, và giao diện mobile hỏng một cách rất khó thấy vì bố cục vẫn "gần đúng".

---

## 6. Mẫu một file feature

```scss
// styles/features/_cart.scss
//
// Cart screen. Owns every `.cart*` rule.
// Shared button/card styles live in core/_components.scss — extend with a
// modifier there rather than overriding here.

@use '../core' as *;

.cart {
  padding: $sp-6 $sp-4;

  &__list {
    display: grid;
    gap: $sp-3;

    @include mq(md) {
      gap: $sp-2;
    }
  }

  &__item {
    display: flex;
    align-items: center;
  }

  &__total {
    font-size: $fs-lg;
    color: $c-text-strong;

    &--discounted {
      color: $c-danger;
    }
  }

  // Descendant viết đầy đủ — `&` thứ hai sẽ expand lại cả `.cart`
  &__item:hover .cart__remove {
    opacity: 1;
  }
}
```

Rồi thêm vào barrel — **bước này quên là file không bao giờ được nạp**:

```scss
// styles/features/_index.scss
@forward 'cart';
```

---

## 7. Checklist thêm một màn/feature mới

1. [ ] Tạo `features/_<tên>.scss`
2. [ ] Dòng đầu: `@use '../core' as *;`
3. [ ] Bọc toàn bộ trong **một** gốc scope
4. [ ] Thêm `@forward '<tên>';` vào `features/_index.scss` ← **hay quên nhất**
5. [ ] Không selector nào ra ngoài gốc scope
6. [ ] Không giá trị hard-code ngoài danh sách cho phép
7. [ ] Media query nằm cạnh rule, dùng mixin breakpoint chung
8. [ ] Component dùng lại → lấy từ core, không chép lại

---

## 8. Anti-pattern

| ❌ | Hậu quả | ✅ |
|---|---|---|
| `main.css` 3000 dòng | Sửa là run rẩy; conflict liên miên | 1 file/feature |
| `.title`, `.box`, `.active` toàn cục | Va chạm câm lặng giữa các màn | `.cart__title`, `.is-active` trong scope |
| File cart style `.header__logo` | Sửa cart vỡ header | Modifier khai ở chỗ của header |
| `!important` để gỡ specificity | Lần sau cần `!important` mạnh hơn | Giảm nest, dùng modifier |
| Nest 5 cấp | Specificity không gỡ nổi | Tối đa 3 cấp |
| Breakpoint mới mỗi file | Không mốc nào khớp nhau | Một bộ ở token |
| Media query dồn cuối file | Sửa 2 nơi, lần 3 quên 1 nơi | Đặt cạnh rule |
| Copy component vì "chỉ khác màu" | 3 bản lệch nhau | Modifier |
| Sắp lại barrel theo alphabet | Vỡ cascade âm thầm | Comment giải thích thứ tự |
| Thêm file quên `@forward` | "Style không có tác dụng" | Kiểm barrel trước tiên |
