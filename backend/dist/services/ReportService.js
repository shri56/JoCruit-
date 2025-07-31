"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const models_1 = require("@/models");
const logger_1 = __importDefault(require("@/utils/logger"));
const EmailService_1 = __importDefault(require("./EmailService"));
class ReportService {
    constructor() {
        this.reportsDir = path_1.default.join(process.cwd(), 'uploads', 'reports');
        if (!fs_1.default.existsSync(this.reportsDir)) {
            fs_1.default.mkdirSync(this.reportsDir, { recursive: true });
        }
    }
    /**
     * Generate comprehensive interview report
     */
    async generateInterviewReport(interviewId) {
        try {
            const interview = await models_1.Interview.findById(interviewId).populate('candidateId');
            if (!interview) {
                throw new Error('Interview not found');
            }
            const candidate = interview.candidateId;
            // Calculate summary statistics
            const summary = this.calculateSummary(interview);
            // Generate report sections
            const sections = await this.generateReportSections(interview);
            // Generate recommendations and next steps
            const recommendations = this.generateRecommendations(interview, summary);
            const nextSteps = this.generateNextSteps(interview, summary);
            // Create report record
            const report = new models_1.Report({
                interviewId,
                candidateId: interview.candidateId,
                recruiterId: interview.recruiterId,
                type: 'interview',
                title: `Interview Report - ${interview.position}`,
                data: {
                    summary,
                    sections,
                    recommendations,
                    nextSteps
                },
                generatedAt: new Date()
            });
            // Generate PDF
            const pdfBuffer = await this.generatePDF(report, interview, candidate);
            // Save PDF file
            const fileName = `report_${interviewId}_${Date.now()}.pdf`;
            const filePath = path_1.default.join(this.reportsDir, fileName);
            fs_1.default.writeFileSync(filePath, pdfBuffer);
            const reportUrl = `/uploads/reports/${fileName}`;
            report.fileUrl = reportUrl;
            await report.save();
            // Update interview report status
            interview.reportGenerated = true;
            interview.reportUrl = reportUrl;
            await interview.save();
            logger_1.default.info('Interview report generated', {
                interviewId,
                candidateId: interview.candidateId,
                reportId: report._id,
                fileSize: pdfBuffer.length
            });
            return {
                report,
                pdfBuffer,
                reportUrl
            };
        }
        catch (error) {
            logger_1.default.error('Error generating interview report:', error);
            throw new Error('Failed to generate interview report');
        }
    }
    /**
     * Generate performance analytics report
     */
    async generatePerformanceReport(candidateId, params = {}) {
        try {
            const { startDate, endDate } = params;
            const query = { candidateId, status: 'completed' };
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate)
                    query.createdAt.$gte = startDate;
                if (endDate)
                    query.createdAt.$lte = endDate;
            }
            const interviews = await models_1.Interview.find(query).sort({ createdAt: -1 });
            const candidate = await models_1.User.findById(candidateId);
            if (!candidate) {
                throw new Error('Candidate not found');
            }
            // Calculate performance metrics
            const performanceData = this.calculatePerformanceMetrics(interviews);
            // Generate sections
            const sections = this.generatePerformanceSections(performanceData, interviews);
            // Generate insights and recommendations
            const recommendations = this.generatePerformanceRecommendations(performanceData);
            const nextSteps = this.generatePerformanceNextSteps(performanceData);
            // Create report
            const report = new models_1.Report({
                candidateId,
                type: 'performance',
                title: `Performance Report - ${candidate.firstName} ${candidate.lastName}`,
                data: {
                    summary: {
                        totalQuestions: performanceData.totalQuestions,
                        correctAnswers: performanceData.totalCorrect,
                        averageScore: performanceData.averageScore,
                        totalTime: performanceData.totalTime
                    },
                    sections,
                    recommendations,
                    nextSteps
                },
                generatedAt: new Date()
            });
            // Generate PDF
            const pdfBuffer = await this.generatePerformancePDF(report, performanceData, candidate);
            // Save PDF
            const fileName = `performance_${candidateId}_${Date.now()}.pdf`;
            const filePath = path_1.default.join(this.reportsDir, fileName);
            fs_1.default.writeFileSync(filePath, pdfBuffer);
            const reportUrl = `/uploads/reports/${fileName}`;
            report.fileUrl = reportUrl;
            await report.save();
            logger_1.default.info('Performance report generated', {
                candidateId,
                reportId: report._id,
                interviewCount: interviews.length
            });
            return {
                report,
                pdfBuffer,
                reportUrl
            };
        }
        catch (error) {
            logger_1.default.error('Error generating performance report:', error);
            throw new Error('Failed to generate performance report');
        }
    }
    /**
     * Send report via email
     */
    async sendReportByEmail(reportId, recipientEmail) {
        try {
            const report = await models_1.Report.findById(reportId).populate('candidateId');
            if (!report) {
                throw new Error('Report not found');
            }
            const candidate = report.candidateId;
            const email = recipientEmail || candidate.email;
            // Read PDF file
            let pdfBuffer;
            if (report.fileUrl) {
                const filePath = path_1.default.join(process.cwd(), 'uploads', 'reports', path_1.default.basename(report.fileUrl));
                if (fs_1.default.existsSync(filePath)) {
                    pdfBuffer = fs_1.default.readFileSync(filePath);
                }
            }
            // Send email with report
            await EmailService_1.default.sendInterviewCompleted({
                userEmail: email,
                userName: candidate.firstName,
                interviewTitle: report.title,
                position: 'Various Positions', // Default for performance reports
                score: report.data.summary.averageScore,
                reportUrl: report.fileUrl,
                reportBuffer: pdfBuffer
            });
            logger_1.default.info('Report sent by email', {
                reportId,
                recipientEmail: email,
                reportType: report.type
            });
        }
        catch (error) {
            logger_1.default.error('Error sending report by email:', error);
            throw new Error('Failed to send report by email');
        }
    }
    /**
     * Get reports for candidate
     */
    async getCandidateReports(candidateId, params = {}) {
        try {
            const { type, limit = 10, skip = 0 } = params;
            const query = { candidateId };
            if (type)
                query.type = type;
            const total = await models_1.Report.countDocuments(query);
            const reports = await models_1.Report.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip);
            return { reports, total };
        }
        catch (error) {
            logger_1.default.error('Error getting candidate reports:', error);
            throw new Error('Failed to get candidate reports');
        }
    }
    /**
     * Delete report
     */
    async deleteReport(reportId) {
        try {
            const report = await models_1.Report.findById(reportId);
            if (!report) {
                throw new Error('Report not found');
            }
            // Delete PDF file if exists
            if (report.fileUrl) {
                const filePath = path_1.default.join(process.cwd(), 'uploads', 'reports', path_1.default.basename(report.fileUrl));
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
            await models_1.Report.findByIdAndDelete(reportId);
            logger_1.default.info('Report deleted', { reportId });
        }
        catch (error) {
            logger_1.default.error('Error deleting report:', error);
            throw new Error('Failed to delete report');
        }
    }
    // Private helper methods
    calculateSummary(interview) {
        const responses = interview.responses || [];
        const questions = interview.questions || [];
        const totalQuestions = questions.length;
        const answeredQuestions = responses.length;
        const scoredResponses = responses.filter(r => r.score !== undefined);
        const totalScore = scoredResponses.reduce((sum, r) => sum + (r.score || 0), 0);
        const averageScore = scoredResponses.length > 0 ? Math.round(totalScore / scoredResponses.length) : 0;
        const totalTime = responses.reduce((sum, r) => sum + r.timeTaken, 0);
        const correctAnswers = scoredResponses.filter(r => (r.score || 0) >= 70).length;
        return {
            totalQuestions,
            correctAnswers,
            averageScore,
            totalTime,
            completionRate: Math.round((answeredQuestions / totalQuestions) * 100),
            averageTimePerQuestion: answeredQuestions > 0 ? Math.round(totalTime / answeredQuestions) : 0
        };
    }
    async generateReportSections(interview) {
        const sections = [];
        // Performance Overview
        sections.push({
            title: 'Performance Overview',
            content: this.generatePerformanceOverview(interview),
            score: interview.overallScore
        });
        // Question-by-Question Analysis
        sections.push({
            title: 'Question Analysis',
            content: this.generateQuestionAnalysis(interview)
        });
        // Skills Assessment
        sections.push({
            title: 'Skills Assessment',
            content: this.generateSkillsAssessment(interview)
        });
        // Time Management
        sections.push({
            title: 'Time Management',
            content: this.generateTimeAnalysis(interview)
        });
        return sections;
    }
    generatePerformanceOverview(interview) {
        const aiAnalysis = interview.aiAnalysis;
        if (!aiAnalysis) {
            return 'Performance analysis not available.';
        }
        return `
    Overall Performance: ${aiAnalysis.overall}%
    
    Key Metrics:
    • Communication: ${aiAnalysis.communication}%
    • Technical Skills: ${aiAnalysis.technical}%
    • Problem Solving: ${aiAnalysis.problemSolving}%
    • Confidence: ${aiAnalysis.confidence}%
    
    Strengths Demonstrated:
    ${aiAnalysis.strengths?.map(s => `• ${s}`).join('\n') || 'None identified'}
    
    Areas for Improvement:
    ${aiAnalysis.improvements?.map(i => `• ${i}`).join('\n') || 'None identified'}
    `;
    }
    generateQuestionAnalysis(interview) {
        const responses = interview.responses || [];
        const questions = interview.questions || [];
        if (responses.length === 0) {
            return 'No responses available for analysis.';
        }
        let analysis = 'Question-by-Question Performance:\n\n';
        responses.forEach((response, index) => {
            const question = questions[index];
            if (question) {
                analysis += `Question ${index + 1}: ${question.question}\n`;
                analysis += `Score: ${response.score || 'Not scored'}%\n`;
                analysis += `Time Taken: ${Math.round(response.timeTaken)} seconds\n`;
                if (response.aiEvaluation?.feedback) {
                    analysis += `Feedback: ${response.aiEvaluation.feedback}\n`;
                }
                analysis += '\n';
            }
        });
        return analysis;
    }
    generateSkillsAssessment(interview) {
        const responses = interview.responses || [];
        const questions = interview.questions || [];
        // Group by category
        const categoryScores = {};
        responses.forEach((response, index) => {
            const question = questions[index];
            if (question && response.score !== undefined) {
                const category = question.category || 'General';
                if (!categoryScores[category]) {
                    categoryScores[category] = [];
                }
                categoryScores[category].push(response.score);
            }
        });
        let assessment = 'Skills Assessment by Category:\n\n';
        Object.entries(categoryScores).forEach(([category, scores]) => {
            const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
            assessment += `${category}: ${avgScore}% (${scores.length} questions)\n`;
        });
        return assessment;
    }
    generateTimeAnalysis(interview) {
        const responses = interview.responses || [];
        if (responses.length === 0) {
            return 'No timing data available.';
        }
        const totalTime = responses.reduce((sum, r) => sum + r.timeTaken, 0);
        const averageTime = Math.round(totalTime / responses.length);
        const fastestResponse = Math.min(...responses.map(r => r.timeTaken));
        const slowestResponse = Math.max(...responses.map(r => r.timeTaken));
        return `
    Time Management Analysis:
    
    • Total Interview Time: ${Math.round(totalTime / 60)} minutes ${totalTime % 60} seconds
    • Average Time per Question: ${averageTime} seconds
    • Fastest Response: ${fastestResponse} seconds
    • Slowest Response: ${slowestResponse} seconds
    
    Time Distribution:
    ${this.generateTimeDistribution(responses)}
    `;
    }
    generateTimeDistribution(responses) {
        const timeRanges = {
            'Under 30s': 0,
            '30s - 1m': 0,
            '1m - 2m': 0,
            'Over 2m': 0
        };
        responses.forEach(response => {
            const time = response.timeTaken;
            if (time < 30)
                timeRanges['Under 30s']++;
            else if (time < 60)
                timeRanges['30s - 1m']++;
            else if (time < 120)
                timeRanges['1m - 2m']++;
            else
                timeRanges['Over 2m']++;
        });
        return Object.entries(timeRanges)
            .map(([range, count]) => `• ${range}: ${count} questions`)
            .join('\n');
    }
    generateRecommendations(interview, summary) {
        const recommendations = [];
        const aiAnalysis = interview.aiAnalysis;
        // Score-based recommendations
        if (summary.averageScore < 60) {
            recommendations.push('Focus on strengthening fundamental concepts');
            recommendations.push('Practice more interview questions in weak areas');
        }
        else if (summary.averageScore < 80) {
            recommendations.push('Good foundation - work on advanced concepts');
            recommendations.push('Practice explaining solutions more clearly');
        }
        else {
            recommendations.push('Excellent performance - maintain current level');
            recommendations.push('Consider mentoring others or taking leadership roles');
        }
        // Time-based recommendations
        if (summary.averageTimePerQuestion > 180) {
            recommendations.push('Work on time management and quick decision making');
        }
        else if (summary.averageTimePerQuestion < 30) {
            recommendations.push('Take more time to think through answers thoroughly');
        }
        // AI-based recommendations
        if (aiAnalysis?.improvements) {
            recommendations.push(...aiAnalysis.improvements.slice(0, 3));
        }
        return recommendations;
    }
    generateNextSteps(interview, summary) {
        const nextSteps = [];
        if (summary.averageScore >= 80) {
            nextSteps.push('Apply for senior-level positions');
            nextSteps.push('Prepare for technical leadership interviews');
        }
        else if (summary.averageScore >= 60) {
            nextSteps.push('Apply for mid-level positions');
            nextSteps.push('Continue practicing interview skills');
        }
        else {
            nextSteps.push('Focus on skill development before applying');
            nextSteps.push('Take online courses in weak areas');
        }
        nextSteps.push('Schedule follow-up practice sessions');
        nextSteps.push('Review and implement feedback provided');
        return nextSteps;
    }
    calculatePerformanceMetrics(interviews) {
        if (interviews.length === 0) {
            return {
                totalInterviews: 0,
                totalQuestions: 0,
                totalCorrect: 0,
                averageScore: 0,
                totalTime: 0,
                improvement: 0
            };
        }
        const totalQuestions = interviews.reduce((sum, i) => sum + (i.questions?.length || 0), 0);
        const totalCorrect = interviews.reduce((sum, i) => {
            const responses = i.responses || [];
            return sum + responses.filter(r => (r.score || 0) >= 70).length;
        }, 0);
        const scores = interviews.map(i => i.overallScore || 0).filter(s => s > 0);
        const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 0;
        const totalTime = interviews.reduce((sum, i) => {
            const responses = i.responses || [];
            return sum + responses.reduce((timeSum, r) => timeSum + r.timeTaken, 0);
        }, 0);
        // Calculate improvement (first vs last interview)
        let improvement = 0;
        if (interviews.length >= 2) {
            const firstScore = interviews[interviews.length - 1].overallScore || 0;
            const lastScore = interviews[0].overallScore || 0;
            improvement = lastScore - firstScore;
        }
        return {
            totalInterviews: interviews.length,
            totalQuestions,
            totalCorrect,
            averageScore,
            totalTime,
            improvement
        };
    }
    generatePerformanceSections(performanceData, interviews) {
        return [
            {
                title: 'Performance Summary',
                content: `
        Total Interviews: ${performanceData.totalInterviews}
        Average Score: ${performanceData.averageScore}%
        Total Questions Answered: ${performanceData.totalQuestions}
        Correct Answers: ${performanceData.totalCorrect}
        Accuracy Rate: ${performanceData.totalQuestions > 0 ? Math.round((performanceData.totalCorrect / performanceData.totalQuestions) * 100) : 0}%
        Performance Trend: ${performanceData.improvement >= 0 ? 'Improving' : 'Declining'} (${performanceData.improvement >= 0 ? '+' : ''}${performanceData.improvement}%)
        `,
                score: performanceData.averageScore
            },
            {
                title: 'Interview History',
                content: this.generateInterviewHistory(interviews)
            },
            {
                title: 'Skill Development',
                content: this.generateSkillDevelopment(interviews)
            }
        ];
    }
    generateInterviewHistory(interviews) {
        if (interviews.length === 0) {
            return 'No interviews completed yet.';
        }
        let history = 'Recent Interview Performance:\n\n';
        interviews.slice(0, 5).forEach((interview, index) => {
            history += `${index + 1}. ${interview.title} (${interview.position})\n`;
            history += `   Score: ${interview.overallScore || 'Not scored'}%\n`;
            history += `   Date: ${interview.completedAt?.toLocaleDateString() || 'N/A'}\n`;
            history += `   Duration: ${Math.round((interview.duration || 0) / 60)} minutes\n\n`;
        });
        return history;
    }
    generateSkillDevelopment(interviews) {
        // Track skill progression over time
        const skillProgression = {};
        interviews.reverse().forEach(interview => {
            const aiAnalysis = interview.aiAnalysis;
            if (aiAnalysis) {
                skillProgression['Communication'] = skillProgression['Communication'] || [];
                skillProgression['Technical'] = skillProgression['Technical'] || [];
                skillProgression['Problem Solving'] = skillProgression['Problem Solving'] || [];
                skillProgression['Confidence'] = skillProgression['Confidence'] || [];
                skillProgression['Communication'].push(aiAnalysis.communication);
                skillProgression['Technical'].push(aiAnalysis.technical);
                skillProgression['Problem Solving'].push(aiAnalysis.problemSolving);
                skillProgression['Confidence'].push(aiAnalysis.confidence);
            }
        });
        let development = 'Skill Development Over Time:\n\n';
        Object.entries(skillProgression).forEach(([skill, scores]) => {
            if (scores.length > 0) {
                const trend = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;
                const average = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
                development += `${skill}: ${average}% average `;
                development += `(${trend >= 0 ? '+' : ''}${trend}% trend)\n`;
            }
        });
        return development;
    }
    generatePerformanceRecommendations(performanceData) {
        const recommendations = [];
        if (performanceData.averageScore < 60) {
            recommendations.push('Focus on fundamental skill building');
            recommendations.push('Take structured learning courses');
            recommendations.push('Practice basic interview questions daily');
        }
        else if (performanceData.averageScore < 80) {
            recommendations.push('Work on advanced problem-solving techniques');
            recommendations.push('Practice system design questions');
            recommendations.push('Improve communication clarity');
        }
        else {
            recommendations.push('Maintain current performance level');
            recommendations.push('Focus on leadership and soft skills');
            recommendations.push('Prepare for senior-level interviews');
        }
        if (performanceData.improvement < 0) {
            recommendations.push('Review recent performance decline');
            recommendations.push('Consider additional practice sessions');
        }
        return recommendations;
    }
    generatePerformanceNextSteps(performanceData) {
        const nextSteps = [];
        nextSteps.push('Set specific improvement goals');
        nextSteps.push('Schedule regular practice sessions');
        if (performanceData.averageScore >= 75) {
            nextSteps.push('Start applying to target companies');
            nextSteps.push('Prepare for company-specific interviews');
        }
        else {
            nextSteps.push('Continue skill development');
            nextSteps.push('Focus on weak areas identified in reports');
        }
        nextSteps.push('Track progress with monthly assessments');
        return nextSteps;
    }
    async generatePDF(report, interview, candidate) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({ margin: 50 });
                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                // Header
                doc.fontSize(24).text('AI Interview Report', { align: 'center' });
                doc.moveDown();
                // Candidate Info
                doc.fontSize(16).text('Candidate Information', { underline: true });
                doc.fontSize(12)
                    .text(`Name: ${candidate.firstName} ${candidate.lastName}`)
                    .text(`Email: ${candidate.email}`)
                    .text(`Position: ${interview.position}`)
                    .text(`Interview Date: ${interview.completedAt?.toLocaleDateString() || 'N/A'}`)
                    .moveDown();
                // Summary
                doc.fontSize(16).text('Performance Summary', { underline: true });
                const summary = report.data.summary;
                doc.fontSize(12)
                    .text(`Overall Score: ${summary.averageScore}%`)
                    .text(`Questions Answered: ${summary.correctAnswers}/${summary.totalQuestions}`)
                    .text(`Total Time: ${Math.round(summary.totalTime / 60)} minutes`)
                    .moveDown();
                // Sections
                report.data.sections.forEach(section => {
                    doc.fontSize(16).text(section.title, { underline: true });
                    doc.fontSize(12).text(section.content).moveDown();
                });
                // Recommendations
                if (report.data.recommendations.length > 0) {
                    doc.fontSize(16).text('Recommendations', { underline: true });
                    report.data.recommendations.forEach((rec, index) => {
                        doc.fontSize(12).text(`${index + 1}. ${rec}`);
                    });
                    doc.moveDown();
                }
                // Next Steps
                if (report.data.nextSteps.length > 0) {
                    doc.fontSize(16).text('Next Steps', { underline: true });
                    report.data.nextSteps.forEach((step, index) => {
                        doc.fontSize(12).text(`${index + 1}. ${step}`);
                    });
                }
                // Footer
                doc.fontSize(10)
                    .text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' })
                    .text('AI Interview Bot - Confidential Report', { align: 'center' });
                doc.end();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async generatePerformancePDF(report, performanceData, candidate) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({ margin: 50 });
                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                // Header
                doc.fontSize(24).text('Performance Analytics Report', { align: 'center' });
                doc.moveDown();
                // Candidate Info
                doc.fontSize(16).text('Candidate Information', { underline: true });
                doc.fontSize(12)
                    .text(`Name: ${candidate.firstName} ${candidate.lastName}`)
                    .text(`Email: ${candidate.email}`)
                    .text(`Report Period: ${report.createdAt.toLocaleDateString()}`)
                    .moveDown();
                // Performance Metrics
                doc.fontSize(16).text('Performance Metrics', { underline: true });
                doc.fontSize(12)
                    .text(`Total Interviews: ${performanceData.totalInterviews}`)
                    .text(`Average Score: ${performanceData.averageScore}%`)
                    .text(`Performance Trend: ${performanceData.improvement >= 0 ? 'Improving' : 'Declining'} (${performanceData.improvement >= 0 ? '+' : ''}${performanceData.improvement}%)`)
                    .moveDown();
                // Sections
                report.data.sections.forEach(section => {
                    doc.fontSize(16).text(section.title, { underline: true });
                    doc.fontSize(12).text(section.content).moveDown();
                });
                // Recommendations and Next Steps
                if (report.data.recommendations.length > 0) {
                    doc.fontSize(16).text('Recommendations', { underline: true });
                    report.data.recommendations.forEach((rec, index) => {
                        doc.fontSize(12).text(`${index + 1}. ${rec}`);
                    });
                    doc.moveDown();
                }
                if (report.data.nextSteps.length > 0) {
                    doc.fontSize(16).text('Next Steps', { underline: true });
                    report.data.nextSteps.forEach((step, index) => {
                        doc.fontSize(12).text(`${index + 1}. ${step}`);
                    });
                }
                doc.end();
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.default = new ReportService();
//# sourceMappingURL=ReportService.js.map