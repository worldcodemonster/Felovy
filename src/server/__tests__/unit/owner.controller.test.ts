const prismaMock = {
  developer: { count: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  employer: { count: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  job: { count: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  user: { count: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
};

jest.mock('../../config/database', () => ({ prisma: prismaMock }));

import {
  getDashboardStats,
  listUsers,
  moderateUser,
  verifyDeveloper,
  verifyEmployer,
  listAllJobs,
  reviewJobOwner,
} from '../../controllers/owner.controller';

function mockRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function req(body: any = {}, query: any = {}, params: any = {}, user?: any): any {
  return { body, params, query, headers: {}, user };
}

// ─── getDashboardStats ────────────────────────────────────────────────────────

describe('getDashboardStats', () => {
  it('returns all stat fields', async () => {
    prismaMock.developer.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3);
    prismaMock.employer.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
    prismaMock.job.count.mockResolvedValueOnce(20).mockResolvedValueOnce(4);
    prismaMock.user.count.mockResolvedValueOnce(50).mockResolvedValueOnce(1);

    const res = mockRes();
    await getDashboardStats(req(), res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      developers: expect.any(Number),
      employers: expect.any(Number),
      activeJobs: expect.any(Number),
      pendingDevs: expect.any(Number),
      pendingEmps: expect.any(Number),
      pendingJobs: expect.any(Number),
      totalUsers: expect.any(Number),
      bannedUsers: expect.any(Number),
    }));
  });
});

// ─── listUsers ────────────────────────────────────────────────────────────────

describe('listUsers', () => {
  it('returns paginated users', async () => {
    const users = [
      { id: 'u1', email: 'a@test.com', role: 'DEVELOPER', status: 'ACTIVE', createdAt: new Date() },
    ];
    prismaMock.user.findMany.mockResolvedValue(users);
    prismaMock.user.count.mockResolvedValue(1);

    const res = mockRes();
    await listUsers(req({}, { page: '1', limit: '20' }), res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      users,
      total: 1,
      page: 1,
      limit: 20,
    }));
  });

  it('applies role filter', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    const res = mockRes();
    await listUsers(req({}, { role: 'EMPLOYER' }), res);

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { role: 'EMPLOYER' },
    }));
  });

  it('applies status filter', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    const res = mockRes();
    await listUsers(req({}, { status: 'BANNED' }), res);

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'BANNED' },
    }));
  });
});

// ─── moderateUser ─────────────────────────────────────────────────────────────

describe('moderateUser', () => {
  it('returns 404 when user not found by email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = mockRes();
    await moderateUser(req({ email: 'ghost@test.com', action: 'ban' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 404 when user not found by userId', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = mockRes();
    await moderateUser(req({ userId: 'nonexistent', action: 'ban' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when trying to moderate OWNER', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'o1', role: 'OWNER' });
    const res = mockRes();
    await moderateUser(req({ userId: 'o1', action: 'ban' }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Cannot moderate the owner' });
  });

  it('bans a developer', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', role: 'DEVELOPER' });
    prismaMock.user.update.mockResolvedValue({ id: 'u1', status: 'BANNED' });
    const res = mockRes();
    await moderateUser(req({ userId: 'u1', action: 'ban' }), res);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' }, data: { status: 'BANNED' },
    });
    expect(res.json).toHaveBeenCalledWith({ message: 'User banned' }); // messageMap['ban'] = 'banned'
  });

  it('mutes a user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u2', role: 'EMPLOYER' });
    prismaMock.user.update.mockResolvedValue({});
    const res = mockRes();
    await moderateUser(req({ userId: 'u2', action: 'mute' }), res);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u2' }, data: { status: 'MUTED' },
    });
  });

  it('unbans a user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u3', role: 'DEVELOPER' });
    prismaMock.user.update.mockResolvedValue({});
    const res = mockRes();
    await moderateUser(req({ userId: 'u3', action: 'unban' }), res);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u3' }, data: { status: 'ACTIVE' },
    });
  });
});

// ─── verifyDeveloper ──────────────────────────────────────────────────────────

describe('verifyDeveloper', () => {
  it('approves a developer', async () => {
    const updated = { id: 'd1', isVerified: true };
    prismaMock.developer.update.mockResolvedValue(updated);
    const res = mockRes();
    await verifyDeveloper(req({ developerId: 'd1', approved: true }), res);
    expect(prismaMock.developer.update).toHaveBeenCalledWith({
      where: { id: 'd1' },
      data: { isVerified: true, verifiedAt: expect.any(Date) },
    });
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('rejects (un-verifies) a developer', async () => {
    prismaMock.developer.update.mockResolvedValue({ id: 'd1', isVerified: false });
    const res = mockRes();
    await verifyDeveloper(req({ developerId: 'd1', approved: false }), res);
    expect(prismaMock.developer.update).toHaveBeenCalledWith({
      where: { id: 'd1' },
      data: { isVerified: false, verifiedAt: null },
    });
  });
});

// ─── verifyEmployer ───────────────────────────────────────────────────────────

describe('verifyEmployer', () => {
  it('approves an employer', async () => {
    const updated = { id: 'e1', isVerified: true };
    prismaMock.employer.update.mockResolvedValue(updated);
    const res = mockRes();
    await verifyEmployer(req({ employerId: 'e1', approved: true }), res);
    expect(prismaMock.employer.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { isVerified: true, verifiedAt: expect.any(Date) },
    });
    expect(res.json).toHaveBeenCalledWith(updated);
  });
});

// ─── listAllJobs ──────────────────────────────────────────────────────────────

describe('listAllJobs', () => {
  it('returns all jobs including any status', async () => {
    const jobs = [
      { id: 'j1', title: 'Dev', status: 'PENDING' },
      { id: 'j2', title: 'PM', status: 'APPROVED' },
    ];
    prismaMock.job.findMany.mockResolvedValue(jobs);
    prismaMock.job.count.mockResolvedValue(2);

    const res = mockRes();
    await listAllJobs(req({}, {}), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ jobs, total: 2 }));
  });

  it('filters by status', async () => {
    prismaMock.job.findMany.mockResolvedValue([]);
    prismaMock.job.count.mockResolvedValue(0);

    const res = mockRes();
    await listAllJobs(req({}, { status: 'PENDING' }), res);

    expect(prismaMock.job.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'PENDING' },
    }));
  });
});

// ─── reviewJobOwner ───────────────────────────────────────────────────────────

describe('reviewJobOwner', () => {
  it('approves a job and sets publishedAt', async () => {
    prismaMock.job.update.mockResolvedValue({ id: 'j1', status: 'APPROVED' });
    const res = mockRes();
    await reviewJobOwner(req({ status: 'APPROVED' }, {}, { id: 'j1' }), res);
    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: 'j1' },
      data: { status: 'APPROVED', publishedAt: expect.any(Date) },
    });
  });

  it('pins a job', async () => {
    prismaMock.job.update.mockResolvedValue({ id: 'j1', isPinned: true });
    const res = mockRes();
    await reviewJobOwner(req({ isPinned: true }, {}, { id: 'j1' }), res);
    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: 'j1' },
      data: { isPinned: true },
    });
  });

  it('disables a job', async () => {
    prismaMock.job.update.mockResolvedValue({ id: 'j1', isEnabled: false });
    const res = mockRes();
    await reviewJobOwner(req({ isEnabled: false }, {}, { id: 'j1' }), res);
    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: 'j1' },
      data: { isEnabled: false },
    });
  });
});
