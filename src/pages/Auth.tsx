import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Cloud } from "lucide-react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [selectedCertification, setSelectedCertification] = useState("");
  const [certifications, setCertifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    apiClient.getSession().then(({ user }) => {
      if (user) {
        navigate("/dashboard");
      }
    });

    // Fetch certifications
    const fetchCertifications = async () => {
      try {
        const data = await apiClient.getCertifications();
        setCertifications(data);
      } catch (error) {
        console.error("Error fetching certifications:", error);
        // Use mock data if API fails (for development)
        const mockCertifications = [
          { id: "aws-sa-associate", name: "AWS Solutions Architect Associate", description: "Learn AWS architecture basics", level: "associate" },
          { id: "aws-dev-associate", name: "AWS Developer Associate", description: "Learn AWS development patterns", level: "associate" },
          { id: "aws-sysops-associate", name: "AWS SysOps Administrator Associate", description: "Learn AWS operations", level: "associate" },
          { id: "aws-sa-professional", name: "AWS Solutions Architect Professional", description: "Advanced AWS architecture", level: "professional" },
        ];
        setCertifications(mockCertifications);
      }
    };

    fetchCertifications();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields for signup
    if (isSignUp) {
      if (!email.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Email is required",
        });
        return;
      }
      if (!password.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Password is required",
        });
        return;
      }
      if (!username.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Username is required",
        });
        return;
      }
      if (!selectedCertification) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please select a certification",
        });
        return;
      }
    } else {
      // Validate required fields for signin
      if (!email.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Email is required",
        });
        return;
      }
      if (!password.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Password is required",
        });
        return;
      }
    }
    
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        await apiClient.signUp({
          email,
          password,
          username,
          selected_certification_id: selectedCertification,
        });

        toast({
          title: "Success!",
          description: "Account created successfully. Redirecting...",
        });

        navigate("/dashboard");
      } else {
        // Sign in
        await apiClient.signIn({
          email,
          password,
        });

        toast({
          title: "Welcome back!",
          description: "Signed in successfully.",
        });

        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Cloud className="w-8 h-8 text-primary" />
            <CardTitle className="text-3xl font-bold">AWS Quiz Master</CardTitle>
          </div>
          <CardDescription className="text-center">
            {isSignUp ? "Create your account to start learning" : "Welcome back! Sign in to continue"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter unique username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certification">Target Certification</Label>
                  <Select value={selectedCertification} onValueChange={setSelectedCertification} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select certification" />
                    </SelectTrigger>
                    <SelectContent>
                      {certifications.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading certifications...</div>
                      ) : (
                        certifications.map((cert) => (
                          <SelectItem key={cert.id} value={cert.id}>
                            {cert.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {certifications.length > 0 && certifications[0].description && (
                    <p className="text-xs text-muted-foreground">
                      {certifications.find(c => c.id === selectedCertification)?.description}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={loading}
            >
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
