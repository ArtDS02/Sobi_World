# 064 — Map Diorama 2.5D cho vùng Rừng, chạy trong game

Ngày: 2026-11-19. Nguồn: chủ dự án (cổng G0).

## Bối cảnh
- Ba lần làm lại map Adventure bằng tranh phẳng (v1–v3) vẫn bị chê: phẳng, không có chiều sâu, ít sống, lối đi khó đọc (`docs/research/ADVENTURE_MAP_VFX_LESSONS.md` §1, §10.1).
- Hướng D "Diorama 2.5D" (§10.3): địa hình 3D sinh từ lưới `maps.json`, cây / đạo cụ / quái / đội là tranh đứng có bóng thật, gió, nước shader, ánh sáng theo giờ, hậu kỳ kiểu sa bàn. Kỹ thuật học từ cách dựng chung của thể loại (tranh 2D trong cảnh 3D), không lấy nội dung của ai (decision 048).
- Prototype G0 (Admin `#/diorama-lab`, `tools/admin/diorama/*`) dựng Bìa Rừng qua 4 lượt sửa (§12–15): tự chấm 7,5 / 10; 60 FPS RTX 3050 ở mức Đẹp; 32–49 FPS không GPU ở mức Nhẹ; đã sửa cây như tờ giấy, gốc lộ bóng, rừng che đội.

## Cổng G0 — kết quả
Chủ dự án quyết ngày 2026-11-19: **đi tiếp hướng Diorama** (không quay về hướng A).

## Quyết định
1. **Renderer Diorama chạy trong game** (AdventureScene) cho cả 6 map của `zone_forest`: `map_forest_edge`, `map_forest_deep`, `map_forest_heart`, `map_forest_hollow`, `map_forest_falls`, `map_forest_marsh`.
2. **Gameplay không đổi**: va chạm vẫn là `walkableOf` + `stepCharacter` theo ô; chạm quái vào trận, rương, cổng ra, tương tác, quay lại sau trận, phím / tay cầm, logic và save giữ nguyên. Renderer chỉ là một lớp vẽ mới đọc cùng dữ liệu; cảnh được dựng sao cho **chỗ trông chặn đúng là ô chặn** (không phải ngược lại).
3. **Map 2D cổ điển giữ lại**: là lựa chọn trong Cài đặt, là đường lùi tự động khi máy không chạy nổi, và là renderer của mọi vùng khác (Núi, Tàn Tích, Biển…).
4. **Hai cài đặt mới theo máy** (lưu ở `settings.json` cùng cỡ chữ / ngôn ngữ, **không** ở save thế giới): kiểu map `Diorama | 2D cổ điển`, chất lượng map `Tự động | Đẹp | Nhẹ`. Tự động: dò GPU + đo FPS, máy yếu xuống Nhẹ, yếu nữa lùi về 2D trong phiên đó.
5. **Mã renderer dùng chung** chuyển từ `tools/admin/diorama/` vào `src/areas/adventure/scene/diorama/`; Admin lab import lại từ đó (không còn hai bản).
6. **Chuẩn duyệt map**: `docs/maps/MAP_SCENE_STANDARD.md` (hợp đồng cảnh, bảng chất liệu, camera, ánh sáng, luật thấy đội, ngân sách hiệu năng, thước 10 điểm, ngưỡng > 7,5). Map chỉ coi là xong khi người duyệt độc lập chấm đạt trên bằng chứng chụp sau lần sửa cuối.

## Lý do
- G0 chứng minh nền tảng đạt chiều sâu, ánh sáng, chuyển động mà tranh phẳng không có, trong ngân sách hiệu năng.
- Giữ va chạm theo ô để không đổi cảm giác chơi, không phải kiểm lại khả năng đi tới (`reachableTiles`, kiểm tra §3.10 của map), không đụng save.
- Dùng lại Three.js (đã có cho lớp VFX 3D trận, decision 059) và cách chép texture của `stage3d.ts`: không thêm thư viện, không đổi cấu hình Phaser chung.
- Giữ 2D làm đường lùi: máy yếu và các vùng chưa làm vẫn chơi được.

## Phạm vi
- Trong: 6 map Rừng; renderer + đồng bộ trạng thái (đội, quái, rương, cổng, vật tương tác, tha hóa, lớp che); 2 cài đặt + chuỗi i18n; Admin lab chọn được 6 map; script chụp bằng chứng theo map.
- Ngoài: thiết kế lại bố cục lưới map; tháp dịch chuyển; vòng khám phá; sinh vật 3D; mưa; nền trận đặt trên diorama; các vùng khác; art mới (nhu cầu ghi `docs/ASSET_TODO.md`).
- Đây là việc art / VFX làm trước GĐ14 theo chỉ đạo trực tiếp của chủ dự án (ngoại lệ có chủ đích của decision 017); chỉ dùng bộ art Rừng hiện có + hình vẽ bằng code.

## Hệ quả
- Save **không đổi**, không migration. `settings.json` thêm 2 khóa tùy chọn; file cũ đọc ra mặc định.
- Không thêm dependency (Three.js đã có). Không HTTP / mạng.
- Một WebGL context nữa khi đang ở map Rừng (cạnh Phaser và lớp VFX trận); được giải phóng khi rời Adventure.
- Khung nhìn diorama hẹp hơn 2D (~30 ô so với ~40 ô ngang): thuần hiển thị, ngưỡng gameplay (chạm, tầm với, gợi ý rương) giữ nguyên theo px.
- Va chạm theo ô lệch mép vẽ cong tối đa ~0,25 ô; cảnh phải được dựng theo luật khớp ô của chuẩn map. Nếu sau này muốn va chạm theo mép mịn: là đổi gameplay, cần decision riêng.
