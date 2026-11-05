# Kịch bản: Lò Rèn Nguyên Thủy (`skill_ult_hg`) — tuyệt kỹ

```json scenario
{
  "id": "skill_ult_hg", "kind": "skill", "name": "Lò Rèn Nguyên Thủy", "element": "FIRE", "tier": 4, "durationMs": 3300,
  "status": "draft", "refs": [], "bibles": ["actions/ultimate", "elements/FIRE"],
  "assets": [
    { "id": "fxp_forge_anvil", "state": "have", "layer": "L1" },
    { "id": "fxp_fire_hammer", "state": "have", "layer": "L1" },
    { "id": "fx_flame_loop", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (phủ lên đe, to)" },
    { "id": "fx_fire_blast", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_buff_rise", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô đỏ cam)" },
    { "id": "fxs_spark", "state": "have", "layer": "L3" },
    { "id": "fxs_ember", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace", "bg_scene"]
}
```

## 1. Ý tưởng
**Lò rèn nguyên thủy mở giữa trời**: đe khổng lồ đỏ rực trên phe địch, **búa khổng lồ giơ cao rồi nện ba nhịp** — mỗi nhịp một **vòng sóng nhiệt** quét phe địch, đe **nóng thêm**; nhịp ba mạnh nhất; **tia lửa bay về** rèn cả đội. Cảm giác: lò rèn thở phì phò, nhịp nặng 1-2-**3**. Tuyệt kỹ T4: Bỏng địch + Công cả đội.

## 2. Hiện tại
Đe + búa `hover` 2 s (hai ảnh đứng yên), `fx_flame_burst` 3 nhịp, rung 6/8/12. Audit: `STATIC_HERO`, `STATIC_SHARE`. Búa không vung — ba nhịp chỉ là rung màn.

## 3. Kịch bản theo nhịp
| # | ms | Cua | Hiệu ứng chính | Quái / đội | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Intro | 0–500 | `cast_roar` | cut-in đỏ cam | — | letterbox; nền **hang lò rèn** đỏ | lò thở |
| 2 Lò mở | 500–1200 | giơ càng điều khiển | đe khổng lồ **hạ xuống** trên phe địch (lún nhẹ), **lửa cháy trên đe**, không khí **gợn nhiệt**; búa hiện, **giơ cao chậm** | — | gợn nhiệt (displacement nền) | phì phò |
| 3 Nhịp 1 | 1200 | — | búa **nện** (vung cung) → vòng sóng nhiệt + nổ lửa ở từng quái | giật | hit-stop light, rung 5 | "BWAMM" |
| 4 Nhịp 2 | 1650 | — | búa giơ – nện; đe **đỏ hơn**, lửa to hơn | giật | hit-stop medium 80, rung 6 | "BWAMM" |
| 5 Lặng | 2000–2100 | — | búa **giơ cao nhất, giữ**, im | — | gần đứng | im |
| 6 Nhịp 3 | 2100 | — | nện mạnh nhất; nổ lửa lớn + nứt đất | bật lùi; `st_burn` | hit-stop ultimate, punch 1,05, chớp 0,4, rung 10 | "BWAMM!!" |
| 7 Rèn đội | 2400–3300 | đón tay | **tia lửa bay về** phe ta thấm vào thân, cột sáng đỏ cam mỗi bạn → `st_atk_up`; đe và búa **tan thành mưa than** | đội phồng | nền về, letterbox rút | ngân |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền lò rèn; gợn nhiệt | — | `bg_scene` (dự phòng `tint #3a1008 0.4`) | 0–3300 |
| L1 | đe + lửa trên đe; búa | `fxp_forge_anvil`, `fx_flame_loop` (to dần), `fxp_fire_hammer` | đe `fall` chậm + `squashOnHit` 500–900, `prop_displace` (gợn nhiệt), tan 2600–3000; búa `hover` + **vung**: `wobble rot 70` một nhịp ở 1100–1200, 1550–1650, giữ cao 2000–2100, nện 2100 | 500–3000 |
| L2 | lõi người dùng; đe đỏ dần | — | `glow $color` actor; `glow #ff4a1a` trên đe tăng mỗi nhịp | 0–2400 |
| L3 | vòng sóng nhiệt; nổ lửa; nứt; tia lửa về đội; cột buff; mưa than | `fx_fire_blast`, `fxs_spark`, `fx_buff_rise`, `fxs_ember` | `decal ring #ff7a2a` foeside mỗi nhịp; `strip fx_fire_blast` per target ×3; `decal crack` 2100; `tether` foeside → allies hạt `spark_trail` 2400; `strip fx_buff_rise` per ally 2600; `burst ember_fall` 2600–3000 | 1200–3300 |
| L4 | hit-stop tăng dần | — | `stop light/medium/ultimate`; `shake 5/6/10`; `punch 1.05` 2100; chớp chỉ ở nhịp 3 | 1200–2300 |
L1 đạt 3/3: biến hình (lửa đe lớn dần, gợn nhiệt) · phụ sinh (tia lửa, than) · vận tốc (búa vung, đe lún).

## 5. Asset
`fx_flame_loop`, `fx_fire_blast`, `fx_buff_rise` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 cua điều khiển; quái giật / bật; đội phồng · B3 đe → búa vung ×3 → tan · B4 sóng nhiệt, nổ, tia lửa về đội · B5 hit-stop tăng dần, bớt chớp · B6 âm · B7 capture (ultimates).

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: búa ở **góc khác nhau** giữa khung giơ và khung nện; lửa trên đe ở nhịp 3 **to hơn** nhịp 1; khung ~2700 cột sáng ở phe ta.
