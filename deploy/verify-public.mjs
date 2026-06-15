// End-to-end verification of the PUBLIC pipeline on https://aitest1.snu.in.
// Run this AFTER the topology is up and Caddy is repointed (see OPERATOR-RUNBOOK.md).
//
// Proves, through the real public domain:
//   1. HTTPS cert is publicly trusted (issuer recorded).
//   2. GET /        → 200
//      GET /signin  → 200
//   3. Storage round-trip via single domain + path-style:
//        presign PUT  https://aitest1.snu.in/coe3d-models/<key>
//        upload bytes, presign GET, download, compare → must match.
//   4. Cron gate: POST /api/cron/reminders
//        wrong bearer → 401,  correct bearer → 200.
//   5. Login attempt fails ONLY due to dummy Google creds (expected).
//
// Reads creds from the same .env the app uses. Cleans up its test object.
//
//   node deploy/verify-public.mjs

import { readFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import tls from "node:tls";
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---- load .env (simple parser; no extra dep) ----
const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
const E = {};
for (const line of envText.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  E[m[1]] = v;
}

const BASE = E.NEXTAUTH_URL || "https://aitest1.snu.in";
const BUCKET = E.S3_BUCKET || "coe3d-models";
let pass = true;
const log = (ok, label, detail) => {
  pass = pass && ok;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  — " + detail : ""}`);
};

// ---- 1. cert issuer ----
async function certIssuer(host) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, timeout: 8000 }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      resolve(cert?.issuer ? `${cert.issuer.O || ""} ${cert.issuer.CN || ""}`.trim() : "unknown");
    });
    socket.on("error", () => resolve("ERROR"));
    socket.on("timeout", () => { socket.destroy(); resolve("TIMEOUT"); });
  });
}

// ---- 2/4/5 HTTP helpers ----
async function status(path, opts = {}) {
  try {
    const r = await fetch(BASE + path, { redirect: "manual", ...opts });
    return r.status;
  } catch (e) {
    return `ERR(${e.message})`;
  }
}

const s3 = new S3Client({
  region: E.S3_REGION || "us-east-1",
  endpoint: E.S3_ENDPOINT || BASE,
  forcePathStyle: (E.S3_FORCE_PATH_STYLE || "true") === "true",
  credentials: { accessKeyId: E.S3_ACCESS_KEY_ID, secretAccessKey: E.S3_SECRET_ACCESS_KEY },
});

async function main() {
  const host = new URL(BASE).host;

  // 1
  const issuer = await certIssuer(host);
  log(issuer && issuer !== "ERROR" && issuer !== "TIMEOUT" && issuer !== "unknown",
      `HTTPS cert on ${host}`, `issuer: ${issuer}`);

  // 2
  log((await status("/")) === 200, "GET /", `status ${await status("/")}`);
  log((await status("/signin")) === 200, "GET /signin", `status ${await status("/signin")}`);

  // 3 storage round-trip
  const key = `uploads/verify/${randomUUID()}.txt`;
  const body = Buffer.from(`coe3d single-domain verify ${randomUUID()}`);
  const expectShape = `${E.S3_ENDPOINT || BASE}/${BUCKET}/`;
  try {
    const putUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: "text/plain" }),
      { expiresIn: 120, signableHeaders: new Set(["content-type", "content-length"]) });
    log(putUrl.startsWith(expectShape), "presigned PUT shape", putUrl.split("?")[0]);

    const put = await fetch(putUrl, { method: "PUT", headers: { "content-type": "text/plain", "content-length": String(body.length) }, body });
    log(put.ok, "upload PUT through public domain", `status ${put.status}`);

    const getUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 120 });
    const got = await fetch(getUrl);
    const back = Buffer.from(await got.arrayBuffer());
    const same = createHash("sha256").update(body).digest("hex") === createHash("sha256").update(back).digest("hex");
    log(got.ok && same, "download GET + byte match", `status ${got.status}, bytesMatch=${same}`);
  } catch (e) {
    log(false, "storage round-trip", e.message);
  } finally {
    try { await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })); console.log("      (cleaned up test object)"); } catch {}
  }

  // 4 cron gate
  const wrong = await status("/api/cron/reminders", { method: "POST", headers: { authorization: "Bearer wrong-token" } });
  log(wrong === 401, "cron wrong bearer → 401", `status ${wrong}`);
  const right = await status("/api/cron/reminders", { method: "POST", headers: { authorization: `Bearer ${E.CRON_SECRET}` } });
  log(right === 200, "cron correct bearer → 200", `status ${right}`);

  // 5 login blocked by dummy creds — hitting the Google sign-in start should NOT 500;
  //   the failure surfaces only when Google rejects the dummy client. We just confirm
  //   the provider endpoint is wired (302/200), proving login is reachable but will be
  //   rejected by Google until real creds are added.
  const prov = await status("/api/auth/signin");
  log(prov === 200 || prov === 302, "auth signin endpoint reachable", `status ${prov} (real Google creds still required to complete)`);

  console.log("\n" + (pass ? "RESULT: PASS — public pipeline verified." : "RESULT: FAIL — see lines above."));
  process.exit(pass ? 0 : 1);
}
main();
