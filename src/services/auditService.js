// CampusConnect Academic & Biometric Audit Trail Service
// Generates immutable logs for authentication, biometric verification, and session events.

class AuditService {
  getDB() {
    return window.masterDB ? window.masterDB.db : { auditLogs: [] };
  }

  saveDB(db) {
    if (window.masterDB && window.masterDB.saveDatabase) {
      window.masterDB.saveDatabase(db);
    }
  }

  logEvent(actor, role, action, category, details) {
    const db = this.getDB();
    if (!db.auditLogs) db.auditLogs = [];

    const now = new Date();
    const newLog = {
      id: `audit-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: now.toISOString().replace('T', ' ').slice(0, 19),
      actor: actor || 'System',
      role: role || 'Student',
      action,
      category: category || 'Attendance',
      details,
      status: 'VERIFIED'
    };

    db.auditLogs.unshift(newLog);

    // Keep log buffer bounded
    if (db.auditLogs.length > 500) {
      db.auditLogs = db.auditLogs.slice(0, 500);
    }

    this.saveDB(db);
    return newLog;
  }

  async getAuditLogs(filter = {}) {
    const db = this.getDB();
    let logs = db.auditLogs || [];

    if (filter.category) {
      logs = logs.filter(l => l.category === filter.category);
    }

    if (filter.action) {
      logs = logs.filter(l => l.action === filter.action);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      logs = logs.filter(l => 
        l.actor.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
      );
    }

    return logs;
  }
}

const auditService = new AuditService();
window.auditService = auditService;
