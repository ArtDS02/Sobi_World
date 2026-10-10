# AGENT RULES — Luật làm việc cho AI agent

Áp dụng cho **mọi giai đoạn**. Đọc file này trước khi làm bất cứ việc gì.

## 1. Tài liệu
- Thứ tự ưu tiên khi mâu thuẫn: `SOBI_WORLD_PROJECT_SPEC_V2.md` > `ARCHITECTURE.md` > `GAME_BALANCE.md` > code hiện có.
- Đầu mỗi phiên: đọc `docs/PROGRESS.md` để biết trạng thái hiện tại.
- Cuối mỗi phiên: cập nhật `docs/PROGRESS.md` (đã làm gì, đang dở gì, quyết định đã đưa ra, vấn đề còn mở).
- Quyết định kỹ thuật quan trọng: ghi một file ngắn trong `docs/decisions/` (bối cảnh, lựa chọn, lý do), đánh số tiếp theo.
- `docs/decisions/` thắng `GAME_BALANCE.md` và tài liệu cũ khi mâu thuẫn về con số đã chốt.
- `docs/archive/sobi-farm/` chỉ để tham khảo lịch sử (spec v4, DECISIONS cũ). Không làm theo nếu mâu thuẫn với tài liệu Sobi World.

## 2. An toàn
- Làm trên nhánh git riêng cho từng giai đoạn: `phase-XX-<ten>`, tách từ `main`; xong giai đoạn thì merge về `main` và gắn tag `phase-XX`.
- Commit nhỏ, message rõ, sau mỗi bước chạy được.
- **Không làm mất save của người chơi.** Mọi thay đổi cấu trúc save phải có migration và test với save thật.
- Không xóa tính năng đang có trừ khi spec yêu cầu.

## 3. Kiến trúc
- Tuân thủ quy tắc phụ thuộc trong `ARCHITECTURE.md`. Area không import Area khác.
- Nội dung và con số đặt trong `content/`, có schema. Không hard-code.
- Mọi logic số liệu theo thời gian đi qua `simulate()`, dùng chung cho online, nền và offline.
- Ngẫu nhiên dùng `core/rng` có seed.
- Chữ hiển thị cho người chơi đặt trong bảng chuỗi (string table), không viết thẳng trong code, để sau này thêm tiếng Anh dễ.
- Không thêm thư viện mới nếu không cần. Nếu thêm, ghi lý do.
- Không thêm server, multiplayer, kết nối mạng.

## 4. Admin
- Nội dung mới của giai đoạn nào thì thêm màn hình Admin để chỉnh nội dung đó trong cùng giai đoạn.
- Admin không bao giờ có mặt trong bản build cho người chơi.

## 5. Chất lượng
- Viết test cho logic mới trong `core`, `systems` và `areas/*/logic`.
- Cổng chất lượng: `npm run check` (typecheck + lint + guard kiến trúc + asset + unit test) phải xanh sau mỗi commit.
- Trước khi báo xong: chạy toàn bộ test, chạy game, thử các luồng chính, build bản desktop (từ GĐ4 trở đi).
- Cập nhật README của thư mục có thay đổi.

## 6. Khi phải tự quyết
- Spec chưa nói rõ: chọn phương án **hợp lý nhất, rồi hấp dẫn nhất, rồi dễ làm nhất**, giữ tinh thần cozy. Ghi lựa chọn vào `PROGRESS.md`.
- Thay đổi lớn về gameplay hoặc phạm vi: **hỏi chủ dự án trước**.
- Không tự mở rộng sang việc của giai đoạn khác.

## 7. Báo cáo (tiếng Việt, ngắn gọn)
Cuối mỗi bước lớn và cuối giai đoạn, báo theo mẫu:
```
✅ Đã làm:
📁 File thay đổi chính:
🧪 Đã kiểm tra:
⚠️ Vấn đề / quyết định đã tự đưa ra:
👉 Chủ dự án cần kiểm tra:
➡️ Bước tiếp theo:
```

## 8. Gameplay trước, art sau (decision 017)
- Giai đoạn gameplay dùng **placeholder** cho art, animation, VFX, âm thanh; UI chức năng vẫn đủ để chơi và kiểm thử. Placeholder không chặn merge nếu gameplay đạt tiêu chí nghiệm thu.
- Asset luôn đi qua id → manifest, nên thay placeholder bằng art cuối không được đụng logic.
- Nhu cầu art mới ghi vào `docs/ASSET_TODO.md`; **không làm art/animation/VFX/polish UI ngoài GĐ14** và không quay lại phase đã nghiệm thu chỉ vì việc đó.
- Vẫn được sửa phase cũ khi có **lỗi gameplay, lỗi kiến trúc hoặc vấn đề tích hợp thật**: đánh giá ảnh hưởng, sửa phần cần thiết, ghi vào `PROGRESS.md`. Không dùng nguyên tắc này để bỏ qua lỗi.
- Khi gắn tag hoặc merge: kiểm tra tag đã tồn tại chưa, không force-push, không tạo tag trùng.
