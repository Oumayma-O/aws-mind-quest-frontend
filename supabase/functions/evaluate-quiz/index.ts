import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quizId, answers } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get quiz and questions
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('*, questions(*)')
      .eq('id', quizId)
      .single();

    if (!quiz) throw new Error('Quiz not found');

    // Evaluate each question
    let score = 0;
    let totalXp = 0;
    const domainPerformance: Record<string, { correct: number; total: number }> = {};

    const questionUpdates = quiz.questions.map((question: any) => {
      const userAnswer = answers[question.id];
      let isCorrect = false;

      // Check if answer is correct
      if (question.question_type === 'multi_select') {
        const correctAnswers = Array.isArray(question.correct_answer) 
          ? question.correct_answer.sort() 
          : [];
        const userAnswers = Array.isArray(userAnswer) 
          ? userAnswer.sort() 
          : [];
        isCorrect = JSON.stringify(correctAnswers) === JSON.stringify(userAnswers);
      } else {
        isCorrect = userAnswer === question.correct_answer;
      }

      if (isCorrect) score++;

      // Calculate XP based on difficulty
      let xpEarned = 0;
      if (isCorrect) {
        switch (question.difficulty) {
          case 'easy': xpEarned = 5; break;
          case 'medium': xpEarned = 10; break;
          case 'hard': xpEarned = 20; break;
        }
      }
      totalXp += xpEarned;

      // Track domain performance
      if (!domainPerformance[question.domain]) {
        domainPerformance[question.domain] = { correct: 0, total: 0 };
      }
      domainPerformance[question.domain].total++;
      if (isCorrect) domainPerformance[question.domain].correct++;

      return {
        id: question.id,
        user_answer: userAnswer,
        is_correct: isCorrect,
        xp_earned: xpEarned,
      };
    });

    // Update questions
    for (const update of questionUpdates) {
      await supabase
        .from('questions')
        .update({
          user_answer: update.user_answer,
          is_correct: update.is_correct,
          xp_earned: update.xp_earned,
        })
        .eq('id', update.id);
    }

    // Update quiz
    await supabase
      .from('quizzes')
      .update({
        score,
        xp_earned: totalXp,
        completed_at: new Date().toISOString(),
      })
      .eq('id', quizId);

    // Update user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', quiz.user_id)
      .single();

    const newXp = (profile?.xp || 0) + totalXp;
    const newLevel = Math.floor(newXp / 100) + 1;

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const lastQuizDate = profile?.last_quiz_date;
    let newStreak = profile?.current_streak || 0;

    if (lastQuizDate) {
      const daysSinceLastQuiz = Math.floor(
        (new Date(today).getTime() - new Date(lastQuizDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastQuiz === 1) {
        newStreak++;
      } else if (daysSinceLastQuiz > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await supabase
      .from('profiles')
      .update({
        xp: newXp,
        level: newLevel,
        current_streak: newStreak,
        last_quiz_date: today,
      })
      .eq('id', quiz.user_id);

    // Update user progress
    const accuracy = (score / quiz.questions.length) * 100;
    
    // Determine weak domains (< 60% accuracy)
    const weakDomains = Object.entries(domainPerformance)
      .filter(([_, perf]) => (perf.correct / perf.total) * 100 < 60)
      .map(([domain, perf]) => ({
        name: domain,
        accuracy: Math.round((perf.correct / perf.total) * 100),
      }));

    // Determine next difficulty
    let nextDifficulty = quiz.difficulty;
    if (accuracy >= 80) {
      nextDifficulty = quiz.difficulty === 'easy' ? 'medium' : quiz.difficulty === 'medium' ? 'hard' : 'hard';
    } else if (accuracy < 50) {
      nextDifficulty = quiz.difficulty === 'hard' ? 'medium' : quiz.difficulty === 'medium' ? 'easy' : 'easy';
    }

    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', quiz.user_id)
      .eq('certification_id', quiz.certification_id)
      .single();

    if (existingProgress) {
      const newTotalQuizzes = (existingProgress.total_quizzes || 0) + 1;
      const newTotalQuestions = (existingProgress.total_questions_answered || 0) + quiz.questions.length;
      const newCorrectAnswers = (existingProgress.correct_answers || 0) + score;
      const newAccuracy = (newCorrectAnswers / newTotalQuestions) * 100;

      await supabase
        .from('user_progress')
        .update({
          total_xp: (existingProgress.total_xp || 0) + totalXp,
          total_quizzes: newTotalQuizzes,
          total_questions_answered: newTotalQuestions,
          correct_answers: newCorrectAnswers,
          accuracy: newAccuracy,
          current_difficulty: nextDifficulty,
          weak_domains: weakDomains,
        })
        .eq('user_id', quiz.user_id)
        .eq('certification_id', quiz.certification_id);
    }

    // Check for achievements
    const achievements = [];
    
    // 7-day streak
    if (newStreak === 7) {
      achievements.push({
        user_id: quiz.user_id,
        achievement_type: 'streak',
        achievement_name: '7-Day Streak',
        achievement_description: 'Completed quizzes for 7 consecutive days',
      });
    }

    // 90%+ accuracy
    if (accuracy >= 90) {
      achievements.push({
        user_id: quiz.user_id,
        achievement_type: 'accuracy',
        achievement_name: 'Perfect Score',
        achievement_description: 'Achieved 90% or higher accuracy on a quiz',
      });
    }

    // 100 questions milestone
    if (existingProgress && existingProgress.total_questions_answered + quiz.questions.length >= 100) {
      const existing = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', quiz.user_id)
        .eq('achievement_type', 'milestone')
        .eq('achievement_name', '100 Questions')
        .single();
      
      if (!existing.data) {
        achievements.push({
          user_id: quiz.user_id,
          achievement_type: 'milestone',
          achievement_name: '100 Questions',
          achievement_description: 'Answered 100 questions',
        });
      }
    }

    // Insert achievements
    if (achievements.length > 0) {
      await supabase.from('achievements').insert(achievements);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        score,
        totalXp,
        accuracy,
        newLevel,
        newStreak,
        achievements: achievements.map(a => a.achievement_name),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in evaluate-quiz:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
