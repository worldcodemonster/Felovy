export type Role = 'DEVELOPER' | 'EMPLOYER' | 'OWNER';
export type UserStatus = 'ACTIVE' | 'MUTED' | 'BANNED';
export type JobStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';
export type LocationType = 'ONSITE' | 'HYBRID' | 'REMOTE';
export type SalaryType = 'HOURLY' | 'MONTHLY' | 'YEARLY';
export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED';

export interface User {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface Developer {
  id: string;
  userId: string;
  fullName?: string;
  title?: string;
  phone?: string;
  location?: string;
  country?: string;
  gender?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
  skills: string[];
  workExperience?: WorkExperience[];
  education?: Education[];
  languages: string[];
  photoUrl?: string;
  introVideoUrl?: string;
  introVideoType?: string;
  idCardUrl?: string;
  profileStep: number;
  isVerified: boolean;
  verifiedAt?: string;
  user?: Partial<User>;
}

export interface WorkExperience {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface Employer {
  id: string;
  userId: string;
  companyName?: string;
  companyWebsite?: string;
  companySummary?: string;
  companySize?: string;
  companyLocation?: string;
  country?: string;
  companyLinkedin?: string;
  contactName?: string;
  contactRole?: string;
  contactInfo?: string;
  companyLogoUrl?: string;
  companyBrandUrl?: string;
  companyAdImages: string[];
  contactPhotoUrl?: string;
  introVideoUrl?: string;
  idCardUrl?: string;
  profileStep: number;
  isVerified: boolean;
  user?: Partial<User>;
}

export interface Job {
  id: string;
  employerId: string;
  title: string;
  logoUrl?: string;
  companyLocation?: string;
  locationType: LocationType;
  salaryMin?: number;
  salaryMax?: number;
  salaryType?: SalaryType;
  currency?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  languages: string[];
  industry?: string;
  description?: string;
  status: JobStatus;
  isPinned: boolean;
  isEnabled: boolean;
  publishedAt?: string;
  createdAt: string;
  employer?: Partial<Employer>;
  _count?: { applications: number };
  favorites?: { id: string }[];
}

export interface Application {
  id: string;
  jobId: string;
  developerId: string;
  coverLetter?: string;
  appliedData: Partial<Developer>;
  status: ApplicationStatus;
  createdAt: string;
  job?: Partial<Job>;
  developer?: Partial<Developer>;
  conversation?: { id: string; isBlocked: boolean };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: Role;
  content: string;
  attachments: string[];
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  applicationId?: string;
  developerId?: string;
  employerId?: string;
  initiatorUserId?: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  application?: Partial<Application>;
  employer?: Partial<Employer>;
  developer?: Pick<Developer, 'id' | 'fullName' | 'title' | 'photoUrl'>;
  messages?: Message[];
}

export interface DeveloperSearchResult {
  id: string;
  fullName?: string;
  title?: string;
  photoUrl?: string;
  location?: string;
}
