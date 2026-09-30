import QRCode from 'qrcode'

/**
 * Generate a QR code as a base64 Data URL
 * @param text The string to encode (URL or UUID)
 * @param options QR code styling options
 */
export async function generateQRCodeDataUrl(
  text: string,
  options?: {
    width?: number
    margin?: number
    darkColor?: string
    lightColor?: string
  }
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 256,
      margin: options?.margin || 2,
      color: {
        dark: options?.darkColor || '#0f172a',
        light: options?.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return ''
  }
}

/**
 * Get public scan URL for a given qr_code_uuid
 */
export function getPublicScanUrl(qrCodeUuid: string): string {
  // Always prioritize real website domain so printed QR stickers work from mobile phones
  const defaultDomain = 'https://techsas-techsas.vercel.app'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  let baseUrl = defaultDomain
  if (appUrl && !appUrl.includes('localhost')) {
    baseUrl = appUrl
  } else if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    baseUrl = window.location.origin
  }

  return `${baseUrl.replace(/\/$/, '')}/scan/${qrCodeUuid}`
}
