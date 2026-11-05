# Kịch bản: Dấu Diệt Vong (`skill_e_doom_mark`) — quái

```json scenario
{
  "id": "skill_e_doom_mark", "kind": "skill", "name": "Dấu Diệt Vong", "element": "SUPPORT", "tier": 0, "durationMs": 1350,
  "status": "draft", "refs": [], "bibles": ["actions/status", "elements/DARK"],
  "assets": [
    { "id": "fxp_doom_clock", "state": "have", "layer": "L1" },
    { "id": "fx_smoke_curl", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tím đen, khói quanh đồng hồ)" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Đèn tắt dần** (vignette), tiếng tích tắc; **đồng hồ rune** hiện trên đầu mục tiêu, **kim quay một vòng**; **"DONG"** — mục tiêu **giật mình, mặt sợ**; đèn sáng lại, dấu còn treo. Cảm giác: điềm báo, hồi hộp, không kinh dị. Diệt vong 3 lượt, T0.

## 2. Hiện tại
`fxp_doom_clock` (ảnh) hiện; kim không quay. Audit: `STATIC_HERO`, `STATIC_SHARE`, `DURATION_OVER` (1450).

## 3. Kịch bản theo nhịp
| # | ms | Quái | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Tối | 0–400 | giơ tay | — | — | **vignette** tối dần 40 % quanh mục tiêu | "tick… tock…" |
| 2 Đồng hồ | 400–850 | — | đồng hồ **hiện** (pop) trên đầu, khói tím cuộn quanh, **mặt đồng hồ xoay một vòng** (kim) | ngước lên | — | tích tắc nhanh dần |
| 3 DONG | 850 | — | đồng hồ **giật** (pulse), sóng âm vòng | **giật mình**, pose `hurt` 200 | — | "DONG" |
| 4 Dư âm | 850–1350 | idle | đồng hồ **thu nhỏ** về icon `st_doom` | — | đèn sáng lại | ngân |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | vignette | — | `tint focus #100818 0.4` | 0–1200 |
| L1 | đồng hồ | `fxp_doom_clock` (0,4) | `prop pop spot above` 400 + `spin 1` (một vòng, ease inOutSine) 450–850 → `pulse` 850 → co + bay về vị trí icon 950–1200 | 400–1200 |
| L3 | khói quanh; sóng âm | `fx_smoke_curl` | `strip` sau đồng hồ 400–900; `decal ring` 850 | 400–1000 |
| L4 | giật mình | — | `move hop y 10` + pose `hurt` 850 (không rung, T0) | 850–1100 |
L1 đạt 2/3: vận tốc (pop, quay, giật, co) · phụ sinh (khói, sóng). Đồng hồ xoay cả mặt thay cho kim (một ảnh).

## 5. Asset
`fx_smoke_curl` **mới**.

## 6. Các bước dựng
B1 nhịp `{ release 400, impact 850, end 1350 }` (rút 100) · B2 giơ tay; mục tiêu giật mình · B3 đồng hồ → quay → giật → co · B4 khói, sóng · B5 không rung · B6 âm tích tắc nhanh dần · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_OVER`; capture: đồng hồ ở **góc xoay khác nhau** khung 550 / 750.
