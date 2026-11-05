# Nghiên cứu: AI Agent Animation Production & QA Pipeline — Sobi World

Ngày: 2026-11-04 · Nhánh `phase-14-art` · Trạng thái: **đề xuất, chưa triển khai** (không đổi source).
Phạm vi khảo sát: `docs/animation-review/**` (README, roles, rubric v1.1, STATE.json, round-01), `scripts/anim-review/**`, `tools/admin/battleLab.ts` (hook `__animLab`), `package.json`, `.claude/`, `docs/AGENT_RULES.md`, `docs/animation/**`, skill `image-to-asset`.
Chưa đọc kỹ từng dòng: `capture.ts` (chỉ phần đầu), `compare.ts`, `lib/cases.ts`, `lib/metrics.ts`. Các kết luận về chúng dựa trên mô tả trong `roles/0-tester.md` và manifest, chưa kiểm bằng cách chạy.

---

## 1. Kết luận nhanh

**Ý tưởng khả thi, và khoảng 70% đã được xây.** Repo đã có vòng *Test → Review → Fix → Re-test* chạy thật một vòng (round 1). Tức là việc cần làm **không phải thiết kế từ đầu**, mà là: (a) vá các chỗ hở, (b) giảm chi phí token, (c) cưỡng chế quyền hạn bằng công cụ thay vì bằng lời dặn, (d) thêm Designer và điều phối tự động, (e) tổng quát hóa.

| Phase trong đề bài | Hiện trạng | Mức |
|---|---|---|
| 0 Capture Harness | `npm run anim:capture / compare / verify`. Chrome headless, đồng hồ giả (`page.clock`), seed `Math.random`, SwiftShader. Run bất biến, stamp = git head + hash dirty. Cổng canary + determinism (hai run DIFF 0.0%). 149 case: ultimate, skill, status ×3 pha, reaction, variant (reduce/crit/fast/ko/win/multi). | Xong cho combat. **Chưa có**: map walking, targeting/HUD/chỉ báo lượt, video, cờ `OVERFLOW`/`SKIPPABLE`. |
| 1 Technical Director | `roles/1-technical-director.md`, `FEEDBACK_TEMPLATE`, rubric v1.1 (7 tiêu chí, trọng số theo nhóm, MUST-HAVE, quy tắc chặn, ánh xạ blocker/major/minor), hiệu chuẩn neo, ID `ANIM-###` ổn định. | Xong về quy trình. **Vấn đề độ phủ**: round 1 TD chỉ xem 3 sheet tổng + 6 sheet case trên 149 (`STATE.review.coverage = "partial"`). |
| 2 Senior Designer | Chưa có role. Có skill `image-to-asset`, `image-to-prompt`, `docs/animation/prompts/01..08`, `ASSET_TODO.md`, decision 048 (IP). | Thiếu role, nhưng nguyên liệu có sẵn. |
| 3 Developer | `roles/2-developer.md`, `FIX_REPORT` kèm SHA-1 file. Round 1 đã sửa ANIM-110/111/119, 112/114 một phần, `npm run check` xanh. | Xong về quy trình. **Rollback yếu** (xem §10). |
| 4 Before/After | `anim:compare` (sheet BEFORE\|AFTER\|DIFF), `COMPARE_TEMPLATE`. Round 2 chưa chạy lần nào. | Có công cụ, chưa kiểm chứng. |
| 5 Quality Gate & lặp | `maxRounds=3`, phát hiện ID bất động 2 vòng, `escalated`, `awaiting_playtest`, `blocked`. | Có luật, nhưng do người đọc rồi tự tuân; chưa có máy cưỡng chế. |
| Điều phối | `PROMPTS.md`: người copy prompt mở từng session; "điều phối tự động" mới là mục tùy chọn trong văn bản. | Thủ công. |
| Lịch sử điểm theo vòng | Chưa có file riêng (chỉ nằm trong từng `FEEDBACK.md`). | Thiếu. |

**Phát hiện đáng chú ý nhất:** thứ làm hệ thống chậm/đắt không phải thiếu công cụ chụp, mà là **bắt LLM xem mọi sheet**. Cần chuyển phần lớn "so sánh, phát hiện đổi/không đổi, hồi quy" sang deterministic, chỉ đưa LLM những thứ thật sự cần mắt.

---

## 2. Thành phần tái sử dụng (không viết lại)

| Thành phần | Dùng cho | Ghi chú |
|---|---|---|
| `scripts/anim-review/*` (capture, compare, verify, lib/{stamp,server,session,cases,metrics,gates,sheet,png}) | Harness | Giữ nguyên; chỉ mở rộng suite. |
| `tools/admin/battleLab.ts` → `window.__animLab` | Debug Controller | Chỉ Admin, không vào bản ship (đúng luật "không HTTP/port" vì chỉ chạy dev, cổng 5195). |
| `ANIMATION_QUALITY_RUBRIC.md` v1.1 | Rubric + gate | Đã đáp ứng yêu cầu "100 điểm, trọng số, lỗi Critical không bị điểm che". |
| `STATE.json` | Máy trạng thái | Là hợp đồng giữa các role; giữ, bổ sung trường. |
| `ANTI_CACHE.md` + stamp + `INCOMPLETE` marker | Chống bằng chứng cũ | Giữ. |
| Skill `image-to-asset` / `image-to-prompt`, `docs/animation/prompts/*`, `docs/animation/animation_style_guide.md`, `COMBAT_ART_GUIDE.md` | Senior Designer | Designer chỉ cần *gọi* các thứ này. |
| `docs/ASSET_TODO.md`, `art_inbox`, `art:process`, `assets:check` | Đường nhập asset | Đã kiểm duyệt qua `assets:check` + IP audit. |
| `scripts/guard/` + `npm run check` | Cổng kỹ thuật cho Dev | Giữ. |
| Decisions 040/042/044/048, AGENT_RULES §8–§9 | Ràng buộc | Designer/Dev phải tuân. |
| Content data-driven (`content/adventure/battle_fx.json` + schema) | Bản đồ phụ thuộc | Cho phép suy ra *skill nào dùng script/cue nào* → tính "case bị ảnh hưởng" tự động (xem §6.3). |

Không có `.claude/agents/` và không có hook nào trong `.claude/` hiện nay (chỉ `launch.json` và `skills/`). Đây là chỗ trống để cưỡng chế quyền hạn.

---

## 3. Kiến trúc đề xuất

Ba tầng; **LLM chỉ ở tầng 2**.

```
TẦNG 1 — DETERMINISTIC (0 token)                     TẦNG 2 — AI REASONING            TẦNG 3 — NGƯỜI
 anim:capture ─► manifest.json                        ┌─ Technical Director (read-only) ─ playtest C2/C5
 anim:triage  ─► danh sách case cần mắt LLM ──────────►│─ Developer (ghi src/content)     ─ quyết taste/IP/rubric
 anim:compare ─► DIFF %, regression tự động            └─ Designer (chỉ khi needs_art)    ─ render ảnh (Gemini)
 anim:gate    ─► PASS/FAIL theo luật cứng  ◄──────────  (kết quả điểm từ TD)               ─ giải quyết escalated
 anim:ledger  ─► scores.jsonl (lịch sử)
 hook quyền ghi file theo role
 anim:next    ─► đọc STATE, in/chạy bước kế
```

Nguyên tắc: **Tester không phải agent AI** — đó là script (đã là script). Bỏ "Session 0 Tester" khỏi danh sách agent; chỉ còn lệnh `anim:run`. Điều này tiết kiệm một session LLM mỗi vòng. (Hiện `roles/0-tester.md` bắt một session LLM chạy lệnh và cập nhật STATE — việc đó script làm được.)

**Orchestrator = script, không phải LLM** (`npm run anim:next`): đọc `STATE.json`, quyết bước kế bằng luật cứng, và với bước cần AI thì gọi đúng subagent với prompt đã dựng sẵn. Lý do: quyết định "tiếp/dừng/escalate" phải tái lập và không tốn token.

---

## 4. Vai trò (đề xuất 3 agent + 1 script)

| Thành phần | Loại | Quyền ghi | Đọc | Khi chạy |
|---|---|---|---|---|
| **Harness** (`anim:*`) | script | `capture/**`, `STATE.lastCapture`, ledger | mọi thứ | mỗi vòng |
| **Technical Director** | subagent, model mạnh, context mới mỗi vòng | **chỉ** `rounds/round-NN/{FEEDBACK,COMPARE,CALIBRATION}.md`, `STATE.review` | manifest, ảnh, src (đọc), rubric | mỗi vòng |
| **Developer** | subagent, model trung bình đủ | `src/`, `content/`, `tests/`, `tools/` (trừ `scripts/anim-review/`), `FIX_REPORT`, `STATE.fix` | FEEDBACK + brief Designer | mỗi vòng có open ID |
| **Senior Designer** | subagent *theo yêu cầu* | `docs/animation-review/rounds/round-NN/briefs/**`, `docs/ASSET_TODO.md`, `art_inbox/` | FEEDBACK, style guide, asset đã duyệt | chỉ khi có ID gắn `cause: asset` |

Giữ **độc lập TD ↔ Dev** bằng cấu trúc, không bằng lời dặn:
1. TD chạy trong context mới, **không nhận** lý luận của Dev; chỉ nhận `FIX_REPORT` (ID, file, SHA) + git diff + run mới.
2. Dev không có quyền ghi vào `FEEDBACK/COMPARE/scores.jsonl`; TD không có quyền ghi `src/content/tools`. Cưỡng chế bằng `tools:` giới hạn trong frontmatter subagent **và** hook `PreToolUse` kiểm đường dẫn theo role (allow-list). Lời dặn trong `roles/*.md` vẫn giữ nhưng không là lớp bảo vệ duy nhất.
3. Điểm số chỉ do TD sinh; `anim:gate` đọc điểm đó và áp luật cứng, **không** để Dev hay orchestrator sửa.

Trigger Designer: TD hoặc Dev gắn `cause: asset|composition` vào ID; nếu nguyên nhân là timing/code/data (đa số lỗi round 1 là `battle_fx.json` và `battlePlan.ts`), **không gọi Designer** — đúng yêu cầu "không bắt buộc mọi vòng". Designer chỉ xuất brief + prompt cho người render (không có công cụ sinh ảnh tự động trong repo, skill dùng Gemini qua chủ dự án). Có thể xuất kèm *ảnh tham chiếu cắt từ khung capture* làm hint, như `image-to-prompt` đã làm.

Tôi **không** đề xuất tách thêm agent (ví dụ "Regression agent", "QA lead"): hồi quy làm bằng pixel diff (§6), gate làm bằng script.

---

## 5. Luồng dữ liệu

```
[Dev sửa] ─► FIX_REPORT + SHA ─► STATE.fix
     │
     ▼
anim:plan  : từ changedFiles + bản đồ phụ thuộc ⇒ affected cases (+ mẫu hồi quy)
anim:capture --only <affected> ... ─► runs/<id>/ + manifest
anim:compare vs run trước ⇒ cho mỗi case: pixelDiff%, metricsDelta, flagsDelta
anim:triage ⇒ 3 nhóm:
   A "không đổi, ngoài affected"  ⇒ PASS_CARRIED (kế thừa điểm cũ, 0 token)
   B "đổi, ngoài affected"        ⇒ REGRESSION tự động (đưa thẳng vào FEEDBACK)
   C "affected hoặc có cờ mới"    ⇒ đưa TD xem (ảnh BEFORE|AFTER|DIFF)
TD chấm nhóm C (+ vài mẫu A để chống trôi) ⇒ FEEDBACK/COMPARE + điểm
anim:gate ⇒ PASS / NEXT_ROUND / ESCALATE / AWAITING_PLAYTEST ; anim:ledger ghi điểm
```

Hợp đồng giữa các bước: toàn bộ qua file (`manifest.json`, `STATE.json`, `FEEDBACK.md` có bảng trạng thái ở đầu, `FIX_REPORT.md`). Thêm một **tệp máy đọc được** `rounds/round-NN/verdicts.json` do TD xuất cùng `FEEDBACK.md` (ID, severity, status, điểm từng đơn vị) để `anim:gate`/`ledger` không phải parse markdown.

---

## 6. Capture Harness — những gì giữ, bổ sung

### 6.1 Giữ nguyên
Server Vite riêng + Chrome headless + `page.clock` + seed + SwiftShader + context mới mỗi case + `serviceWorkers: block`; mốc chụp theo beat của step (`start, cast, release±, impact±, end`) + lưới đều; run bất biến; canary + determinism; manifest có stamp và bảng băm nguồn.

### 6.2 Đánh giá: có cần video không?
**Không ưu tiên.** Chuỗi khung có mốc beat + contact sheet đã chứa thông tin LLM dùng được; model hiện không đọc video đáng tin cậy và video tốn nhiều hơn nhiều. Video/GIF chỉ là *tiện ích cho người* (xem nhanh). `roles/0-tester.md` ghi đúng: cần ffmpeg, hiện chưa có. Làm sau, ở mức tùy chọn.

### 6.3 Bổ sung giá trị cao nhất: **bản đồ phụ thuộc** (case → file/ID nguồn)
Vì content data-driven, ta tính được: `skillId → scriptId → cue/act → file`. Từ `changedFiles` + git diff của `battle_fx.json` (ở mức khóa JSON) suy ra *chính xác* case bị ảnh hưởng. Hiện `affected` do Tester đoán ("nghi ngờ thì lấy rộng"). Bản đồ này biến "scope" từ phán đoán thành tính toán, và là nền cho nhóm A/B/C ở §5.

### 6.4 Hồi quy bằng pixel — gần như miễn phí
Determinism đã chứng minh (DIFF 0.0%). Do đó **bất kỳ case ngoài affected mà đổi pixel đều là regression thật** (hoặc thay đổi chung như `screenFx`, khi đó bản đồ phụ thuộc phải liệt kê file dùng chung ⇒ mọi case bị ảnh hưởng). Hồi quy không cần LLM.

### 6.5 Lấp khoảng trống suite
Thứ tự theo giá trị/chi phí:
1. **Targeting / chỉ báo lượt / HUD**: lớp DOM của game thật. Dùng Playwright (đã có trong devDependencies và `playwright.config.ts`) trên bản dev của game; kiểm bằng *số* (`elementFromPoint`, bounding box, z-order, kích thước hit-area) trước, ảnh sau. Phần lớn rubric nhóm này (C1, C7 ≥ 4) kiểm được bằng DOM, không cần LLM nhìn.
2. **Map walking**: cần Electron như `scripts/capture/adventureMaps.ts` (đã có tiền lệ); cần cổng xác định riêng.
3. Cờ `OVERFLOW`, `ULT_SKIPPABLE` (hiện đang `ULT_SKIPPABLE_UNVERIFIED` ở cả 12 ultimate): đo trong game thật.
4. Video: sau cùng.

### 6.6 Dung lượng
Một run `all` ~1.5 GB (đã thấy `capture/` 1.5 GB). Thêm chính sách: lưu frame full-res tạm, **sheet đã thu nhỏ + manifest** giữ lâu; xóa frame run cũ sau khi `compare` xong; chỉ giữ hash PNG của run đã duyệt (golden) để so mà không cần giữ ảnh.

---

## 7. Rubric & Quality Gate

### 7.1 Rubric hiện có đã đạt yêu cầu
7 tiêu chí (C1–C7) ↔ đề bài (C1 rõ ràng, C2 timing, C3 sống động, C4 đặc trưng, C5 tác động, C6 liền mạch, C7 kỹ thuật); trọng số theo 9 nhóm; công thức Σ; MUST-HAVE; quy tắc chặn (thiếu MUST-HAVE → Không đạt, tiêu chí ≤ 2 → không chốt, Ultimate ≥ 90); severity mapping; bằng chứng bắt buộc; hiệu chuẩn neo. **Không cần viết lại rubric.** Mở: quyết định v1.2 (§10.9) đã được chủ dự án từ chối — giữ nguyên.

### 7.2 Gate 5 trục (map vào rubric sẵn có, chạy bằng script)
| Trục (đề bài) | Điều kiện máy kiểm được | Nguồn |
|---|---|---|
| Design Compliance | Không MUST-HAVE nào thiếu; `STATUS_PHASE_ABSENT`, `DUPLICATE_SCRIPT`, `ULT_LAYERS`, `ULT_INTRO_OUTRO` sạch | metrics + `verdicts.json` |
| Visual Quality | Điểm nhóm ≥ mục tiêu §6 rubric; không tiêu chí ≤ 2; mọi điểm ≥ 4 có trỏ ô | TD |
| Technical Quality | 0 lỗi console/asset; C7 ≥ ngưỡng; flicker ≤ 3 lần/s; FPS/hạt trong trần; `npm run check` xanh | manifest |
| Gameplay Quality | **Thêm số đo**: tổng thời gian chặn input mỗi lượt không vượt ngân sách; ultimate skip được; chế độ x2 không mất anticipation/impact | harness (case `fast`, đo thời lượng) |
| Regression | Nhóm B của §5 rỗng; không ID `regressed` | `anim:compare` |

Kết quả: `PASS` chỉ khi cả 5 trục đạt **và** (không còn mục [Playtest] hoặc đã được chủ dự án xác nhận ⇒ nếu chưa: `AWAITING_PLAYTEST`). Điểm cao không bao giờ che blocker: `anim:gate` kiểm blocker/major *trước khi* nhìn tổng điểm.

### 7.3 Ledger lịch sử
`docs/animation-review/ledger/scores.jsonl`, mỗi dòng: `{round, runId, stamp, unit, group, c1..c7, total, grade, blockers, major, flags[]}`. Do script ghi từ `verdicts.json`. Dùng cho đồ thị cải thiện và phát hiện "không tiến bộ" (tổng không tăng sau 2 vòng ⇒ escalate).

---

## 8. Before/After & vòng lặp

- **So sánh**: `anim:compare --from A --to B` → sheet 3 cột + số (pixelDiff%, chênh `hitStopMs/durationMs/anticipationMs`, cờ mới/biến mất). TD chỉ nhận case nhóm C kèm ảnh DIFF; không phải tự dò.
- **Cùng điều kiện**: đã đảm bảo bằng đồng hồ giả + seed + stamp; thêm kiểm `env` (phiên bản Chrome, viewport) khớp giữa hai run, lệch ⇒ từ chối so sánh.
- **Git diff**: TD nhận diff của `changedFiles` (không phải cả repo) để đối chiếu nguyên nhân/ý định.
- **Giới hạn vòng**: `maxRounds=3` (giữ). Bổ sung: ngân sách token/vòng (§11); `stall` = một ID không đổi trạng thái 2 vòng (đã có) hoặc tổng điểm không tăng.
- **Dừng an toàn**: `escalated`/`blocked` ghi lý do + quyết định cần người; orchestrator **không** tự vượt.

---

## 9. Cấu trúc thư mục / tài liệu cần thêm

Giữ nguyên `docs/animation-review/` hiện có. Bổ sung:

```
.claude/agents/
  anim-technical-director.md   # tools: Read, Grep, Glob, Write(giới hạn) ; không Edit src
  anim-developer.md
  anim-designer.md
.claude/hooks/anim-role-guard.mjs   # PreToolUse: allow-list đường dẫn theo role (đọc STATE.json/biến môi trường ROLE)
.claude/skills/anim-loop/SKILL.md   # /anim-loop: chạy `anim:next`, spawn đúng subagent, dừng đúng luật

scripts/anim-review/
  plan.ts      # changedFiles → affected cases (bản đồ phụ thuộc)
  triage.ts    # nhóm A/B/C từ compare
  gate.ts      # luật PASS/NEXT/ESCALATE/AWAITING_PLAYTEST
  ledger.ts    # ghi/đọc scores.jsonl
  next.ts      # orchestrator (npm run anim:next)
  lib/deps.ts  # skill→script→cue→file
  suites/      # tách suite: combat/ (hiện có), hud/, map/  (adapter chung)

docs/animation-review/
  ledger/scores.jsonl
  rounds/round-NN/verdicts.json
  rounds/round-NN/briefs/     # Designer: ASSET_BRIEF_<id>.md, prompt Gemini, hint crop
  golden/                     # hash PNG case đã PASS (không lưu ảnh)
  templates/ASSET_BRIEF_TEMPLATE.md
  ARCHITECTURE.md             # tài liệu cố định mô tả các tầng (rút từ file này)
```
Nếu chủ dự án muốn tách khỏi code: chuyển nghiên cứu này thành `docs/decisions/049-animation-agent-pipeline.md` khi duyệt.

---

## 10. Lộ trình & tiêu chí nghiệm thu

| GĐ | Việc | Nghiệm thu |
|---|---|---|
| **P0 Ổn định nền** | (1) **Commit checkpoint** thay đổi hiện tại — `git status` đang có ~30 file modified/untracked chưa commit (cả harness, battle FX, tool admin) nên không có điểm rollback; (2) dọn `testerBacklog` trong STATE (cờ "absent" sai, overview frame, t=0 sạch, ULT_SKIPPABLE ở cấp manifest); (3) chạy nốt "round 1b" độ phủ 149 case hoặc ghi rõ phần chưa xem. | Cây git sạch tại một commit gắn tag `anim-baseline`; `anim:verify` xanh; `STATE.review.coverage` không còn "partial" hoặc có danh sách rõ case chưa xem. |
| **P1 Triage & tiết kiệm** | `deps.ts` + `plan.ts` + `triage.ts` + `compare` ở mức case + golden hash. | Sửa một cue trong `battle_fx.json` ⇒ `plan` liệt kê đúng các case dùng cue đó (kiểm bằng test); chạy lại không đổi gì ⇒ nhóm A = 100%, 0 case gửi TD; cố ý đổi `screenFx` ⇒ mọi case liên quan vào nhóm C. Lưu lượng ảnh TD đọc giảm ≥ 70% so với round 1. |
| **P2 Gate & ledger** | `gate.ts`, `ledger.ts`, `verdicts.json` + schema (zod, có sẵn). | Với dữ liệu round 1 tái dựng: gate trả `NEXT_ROUND` (còn blocker/major), ledger có điểm vòng 1; unit test cho mọi nhánh quyết định (PASS / ESCALATE / stall / AWAITING_PLAYTEST). |
| **P3 Subagent + cưỡng chế quyền** | 3 file `.claude/agents/*`, hook role-guard. | Thử: TD cố ghi `src/` ⇒ bị chặn; Dev cố ghi `FEEDBACK.md` ⇒ bị chặn; mỗi lần chặn có log. |
| **P4 Orchestrator** | `anim:next` + skill `/anim-loop`; ngân sách token/vòng. | Chạy một vòng Dev→capture→TD hoàn toàn từ `/anim-loop`, dừng đúng ở `awaiting_playtest`/`escalated`; không gọi LLM ngoài bước 2. |
| **P5 Lấp suite** | targeting/HUD (Playwright + DOM), map walking (Electron), `OVERFLOW`, skip. | Hai lần chạy liên tiếp DIFF 0%; `suitesNotBuilt` rỗng; rubric nhóm Targeting C1/C7 chấm được bằng số. |
| **P6 Designer** | Role + `ASSET_BRIEF_TEMPLATE` + quy trình qua `image-to-asset`; chỉ kích hoạt `cause: asset`. | Một ID thật cần asset đi hết vòng: brief → người render → `art:process` → `assets:check` → IP audit (048) → capture lại PASS. |
| **P7 Tổng quát hóa** | Tách adapter (CaseProvider, hook, metrics, rubric file) để thêm module: VFX riêng, UI/UX, scene, map. | Thêm một module mới (ví dụ HUD) chỉ bằng thêm adapter + rubric, không sửa `gate/ledger/next`. |

Làm theo thứ tự P0 → P1 → P2 là đủ để thấy lợi ích; P3–P4 khi quy trình đã ổn; P5/P6 làm khi có nhu cầu thật.

---

## 11. Rủi ro & kiểm soát

| Rủi ro | Kiểm soát |
|---|---|
| LLM chấm lệch/trôi giữa các vòng và giữa các session | Neo hiệu chuẩn (đã có) + chèn ngẫu nhiên vài case nhóm A vào mỗi vòng để đo độ trôi; điểm ≥ 4 phải trỏ ô; C1/C3/C4/C6 chỉ [Code] ≤ 3. |
| LLM không cảm được "feel" (C2/C5) | Giữ cổng [Playtest] của chủ dự án; AI chỉ sơ bộ bằng [Auto]+[Hình]. |
| TD phán đoán thứ ảnh tĩnh không chứng minh được | Luật `needs_evidence` (đã có); Tester mở thêm mốc/case. |
| Dev "sửa cho qua" (tối ưu theo cờ số) | Cờ chỉ là gợi ý (§10.3); TD vẫn xem hình; `playtest` chốt. |
| Hồi quy ngoài tầm mắt | Pixel diff nhóm B, bản đồ phụ thuộc phủ file dùng chung. |
| Bằng chứng cũ/cache | `ANTI_CACHE`, stamp, canary, run bất biến (đã có). |
| Rollback yếu: Dev hiện **không commit** ("chỉ commit khi chủ dự án yêu cầu"), chỉ ghi SHA-1; cây làm việc đang bẩn | Mỗi vòng Dev làm trên nhánh `anim/round-N` hoặc worktree (`isolation: worktree`), commit cuối vòng; rollback = `git revert` hoặc bỏ nhánh. Cần chủ dự án đồng ý ngoại lệ cho luật "chỉ commit khi được yêu cầu". |
| Gate sai do stale `dist`/cổng bận/máy khác | Server riêng, từ chối khi cổng bận, `distNewerThanSources` gate (hiện `null`, nên triển khai). |
| Chi phí leo thang không kiểm soát | Ngân sách vòng (ảnh tối đa / TD lượt, `maxRounds`), orchestrator dừng khi vượt, xem §12. |
| Vi phạm IP khi Designer tạo brief | Designer đọc decision 048 trước; brief có mục "kiểm tra IP"; chạy `docs/IP_AUDIT_PROMPT.md` trước khi nhập asset. |
| Rò quyền: hook cấu hình sai | Test hook (cố ghi trái phép phải bị chặn) nằm trong nghiệm thu P3. |
| Ràng buộc kiến trúc (`src/core` thuần, FeedbackDirector, i18n) bị Dev phá | `npm run check` (guard) là cổng cứng; không nới. |
| Harness chỉ chạy dev/Admin, lệch bản ship | Hook `__animLab` chỉ ở `tools/admin`; thêm một case "smoke" trên bản build thật để xác nhận cùng kết quả. |

---

## 12. Tiết kiệm token / thời gian / chi phí

Theo thứ tự hiệu quả:
1. **Triage deterministic** (§5, §6.3–6.4): LLM chỉ xem case thật sự đổi hoặc có cờ mới. Vòng ≥ 2 thường chỉ vài chục case thay vì 149.
2. **Kế thừa điểm** cho case không đổi (golden hash) — không chấm lại.
3. **Không dùng LLM cho Tester/orchestrator/gate/ledger** (hiện Tester là một session LLM).
4. **Ảnh nhỏ hơn và ít hơn**: mỗi case một sheet thu nhỏ; sheet tổng chỉ cho mục đích nhất quán; chỉ mở khung full-res khi nghi ngờ. Ảnh thường là phần tốn nhất.
5. **Chấm theo họ** (rubric §10.1 đã có): 1 đại diện + case bị cờ.
6. **Chọn model theo việc**: Dev và triage mức trung bình; TD ở model mạnh cho Ultimate và hiệu chuẩn, model nhẹ hơn cho quét cờ; `effort` thấp cho bước cơ học.
7. **Context mới mỗi vai trò**, và hợp đồng bằng file tóm tắt ngắn (bảng trạng thái ở đầu FEEDBACK; Dev đọc đúng file STATE trỏ tới — đã có). Đừng cho Dev đọc `ANIMATION_REVIEW_FEEDBACK.md` baseline 135 KB.
8. **Chụp có phạm vi** (`--only`, `--scope affected`); chỉ `--suite all` khi mốc lớn hoặc đổi file dùng chung. Một run `all` ≥ 25 phút và ~1.5 GB.
9. **Chạy dài ở nền**, không poll (đã quy định).
10. Round 1 FEEDBACK 18 KB so với baseline 135 KB cho thấy mẫu *gộp theo nguyên nhân gốc, tối đa 12 mục open* đã hiệu quả — giữ.

Ước lượng định lượng chính xác cần số liệu token thật; tôi chưa có (chưa đo từ session trước), nên không đưa con số cam kết. Cách đo: ghi `get_usage` theo vai/vòng vào ledger ngay từ P2.

---

## 13. Quyết định cần chủ dự án

1. Cho phép Dev **commit lên nhánh `anim/round-N`** (hoặc dùng worktree) để có rollback thật? Đây là ngoại lệ so với "commit chỉ khi được yêu cầu".
2. Duyệt bỏ vai "Tester LLM", thay bằng script (`anim:run`)?
3. Ưu tiên P1 (triage) trước P5 (suite targeting/map)? Tôi đề xuất triage trước vì giảm chi phí mọi vòng sau.
4. Designer: chấp nhận chỉ xuất brief/prompt cho bạn render (không tự sinh ảnh)?
5. Có tổng quát hóa sang module khác ngay hay đợi hết round 3 của combat?
