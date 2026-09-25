// Audit Service Interfaces and Log Entry Contracts

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  category: string;
  details: string;
  status: 'VERIFIED' | 'FAILED' | 'BLOCKED';
}

export interface IAuditService {
  logEvent(actor: string, role: string, action: string, category: string, details: string): AuditLogEntry;
  getAuditLogs(filter?: any): Promise<AuditLogEntry[]>;
}
