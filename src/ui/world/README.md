# src/ui/world — thế giới đi bộ dùng chung

- `controlInput.ts` — phím đang giữ / vừa bấm theo bảng phím của người chơi.
- `keySettings.ts` + `components/keySettingsView.ts` — màn đổi phím (bấm ô, nhấn phím mới).
- `CharacterActor.ts` — nhân vật trên scene Phaser (đi bằng phím hoặc bấm chuột, gợi ý phím, tương tác); mọi Area dùng chung.
- `host.ts` — `WorldHost`: những gì một scene cần từ app (phím, gợi ý, đổi chỗ, lưu vị trí).
- `fitCamera.ts`, `keys.ts` — camera vừa khung và key texture dùng chung các scene.
