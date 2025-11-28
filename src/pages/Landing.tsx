import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Cloud, Zap, Trophy, TrendingUp, Target, Award } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Cloud className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Learning</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Master AWS Certifications
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-100">
              Adaptive AI-generated quizzes that evolve with your learning. Track progress, earn XP, and conquer AWS certifications.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="text-lg px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
              >
                Start Learning Free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 border-primary/50 hover:bg-primary/10"
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Our Platform?</h2>
            <p className="text-xl text-muted-foreground">Built with cutting-edge AI to optimize your learning journey</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Zap,
                title: "AI-Generated Quizzes",
                description: "Dynamically created questions from official AWS training materials using advanced AI"
              },
              {
                icon: TrendingUp,
                title: "Adaptive Difficulty",
                description: "Questions automatically adjust to your skill level for optimal learning"
              },
              {
                icon: Target,
                title: "Weakness Analysis",
                description: "Identify and focus on your weak areas with intelligent domain tracking"
              },
              {
                icon: Trophy,
                title: "Gamification",
                description: "Earn XP, level up, and unlock achievements as you progress"
              },
              {
                icon: Award,
                title: "Progress Tracking",
                description: "Comprehensive analytics and visualizations of your learning journey"
              },
              {
                icon: Cloud,
                title: "Multiple Certifications",
                description: "Support for Cloud Practitioner, Solutions Architect, Developer, and DevOps"
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8 p-12 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 border border-primary/20">
            <h2 className="text-4xl font-bold">Ready to Start Your Journey?</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of learners mastering AWS certifications with AI-powered adaptive learning
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="text-lg px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
