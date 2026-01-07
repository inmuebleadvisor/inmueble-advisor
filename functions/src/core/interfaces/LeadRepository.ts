export interface LeadRepository {
    getLeadsByUserId(uid: string): Promise<any[]>;
}
