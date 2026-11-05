# Kịch bản: Huyền Thoại Thức Tỉnh (`skill_ult_mythical`) — tuyệt kỹ

```json scenario
{
  "id": "skill_ult_mythical", "kind": "skill", "name": "Huyền Thoại Thức Tỉnh", "element": "VOID", "tier": 4, "durationMs": 3500,
  "status": "draft", "refs": [], "bibles": ["actions/ultimate", "elements/VOID", "elements/LIGHT"],
  "assets": [
    { "id": "fxp_spirit_circle", "state": "have", "layer": "L1" },
    { "id": "fx_void_implode", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô vàng tím)" },
    { "id": "fx_hit_burst", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô tím)" },
    { "id": "fx_buff_rise", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô vàng)" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace", "bg_scene"]
}
```

## 1. Ý tưởng
**Vòng bốn linh thú** (dạng chung của văn hóa dân gian, không theo IP nào) thức tỉnh sau lưng, **quay**, mỗi linh thú **lóe** một nhịp (4 nhịp); vòng **thu vào** thành cổng vàng tím, bắn **bốn tia màu cộng hưởng** quét phe địch; **ánh vàng mưa xuống** đội. Cảm giác: huyền thoại, hợp lực, trang nghiêm. Tuyệt kỹ T4: sát thương + hồi 20 % + Công / Công phép cả đội.

## 2. Hiện tại
`fxp_spirit_circle grow` + 2 `sweep`, `fx_void_portal`, 4 beam, `fx_boom` chung, slowmo. Audit: `STATIC_HERO`, `STATIC_SHARE`. Vòng không quay theo nhịp, linh thú không lóe từng con.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Quái / đội | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Intro | 0–500 | `cast_hover` | cut-in tím ánh vàng | — | letterbox; nền **vũ trụ** | ngân sâu |
| 2 Thức tỉnh | 500–1400 | bay lên 10 px | vòng linh thú **mở** sau lưng (grow outBack), **quay chậm**, **4 nhịp lóe** (mỗi 200 ms một góc vòng sáng lên + gợn) | — | — | 4 tiếng linh thú |
| 3 Thu vào | 1400–1500 | — | vòng **co** thành **cổng** vàng tím (implode K1–K3) | — | lặng | ù |
| 4 Bắn | 1500–1700 | giật lùi | 4 tia **4 màu** (lam, đỏ, trắng, lục — chung chung, theo 4 phương) **quét** phe địch lệch 50 | — | slowmo 0,7 | hợp âm lớn |
| 5 Trúng | 1700 | — | nổ va chạm tím ở mỗi quái (stagger 100) | bật lùi | hit-stop ultimate, punch 1,05, chớp 0,35, tách màu, rung 9 | "VWAAM" |
| 6 Mưa vàng | 2500–3100 | đáp xuống | **ánh vàng mưa** xuống phe ta, cột sáng vàng mỗi bạn → hồi + `st_atk_up` / `st_matk_up` | đội sáng | — | chuông vàng |
| 7 Outro | 3100–3500 | idle | sao tan | — | nền về, letterbox rút | ngân |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền vũ trụ; letterbox | — | `bg_scene` (dự phòng `tint #1a1040 0.4`) | 0–3500 |
| L1 | vòng linh thú; cổng; 4 tia | `fxp_spirit_circle`, `fx_void_implode`, beam code | `prop grow` + `spin 0.25` + `prop_displace` 500–1400 → co (scale ↓) 1400–1500; `strip fx_void_implode frames [0,3]` 1400; `beam` ×4 màu khác nhau stagger 50 1500–2100 | 500–2100 |
| L2 | lõi người dùng; 4 nhịp lóe trên vòng | — | `glow $color`; `glow` ×4 trên vòng (lệch góc — cần `spot` theo vị trí linh thú hoặc 4 `burst star_big` quanh vòng) | 0–1400 |
| L3 | nổ va chạm; mưa vàng; cột buff | `fx_hit_burst` (tím), `fxs_star`, `fx_buff_rise` (vàng) | `strip fx_hit_burst` per target stagger 100; `burst star_fall` vàng allyside 2500–3000; `strip fx_buff_rise` per ally 2600 | 1700–3500 |
| L4 | slowmo; hit-stop; rung | — | `slowmo 0.7` 1500–1800; `stop ultimate` 1700; `punch 1.05`; `split`; `shake 9`; chớp chỉ ở 1700 | 1500–2000 |
L1 đạt 3/3: biến hình (vòng gợn, co thành cổng) · phụ sinh (tia, ánh vàng) · vận tốc (quay, co).

## 5. Asset
`fx_void_implode`, `fx_hit_burst`, `fx_buff_rise` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 bay lên / đáp; quái bật; đội sáng · B3 vòng → 4 nhịp lóe → cổng → 4 tia · B4 nổ, mưa vàng, cột buff · B5 slowmo + hit-stop; bớt chớp · B6 âm 4 linh thú · B7 capture (ultimates).

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: 4 khung pha 2 mỗi khung một góc vòng sáng khác; khung ~1450 vòng đã **nhỏ**; khung ~2700 cột vàng ở phe ta.
