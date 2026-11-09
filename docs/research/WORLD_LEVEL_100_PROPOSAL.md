# ĐỀ XUẤT — Nâng World Level tối đa từ 20 lên 100

**Ngày:** 2026-11-09 · **Loại:** đề xuất, **không triển khai** · Liên quan: `PLOT_UPGRADE_FORGING_RESEARCH.md` §10.5
Ký hiệu: **[XM]** đã xác minh trong code/content · **[SL]** suy luận · **[ĐX]** đề xuất.

## 1. Hiện trạng [XM]

- Một World Level cho cả game, **tối đa 20**, bảng XP trong `content/shared/progression.json` (cấp 20 = 67.135 XP).
- **Cấp không được lưu**: save chỉ lưu XP từng Area (`progression.areas.*.xp`); cấp tính lại từ XP mỗi lần (`levelFromXp`, `core/progression/levels.ts`). → Đổi bảng XP **không cần migration save**.
- Cấp chỉ dùng làm **cổng mở nội dung**, không dùng để tăng độ khó trận đánh: mở Area (Garden 3, Aquarium 6, Cloud/Adventure 8), tầng mây 2–10 (cấp 9–20), khu Garden 2–4 (8/12/16), chuồng Farm (2–10), vùng Adventure (`fromWorldLevel`), đồ trang trí Farm, 4 thành tựu cấp 5/10/15/20. Cấp nhân vật Adventure là hệ riêng.
- World Development = cấp + Codex/10 + công trình Lv3; chỉ gác mở Area (15–16).
- Bot 60 ngày: cấp 20 ở **ngày 45,5**, XP cuối game tăng **~3.600/ngày**; ngày 60 có 114.848 XP (dư ~47.700 XP không đổi ra gì).

## 2. Hai cách làm

| | **A. Giữ nguyên 1–20, nối thêm 21–100** (khuyến nghị) | B. Dãn lại toàn bộ 1–100 |
|---|---|---|
| Nội dung đang có | Không đổi cổng nào | Phải đổi lại mọi con số cổng (tầng, khu, chuồng, vùng, Area, thành tựu) |
| Cân bằng đã thử | Giữ nguyên nhịp 45 ngày đầu | Phải cân lại từ đầu |
| Save cũ | XP cũ đổi thẳng ra cấp mới (bot ngày 60 → cấp 29) | Người chơi có thể thấy cấp "nhảy" khó hiểu |
| Rủi ro | Thấp | Cao |

## 3. Đường cong đề xuất cho cấp 21–100 [ĐX]

```
XP để lên cấp n (n ≥ 21) = 4.000 + 300 × (n − 21)
```

| Cấp | Tổng XP | XP cho cấp đó | Sau cấp 20 (ngày) | ≈ Ngày chơi (bot 3 phiên/ngày) |
|---|---|---|---|---|
| 21 | 71.135 | 4.000 | 1 | 46 |
| 25 | 90.135 | 5.200 | 6 | 51 |
| 30 | 120.635 | 6.700 | 15 | 60 |
| 40 | 204.135 | 9.700 | 38 | 83 |
| 50 | 317.635 | 12.700 | 70 | 115 |
| 60 | 461.135 | 15.700 | 109 | 154 |
| 70 | 634.635 | 18.700 | 158 | 203 |
| 80 | 838.135 | 21.700 | 214 | 259 |
| 90 | 1.071.635 | 24.700 | 279 | 324 |
| 100 | 1.335.135 | 27.700 | 352 | **~397 (≈ 13 tháng)** |

Cấp 21–30 đến nhanh (giữ cảm giác "vẫn lên cấp" ngay sau cấp 20), cấp 90–100 mỗi cấp ~1 tuần. Muốn dài hơn / ngắn hơn chỉ cần đổi 2 số (4.000 và 300) ở Admin. Người chơi ghé ít hơn bot sẽ chậm hơn tương ứng.

## 4. Cấp 21–100 phải **cho** thứ gì [ĐX]

Nếu không có phần thưởng, cấp chỉ là con số. Đề xuất:

| Mốc | Phần thưởng |
|---|---|
| Mỗi cấp | ít Sobi Coin + 1–2 Gems (đủ nhỏ để không thành nguồn Gems chính) |
| Mỗi 5 cấp | một món trang trí / môi trường hoặc bản thiết kế khuông |
| Mỗi 10 cấp | thành tựu mới (Gems 20–50) + danh hiệu |
| Cổng nội dung mới | bậc khuông 3–5 (cấp 25 / 40 / 60), bản thiết kế đúc (30 / 50 / 70 / 90), sau này: nội dung mới thêm vào |

Không đề xuất gắn **độ khó Adventure** hay **giá cả** vào cấp 21–100 (tránh "lên cấp bị phạt").

## 5. Việc kỹ thuật khi làm (để ước lượng, chưa làm) [SL]

- Content: kéo dài bảng `progression.json` tới 100 (hoặc thêm công thức), Admin sửa được.
- UI: huy hiệu ngôi sao HUD đang hiện "Cấp 20" — kiểm 3 chữ số; chữ "Cấp cao nhất"; thanh XP.
- Sự kiện: khi bản mới chạy lần đầu, save cũ sẽ "lên" nhiều cấp cùng lúc → chỉ báo một lần ("Sobi World đã mở tới cấp 100 — bạn đang ở cấp 29"), phát thưởng các cấp đã vượt qua một lần, không spam toast.
- Thành tựu cấp 30–100, World Development tăng theo cấp (không ảnh hưởng vì cổng WD chỉ 15–16).
- Chạy lại bot 60 / 120 ngày, test `levelFromXp` với bảng dài.

## 6. Câu hỏi cho chủ dự án

1. Chọn cách **A** (nối thêm 21–100, khuyến nghị) hay **B** (dãn lại cả 1–100)?
2. Mục tiêu thời gian chạm cấp 100 cho người chơi đều đặn: **~1 năm** (như bảng) hay khác?
3. Phần thưởng mỗi cấp có gồm Gems không, và bao nhiêu?
