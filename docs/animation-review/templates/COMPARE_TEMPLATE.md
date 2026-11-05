# SO SÁNH TRƯỚC/SAU — Vòng {NN-1} → {NN}

> TRƯỚC: runId {A} (stamp …) · SAU: runId {B} (stamp …) · sinh bằng `npm run anim:compare -- --from {A} --to {B}`
> Điều kiện: cả hai run `complete:true`, cùng `env` (viewport, seed, clock). Khác `env` → so sánh vô hiệu, yêu cầu Tester chụp lại.

| ID | case | TRƯỚC (ô/mốc) | SAU (ô/mốc) | DIFF | Tiêu chí đạt | Kết luận |
|---|---|---|---|---|---|---|
| ANIM-### | battle.ult.fire | `…/before.png` | `…/after.png` | `…/diff.png` | … | fixed / open / regressed |

## Hồi quy
Các case NGOÀI danh sách ID mà DIFF > ngưỡng (từ sheet tổng): …

## Số đo thay đổi
| case | chỉ số | TRƯỚC | SAU |
|---|---|---|---|

## Kết luận vòng
