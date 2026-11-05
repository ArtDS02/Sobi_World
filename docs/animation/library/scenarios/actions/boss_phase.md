# Kịch bản hành động: Trùm đổi pha (`boss_phase`)

```json scenario
{
  "id": "boss_phase", "kind": "action", "name": "Trùm đổi pha", "element": "NONE", "tier": 3, "durationMs": 1100,
  "status": "draft", "refs": [], "bibles": ["actions/idle-and-states", "actions/ultimate"],
  "assets": [
    { "id": "fx_smoke_curl", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (hào quang trùm, tô theo hệ trùm)" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Trùm xuống dưới 50 % máu: **gồng, gầm**, **hào quang** theo hệ bùng quanh thân, màn **tối**, **rung mạnh** — rồi trùm **đổi tint / hào quang** để người chơi đọc được "đã sang pha 2". Mỗi trùm có skill pha 2 riêng (`skill_e_thorn_storm`, `skill_e_meteor`, `skill_e_seal_quake`) bắt đầu ngay sau.

## 2. Hiện tại
tint + shake thân + glow + tint + âm. Không có hào quang ở lại, không đọc được "pha 2" sau khi xong.

## 3. Kịch bản theo nhịp
| # | ms | Trùm | Hiệu ứng | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Gồng | 0–400 | co lại, run, mắt sáng | — | tối dần 30 % | gầm trầm tăng |
| 2 Bùng | 400–700 | **bung** to 1,1, gầm | **hào quang** theo hệ bùng + cuộn; bụi vòng | hit-stop heavy 120, punch 1,05, rung 6 | "ROAR" |
| 3 Pha 2 | 700–1100 | về 1,0 | hào quang **ở lại** mờ (layer) suốt pha 2; tint thân đổi | sáng lại 15 % | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L0 | tối màn | — | `tint` (giữ) |
| L1 | hào quang | `fx_smoke_curl` (màu hệ trùm, `behind`, 1,6) | bùng 400 → loop ở lại (cần cờ trạng thái "pha 2" giữ layer — ghi engine nếu thiếu) |
| L3 | bụi vòng | `fx_dust_ring` | `strip` 400 |
| L4 | gồng / bung; hit-stop, rung | — | `move squash` → `puff_up 1.1`; `stop heavy`; `punch 1.05`; `shake 6` |

## 5. Asset
`fx_smoke_curl`, `fx_dust_ring` **mới**.

## 6. Các bước dựng
B1 1100 · B2 gồng / bung · B3 hào quang (+ giữ ở pha 2) · B4 bụi · B5 hit-stop heavy, rung 6 · B6 âm · B7 capture (case trùm đổi pha).

## 7. Nghiệm thu
Capture: sau đổi pha, trùm có **hào quang** khác lúc trước (so khung trước / sau).
