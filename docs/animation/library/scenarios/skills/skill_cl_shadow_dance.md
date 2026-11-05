# Kịch bản: Bóng Ảnh (`skill_cl_shadow_dance`) — lớp Chiến Binh

```json scenario
{
  "id": "skill_cl_shadow_dance", "kind": "skill", "name": "Bóng Ảnh", "element": "SELF", "tier": 2, "durationMs": 1600,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit", "elements/DARK"],
  "assets": [
    { "id": "fx_poof", "state": "have", "layer": "L1" },
    { "id": "fx_claw", "state": "have", "layer": "L1" },
    { "id": "fx_smoke_curl", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô tím, lúc tan vào bóng)" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Thân **mờ dần, tan vào bóng**; **hiện ra quanh kẻ địch bốn lần** (mỗi lần một phía), mỗi lần **một nhát chém**, cú bốn to nhất; **hiện lại ở chỗ cũ** để lại hai bóng mờ. Cảm giác: ninja, khó nắm, nhịp đều rồi bùng. Power 0,6 **mỗi cú** × 4 → bậc tổng T2 (audit hiện báo T1/T3); ngẫu nhiên kẻ địch; Né cho bản thân.

## 2. Hiện tại
`fx_poof` + `fx_claw` 4 lần, hit-stop 40 ×3 + 90, rung 5; dài 1700. Audit: `IMPACT_OVER_TIER`, `DURATION_OVER`.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Tan | 0–250 | mờ còn 30 %, khói tím cuộn | khói tím tại chỗ | — | tối 15 % | "fsh" |
| 2 Cú 1–3 | 250 / 450 / 650 | **hiện** sau / trên / trước mục tiêu (lệch ngẫu nhiên), chém, **biến** | poof nhỏ + vuốt tím mỗi lần | giật ×3 | hit-stop light 40 ×3 | "fsh-shk" ×3 |
| 3 Cú 4 | 900 | hiện phía trên, chém **xuống** | vuốt to 1,3 + poof | bật lùi | hit-stop medium 80, rung 3 | "shing!" |
| 4 Về | 900–1600 | **hiện lại chỗ cũ**, hai bóng mờ lệch hai bên rồi nhập | khói tan | — | nền về | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | poof hiện / biến; 4 vuốt | `fx_poof` (tím), `fx_claw` (tím, `flip` xen kẽ, cú 4 size 1,3) | `strip` tại 4 vị trí quanh mục tiêu | 250–1100 |
| L2 | bóng mờ | — | `trail every 40` + `move vanish/appear` | 0–1300 |
| L3 | khói tan vào bóng | `fx_smoke_curl` | `strip` tại chỗ cũ 0–250 và 900–1100 | 0–1100 |
| L4 | hit-stop ×4 | — | `stop light` ×3, `stop medium` 900; `shake 3` (từ 5) | 250–1000 |
Thân (biến / hiện) là hình chủ đạo: vận tốc + phụ sinh (poof, bóng).

## 5. Asset
`fx_smoke_curl` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp `{ release 250, impact 900, end 1600 }` (rút 150) · B2 tan / hiện ×4 / về · B3 poof, vuốt · B4 khói · B5 hạ rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_OVER`; capture: 4 khung cú đánh, heo ở **4 vị trí khác nhau** quanh mục tiêu.
