import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'citizen' | 'moderator' | 'admin';
export type ReportStatus = 'active' | 'flagged' | 'removed';
export type VoteType = 'up' | 'down';
export type SeverityLevel = 'low' | 'medium' | 'high';
export type ModerationAction = 'flag' | 'remove' | 'suspend' | 'restore';
export type ModerationTargetType = 'report' | 'comment' | 'user';

export interface User {
  uid: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  suspended: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface AIAnalysis {
  summary: string;
  severity: SeverityLevel;
  categories: string[];
  confidence: number;
}

export interface Report {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  crimeType: string;
  location: Location;
  mediaUrls: string[];
  aiAnalysis?: AIAnalysis;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  status: ReportStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateReportInput {
  title: string;
  description: string;
  crimeType: string;
  location: Location;
  mediaFiles?: File[];
}

export interface Vote {
  id: string;
  reportId: string;
  userId: string;
  voteType: VoteType;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  reportId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ModerationLog {
  id: string;
  moderatorId: string;
  action: ModerationAction;
  targetType: ModerationTargetType;
  targetId: string;
  reason?: string;
  createdAt: Timestamp;
}

export interface FilterOptions {
  crimeType?: string;
  startDate?: Date;
  endDate?: Date;
  status?: ReportStatus;
}

export interface CrimeAnalysis {
  summary: string;
  severity: SeverityLevel;
  categories: string[];
  confidence: number;
  imageAnalysis?: string[];
}
