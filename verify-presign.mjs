// Standalone proof that the app's S3 client builds path-style presigned URLs
// of the exact shape the single-domain routing requires:
//   https://aitest1.snu.in/coe3d-models/<key>?X-Amz-Signature=...
// This exercises the SAME aws-sdk config the app uses (see src/server/storage/s3.ts):
// endpoint + forcePathStyle, with the same signableHeaders on PUT.
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ENDPOINT = process.env.S3_ENDPOINT || "https://aitest1.snu.in";
const BUCKET = process.env.S3_BUCKET || "coe3d-models";

const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: ENDPOINT,
  forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || "true") === "true",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "coe3d-minio-access",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "coe3d-minio-secret-dummy",
  },
});

const key = "uploads/demo-user/00000000-0000-0000-0000-000000000000.stl";

const putUrl = await getSignedUrl(
  s3,
  new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: "model/stl" }),
  { expiresIn: 120, signableHeaders: new Set(["content-type", "content-length"]) }
);
const getUrl = await getSignedUrl(
  s3,
  new GetObjectCommand({ Bucket: BUCKET, Key: key }),
  { expiresIn: 300 }
);

const expectedPrefix = `${ENDPOINT}/${BUCKET}/`;
const putOk = putUrl.startsWith(expectedPrefix);
const getOk = getUrl.startsWith(expectedPrefix);

console.log("Endpoint        :", ENDPOINT);
console.log("Bucket          :", BUCKET);
console.log("Path-style      :", (process.env.S3_FORCE_PATH_STYLE || "true"));
console.log("Expected prefix :", expectedPrefix);
console.log("");
console.log("Presigned PUT   :", putUrl.split("?")[0], "  [", putOk ? "OK path-style" : "WRONG SHAPE", "]");
console.log("Presigned GET   :", getUrl.split("?")[0], "  [", getOk ? "OK path-style" : "WRONG SHAPE", "]");
console.log("PUT query has signature:", /X-Amz-Signature=/.test(putUrl));
console.log("");
console.log(putOk && getOk ? "RESULT: PASS — presigned URLs are path-style under the single domain." : "RESULT: FAIL");
process.exit(putOk && getOk ? 0 : 1);
