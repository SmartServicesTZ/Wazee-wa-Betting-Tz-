const targets = [
  ["website", process.env.SMOKE_SITE_URL || "https://wazee-wa-betting-tz.pages.dev/"],
  ["worker health", process.env.SMOKE_API_URL || "https://wazee-wa-betting-tz.stewardjackson999.workers.dev/health"],
  ["database health", (process.env.SMOKE_API_URL || "https://wazee-wa-betting-tz.stewardjackson999.workers.dev") + "/api/health"],
  ["marketplace", (process.env.SMOKE_API_URL || "https://wazee-wa-betting-tz.stewardjackson999.workers.dev") + "/api/v1/listings"],
  ["community", (process.env.SMOKE_API_URL || "https://wazee-wa-betting-tz.stewardjackson999.workers.dev") + "/api/v1/community/posts"],
  ["sports providers", (process.env.SMOKE_API_URL || "https://wazee-wa-betting-tz.stewardjackson999.workers.dev") + "/api/v1/sports/providers"],
  ["sports fixtures", (process.env.SMOKE_API_URL || "https://wazee-wa-betting-tz.stewardjackson999.workers.dev") + "/api/v1/sports/fixtures"],
  ["sports results", (process.env.SMOKE_API_URL || "https://wazee-wa-betting-tz.stewardjackson999.workers.dev") + "/api/v1/sports/results"],
];

async function check(name, url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { accept: "application/json,text/html" } });
  if (!response.ok) throw new Error(name + " returned HTTP " + response.status);
  const type = response.headers.get("content-type") || "";
  if (name === "website") {
    const html = await response.text();
    if (!html.includes('<div id="root"></div>') || !html.includes("Wazee wa Betting TZ")) {
      throw new Error("Website response is missing the React app shell or title.");
    }
    const scriptPath = html.match(/<script[^>]+src="([^"]+\\.js)"/)?.[1];
    if (!scriptPath) throw new Error("Production JavaScript bundle was not found in the HTML.");
    const bundleResponse = await fetch(new URL(scriptPath, url), { signal: AbortSignal.timeout(15000) });
    if (!bundleResponse.ok) throw new Error("Production JavaScript bundle returned HTTP " + bundleResponse.status);
    const bundle = await bundleResponse.text();
    if (!bundle.includes("Thibitisha password") || !bundle.includes("Password na uthibitisho wake havifanani")) {
      throw new Error("Live registration bundle is missing password confirmation validation.");
    }
    return "HTTP " + response.status + " · app shell and registration flow OK";
  }
  if (!type.includes("application/json")) throw new Error(name + " did not return JSON.");
  const data = await response.json();
  if (name === "worker health" && data.ok !== true) throw new Error("Worker health payload is not healthy.");
  if (name === "database health" && (data.ok !== true || data.database !== "connected" || Number(data.tables) < 15)) {
    throw new Error("D1 health check failed or expected schema is missing.");
  }
  if (["marketplace", "community", "sports providers", "sports fixtures", "sports results"].includes(name) && !Array.isArray(data.items)) {
    throw new Error(name + " response is missing its items array.");
  }
  if (name === "sports providers" && !data.items.some((item) => item.provider_key === "api-football" && item.status === "unconfigured")) {
    throw new Error("API-Football provider registry entry is missing or unexpectedly enabled.");
  }
  return "HTTP " + response.status + " · response OK";
}

let failed = false;
for (const [name, url] of targets) {
  try {
    process.stdout.write("PASS " + name + ": " + await check(name, url) + "\n");
  } catch (error) {
    failed = true;
    process.stderr.write("FAIL " + name + ": " + (error?.message || String(error)) + "\n");
  }
}
if (failed) process.exitCode = 1;
