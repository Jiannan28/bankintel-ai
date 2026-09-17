import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PptxGenJS from 'pptxgenjs';

const GREEN = '006442';
const RED = 'D51E49';
const SLATE = '666666';

export default function OnePagerButton() {
  const [generating, setGenerating] = useState(false);

  const download = async () => {
    setGenerating(true);
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      const slide = pptx.addSlide();
      slide.background = { color: 'F8F9F9' };

      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: GREEN } });

      slide.addText('MERIDIAN', {
        x: 0.6, y: 0.55, w: 4, h: 0.4, fontSize: 16, bold: true, color: RED, charSpacing: 4,
      });
      slide.addText('Market Intelligence for Growth', {
        x: 0.6, y: 0.95, w: 12, h: 0.9, fontSize: 40, bold: true, color: GREEN,
      });
      slide.addText('From Customer Signal to Campaign Launch — One Intelligent Platform', {
        x: 0.6, y: 1.85, w: 12, h: 0.5, fontSize: 18, color: SLATE, italic: true,
      });

      slide.addText(
        'An all-in-one market intelligence and campaign management platform built for banking. Meridian converts live customer signals, CIO insights, and market events into AI-driven campaign ideas — then validates, simulates, launches, and measures them across every channel, in a single workflow.',
        { x: 0.6, y: 2.55, w: 12.1, h: 0.95, fontSize: 13, color: '333333', lineSpacingMultiple: 1.2 }
      );

      const points = [
        ['Sharper targeting', 'AI mines transactional, behavioral, and portfolio signals to spot client opportunities humans miss'],
        ['Faster time-to-market', 'Campaign ideation that took weeks now takes minutes, with expert review built in at every step'],
        ['Decisions backed by numbers', 'Outcome simulation and A/B testing validate every campaign before budget is committed'],
        ['Consistent omni-channel delivery', 'Email, SMS, push, WhatsApp, in-app, and RM calls — in English, Cantonese, and Mandarin'],
      ];
      points.forEach(([title, desc], i) => {
        const x = 0.6 + (i % 2) * 6.2;
        const y = 3.75 + Math.floor(i / 2) * 1.15;
        slide.addShape(pptx.ShapeType.rect, { x, y: y + 0.08, w: 0.07, h: 0.85, fill: { color: RED } });
        slide.addText(title, { x: x + 0.25, y, w: 5.7, h: 0.35, fontSize: 14, bold: true, color: GREEN });
        slide.addText(desc, { x: x + 0.25, y: y + 0.36, w: 5.7, h: 0.75, fontSize: 11, color: SLATE, lineSpacingMultiple: 1.15 });
      });

      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 6.28, w: 13.33, h: 0.85, fill: { color: GREEN } });
      slide.addText(
        'Meridian turns the bank\u2019s own intelligence into revenue — from the first signal to the measured result.',
        { x: 0.6, y: 6.28, w: 12.1, h: 0.85, fontSize: 15, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' }
      );

      await pptx.writeFile({ fileName: 'Meridian_CEO_One-Pager.pptx' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button onClick={download} disabled={generating} size="sm" className="bg-accent hover:bg-accent/90">
      <Download className="w-4 h-4" />
      {generating ? 'Generating...' : 'Download CEO One-Pager (PPTX)'}
    </Button>
  );
}