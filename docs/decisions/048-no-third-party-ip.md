# 048 — Không dùng IP bên thứ ba

## Bối cảnh
Game sẽ phát hành thương mại. Nội dung (sinh vật, nhân vật, vật phẩm, địa danh, tên, ảnh, âm thanh) dễ vô tình giống hoặc nhái IP có bản quyền/nhãn hiệu, đặc biệt khi art sinh bằng AI từ prompt/reference.

## Quyết định
- Cấm mọi asset/tên/mô tả liên quan nhân vật, sinh vật, sản phẩm, thương hiệu của bên thứ ba (chi tiết: `AGENT_RULES.md` §9).
- Mọi thiết kế phải gốc. Nghi ngờ thì bỏ, không "đổi nhẹ để né".
- Có quy trình rà soát chuẩn hai bước (báo cáo ảnh hưởng → chủ dự án duyệt → xóa/thay): `docs/IP_AUDIT_PROMPT.md`.
- Nguồn bên thứ ba hợp lệ (font, âm thanh, lib) ghi tại `docs/THIRD_PARTY.md`.

## Lý do
Giảm rủi ro pháp lý (bản quyền, nhãn hiệu, trade dress) trước khi phát hành; rẻ hơn nhiều so với gỡ sau.

## Hệ quả
- Skill `image-to-asset` / `image-to-prompt` và mọi prompt art phải tuân thủ rule này.
- Phần đã có bị rà soát có thể bị đổi tên/thay art; thay bằng placeholder rồi ghi `ASSET_TODO.md` nếu cần.

## Trạng thái
Chỉ áp dụng cho nội dung MỚI. Nội dung cũ nghi vấn nằm trong `docs/IP_AUDIT_REPORT.md`; việc đổi tên/id/art (kèm migration save) do chủ dự án triển khai sau.
