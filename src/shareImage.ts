// Render a card to a 1080×1350 PNG (Instagram portrait) and share it.
import type { Card } from './cards';

const W = 1080, H = 1350;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export async function cardToBlob(card: Card, footer: string): Promise<Blob> {
  await Promise.all([
    document.fonts.load('400 120px "Archivo Black"'),
    document.fonts.load('700 40px "Inter Variable"'),
  ]).catch(() => {});
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const variant = card.variant ?? 'black';
  const bg = variant === 'white' ? '#f4f1ea' : variant === 'red' ? '#d1001f' : '#000';
  const fg = variant === 'white' ? '#0d0d0d' : '#fff';
  const accent = variant === 'white' ? '#0d0d0d' : variant === 'red' ? '#fff' : '#ffd400';
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, W, H);
  // hazard stripes
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, 36);
  ctx.clip();
  for (let x = -60; x < W + 60; x += 60) {
    ctx.fillStyle = '#ffd400';
    ctx.beginPath();
    ctx.moveTo(x, 36); ctx.lineTo(x + 30, 36); ctx.lineTo(x + 66, 0); ctx.lineTo(x + 36, 0);
    ctx.fill();
  }
  ctx.restore();
  // card
  const pad = 70, top = 90, bottom = H - 140;
  ctx.fillStyle = '#ffd400';
  roundRect(ctx, pad + 14, top + 14, W - 2 * pad, bottom - top, 36);
  ctx.fill();
  ctx.fillStyle = bg;
  ctx.strokeStyle = variant === 'white' ? '#0d0d0d' : '#fff';
  ctx.lineWidth = 6;
  roundRect(ctx, pad, top, W - 2 * pad, bottom - top, 36);
  ctx.fill();
  ctx.stroke();
  const x = pad + 60, maxW = W - 2 * pad - 120;
  const font = (w: string, size: number, fam: 'display' | 'body') =>
    `${w} ${size}px ${fam === 'display' ? '"Archivo Black", system-ui, sans-serif' : '"Inter Variable", system-ui, sans-serif'}`;
  // fit: shrink everything until the block fits in the card
  const cardH = bottom - top - 120;
  let scale = 1.25;
  let layout: { kind: string; lines: string[]; size: number; gap: number; lh: number }[] = [];
  let total = 0;
  for (let i = 0; i < 12; i++) {
    let big = 190 * scale;
    ctx.font = font('400', big, 'display');
    while (ctx.measureText(card.big).width > maxW && big > 60) {
      big -= 6;
      ctx.font = font('400', big, 'display');
    }
    const block = (kind: string, text: string, size: number, fam: 'display' | 'body', weight: string, lh: number, gap: number) => {
      ctx.font = font(weight, size, fam);
      return { kind, lines: wrap(ctx, text, maxW), size, gap, lh };
    };
    layout = [
      { kind: 'tag', lines: [card.tag.toUpperCase()], size: 30, gap: 24, lh: 36 },
      { kind: 'big', lines: [card.big], size: big, gap: 30, lh: big * 0.95 },
      block('text', card.text, 40 * scale, 'body', '500', 52 * scale, 34),
      block('punch', card.punch, 52 * scale, 'display', '400', 62 * scale, 40),
      block('lesson', `→ ${card.lesson}`, 32 * scale, 'body', '600', 42 * scale, 0),
    ];
    total = layout.reduce((h, b) => h + b.lines.length * b.lh + b.gap, 0);
    if (total <= cardH) break;
    scale *= 0.92;
  }
  let y = top + 60 + Math.max(0, (cardH - total) / 2);
  for (const b of layout) {
    for (const line of b.lines) {
      y += b.lh;
      if (b.kind === 'tag') { ctx.fillStyle = variant === 'white' ? '#555' : variant === 'red' ? '#ffc2cb' : '#999'; ctx.font = font('800', b.size, 'body'); }
      if (b.kind === 'big') { ctx.fillStyle = accent; ctx.font = font('400', b.size, 'display'); }
      if (b.kind === 'text') { ctx.fillStyle = fg; ctx.font = font('500', b.size, 'body'); }
      if (b.kind === 'punch') { ctx.fillStyle = fg; ctx.font = font('400', b.size, 'display'); }
      if (b.kind === 'lesson') { ctx.fillStyle = variant === 'white' ? '#0a7a3c' : variant === 'red' ? '#fff' : '#2bd576'; ctx.font = font('600', b.size, 'body'); }
      ctx.fillText(line, x, y);
    }
    y += b.gap;
  }
  // footer
  ctx.fillStyle = '#ffd400';
  ctx.font = '400 44px "Archivo Black", system-ui, sans-serif';
  ctx.fillText('NEHODOVKA', pad, H - 60);
  ctx.fillStyle = '#888';
  ctx.font = '600 26px "Inter Variable", system-ui, sans-serif';
  const fw = ctx.measureText(footer).width;
  ctx.fillText(footer, W - pad - fw, H - 64);
  return new Promise((res) => c.toBlob((b) => res(b!), 'image/png'));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function shareCard(card: Card, footer: string, text: string) {
  const blob = await cardToBlob(card, footer);
  const file = new File([blob], `nehodovka-${card.id}.png`, { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return;
    }
  } catch {
    return; // user cancelled
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
