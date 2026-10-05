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
    id: 'overview', icon: '🏡', title: 'Tổng quan Dashboard',
    purpose: 'Công cụ dev (npm run admin, cổng 5175) sửa đúng các file game đọc: bảng heo, manifest asset, sản phẩm, luật phối giống, layout, ngày/đêm và save người chơi. Không có trong bản cài đặt gửi người chơi.',
    steps: ['Chạy npm run admin, mở http://localhost:5175/admin.html.', 'Chân thanh bên trái phải là “● Đang nối data game” — nếu “○ Chỉ đọc” thì mọi nút lưu bị khoá.', 'Mỗi trang có nút 💾 Lưu riêng; dashboard kiểm lỗi trước, API kiểm lại lần nữa rồi mới ghi file.', 'Dữ liệu game (heo, asset, shop, luật…): game dev (npm run dev / dev:desktop) tự tải lại. Save người chơi: game đang mở tự tải lại save vừa lưu.', 'Bản cài đặt (SobiFarm.exe) chỉ có dữ liệu game mới sau khi build lại installer — xem 🎮 Desktop Game.'],
    example: ['Thẻ “Vấn đề cần xử lý” → bấm → trang Kiểm tra dữ liệu → mở heo bị lỗi → sửa → 💾 Lưu vào game.'],
    notes: ['Mọi file được ghi là file nguồn trong git: xem lại bằng git diff trước khi commit.', 'Sau khi lưu file config (.ts), trang tự tải lại — đó là bình thường.'],
  },
  {
    id: 'users', icon: '👤', title: 'Người chơi (save)',
    purpose: 'Game chơi đơn, offline: mỗi “người chơi” là một save. Xem và sửa vàng, kho đồ, heo, tiến trình, trạng thái game theo từng nhóm — không sửa JSON tuỳ ý.',
    steps: ['Mục Người chơi liệt kê save trong %APPDATA%\\SobiWorld*\\saves* (và thư mục Sobi Farm cũ %APPDATA%\\Un In Homemade*, game đã chép sang SobiWorld ở lần chạy đầu): “Bản dev” = save của CẢ npm run dev (trình duyệt) VÀ npm run dev:desktop; “Bản cài đặt” = save của bản cài. File .json từ máy khác: “📂 Mở file save”.', 'Mở một save → chọn tab Hồ sơ / Tiền tệ / Kho đồ / Heo / Tiến trình / Trang trí & thành tích / Trạng thái game.', 'Sửa trong tab, bấm “Áp dụng” (kiểm bằng chính schema save của game). Tặng / đổi giống heo: bấm thẻ ảnh heo (tìm, lọc độ hiếm / chủ đề, sắp xếp).', 'Bấm 💾 Lưu vào save — game đang mở tự tải lại save mới trong vài giây; khởi động lại vẫn giữ.'],
    example: ['Tặng 10.000 vàng: Tiền tệ → đặt Vàng = số mới → Áp dụng → Lưu. Lịch sử giao dịch có dòng “Điều chỉnh của quản trị”.', 'Tặng heo vừa tạo từ asset mới: Asset nguồn → Nhập → Tạo heo → 💾 Lưu vào game → Người chơi → Heo → ＋ Tặng heo → bấm thẻ heo đó.', 'Kiểm heo ốm: tab Heo, cột Tình trạng; sửa → bỏ “Đang ốm”.'],
    notes: ['Không cần đóng game: game không bao giờ ghi đè save do dashboard vừa lưu (nó tải lại bản mới). Nếu game tự lưu sau khi bạn mở, dashboard áp lại thay đổi của bạn lên bản mới nhất.', 'Thao tác trong game đúng lúc dashboard lưu có thể mất (thay đổi của dashboard thắng).', 'Mỗi lần lưu, bản cũ vào backups/ (khôi phục được trong game).', 'Reset / Xoá save phải gõ xác nhận; “Xoá” chỉ chuyển save vào backups, không xoá vĩnh viễn.', 'Chỉ đọc (game tự sinh): lịch sử giao dịch, lịch sử phối giống, giờ hộp quà kế tiếp.'],
  },
  {
    id: 'pigs', icon: '🐷', title: 'Quản lý heo',
    purpose: 'Danh sách species (src/core/config/speciesTable.ts): tên, độ hiếm, nhóm, giá, thời gian lớn, ảnh. Heo bán trong shop cũng chỉnh ở đây (Giá mua, Cấp mở khoá).',
    steps: ['Tìm / lọc theo nhóm, độ hiếm, trạng thái; sắp xếp theo tên, độ hiếm, giá.', '＋ Thêm heo → chọn Ảnh (art id) trong danh sách ảnh trống → điền tên, ID, độ hiếm, nhóm.', '“Thêm vào danh sách” chỉ vào bản nháp — bấm 💾 Lưu vào game ở đầu trang.'],
    example: ['Asset nguồn → Nhập pig_cyborg_v2 thành pig_cyborg_v3 → tự mở “Tạo heo mới” với ảnh đó → đặt tên “Heo Cyborg Mk3”, EPIC, SCIFI → Lưu.'],
    notes: ['Không xoá species đã phát hành (save cũ đang giữ) — bỏ chọn “Đang dùng” để tắt.', 'Hiếm hơn phải bán đắt hơn và lớn lâu hơn; chỉ LEGENDARY không lai được.'],
  },
  {
    id: 'asset-source', icon: '📥', title: 'Asset nguồn',
    purpose: 'Ảnh gốc trong asset/animals/asset/ và ảnh tải lên từ máy. Đưa ảnh vào game để tạo heo.',
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
    purpose: 'Sản phẩm tab Vật phẩm của shop (src/core/config/products.ts): gói của một vật phẩm game với giá, số lượng, icon, danh mục, thứ tự, trạng thái bán.',
    steps: ['＋ Thêm sản phẩm → ID, tên, mô tả, vật phẩm nhận được, số lượng mỗi lần mua, giá, icon → xem trước thẻ shop.', 'Ngừng bán / Bán lại bằng nút trên dòng.', '💾 Lưu sản phẩm vào game → mở shop trong game.'],
    example: ['Gói “Thức ăn ×10” giá 230: vật phẩm FOOD_BASIC, số lượng 10, giá 230, thứ tự 15 → hiện giữa Thức ăn và Thuốc.'],
    notes: ['Sản phẩm đã phát hành không xoá được (lịch sử giao dịch trỏ tới) — dùng Ngừng bán.', 'Giá đổ máng vẫn theo giá gốc vật phẩm, không theo gói.', 'Heo bán trong shop chỉnh ở Quản lý heo (Giá mua, Cấp mở khoá).'],
  },
  {
    id: 'breeding', icon: '🧬', title: 'Phối giống',
    purpose: 'Ba tab trên cùng một dữ liệu phối giống của game: 🧬 Sơ đồ phả hệ (heo xếp theo thế hệ, bấm một heo để thấy bố mẹ, tổ tiên, hậu duệ), 📐 Luật đang chạy (sửa được: Random Genetics theo độ hiếm, Gene Pool, Công thức đặc biệt; kiểm tra dữ liệu; thử một cặp với random seed) và ✏️ Bảng ghi đè cặp: Heo A + Heo B → các kết quả với tỷ lệ % (src/core/config/breedingPairs.ts). Cặp không có luật ghi đè: công thức đặc biệt lấy đúng % của nó trước, random genetics chia phần còn lại (bố mẹ > cùng bậc / bậc giữa > lên 1 bậc) — mọi cặp hợp lệ đều sinh được con.',
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
    notes: ['Điều kiện ngày/đêm (đom đóm chỉ đêm hè) và chuyển động nằm trong src/core/config/seasonFx.ts.', 'Hiệu ứng không bấm được, không đổi vị trí / va chạm / camera; tắt khi "Giảm chuyển động".'],
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
