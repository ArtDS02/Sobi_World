# Research R1 — dữ liệu / gameplay skill chiến đấu (2026-11-20)

Nguồn: Explore (sonnet), Chỉ đạo chép lại có dấu. Audit số: `art_inbox/agent-loop/battle-skill-expansion/audit_before.md` (`npm run skill:audit`).

## 1. Người chơi có skill bằng đường nào
- **Unique theo dòng**: 9 dòng = 9 hệ (1:1), mỗi dòng `unique[4]` + `ultimate` (`content/adventure/lineages.json`); loài thay từng ô qua `species.<PIG_*>.unique[4]` (null = dùng skill dòng), `.ultimate`, `.element2`. Schema ép đúng 4 (`content/schemas/adventure/lineages.ts:20-37`); gộp ở `src/areas/adventure/logic/config/content.ts:144-155` (`identityOf`). Chỉ 20 heo + 2 cá trong lineages đánh được.
- Ô Unique mở theo cấp: `balance.json levels.uniqueUnlockLevels = [1,1,10,20]` (`logic/fighters.ts:38-39`); Unique luôn level 1.
- **Class tree**: `classes.json` 4 cây × 8 node, tier 1–3, giá 0/2/4/6 SP (`logic/tree.ts`); loadout tối đa 3 (`balance.json tree.loadoutSlots`); skill class `element: SELF`.
- **Ultimate**: không khóa cấp; Rage đầy, 1 lần / trận (`src/systems/combat/rules.ts:58`, `engine.ts:164-167, 244-249`); `rageK` 1,2, Rage tối đa 100.
- Mỗi con: 4 Unique + ≤ 3 class + 1 ultimate (`fighters.ts:42`; test `tests/unit/adventure.test.ts:71`).
- SP: 2 / cấp; +3 khi hạ boss vùng lần đầu (`actions/battle.ts:120-125`); cuộn kỹ năng +2.

## 2. Bảng hệ (hỗ trợ element null quy về hệ qua dòng)
| Hệ | Loài | Gốc (4U + Ult) | Riêng loài | Tổng khác nhau |
|---|---|---|---|---|
| FIRE | 3 (2 heo + 1 cá) | 5 | 1 | 6 |
| WATER | 2 | 5 | 3 | 8 |
| EARTH | 2 | 5 | 2 | 7 |
| METAL | 4 | 5 | 2 | 7 |
| LIGHTNING | 2 | 5 | 0 | 5 |
| NATURE | 3 (2 heo + 1 cá) | 5 | 0 | 5 |
| LIGHT | 2 | 5 | 2 | 7 |
| DARK | 2 | 5 | 0 | 5 |
| VOID | 2 | 5 | 3 | 8 |
Skill riêng loài **thay** ô, không thêm ô. Theo trường `element` (audit): FIRE 5, WATER 5, EARTH 4, METAL 5, LIGHTNING 4, NATURE 2, LIGHT 4, DARK 4, VOID 5.

## 3. Thang số thực tế
| Loại / bậc | Số | power | mpCost | cooldown | hits |
|---|---|---|---|---|---|
| unique T1 | 8 | 0,6–0,85 | 20–24 | 3 | 1–4 |
| unique T2 | 14 | 0,9–1,3 | 8–28 | 0–3 | 1 |
| unique T3 | 7 | 1,4–2,3 | 8–28 | 0–3 | 1 |
| class T1 | 6 | 0,6–0,8 | 16–30 | 2–4 | 1–4 |
| class T2 | 6 | 0,9–1,3 | 14–30 | 2–4 | 1 |
| class T3 | 4 | 1,5–3,0 | 10–36 | 0–4 | 1 |
| ultimate | 12 (8 sát thương, 4 hỗ trợ) | 1,5–2,5 / 0 | 0 | 0 | 1 |
| hỗ trợ (power 0, không tính quái) | ~30 | 0 | 0–28 | 0–5 | — |
Nhiều nhịp: `ld_chain` 3, `cl_combo` 3, `cl_shadow_dance` 4, `qt_dawn_spear` 3, `hk_star_fall` 4, `tg_spike_barrage` 4.
Quy định: spec Adventure §8.1 (skill thường 8–15 MP, mạnh 20–35 MP), §6.2 (Void thấp hơn ~15 %); schema `content/schemas/adventure/skills.ts:29-34` (power 0 ⇒ có effects; power > 0 ⇒ có element; ultimate mpCost = 0). `GAME_BALANCE.md:234` chỉ trỏ decision 037, **không có bảng power theo bậc**.

## 4. Combo / cộng hưởng / tiến hóa có sẵn
- 6 phản ứng `content/adventure/reactions.json`: Điện Giật (Ướt + Sấm, ×1,3, 35 % choáng), Hơi Nước (Ướt + Lửa), Cháy Rừng (Độc + Lửa, Bỏng mọi địch), Vỡ Băng (Đóng băng + vật lý / Lửa, ×1,5), Thanh Tẩy (thẻ umbraflux + Ánh sáng), Nhật Thực (trạng thái nguồn Bóng tối + Ánh sáng). Một phản ứng / đòn theo `priority`.
- Code: `src/systems/combat/resolve.ts:100` (`reactionFor`), `:138-147`, `:154` (`applyReaction`), `context.ts:29, 87`. Trường: `elements, categories, requiresStatus, requiresSourceElement, requiresTag, damageMult, voidBonus, consume, applyStatus, dispel`; mỗi phản ứng cần mục `battle_fx.json elementReactions`.
- Cộng hưởng đội: `engagement.json synergies` 8 cặp dòng (`elementDamage`, `statusChance`; `logic/bonds.ts`). **Chưa có combo skill ↔ skill.**
- Nâng cấp: chỉ skill class có `maxLevel` 3–5 + `perLevel` (power, heal, chance, mpCost); Unique / ultimate `maxLevel` 1. **Không có chuỗi tiến hóa.**
- Hệ thứ hai: `element2` (6 loài), `balance.json foes.secondElement`.

## 5. Cơ chế mở khóa có sẵn
- Hạ boss: `AdventureState.cleared[zoneId]` (`state.ts:223`), `Fighter.bossClears` (`state.ts:46`); vùng mở theo `zones.json requiresCleared` (`schemas/zones.ts:13`, `actions/trip.ts:230`).
- Khám phá (`state.ts:225-240`): `foundSecrets, openedChests, openedGates, litPuzzles, loreFound, explored, beaten`.
- Engagement: `Fighter.feats` (battles, bestHit, ultimates, rift, nightmares; `state.ts:48-55`), danh hiệu `engagement.json titles` (`bonds.ts:39-60 hasTitle`). Thành tựu world: `src/app/goals.ts`.
- **Chưa có** trường `unlock` / `requires` trong `skillSchema`.
- Save: slice `areas.sobi_adventure`, `ADVENTURE_STATE_VERSION = 8` (`state.ts:14`), `strictObject`; thêm trường ⇒ nâng version + migration `logic/migrations.ts` + test `tests/unit/saveVersions.test.ts`. Mở khóa suy ra được từ cờ có sẵn (cleared, loreFound, feats…) thì **không cần đổi save**.

## 6. Ràng buộc
- Decision 021 (đóng băng): thêm skill / cơ chế / công thức / save ⇒ decision mới, chủ dự án duyệt; chỉnh số trong content/ được nếu ghi PROGRESS + chạy sim. 037 mở băng Combat V2; 060 là tiền lệ "mở băng hẹp rồi đóng".
- Quy trình 060 / `NEW_SKILLS_PROPOSAL` §5: duyệt → decision + lưu ý trong 021 → `skills.json` + nối `lineages.json` / `enemies.json` → `npm run content:ids`, `content:fmt` → kịch bản `battle_fx.json` theo SKILL_ANIMATION_STANDARD → test, check, bot, PROGRESS.
- Bot trước / sau cùng seed: `npx tsx scripts/sim-adventure.ts 400 1 <zone> rare` (Rừng, Núi, Tàn Tích), `npx tsx scripts/simulate-week.ts 1 30 adventure` (lần 060: Núi khó hơn 0–10 điểm).
- Giới hạn cứng: Unique đúng 4 ô / dòng; không viết 4 skill riêng cho từng giống (037 mục 4); 1 ultimate / loài; class loadout 3; ultimate mpCost 0.
- Công cụ: `scripts/animation/checkNewSkills.ts`, `npm run skill:audit`.

## 7. Khoảng trống
- Không có đường đưa skill mới tới người chơi ngoài thay ô Unique / thêm node class / ultimate loài ⇒ skill mở khóa cần **đường mới** (ví dụ ô / node đặc biệt) — đổi gameplay, cần decision.
- Không có chuỗi tiến hóa cho Unique; không có combo skill ↔ skill (chỉ phản ứng trạng thái và cộng hưởng đội).
- Vai khống chế chỉ suy ra từ effects (stun, freeze, disable). Mốc bậc T1–T3 chỉ là quy ước audit.
- Phản ứng mới ⇒ thêm `elementReactions` trong `battle_fx.json`.
