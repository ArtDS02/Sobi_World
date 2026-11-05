# Đặc tả CAPTURE_MANIFEST

Tester xuất **hai** file cho mỗi run, cùng nội dung: `manifest.json` (máy đọc, schema kiểm bằng `anim:verify`) và `CAPTURE_MANIFEST.md` (TD đọc). Đường dẫn trong manifest là **từ gốc repo**.

## manifest.json
```jsonc
{
  "schema": 1,
  "runId": "20261104-153012-d4edc5b-a1b2c3d4",
  "round": 1,                       // round của TD sẽ review run này
  "stamp": { "head": "d4edc5b", "dirty8": "a1b2c3d4", "branch": "phase-14-art" },
  "complete": true,
  "scope": "full",                  // full | affected(+regression)
  "flags": [],                      // NO_CHANGE_DETECTED | CACHE_SUSPECT | ...
  "gates": {
    "determinism": { "result": "pass", "case": "battle.skill.<id>", "maxPixelDiff": 0 },
    "canary": { "result": "pass", "checked": [ { "file": "content/adventure/battle_fx.json", "disk": "<sha1>", "served": "<sha1>" } ] },
    "distNewerThanSources": null    // chỉ khi có case Electron
  },
  "env": { "viewport": [1600, 900], "clock": "page.clock", "seed": 1234, "server": { "port": 5195, "cacheDir": "<tmp>", "force": true } },
  "sources": [ { "file": "src/areas/adventure/ui/battlePose.ts", "sha1": "<sha1>", "changedSincePrevRun": true } ],
  "cases": [
    {
      "caseId": "battle.ult.fire",
      "status": "ok",               // ok | error | absent
      "sheet": "docs/animation-review/capture/runs/<runId>/sheets/battle.ult.fire.png",
      "frames": "docs/animation-review/capture/runs/<runId>/frames/battle.ult.fire/",
      "cells": [ { "t": 0, "beat": "start", "frame": "f000.png" } ],
      "metrics": {
        "durationMs": 2400, "beats": { "start": 0, "cast": 300, "release": 900, "impact": 1100, "end": 2400 },
        "cues": ["cast:circle", "impact:burst"],
        "hitStopMs": 120, "shake": { "amp": 6, "ms": 300 },
        "peakParticles": 310, "changedFrames": 41, "overflowFrames": 0,
        "consoleErrors": [], "missingAssets": []
      },
      "notes": []
    }
  ],
  "overview": { "battle.ults": "docs/animation-review/capture/runs/<runId>/sheets/_overview.ultimates.png" }
}
```

## CAPTURE_MANIFEST.md (bố cục)
1. Đầu trang: `runId · stamp · round · complete · scope · flags` (một dòng mỗi thứ).
2. **Cổng**: bảng determinism / canary / dist (pass|fail + bằng chứng).
3. **Thay đổi nguồn so với run trước**: danh sách file đổi (`changedSincePrevRun`).
4. **Bảng case**: `caseId | status | sheet | hitStop | duration | cờ` — cờ nổi bật (lỗi console, 0 frame đổi, tràn khung, asset thiếu) đặt **trên cùng**.
5. Đường dẫn sheet tổng.
6. Cách tái tạo: lệnh chính xác đã chạy.
