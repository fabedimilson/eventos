import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/security';
import { prisma } from '../prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }
    const role = req.user.role;
    if (role === 'SUPER_ADMIN' || role === 'ADMIN_MASTER') {
      return next();
    }
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Acesso negado: permissões insuficientes.' });
    }
    return next();
  };
}

export function requireCanCreateEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }
  const { role, category } = req.user;
  const isPrivilegedRole = role === 'SUPER_ADMIN' || role === 'ADMIN_MASTER' || role === 'ADMIN_UNIDADE';
  const isPrivilegedCategory = category === 'PROFESSOR' || category === 'TECNICO' || category === 'SERVIDOR' || category === 'PESQUISADOR';

  if (isPrivilegedRole || isPrivilegedCategory) {
    return next();
  }

  return res.status(403).json({
    error: 'Acesso restrito: Apenas servidores do IFAM (Professores e Técnicos) ou Administradores podem criar novos eventos.',
  });
}

export function requireEventOrganizerOrAdmin(type: 'event' | 'session' = 'event') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const { role, userId } = req.user;
    if (role === 'SUPER_ADMIN' || role === 'ADMIN_MASTER' || role === 'ADMIN_UNIDADE') {
      return next();
    }

    try {
      const id = req.params.eventId || req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'Identificador do evento/sessão não informado.' });
      }

      let organizerId: string | null = null;

      if (type === 'event') {
        const event = await prisma.event.findUnique({
          where: { id },
          select: { organizerId: true },
        });
        organizerId = event?.organizerId || null;
      } else {
        const session = await prisma.session.findUnique({
          where: { id },
          select: { event: { select: { organizerId: true } } },
        });
        organizerId = session?.event?.organizerId || null;
      }

      if (!organizerId) {
        return res.status(404).json({ error: 'Recurso não encontrado.' });
      }

      if (organizerId !== userId) {
        return res.status(403).json({
          error: 'Acesso negado: Você não possui permissão de organizador para este evento.',
        });
      }

      return next();
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao validar permissões de organizador.' });
    }
  };
}
