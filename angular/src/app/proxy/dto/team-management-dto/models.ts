
export interface ActivateStaffDto {
  staffId: string;
  reason: string;
  sendNotification: boolean;
  effectiveDate?: string;
  notes?: string;
}

export interface DeactivateStaffDto {
  staffId: string;
  reason: string;
  sendNotification: boolean;
  effectiveDate?: string;
  notes?: string;
}

export interface StaffListItemDto {
  userId?: string;
  recruiterProfileId?: string;
  fullName?: string;
  email?: string;
  isLead: boolean;
  status: boolean;
  companyId: number;
  companyName?: string;
}

export interface InviteStaffDto {
  email: string;
}

export interface StaffStatusChangeDto {
  staffId?: string;
  fullName?: string;
  email?: string;
  previousStatus: boolean;
  newStatus: boolean;
  action?: string;
  reason?: string;
  changeTimestamp?: string;
  performedBy?: string;
  message?: string;
}
