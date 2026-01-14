import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

export function imageTo(filePath?: string): string | null {
  if (!filePath) return null;

  // ตัวอย่าง link:
  // https://drive.google.com/file/d/15l-BnYvwybfKtWCzcgEH0YOreVo8e_iS/view?usp=sharing

  const match = filePath.match(/\/d\/([^/]+)/);
  if (!match) return null;

  const fileId = match[1];

  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

function loadFontBase64(): string {
  const fontPath = path.join(
    process.cwd(),
    'src/assets/fonts/NotoSansLao-VariableFont_wdth,wght.ttf',
  );

  const fontBuffer = fs.readFileSync(fontPath);
  return fontBuffer.toString('base64');
}

@Injectable()
export class AppService {
  parse(buffer: Buffer): any[] {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws, { defval: null });
  }

  async generatePdf(html: string): Promise<Uint8Array> {
    // const browser = await puppeteer.launch({
    //   args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // });
    const browser = await puppeteer.launch({
      // executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();
    return pdf;
  }

  async execute(file: Express.Multer.File): Promise<Uint8Array> {
    // 1. parse excel
    const rows = this.parse(file.buffer);

    // 2. map data
    const students = rows.map((s) => ({
      studentId: s['student_id'],
      fullName: s['full_name'],
      classRoom: s['class'],
      birthDate: `${s['date']}/${s['month']}/${s['year']}`,
      village: s['village'],
      district: s['district'],
      province: s['province'],
      email: s['Email'],
      facebook: s['Facebook'],
      motto: s['cautionary_tale'],
      dream: s['Hope_for_the_future'],
      photo: imageTo(s['image']),
      // photo: s['image'],
    }));

    // 3. render html
    const templatePath = path.join(
      process.cwd(),
      'src/templates/student-profile.html',
    );
    const fontPath = path.join(
      process.cwd(),
      'src/assets/fonts/NotoSansLao-Regular.ttf',
    );
    const fontBase64 = loadFontBase64();

    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(htmlTemplate);
    const html = template({
      students,
      FONT_BASE64: fontBase64,
    });

    // 5. html → pdf
    return this.generatePdf(html);
  }
}
// import { Injectable } from '@nestjs/common';
// import * as XLSX from 'xlsx';
// import puppeteer from 'puppeteer';
// import * as fs from 'fs';
// import * as path from 'path';
// import * as Handlebars from 'handlebars';

// export function imageToBase64(filePath?: string): string | null {
//   if (!filePath) return null;
//   if (!fs.existsSync(filePath)) return null;

//   const ext = filePath.split('.').pop();
//   const file = fs.readFileSync(filePath);
//   const text = `data:image/${ext};base64,${file.toString('base64')}`;
//   console.log(text,"text");
//   return text;
// }

// function loadFontBase64(): string {
//   const fontPath = path.join(
//     process.cwd(),
//     'src/assets/fonts/NotoSansLao-VariableFont_wdth,wght.ttf',
//   );

//   const fontBuffer = fs.readFileSync(fontPath);
//   return fontBuffer.toString('base64');
// }

// @Injectable()
// export class AppService {
//   parse(buffer: Buffer): any[] {
//     const wb = XLSX.read(buffer, { type: 'buffer' });
//     const ws = wb.Sheets[wb.SheetNames[0]];
//     return XLSX.utils.sheet_to_json(ws, { defval: null });
//   }

// async generatePdf(html: string): Promise<Uint8Array> {
//   // const browser = await puppeteer.launch({
//   //   args: ['--no-sandbox', '--disable-setuid-sandbox'],
//   // });
//   const browser = await puppeteer.launch({
//     // executablePath: '/usr/bin/chromium-browser',
//     args: [
//       '--no-sandbox',
//       '--disable-setuid-sandbox',
//       '--disable-dev-shm-usage',
//     ],
//   });

//   const page = await browser.newPage();
//   await page.setContent(html, { waitUntil: 'networkidle0' });

//   const pdf = await page.pdf({
//     format: 'A4',
//     printBackground: true,
//   });

//   await browser.close();
//   return pdf;
// }

//   async execute(file: Express.Multer.File) {
//     // 1. parse excel
//     const rows = this.parse(file.buffer);
//     console.log(rows.image,"rows[0]");
//     // 2. map data
//     const students = rows.map( (s) => ({
//       studentId: s['student_id'],
//       fullName: s['full_name'],
//       classRoom: s['class'],
//       birthDate: `${s['date']}/${s['month']}/${s['year']}`,
//       village: s['village'],
//       district: s['district'],
//       province: s['province'],
//       email: s['Email'],
//       facebook: s['Facebook'],
//       motto: s['cautionary_tale'],
//       dream: s['Hope_for_the_future'],
//       photo: imageToBase64(s['image']),
//     }));
//     // return students

//     // 3. render html
//     // const templatePath = path.join(
//     //   process.cwd(),
//     //   'src/templates/student-profile.html',
//     // );
//     // const fontPath = path.join(
//     //   process.cwd(),
//     //   'src/assets/fonts/NotoSansLao-Regular.ttf',
//     // );
//     // const fontBase64 = loadFontBase64();

//     // const htmlTemplate = fs.readFileSync(templatePath, 'utf8');
//     // const template = Handlebars.compile(htmlTemplate);
//     // const html = template({
//     //   students,
//     //   FONT_BASE64: fontBase64,
//     // });

//     // // 5. html → pdf
//     // return this.generatePdf(html);
//   }
// }
