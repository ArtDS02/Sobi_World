// Admin guide inside the dashboard (DECISIONS AD-1): one section per module with purpose, steps, a
// real workflow and pitfalls. Pages link here with "❔ Hướng dẫn" (#/guide/<section>).
import { esc } from './labels';

interface Section {
  id: string;
  icon: string;
  title: string;
  purpose: string;
  steps: string[];
  example: string[];
  notes: string[];
}

const SECTIONS: Section[] = [
  {
    id: 'overview', icon: '🏠', title: 'Tổng quan Dashboard',
    purpose: 'Công cụ dev (npm run admin, cổng 5175) sửa đúng các file game đọc: nội dung của cả 5 khu (Nội dung game), giống heo, manifest asset, cửa hàng, luật phối giống, bố cục, ngày/đêm — và save của người chơi. Không có trong bản cài đặt gửi người chơi.',
    steps: ['Chạy npm run admin, mở http://localhost:5175/admin.html.', 'Chân thanh bên trái phải là “● Đang nối dữ liệu game” — nếu “Chỉ đọc” thì mọi nút lưu bị khoá.', 'Mỗi trang có nút 💾 Lưu riêng; dashboard kiểm lỗi trước, API kiểm lại bằng luật của game rồi mới ghi file.', 'Lưu xong dữ liệu game, trang tự tải lại để đọc dữ liệu mới (nếu còn bản nháp khác chưa lưu, trình duyệt hỏi trước). Bản nháp của trang Nội dung game được giữ lại qua lần tải lại.', 'Admin không tự tải lại khi ai đó sửa code (tránh mất bản nháp): sửa code admin thì bấm F5.'],
    example: ['Thẻ khu Garden → “13 cây trồng” → mở thẳng file cây trồng trong Nội dung game.'],
    notes: ['Mọi file được ghi là file nguồn trong git: xem lại bằng git diff trước khi commit.', 'Chấm vàng cạnh mục menu = trang đó còn thay đổi chưa lưu.'],
  },
  {
    id: 'users', icon: '👤', title: 'Người chơi (save)',
    purpose: 'Game chơi đơn, offline: mỗi “người chơi” là một save thế giới (5 khu). Xem và sửa tiền (Sobi Coin, Ngọc, Vé Lễ Hội), túi đồ, KN và khu đã mở, bộ sưu tập, thành tựu, dữ liệu từng khu, thế giới sống và thời gian.',
    steps: ['Mục Người chơi liệt kê save trong %APPDATA%\\SobiWorld*\\saves*: “Bản dev” = save của npm run dev và npm run dev:desktop; “Bản cài đặt” = bản cài. File .json từ máy khác: “📂 Mở file save”.', 'Mở một save → chọn tab. Mỗi thay đổi áp ngay vào bản nháp (ô số: gõ rồi Enter hoặc bấm ra ngoài; công tắc: ngay lập tức) — không còn bước “Áp dụng”.', 'Hộp vàng phía trên liệt kê điều game sẽ từ chối (kiểm bằng đúng schema save của game và của từng khu) và khoá nút Lưu cho tới khi sửa hết.', 'Bấm 💾 Lưu vào save — game đang mở tự tải lại save mới trong vài giây; bản cũ vào backups/.', 'Tab từng khu (Garden, Aquarium, Cloud, Adventure, và “Dữ liệu Nông trại”) hiện mọi trường game lưu cho khu đó: danh sách dài chọn dòng bên trái, sửa bên phải.', 'Tab Thế giới & thời gian: lịch 14 ngày + công tắc thử (thời tiết / lễ hội / Thương nhân), ⏩ Tua thời gian cho mọi khu, Bảng đơn & mục tiêu ngày.'],
    example: ['Tặng 10.000 Sobi Coin: tab Ví → “+10.000” (hoặc gõ số mới rồi Enter) → Lưu. Lịch sử có dòng “Điều chỉnh của quản trị”.', 'Tặng heo: tab Sobi Farm → ＋ Tặng heo → bấm thẻ ảnh giống heo.', 'Mở khu Cloud sớm để thử: tab Tiến trình & khu → bật Sobi Cloud (dữ liệu khởi đầu được tạo) → Lưu.', 'Thử một ngày vắng nhà: tab Thế giới & thời gian → +1 ngày → Lưu → mở game.'],
    notes: ['Không cần đóng game: nếu game tự lưu sau khi bạn mở, dashboard áp lại thay đổi của bạn lên bản mới nhất (thay đổi của dashboard thắng).', 'Mở save khác khi còn thay đổi chưa lưu: dashboard hỏi trước.', 'Reset / Xoá save phải gõ xác nhận; “Xoá” chỉ chuyển save vào backups, không xoá vĩnh viễn.', 'Tab Nâng cao: sửa JSON cả save (kiểm như khi game mở) và tải bản nháp về.'],
  },
  {
    id: 'content', icon: '📚', title: 'Nội dung game (mọi file content/)',
    purpose: 'Mọi nội dung và con số của 5 khu: vật phẩm, công thức, cây, cá, hoa, quái, kỹ năng, vùng, lễ hội, thời tiết, cân bằng… Form dựng từ chính schema của game: sửa số, chữ, công tắc, chọn từ danh sách, thêm / nhân bản / xoá / đổi thứ tự dòng, bật trường tuỳ chọn.',
    steps: ['Mở Nội dung game, chọn file (tìm theo tên). File có trang riêng (giống heo, cửa hàng Farm, phối giống heo, bố cục, ngày/đêm, mùa) dẫn sang trang đó.', 'Danh sách dài (vật phẩm, cá…): tìm và chọn dòng bên trái, sửa bên phải. ⧉ nhân bản dòng làm mẫu cho dòng mới (đổi mã id cho dòng mới).', 'Vật phẩm, trang trí, thành tựu: ô “Tên hiển thị” sửa tên / mô tả tiếng Việt và tiếng Anh trong bảng chuỗi của game.', 'Ô đỏ / hộp vàng = game sẽ từ chối. Bấm 💾 Lưu file: server kiểm bằng schema, không cho xoá id đã phát hành, sinh lại danh sách id, rồi nạp lại toàn bộ dữ liệu game; lỗi thì không ghi gì.'],
    example: ['Thêm vật phẩm: Vật phẩm → chọn một vật phẩm giống loại → ⧉ → đổi id (vd. item_honey), giá, tên Việt/Anh → Lưu.', 'Heo nguy kịch sau 24 giờ: Sức khỏe → “Bệnh bao lâu thì nguy kịch” = 86400000 (gợi ý “≈ 1 ngày” hiện ngay dưới ô).'],
    notes: ['Id đã phát hành không xoá được (save người chơi còn giữ): đặt enabled/active = false nếu file có trường đó.', 'Đổi số không đổi save đang có: giá trị mới áp từ lần game tính tiếp.', 'Chữ tiếng Anh của file content nằm ở content/i18n/en.json (npm run content:i18n liệt kê chữ còn thiếu).'],
  },
  {
    id: 'language', icon: '🌐', title: 'Ngôn ngữ (Việt / Anh)',
    purpose: 'Game có hai ngôn ngữ chọn trong Cài đặt (GĐ13). Chữ giao diện nằm ở src/i18n/vi.ts và src/i18n/en/; chữ trong file content (tên giống heo, NPC, kỹ năng, cá, hoa…) vẫn viết tiếng Việt trong content/*.json và bản tiếng Anh nằm ở content/i18n/en.json, khoá theo đường dẫn của chữ.',
    steps: ['Thêm một mục mới có chữ (giống heo, cá, kỹ năng…) ở Nội dung game hoặc trang riêng như thường.', 'Chạy npm run content:i18n: liệt kê mọi chữ trong content/ chưa có bản tiếng Anh (kèm khoá và chữ Việt).', 'Thêm bản dịch vào content/i18n/en.json theo đúng khoá đó, giữ nguyên các {tham_số}.', 'npm run check phải xanh: bài test “i18n” báo thiếu, thừa hoặc sai tham số.'],
    example: ['Thêm heo PIG_NEW: sau khi lưu, npm run content:i18n in dòng “farm/species.json  species/PIG_NEW/nameVi  Heo Mới”; thêm “species/PIG_NEW/nameVi”: “New Pig” vào nhóm farm/species.json của en.json.'],
    notes: ['Đổi chữ Việt của một mục có sẵn không cần đổi gì ở en.json (khoá theo id, không theo chữ).', 'Mục chưa có bản dịch hiện chữ Việt khi chơi tiếng Anh; test chặn việc quên.', 'Ngôn ngữ, cỡ chữ, chế độ màu và rung màn hình là cài đặt theo máy (settings.json), không nằm trong save nên Admin không sửa.'],
  },
  {
    id: 'pigs', icon: '🐷', title: 'Quản lý heo',
    purpose: 'Danh sách species (content/farm/species.json): tên, độ hiếm, nhóm, giá, thời gian lớn, ảnh. Heo bán trong shop cũng chỉnh ở đây (Giá mua, Cấp mở khoá).',
    steps: ['Tìm / lọc theo nhóm, độ hiếm, trạng thái; sắp xếp theo tên, độ hiếm, giá.', '＋ Thêm heo → chọn Ảnh (art id) trong danh sách ảnh trống → điền tên, ID, độ hiếm, nhóm.', '“Thêm vào danh sách” chỉ vào bản nháp — bấm 💾 Lưu vào game ở đầu trang.'],
    example: ['Asset nguồn → Nhập pig_cyborg_v2 thành pig_cyborg_v3 → tự mở “Tạo heo mới” với ảnh đó → đặt tên “Heo Cyborg Mk3”, EPIC, SCIFI → Lưu.'],
    notes: ['Không xoá species đã phát hành (save cũ đang giữ) — bỏ chọn “Đang dùng” để tắt.', 'Hiếm hơn phải bán đắt hơn và lớn lâu hơn; chỉ LEGENDARY không lai được.'],
  },
  {
    id: 'asset-source', icon: '📥', title: 'Asset nguồn',
    purpose: 'Ảnh gốc trong asset/animals/sobi_farm/asset/ và ảnh tải lên từ máy. Đưa ảnh vào game để tạo heo.',
    steps: ['Lọc “Chưa dùng” để thấy ảnh mới.', '📥 Nhập vào game… (hoặc ⬆ Tải ảnh lên) → kiểm art id + tên hiển thị.', 'Bấm Nhập: ảnh được chép vào public/assets/pigs/base/ VÀ đăng ký dòng manifest cùng lúc.', 'Ảnh có trạng thái “Đã nhập → …”; nút “🐷 Tạo heo từ ảnh này” mở form tạo heo với ảnh đã chọn sẵn.'],
    example: ['Upload pig_pilot.png (512×512) → art id pig_pilot, tên “Heo Phi Công” → Tải lên → form Tạo heo mở sẵn → Lưu vào game.'],
    notes: ['Asset chỉ dùng được khi có đủ file + dòng manifest (type/collection species, status production). Trước bản sửa AD-1, nhập chỉ chép file nên không chọn được khi tạo heo — dùng Thư viện asset → “Đăng ký” cho ảnh cũ.', 'Ảnh phải là PNG vuông, chuẩn 512×512 nền trong, heo nhìn sang phải. Không ghi đè ảnh đang có.'],
  },
  {
    id: 'asset-library', icon: '🖼️', title: 'Thư viện asset',
    purpose: 'Mọi ảnh heo game thật sự tải (public/assets/pigs/base/) với trạng thái manifest, heo đang dùng, kích thước, ngày tạo.',
    steps: ['Lọc Chưa đăng ký → 📝 Đăng ký để thêm dòng manifest.', 'Lọc Chưa gán heo → 🐷 Tạo heo.', 'Sắp xếp Mới nhất / Cũ nhất / Tên.'],
    example: ['Có file pig_alien_v3.png nhưng “✕ Chưa đăng ký manifest” → Đăng ký (tên “Heo Alien v3”) → giờ chọn được trong Tạo heo.'],
    notes: ['Cảnh báo ⚠ 512×512 nghĩa là ảnh lệch chuẩn art — vẫn chạy nhưng nên vẽ lại.'],
  },
  {
    id: 'layout', icon: '🗺️', title: 'Bố cục nông trại (Layout Editor)',
    purpose: 'Sắp xếp vật thể trên nông trại 1600×900 bằng kéo thả; lưu vào manifest layout.placements, game vẽ theo data này.',
    steps: ['Kéo asset từ thư viện bên trái vào khung (hoặc bấm để thêm giữa khung).', 'Kéo vật để di chuyển, kéo chấm góc phải-dưới để đổi cỡ (Shift giữ tỷ lệ khi đã có chiều cao).', 'Bảng thuộc tính bên phải: X/Y, Rộng/Cao, Lớp, Xoay, Lật, Hiện/Khoá, thay asset, hành động khi bấm.', 'Xem trước để ẩn khung chọn; 💾 Lưu layout; tải lại game để thấy.'],
    example: ['Thêm prop_bush lớp 4 ở góc phải, nhân bản (Ctrl+D) 2 lần, xoay nhẹ, lưu → F5 game.'],
    notes: ['Chỉ 1 máng ăn và 1 bảng đơn. Lớp 4 được game xếp theo Y cùng heo — nên “Lên/Xuống” chỉ quyết định khi cùng Y.', 'Phím: mũi tên dịch 1px (Shift 10px), Delete xoá, Ctrl+Z/Ctrl+Y hoàn tác/làm lại, Esc bỏ chọn.', '“Về layout mặc định” chỉ thay bản nháp; chưa ghi tới khi Lưu.'],
  },
  {
    id: 'shop', icon: '🛒', title: 'Cửa hàng / Sản phẩm',
    purpose: 'Sản phẩm tab Vật phẩm của shop (content/shared/shop.json): gói của một vật phẩm game với giá, số lượng, icon, danh mục, thứ tự, trạng thái bán.',
    steps: ['＋ Thêm sản phẩm → ID, tên, mô tả, vật phẩm nhận được, số lượng mỗi lần mua, giá, icon → xem trước thẻ shop.', 'Ngừng bán / Bán lại bằng nút trên dòng.', '💾 Lưu sản phẩm vào game → mở shop trong game.'],
    example: ['Gói “Thức ăn ×10” giá 230: vật phẩm FOOD_BASIC, số lượng 10, giá 230, thứ tự 15 → hiện giữa Thức ăn và Thuốc.'],
    notes: ['Sản phẩm đã phát hành không xoá được (lịch sử giao dịch trỏ tới) — dùng Ngừng bán.', 'Giá đổ máng vẫn theo giá gốc vật phẩm, không theo gói.', 'Heo bán trong shop chỉnh ở Quản lý heo (Giá mua, Cấp mở khoá).'],
  },
  {
    id: 'breeding', icon: '🧬', title: 'Phối giống',
    purpose: 'Ba tab trên cùng một dữ liệu phối giống của game: 🧬 Sơ đồ phả hệ (heo xếp theo thế hệ, bấm một heo để thấy bố mẹ, tổ tiên, hậu duệ), 📐 Luật đang chạy (sửa được: Random Genetics theo độ hiếm, Gene Pool, Công thức đặc biệt; kiểm tra dữ liệu; thử một cặp với random seed) và ✏️ Bảng ghi đè cặp: Heo A + Heo B → các kết quả với tỷ lệ % (content/farm/breeding.json). Cặp không có luật ghi đè: công thức đặc biệt lấy đúng % của nó trước, random genetics chia phần còn lại (bố mẹ > cùng bậc / bậc giữa > lên 1 bậc) — mọi cặp hợp lệ đều sinh được con.',
    steps: ['Sơ đồ phả hệ: bấm heo (hoặc chọn ở ô Tìm heo) → sơ đồ tự cuộn tới, đường hồng = tổ tiên, xanh = hậu duệ, viền nét đứt = chỉ lai ra được bằng đường hiếm (< 5 %).', '＋ Thêm luật → chọn Heo A, Heo B (chỉ heo lai được).', 'Form tự điền tỷ lệ hiện tại của game; thêm/bớt kết quả, sửa %.', 'Tổng phải đúng 100 % (nút ⚖ chia lại cho đủ). Trùng cặp (A+B = B+A) bị chặn.', '💾 Lưu luật vào game — hộp thoại phối giống trong game hiện đúng tỷ lệ này.'],
    example: ['Heo Hồng + Heo Đen: Heo Hồng 60 %, Heo Đen 25 %, Heo Gấu Trúc 10 %, Heo Galaxy 5 % → Lưu.'],
    notes: ['Thế hệ 0 = heo bán ở cửa hàng; thế hệ n = lai ra (tỷ lệ ≥ 5 %) từ hai heo thế hệ trước. Sơ đồ đọc trực tiếp luật + công thức + bảng ghi đè, không có dữ liệu riêng.', 'Tắt luật để quay về tỷ lệ mặc định mà vẫn giữ luật.', 'Kết quả là heo đang tắt bị bỏ qua khi chơi; phần còn lại tự chia lại cho đủ 100 %.'],
  },
  {
    id: 'daynight', icon: '🌗', title: 'Ngày / Đêm',
    purpose: 'Giờ bắt đầu 6 pha, độ trộn, thời gian chuyển; xem trước bằng chính painter của game. Chỉ là trình bày, không đổi số gameplay.',
    steps: ['Sửa giờ từng pha, bấm xem trước, 💾 Lưu.'], example: ['Đêm bắt đầu 19:00 thay 20:00.'], notes: ['Giờ các pha phải tăng dần trong ngày.'],
  },
  {
    id: 'seasons', icon: '🍂', title: 'Mùa & hiệu ứng',
    purpose: 'Bật / tắt, mật độ và tốc độ sinh của hiệu ứng môi trường theo mùa (cánh hoa, bướm, tia nắng, bụi nắng, đom đóm đêm hè, lá rơi, sương ấm, tuyết, gió xoáy) và bảng art công trình theo mùa (thiếu mùa → art mặc định).',
    steps: ['Chỉnh Bật / Mật độ × / Tốc độ sinh × từng hiệu ứng (hoặc mật độ chung).', '💾 Lưu hiệu ứng vào game.', 'Xem trước mùa: Bố cục nông trại → Mùa, hoặc game dev với ?season=winter; pha ngày/đêm: trang Ngày / Đêm.'],
    example: ['Tuyết quá dày → winter_snow mật độ 0,6.'],
    notes: ['Điều kiện ngày/đêm (đom đóm chỉ đêm hè) và chuyển động nằm trong src/core/config/seasonFxTable.ts (bật/tắt, mật độ: content/farm/season-fx.json).', 'Hiệu ứng không bấm được, không đổi vị trí / va chạm / camera; tắt khi "Giảm chuyển động".'],
  },
  {
    id: 'desktop', icon: '🎮', title: 'Desktop Game',
    purpose: 'Build game thành ứng dụng Windows: installer tạo shortcut Desktop + Start Menu; người chơi double-click là vào game, không cần VS Code, Terminal, npm hay dev server.',
    steps: ['Mở trang 🎮 Desktop Game (thanh bên, nhóm Hệ thống / Hướng dẫn): lệnh thật đọc từ package.json, có nút Copy.', 'Chạy lệnh Package Desktop → installer trong thư mục output.', 'Chạy installer → shortcut “Sobi Farm” trên Desktop → double-click.'],
    example: ['Bản mới: tăng version → build installer → cài đè: save trong %APPDATA%\\SobiWorld\\saves giữ nguyên.'],
    notes: ['Save không nằm trong thư mục cài; gỡ cài đặt cũng không xoá save.', 'Installer chưa ký số: SmartScreen có thể hỏi — More info → Run anyway.'],
  },
  {
    id: 'data', icon: '🔗', title: 'Dữ liệu & đồng bộ với game',
    purpose: 'Mỗi mục ghi đúng một nguồn dữ liệu game đọc, có quan hệ rõ ràng.',
    steps: ['Một nguồn sự thật cho mỗi loại dữ liệu: config game = file trong src/core/config + manifest (dashboard ghi, game import); dữ liệu người chơi = save.json trong %APPDATA% (dashboard và game đọc/ghi cùng file).', 'Asset (manifest pigs[]) → Heo (speciesTable.artId) → Save người chơi (pig.breed).', 'Asset (manifest props/buildings) → Layout (layout.placements[].id).', 'Heo → Luật phối giống (parents, outcomes) → Heo con.', 'Asset (manifest ui/props) → Sản phẩm (icon) → Kho đồ người chơi (itemId).'],
    example: ['Tắt một heo: không bán, không lai ra, luật có kết quả đó tự chia lại; heo đang nuôi trong save giữ nguyên.'],
    notes: ['Không có server trong bản ship: dashboard chỉ chạy khi dev. Bản cài đặt đọc các file đã lưu ở lần build sau.'],
  },
];

export function renderGuide(root: HTMLElement, section: string | null) {
  const list = (items: string[], ordered = false) =>
    `<${ordered ? 'ol' : 'ul'}>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;
  root.innerHTML = `<div class="guide">
    <nav class="guide__toc panel">${SECTIONS.map((s) => `<a href="#/guide/${s.id}" class="${s.id === section ? 'is-active' : ''}">${s.icon} ${esc(s.title)}</a>`).join('')}</nav>
    <div class="guide__body">${SECTIONS.map((s) => `<section class="panel guide__section${s.id === section ? ' is-active' : ''}" id="guide-${s.id}">
      <h2>${s.icon} ${esc(s.title)}</h2>
      <h4>🎯 Mục đích</h4><p>${esc(s.purpose)}</p>
      <h4>🧭 Cách sử dụng</h4>${list(s.steps, true)}
      <h4>💡 Ví dụ</h4>${list(s.example)}
      <h4>⚠️ Lưu ý</h4>${list(s.notes)}
    </section>`).join('')}</div></div>`;
  if (section) root.querySelector(`#guide-${CSS.escape(section)}`)?.scrollIntoView({ block: 'start' });
}
