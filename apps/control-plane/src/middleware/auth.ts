import { Request, Response, NextFunction } from 'express';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  
  if (req.session?.authenticated) {
    return next();
  }
  
  const providedPassword = req.query.password || req.body?.password;
  
  if (providedPassword === ADMIN_PASSWORD) {
    return next();
  }
  
  if (auth && auth.startsWith('Basic ')) {
    const base64Credentials = auth.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [, password] = credentials.split(':');
    
    if (password === ADMIN_PASSWORD) {
      return next();
    }
  }
  
  res.status(401).json({ error: 'Unauthorized' });
}

declare global {
  namespace Express {
    interface Request {
      session?: {
        authenticated?: boolean;
      };
    }
  }
}
