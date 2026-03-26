// src/interfaces/aws/s3.service.js
let _client = null;
let _sdk = null;

function env(name, fallback = null) {
  const v = process.env[name];
  if (typeof v !== 'string') return fallback;
  const t = v.trim();
  return t !== '' ? t : fallback;
}

export function getS3Config() {
  const region = env('AWS_REGION');
  const bucket = env('AWS_S3_BUCKET');
  const prefix = env('AWS_S3_PREFIX', '');
  const expiresDefault = Number(env('AWS_S3_PRESIGN_EXPIRES', '900'));
  return {
    region,
    bucket,
    prefix: prefix ? prefix.replace(/^\/+|\/+$/g, '') : '',
    expiresDefault: Number.isFinite(expiresDefault) && expiresDefault > 0 ? expiresDefault : 900,
  };
}

async function loadAwsSdk() {
  if (_sdk) return _sdk;
  try {
    const [s3Mod, presignerMod] = await Promise.all([
      import('@aws-sdk/client-s3'),
      import('@aws-sdk/s3-request-presigner'),
    ]);
    _sdk = {
      S3Client: s3Mod.S3Client,
      GetObjectCommand: s3Mod.GetObjectCommand,
      PutObjectCommand: s3Mod.PutObjectCommand,
      DeleteObjectCommand: s3Mod.DeleteObjectCommand,
      getSignedUrl: presignerMod.getSignedUrl,
    };
    return _sdk;
  } catch (e) {
    console.warn('[s3] AWS SDK v3 no disponible:', e?.message);
    return null;
  }
}

async function getClient() {
  if (_client) return _client;
  const cfg = getS3Config();
  if (!cfg.region) throw new Error('[s3] AWS_REGION es obligatorio');
  const sdk = await loadAwsSdk();
  if (!sdk) throw new Error('[s3] AWS SDK v3 no instalado');
  _client = new sdk.S3Client({ region: cfg.region });
  return _client;
}

export async function presignPut({ bucket, key, contentType, expiresInSeconds } = {}) {
  const cfg = getS3Config();
  const Bucket = bucket || cfg.bucket;
  if (!Bucket) throw new Error('[s3] AWS_S3_BUCKET es obligatorio');
  if (!key) throw new Error('[s3] key es obligatorio');
  const expiresIn = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
    ? expiresInSeconds : cfg.expiresDefault;
  const sdk = await loadAwsSdk();
  if (!sdk) throw new Error('[s3] AWS SDK v3 no instalado');
  const cmd = new sdk.PutObjectCommand({ Bucket, Key: key, ContentType: contentType });
  const client = await getClient();
  return sdk.getSignedUrl(client, cmd, { expiresIn });
}

export async function presignGet({ bucket, key, expiresInSeconds } = {}) {
  const cfg = getS3Config();
  const Bucket = bucket || cfg.bucket;
  if (!Bucket) throw new Error('[s3] AWS_S3_BUCKET es obligatorio');
  if (!key) throw new Error('[s3] key es obligatorio');
  const expiresIn = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
    ? expiresInSeconds : cfg.expiresDefault;
  const sdk = await loadAwsSdk();
  if (!sdk) throw new Error('[s3] AWS SDK v3 no instalado');
  const cmd = new sdk.GetObjectCommand({ Bucket, Key: key });
  const client = await getClient();
  return sdk.getSignedUrl(client, cmd, { expiresIn });
}

export async function deleteObject({ bucket, key } = {}) {
  const cfg = getS3Config();
  const Bucket = bucket || cfg.bucket;
  if (!Bucket) throw new Error('[s3] AWS_S3_BUCKET es obligatorio');
  if (!key) throw new Error('[s3] key es obligatorio');
  const sdk = await loadAwsSdk();
  if (!sdk) throw new Error('[s3] AWS SDK v3 no instalado');
  const client = await getClient();
  return client.send(new sdk.DeleteObjectCommand({ Bucket, Key: key }));
}

/**
 * Construye la URL pública de CloudFront (o S3) para una key.
 */
export function buildImageUrl(key) {
  if (!key) return null;
  const domain = process.env.CLOUDFRONT_DOMAIN;
  if (domain) return `https://${domain}/${key}`;
  const cfg = getS3Config();
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${key}`;
}
