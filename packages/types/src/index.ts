export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_MASTER = 'ADMIN_MASTER',
  ADMIN_UNIDADE = 'ADMIN_UNIDADE',
  ADMIN = 'ADMIN',
  ORGANIZADOR = 'ORGANIZADOR',
  PARTICIPANTE = 'PARTICIPANTE',
  USUARIO = 'USUARIO',
}

export enum InstitutionalCategory {
  ALUNO = 'ALUNO',
  PROFESSOR = 'PROFESSOR',
  TECNICO = 'TECNICO',
  SERVIDOR = 'SERVIDOR',
  PESQUISADOR = 'PESQUISADOR',
  EXTERNO = 'EXTERNO',
}

export enum EventVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum RSVPStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
}

export enum CheckInMethod {
  QR_CODE_SCAN = 'QR_CODE_SCAN',
  MANUAL_OVERRIDE = 'MANUAL_OVERRIDE',
}

export enum CertificateStatus {
  ISSUED = 'ISSUED',
  REVOKED = 'REVOKED',
}

export enum CertificateType {
  EVENT_GLOBAL = 'EVENT_GLOBAL',
  PER_SESSION = 'PER_SESSION',
  BOTH = 'BOTH',
}

export enum CheckInStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PREMATURE_EXIT = 'PREMATURE_EXIT',
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  cpf?: string | null;
  role: UserRole;
  category: InstitutionalCategory;
  matriculaOrSiape?: string | null;
  campus?: string | null;
  avatarUrl?: string | null;
  pronoun?: string | null;
  bio?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  lattesUrl?: string | null;
  interests?: string | null;
  isInvisibleInNetworking: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  user: UserProfile;
}

export interface EventSponsor {
  id: string;
  eventId: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string | null;
  tier: string;
  order: number;
}

export interface EventItem {
  id: string;
  organizerId: string;
  title: string;
  slug: string;
  description: string;
  locationName?: string | null;
  locationAddress?: string | null;
  location?: string;
  visibility: EventVisibility;
  isPublished: boolean;
  startDate: string;
  endDate: string;
  capacity?: number | null;
  bannerUrl?: string | null;
  thumbnailUrl?: string | null;
  category?: string;
  campus?: string;
  modality?: string;
  certificateType?: CertificateType;
  attendanceTrackingMode?: string;
  dailyWorkloadHours?: number;
  requireDailyCheckOut?: boolean;
  minAttendanceRate?: number;
  primaryColor: string;
  secondaryColor: string;
  themeMode: 'light' | 'dark' | 'auto';
  customCssConfig?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  sessions?: SessionItem[];
  sponsors?: EventSponsor[];
  _count?: {
    registrations: number;
    sessions: number;
  };
  currentRegistrations?: number;
  remainingSeats?: number | null;
  organizer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SessionItem {
  id: string;
  eventId: string;
  title: string;
  description?: string | null;
  speakerName: string;
  speakerBio?: string | null;
  speakerAvatar?: string | null;
  room?: string | null;
  capacity?: number | null;
  startTime: string;
  endTime: string;
  workloadHours: number;
  youtubeLiveUrl?: string | null;
  isLiveActive: boolean;
  requireDoubleCheckIn?: boolean;
  recordingUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  hasUserCheckedIn?: boolean;
  userCheckIn?: CheckInRecord | null;
}

export interface RegistrationItem {
  id: string;
  eventId: string;
  userId: string;
  code: string;
  reminderSentAt?: string | null;
  attendanceConfirmed: boolean;
  createdAt: string;
  event?: EventItem;
  user?: UserProfile;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  eventId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface CheckInRecord {
  id: string;
  sessionId: string;
  userId: string;
  method: CheckInMethod;
  status?: CheckInStatus;
  checkInAt?: string;
  checkOutAt?: string | null;
  durationMinutes?: number | null;
  scannedAt: string;
  session?: SessionItem;
}

export interface InvitationRSVPItem {
  id: string;
  eventId: string;
  userId?: string | null;
  guestEmail: string;
  guestName: string;
  status: RSVPStatus;
  token: string;
  lastNotifiedAt?: string | null;
  followupCount: number;
  confirmedAt?: string | null;
  declinedAt?: string | null;
  createdAt: string;
}

export interface CertificateItem {
  id: string;
  eventId: string;
  userId: string;
  sessionId?: string | null;
  validationCode: string;
  sha256Hash: string;
  totalHoursAwarded: number;
  pdfUrl?: string | null;
  status: CertificateStatus;
  issuedAt: string;
  event?: EventItem;
  session?: SessionItem;
  user?: UserProfile;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  sentAt: string;
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    category: InstitutionalCategory;
  };
}

export interface ChatRoomItem {
  id: string;
  eventId?: string | null;
  otherParticipant: UserProfile;
  lastMessage?: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export interface EventAnalytics {
  totalRegistered: number;
  categoryBreakdown: Record<InstitutionalCategory, number>;
  rsvpMetrics: {
    totalInvited: number;
    confirmed: number;
    declined: number;
    pending: number;
  };
  sessionCheckIns: Array<{
    sessionId: string;
    title: string;
    speakerName: string;
    checkInsCount: number;
    attendanceRate: number;
  }>;
  timelineAttendance: Array<{
    timeSlot: string;
    count: number;
  }>;
}
