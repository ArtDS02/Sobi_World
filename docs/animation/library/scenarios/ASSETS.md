# Danh mục asset mới cho kịch bản animation

Một nơi duy nhất mô tả các asset **chưa có** mà kịch bản cần (decision 049). Kịch bản ghi `"state": "new"` + `"spec": "Xem scenarios/ASSETS.md"`; Artist làm theo bảng này. Khi asset vào manifest (`art:process`), đổi các kịch bản dùng nó sang `"state": "have"` (test bắt lỗi nếu quên).

**Quy ước chung:** flipbook ghép **ngang**, khung vuông trừ khi ghi khác, nền trong suốt, nét Sobi Farm (viền nâu ấm mảnh, tô phẳng + bóng mềm, sáng từ trên-trái, bo tròn kiểu sticker), không chữ / khung / watermark. "Vẽ trắng" = vẽ trắng-xám để game tô theo màu hệ. Pivot: `đáy` = giữa cạnh dưới (đặt ở chân), `tâm` = giữa khung. Hướng: chuyển động sang **phải**. Tên gốc, không gợi IP (decision 048).

| Asset | Khung × cỡ | Pivot | Nội dung từng khung | Dùng ở (kịch bản) |
|---|---|---|---|---|
| `fx_wave_rise` | 8 × 512² | đáy | xem `skills/skill_nh_tsunami.md` | Nước: tsunami, tide_song, trident |
| `fx_bubble_pop` | 6 × 256² | tâm | xem `skills/skill_nh_bubble.md` | Nước: bubble, e_bubble, soothe |
| `fx_water_column` | 6 × 256×512 | đáy | xem `skills/skill_ult_nh.md` | Nước: ult_nh, trident |
| `fx_ice_grow` | 6 × 256² | đáy | xem `skills/skill_cl_freeze.md` | Băng: cl_freeze, e_frost_breath, status freeze |
| `fx_hit_burst` | 6 × 256², vẽ trắng | tâm | xem `actions/attack.md` | đánh thường, va chạm chung thay `fx_pow_star` |
| `fx_rock_burst` | 6 × 256² | tâm | K1 khối đá nguyên có vết nứt sáng · K2 nứt đôi, khe sáng · K3 hai nửa tách ra 2 phía + 4 mảnh nhỏ · K4 mảnh văng thấp, bụi bung · K5 mảnh rơi xuống, bụi lan ngang · K6 vài sỏi + bụi mỏng. Đá nâu #c08a50, cạnh góc cạnh | Đất: rock_smash, e_rock_slam, e_bronze_crush (tô đồng) |
| `fx_dust_ring` | 6 × 512×256 (rộng) | đáy | K1 vòng bụi mỏng sát đất · K2–K4 vòng bụi lan rộng ra hai bên, cuộn lên thấp (cao ≤ 30%) · K5 bụi tơi · K6 bụi mờ lắng. Màu kem-nâu, vẽ trắng được | Đất: mọi đòn dậm / rơi; heavy body attack |
| `fx_stone_rise` | 6 × 256² | đáy | K1 đất nứt hình sao, bụi · K2 mũi đá nhô 20% · K3 khối đá trồi 50%, đất vụn rơi khỏi thân · K4 trồi 90% · K5 đứng yên, bụi lắng · K6 = K5 + vết nứt sáng (để nối sang `fx_rock_burst`) | Đất: stone_skin, mountain_shell, quake, ult_qs, e_stone_guard |
| `fx_crack_spread` | 6 × 512×128 (dải) | trái-giữa | vết nứt mặt đất lan từ trái sang phải theo nhánh: K1 điểm nứt · K2 30% · K3 60% · K4 100% có nhánh rẽ · K5 khe phát sáng nhẹ · K6 khe mờ. Vẽ trắng (tô theo hệ: Đất nâu, Hư Không tím) | Đất: quake, ult_qs, e_seal_quake; Sấm / Hư Không khi cần |
| `fx_ink_bloom` | 6 × 256² | tâm | K1 giọt mực tròn · K2 bung ra mép mềm gợn · K3 loang rộng nhất, xúc tu mực ngắn · K4 **co lại** về tâm · K5 khói tròn nhỏ tách ra · K6 vài đốm tím. Tím than #7a4ed0, mép mềm, không viền hồng răng cưa (đó là Umbraflux) | Bóng tối: dm_ink, dm_ink_veil, e_shadow_bite, e_wraith_touch, e_curse |
| `fx_smoke_curl` | 6 × 256², vòng lặp | tâm | khói đặc tròn cuộn **liên tục**: K1→K6 các cuộn khói xoay chậm rồi quay về K1 (khung đầu = cuối). Vẽ trắng; làm **lớp phủ** sau / quanh vật tĩnh để vật "thở" | Bóng tối: lớp phủ cho fxp_* tối; Lửa (khói) |
| `fx_flame_loop` | 8 × 256², vòng lặp | đáy | ngọn lửa cháy liên tục, lưỡi lửa đổi hình mỗi khung, khung 8 nối khung 1. Vẽ cam #ff7a2a → vàng #ffd36a ở lõi | Lửa: lớp phủ cho fxp_flame_crown, fire_hammer, phoenix, forge_anvil, meteor; status burn |
| `fx_fire_blast` | 6 × 256² | tâm | K1 lõi vàng chói · K2 nổ cầu lửa tròn · K3 lửa bung ra lưỡi nhọn, tàn bay lên · K4 vòng khói cam bao quanh · K5 khói xám ấm bốc lên · K6 tàn rơi. Khác `fx_flame_burst` (4 khung, quá tải) | Lửa: đòn T2–T3 |
| `fx_vine_grow` | 8 × 512×256 (rộng) | trái-đáy | dây leo **mọc dài dần** từ trái sang phải theo đường cong chữ S: K1 mầm · K2–K5 dây dài 20/40/60/80%, lá bung dọc dây · K6 100% đầu dây cuộn vòng · K7 siết lại (cuộn chặt hơn) · K8 = K7 + 3 lá rơi | Thiên nhiên: binding_roots, e_vine_lash, sprout, ult_mm |
| `fx_bloom_open` | 6 × 256² | đáy | nụ hoa → hé → nở từng tầng cánh → nở hết, nhị sáng → cánh rung → 3 cánh rơi. Vẽ trắng tô theo hệ (hoa hồi máu: xanh lá nhạt; độc: tím) | Thiên nhiên: mm_blossom, ult_mm, e_corrupt_bloom; hồi máu |
| `fx_slash_long` | 6 × 512×256 | tâm | vệt chém dài mở ra (K1 vạch mảnh, K2–K3 mở rộng thành lưỡi liềm sáng, K4 rộng nhất có tia lóe ở đầu), rồi khép (K5 mảnh dần, K6 tắt). Vẽ trắng-bạc | Kim: steel_slash, cl_power_strike, cl_rend, cl_pierce, e_metal_claw |
| `fx_metal_spark` | 6 × 256² | tâm | lóe chữ thập 4 cánh nhọn + tia kim văng **thẳng** 8 hướng, tắt nhanh. Bạc trắng #cfd9e6 | Kim: va chạm; khiên đỡ đòn |
| `fx_cloud_flash` | 6 × 512×256 | đáy | đám mây bão cuộn (vẽ mây tím xám), bên trong **chớp sáng** ở K2, K4 (tia nhỏ trong mây), K6 lại tối. Dùng phủ lên `fxp_storm_cloud` hoặc thay | Sấm: call_thunder, ult_ld |
| `fx_spark_arc` | 6 × 256², vòng lặp | tâm | hồ quang nhỏ nhảy ngẫu nhiên quanh tâm, mỗi khung một hình zigzag khác. Vàng #ffe14a | Sấm: dư âm trên thân; status stun (giật) |
| `fx_star_bloom` | 6 × 256² | tâm | điểm sáng → sao 4 cánh nở → sao 8 cánh + vòng sáng → tách thành lấp lánh → lấp lánh rơi chậm → tắt. Vàng ấm #ffe98a | Ánh sáng: qt_*, va chạm sáng, hồi sinh |
| `fx_void_implode` | 6 × 256² | tâm | vòng rỗng méo **co vào** tâm (K1–K3, các vệt bị hút vào), K4 điểm đen sáng viền, K5 **bung ngược** vòng sóng ra ngoài, K6 vòng mờ tắt. Tím-lam #8c7cff | Hư Không: hk_*, ult_hk, ult_mythical |
| `fx_shield_form` | 6 × 256² | tâm | khiên lục giác: các mảnh lục giác bay vào ghép dần (K1 3 mảnh, K2 7, K3 kín nửa, K4 kín vòm), K5 sóng sáng chạy qua mặt khiên, K6 khiên trong mờ đứng yên. Vẽ trắng tô theo hệ. Thay `fx_shield_dome` (4 khung, khung 4 nhạt) | Khiên / thủ: stone_skin, cl_shield_wall, tg_bronze_wall, status shield, guard |
| `fx_buff_rise` | 6 × 256×512 | đáy | cột sáng mảnh từ chân **vút lên**, các mũi nhọn / vệt bay lên trong cột, đỉnh lóe, tan từ dưới lên. Vẽ trắng (đỏ cho công, lam cho thủ…) | buff tăng chỉ số, status *Up apply |
| `fx_debuff_sink` | 6 × 256×512 | đáy | khói nặng **chảy xuống** từ đầu bao thân, đọng thành vũng mờ ở chân rồi tan. Vẽ xám-tím | debuff giảm chỉ số, status *Down apply |
| `fx_energy_orb` | 6 × 256², vòng lặp, vẽ trắng | tâm | quả cầu năng lượng: lõi tròn sáng + 2–3 dải năng lượng **cuộn quanh** lõi, mỗi khung dải xoay tiếp; viền ngoài gợn. Khung 6 nối khung 1. Thay `fxp_bubble_big` (bong bóng nước) đang bị mượn làm quả cầu cho mọi hệ | Pháp sư: cl_energy_orb; quả cầu tụ lực chung |
| `fx_heal_bloom` | 6 × 256² | đáy | vòng sáng mềm nở từ chân, các giọt sáng tròn + dấu cộng bo tròn bay lên chậm, tan mềm. Xanh lá #7ee08a → trắng | hồi máu: cl_mend, cl_healing_rain, cl_second_wind, regen, e_soothe |

Thứ tự tạo đề xuất (nhiều kịch bản dùng nhất trước): `fx_hit_burst`, `fx_shield_form`, `fx_buff_rise`, `fx_debuff_sink`, `fx_dust_ring`, `fx_rock_burst`, `fx_fire_blast`, `fx_flame_loop`, `fx_slash_long`, `fx_ink_bloom`, rồi các asset riêng hệ.
