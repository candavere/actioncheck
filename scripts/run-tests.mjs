// Runs the compiled tests with explicit file paths (works the same on Node 20/22/24, Linux/macOS/Windows).
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
const dir = path.join("dist", "test");
const files = readdirSync(dir).filter((f) => f.endsWith(".test.js")).map((f) => path.join(dir, f));
const r = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit" });
process.exit(r.status ?? 1);
