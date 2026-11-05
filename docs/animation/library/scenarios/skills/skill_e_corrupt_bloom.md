# Kịch bản: Hoa Nhiễm Độc (`skill_e_corrupt_bloom`) — quái Cổ Thụ

```json scenario
{
  "id": "skill_e_corrupt_bloom", "kind": "skill", "name": "Hoa Nhiễm Độc", "element": "NATURE", "tier": 1, "durationMs": 1500,
  "status": "draft", "refs": [], "bibles": ["elements/NATURE", "motifs/poison", "elements/DARK"],
  "assets": [
    { "id": "fxp_corrupt_flower", "state": "have", "layer": "L1" },
    { "id": "fx_bloom_open", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô tím than + viền hồng Umbraflux; phát NGƯỢC lúc héo)" },
    { "id": "fxs_spore", "state": "have", "layer": "L3" },
    { "id": "fx_smoke_curl", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tím đen, bụi bám quanh mục tiêu)" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
**Hoa nhiễm Umbraflux** mọc trên đầu cây, **nở ngược** (cánh bung ra ngoài, rìa răng cưa hồng), **phun vòng bào tử tím đen** lan sang phe ta; từng con **bị phủ bụi, ho**; hoa **héo rụng**. Cảm giác: bệnh hoạn nhưng không kinh dị, khác hẳn hoa hồi máu. T1 diện rộng (power 0,5), 50 % Độc. Ngôn ngữ tha hóa: style guide §4.

## 2. Hiện tại
`fxp_corrupt_flower` (ảnh tĩnh) + bào tử; không có va chạm. Audit: `STATIC_HERO`, `STATIC_SHARE`, `NO_AFTERMATH`.

## 3. Kịch bản theo nhịp
| # | ms | Cây | Hiệu ứng chính | Phe ta | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Mọc | 0–400 | lắc đầu | hoa **mọc** trên đầu cây, cánh khép, **rỉ** vệt tím chảy xuống | — | nền tím 10 % | rì rầm |
| 2 Nở ngược | 400–600 | — | cánh **bung ngược ra ngoài**, mép gợn (displacement) | — | — | "fwump" |
| 3 Phun | 600–900 | — | **vòng bào tử** tím đen lan sang phe ta | — | — | xì |
| 4 Phủ | 900–1100 | — | bụi **bám quanh** từng con (stagger 90) | **ho** (lắc ×3) | hit-stop light 40 con đầu | "khụ" ×n |
| 5 Héo | 1100–1500 | idle | hoa **héo** (nở ngược lại), cánh rụng; `st_poison` | tint tím | nền về | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền tím | — | `tint #2a1030 0.1` | 0–1400 |
| L1 | hoa | `fxp_corrupt_flower`, `fx_bloom_open` (tím) | `prop grow` `head` 0–400 → `strip fx_bloom_open` 400–600 → `fxp_corrupt_flower` + `prop_displace` 600–1100 → `strip fx_bloom_open frames [5,0]` (ngược, héo) 1100 | 0–1400 |
| L3 | vòng bào tử; bụi bám; cánh rụng | `fxs_spore`, `fx_smoke_curl` | `burst spore_ring tint #3a1a40` 600; `burst spore_spray` sang phải 650; `strip fx_smoke_curl` per target stagger 90; `burst petal_fall tint #5a3a6a` 1200 | 600–1500 |
| L4 | ho; hit-stop nhẹ | — | `move shake n 3` targets; `stop light 40` | 900–1200 |
L1 đạt 3/3: biến hình (nở / héo khung, gợn) · phụ sinh (bào tử, vệt rỉ) · vận tốc (mọc).

## 5. Asset
`fx_bloom_open`, `fx_smoke_curl` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp `{ release 400, impact 900, end 1500 }` · B2 cây lắc; phe ta ho · B3 hoa mọc → nở → héo · B4 bào tử, bụi, cánh · B5 hit-stop light (tạo mốc va chạm) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết 3 cờ; capture: hoa **khép** ở khung ~300, **bung ngược** ở ~700, **héo** ở ~1300; không lẫn với `skill_mm_blossom`.
