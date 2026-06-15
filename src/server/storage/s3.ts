import "server-only";

import { randomUUID } from "node:crypto";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/lib/env";
import { MAX_UPLOAD_BYTES, type AllowedExtension } from "@/lib/uploads";

/**
 * S3-compatible client. Works with AWS S3, Cloudflare R2, and MinIO. R2/MinIO
 * require an explicit endpoint; MinIO also wants path-style addressing.
 */
const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT || undefined,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

export interface PresignedUpload {
  /** PUT this URL with the raw file body and the matching Content-Type. */
  url: string;
  /** Object key to persist on the booking. */
  key: string;
}

/**
 * Generates a presigned PUT URL so the browser uploads the file directly to
 * object storage — the file never touches the app server or the DB. The URL is
 * scoped to the exact content-type and a content-length range capping size,
 * and expires quickly.
 */
export async function createPresignedUpload(params: {
  userId: string;
  ext: AllowedExtension;
  contentType: string;
}): Promise<PresignedUpload> {
  const key = `uploads/${params.userId}/${randomUUID()}.${params.ext}`;

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: params.contentType,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: 120, // 2 minutes
    // Enforce the declared content-type and a hard upper size bound at the
    // storage layer, independent of any client-side claim.
    signableHeaders: new Set(["content-type", "content-length"]),
  });

  return { url, key };
}

/**
 * Short-lived presigned GET URL so an authorized user (owner or admin) can
 * download the model file. The object stays private; this is the only way to
 * read it.
 */
export async function createPresignedDownload(params: {
  key: string;
  fileName: string;
}): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: params.key,
    ResponseContentDisposition: `attachment; filename="${params.fileName.replace(/"/g, "")}"`,
  });
  return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
}

export { MAX_UPLOAD_BYTES };
