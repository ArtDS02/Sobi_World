// Guide sections of the "Thế giới" pages (decision 047): the Map Builder (maps, network, editor, decoration library, the old area
// grid) and the battle tools (simulation, animation lab). Short, plain steps for someone opening the page for the first time.
import type { GuideSection } from './guide';

export const WORLD_SECTIONS: GuideSection[] = [
  {
    id: 'map-manage', icon: '🧭', title: 'Quản lý map',
    purpose: 'Danh sách mọi map của Sobi Adventure. Từ đây bạn tạo map mới, sửa, chạy thử và đưa map vào game. Mọi thay đổi nằm trong "bản nháp", game chưa thấy gì cho tới khi bạn Publish.',
    steps: [
      'Bấm "＋ Tạo map mới": đặt tên, chọn vùng, chọn bắt đầu từ map trống hoặc từ một map có sẵn làm mẫu.',
      'Bấm "Sửa" (hoặc ảnh map) để mở Map Editor và vẽ map.',
      'Bấm "▶ Chạy thử" để đi thử trong map bằng phím mũi tên.',
      'Menu "⋯ Thêm" có: Lối ra, Điểm xuất hiện, Nhân bản, Đổi tên, Lịch sử, Tạm tắt, Xoá.',
      'Xong thì bấm "✔ Kiểm tra & Publish" để đưa vào game.',
    ],
    example: ['Tạo "Hang Đá": Tạo map mới → tên "Hang Đá", vùng Núi, map trống 40×24 → Sửa (vẽ) → Lối ra (nối với Chân Núi) → Chạy thử → Kiểm tra & Publish.'],
    notes: [
      'Cột Trạng thái: ✅ đã publish · ✏️ đã publish nhưng có nháp · 📝 nháp · ⏸️ tạm tắt.',
      'Map đã publish không xoá, không tắt được (save người chơi còn nhớ nó). Chỉ sửa được.',
      'Cột Kiểm tra báo lỗi; di chuột lên chữ đỏ để xem chi tiết.',
    ],
  },
  {
    id: 'map-network', icon: '🕸️', title: 'Mạng map',
    purpose: 'Sơ đồ cả thế giới: mỗi ô là một map, mỗi đường là các lối ra nối hai map. Nhìn một lần là biết map nào nối với map nào, chỗ nào sai.',
    steps: [
      'Kéo ô map để sắp xếp cho dễ nhìn (chỉ đổi sơ đồ, không đổi map).',
      'Bấm một map: xem thông tin, mở Chạy thử / Lối ra / Map Editor. Bấm đúp: mở Lối ra.',
      'Bấm một đường nối: xem các lối ra của nó, bấm "Sửa lối ra này".',
      'Đọc mục Cảnh báo bên phải; bấm vào cảnh báo để chọn map bị lỗi.',
    ],
    example: ['Thấy "Hang Đá: không có lối vào hợp lệ" → bấm cảnh báo → Lối ra → tạo lối từ Chân Núi sang Hang Đá.'],
    notes: ['Mũi tên = một chiều · nét đứt = có khoá · mờ = tạm tắt · đỏ = lỗi.', 'Cuộn chuột để phóng to, kéo nền để di chuyển, "Vừa khung" để xem hết.'],
  },
  {
    id: 'map-editor', icon: '✏️', title: 'Map Editor',
    purpose: 'Nơi vẽ một map: chỗ nào đi được / bị chặn, đặt rương, quái, cổng, cây cối… Toạ độ luôn theo ô của game; phóng to chỉ để nhìn rõ.',
    steps: [
      'Thanh trên cùng chia nhóm: Quản lý bản đồ (quay lại, trạng thái), Công cụ chỉnh sửa (Chọn, Vẽ địa hình, Đặt đối tượng, Xoá, Di chuyển, Vùng di chuyển, Độ cao, Lối ẩn), Hiển thị (lưới, vùng đi được, toạ độ, zoom), Kiểm tra & xuất bản. Rê chuột lên nút để xem nút làm gì.',
      'Cột trái có 3 tab: Địa hình (chọn loại đất, cách tô, cỡ cọ, độ cao), Đối tượng (rương, NPC, quái, suối, cổng, điểm tới… và asset trang trí — bấm rồi bấm lên map, hoặc kéo thả thẳng vào map), Layer (ẩn / hiện, khoá để khỏi sửa nhầm). Nút « thu gọn cột trái cho map rộng hơn.',
      'Bấm một vật: cột phải hiện tên, loại, toạ độ, kích thước, layer; "Sửa thuộc tính" mở các trường riêng (bảng thưởng, hệ…).',
      'Cột phải "Kiểm tra lỗi": lỗi nghiêm trọng (đỏ, chặn xuất bản), cảnh báo (vàng), thông tin (xanh). Mỗi lỗi có dấu ngay trên map; bấm "Đi tới" hoặc bấm dấu trên map để tới đúng ô, chọn vật và xem giải thích. Sửa xong, dấu tự mất.',
      'Bấm "Lưu nháp" (Ctrl+S). Rồi "Chạy thử", "Xem bằng game", "Xuất bản".',
    ],
    example: ['Chặn một đoạn đường: Vùng di chuyển (W) → kéo qua đoạn đường (bắt đầu ở ô đi được thì tô chặn) → Lưu nháp.', 'Thêm cây sồi che lối: tab Đối tượng → kéo Cây sồi vào map → Sửa thuộc tính → "Cách đứng".'],
    notes: [
      'Chuột: Shift + kéo để di chuyển bản đồ (hoặc kéo chuột phải / giữ Space); Ctrl + cuộn để phóng to / thu nhỏ đúng chỗ con trỏ; cuộn thường để cuộn bản đồ. Kéo thường luôn là việc của công cụ đang chọn.',
      'Phím: Ctrl+Z / Ctrl+Y hoàn tác, Del xoá, Ctrl+D nhân bản, Ctrl+C / Ctrl+V chép dán, mũi tên dời 1 ô (Shift: 5 ô), Ctrl+bấm chọn thêm, F vừa khung, G lưới, Esc bỏ chọn.',
      'Màu vùng di chuyển: xanh lá đi được, đỏ bị chặn (cả chân cây, vật, cổng đóng), cam vùng đặc biệt (cầu, đất cao, bậc đá, đất tha hoá), xanh dương nước. Bấm từng màu ở chú thích dưới map để bật / tắt riêng.',
      'Không xoá được vật mà save người chơi đã nhớ (rương đã mở, cổng…) — chỉ dời được.',
    ],
  },
  {
    id: 'map-spawns-exits', icon: '🚪', title: 'Lối ra & Điểm xuất hiện',
    purpose: 'Lối ra là chỗ đi sang map khác. Điểm xuất hiện là chỗ người chơi đứng khi tới map. Mỗi lối ra chọn một điểm xuất hiện ở map bên kia.',
    steps: [
      'Mở "Lối ra" (menu ⋯ Thêm, hoặc nút trong Map Editor). Hộp có 2 lưới: trên là map này, dưới là map đích.',
      'Chọn map đích ở ô "＋ Lối ra tới map này", bấm nút, rồi bấm lên lưới trên để đặt lối ra.',
      'Bấm "Chọn điểm tới trên lưới map đích" rồi bấm lên lưới dưới: chỗ người chơi xuất hiện.',
      'Muốn đi được hai chiều: bấm "＋ Tạo lối về" → bấm lưới dưới (lối về đứng đâu) → bấm lưới trên (lối về tới đâu). Không muốn lối về thì tích "Một chiều".',
      'Bấm "Lưu bản nháp".',
    ],
    example: ['Nối Rừng Sâu ↔ Hang Đá: ở Rừng Sâu thêm lối ra tới Hang Đá → chọn điểm tới trong Hang Đá → Tạo lối về → Lưu.'],
    notes: ['"Khoá": Luôn mở / Sau kẻ canh (hạ tinh anh của map mới mở) / Lối tắt (mở khi đi từ phía bên kia sang).', 'Hộp "Điểm xuất hiện" để đổi tên, hướng quay, dời các điểm; điểm đang có lối ra trỏ tới thì không xoá được.'],
  },
  {
    id: 'map-publish', icon: '✔', title: 'Kiểm tra, Publish, Chạy thử, Lịch sử',
    purpose: 'Đưa bản nháp vào game an toàn, và thử trước khi đưa.',
    steps: [
      '▶ Chạy thử: đi bằng phím mũi tên / WASD theo đúng luật của game; đi vào lối ra để sang map khác. Chọn "Bản nháp" hoặc "Bản đã publish". Không lưu gì.',
      '🎥 Xem bằng game (trong Map Editor): game thật chụp ảnh map, mất khoảng 30–60 giây.',
      '✔ Kiểm tra & Publish: tích các bản nháp muốn đưa vào game, sửa hết lỗi đỏ, gõ tên tiếng Anh cho chữ mới, bấm "Publish vào game".',
      'Lịch sử (menu ⋯ Thêm): xem các bản cũ, "Đưa về nháp" để quay lại bản cũ rồi publish lại.',
    ],
    example: ['Hai map mới nối nhau thì tích cả hai khi publish, nếu không sẽ báo "map đó chưa publish".'],
    notes: ['Publish ghi cả 3 file cùng lúc; lỗi giữa chừng thì tự hoàn lại, không hỏng gì.', 'Sau publish, bản build tiếp theo của game mới có map mới.'],
  },
  {
    id: 'map-assets', icon: '🌲', title: 'Thư viện asset',
    purpose: 'Kho cây, đá, nhà… dùng chung cho mọi map. Mỗi asset khai báo một lần (ảnh, cỡ, ô chặn, cách đứng); sửa ở đây thì mọi chỗ đã đặt đổi theo.',
    steps: [
      '"⬆ Tải ảnh mới": chọn file PNG nền trong suốt, đặt tên Việt + Anh, loại, rộng (số ô), cách đứng → Tải lên.',
      '"＋ Từ ảnh có sẵn": dùng một ảnh đã có trong game.',
      'Bấm "Sửa" trên thẻ để đổi thông tin. "Xoá" chỉ được khi chưa map nào dùng.',
      'Đặt asset lên map: Map Editor → cột trái "Asset trang trí".',
    ],
    example: ['Cây thông che đường: rộng 2,5 ô, ô chặn "0,0,1,1" (chỉ gốc cây chặn), cách đứng "Che theo chân".'],
    notes: [
      'Cách đứng: Nằm trên đất (dưới mọi thứ) · Che theo chân (người đi phía sau thì bị che) · Luôn ở trên · Lớp che (mờ đi khi người chơi tới gần).',
      'Ô chặn viết "x,y,rộng,cao; …" tính từ ô dưới chân. Để trống = đi xuyên qua.',
    ],
  },
  {
    id: 'adventure-maps', icon: '🗺️', title: 'Bản đồ khu (trang cũ)',
    purpose: 'Trang cũ: sửa nhanh map đã publish bằng lưới ô. Ghi thẳng vào game, không qua bản nháp. Nên dùng Map Editor thay cho trang này.',
    steps: ['Chọn khu, chọn công cụ (tô đất, đặt vật, xoá vật, dời vật).', 'Bấm lên ô.', 'Hết lỗi đỏ thì bấm "Lưu vào game".'],
    example: ['Dời một rương: công cụ "Dời…" → bấm rương → bấm ô mới → Lưu vào game.'],
    notes: ['Trang này không có undo, không có bản nháp. Không xoá được id đã publish.'],
  },
  {
    id: 'battle-sim', icon: '⚔️', title: 'Mô phỏng trận',
    purpose: 'Cho một đội đi hết một vùng nhiều lần bằng đúng luật đánh của game, để xem tỉ lệ thắng, số lượt, máu còn lại. Dùng khi cân bằng độ khó. Không lưu gì.',
    steps: ['Chọn vùng, cấp đội, trang bị, đồ mang theo.', 'Chọn 3 bạn đồng hành: dòng Guardian, class, độ hiếm, số tim.', 'Kết quả hiện ngay bên dưới; đổi lựa chọn là chạy lại.'],
    example: ['Đội cấp 8 có thắng nổi vùng Núi không? Chọn Núi, cấp 8, trang bị thường → xem "Thắng trùm".'],
    notes: ['Cùng "Random seed" thì ra cùng kết quả. Tăng "Số chuyến" cho kết quả chắc hơn (chậm hơn).'],
  },
  {
    id: 'battle-lab', icon: '✨', title: 'Xưởng animation trận',
    purpose: 'Xem một kỹ năng diễn ra thế nào trên sân trận thật của game, và chỉnh hiệu ứng riêng của kỹ năng đó.',
    steps: [
      'Chọn kỹ năng (★ = đã có animation riêng), bên ra đòn, bên nhận đòn.',
      'Tích các tình huống muốn xem: chí mạng, kết liễu, quái ra đòn, trùm đổi pha…',
      'Bấm "▶ Chạy" để xem. "Vào trận" để xem cảnh mở trận.',
      'Muốn chỉnh: sửa ô JSON "Phần riêng của kỹ năng" → "Áp dụng thử" → ưng thì "Lưu vào battle_fx.json".',
    ],
    example: ['Bong Bóng Nước bay chậm quá: sửa tốc độ trong ô JSON → Áp dụng thử → ▶ Chạy → Lưu.'],
    notes: ['Ô JSON để trống = kỹ năng dùng hiệu ứng chung của hệ.', 'Cách viết JSON: docs/animation/COMBAT_ART_GUIDE.md §4.'],
  },
];
