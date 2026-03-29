import { supabase } from './supabase';

// Types for Audit Logging
export type AuditAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'VIEW'
    | 'LOGIN'
    | 'LOGOUT'
    | 'EXPORT'
    | 'APPROVE'
    | 'REJECT'
    | 'STATUS_CHANGE'
    | 'GATE_PASS_ISSUED'
    | 'GATE_PASS_SCANNED';

export type AuditResourceType =
    | 'lead'
    | 'vehicle'
    | 'customer'
    | 'service_job'
    | 'invoice'
    | 'quotation'
    | 'gate_pass'
    | 'user'
    | 'organization'
    | 'settings';

export interface AuditLogEntry {
    action: AuditAction;
    resourceType: AuditResourceType;
    resourceId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
}

/**
 * AuditLogger - Centralized audit logging service for Phase 1 Trust & Control
 * 
 * Every critical action in the system is logged with:
 * - Who (user_id)
 * - What (action, resource_type, resource_id)
 * - When (created_at - auto)
 * - Where (ip_address, user_agent)
 * - Changes (old_values, new_values)
 */
class AuditLoggerService {
    private userId: string | null = null;
    private orgId: string | null = null;

    /**
     * Initialize the logger with the current user context
     */
    setContext(userId: string | null, orgId: string | null) {
        this.userId = userId;
        this.orgId = orgId;
    }

    /**
     * Log an audit event to the database
     */
    async log(entry: AuditLogEntry): Promise<void> {
        try {
            // Get client info
            const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'server';

            const { error } = await supabase.from('audit_logs').insert({
                user_id: this.userId,
                org_id: this.orgId,
                action: entry.action,
                resource_type: entry.resourceType,
                resource_id: entry.resourceId || null,
                old_values: entry.oldValues || null,
                new_values: entry.newValues || null,
                user_agent: userAgent,
                ip_address: null // IP is typically captured server-side
            });

            if (error) {
                console.error('Failed to write audit log:', error);
            }
        } catch (err) {
            console.error('AuditLogger error:', err);
        }
    }

    // Convenience methods for common actions
    async logCreate(resourceType: AuditResourceType, resourceId: string, newValues: Record<string, any>) {
        return this.log({
            action: 'CREATE',
            resourceType,
            resourceId,
            newValues
        });
    }

    async logUpdate(
        resourceType: AuditResourceType,
        resourceId: string,
        oldValues: Record<string, any>,
        newValues: Record<string, any>
    ) {
        return this.log({
            action: 'UPDATE',
            resourceType,
            resourceId,
            oldValues,
            newValues
        });
    }

    async logDelete(resourceType: AuditResourceType, resourceId: string, oldValues: Record<string, any>) {
        return this.log({
            action: 'DELETE',
            resourceType,
            resourceId,
            oldValues
        });
    }

    async logStatusChange(
        resourceType: AuditResourceType,
        resourceId: string,
        oldStatus: string,
        newStatus: string
    ) {
        return this.log({
            action: 'STATUS_CHANGE',
            resourceType,
            resourceId,
            oldValues: { status: oldStatus },
            newValues: { status: newStatus }
        });
    }

    async logLogin(userId: string) {
        this.userId = userId;
        return this.log({
            action: 'LOGIN',
            resourceType: 'user',
            resourceId: userId
        });
    }

    async logLogout(userId: string) {
        return this.log({
            action: 'LOGOUT',
            resourceType: 'user',
            resourceId: userId
        });
    }

    async logGatePassIssued(vehicleId: string, passCode: string, passType: 'test_drive' | 'delivery') {
        return this.log({
            action: 'GATE_PASS_ISSUED',
            resourceType: 'gate_pass',
            resourceId: passCode,
            newValues: { vehicleId, passType }
        });
    }

    async logGatePassScanned(passCode: string, action: 'exit' | 'return') {
        return this.log({
            action: 'GATE_PASS_SCANNED',
            resourceType: 'gate_pass',
            resourceId: passCode,
            newValues: { scanAction: action, scannedAt: new Date().toISOString() }
        });
    }
}

// Singleton instance
export const AuditLogger = new AuditLoggerService();
