# 03 — Đặt tên

> Nguyên tắc chi phối: **đọc tên là đoán được vị trí, và đoán được phạm vi ảnh hưởng khi sửa.**

---

## 1. Ba câu hỏi một cái tên phải trả lời

1. **Nó là gì?** — `PriceCalculator`, không phải `Manager`
2. **Nó thuộc về đâu?** — `cart__total`, không phải `total`
3. **Sửa nó thì ảnh hưởng tới đâu?** — tên có scope trả lời sẵn câu này

Tên không trả lời được câu 3 là tên nguy hiểm: không ai biết sửa nó có làm vỡ gì không,
nên không ai dám sửa, nên code chết dần.

---

## 2. Tên file

| Quy tắc | Ví dụ |
|---|---|
| Tên file = tên thứ chính nó export | `PriceCalculator.ts` export `PriceCalculator` |
| Một kiểu chữ cho một loại, nhất quán toàn repo | module logic `camelCase.ts`; class/component `PascalCase.ts`; style/asset `kebab-case` |
| Không số phiên bản trong tên | ❌ `parser-v2.ts`, `final2.css` — git lo việc đó |
| Không tính từ mơ hồ | ❌ `new-`, `old-`, `temp-`, `simple-`, `basic-` |
| Test nằm cạnh, tên soi gương | `pricing.ts` ↔ `pricing.test.ts` |
| Barrel luôn tên `index` | `index.ts`, `_index.scss` |
| Tiền tố `_` cho file chỉ được import, không tự đứng | `_variables.scss` |

**Tên file phải đoán được từ tên feature.** Nghe "giỏ hàng" phải đoán ra `cart/`. Nếu phải grep mới
tìm được file của một feature, cách đặt tên đang sai.

---

## 3. Tên trong code

```ts
// Hàm: động từ + đối tượng
calculateTotal()   validateOrder()   resolveTrough()

// Boolean: is / has / can / should
isExpired   hasDiscount   canCheckout

// Hằng: SCREAMING_SNAKE, và chỉ ở file config
MAX_RETRY_COUNT   ORDER_WINDOW_MS

// Kiểu: danh từ PascalCase, không tiền tố I
interface Order {}        // ✅
interface IOrder {}       // ❌

// Đơn vị nằm trong tên khi có thể nhầm
timeoutMs   growthSec   widthPx   priceGold
```

Cấm hậu tố rỗng nghĩa: `Manager`, `Helper`, `Util`, `Service`, `Handler`, `Data`, `Info`, `Object`.
Chúng không nói gì. `OrderValidator` nói; `OrderManager` không.

**Cấm viết tắt tự chế.** `usr`, `calc`, `btn` trong tên public. Viết tắt chỉ chấp nhận khi nó là
thuật ngữ chuẩn của lĩnh vực (`id`, `url`, `html`, `rng`).

---

## 4. Tên class CSS — quy ước có scope

Vấn đề cần chặn: **một class tên chung chung sửa ở một chỗ làm vỡ ba chỗ khác.**

### BEM là mặc định

```
.block              đơn vị độc lập, có nghĩa khi đứng một mình
.block__element     thành phần bên trong, KHÔNG có nghĩa khi tách khỏi block
.block--modifier    biến thể của block
.block__el--mod     biến thể của element
```

```scss
.order-card { }                 // block
.order-card__title { }          // element
.order-card__title--muted { }   // modifier của element
.order-card--compact { }        // modifier của block
```

### Bốn quy tắc cứng

1. **Tối đa 2 cấp: block → element.** Không có `.a__b__c`.
   Cần cấp 3 nghĩa là `b` đáng được làm block riêng.
2. **Không class chung chung ở phạm vi toàn cục.** `.title`, `.box`, `.active`, `.red`, `.left`
   — cấm, trừ khi nằm trong tập utility đã khai báo tường minh và có tiền tố (`.u-hidden`).
3. **Không style theo tag ở phạm vi feature.** `#cart h2 { }` sẽ bắt mọi `h2` lọt vào, kể cả
   của component dùng chung. Đặt class.
4. **Không nest quá 3 cấp selector.** Nest sâu = specificity cao = phải `!important` để gỡ.

### Tiền tố theo vai trò

Tiền tố làm vai trò của class nhìn thấy được ngay trong HTML, và làm việc grep trở nên đáng tin:

| Tiền tố | Vai trò | Ai được sửa |
|---|---|---|
| *(không)* | Block của feature | Chủ feature đó |
| `c-` | Component dùng chung | Sửa là ảnh hưởng toàn site — cần cân nhắc |
| `u-` | Utility đơn mục đích | Chỉ thêm, gần như không sửa |
| `is-` / `has-` | Trạng thái do JS bật/tắt | JS và CSS cùng sở hữu |
| `js-` | **Chỉ** để JS bám vào, CSS không được style | JS sở hữu hoàn toàn |

`js-` là quy ước rẻ mà cứu nhiều: nó tách "chỗ bám của JS" khỏi "chỗ style", nên đổi giao diện
không làm chết chức năng.

```html
<button class="order-card__submit c-button c-button--primary js-submit-order is-disabled">
```

> Adapter được phép đổi bộ tiền tố. Nhưng **phải chọn một bộ và giữ nguyên toàn repo.**
> Hai quy ước cùng tồn tại tệ hơn một quy ước xấu.

---

## 5. Scope của feature

Mỗi feature có **một** gốc scope, và mọi rule của nó nằm trong gốc đó:

```scss
// styles/features/_cart.scss
.cart {
  &__list { }
  &__item { }
  &__total { }
}
```

hoặc, nếu khung trang đã có id/data-attribute:

```scss
[data-screen="cart"] {
  .cart__total { }
}
```

### Hai cái bẫy của scope lồng

**Bẫy 1 — gốc scope match nhiều hơn một phần tử.** Nếu cùng một định danh được in ở hai nơi
(ví dụ cả phần tử ngoài lẫn phần tử trong), thì thuộc tính box (padding, margin, background) đặt ở
gốc sẽ áp **hai lần**. Đặt chúng vào một wrapper bên trong.

**Bẫy 2 — `&` thứ hai trong một scope lồng sẽ expand lại cả gốc.**

```scss
// ❌ compile thành `.cart .cart__item:hover .cart .cart__icon` — không bao giờ match
.cart {
  .cart {
    &__item:hover &__icon { opacity: 1; }
  }
}

// ✅ viết descendant đầy đủ
.cart {
  .cart__item:hover .cart__icon { opacity: 1; }
}
```

---

## 6. Tên nhất quán xuyên tầng

Cùng một khái niệm phải cùng một tên ở **mọi** tầng. Nếu spec gọi là `trough` thì:

```text
config      TROUGH_CAPACITY
domain      resolveTrough()
adapter     troughSlice
view        .trough-gauge / trough-gauge.css
i18n        trough.label
test        trough.test.ts
```

Không đổi thành `feeder` ở tầng view vì "nghe hay hơn". Một khái niệm hai tên là chi phí vĩnh viễn:
mọi lần grep đều thiếu một nửa kết quả.

**Nếu spec đặt tên xấu — vẫn dùng tên của spec.** Ghi vào `DECISIONS.md` nếu muốn đề xuất đổi, và
chỉ đổi khi đổi đồng loạt ở mọi tầng trong một increment riêng.

---

## 7. Checklist đặt tên

- [ ] Đọc tên file là đoán được nội dung
- [ ] Đọc tên class là biết nó thuộc feature nào
- [ ] Không có `utils` / `helper` / `manager` / `misc` / `common`
- [ ] Không có class chung chung ở phạm vi toàn cục
- [ ] Không có `.a__b__c`
- [ ] Đơn vị nằm trong tên khi có thể nhầm
- [ ] Một khái niệm dùng đúng một tên ở mọi tầng
- [ ] Bộ tiền tố nhất quán toàn repo
