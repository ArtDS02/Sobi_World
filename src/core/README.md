# src/core — lõi thuần của thế giới

Không import `systems/`, `areas/`, `ui/`, `app/`; không DOM, Node API, `Date.now()`, `Math.random()` (`now`/`rng` luôn inject).

| Thư mục | Việc |
|---|---|
| `save/` | save world v8, migration v1→v8, mã hóa/xuất nhập |
| `world/` | game store: vòng lặp, autosave, bù offline, ghi save (lỗi ghi không bị nuốt) |
| `area-registry/` | đăng ký Area bằng manifest; hook init/simulate/migrations |
| `content/` | `loadContent`: kiểm schema + tra cứu |
| `economy/` | ví (Coins/Gems/Event Tokens), một nơi ghi Transaction |
| `inventory/`, `items/` | túi đồ chung (ô + stack), định nghĩa item |
| `progression/` | level theo Area, World Development, điều kiện mở khóa |
| `assets/` | manifest asset (chỉ asset), tra theo id |
| `config/` | cấu hình đọc từ `content/` |
