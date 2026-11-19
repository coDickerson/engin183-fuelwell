// The automatic "here is your swap guide" email sent after someone joins on /join.
// Plain HTML that works in Gmail, Outlook and phone mail apps, in the person's language.

export type JoinLocale = 'en' | 'zh-Hans' | 'zh-Hant' | 'es';

interface Copy {
  subject: string;
  preview: string;
  hello: string;
  intro: string;
  button: string;
  examplesTitle: string;
  examples: [string, string][];
  demo: string;
  note: string;
  footer: string;
}

const COPY: Record<JoinLocale, Copy> = {
  en: {
    subject: 'Your free FuelWell swap guide',
    preview: '70 everyday swaps for the dishes your family already loves.',
    hello: 'Hi {name},',
    intro: 'Thank you for joining the FuelWell waitlist. Here is your free swap guide: 70 everyday swaps that cut salt and sugar in the dishes your family already loves, with photos and portion tips.',
    button: 'Open the swap guide',
    examplesTitle: 'Three to try this week',
    examples: [
      ['Stir-fry with soy and oyster sauce', 'Use about half the sauce and add garlic, ginger, chili and a splash of rice vinegar.'],
      ['Pho', 'Enjoy the noodles, meat and herbs, and leave about half the broth. Most of the salt is in the broth.'],
      ['Boba milk tea', 'Order a smaller size at 25 to 50 percent sugar, with fewer pearls.'],
    ],
    demo: 'The guide opens in our demo, where you can also look around the rest of FuelWell.',
    note: 'These are general examples, not medical advice. If you manage kidney disease, diabetes or high blood pressure, check changes with your care team.',
    footer: 'You’re getting this email because you joined the FuelWell waitlist. FuelWell is a UC Berkeley student project. Reply to this email if you’d like to be removed.',
  },
  'zh-Hans': {
    subject: '您的 FuelWell 免费替换指南',
    preview: '70 个日常替换，适用于全家爱吃的菜。',
    hello: '{name}，您好：',
    intro: '谢谢您加入 FuelWell 候补名单。这是您的免费替换指南：70 个日常替换，在全家爱吃的菜里少盐少糖，附照片和份量建议。',
    button: '打开替换指南',
    examplesTitle: '这周可以试试这三个',
    examples: [
      ['酱油蚝油小炒', '酱汁减半，多加蒜、姜、辣椒和少许米醋。'],
      ['越南河粉', '吃河粉、肉和香草，汤留下一半左右。大部分的盐都在汤里。'],
      ['珍珠奶茶', '点小杯，三分糖或五分糖，珍珠少一点。'],
    ],
    demo: '指南会在我们的示范版中打开，您也可以顺便看看 FuelWell 的其他功能。',
    note: '这些只是一般例子，不是医疗建议。如果您有肾病、糖尿病或高血压，请先和医疗团队确认。',
    footer: '您收到这封邮件，是因为您加入了 FuelWell 候补名单。FuelWell 是加州大学伯克利分校的学生项目。如不想再收到邮件，请直接回复告诉我们。',
  },
  'zh-Hant': {
    subject: '您的 FuelWell 免費替換指南',
    preview: '70 個日常替換，適用於全家愛吃的菜。',
    hello: '{name}，您好：',
    intro: '謝謝您加入 FuelWell 候補名單。這是您的免費替換指南：70 個日常替換，在全家愛吃的菜裡少鹽少糖，附照片和份量建議。',
    button: '打開替換指南',
    examplesTitle: '這週可以試試這三個',
    examples: [
      ['醬油蠔油小炒', '醬汁減半，多加蒜、薑、辣椒和少許米醋。'],
      ['越南河粉', '吃河粉、肉和香草，湯留下一半左右。大部分的鹽都在湯裡。'],
      ['珍珠奶茶', '點小杯，三分糖或半糖，珍珠少一點。'],
    ],
    demo: '指南會在我們的示範版中打開，您也可以順便看看 FuelWell 的其他功能。',
    note: '這些只是一般例子，不是醫療建議。如果您有腎病、糖尿病或高血壓，請先和醫療團隊確認。',
    footer: '您收到這封信，是因為您加入了 FuelWell 候補名單。FuelWell 是加州大學柏克萊分校的學生專題。如不想再收到信件，請直接回信告訴我們。',
  },
  es: {
    subject: 'Tu guía gratis de cambios de FuelWell',
    preview: '70 cambios cotidianos para los platos que tu familia ya ama.',
    hello: 'Hola, {name}:',
    intro: 'Gracias por unirte a la lista de espera de FuelWell. Aquí está tu guía gratis: 70 cambios cotidianos que reducen la sal y el azúcar en los platos que tu familia ya ama, con fotos y consejos de porciones.',
    button: 'Abrir la guía de cambios',
    examplesTitle: 'Tres para probar esta semana',
    examples: [
      ['Salteado con salsa de soya y de ostión', 'Usa la mitad de la salsa y agrega ajo, jengibre, chile y un chorrito de vinagre de arroz.'],
      ['Pho', 'Disfruta los fideos, la carne y las hierbas, y deja más o menos la mitad del caldo. Casi toda la sal está en el caldo.'],
      ['Té de leche con boba', 'Pide un tamaño más chico, con 25 a 50 por ciento de azúcar y menos perlas.'],
    ],
    demo: 'La guía se abre en nuestra demo, donde también puedes ver el resto de FuelWell.',
    note: 'Son ejemplos generales, no consejos médicos. Si tienes enfermedad renal, diabetes o presión alta, consulta los cambios con tu equipo médico.',
    footer: 'Recibes este correo porque te uniste a la lista de espera de FuelWell. FuelWell es un proyecto estudiantil de UC Berkeley. Responde a este correo si quieres que te quitemos de la lista.',
  },
};

const esc = (value: string) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export function joinEmail(locale: JoinLocale, name: string, guideUrl: string) {
  const c = COPY[locale] ?? COPY.en;
  const hello = c.hello.replace('{name}', name);
  const examplesHtml = c.examples.map(([dish, swap]) => `
          <tr><td style="padding:12px 16px;border-left:4px solid #0f7a5c;background:#effaf5;border-radius:0 10px 10px 0;">
            <div style="font-weight:700;color:#0b2b22;">${esc(dish)}</div>
            <div style="margin-top:4px;color:#33403c;">${esc(swap)}</div>
          </td></tr>
          <tr><td style="height:10px;line-height:10px;">&nbsp;</td></tr>`).join('');
  const html = `<!doctype html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(c.subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:-apple-system,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',Arial,sans-serif;font-size:17px;line-height:1.55;color:#1d2422;">
  <div style="display:none;max-height:0;overflow:hidden;">${esc(c.preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;padding:32px 28px;">
        <tr><td style="font-size:20px;font-weight:800;color:#073d30;padding-bottom:20px;">FuelWell</td></tr>
        <tr><td style="padding-bottom:12px;">${esc(hello)}</td></tr>
        <tr><td style="padding-bottom:24px;">${esc(c.intro)}</td></tr>
        <tr><td style="padding-bottom:28px;">
          <a href="${esc(guideUrl)}" style="display:inline-block;padding:14px 26px;background:#073d30;color:#ffffff;text-decoration:none;font-weight:700;border-radius:999px;">${esc(c.button)}</a>
        </td></tr>
        <tr><td style="font-weight:800;color:#0b2b22;padding-bottom:12px;">${esc(c.examplesTitle)}</td></tr>
        <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${examplesHtml}</table></td></tr>
        <tr><td style="padding:14px 0 12px;color:#33403c;">${esc(c.demo)}</td></tr>
        <tr><td style="padding:12px 0;font-size:14px;color:#5b6663;border-top:1px solid #e3e8e6;">${esc(c.note)}</td></tr>
        <tr><td style="font-size:14px;color:#5b6663;">${esc(c.footer)}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const text = [
    hello, '', c.intro, '', `${c.button}: ${guideUrl}`, '', c.examplesTitle,
    ...c.examples.map(([dish, swap]) => `- ${dish}: ${swap}`), '', c.demo, '', c.note, '', c.footer,
  ].join('\n');
  return { subject: c.subject, html, text };
}
