# Kịch bản phản ứng: Thanh Tẩy (`reaction_purify`)

```json scenario
{
  "id": "reaction_purify", "kind": "reaction", "name": "Thanh Tẩy", "element": "LIGHT", "tier": 2, "durationMs": 900,
  "status": "draft", "refs": [], "bibles": ["elements/LIGHT", "elements/DARK"],
  "assets": [
    { "id": "fx_light_pillar", "state": "have", "layer": "L1" },
    { "id": "fx_smoke_curl", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tím đen + viền hồng Umbraflux)" },
    { "id": "fx_star_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Đòn Ánh sáng lên sinh vật **nhiễm Umbraflux**: **cột sáng trắng giáng** xuống, **khói tha hóa tím đen** (viền hồng) bị **đẩy bung** khỏi thân, một biểu tượng tốt bị **cuốn đi**; sao nở. Cảm giác: trong lành, giải thoát. +25 % sát thương, xóa 1 trạng thái tốt.

## 2. Hiện tại
`fx_light_pillar` + `fx_poof` + âm. Khói tha hóa là poof chung, không thấy "bị đẩy bung".

## 3. Kịch bản theo nhịp
| # | ms | Mục tiêu | Hiệu ứng | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Giáng | 0–200 | khựng | **cột sáng trắng** giáng từ trên | hit-stop light 60 | chuông trong |
| 2 Bung khói | 150–550 | rùng mình mạnh | khói tím đen **cuộn rồi bung ra ngoài** (đẩy khỏi thân), mỏng dần | — | "whoosh" |
| 3 Cuốn | 400–700 | — | một icon tốt **bị cuốn** bay đi, tan | — | — |
| 4 Sáng | 600–900 | thân sáng hơn | **sao nở** + lấp lánh rơi | — | ngân |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | cột sáng; khói tha hóa | `fx_light_pillar` (trắng), `fx_smoke_curl` (Umbraflux) | cột 0–400; khói loop 150–400 → `grow` + alpha (bung ra) 400–550 |
| L3 | sao; lấp lánh | `fx_star_bloom` | `strip` 600; `burst star_fall` 700 |
| L4 | hit-stop; rùng mình | — | `stop light 60`; `move shake` |

## 5. Asset
`fx_smoke_curl`, `fx_star_bloom` **mới**.

## 6. Các bước dựng
B1 ≤ 900 · B2 rùng mình · B3 cột, khói bung · B4 sao · B5 hit-stop light · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~300 khói **sát thân**, ~500 khói **xa thân** (bung ra).
