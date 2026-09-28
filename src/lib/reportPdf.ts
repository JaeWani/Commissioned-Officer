import type { jsPDF } from 'jspdf';

import { documentText, type ReportDocumentTexts } from './reportDocument';

type ReportInput = {
  name: string;
  primaryType: string;
  aptitudeDescription: string;
  scores: Record<string, number>;
  documentTexts?: ReportDocumentTexts;
};

type TemplatePage = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
};

type TemplateGraphics = {
  firstPageCorner: HTMLImageElement;
  followingPageCorner: HTMLImageElement;
  footer: HTMLImageElement;
};

const pageWidth = 1224;
const pageHeight = 1584;
const contentLeft = 144;
const contentRight = pageWidth - 144;
const contentTop = 116;
const contentBottom = 1380;
const fontFamily = '"Malgun Gothic", "Noto Sans KR", Arial, sans-serif';
const typeFontFamily = '"Malgun Gothic", "Noto Sans KR", sans-serif';
const firstPageCornerSource = new URL('../assets/report-first-page-corner.png', import.meta.url).href;
const followingPageCornerSource = new URL('../assets/report-following-page-corner.png', import.meta.url).href;
const footerSource = new URL('../assets/report-footer.png', import.meta.url).href;

const typeSummaries = [
  ['R', '야전·실무용', '장비 운용과 현장 중심의 임무 수행에서 강점을 보이는 전형적인 야전형 장교로 성장할 가능성을 의미합니다. 이러한 성향은 군 환경에서 전투장비 운용과 유지관리, 전술적 운용, 병력 통제 등 실제 전투력과 직결되는 분야에서 특히 중요한 역할을 합니다. 명확한 목표와 역할이 주어졌을 때 집중력을 보이며, 책임감 있게 임무를 완수하는 것이 큰 장점입니다.'],
  ['I', '기술·분석형', '분석적 사고와 문제 해결 능력이 뛰어나며, 복잡한 시스템과 정보를 이해하고 활용하는 데 강점을 지닌 유형입니다. 군에서는 이러한 능력이 정보전, 기술전, 미래전 수행에 핵심적으로 활용됩니다. 감이나 경험보다는 객관적인 자료와 근거를 바탕으로 판단하며, 끊임없이 전문성을 향상시키려는 성향이 강합니다.'],
  ['A', '창의형', '창의적인 표현과 방법, 새로운 아이디어를 통해 조직에 활력을 불어넣는 역할을 합니다. 군 조직에서는 이러한 성향이 장병 사기진작, 홍보, 심리전, 문화 활동 등에서 중요한 의미를 갖습니다. 독창적인 시각으로 문제를 바라보고 기존의 방식을 개선하여 더 효과적인 결과를 만들어내는 데 강점을 보입니다.'],
  ['S', '관계형', '사람을 이해하고 돕는 데 강점을 가진 유형으로, 조직 내 안정과 협력을 이끄는 중요한 역할을 수행합니다. 이들은 자신의 성과뿐만 아니라 전우와 부하의 발전, 부대의 단결, 공동의 목표 달성에서 큰 보람을 느낍니다. 상대방의 이야기를 잘 듣고 공감하며, 갈등을 원만하게 조정하고 협력적인 분위기를 만드는 능력이 뛰어납니다.'],
  ['E', '리더형', '리더십과 의사결정 능력(협의, 조정)이 뛰어나며, 조직을 이끌고 목표를 달성하는 데 강점을 가진 유형입니다. 또한 이 유형은 상황을 빠르게 파악하고 방향을 설정하여 조직을 이끄는 능력이 뛰어나며, 부하들을 동기부여하고 목표 달성을 위해 자원을 효과적으로 배분하는 데 능숙합니다.'],
  ['C', '행정·관리형', '체계적인 관리와 정확한 업무 수행에 강점을 가진 유형으로, 군 조직의 안정적 운영을 유지하는 데 필수적인 역할을 담당합니다. 맡은 일을 끝까지 책임감 있게 수행하며, 작은 실수도 줄이기 위해 세심하게 확인하는 습관을 가지고 있습니다.'],
] as const;

function createPage(firstPage: boolean, graphics: TemplateGraphics): TemplatePage {
  const canvas = document.createElement('canvas');
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('PDF 캔버스를 준비하지 못했습니다.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, pageWidth, pageHeight);
  drawTopCorner(context, firstPage, graphics);
  drawFooter(context, graphics);
  context.fillStyle = '#000000';
  // A modest increase keeps the Korean body copy readable without materially
  // increasing line wraps or page count.
  (context as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '0.8px';
  context.font = `500 20px ${fontFamily}`;
  return { canvas, context };
}

function drawTopCorner(context: CanvasRenderingContext2D, firstPage: boolean, graphics: TemplateGraphics) {
  if (firstPage) {
    context.drawImage(graphics.firstPageCorner, 1044, -11, 180, 180);
    return;
  }

  context.drawImage(graphics.followingPageCorner, 973, -11, 251, 251);
}

function drawFooter(context: CanvasRenderingContext2D, graphics: TemplateGraphics) {
  context.drawImage(graphics.footer, 0, 1416, pageWidth, 168);
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('결과지 템플릿 그래픽을 불러오지 못했습니다.'));
    image.src = source;
  });
}

function linesFor(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = '';
  for (const character of text.replace(/\s+/g, ' ').trim()) {
    const next = line + character;
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line.trim());
      line = character === ' ' ? '' : character;
    } else {
      line = next;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function writeLines(context: CanvasRenderingContext2D, lines: string[], x: number, y: number, lineHeight: number) {
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

type TextRun = {
  text: string;
  weight?: 500 | 700;
};

function linesForRuns(context: CanvasRenderingContext2D, runs: TextRun[], maxWidth: number) {
  const lines: TextRun[][] = [];
  let line: TextRun[] = [];
  let lineWidth = 0;

  const finishLine = () => {
    if (line.length) lines.push(line);
    line = [];
    lineWidth = 0;
  };

  for (const run of runs) {
    for (const character of run.text) {
      if (character === '\n') {
        finishLine();
        continue;
      }
      context.font = `${run.weight ?? 500} 20px ${fontFamily}`;
      const characterWidth = context.measureText(character).width;
      if (line.length && lineWidth + characterWidth > maxWidth) finishLine();
      const previous = line.at(-1);
      if (previous && previous.weight === run.weight) previous.text += character;
      else line.push({ text: character, weight: run.weight });
      lineWidth += characterWidth;
    }
  }
  finishLine();
  return lines;
}

function writeRunLines(context: CanvasRenderingContext2D, lines: TextRun[][], x: number, y: number, lineHeight: number) {
  lines.forEach((line, lineIndex) => {
    let cursor = x;
    for (const run of line) {
      context.font = `${run.weight ?? 500} 20px ${fontFamily}`;
      context.fillText(run.text, cursor, y + lineIndex * lineHeight);
      cursor += context.measureText(run.text).width;
    }
  });
  return y + lines.length * lineHeight;
}

function addCanvasPage(pdf: jsPDF, page: TemplatePage, firstPage: boolean) {
  if (!firstPage) pdf.addPage('letter', 'portrait');
  pdf.addImage(page.canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, 215.9, 279.4, undefined, 'FAST');
}

export async function createReportPdf(input: ReportInput) {
  const { jsPDF } = await import('jspdf');
  const [firstPageCorner, followingPageCorner, footer] = await Promise.all([
    loadImage(firstPageCornerSource),
    loadImage(followingPageCornerSource),
    loadImage(footerSource),
  ]);
  const graphics = { firstPageCorner, followingPageCorner, footer };
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter', compress: true });
  const pages: TemplatePage[] = [createPage(true, graphics)];
  let currentPage = pages[0];
  let y = contentTop;
  const referenceTypeSummaries = (['R', 'I', 'A', 'S', 'E', 'C'] as const).map((code) => [
    code,
    documentText(input.documentTexts, `reference_${code.toLowerCase()}_label` as keyof ReportDocumentTexts),
    documentText(input.documentTexts, `reference_${code.toLowerCase()}_description` as keyof ReportDocumentTexts),
  ] as const);

  const nextPage = () => {
    currentPage = createPage(false, graphics);
    pages.push(currentPage);
    y = contentTop;
  };

  const ensureSpace = (height: number) => {
    if (y + height > contentBottom) nextPage();
  };

  const writeParagraph = (text: string, font: string, lineHeight: number, gap = 18) => {
    const { context } = currentPage;
    context.font = font;
    const lines = linesFor(context, text, contentRight - contentLeft);
    ensureSpace(lines.length * lineHeight + gap);
    currentPage.context.font = font;
    y = writeLines(currentPage.context, lines, contentLeft, y, lineHeight) + gap;
  };

  {
    const { context } = currentPage;
    context.font = `700 30px ${fontFamily}`;
    const title = documentText(input.documentTexts, 'document_title');
    context.fillText(title, (pageWidth - context.measureText(title).width) / 2, y + 30);
    y += 92;
    context.font = `500 21px ${fontFamily}`;
    context.fillText(`${documentText(input.documentTexts, 'profile_name_label')}: ${input.name},       ${documentText(input.documentTexts, 'profile_type_label')}: ${input.primaryType}`, contentLeft, y);
    y += 74;
    context.font = `700 22px ${fontFamily}`;
    context.fillText(documentText(input.documentTexts, 'primary_heading'), contentLeft, y);
    y += 42;
  }

  writeParagraph(
    documentText(input.documentTexts, 'intro'),
    `500 20px ${fontFamily}`,
    32,
    28,
  );
  writeParagraph(input.aptitudeDescription, `500 20px ${fontFamily}`, 32, 40);

  {
    const noticeRuns: TextRun[] = [
      { text: '본 결과는 ' },
      { text: '개인의 현재 흥미와 성향을 바탕으로 도출된 참고 자료' },
      { text: '입니다. 따라서 ' },
      { text: '개인의 노력과 경험에 따라 다양한 유형으로 확장되고 전환할 수 있음을 전제로 해석' },
      { text: '하는 것이 바람직합니다.\n병과 및 전문인력 분야에 대한 세부내용은 ' },
      { text: '“군대에서 꿈을 설계하다”' },
      { text: ' 책자를 참고하세요.' },
    ];
    noticeRuns.splice(0, noticeRuns.length, { text: documentText(input.documentTexts, 'notice') });
    const { context } = currentPage;
    const noticeLines = linesForRuns(context, noticeRuns, contentRight - contentLeft - 20);
    const boxHeight = noticeLines.length * 27 + 40;
    ensureSpace(boxHeight + 48);
    currentPage.context.strokeStyle = '#000000';
    currentPage.context.lineWidth = 2;
    currentPage.context.strokeRect(contentLeft, y - 18, contentRight - contentLeft, boxHeight);
    currentPage.context.fillStyle = '#000000';
    y = writeRunLines(currentPage.context, noticeLines, contentLeft + 18, y + 20, 27) + 44;
  }

  // Keep the complete RIASEC reference section together on page 2.
  nextPage();
  {
    const { context } = currentPage;
    const heading = documentText(input.documentTexts, 'reference_heading');
    context.font = `700 22px ${typeFontFamily}`;
    const x = (pageWidth - context.measureText(heading).width) / 2;
    context.fillText(heading, x, y);
    context.lineWidth = 2;
    context.strokeStyle = '#000000';
    context.beginPath();
    context.moveTo(x, y + 8);
    context.lineTo(x + context.measureText(heading).width, y + 8);
    context.stroke();
    y += 48;
  }

  for (const [index, [code, label, description]] of referenceTypeSummaries.entries()) {
    const { context } = currentPage;
    const englishName = code === 'R' ? 'Realistic' : code === 'I' ? 'Investigative' : code === 'A' ? 'Artistic' : code === 'S' ? 'Social' : code === 'E' ? 'Enterprising' : 'Conventional';
    const heading = `${index + 1}) ${code} (${englishName}) : ${label}`;
    context.font = `500 21px ${typeFontFamily}`;
    const descriptionLines = linesFor(context, description, contentRight - contentLeft);
    ensureSpace(32 + descriptionLines.length * 25 + 48);
    currentPage.context.font = `700 22px ${typeFontFamily}`;
    currentPage.context.fillText(heading, contentLeft, y);
    y += 32;
    currentPage.context.font = `500 21px ${typeFontFamily}`;
    y = writeLines(currentPage.context, descriptionLines, contentLeft, y, 25) + 48;
  }

  pages.forEach((page, index) => addCanvasPage(pdf, page, index === 0));
  return pdf.output('blob');
}
