import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, TrendingUp } from "lucide-react";

const Results = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
  }, [quizId]);

  const fetchResults = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: quizData } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .eq("user_id", session.user.id)
      .single();

    const { data: questionsData } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("created_at");

    setQuiz(quizData);
    setQuestions(questionsData || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  const scorePercentage = (quiz.score / quiz.total_questions) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Score Card */}
        <Card className="mb-8 border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Trophy className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-4xl">Quiz Complete!</CardTitle>
            <CardDescription className="text-lg">Here's how you performed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">
                {quiz.score}/{quiz.total_questions}
              </div>
              <p className="text-xl text-muted-foreground">
                {scorePercentage.toFixed(0)}% Correct
              </p>
              <Progress value={scorePercentage} className="w-full max-w-md mx-auto mt-4" />
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">+{quiz.xp_earned}</p>
                <p className="text-sm text-muted-foreground">XP Earned</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-secondary/5 border border-secondary/20">
                <TrendingUp className="w-8 h-8 text-secondary mx-auto mb-2" />
                <p className="text-2xl font-bold">{quiz.difficulty.toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">Difficulty</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-success/5 border border-success/20">
                <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold">{quiz.score}</p>
                <p className="text-sm text-muted-foreground">Correct Answers</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                onClick={() => navigate("/quiz")} 
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Take Another Quiz
              </Button>
              <Button 
                onClick={() => navigate("/dashboard")} 
                variant="outline"
                className="flex-1"
              >
                View Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Questions Review */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Review Your Answers</h2>
          
          {questions.map((question, index) => (
            <Card key={question.id} className={`${question.is_correct ? 'border-success/20' : 'border-destructive/20'}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      Question {index + 1}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {question.question_text}
                    </CardDescription>
                  </div>
                  <div className="ml-4">
                    {question.is_correct ? (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Correct
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Incorrect
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Your Answer:</p>
                  <div className={`p-3 rounded-lg ${question.is_correct ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                    {Array.isArray(question.user_answer) 
                      ? question.user_answer.join(", ") 
                      : question.user_answer}
                  </div>
                </div>

                {!question.is_correct && (
                  <div>
                    <p className="text-sm font-medium mb-2">Correct Answer:</p>
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      {Array.isArray(question.correct_answer) 
                        ? question.correct_answer.join(", ") 
                        : question.correct_answer}
                    </div>
                  </div>
                )}

                {question.explanation && (
                  <div>
                    <p className="text-sm font-medium mb-2">Explanation:</p>
                    <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                      {question.explanation}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Badge variant="outline">{question.difficulty.toUpperCase()}</Badge>
                  <Badge variant="outline">{question.domain}</Badge>
                  <Badge variant="outline">+{question.xp_earned} XP</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Results;
