// Photo checks for "Swap a meal". The browser shrinks photos before sending,
// so anything over about 3.5 MB here means something is off.
const MAX_BYTES = 3_500_000;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type ImageType = (typeof TYPES)[number];

export type ImageCheck = { ok: true; dataUrl: string; type: ImageType; bytes: number } | { ok: false; error: string };

function sniff(buf: Buffer): ImageType | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buf.subarray(0, 3).toString('ascii') === 'GIF') return 'image/gif';
  return null;
}

/** Accepts a data URL ("data:image/jpeg;base64,...") or bare base64. Checks the real bytes, not just the label. */
export function checkImage(input: string): ImageCheck {
  const m = /^data:(image\/[a-z+.-]+);base64,(.+)$/is.exec(input.trim());
  const b64 = (m ? m[2] : input).replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+=*$/.test(b64)) return { ok: false, error: 'That photo could not be read. Try another one.' };
  const buf = Buffer.from(b64, 'base64');
  if (buf.length > MAX_BYTES) return { ok: false, error: 'That photo is too large. Try a smaller one.' };
  const type = sniff(buf);
  if (!type) return { ok: false, error: 'Please use a JPEG, PNG, WebP or GIF photo.' };
  return { ok: true, dataUrl: `data:${type};base64,${b64}`, type, bytes: buf.length };
}
