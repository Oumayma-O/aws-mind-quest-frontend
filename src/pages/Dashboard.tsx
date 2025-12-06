import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Trophy, Target, TrendingUp, Zap, Award } from "lucide-react";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [certification, setCertification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { user } = await apiClient.getSession();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const profileData = await apiClient.getProfile();
      
      // Try to get progress, handle 404 for new users (cold start)
      let progressData = null;
      try {
        progressData = await apiClient.getDashboardProgress();
      } catch (progressError: any) {
        // If 404, it's a new user with no progress yet - this is normal
        if (progressError?.status === 404) {
          console.log("No progress found - new user, showing empty state");
          progressData = null;
        } else {
          // Re-throw other errors
          throw progressError;
        }
      }
      
      // Get quizzes only if certification is selected
      const quizzesData = profileData.selected_certification_id
        ? await apiClient.getUserQuizzes(profileData.selected_certification_id, 5)
        : [];
      
      // Get certification details if selected
      let certificationData = null;
      if (profileData.selected_certification_id) {
        try {
          certificationData = await apiClient.getCertificationById(profileData.selected_certification_id);
        } catch (error) {
          console.log("Could not fetch certification details");
        }
      }

      setProfile(profileData);
      setProgress(progressData);
      setRecentQuizzes(quizzesData);
      setCertification(certificationData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    try {
      await apiClient.signOut();
    } finally {
      navigate("/");
    }
  };

  const startQuiz = () => {
    navigate("/quiz");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const levelProgress = ((profile?.xp % 100) / 100) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">AWS Quiz Master</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {profile?.username}!</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level & XP</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Level {profile?.level}</div>
              <Progress value={levelProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">{profile?.xp} XP</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <Target className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progress?.average_accuracy ? progress.average_accuracy.toFixed(1) : '0'}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {progress?.correct_answers || 0}/{progress?.total_questions_answered || 0} correct
              </p>
            </CardContent>
          </Card>

          <Card className="border-success/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.current_streak || 0} days</div>
              <p className="text-xs text-muted-foreground mt-2">Keep it going!</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress?.total_quizzes || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {progress?.total_questions_answered || 0} questions answered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Current Certification */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Current Certification</CardTitle>
                <CardDescription>
                  {certification?.description || "Select a certification to get started"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {certification ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-primary">{certification.name}</h3>
                      <Badge variant="outline" className="mt-2">
                        {progress?.current_difficulty?.toUpperCase() || "EASY"} Difficulty
                      </Badge>
                    </div>
                    <Button 
                      size="lg" 
                      onClick={startQuiz}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Start Quiz
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No certification selected</p>
                    <Button onClick={() => navigate("/profile")}>
                      Select Certification
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Quizzes */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                {recentQuizzes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No quizzes yet. Start your first quiz to begin learning!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="font-medium">
                            Score: {quiz.score}/{quiz.total_questions}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(quiz.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            +{quiz.xp_earned} XP
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {quiz.difficulty.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Weak Domains */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weak Areas</CardTitle>
                <CardDescription>Focus on these topics</CardDescription>
              </CardHeader>
              <CardContent>
                {progress?.weak_domains && Array.isArray(progress.weak_domains) && progress.weak_domains.length > 0 ? (
                  <div className="space-y-3">
                    {progress.weak_domains.slice(0, 5).map((domain: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{domain.name}</span>
                          <span className="text-muted-foreground">{domain.accuracy}%</span>
                        </div>
                        <Progress value={domain.accuracy} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Complete more quizzes to see your weak areas
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username</span>
                  <span className="font-medium">{profile?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-medium">
                    {new Date(profile?.created_at).toLocaleDateString()}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate("/profile")}
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
