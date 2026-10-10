import { BusinessCard } from '../types';

/**
 * Cleanly format and sanitize a phone number for vCard international dialing
 */
function formatPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Generate standard RFC 2426 (vCard 3.0) compliant text with CRLF line breaks
 */
export function generateVCard(card: BusinessCard): string {
  const contactName = (card.contactPersonName || card.businessName).trim();
  const nameParts = contactName.split(/\s+/);
  const firstName = nameParts[0] || card.businessName;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${contactName}`,
    `ORG:${card.businessName}`,
    `TITLE:${card.designation || card.businessTypeLabel || 'Smart Communicator'}`,
  ];

  // Mobile / Cell Phone
  if (card.socialLinks.phone) {
    const cellNum = formatPhone(card.socialLinks.phone);
    lines.push(`TEL;TYPE=CELL,VOICE,PREF:${cellNum}`);
  }

  // Emergency / 24-7 Armed Response line
  if (card.emergencyPhone) {
    const emNum = formatPhone(card.emergencyPhone);
    lines.push(`TEL;TYPE=WORK,VOICE:${emNum}`);
  }

  // WhatsApp
  if (card.socialLinks.whatsapp) {
    const waNum = formatPhone(card.socialLinks.whatsapp);
    lines.push(`X-SOCIALPROFILE;TYPE=whatsapp:https://wa.me/${waNum.replace('+', '')}`);
  }

  // Email
  if (card.socialLinks.email) {
    lines.push(`EMAIL;TYPE=INTERNET,PREF:${card.socialLinks.email.trim()}`);
  }

  // Website
  if (card.socialLinks.website) {
    let url = card.socialLinks.website.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    lines.push(`URL;TYPE=WORK:${url}`);
  }

  // B-Smart Smart Link
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://bsmart.co.za';
  lines.push(`URL;TYPE=DIGITAL_CARD:${currentOrigin}/card/${card.slug}`);

  // Physical or Postal Address
  if (card.socialLinks.address) {
    const cleanAddr = card.socialLinks.address.trim();
    lines.push(`ADR;TYPE=WORK:;;${cleanAddr.replace(/,/g, ';')};;;;`);
    lines.push(`LABEL;TYPE=WORK:${cleanAddr}`);
  }

  // Social Profiles
  if (card.socialLinks.linkedin) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${card.socialLinks.linkedin}`);
  }
  if (card.socialLinks.instagram) {
    lines.push(`X-SOCIALPROFILE;TYPE=instagram:${card.socialLinks.instagram}`);
  }
  if (card.socialLinks.facebook) {
    lines.push(`X-SOCIALPROFILE;TYPE=facebook:${card.socialLinks.facebook}`);
  }

  // Logo / Photo URL
  if (card.logoUrl && card.logoUrl.startsWith('http')) {
    lines.push(`PHOTO;VALUE=URI:${card.logoUrl}`);
  }

  // Note with tagline, operating hours, and bio
  const noteParts = [
    card.tagline,
    card.aboutText ? card.aboutText.slice(0, 300) : '',
    card.operatingHours ? `Hours: ${card.operatingHours}` : '',
    `Saved from B-Smart: ${currentOrigin}/card/${card.slug}`,
  ].filter(Boolean);

  if (noteParts.length > 0) {
    const noteContent = noteParts.join('\\n\\n').replace(/\r?\n/g, '\\n');
    lines.push(`NOTE:${noteContent}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/**
 * Export contact information into a .vcf file.
 * Prioritizes native mobile OS Contacts integration via navigator.share File API
 * (which prompts "Add to Contacts" directly on iOS and Android),
 * and falls back gracefully to direct Blob download.
 */
export async function downloadVCard(card: BusinessCard): Promise<{ success: boolean; method: string }> {
  const vcardText = generateVCard(card);
  const cleanName = (card.contactPersonName || card.businessName)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');
  const filename = `${cleanName}.vcf`;

  // Try Web Share API with File (iOS / Android native contacts sheet)
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const file = new File([vcardText], filename, { type: 'text/vcard' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: card.contactPersonName || card.businessName,
          text: `Save contact info for ${card.businessName}`,
        });
        return { success: true, method: 'native-share' };
      }
    } catch (err: any) {
      // User cancelled share dialog or permission denied, fall back to direct download
      if (err.name === 'AbortError') {
        return { success: false, method: 'cancelled' };
      }
    }
  }

  // Standard Blob Download Fallback
  try {
    const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 2000);
    return { success: true, method: 'blob-download' };
  } catch (err) {
    // Ultimate Data URI fallback
    const dataUri = 'data:text/vcard;charset=utf-8,' + encodeURIComponent(vcardText);
    const link = document.createElement('a');
    link.href = dataUri;
    link.setAttribute('download', filename);
    link.click();
    return { success: true, method: 'data-uri' };
  }
}
