/**
 * Cloudflare R2 Upload Service
 * Uses the S3-compatible API for direct browser → R2 uploads.
 *
 * SETUP REQUIRED:
 * 1. Go to dash.cloudflare.com → R2 → Manage R2 API Tokens
 * 2. Create a token with "Object Read & Write" for bucket "autosuite-documents"
 * 3. Copy the Access Key ID and Secret Access Key
 * 4. Add to .env.local:
 *    VITE_R2_ACCESS_KEY_ID=<your-access-key-id>
 *    VITE_R2_SECRET_ACCESS_KEY=<your-secret-access-key>
 */

const ACCOUNT_ID = 'eb463c746d824c0675301b56d9c21c02';
const BUCKET = 'autosuite-documents';
const R2_ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

// AWS Signature V4 helper (pure browser fetch, no AWS SDK needed)
async function sha256(message: string): Promise<ArrayBuffer> {
  const msgBuffer = new TextEncoder().encode(message);
  return crypto.subtle.digest('SHA-256', msgBuffer);
}

async function sha256Hex(message: string): Promise<string> {
  const hashBuffer = await sha256(message);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
}

async function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + secretKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

/**
 * Upload a file to Cloudflare R2 using AWS Signature V4.
 * @param file - The File object to upload
 * @param path - Storage path e.g. "delivery-orders/deal-123/1234567890.pdf"
 * @returns Public URL of the uploaded file
 */
export async function uploadToR2(file: File, path: string): Promise<string> {
  const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 credentials not configured. Add VITE_R2_ACCESS_KEY_ID and VITE_R2_SECRET_ACCESS_KEY to .env.local. ' +
      'Get them from: Cloudflare Dashboard → R2 → Manage R2 API Tokens.'
    );
  }

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z'; // 20250101T120000Z
  const dateStamp = amzDate.slice(0, 8); // 20250101
  const region = 'auto';
  const service = 's3';

  const url = `${R2_ENDPOINT}/${BUCKET}/${path}`;
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;

  // Compute payload hash
  const arrayBuffer = await file.arrayBuffer();
  const payloadHashBuf = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const payloadHash = Array.from(new Uint8Array(payloadHashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

  // Canonical headers (must be sorted alphabetically)
  const canonicalHeaders =
    `content-type:${file.type || 'application/octet-stream'}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'PUT',
    `/${BUCKET}/${path}`,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region, service);
  const signatureBuf = await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), new TextEncoder().encode(stringToSign));
  const signature = Array.from(new Uint8Array(signatureBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'Authorization': authorizationHeader,
    },
    body: arrayBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`R2 upload failed (${response.status}): ${errorText}`);
  }

  // Store path in DB; return the direct S3 endpoint URL.
  // If "Allow Public Access" is enabled in CF Dashboard the r2.dev URL also works.
  // The S3 URL requires auth — use generatePresignedGetUrl() to create viewable links.
  return `${R2_ENDPOINT}/${BUCKET}/${path}`;
}

/**
 * Generate a presigned GET URL to view a private R2 object for 1 hour.
 * Use this to open/preview stored documents from the UI.
 */
export async function generatePresignedGetUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) throw new Error('R2 credentials not configured');

  const region = 'auto';
  const service = 's3';
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresInSeconds),
    'X-Amz-SignedHeaders': 'host',
  });

  const canonicalRequest = [
    'GET',
    `/${BUCKET}/${path}`,
    queryParams.toString(),
    `host:${host}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region, service);
  const signatureBuf = await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), new TextEncoder().encode(stringToSign));
  const signature = Array.from(new Uint8Array(signatureBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

  queryParams.set('X-Amz-Signature', signature);
  return `${R2_ENDPOINT}/${BUCKET}/${path}?${queryParams.toString()}`;
}

/**
 * Generate a storage path for a deal document.
 * @param orgId - Organisation ID
 * @param dealId - Sale record ID
 * @param state - Vehicle state e.g. 'PAYMENT_STRUCTURED'
 * @param evidenceKey - Evidence type e.g. 'bank_do', 'customs_clearance'
 * @param file - The file being uploaded
 */
export function buildR2Path(orgId: string, dealId: string, state: string, evidenceKey: string, file: File): string {
  const ext = file.name.split('.').pop() || 'bin';
  const ts = Date.now();
  return `${orgId}/${state.toLowerCase()}/${dealId}/${evidenceKey}_${ts}.${ext}`;
}

/** Extract the R2 object path from a stored URL (for generating presigned view links) */
export function pathFromR2Url(url: string): string {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : url;
}

/**
 * Given a URL or R2 path, resolve it to a viewable URL.
 * If it's an R2 URL or key, generates a presigned GET URL.
 */
export async function resolveR2Url(urlOrPath: string): Promise<string> {
  if (!urlOrPath) return '';
  if (urlOrPath.startsWith('data:')) return urlOrPath; // base64 fallback
  
  const key = pathFromR2Url(urlOrPath);
  try {
    return await generatePresignedGetUrl(key, 86400); // 24-hour presigned URL
  } catch (err) {
    console.warn('Failed to resolve R2 presigned URL:', err);
    return urlOrPath;
  }
}

/**
 * Get Cloudflare R2 presigned URL for the official letterhead / logo asset.
 */
export async function getLetterheadR2Url(): Promise<string> {
  try {
    return await generatePresignedGetUrl('assets/logo3.png', 86400);
  } catch (err) {
    console.warn('Failed to get letterhead R2 URL, using local fallback:', err);
    return '/logo3.png';
  }
}

