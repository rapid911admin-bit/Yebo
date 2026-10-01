import { BusinessCard } from '../types';

export function generateVCard(card: BusinessCard): string {
  const nameParts = (card.contactPersonName || card.businessName).trim().split(' ');
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const firstName = nameParts[0] || card.businessName;

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${card.contactPersonName || card.businessName}`,
    `ORG:${card.businessName}`,
    `TITLE:${card.designation || card.businessTypeLabel}`,
  ];

  if (card.socialLinks.phone) {
    lines.push(`TEL;TYPE=WORK,VOICE:${card.socialLinks.phone}`);
    lines.push(`TEL;TYPE=CELL:${card.socialLinks.phone}`);
  }

  if (card.emergencyPhone) {
    lines.push(`TEL;TYPE=MAIN,PREF:${card.emergencyPhone}`);
  }

  if (card.socialLinks.email) {
    lines.push(`EMAIL;TYPE=PREF,INTERNET:${card.socialLinks.email}`);
  }

  if (card.socialLinks.website) {
    let url = card.socialLinks.website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    lines.push(`URL:${url}`);
  }

  if (card.socialLinks.address) {
    lines.push(`ADR;TYPE=WORK:;;${card.socialLinks.address.replace(/,/g, ';')};;;;`);
    lines.push(`LABEL;TYPE=WORK:${card.socialLinks.address}`);
  }

  if (card.tagline || card.aboutText) {
    const note = `${card.tagline ? card.tagline + '\n\n' : ''}${card.aboutText ? card.aboutText.slice(0, 200) : ''}`;
    lines.push(`NOTE:${note.replace(/\n/g, '\\n')}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function downloadVCard(card: BusinessCard) {
  const vcardText = generateVCard(card);
  const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8;' });
  const filename = `${(card.contactPersonName || card.businessName).toLowerCase().replace(/[^a-z0-9]/g, '_')}.vcf`;
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
