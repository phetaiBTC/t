import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

export function imageToBase64(filePath?: string): string | null {
  if (!filePath) return null;
  if (!fs.existsSync(filePath)) return null;

  const ext = filePath.split('.').pop();
  const file = fs.readFileSync(filePath);
  return `data:image/${ext};base64,${file.toString('base64')}`;
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
      studentId: s['ລະຫັດນັກສຶກສາ'],
      fullName: s['ຊື່ ແລະ ນາມສະກຸນ'],
      classRoom: s['ຫ້ອງທີ່ຮຽນ'],
      birthDate: `${s['ວັນທີ']}/${s['ເດືອນ']}/${s['ປີ']}`,
      village: s['ບ້ານເກີດ'],
      district: s['ເມືອງ'],
      province: s['ແຂວງ'],
      email: s['Email'],
      facebook: s['Facebook'],
      motto: s['ຄະຕິເຕືອນໃຈ'],
      dream: s['ຄວາມມຸ້ງຫວັງໃນອະນາຄົດ'],
      photo: imageToBase64(s['ຮູບພາບ']),
    }));

    // 3. render html
    const templatePath = path.join(
      process.cwd(),
      'src/templates/student-profile.html',
    );

    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(htmlTemplate);
    const html = template({ students });

    // 4. html → pdf
    return this.generatePdf(html);
  }
}
