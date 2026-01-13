import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type Response } from 'express';
import { AppService } from './app.service';
// import { ImportExcelToPdfUseCase } from './application/import-excel-to-pdf.usecase';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!file) throw new BadRequestException('xlsx file is required');

    const pdfBuffer = await this.appService.execute(file);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=students.pdf');
    res.end(pdfBuffer);
  }
}
