# Kịch bản: Chồi Non (`skill_mm_sprout`)

```json scenario
{
  "id": "skill_mm_sprout", "kind": "skill", "name": "Chồi Non", "element": "SUPPORT", "tier": 0, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/NATURE"],
  "assets": [
    { "id": "fx_bloom_open", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô xanh lá nhạt, chỉ dùng K1–K3: mầm → nụ)" },
    { "id": "fx_heal_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_leaf", "state": "have", "layer": "L3" },
    { "id": "fxs_heart", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Heo **vẫy lá trên đầu**, một **chồi non nhú lên** cạnh chân đồng đội, **lắc lư**, nở **hai lá hình tim**, bắn hạt sáng xanh lên bạn; chồi **thu nhỏ ở lại** chăm bạn mỗi lượt. Cảm giác: dễ thương, nhỏ bé, chăm sóc. Hồi 10 % + Hồi phục, T0.

## 2. Hiện tại
`fx_bloom` 4 khung + tim + cộng máu. Audit: không cờ, nhưng chồi không lắc, không có lá tim.

## 3. Kịch bản theo nhịp
| # | ms | Heo / bạn | Hiệu ứng chính | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Vẫy | 0–280 | pose `cast`, vẫy lá trên đầu | 3 lá nhỏ bay về phía bạn | — | xào xạc |
| 2 Nhú | 280–650 | — | **chồi nhú lên** cạnh chân bạn (mầm → nụ), **lắc lư** trái-phải | — | "pop" |
| 3 Nở tim | 650 | bạn nhún | nụ bung **2 lá tim** bay lên, hạt sáng xanh rơi lên bạn; vòng hồi mềm ở chân | — | "plink" |
| 4 Ở lại | 650–1150 | — | chồi **thu nhỏ** về sát chân, còn lắc nhẹ → `st_regen` | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | chồi | `fx_bloom_open` K1–K3 | `strip frames [0,2] hold 300` `spot feet` lệch x +30, kèm `wobble` (cần strip lắc: dùng 2 strip lệch pha alpha, hoặc chấp nhận đứng yên); thu nhỏ: `size` giảm qua act thứ hai 900 | 280–1150 |
| L2 | — | — | — | — |
| L3 | lá bay; lá tim; vòng hồi | `fxs_leaf`, `fxs_heart` (tô xanh), `fx_heal_bloom` | `burst leaf_trail` 0; `burst heart_pop tint #7ee08a` 650; `strip fx_heal_bloom size 0.7` 650 | 0–1000 |
| L4 | bạn nhún | — | `move hop y 8` 650 | 650–900 |
L1 đạt 2/3: biến hình (mầm → nụ khung) · phụ sinh (lá tim từ nụ).

## 5. Asset
`fx_bloom_open`, `fx_heal_bloom` **mới**; dự phòng `fx_bloom frames [0,1]`.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 vẫy lá; bạn nhún · B3 chồi nhú → nở → thu nhỏ · B4 lá, tim, vòng hồi · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~500 thấy **nụ** (chưa nở) cạnh chân bạn; khung ~700 lá tim bay lên; khung cuối chồi **nhỏ hơn** khung 700.
