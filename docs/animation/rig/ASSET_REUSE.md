# Asset Reuse Assessment — animation sinh vật (decision 050)

Nguyên tắc (chủ dự án, 2026-11-05): **không hy sinh chất lượng để dùng lại asset cũ.** Nhóm A = dùng tốt; B = dùng được nếu sửa (ghi rõ sửa gì); C = không dùng cho animation, cần asset mới (yêu cầu ở `art_inbox/`).

## 1. Sinh vật (thân nhân vật)
| Asset | Số lượng | Nhóm | Lý do | Dùng tiếp vào việc gì |
|---|---|---|---|---|
| Key pose trận `cb_<art>_<pose>` (props/combat) | 43 con × 6 | **C** cho animation thân | Ảnh phẳng 1 lớp: không tách được bộ phận (phần bị che không tồn tại), 6 pose vẽ riêng không nhất quán tỉ lệ / góc → đổi pose là nhảy hình | **Giữ** làm: portrait cut-in, thẻ / hồ sơ chiến binh, **tham chiếu phong cách + tỉ lệ** cho layer mới, dự phòng khi con đó chưa có rig |
| Ảnh gốc heo Farm `pigs/base/<id>.png` + `_sleep` / `_wake` | 89 + 178 | **A** cho UI / Farm hiện tại, **C** cho rig | Như trên; chất lượng vẽ tốt, đúng phong cách | Tham chiếu phong cách bắt buộc khi vẽ layer (giữ nhận diện từng giống) |
| Ảnh cá Aquarium `props/fish_*.png` | 12+ | **A** UI / bơi hiện tại, **C** cho rig | Ảnh phẳng; cá cần thân uốn + vây tách | Tham chiếu |
| Quái `props/enemy_*.png` | 22 | **C** cho rig | Ảnh phẳng | Tham chiếu; làm rig theo `ROADMAP.md` R2 |
| Bộ phận **rig-proof** (vector, agent vẽ) `asset/rigs/<rig>/<rig>.svg` → `props/rig/<rig>/` | 4 rig, 80 ảnh | **B** (tạm thời) | Đúng cấu trúc, đúng khớp, đủ mặt — để kiểm chứng rig; **nét vẽ đơn giản hơn hẳn art Farm** (không có lông, bóng mềm vẽ tay) → không đạt chất lượng ship. Manifest ghi `placeholder` → `assets:release` chặn | Thay bằng layer vẽ tay theo `art_inbox/rig_*.md` — **cùng tên layer, cùng canvas**: không đổi code, không đổi clip (chỉ chỉnh `at` nếu khớp lệch) |

## 2. VFX
| Asset | Nhóm | Ghi chú |
|---|---|---|
| Strip `fx_*` 4–8 khung (22 + `fx_wave_rise`) | **A** | Flipbook cho khoảnh khắc đổi hình; giữ nguyên |
| Hạt `fxs_*` (24) | **A** | |
| Vật thể `fxp_*` (48) | **A** khi là vật thể bay / rơi (đá, giáo, mũi tên); **B** khi là hình chủ đạo đổi hình (cần flipbook, decision 049 pilot) | Theo `scenarios/ASSETS.md` |
| `fxp_octo_tentacle`, `fxp_turtle_mountain` (vật thể triệu hồi) | **A** | Là VFX của skill, không phải thân sinh vật |
| Biểu tượng trạng thái `st_*` (24) | **A** | |

## 3. Quyết định cho 4 prototype
| Rig | Asset cũ | Quyết định | Yêu cầu |
|---|---|---|---|
| `pig_boar` (Heo Rừng, quadruped) | `cb_pig_boar_*`, `pig_boar.png` | C → layer mới | `art_inbox/rig_pig_boar.md` |
| `pig_turtle` (Heo Rùa, heavy) | `cb_pig_turtle_*` (mai đổi vị trí giữa pose) | C → layer mới | `art_inbox/rig_pig_turtle.md` |
| `fish_betta` (Cá Betta, aquatic) | `cb_fish_betta_*` | C → layer mới (thân + vây vẽ duỗi thẳng để trải lên dải) | `art_inbox/rig_fish_betta.md` |
| `octopus` (Bạch Tuộc, cephalopod) | `props/fish_octopus.png` (Aquarium) | C → layer mới; bám bảng màu cam của ảnh Aquarium để giữ nhận diện | `art_inbox/rig_octopus.md` |

## 4. Vì sao không "tách ảnh cũ bằng code"
Cắt ảnh phẳng theo vùng (đầu, chân) để dựng rig sẽ để lỗ ở chỗ bị che khi bộ phận xoay, viền cắt cứng, và chân xa / gần dính nhau. Che lỗ bằng tween / hạt chính là cách làm cũ mà chủ dự án đã bác. → Không làm.
