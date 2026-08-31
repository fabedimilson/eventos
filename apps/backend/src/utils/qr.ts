import crypto from 'crypto';
import QRCode from 'qrcode';

// Janela de validade do QR Code rotativo em segundos (15 segundos)
const TIME_STEP = 15;

export function generateTotpWindow(): number {
  return Math.floor(Date.now() / 1000 / TIME_STEP);
}

export function generateSessionQrToken(sessionId: string, secretKey: string, timeWindow?: number): string {
  const currentWindow = timeWindow ?? generateTotpWindow();
  const data = `${sessionId}:${secretKey}:${currentWindow}`;
  const hmac = crypto.createHmac('sha256', secretKey).update(data).digest('hex');
  return `${currentWindow}:${hmac}`;
}

export function verifySessionQrToken(sessionId: string, secretKey: string, token: string): boolean {
  const parts = token.split(':');
  if (parts.length !== 2) return false;

  const [windowStr, receivedHmac] = parts;
  const tokenWindow = parseInt(windowStr, 10);
  const currentWindow = generateTotpWindow();

  // Permite tolerância de 1 janela para trás ou para frente para compensar latência de rede
  const isValidWindow = Math.abs(currentWindow - tokenWindow) <= 1;
  if (!isValidWindow) return false;

  const expectedData = `${sessionId}:${secretKey}:${tokenWindow}`;
  const expectedHmac = crypto.createHmac('sha256', secretKey).update(expectedData).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(expectedHmac));
}

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    color: {
      dark: '#1B5E20', // Verde IFAM
      light: '#FFFFFF',
    },
  });
}
