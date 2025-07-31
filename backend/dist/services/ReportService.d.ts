import { IReport } from '@/types';
declare class ReportService {
    private reportsDir;
    constructor();
    /**
     * Generate comprehensive interview report
     */
    generateInterviewReport(interviewId: string): Promise<{
        report: IReport;
        pdfBuffer: Buffer;
        reportUrl: string;
    }>;
    /**
     * Generate performance analytics report
     */
    generatePerformanceReport(candidateId: string, params?: {
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        report: IReport;
        pdfBuffer: Buffer;
        reportUrl: string;
    }>;
    /**
     * Send report via email
     */
    sendReportByEmail(reportId: string, recipientEmail?: string): Promise<void>;
    /**
     * Get reports for candidate
     */
    getCandidateReports(candidateId: string, params?: {
        type?: string;
        limit?: number;
        skip?: number;
    }): Promise<{
        reports: IReport[];
        total: number;
    }>;
    /**
     * Delete report
     */
    deleteReport(reportId: string): Promise<void>;
    private calculateSummary;
    private generateReportSections;
    private generatePerformanceOverview;
    private generateQuestionAnalysis;
    private generateSkillsAssessment;
    private generateTimeAnalysis;
    private generateTimeDistribution;
    private generateRecommendations;
    private generateNextSteps;
    private calculatePerformanceMetrics;
    private generatePerformanceSections;
    private generateInterviewHistory;
    private generateSkillDevelopment;
    private generatePerformanceRecommendations;
    private generatePerformanceNextSteps;
    private generatePDF;
    private generatePerformancePDF;
}
declare const _default: ReportService;
export default _default;
