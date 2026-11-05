# Motif BĂNG (ice)

Băng thuộc hệ **Nước** trong game (`skill_cl_freeze`, `skill_e_frost_breath`, status `freeze`, phản ứng `reaction_shatter`). Motif dùng khi một skill / status mang tính băng; màu vẫn theo hệ Nước, nhạt hơn (`#bfe8ff` đang dùng trong status `freeze`).

## 1. Tính cách — đối lập với nước lỏng
Băng **cứng, giòn, dừng đột ngột**. Đọc được khi bỏ màu nhờ: cạnh thẳng / góc nhọn, lan ra **từ một tâm** theo nhánh, vỡ thành **mảnh sắc** văng theo đường thẳng (không tròn, không parabol mềm như giọt).

| Yếu tố | Nước | Băng |
|---|---|---|
| Hình thành | gom, dâng, chảy | **kết tinh lan từ tâm**, nhánh nhọn, phát ra từng nấc |
| Easing | in-out mềm | bước (step), dừng phịch; overshoot nhỏ khi khóa |
| Va chạm | vỡ vòng tròn, bắn giọt | **nứt** (1 khung báo) rồi **vỡ** mảnh sắc |
| Dư âm | vũng, giọt | sương lạnh bò sát đất, tuyết rơi chậm, lấp lánh |
| Âm thanh | ào, tõm | lách cách, rắc (nứt), choang (vỡ) |

## 2. Nhịp mẫu (x1)
- **Đóng băng mục tiêu (status `freeze` apply)**: tinh thể bám chân 120 → bò lên thân 240 (theo nấc 3–4 bước) → khóa: `stop` 40–60 + lấp lánh. Tổng 400–600.
- **Loop**: thân đứng yên (`freezeBody`), mỗi 1,6 s một lấp lánh nhỏ + tuyết rơi — giữ như hiện tại.
- **Hết / vỡ (expire, `reaction_shatter`)**: nứt 1 khung (đường nứt sáng) → `stop` 60 → vỡ: `fx_ice_shatter` + `ice_pop` văng thẳng + rung theo bậc → mảnh rơi xuống đất, tan trong 400 ms.
- **Hơi thở băng (cone)**: luồng lạnh trải rộng dần 400 ms (`cone`), sương bám lại trên mục tiêu, kết thúc bằng tinh thể mọc ở chân mục tiêu (hình thành dần, không bật ra).

## 3. Hình chủ đạo "sống" (STANDARDS §2)
- `fx_ice_encase` (4 khung) đang là flipbook duy nhất cho băng bọc — đủ cho status, **chưa đủ** làm hình chủ đạo của skill (cần ≥ 6 khung hoặc chia đoạn `frames: [0,1]` → `[2,3]` theo nấc với `hold`, tạo cảm giác lan từng bước).
- Đạn băng (`skill_cl_freeze`): `fxs_snowflake` đang bay tĩnh → đổi thành **mảnh băng nhọn** quay theo hướng bay (`stretch`), `trail` `snow_trail`, va chạm `stop` + nứt + `fx_ice_encase` lan.

## 4. Asset hiện có
`fx_ice_encase` [4], `fx_ice_shatter` [4], `fxs_ice_shard`, `fxs_snowflake`, hạt `ice_*`, `snow_*`, `fx_env_snowflakes` [8] (môi trường). **Thiếu:** flipbook kết tinh lan từ tâm 6–8 khung (dùng cho skill băng và phản ứng); flipbook đường nứt.

## 5. Hiện trạng (audit 2026-11-05)
- `skill_cl_freeze` T1 / T2: STATIC_HERO (`fxs_snowflake`), NO_AFTERMATH → mảnh băng nhọn + dư âm sương / tuyết.
- `skill_e_frost_breath` T2 / **T0**: IMPACT_UNDER_TIER, NO_AFTERMATH → thêm `stop medium` + `shake 3` lúc băng khóa; tinh thể mọc ở chân mục tiêu.
- `reaction_shatter`: đã mạnh (stop 160, punch 1,05, shake 10, knock 44) — giữ; thêm 1 khung nứt trước khi vỡ.

## 6. Cấm
Băng tan chảy như nước lỏng trong lúc đang bọc; mảnh vỡ tròn mềm; vỡ không có báo trước (thiếu nứt); băng che mất mặt sinh vật quá 1 khung (vẫn phải nhận ra con vật — style guide §1).
