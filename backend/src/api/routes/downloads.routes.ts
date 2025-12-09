import { Router } from 'express';
import { downloadsController } from '../controllers/downloads.controller';

const router = Router();

// GET /downloads/:filename - скачать файл
router.get('/:filename', downloadsController.downloadFile);

// GET /downloads/:filename/info - получить информацию о файле
router.get('/:filename/info', downloadsController.getFileInfo);

export { router as downloadsRouter };
