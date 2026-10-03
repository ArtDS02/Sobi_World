# 002 — Sinh vật có thể chết

**Ngày:** 2026-10-04 · **Trạng thái:** Đã chốt (chủ dự án duyệt)

## Bối cảnh
Sobi Farm có quyết định D21: heo không bao giờ chết, bỏ bê chỉ mất thời gian và giá bán.
Spec Sobi World V2 §2, §7: bệnh 72 giờ thì chết.

## Lựa chọn
Theo spec Sobi World: **bệnh → nguy kịch (48 giờ) → chết (72 giờ)** nếu không chữa. D21 của Sobi Farm bị thay thế.
Kèm lưới an toàn ở `004-offline-safety-net.md` và mức phạt giá trị nhẹ ở `003-balance-timescale.md`.

## Hệ quả kỹ thuật (GĐ2)
- Engine bệnh hiện tại (`pigHealth.ts`, `advancePig.ts`) thêm mốc nguy kịch/chết; chết là sự kiện `creature.died`.
- Con chết rời chuồng, Codex lưu một dòng kỷ niệm.
- Test golden/fuzz có giả định "không chết" phải viết lại theo luật mới.
