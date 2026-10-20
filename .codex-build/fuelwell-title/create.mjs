import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';
import sharp from 'sharp';

const workspaceDir = '/Users/coledickerson/Projects/engin183/engin183-fuelwell';
const skillDir = '/Users/coledickerson/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/presentations';
const buildDir = path.join(workspaceDir, '.codex-build/fuelwell-title');
const outputDir = path.join(workspaceDir, 'design', 'fuelwell-title');
const markPath = path.join(workspaceDir, 'frontend/public/logo-concepts/01-bean-kidney.png');
const finalPptx = path.join(outputDir, 'FuelWell-title-slide.pptx');

await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="830" viewBox="0 0 1000 830" role="img" aria-label="FuelWell logo">
  <g transform="translate(255 0) scale(5.1)">
    <path d="M66 10c13 0 22 10 22 23 0 14-10 19-16 27-7 9-7 22-21 27-13 5-29-3-37-18-9-16-8-34 2-45 7-8 16-11 26-9 9 2 14-5 24-5Z" fill="#1f6f6b"/>
    <path d="M65 19c-9 6-15 12-13 19 2 8 11 11 3 19-7 7-14 10-11 20" fill="none" stroke="#fbf7f1" stroke-width="7" stroke-linecap="round"/>
    <path d="M58 20c7-3 16 0 19 8" fill="none" stroke="#c8643b" stroke-width="5" stroke-linecap="round"/>
  </g>
  <text x="500" y="670" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="126" font-weight="700" letter-spacing="-3" fill="#1b1918">FuelWell</text>
</svg>`;
const logoSvgPath = path.join(outputDir, 'FuelWell-stacked-logo.svg');
const logoPngPath = path.join(outputDir, 'FuelWell-stacked-logo.png');
await fs.writeFile(logoSvgPath, logoSvg);
await sharp(Buffer.from(logoSvg)).png().toFile(logoPngPath);

const ppt = Presentation.create({ slideSize: { width: 1600, height: 900 } });
const slide = ppt.slides.add();
slide.background.fill = '#ffffff';

function addText(name, value, box, style) {
  const shape = slide.shapes.add({
    geometry: 'textbox', name, position: box, fill: 'none',
    line: { style: 'solid', fill: 'none', width: 0 },
  });
  shape.text = value;
  shape.text.style = { typeface: 'Helvetica Neue', ...style };
  shape.text.alignment = style.alignment ?? 'center';
  shape.text.verticalAlignment = 'middle';
  return shape;
}

const markBytes = await fs.readFile(markPath);
slide.images.add({
  blob: markBytes.buffer.slice(markBytes.byteOffset, markBytes.byteOffset + markBytes.byteLength),
  contentType: 'image/png', alt: 'FuelWell kidney bean mark', fit: 'contain',
  position: { left: 610, top: 90, width: 380, height: 380 },
});
addText('FuelWell wordmark', 'FuelWell',
  { left: 355, top: 487, width: 890, height: 116 },
  { fontSize: 112, bold: true, color: '#1b1918', alignment: 'center' });
addText('Presentation subtitle', 'AI Product Dev · Launch plans',
  { left: 320, top: 626, width: 960, height: 56 },
  { fontSize: 32, color: '#6e6a66', alignment: 'center' });
addText('Team names', 'Cole · Eileen · Megan · Peyton',
  { left: 320, top: 760, width: 960, height: 46 },
  { fontSize: 27, color: '#4e4a47', alignment: 'center' });

const preview = await ppt.export({ slide, format: 'png', scale: 1 });
await fs.writeFile(path.join(outputDir, 'FuelWell-title-slide.png'), new Uint8Array(await preview.arrayBuffer()));

const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir, 'container_tools/artifact_tool_utils.mjs')).href);
const candidatePath = path.join(buildDir, 'candidate.pptx');
await (await PresentationFile.exportPptx(ppt)).save(candidatePath);
const result = await finalizePresentation({
  workspaceDir,
  candidatePath,
  finalPath: finalPptx,
  pythonExecutable: '/Users/coledickerson/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',
  integrityValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '15240000,8572500', '--validate-bullet-geometry', '--validate-heading-fit'],
  explicitTotalSlideCount: 1,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  fontPolicy: { basis: 'design', families: ['Helvetica Neue'] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, 'validation.json'),
});
console.log(JSON.stringify({ finalPptx, logoSvgPath, logoPngPath, preview: path.join(outputDir, 'FuelWell-title-slide.png'), result }, null, 2));
