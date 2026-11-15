# PROS / CONS — Phương án B: Hybrid (4 Area 2D, Adventure 3D)

Ngày: 2026-11-11. Trọng số 1–5 (5 = ảnh hưởng lớn tới quyết định). Tin cậy: Cao / Vừa / Thấp. Nhãn: [DỮ LIỆU] · [NHẬN ĐỊNH] · [GIẢ ĐỊNH].

Phạm vi: Farm, Garden, Aquarium, Cloud, Sảnh giữ Phaser 2D. Adventure (trận, có thể cả bản đồ) dùng renderer 3D runtime trong Electron, model có rig và clip.

## Lợi

| # | Lợi | Trọng số | Bằng chứng | Tin cậy |
|---|---|---|---|---|
| B1 | Nội suy mọi tư thế: hết vấn đề thiếu khung trung gian | 4 | [NHẬN ĐỊNH] đối chiếu giới hạn ở `docs/decisions/050` bổ sung (5) | Cao (nếu có rig và clip tốt) |
| B2 | Camera cho Ultimate: áp sát, xoay, đổi góc | 3 | [NHẬN ĐỊNH]; `02_PHAN_TICH_ANIMATION_SKILL.md` | Cao |
| B3 | Một clip dùng cho mọi sinh vật cùng skeleton; thêm loài rẻ hơn về animation | 3 | [NHẬN ĐỊNH] | Vừa |
| B4 | Chỉ đụng một Area; 4 Area còn lại và art của chúng không đổi | 4 | [DỮ LIỆU] luật "Area không import Area khác", `docs/AGENT_RULES.md` §3 | Cao |
| B8 | Chỗ nối đã có sẵn: `bindAdventureStage`, `BattleSceneDeps`, `AdventureSceneDeps` (scene chỉ đọc state thuần); B chỉ đụng khoảng 9–11 % dòng của `src/` | 3 | [DỮ LIỆU] `01_HIEN_TRANG.md` mục 3, 8.2 | Cao |
| B5 | Logic trận giữ nguyên: thời gian thuần ở `ui/battle*.ts`, Phaser chỉ phát cue | 4 | [DỮ LIỆU] `docs/animation-review/ANIMATION_REVIEW_FEEDBACK.md` phần đầu | Cao |
| B6 | Lớp dữ liệu trung lập dùng lại được: beat, mốc clip, cử chỉ, 112 kịch bản | 3 | [DỮ LIỆU] `docs/decisions/050` bổ sung 2026-11-05 | Cao |
| B7 | Ánh sáng, bóng, chiều sâu sân trận tự nhiên | 2 | [NHẬN ĐỊNH] | Vừa |

## Hại

| # | Hại | Trọng số | Bằng chứng | Tin cậy | Cách giảm |
|---|---|---|---|---|---|
| b1 | Cần 43+ model có rig biến dạng đẹp và clip non-humanoid; AI hiện dừng ở mức 2–4, animation non-humanoid gần như không | 5 | [DỮ LIỆU + NHẬN ĐỊNH] `05_CONG_NGHE_AI_3D.md` mục 5 | Vừa | Thuê người làm rig / animation; hoặc giảm số sinh vật |
| b2 | Lần duy nhất dự án thử hình 3D (U1) không đẹp hơn tranh | 5 | [DỮ LIỆU] `docs/studio/STATUS.md` | Cao (cho cách dựng bằng code); Thấp (cho image-to-3D, chưa thử) | Prototype trước khi cam kết |
| b3 | Hai ngôn ngữ hình trong một game: người chơi đi từ Farm tranh vẽ sang Adventure 3D | 4 | [NHẬN ĐỊNH]; plan Studio đã đặt luật "không trộn hai phong cách trong một màn" [DỮ LIỆU] `docs/UNITY_STUDIO_PLAN.md` §6 | Vừa | Toon shader + viền + bảng màu chung; render ở camera cố định giống tranh |
| b4 | Renderer thứ hai cạnh Phaser: thêm dependency (trái tinh thần "không thêm thư viện nếu không cần"), hai đường nạp asset, hai bộ lỗi | 4 | [DỮ LIỆU] `docs/AGENT_RULES.md` §3; `package.json` chỉ có Phaser | Cao | Cô lập trong `src/areas/adventure/scene3d/`; guard kiến trúc |
| b5 | Bỏ 44 rig, 814 layer, `src/ui/puppet`, phần Phaser của trận (~2450 dòng), 266 key pose chỉ còn làm tham chiếu | 3 | [DỮ LIỆU] `docs/UNITY_STUDIO_PLAN.md` §2; đếm dòng 2026-11-11 | Cao | Giữ làm fallback khi model chưa có |
| b6 | 21 chiến binh của trận cũng xuất hiện ở Farm / Aquarium dưới dạng ảnh 2D; cùng một con có hai dạng thể hiện | 3 | [DỮ LIỆU] `01_HIEN_TRANG.md` mục 8.2 | Cao | Model phải bám tranh rất sát |
| b7 | Máy dự án 6 GB VRAM không chạy được model image-to-3D và auto-rig tốt; phải đưa tranh lên dịch vụ ngoài hoặc thuê GPU | 3 | [DỮ LIỆU] đo máy; `05` mục 2a, 2e | Cao | Cloud có điều khoản rõ; GPU thuê |
| b8 | Rủi ro giấy phép mới: weights, dịch vụ, điều khoản lãnh thổ | 3 | [DỮ LIỆU] `07_BAN_QUYEN.md` | Vừa | Chỉ dùng mục "chấp nhận được" trong `07`; sổ nguồn gốc |
| b9 | Lùi GĐ15: ước 85–170 phiên agent so với 16–31 của A | 4 | [GIẢ ĐỊNH] `08` | Thấp | Làm sau 1.0 |
| b10 | VFX sheet 2D đặt trong cảnh 3D thành billboard; muốn "có chiều sâu" phải làm lại | 2 | [NHẬN ĐỊNH] | Vừa | Giữ billboard cho bản đầu |
| b12 | HUD trận là DOM và DOM quyết định vị trí đơn vị theo px; với camera 3D chiều này phải đảo (chiếu 3D ra màn hình cho nameplate, dấu ngắm, số bay) | 3 | [DỮ LIỆU] `01_HIEN_TRANG.md` mục 8.2; decision 042 | Cao | Giữ camera trực giao cố định ở bản đầu |
| b11 | Hiệu năng trên GPU tích hợp của người chơi chưa đo | 2 | [GIẢ ĐỊNH] | Thấp | Đo ở prototype |

## Nhận định chung

B là phương án duy nhất mà 3D đặt đúng chỗ có lợi (Adventure). Nhưng lợi ích B1–B3 nằm sau b1, tức sau bước mà cả AI lẫn đội hiện tại yếu nhất. Nếu prototype cho thấy b1 và b2 vượt qua được, B đáng xét lại, hợp lý nhất là sau bản 1.0. Nếu không, phần lợi của B có thể lấy một phần qua A+ (render tranh trung gian từ model) với giá thấp hơn nhiều.

## Điều chưa xác minh

- Chất lượng image-to-3D và auto-rig trên tranh Sobi: chưa thử.
- Cách ghép renderer 3D với sân Phaser và HUD DOM hiện tại: chưa có thiết kế, chưa đo bộ nhớ.
- Phản ứng của người chơi với hai phong cách: không có dữ liệu.

## Cần chủ dự án cung cấp/duyệt

- Có chấp nhận thêm một thư viện 3D vào bản ship không (đụng `docs/AGENT_RULES.md` §3, cần decision mới).
- Có sẵn sàng thuê người làm rig / animation 3D không.
- Có cho phép đưa tranh lên dịch vụ ngoài không.
