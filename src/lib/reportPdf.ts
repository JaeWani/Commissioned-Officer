import type { jsPDF } from 'jspdf';

type ReportInput = {
  name: string;
  primaryType: string;
  aptitudeDescription: string;
  scores: Record<string, number>;
};

type TemplatePage = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
};

const pageWidth = 1224;
const pageHeight = 1584;
const contentLeft = 144;
const contentRight = pageWidth - 144;
const contentTop = 116;
const contentBottom = 1380;
const fontFamily = '"Arial Unicode MS", Gulim, "Malgun Gothic", sans-serif';

const typeSummaries = [
  ['R', '실전·실무형', '장비 운용과 현장 중심의 임무 수행에서 강점을 보입니다. 전투 장비 운용, 작전 수행, 전투 지원과 통제 분야처럼 현장과 밀접한 역할에서 역량을 발휘할 수 있습니다.'],
  ['I', '기술·분석형', '복잡한 체계와 정보를 분석하고 근거를 바탕으로 문제를 해결하는 성향입니다. 기술, 정보, 분석, 기획 분야에서 전문성을 꾸준히 높이는 역할과 잘 맞습니다.'],
  ['A', '창의형', '새로운 표현과 아이디어로 조직에 활력을 더하는 성향입니다. 기획, 홍보, 문화, 콘텐츠와 같이 창의적 관점과 개선안을 필요로 하는 분야에서 강점을 보입니다.'],
  ['S', '관계형', '구성원을 이해하고 돕는 데 강점을 보입니다. 교육, 상담, 조직 지원과 같이 사람의 성장과 협업을 돕는 역할에서 보람과 성과를 함께 얻을 수 있습니다.'],
  ['E', '리더형', '목표를 세우고 조직을 이끌며 상황을 판단하는 능력에 강점이 있습니다. 지휘, 조정, 자원 관리와 같이 방향을 정하고 실행을 이끄는 역할과 잘 맞습니다.'],
  ['C', '행정·관리형', '체계적인 관리와 정확한 업무 수행에 강점이 있습니다. 행정, 보급, 일정 운영처럼 기준과 절차에 따라 조직을 안정적으로 지원하는 분야에 적합합니다.'],
] as const;

function createPage(firstPage: boolean): TemplatePage {
  const canvas = document.createElement('canvas');
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('PDF 캔버스를 준비하지 못했습니다.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, pageWidth, pageHeight);
  drawTopCorner(context, firstPage);
  drawFooter(context);
  context.fillStyle = '#000000';
  context.font = `400 20px ${fontFamily}`;
  return { canvas, context };
}

function drawTopCorner(context: CanvasRenderingContext2D, firstPage: boolean) {
  if (firstPage) {
    const size = 120;
    const x = pageWidth - size;
    context.fillStyle = '#efefef';
    context.fillRect(x, 0, size, size);
    context.fillStyle = '#dddddd';
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + size, size);
    context.lineTo(x + size, 0);
    context.closePath();
    context.fill();
    context.fillStyle = '#d0d0d0';
    context.beginPath();
    context.moveTo(x, size);
    context.lineTo(x + size, size);
    context.lineTo(x + size, 0);
    context.closePath();
    context.fill();
    return;
  }

  const size = 170;
  const x = pageWidth - size;
  const cell = size / 3;
  const shades = ['#f7f7f7', '#e8e8e8', '#dedede', '#f0f0f0', '#e3e3e3', '#d6d6d6'];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      context.fillStyle = shades[(row + column) % shades.length];
      context.fillRect(x + column * cell, row * cell, cell, cell);
    }
  }
  context.strokeStyle = '#ffffff';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x, 0);
  context.lineTo(pageWidth, size);
  context.stroke();
}

function drawFooter(context: CanvasRenderingContext2D) {
  const top = 1476;
  context.fillStyle = '#2f3f92';
  context.fillRect(0, top, pageWidth, pageHeight - top);
  context.fillStyle = '#c52158';
  context.fillRect(1005, top, 120, pageHeight - top);
  context.fillStyle = '#ec3d78';
  context.fillRect(1125, top, 99, pageHeight - top);
  context.fillStyle = '#b71950';
  context.beginPath();
  context.moveTo(1125, top);
  context.lineTo(1224, top);
  context.lineTo(1224, pageHeight);
  context.closePath();
  context.fill();
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

function addCanvasPage(pdf: jsPDF, page: TemplatePage, firstPage: boolean) {
  if (!firstPage) pdf.addPage('letter', 'portrait');
  pdf.addImage(page.canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, 215.9, 279.4, undefined, 'FAST');
}

export async function createReportPdf(input: ReportInput) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter', compress: true });
  const pages: TemplatePage[] = [createPage(true)];
  let currentPage = pages[0];
  let y = contentTop;

  const nextPage = () => {
    currentPage = createPage(false);
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
    const title = '장교 진로 적합도 검사 결과';
    context.fillText(title, (pageWidth - context.measureText(title).width) / 2, y + 30);
    y += 92;
    context.font = `400 21px ${fontFamily}`;
    context.fillText(`이름: ${input.name},       진로 유형: ${input.primaryType}`, contentLeft, y);
    y += 74;
    context.font = `700 22px ${fontFamily}`;
    context.fillText('[세부 설명]', contentLeft, y);
    y += 42;
  }

  writeParagraph(
    '본 결과는 R.I.A.S.E.C.에 기초하여 개인의 흥미와 성향을 바탕으로 어떤 군 직무와 잘 맞는지 안내하는 참고 자료입니다.',
    `400 19px ${fontFamily}`,
    30,
    28,
  );
  writeParagraph(input.aptitudeDescription, `400 19px ${fontFamily}`, 30, 40);

  {
    const notice = '본 결과는 개인의 현재 흥미와 성향을 바탕으로 산출한 참고 자료입니다. 개인의 이력과 경험에 따라 다양한 진로 유형으로 확장하고 전환할 수 있음을 전제로 해석하는 것이 바람직합니다.';
    const { context } = currentPage;
    context.font = `400 17px ${fontFamily}`;
    const noticeLines = linesFor(context, notice, contentRight - contentLeft - 44);
    const boxHeight = noticeLines.length * 27 + 46;
    ensureSpace(boxHeight + 48);
    currentPage.context.font = `400 17px ${fontFamily}`;
    currentPage.context.strokeStyle = '#000000';
    currentPage.context.lineWidth = 1.5;
    currentPage.context.strokeRect(contentLeft, y - 24, contentRight - contentLeft, boxHeight);
    currentPage.context.fillStyle = '#000000';
    y = writeLines(currentPage.context, noticeLines, contentLeft + 22, y + 5, 27) + 42;
  }

  ensureSpace(80);
  {
    const { context } = currentPage;
    const heading = '진로 유형 설명';
    context.font = `700 29px ${fontFamily}`;
    const x = (pageWidth - context.measureText(heading).width) / 2;
    context.fillText(heading, x, y);
    context.lineWidth = 2;
    context.strokeStyle = '#000000';
    context.beginPath();
    context.moveTo(x, y + 8);
    context.lineTo(x + context.measureText(heading).width, y + 8);
    context.stroke();
    y += 58;
  }

  for (const [code, label, description] of typeSummaries) {
    const { context } = currentPage;
    const englishName = code === 'R' ? 'Realistic' : code === 'I' ? 'Investigative' : code === 'A' ? 'Artistic' : code === 'S' ? 'Social' : code === 'E' ? 'Enterprising' : 'Conventional';
    const heading = `${code} (${englishName}) : ${label}`;
    context.font = `400 18px ${fontFamily}`;
    const descriptionLines = linesFor(context, description, contentRight - contentLeft);
    ensureSpace(34 + descriptionLines.length * 28 + 42);
    currentPage.context.font = `700 20px ${fontFamily}`;
    currentPage.context.fillText(heading, contentLeft, y);
    y += 36;
    currentPage.context.font = `400 18px ${fontFamily}`;
    y = writeLines(currentPage.context, descriptionLines, contentLeft, y, 28) + 30;
  }

  pages.forEach((page, index) => addCanvasPage(pdf, page, index === 0));
  return pdf.output('blob');
}
