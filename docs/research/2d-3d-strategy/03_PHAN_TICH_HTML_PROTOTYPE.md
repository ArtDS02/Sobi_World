# 03 — Phân tích HTML prototype (mục D)

Ngày: 2026-11-11. Nhãn: [DỮ LIỆU] đọc được trong repo · [NHẬN ĐỊNH] · [GIẢ ĐỊNH].

## 1. Kết luận ngắn

**Chưa kiểm tra được HTML prototype.** Không có file prototype 3D nào trong repo, nên toàn bộ mục 3.4 của đề bài ("prototype tốt hơn ở đâu, vì sao vẫn chưa đẹp") **không có bằng chứng trực tiếp**. Báo cáo này không giả định đã xem prototype. Phần "vì sao chưa đẹp" bên dưới dựa trên bằng chứng gần nhất có trong repo: cổng U1 của Sobi Studio (hình 3D dựng bằng code, render toon ra 2D), vốn là thử nghiệm 3D duy nhất đã có ảnh và có chấm điểm.

## 2. Đã tìm ở đâu

| Việc đã làm | Kết quả |
|---|---|
| `git ls-files` lọc `.html`, `.htm`, `.glb`, `.gltf`, `.fbx`, `.obj`, `.blend` | Chỉ có `index.html`, `admin.html` (trang game và trang Admin) [DỮ LIỆU] |
| `find` toàn repo kể cả file chưa theo dõi (trừ `node_modules`, `dist`, `dist-electron`, `release`, `studio/Library`) | Cũng chỉ hai file trên [DỮ LIỆU] |
| Tìm chuỗi `three.js`, `from 'three'`, `babylon` trong `.ts`, `.md`, `.json`, `.html` | Không có kết quả [DỮ LIỆU] |
| `package.json` | Không có thư viện 3D; renderer duy nhất là `phaser ^3.90.0` [DỮ LIỆU] |
| `docs/PROGRESS.md` (grep `prototype`, `3D`) | "prototype" chỉ nói về 4 rig 2D mẫu của decision 050; "3D" chỉ nói về Sobi Studio (decision 051) [DỮ LIỆU] |

Chưa mở: `art_inbox.rar` (file nén chưa theo dõi ở gốc repo, có vẻ là bản nén của `art_inbox/`); thư mục ngoài repo (chưa được cấp quyền).

## 3. Bằng chứng thay thế có trong repo: cổng U1 của Sobi Studio

Đây không phải HTML prototype, nhưng là lần duy nhất dự án đã thử "hình 3D" và đặt cạnh art 2D hiện có trong game.

| Mẫu U1 | Tự chấm "đẹp hơn bản cũ?" | Lý do ghi trong tài liệu |
|---|---|---|
| Heo farm `pig_classic` | Không | "thân tròn bệt, chân cụt, ít duyên hơn tranh cũ; trong game nhìn như đồ nhựa" |
| Cá Vàng `fish_goldfish` | Không | "sạch nhưng nghèo chi tiết; khung bơi đổi rất ít" |
| Chuồng heo `prop_pig_house` | Không | "đơn giản, lệch hẳn với đồ vật xung quanh trong Farm" |
| Lửa `fx_flame_burst` | Không | "lưỡi lửa tròn, kém thanh hơn tranh cũ" |

Nguồn: `docs/studio/STATUS.md` mục "Cổng U1 — tự chấm" [DỮ LIỆU]. Đồng bộ phong cách thì có cải thiện (câu b = Có), nhưng không đủ để đổi cả game (câu c = Không).

Phân rã nguyên nhân theo các lớp mà đề bài yêu cầu:

| Lớp | Vấn đề quan sát được ở U1 | Nhãn | Giải pháp tương ứng |
|---|---|---|---|
| Art direction | Phong cách "đất nặn / đồ chơi" khác tranh Sobi Farm đã duyệt; đặt cạnh nhau thì lệch | [DỮ LIỆU] `docs/UNITY_STUDIO_PLAN.md` §0, STATUS | Chốt style bible bằng ảnh mẫu trước khi dựng; mẫu 3D phải đặt cạnh art cũ trong game |
| Modeling | Hình ghép từ khối SDF bằng toạ độ số: "thân tròn bệt, chân cụt", mỗi asset ~10 vòng chỉnh | [DỮ LIỆU] STATUS | Nguồn hình phải là tranh đã duyệt (image-to-3D hoặc nghệ sĩ), không phải toạ độ gõ tay |
| Topology | Không đánh giá được: U1 dò tia SDF trong compute shader, không có lưới | [DỮ LIỆU] PROGRESS dòng 76 | Chỉ thành vấn đề khi cần rig và biến dạng |
| Material / texture | "như đồ nhựa", "nghèo chi tiết": tô 2–3 bậc trên bề mặt trơn, hoạ tiết thủ tục | [DỮ LIỆU] STATUS | Texture vẽ tay hoặc chiếu từ tranh gốc; gradient mềm, không specular đều |
| Lighting | Một hướng sáng cố định, không bóng đổ, không ánh sáng môi trường | [DỮ LIỆU] plan §4.4 | Ánh sáng 3 điểm có chủ đích, rim ấm, AO nướng sẵn |
| Rendering | Viền nâu bằng vỏ lật + dò cạnh; đạt đồng bộ | [DỮ LIỆU] | Giữ |
| Camera | Trực giao theo góc cố định; không phải nguyên nhân chính | [NHẬN ĐỊNH] | — |
| Animation | "khung bơi đổi rất ít" | [DỮ LIỆU] | Clip có biên độ, có nén / giãn |
| VFX | Hình lửa / nước / chém dựng bằng hình học kém tranh vẽ | [DỮ LIỆU] | Giữ tranh VFX đã duyệt, chỉ thêm chuyển động (đã đạt cổng thử 2026-11-08) |
| Composition | Asset mới đơn lẻ nằm giữa asset cũ | [DỮ LIỆU] | Thay theo Area trọn gói |

Điểm cần rút ra [NHẬN ĐỊNH]: thất bại của U1 là thất bại của cách **tạo hình** (agent dựng hình bằng toạ độ), chưa phải bằng chứng rằng mọi dạng 3D đều kém. Nhưng nó cho thấy "có 3D" không tự làm hình đẹp hơn; các lớp quyết định là art direction, modeling và material, tức đúng các lớp cần con người có mắt nghề.

## 4. Nếu chủ dự án có prototype: sẽ phân tích theo khung nào

1. Tách nguồn cải thiện: chuyển động (có khung trung gian không), camera (có di chuyển, có phối cảnh không), chiều sâu (thị sai, che khuất), ánh sáng, đồng bộ đòn đánh với số sát thương. Mỗi điểm hỏi: bản 2D hiện tại làm được điều này bằng cách rẻ hơn không.
2. Đặt cùng một sinh vật ở ba bản cạnh nhau: tranh duyệt, puppet rig hiện tại, prototype.
3. Chấm theo 10 lớp ở bảng mục 3.

## Điều chưa xác minh

- Có tồn tại HTML prototype hay không, nó là 3D thật (WebGL) hay 2D giả lập chiều sâu.
- Nội dung `art_inbox.rar`.

## Cần chủ dự án cung cấp/duyệt

- File prototype (`.html` kèm thư mục asset đi cùng), hoặc đường dẫn nếu nằm ngoài repo và cho phép đọc.
- Nếu không gửi được file: 3–5 ảnh chụp màn hình ở độ phân giải gốc và một video 20–30 giây có cảnh di chuyển và một đòn đánh.
- Cho biết prototype được làm bằng công cụ nào, model lấy từ đâu (liên quan decision 048).
- Điều gì ở prototype làm chủ dự án thấy "tốt hơn", điều gì thấy "chưa đẹp".
