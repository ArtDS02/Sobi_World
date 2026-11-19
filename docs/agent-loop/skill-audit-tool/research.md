# Research: skill-audit-tool (chỉ đọc, không thiết kế)

## 1. Mẫu cùng loại
- Mẫu script: `scripts/audit/itemUses.ts` (80 dòng): đọc content bằng `JSON.parse(readFileSync('content/…','utf8'))` (l.6-7, đường dẫn tương đối cwd, `any` + eslint-disable), hàm export thuần + khối chạy `if (/scripts[\/]audit[\/]itemUses\.ts$/.test(process.argv[1] ?? ''))` (l.67), in bảng `console.log`, `process.exitCode`. Chạy: `npm run items:audit` = `tsx scripts/audit/itemUses.ts` (package.json:43).
- Mẫu test: `tests/scripts/animAudit.test.ts` (vitest, import tương đối `../../scripts/...`, đối tượng nhỏ dựng tay); `tests/scripts/content.test.ts` cho kiểu đọc content.
- Công thức tier ĐÃ CÓ để import: `expectedTier(s)` ở `scripts/anim-review/lib/scriptAudit.ts:40` (ultimate→4; power<=0→0; <0.9→1; <1.4→2; else 3), kiểu `Tier`, `AuditSkill` (l.22). Khớp SKILL_ANIMATION_STANDARD §2.2 (dòng 48-49).
- Lệnh anh em: `anim:audit` = `tsx scripts/anim-review/audit.ts` (package.json:58); chưa có lệnh `skill:audit`.

## 2. Dữ liệu skills.json (134 skill, khoá `{ "skills": [...] }`)
Schema: `content/schemas/adventure/skills.ts` (`skillSchema`, `skillsFileSchema`); enum ở `content/schemas/adventure/combat.ts` (l.5-16, `effectSchema` l.30-40).
Trường: id, nameVi, descVi, type, category, element, target, power, hits(=1), accuracy, mpCost, cooldown, critBonus, effects[] (có thể THIẾU ở 21 skill quái -> coi là []), maxLevel, perLevel.
- type: unique 46, ultimate 12, class 32, enemy 44. (không có trường "bậc"; bậc = tier từ power)
- category: support 45, hybrid 37, magical 27, physical 25.
- element: FIRE 10, WATER 9, EARTH 9, METAL 9, LIGHT 8, VOID 8, DARK 7, LIGHTNING 7, NATURE 7, SELF 15, null 45. (SELF = hệ của người tung; null = không sát thương)
- target: enemy 49, allEnemies 37, allAllies 20, self 13, ally 10, randomEnemies 4, all 1.
- effects.kind: status 118, heal 15, shield 10, cleanse 6, mp 3, dispel 2, clearAll 1 (schema còn `rage`, `revive`). Trường phụ: status, turns, chance, to ('foes'...), pct, count, amount, doom.
- effects.status dùng: stun 14, spdDown 10, defUp 10, burn 8, atkUp 8, matkUp 7, defDown 7, wet 6, accDown 6, mdefUp 4, taunt 4, disable 4, poison 4, regen 4, evaUp 4, accUp 2, autoRevive 3, spdUp 3, freeze 2, mdefDown 2, atkDown 2, matkDown 2, evaDown 1, doom 1.
- `content/adventure/statuses.json` (`{statuses:[{id, kind, positive, skipTurn, noSkills,...}]}`): kind = dot(poison,burn) / control(freeze,stun,disable) / special(wet,doom,shield,taunt) / stat(atk/def/matk/mdef/acc/eva/spd Up/Down) / recovery(regen,autoRevive). Khống chế: freeze & stun (skipTurn=true), disable (noSkills=true) — dùng `kind==='control'` thay vì hardcode. `positive:true/false` phân buff/debuff.
- Phân vai (gợi ý từ dữ liệu): support = category 'support'; diện rộng = target allEnemies/randomEnemies/all; đơn mục tiêu = enemy; ultimate = type 'ultimate'.

## 3. docs/animation/vfx3d/SCORES.md (254 dòng)
- Cột điểm tên "Tự chấm" (bảng theo hệ, có cột "Hiệu ứng" `fx` ngay sau tên skill) ; bảng pilot đầu file (l.7-12) tên "Điểm" (chủ dự án chấm: `~7`, `chưa chấm số`, `thấp`); bảng pilot tự chấm (l.23-27) có cột "Tự chấm" là `**8**`/`**7,5**` ở cột áp chót. Các bảng hệ ghi `7`, `7,5`, `8` (dấu phẩy thập phân, không bôi đậm), 6,5 cũng có.
- Cột đầu ô skill: `` `skill_xxx` Tên `` ; bảng pilot có thêm cột Ngày đứng trước. Điểm là số ở cột có header chứa "Tự chấm" (vị trí cột khác nhau: 3 hoặc 8 ở pilot) -> nên tìm theo tên header, không theo chỉ số cố định.
- Regex gợi ý: id `` /`(skill_[a-z0-9_]+)`/g `` (một ô có thể chứa 2 id: dòng 153 `` `skill_cl_mend`, `skill_e_soothe` `` -> cùng điểm 7); điểm `` /^\**\s*(\d+(?:[,.]\d+)?)\s*\**$/ `` sau khi bỏ `**`, đổi `,`->`.`; `~7` bỏ `~`; `chưa chấm…`/`thấp` -> null.
- Nhiều dòng: skill_ult_trident dòng 9(~7, chủ chấm),25(**8**),49(8); skill_ult_phoenix 10(chưa chấm số),26(**7,5**),59(7,5); skill_ld_chain 11(chưa chấm),27(**7,5**),37(7,5). Chỉ 3 skill này lặp; dòng cuối = mới nhất (bảng hệ), khớp bảng tự chấm. Chủ dự án duyệt hết 134 ở đúng mức tự chấm (l.3).
- Đếm nhanh (regex trên cột đầu): 133 id riêng + `skill_e_soothe` đi chung ô -> đủ 134/134 có điểm, 0 thiếu, 0 id lạ. Dòng không phải skill: "Mọi skill hệ Sét | thấp" (l.12) bỏ qua.
- Header bảng hệ: `### Hệ X (tự chấm …)` đặt tên nhóm; bảng cuối "22 skill mới" chỉ có 4 cột (Skill, Hiệu ứng, Tự chấm, Còn yếu).

## 4. Ràng buộc
- Guard `scripts/guard/config.mjs`: maxFileLines 300 (chỉ quét `roots: ['src','content']`, nên scripts/ không bị guard nhưng giữ ≤300 theo quy ước); layers chỉ cho src/ và content/schemas (content/schemas không import gì, nên script import schema được nhưng schema không import script); `from 'node:'` cấm ở src/ và content/, KHÔNG cấm ở scripts/. Tên file cấm: utils, helpers, misc, common, shared.
- Đọc JSON: `readFileSync` + `JSON.parse` (itemUses) ; có thể validate bằng `skillsFileSchema` (zod) nếu muốn.
- LF: `.gitattributes` `* text=auto eol=lf`. `tsconfig.scripts.json` strict, noUnusedLocals/Parameters, verbatimModuleSyntax (dùng `import type`), allowImportingTsExtensions; `npm run typecheck` gồm tsconfig.scripts; `npm run check` = typecheck+lint+guard+assets+test. Chạy: `npx tsx scripts/audit/skillAudit.ts`.
- Nếu thêm lệnh: dòng kiểu `"skill:audit": "tsx scripts/audit/skillAudit.ts"` cạnh `items:audit`.

## 5. Khoảng trống
- Chưa có parser SCORES.md nào (grep trong scripts/ không có); phải viết mới.
- Chưa có "vai trò" (single/aoe/support/control/ultimate) hay bậc dùng chung; `expectedTier` chỉ cho tier từ power, không gồm điều kiện khống chế. Phải định nghĩa quy tắc khống chế (có effect status thuộc statuses kind 'control', kể cả `to:'foes'`), ưu tiên khi trùng vai (vd ultimate vs support).
- Chưa có script `skill:audit` trong package.json; chưa có test `tests/scripts/skillAudit.test.ts`.
- `scriptAudit.ts` kéo kiểu AuditAct… import `expectedTier` có thể phụ thuộc kiểu; kiểm nhẹ trước khi import (hoặc chép công thức 4 dòng).
- Skill enemy thiếu `effects` (21); element SELF/null cần nhóm riêng khi kiểm kê theo hệ.
