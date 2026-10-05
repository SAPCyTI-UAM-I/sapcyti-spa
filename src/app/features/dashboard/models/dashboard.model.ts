export interface ActiveSurveySummary {
  id: number;
  term: string;
  opensAt: string;
  closesAt: string;
  status: string;
  totalResponses?: number;
}

export interface CoordinatorDashboardMetrics {
  totalStudents: number;
  totalProfessors: number;
  totalUeas: number;
  activeSurvey: ActiveSurveySummary | null;
  latestAnnualPlanYear?: number | null;
}

export interface StudentDashboardData {
  studentName: string;
  enrollmentId: string;
  programType: string;
  activeSurvey: {
    id: number;
    term: string;
    opensAt: string;
    closesAt: string;
    hasResponded: boolean;
    selectedUeasCount?: number;
  } | null;
}

export interface ProfessorDashboardData {
  professorName: string;
  email: string;
}
