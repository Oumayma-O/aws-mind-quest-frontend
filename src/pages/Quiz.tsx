import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

const Quiz = () => {
  const [profile, setProfile] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    generateQuiz();
  }, []);

  const generateQuiz = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Fetch profile and progress
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*, certifications(*)")
      .eq("id", session.user.id)
      .single();

    const { data: progressData } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("certification_id", profileData?.selected_certification_id)
      .maybeSingle();

    setProfile(profileData);
    setProgress(progressData);

    // Call edge function to generate quiz
    const { data: quizData, error } = await supabase.functions.invoke("generate-quiz", {
      body: {
        userId: session.user.id,
        certificationId: profileData?.selected_certification_id,
        difficulty: progressData?.current_difficulty || "easy",
        weakDomains: progressData?.weak_domains || [],
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
      });
      navigate("/dashboard");
      return;
    }

    setQuiz(quizData.quiz);
    setQuestions(quizData.questions);
    setLoading(false);
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    // Call edge function to evaluate answers
    const { data, error } = await supabase.functions.invoke("evaluate-quiz", {
      body: {
        quizId: quiz.id,
        answers,
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
      });
      setSubmitting(false);
      return;
    }

    navigate(`/results/${quiz.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Generating your personalized quiz...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center flex-1">
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <Progress value={progressPercentage} className="w-48 mx-auto mt-2" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{profile?.certifications?.name}</p>
            <p className="text-xs text-muted-foreground">{quiz?.difficulty?.toUpperCase()}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-2xl">{currentQuestion.question_text}</CardTitle>
            </div>
            <CardDescription>
              {currentQuestion.question_type === "multi_select" && "Select all that apply"}
              {currentQuestion.domain && (
                <span className="ml-2 text-primary">• {currentQuestion.domain}</span>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {currentQuestion.question_type === "multiple_choice" && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.question_type === "multi_select" && (
              <div className="space-y-2">
                {currentQuestion.options.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                    <Checkbox
                      id={`option-${index}`}
                      checked={answers[currentQuestion.id]?.includes(option) || false}
                      onCheckedChange={(checked) => {
                        const currentAnswers = answers[currentQuestion.id] || [];
                        if (checked) {
                          handleAnswerChange(currentQuestion.id, [...currentAnswers, option]);
                        } else {
                          handleAnswerChange(currentQuestion.id, currentAnswers.filter((a: string) => a !== option));
                        }
                      }}
                    />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {currentQuestion.question_type === "true_false" && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {["True", "False"].map((option) => (
                  <div key={option} className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || Object.keys(answers).length < questions.length}
                  className="bg-success hover:bg-success/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Quiz"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Quiz;
