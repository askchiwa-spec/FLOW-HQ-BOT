import { Router, Request, Response } from 'express';
import { PrismaClient, logger } from '@chatisha/shared';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Uploads directory — stored at project root /uploads
const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const dir = path.join(UPLOADS_DIR, tenantId || 'unknown');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOCX, DOC, TXT, XLSX, and XLS files are allowed'));
  },
});

async function extractText(filePath: string, ext: string): Promise<string> {
  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const buf = fs.readFileSync(filePath);
    const data = await pdfParse(buf);
    return data.text || '';
  }
  if (ext === '.docx' || ext === '.doc') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }
  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  if (ext === '.xlsx' || ext === '.xls') {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const lines: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (rows.length === 0) continue;
      const headers = rows[0].map((h: string) => String(h).trim());
      lines.push(`=== ${sheetName} ===`);
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        // Skip completely empty rows
        if (row.every((cell: string) => !String(cell).trim())) continue;
        const parts = headers
          .map((h, idx) => {
            const val = String(row[idx] ?? '').trim();
            return val ? `${h}: ${val}` : null;
          })
          .filter(Boolean);
        if (parts.length) lines.push(parts.join(' | '));
      }
    }
    return lines.join('\n');
  }
  return '';
}

function portalAuthMiddleware(req: Request, res: Response, next: Function) {
  const portalKey = req.headers['x-portal-key'];
  const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY;
  if (!PORTAL_INTERNAL_KEY || portalKey !== PORTAL_INTERNAL_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/**
 * POST /portal/documents/upload
 * Upload a PDF/DOCX/TXT file and extract its text
 */
router.post('/upload', portalAuthMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'x-tenant-id header required' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    let contentText = '';

    try {
      contentText = await extractText(req.file.path, ext);
    } catch (extractErr) {
      logger.warn({ tenantId, file: req.file.originalname }, 'Text extraction failed, storing without text');
    }

    const doc = await prisma.businessDocument.create({
      data: {
        tenant_id: tenantId,
        filename: req.file.originalname,
        file_type: ext.replace('.', ''),
        file_path: req.file.path,
        content_text: contentText || null,
      },
    });

    // Rebuild and store aggregated context on TenantConfig
    await rebuildBusinessContext(tenantId);

    res.status(201).json({ id: doc.id, filename: doc.filename, file_type: doc.file_type });
  } catch (error) {
    logger.error('Error uploading document:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * POST /portal/documents/url
 * Save a website URL as a knowledge source (text fetched server-side)
 */
router.post('/url', portalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'x-tenant-id header required' });

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    // Save URL reference — also update website_url on TenantConfig
    const doc = await prisma.businessDocument.create({
      data: {
        tenant_id: tenantId,
        filename: url,
        file_type: 'url',
        url,
        content_text: `Website: ${url}`,
      },
    });

    await prisma.tenantConfig.updateMany({
      where: { tenant_id: tenantId },
      data: { website_url: url },
    });

    await rebuildBusinessContext(tenantId);

    res.status(201).json({ id: doc.id, url: doc.url, file_type: 'url' });
  } catch (error) {
    logger.error('Error saving URL:', error);
    res.status(500).json({ error: 'Failed to save URL' });
  }
});

/**
 * GET /portal/documents
 * List all documents for a tenant
 */
router.get('/', portalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'x-tenant-id header required' });

    const docs = await prisma.businessDocument.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      select: { id: true, filename: true, file_type: true, url: true, created_at: true },
    });

    res.json(docs);
  } catch (error) {
    logger.error('Error listing documents:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

/**
 * POST /portal/documents/text
 * Save raw typed text directly as a knowledge source (no file upload needed)
 */
router.post('/text', portalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'x-tenant-id header required' });

    const { content, label } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'content is required' });

    const filename = label?.trim() || `Custom notes (${new Date().toLocaleDateString('en-GB')})`;

    const doc = await prisma.businessDocument.create({
      data: {
        tenant_id: tenantId,
        filename,
        file_type: 'text',
        content_text: content.trim(),
      },
    });

    await rebuildBusinessContext(tenantId);

    res.status(201).json({ id: doc.id, filename: doc.filename, file_type: 'text' });
  } catch (error) {
    logger.error('Error saving text knowledge:', error);
    res.status(500).json({ error: 'Failed to save text' });
  }
});

/**
 * DELETE /portal/documents/:id
 */
router.delete('/:id', portalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const doc = await prisma.businessDocument.findUnique({ where: { id: req.params.id } });

    if (!doc || doc.tenant_id !== tenantId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Remove file from disk
    if (doc.file_path && fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }

    await prisma.businessDocument.delete({ where: { id: req.params.id } });
    await rebuildBusinessContext(tenantId);

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

/**
 * Rebuilds the aggregated business_context on TenantConfig from all documents.
 * Called after any document is added or removed.
 */
async function rebuildBusinessContext(tenantId: string): Promise<void> {
  const docs = await prisma.businessDocument.findMany({
    where: { tenant_id: tenantId },
    select: { filename: true, content_text: true, file_type: true },
  });

  const parts = docs
    .filter((d: any) => d.content_text)
    .map((d: any) => `[Source: ${d.filename}]\n${d.content_text}`);

  const context = parts.join('\n\n---\n\n');

  await prisma.tenantConfig.updateMany({
    where: { tenant_id: tenantId },
    data: { business_context: context || null },
  });
}

export default router;
