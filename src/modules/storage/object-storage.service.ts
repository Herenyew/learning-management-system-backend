import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BusinessRuleError, ConflictError } from "../../common/errors/http-errors.js";
import { env } from "../../config/env.js";

export type UploadIntent = {
  objectKey: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
};

export class ObjectStorageService {
  private readonly s3 = new S3Client({
    region: env.storage.aws.region,
    credentials: {
      accessKeyId: env.storage.aws.accessKeyId,
      secretAccessKey: env.storage.aws.secretAccessKey,
    },
  });

  assertAvailable() {
    if (env.storage.provider !== "aws") {
      throw new BusinessRuleError(
        `File uploads are not implemented for the configured ${env.storage.provider} provider.`,
      );
    }
  }

  async createUploadUrl(intent: UploadIntent) {
    this.assertAvailable();
    const command = new PutObjectCommand({
      Bucket: env.storage.aws.bucket,
      Key: intent.objectKey,
      ContentType: intent.mimeType,
      ContentLength: intent.fileSizeBytes,
      Metadata: { originalfilename: encodeURIComponent(intent.originalFileName) },
    });
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    return {
      uploadUrl,
      expiresInSeconds: 300,
      method: "PUT" as const,
      headers: { "Content-Type": intent.mimeType },
    };
  }

  async verify(intent: UploadIntent) {
    this.assertAvailable();
    const object = await this.s3.send(new HeadObjectCommand({
      Bucket: env.storage.aws.bucket,
      Key: intent.objectKey,
    }));
    if (object.ContentLength !== intent.fileSizeBytes) {
      throw new ConflictError("Uploaded file size does not match the upload request.");
    }
    if (object.ContentType && object.ContentType !== intent.mimeType) {
      throw new ConflictError("Uploaded file type does not match the upload request.");
    }
    return { checksum: object.ChecksumSHA256 ?? object.ETag?.replaceAll('"', "") ?? null };
  }

  metadata() {
    return {
      storageProvider: "aws",
      bucket: env.storage.aws.bucket,
      region: env.storage.aws.region,
    };
  }
}

export const objectStorageService = new ObjectStorageService();
