# 035 — 46 loài mới, lai giống ra loài hiếm, mỗi sinh vật một kiểu bơi, câu cá ba nhịp, bảng tên và popup

**Ngày:** 2026-10-17 · **Trạng thái:** Chủ dự án yêu cầu (a)–(f) và cho phép tự quyết; chờ duyệt bản làm

## Art và nội dung
- Cắt 13 sheet Gemini của chủ dự án: `aquarium-04-fish` (18 cá / sinh vật biển), `farm-02-pigs` (12 heo, concept
  NOT DESIGNED của catalogue; khung ngủ / thức từ ảnh duyệt), `garden-04-crops` (8 cây × 4 giai đoạn), `cloud-05-flowers`
  (8 hoa × 4 giai đoạn). Icon vật phẩm (cá, hạt, nông sản, hoa) lấy từ sprite đã duyệt: `scripts/art/derive-icons.ts`.
- Loài mới có trong content (độ hiếm, giá, thời gian lớn), đơn hàng ở Bảng đơn, chuỗi Anh. Cá Heo Con là cá **Huyền thoại**
  duy nhất, không câu được, chỉ nở từ trứng lai. Hai hoa thường mới tăng 2 điểm % đột biến khi phối giống.

## Lai giống (systems/hybrid, content/<area>/hybrids.json)
- Công thức: hai loài cha mẹ (không kể thứ tự) → loài hiếm hơn với tỉ lệ %. Mỗi lần hụt +`pityStep` điểm; hụt
  `pityAfter` (4) lần liền thì lần sau chắc chắn ra. Bộ đếm hụt nằm trong save (trường tùy chọn, save cũ không cần đổi).
- **Garden / Cloud — Vườn lai giống** (nút "Lai giống" trên khay): mỗi lần dùng 1 nông sản / hoa của mỗi cây cha mẹ và một
  khoản phí (30 / 60 Sobi Coin); thành công cho 3 / 2 hạt loài mới, hụt trả lại 1 hạt của một cây cha mẹ. Cây "chỉ lai"
  (`hybrid: true`) bị khóa ở cửa hàng và ở bảng hạt cho tới lần lai thành công đầu tiên; hạt trong túi luôn gieo được.
  Sổ lai giống liệt kê mọi công thức, kết quả là bóng đen "Giống bí ẩn" tới khi tìm ra; bấm một công thức để đặt sẵn cặp.
- **Aquarium**: một đực một cái của hai loài có công thức được cho đẻ; trứng nở ra loài hiếm theo tỉ lệ, hụt thì là loài của
  mẹ. Hộp thoại cho đẻ ghi "có thể nở ra … (x%)" và có Sổ lai cá.
- **Farm**: 12 heo mới đi theo hệ thống đột biến sẵn có (`content/farm/breeding.json`).
- Bảo đảm: mọi loài trên mức khởi đầu đều có công thức mà cha mẹ lần ra được từ hàng bán / cá câu được
  (`tests/unit/hybrids.test.ts`).

## Mỗi sinh vật một kiểu bơi (scene/swimStyles.ts)
Cá thường vẫy đuôi; cá nhỏ lanh lẹ lao nhiều; cá dài (Koi, Kim Long, Betta) lượn chậm; cá dẹt lướt; chạch uốn cả thân;
cá đáy bơi thấp; cá hộp lơ lửng rung vây; cá nóc thỉnh thoảng phồng tròn; sứa co bóp để nổi rồi chìm; bạch tuộc co lại
rồi phụt đi; rùa quạt chèo từng nhịp; đuối vỗ cánh lượn dài; cá ngựa đứng thẳng nhấp nhô; cá heo bơi nhanh nhấp nhô
lên xuống. Chỉ là trình bày, không đổi state.

## Câu cá ba nhịp (ui/fishingGame.ts)
1. **Quăng**: thanh lực chạy qua lại, dừng ở Gần bờ / Giữa hồ / Xa khơi. Càng xa càng dễ gặp cá hiếm
   (`fishing.depthLuck` [0; 0,4; 0,9], `castLine` nhận `depth`) nhưng cá khỏe hơn.
2. **Chờ cá cắn**: phao nổi, có cú **rỉa giả** (giật lúc này là hụt), phao chìm hẳn thì giật trong 0,9 giây.
3. **Kéo cá**: giữ nút (hoặc phím Cách) để nâng vùng xanh, giữ cá trong vùng tới khi kéo đủ 100%.
- Bóng cá cho biết cỡ (nhỏ / vừa / lớn / **vàng lấp lánh** hiếm); cá lớn khó kéo hơn nhưng cộng điểm. **Chuỗi câu** (câu
  được liền nhau, tối đa +5 bậc) cộng điểm. Điểm chuyển cho `castLine` như cũ (bảng bốc vẫn ở logic).
- Cần câu nghỉ 120 → 60 giây (mỗi lần câu giờ dài hơn).

## Bảng tên, popup
- Chữ trên bảng gỗ / băng rôn / bảng tên Aquarium nằm đúng vùng trống (bên phải icon, trong mép gỗ), cỡ chữ tự chọn lớn
  nhất mà vừa, trong khoảng sàn–trần (`ui/world/signText.ts`).
- Mọi dialog (trừ cửa hàng Area đã có đầu riêng): dải tiêu đề gỗ, nút ✕ tròn ở góc, chỉ thân cuộn, thanh nút cố định đáy.
- "Trong lúc bạn vắng mặt": mỗi nơi một thẻ (ảnh khu vực, nhãn "Cần làm ngay" / "Ổn cả", một nút đi tới), nơi gấp lên đầu.
