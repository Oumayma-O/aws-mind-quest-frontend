/**
 * API Client Service
 * Replaces Supabase with FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Auth Types
export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

export interface SignUpPayload {
  email: string;
  password: string;
  username: string;
  selected_certification_id: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

// User Types
export interface Profile {
  id: string;
  email: string;
  username: string;
  xp: number;
  level: number;
  selected_certification_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  certification_id: string;
  quizzes_completed: number;
  questions_answered: number;
  correct_answers: number;
  current_streak: number;
  best_streak: number;
  created_at: string;
  updated_at: string;
}

// Quiz Types
export interface Quiz {
  id: string;
  user_id: string;
  certification_id: string;
  title: string;
  description: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  user_answer: string;
  explanation: string;
}

export interface Certification {
  id: string;
  name: string;
  description: string;
  level: string;
  created_at: string;
}

// Error Handler
class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

// API Client
class APIClient {
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  private loadToken(): void {
    this.token = localStorage.getItem("auth_token");
  }

  private saveToken(token: string): void {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  private clearToken(): void {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    } else {
      console.warn(`API Request to ${endpoint} without auth token`);
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // If 401, redirect to login
      if (response.status === 401) {
        this.clearToken();
        window.location.href = "/auth";
      }
      
      throw new APIError(response.status, errorData.detail || "API Error", errorData);
    }

    return response.json();
  }

  // Auth Methods
  async signUp(payload: SignUpPayload): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      "POST",
      "/auth/register",
      payload
    );
    this.saveToken(response.access_token);
    return response;
  }

  async signIn(payload: SignInPayload): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      "POST",
      "/auth/login",
      payload
    );
    this.saveToken(response.access_token);
    return response;
  }

  async signOut(): Promise<void> {
    try {
      await this.request("POST", "/auth/logout");
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<Profile> {
    return this.request<Profile>("GET", "/auth/me");
  }

  // Profile Methods
  async getProfile(): Promise<Profile> {
    return this.request<Profile>("GET", "/profile");
  }

  async updateProfile(data: Partial<Profile>): Promise<Profile> {
    return this.request<Profile>("PUT", "/profile", data);
  }

  // Certification Methods
  async getCertifications(): Promise<Certification[]> {
    return this.request<Certification[]>("GET", "/certifications");
  }

  async getCertificationById(id: string): Promise<Certification> {
    return this.request<Certification>("GET", `/certifications/${id}`);
  }

  // Progress Methods
  async getDashboardProgress(): Promise<UserProgress> {
    return this.request<UserProgress>("GET", "/progress/dashboard");
  }

  async getCertificationProgress(certificationId: string): Promise<UserProgress> {
    return this.request<UserProgress>(
      "GET",
      `/progress/certifications/${certificationId}`
    );
  }

  async getAllCertificationProgress(): Promise<UserProgress[]> {
    return this.request<UserProgress[]>("GET", "/progress/certifications");
  }

  async getAchievements(): Promise<any[]> {
    return this.request<any[]>("GET", "/progress/achievements");
  }

  // Quiz Methods
  async generateQuiz(
    certificationId: string,
    difficulty: "easy" | "medium" | "hard",
    weakDomains?: string[]
  ): Promise<{
    quiz_id: string;
    certification_id: string;
    difficulty: string;
    total_questions: number;
    questions: Question[];
  }> {
    return this.request<{
      quiz_id: string;
      certification_id: string;
      difficulty: string;
      total_questions: number;
      questions: Question[];
    }>(
      "POST",
      "/quizzes/generate",
      {
        certification_id: certificationId,
        difficulty,
        weak_domains: weakDomains,
      }
    );
  }

  async getQuiz(quizId: string): Promise<Quiz> {
    return this.request<Quiz>("GET", `/quizzes/${quizId}`);
  }

  async getUserQuizzes(
    certificationId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Quiz[]> {
    const params = new URLSearchParams();
    if (certificationId) params.append("certification_id", certificationId);
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());
    
    return this.request<Quiz[]>("GET", `/quizzes?${params.toString()}`);
  }

  async evaluateQuiz(
    quizId: string,
    answers: Record<string, string | string[]>
  ): Promise<Quiz> {
    console.log("API: Evaluating quiz");
    console.log("API: Quiz ID:", quizId);
    console.log("API: Answers:", answers);
    
    const payload = {
      quiz_id: quizId,
      answers,
    };
    console.log("API: Request payload:", JSON.stringify(payload, null, 2));
    
    return this.request<Quiz>("POST", `/quizzes/${quizId}/evaluate`, payload);
  }

  // Question Methods
  async getQuestion(questionId: string): Promise<Question> {
    return this.request<Question>("GET", `/questions/${questionId}`);
  }

  async getSession(): Promise<{ user: Profile | null }> {
    // Reload token from localStorage in case it was set in another tab/window
    this.loadToken();
    
    if (!this.token) {
      return { user: null };
    }
    try {
      const user = await this.getCurrentUser();
      return { user };
    } catch {
      this.clearToken();
      return { user: null };
    }
  }
}

export const apiClient = new APIClient();
