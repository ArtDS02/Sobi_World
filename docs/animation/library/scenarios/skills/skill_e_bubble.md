# Kịch bản: Phun Bọt (`skill_e_bubble`) — quái Ếch Sương

```json scenario
{
  "id": "skill_e_bubble", "kind": "skill", "name": "Phun Bọt", "element": "WATER", "tier": 2, "durationMs": 1150,
  "status": "draft", "refs": ["REF-WATER-BUBBLE-001"], "bibles": ["elements/WATER", "actions/projectile"],
  "assets": [
    { "id": "fxs_bubble", "state": "have", "layer": "L1" },
    { "id": "fx_bubble_pop", "state": "new", "layer": "L1", "spec": "Xem skill_nh_bubble (dùng chung). Ở skill này: 2 bóng đầu phát K3–K5 size 0,5; bóng thứ ba phát đủ K1–K6 size 1,0." },
    { "id": "fx_splash", "state": "have", "layer": "L3" },
    { "id": "fxs_drop", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Ếch **phồng túi họng** rồi thổi **chuỗi ba bong bóng to dần**, lắc lư nối đuôi; hai quả đầu nổ lách tách, **quả cuối to nổ ướt sũng**. Cảm giác: tinh nghịch, "pop pop PLOP". T2, gây Ướt. Khác `skill_nh_bubble` (một bóng to nảy) ở **số lượng + nhịp 3**.
Nguồn: thiết kế gốc; bible [projectile](../../bibles/actions/projectile.md) §2 (nhiều đạn: lệch nhịp, cỡ khác nhau, cái cuối mạnh nhất).

## 2. Hiện tại
3 `prop fxs_bubble throw` lệch 80 ms, `fx_splash` + `stop 40`. Audit: `STATIC_HERO`, `STATIC_SHARE`, dư âm đã thêm. Ba bóng cùng cỡ, bay thẳng song song, nổ chung một lần.

## 3. Kịch bản theo nhịp
| # | ms | Ếch | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Phồng | 0–320 | túi họng phồng 2 nhịp (sx 1,25), ngả ra sau | — | — | — | "ribbit… mmm" |
| 2 Thổi | 320–560 | mỗi bóng một cú gật đầu | 3 bóng cỡ 0,6 / 0,8 / 1,1, rời miệng lệch 100 ms, bay **lượn sin** nhẹ khác pha | — | — | "fwu-fwu-fwuu" |
| 3 Nổ 1–2 | 720, 800 | — | bóng 1, 2 nổ nhỏ trên thân | giật nhẹ ×2 | — | "pop pop" |
| 4 Nổ 3 | 900 | — | bóng 3 nổ to: vòng giọt | bật lùi, mặt `hurt` | hit-stop light 60, rung 3 | "PLOP!" |
| 5 Dư âm | 900–1150 | — | giọt rơi, vũng nhỏ; Ướt `st_wet` | lắc người rũ nước | — | lách tách |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | — | — | — | — |
| L1 | 3 bóng; 3 cú nổ | `fxs_bubble`, `fx_bubble_pop` | 3 `prop throw` arc 20/30/40, size 0,6/0,8/1,1, `stretch`, `bobY amp 6` lệch pha; `strip fx_bubble_pop` [2,4] size 0,5 ở 720, 800 → [0,5] size 1,0 ở 900 | 320–1050 |
| L2 | túi họng sáng lam nhẹ khi phồng | — | `glow $color` 0–320 | 0–320 |
| L3 | giọt rơi khỏi bóng khi bay; vòng giọt; vũng | `fxs_drop`, `fx_splash` | `trail drop_trail every 90` từng bóng; `burst drop_ring` 900; `decal puddle` 900–1150 | 320–1150 |
| L4 | mục tiêu giật ×2 rồi bật; hit-stop | — | `move shake` 720, 800; `move knock x 12` 900; `stop light` 900; `shake 3` | 720–1150 |
L1 đạt 3/3: biến hình (nổ khung) · phụ sinh (giọt) · vận tốc (stretch + lượn).

## 5. Asset
| Asset | Lớp | Trạng thái |
|---|---|---|
| `fx_bubble_pop` | L1 | **mới** (chung) |
| `fxs_bubble`, `fx_splash`, `fxs_drop` | | có |
Dự phòng: chưa có `fx_bubble_pop` → `burst bubble_pop` ×2 + `fx_splash` cho quả cuối.

## 6. Các bước dựng
1. B1 nhịp `{ release 320, impact 900, end 1150 }` (impact dời từ 720 → 900: số sát thương hiện ở quả cuối). 2. B2 thân: phồng họng, gật đầu ×3, mục tiêu giật ×2 + bật. 3. B3 L1. 4. B4 L3. 5. B5 L4. 6. B6 âm. 7. B7 capture.

## 7. Nghiệm thu
- `anim:audit`: không `STATIC_HERO` (khi có `fx_bubble_pop`), không `IMPACT_UNDER_TIER`.
- Capture: khung ~450 thấy 3 bóng **khác cỡ** ở 3 độ cao khác nhau; 3 khung nổ khác nhau, khung 900 vòng giọt to nhất.
