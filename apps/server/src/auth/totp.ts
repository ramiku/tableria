import { randomInt } from 'node:crypto';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

const ISSUER = 'Tableria';
// Sin 0/O/1/I para evitar confusiones al teclear un backup code a mano.
const BACKUP_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeTotp(secret: OTPAuth.Secret, label: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({ issuer: ISSUER, label, secret });
}

/** Genera un secreto TOTP nuevo (pendiente de confirmar) + su QR para escanear. */
export async function generateTotpSetup(label: string): Promise<{ secretBase32: string; otpauthUri: string; qrDataUrl: string }> {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = makeTotp(secret, label);
  const otpauthUri = totp.toString();
  const qrDataUrl = await QRCode.toDataURL(otpauthUri);
  return { secretBase32: secret.base32, otpauthUri, qrDataUrl };
}

/** Valida un código de 6 dígitos contra un secreto en base32, con la ventana ±1 paso estándar de TOTP. */
export function verifyTotpCode(secretBase32: string, token: string, label = ''): boolean {
  const totp = makeTotp(OTPAuth.Secret.fromBase32(secretBase32), label);
  return totp.validate({ token, window: 1 }) !== null;
}

function randomBackupCode(): string {
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += BACKUP_CODE_ALPHABET[randomInt(BACKUP_CODE_ALPHABET.length)];
  }
  return code;
}

/** 10 códigos de un solo uso, formato XXXX-XXXX. */
export function generateBackupCodes(count = 10): string[] {
  return Array.from({ length: count }, randomBackupCode);
}
