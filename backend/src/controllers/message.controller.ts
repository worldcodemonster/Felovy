import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

// ─── Start or get a conversation (employer initiates via application) ─────────

export const startConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  const employer = await prisma.employer.findUnique({ where: { userId: req.user!.userId } });
  if (!employer) { res.status(404).json({ message: 'Employer not found' }); return; }

  const application = await prisma.application.findUnique({ where: { id: req.params.applicationId } });
  if (!application) { res.status(404).json({ message: 'Application not found' }); return; }

  const job = await prisma.job.findUnique({ where: { id: application.jobId } });
  if (!job || job.employerId !== employer.id) { res.status(403).json({ message: 'Forbidden' }); return; }

  const existing = await prisma.conversation.findUnique({ where: { applicationId: application.id } });
  if (existing) { res.json(existing); return; }

  const conversation = await prisma.conversation.create({
    data: { applicationId: application.id, employerId: employer.id },
  });
  res.status(201).json(conversation);
};

// ─── Start or get a direct DM (employer or owner → developer) ────────────────

export const startDirectConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  const { developerId } = req.params;
  const userId = req.user!.userId;
  const role   = req.user!.role;

  const developer = await prisma.developer.findUnique({ where: { id: developerId } });
  if (!developer) { res.status(404).json({ message: 'Developer not found' }); return; }

  if (role === 'EMPLOYER') {
    const employer = await prisma.employer.findUnique({ where: { userId } });
    if (!employer) { res.status(404).json({ message: 'Employer not found' }); return; }

    const existing = await prisma.conversation.findFirst({
      where: { developerId, employerId: employer.id, applicationId: null },
    });
    if (existing) { res.json(existing); return; }

    const conversation = await prisma.conversation.create({
      data: { developerId, employerId: employer.id },
    });
    res.status(201).json(conversation);
  } else {
    // OWNER
    const existing = await prisma.conversation.findFirst({
      where: { developerId, initiatorUserId: userId, applicationId: null },
    });
    if (existing) { res.json(existing); return; }

    const conversation = await prisma.conversation.create({
      data: { developerId, initiatorUserId: userId },
    });
    res.status(201).json(conversation);
  }
};

// ─── Get messages in a conversation ──────────────────────────────────────────

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.conversationId },
    include: {
      application: { select: { developerId: true, job: { select: { employerId: true } } } },
    },
  });
  if (!conversation) { res.status(404).json({ message: 'Conversation not found' }); return; }

  const userId = req.user!.userId;
  const devUser = await prisma.developer.findUnique({ where: { userId } });
  const empUser = await prisma.employer.findUnique({ where: { userId } });

  const isDev = devUser
    ? (devUser.id === conversation.application?.developerId || devUser.id === conversation.developerId)
    : false;
  const isEmp = empUser
    ? (empUser.id === conversation.application?.job?.employerId || empUser.id === conversation.employerId)
    : false;
  const isOwnerParticipant = req.user!.role === 'OWNER' && conversation.initiatorUserId === userId;

  if (!isDev && !isEmp && !isOwnerParticipant && req.user!.role !== 'OWNER') {
    res.status(403).json({ message: 'Forbidden' }); return;
  }
  if (conversation.isBlocked && isDev) {
    res.status(403).json({ message: 'Conversation is blocked' }); return;
  }

  const { page = '1', limit = '50' } = req.query;
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });

  if (isDev) {
    await prisma.message.updateMany({
      where: { conversationId: conversation.id, senderRole: { in: ['EMPLOYER', 'OWNER'] }, isRead: false },
      data: { isRead: true },
    });
  } else if (isEmp || isOwnerParticipant) {
    await prisma.message.updateMany({
      where: { conversationId: conversation.id, senderRole: 'DEVELOPER', isRead: false },
      data: { isRead: true },
    });
  }

  res.json(messages);
};

// ─── Send a message ───────────────────────────────────────────────────────────

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.conversationId },
    include: { application: { select: { developerId: true, job: { select: { employerId: true } } } } },
  });
  if (!conversation) { res.status(404).json({ message: 'Conversation not found' }); return; }
  if (conversation.isBlocked) { res.status(403).json({ message: 'Conversation is blocked' }); return; }

  const userId = req.user!.userId;
  const role   = req.user!.role;
  const devUser = await prisma.developer.findUnique({ where: { userId } });
  const empUser = await prisma.employer.findUnique({ where: { userId } });

  const isDev = devUser
    ? (devUser.id === conversation.application?.developerId || devUser.id === conversation.developerId)
    : false;
  const isEmp = empUser
    ? (empUser.id === conversation.application?.job?.employerId || empUser.id === conversation.employerId)
    : false;
  const isOwnerParticipant = role === 'OWNER' && conversation.initiatorUserId === userId;

  if (!isDev && !isEmp && !isOwnerParticipant) {
    res.status(403).json({ message: 'Forbidden' }); return;
  }

  const senderId   = isDev ? devUser!.id : isOwnerParticipant ? userId : empUser!.id;
  const senderRole = isDev ? 'DEVELOPER' : isOwnerParticipant ? 'OWNER' : 'EMPLOYER';

  const { content } = req.body;
  const message = await prisma.message.create({
    data: { conversationId: conversation.id, senderId, senderRole: senderRole as any, content },
  });

  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  res.status(201).json(message);
};

// ─── Toggle conversation block (employer) ─────────────────────────────────────

export const toggleBlock = async (req: AuthRequest, res: Response): Promise<void> => {
  const employer = await prisma.employer.findUnique({ where: { userId: req.user!.userId } });
  const conversation = await prisma.conversation.findUnique({ where: { id: req.params.conversationId } });
  if (!conversation || conversation.employerId !== employer?.id) {
    res.status(403).json({ message: 'Forbidden' }); return;
  }
  const updated = await prisma.conversation.update({
    where: { id: conversation.id },
    data: { isBlocked: !conversation.isBlocked },
  });
  res.json({ isBlocked: updated.isBlocked });
};

// ─── Get my conversations ─────────────────────────────────────────────────────

export const getMyConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const role   = req.user!.role;

  let conversations;

  if (role === 'DEVELOPER') {
    const dev = await prisma.developer.findUnique({ where: { userId } });
    conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { application: { developerId: dev!.id } },
          { developerId: dev!.id },
        ],
      },
      include: {
        application: { select: { jobId: true, status: true, job: { select: { title: true } } } },
        employer: { select: { companyName: true, companyLogoUrl: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  } else if (role === 'EMPLOYER') {
    const emp = await prisma.employer.findUnique({ where: { userId } });
    conversations = await prisma.conversation.findMany({
      where: { employerId: emp!.id },
      include: {
        application: {
          select: {
            status: true,
            developer: { select: { fullName: true, photoUrl: true, title: true } },
            job: { select: { title: true } },
          },
        },
        developer: { select: { fullName: true, photoUrl: true, title: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  } else {
    // OWNER: their direct DMs
    conversations = await prisma.conversation.findMany({
      where: { initiatorUserId: userId },
      include: {
        developer: { select: { fullName: true, photoUrl: true, title: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  res.json(conversations);
};
