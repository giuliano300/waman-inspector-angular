export interface Inspector { id: number; name: string; lastName: string; email: string; code?: string; inspectorCodeId?: number; }
export interface Worker { id: number; detailId: number; jobTypeId: number; name: string; lastName: string; mobile: string; idCardNumber: string; jobType: string; timesheet: boolean; foundAtWork: boolean; otherIssues: string; signature?: string; }
export type InspectionStatus = 'pending' | 'closed';
export interface Inspection {
  id: number; date: string; time: string; location: string; address: string; city: string;
  representative: string; jobTitle: string; status: InspectionStatus; inspectorComments: string;
  entityComments: string; representativePresent: boolean; confirmation: boolean;
  sendToAdministration: boolean; absenceComment: string; representativeSignature?: string; reportAvailable?: boolean; workers: Worker[];
}
export interface Notice { id: number; date: string; title: string; description: string; }
export interface ArchiveResult { items: Inspection[]; total: number; page: number; pageSize: number; }
