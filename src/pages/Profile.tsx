import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trophy, Award, Target } from "lucide-react";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*, certifications(*)")
      .eq("id", session.user.id)
      .single();

    const { data: certsData } = await supabase
      .from("certifications")
      .select("*")
      .order("name");

    const { data: achievementsData } = await supabase
      .from("achievements")
      .select("*")
      .eq("user_id", session.user.id)
      .order("earned_at", { ascending: false });

    setProfile(profileData);
    setCertifications(certsData || []);
    setAchievements(achievementsData || []);
    setLoading(false);
  };

  const handleCertificationChange = async (certificationId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ selected_certification_id: certificationId })
      .eq("id", profile.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update certification",
      });
      return;
    }

    // Create progress record if doesn't exist
    await supabase
      .from("user_progress")
      .upsert({
        user_id: profile.id,
        certification_id: certificationId,
      });

    toast({
      title: "Success",
      description: "Certification updated successfully",
    });

    fetchProfileData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

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
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-3xl">{profile.username}</CardTitle>
                <CardDescription>Member since {new Date(profile.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">Level {profile.level}</p>
                    <p className="text-muted-foreground">{profile.xp} XP</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Current Certification</label>
                  <Select
                    value={profile.selected_certification_id}
                    onValueChange={handleCertificationChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {certifications.map((cert) => (
                        <SelectItem key={cert.id} value={cert.id}>
                          {cert.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-2">
                    {profile.certifications?.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <Target className="w-6 h-6 text-primary mb-2" />
                    <p className="text-2xl font-bold">{profile.current_streak}</p>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20">
                    <Award className="w-6 h-6 text-secondary mb-2" />
                    <p className="text-2xl font-bold">{achievements.length}</p>
                    <p className="text-sm text-muted-foreground">Achievements</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Your earned badges and milestones</CardDescription>
              </CardHeader>
              <CardContent>
                {achievements.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No achievements yet. Keep learning to unlock badges!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Award className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{achievement.achievement_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {achievement.achievement_description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Earned {new Date(achievement.earned_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          {achievement.achievement_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total XP</span>
                    <span className="font-medium">{profile.xp}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Level</span>
                    <span className="font-medium">{profile.level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Streak</span>
                    <span className="font-medium">{profile.current_streak} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Achievements</span>
                    <span className="font-medium">{achievements.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
