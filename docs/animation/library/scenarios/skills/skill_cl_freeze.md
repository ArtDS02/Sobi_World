# Kịch bản: Đóng Băng (`skill_cl_freeze`) — lớp Pháp Sư

```json scenario
{
  "id": "skill_cl_freeze", "kind": "skill", "name": "Đóng Băng", "element": "WATER", "tier": 1, "durationMs": 1350,
  "status": "draft", "refs": ["REF-ICE-ENCASE-001"], "bibles": ["motifs/ice", "elements/WATER", "actions/projectile"],
  "assets": [
    { "id": "fxs_ice_shard", "state": "have", "layer": "L1" },
    { "id": "fx_ice_grow", "state": "new", "layer": "L1", "spec": "Flipbook 6 khung, mỗi khung 256×256, ghép ngang 1536×256, nền trong suốt, pivot giữa cạnh đáy (đặt dưới chân mục tiêu). K1 3 tinh thể nhọn nhỏ nhô lên ở mặt đất + sương · K2 tinh thể cao 25%, nhánh nhọn tỏa từ tâm · K3 cao 50%, bắt đầu khép thành vỏ · K4 cao 80%, vỏ băng gần kín, cạnh thẳng góc cạnh · K5 vỏ kín, đỉnh nhọn, mặt băng có vệt sáng chéo · K6 = K5 + một lấp lánh 4 cánh ở góc trên. Xanh rất nhạt #bfe8ff, trong suốt 60–80% để vẫn thấy sinh vật bên trong, viền nâu ấm mảnh. Băng góc cạnh, KHÔNG tròn mềm như nước." },
    { "id": "fx_ice_encase", "state": "have", "layer": "L1" },
    { "id": "fx_ice_shatter", "state": "have", "layer": "L1" },
    { "id": "fxs_snowflake", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Pháp sư thổi hơi lạnh, **mảnh băng nhọn** xé gió tới mục tiêu; tại chỗ trúng **băng mọc từ chân lên theo từng nấc** (lách cách) bọc kín — hoặc nếu không đóng băng được thì băng mọc nửa chừng rồi **vỡ vụn**. Cảm giác: lạnh, giòn, dứt khoát. T1 (power 0,8), 60 % Đóng băng.
Nguồn: thiết kế gốc ("bông tuyết lớn bay tới, băng mọc từ chân bọc kín"); motif [ice](../../bibles/motifs/ice.md) (đổi bông tuyết tròn xoay → **mảnh băng nhọn**, vì băng là góc cạnh).

## 2. Hiện tại
`fxs_snowflake` bay xoay (`throw`) → `fx_ice_encase` khung 0–2 → hit-stop 80, rung 3. Audit: `STATIC_HERO`, đã thêm dư âm tuyết + vệt băng (2026-11-05). Bông tuyết tròn xoay đọc như trang trí, không như đòn đánh; băng hiện trong 1 nhịp, không có nấc.

## 3. Kịch bản theo nhịp
| # | ms | Người dùng | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Chuẩn bị | 0–350 | pose `cast`, thu tay về ngực | sương lạnh tụ quanh người, 8 bông tuyết hút vào tay | — | tint lạnh 8 % | "whsss" |
| 2 Phóng | 350–420 | đẩy tay, giật lùi 8 px | mảnh băng rời tay, **mũi nhọn hướng mục tiêu** | — | — | "tsk" |
| 3 Bay | 420–700 | lò xo về | bay **thẳng** nhanh, kéo giãn, vệt tuyết | — | — | rít |
| 4 Trúng | 700 | — | mảnh băng cắm vào, vỡ thành mảnh nhỏ | khựng | hit-stop light 60, rung 3 | "tik" |
| 5a Đóng băng | 700–1100 | — | **băng mọc từ chân theo 4 nấc** (`fx_ice_grow` K1→K6, mỗi nấc một tiếng), khóa: lấp lánh | đứng hình, tint lạnh; `st_freeze` | — | "krr-krr-KRRK" |
| 5b Không đóng băng | 700–1000 | — | băng mọc tới K3 rồi **vỡ** (`fx_ice_shatter` nhỏ) | rùng mình | — | "krr… tinh" |
| 6 Dư âm | 1000–1350 | idle | tuyết rơi chậm, sương bò sát đất, vệt băng dưới chân | — | tint về | gió lạnh |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | tint lạnh | — | `tint #bfe8ff 0.08` | 0–1300 |
| L1 | mảnh băng bay; băng mọc / vỡ | `fxs_ice_shard`, `fx_ice_grow`, `fx_ice_shatter` | `prop fly` (inQuad) + `stretch`, xoay theo hướng bay (không `spin`); `strip fx_ice_grow` theo nấc: `frames [0,1]` hold 60 → `[2,3]` hold 60 → `[4,5]` (đóng băng) / `[0,2]` rồi `fx_ice_shatter` (không) | 420–1100 |
| L2 | lõi lạnh trên tay; lấp lánh khi khóa | — | `glow #bfe8ff` 0–350; `burst star_pop` nhỏ 1050 | 0–1100 |
| L3 | tuyết hút vào; vệt tuyết; mảnh băng vỡ; tuyết rơi; vệt băng | `fxs_snowflake` | `burst snow_pop` 0; `trail snow_trail every 60`; `burst ice_pop` 700; `burst snow_fall` 1000; `decal ring #bfe8ff` 700–1350 | 0–1350 |
| L4 | hit-stop, rung; mục tiêu khựng | — | `stop light` 700; `shake 3`; `move shake` nhỏ | 700–900 |
L1 đạt 3/3: biến hình (băng mọc 6 khung theo nấc) · phụ sinh (vệt tuyết từ mảnh băng) · vận tốc (kéo giãn, hướng theo đường bay).

## 5. Asset
| Asset | Lớp | Trạng thái | Ghi chú |
|---|---|---|---|
| `fx_ice_grow` | L1 | **mới** | chung với `skill_e_frost_breath`, status `freeze` (apply) |
| `fxs_ice_shard`, `fx_ice_encase`, `fx_ice_shatter`, `fxs_snowflake` | | có | |
Dự phòng: chưa có `fx_ice_grow` → `fx_ice_encase` chia nấc `[0,0]` / `[1,1]` / `[2,3]` với `hold` 60 (tạo cảm giác từng nấc từ 4 khung sẵn có). Nhánh 5a / 5b cần biết status có gắn hay không: kịch bản dùng script `apply` của status `freeze` cho 5a (engine đã phát khi gắn), skill chỉ dựng 5b mặc định.

## 6. Các bước dựng
1. B1 nhịp `{ release 350, impact 700, end 1350 }` (giữ). 2. B2 thân: thu tay, đẩy, giật lùi. 3. B3 L1: đổi `fxs_snowflake` → `fxs_ice_shard` bay thẳng; băng mọc theo nấc (dự phòng trước). 4. B4 L3. 5. B5 L4 (hit-stop light: T1). 6. B6 âm "krr" theo nấc. 7. B7 capture (`battle.skill.skill_cl_freeze` + status `freeze`).

## 7. Nghiệm thu
- `anim:audit`: không `STATIC_HERO` (hình chủ đạo là băng mọc), bậc có T1–T2.
- Capture: khung bay thấy mảnh băng **nhọn, xoay đúng hướng bay**; 3 khung trong 700–950 thấy băng ở **3 độ cao khác nhau**; không có bông tuyết tròn xoay làm hình chính.
