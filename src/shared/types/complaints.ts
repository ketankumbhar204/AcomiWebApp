import type { MealType } from './meals';

export type ComplaintStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintCategory =
  | 'MAINTENANCE'
  | 'HOUSEKEEPING'
  | 'FOOD'
  | 'FOOD_QUALITY'
  | 'FOOD_SERVICE'
  | 'BILLING'
  | 'SAFETY'
  | 'SERVICE'
  | 'OTHER';

export type ComplaintTimelineEventType =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'COMMENTED'
  | 'INTERNAL_NOTE'
  | 'ATTACHMENT_ADDED'
  | 'ASSIGNED'
  | 'PRIORITY_CHANGED'
  | 'REOPENED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type ComplaintTimelineEvent = {
  eventId: string;
  eventType: ComplaintTimelineEventType;
  performedAt: string;
  remarks?: string | null;
  performedBy?: string | null;
};

export type ComplaintComment = {
  commentId: string;
  authorMemberId?: string | null;
  authorName?: string | null;
  authorUserId: string;
  body: string;
  internal: boolean;
  createdAt: string;
};

export type ComplaintAttachment = {
  attachmentId: string;
  storageUrl: string;
  contentType?: string | null;
  fileName?: string | null;
  createdByUserId: string;
  createdAt: string;
};

export type ComplaintResponse = {
  complaintId: string;
  spaceId: string;
  createdByMemberId: string;
  createdByMemberName?: string | null;
  createdByUserId: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  title: string;
  description: string;
  assignedToMembershipId?: string | null;
  assignedToName?: string | null;
  resolutionSummary?: string | null;
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  reopenedAt?: string | null;
  closedAt?: string | null;
  cancelledAt?: string | null;
  mealDate?: string | null;
  mealType?: MealType | null;
  createdAt: string;
  updatedAt: string;
  canReopen: boolean;
  comments?: ComplaintComment[] | null;
  attachments?: ComplaintAttachment[] | null;
  timeline?: ComplaintTimelineEvent[] | null;
};

export type ComplaintListResponse = {
  totalCount: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  complaints: ComplaintResponse[];
};

export type ListComplaintsParams = {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  category?: ComplaintCategory;
  assigneeMembershipId?: string;
  mine?: boolean;
};

export type CreateComplaintRequest = {
  category: ComplaintCategory;
  priority: ComplaintPriority;
  title: string;
  description: string;
  mealDate?: string;
  mealType?: MealType;
  attachmentImagesBase64?: string[];
};

export type UpdateComplaintStatusRequest = {
  status: ComplaintStatus;
  note?: string;
};

export type AddComplaintCommentRequest = {
  body: string;
  internal?: boolean;
};

export type AddComplaintAttachmentRequest = {
  imageBase64: string;
  fileName?: string;
  contentType?: string;
};

export type AssignComplaintRequest = {
  assigneeMembershipId?: string | null;
};

export type UpdateComplaintResolutionRequest = {
  resolutionSummary: string;
  markResolved?: boolean;
};

export type ReopenComplaintRequest = {
  reason?: string;
};
