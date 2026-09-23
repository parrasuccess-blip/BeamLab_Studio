# 4.1.3 release evidence

`public-editor.jpg` is an unaltered viewport screenshot from the actual production site on 2026-09-23, after pointer Undo restored a 20 kN centre load on the saved 8 m beam. It shows Build / Explore results available and the selected-object editor beside the reachable toolbar. Public HTML matched the tested CI artifact exactly.

Final candidate: 031b8bf665d21b09c679e60774a87f296f5a7eb5. Released code: d4f6b2182b1c899ce8f54213f67b111c9a7a8ca6. HTML SHA-256: d407fb18e0deec8befb910d832cb7c582ae0d8399d4c8625194ed8da4b373533.

Final PR CI 35860727563 and merged-main CI 35862619917 both pass 1,294 numerical/behaviour checks and 136 browser checks, zero retries. Desktop Chromium/Firefox, iPhone WebKit and 360px Chromium screenshots were reviewed in final browser artifact 10749619233. These are emulated browser projects, not physical-device testing.
