# src/ui/world — thế giới đi bộ dùng chung

- `controlInput.ts` — phím đang giữ / vừa bấm theo bảng phím của người chơi.
- `keySettings.ts` + `components/keySettingsView.ts` — màn đổi phím (bấm ô, nhấn phím mới).
- `host.ts` — `WorldHost`: những gì một scene cần từ app (phím, gợi ý, đổi chỗ, lưu vị trí).
- `fitCamera.ts`, `keys.ts` — camera vừa khung và key texture dùng chung các scene.
- `syringe.ts` — mũi tiêm chích vào sinh vật vừa khỏi bệnh (Farm, Aquarium); ảnh `fx_syringe` khi có, không thì hình vẽ bằng code.
- `bentPlant.ts` — cây uốn theo thân trong gió (Rope dọc chép ảnh hoa; toán ở `systems/animation/plantBend.ts`), dùng cho mọi hoa Sobi Cloud và cây Sobi Garden.
