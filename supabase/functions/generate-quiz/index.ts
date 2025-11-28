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
    const { userId, certificationId, difficulty, weakDomains } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get certification details
    const { data: certification } = await supabase
      .from('certifications')
      .select('*')
      .eq('id', certificationId)
      .single();

    // Build context for quiz generation
    const domains = [
      "IAM (Identity and Access Management)",
      "EC2 (Elastic Compute Cloud)",
      "S3 (Simple Storage Service)",
      "VPC (Virtual Private Cloud)",
      "RDS (Relational Database Service)",
      "Lambda",
      "CloudWatch",
      "CloudFormation",
      "Security and Compliance",
      "Pricing and Support"
    ];

    // Prioritize weak domains if they exist
    const focusDomains = weakDomains && weakDomains.length > 0
      ? weakDomains.map((d: any) => d.name).slice(0, 3)
      : domains.slice(0, 3);

    // Generate quiz using Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert AWS certification quiz generator. Generate educational, accurate questions for ${certification.name}. Focus on practical scenarios and real-world applications. Include clear explanations for answers.`
          },
          {
            role: 'user',
            content: `Generate 5 quiz questions for ${certification.name} at ${difficulty} difficulty level. 
            
Focus primarily on these domains: ${focusDomains.join(', ')}

Generate a mix of:
- 3 multiple choice questions (single answer)
- 1 multi-select question (multiple correct answers)
- 1 true/false question

Return ONLY valid JSON in this exact format (no markdown, no backticks):
{
  "questions": [
    {
      "question_text": "Question text here?",
      "question_type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Detailed explanation why this is correct",
      "difficulty": "${difficulty}",
      "domain": "EC2"
    }
  ]
}

For multi_select questions, correct_answer should be an array: ["Option A", "Option C"]
For true_false questions, options should be: ["True", "False"]`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse the AI response
    let parsedQuestions;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedQuestions = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse quiz questions from AI');
    }

    // Create quiz record
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: userId,
        certification_id: certificationId,
        difficulty,
        total_questions: parsedQuestions.questions.length,
      })
      .select()
      .single();

    if (quizError) throw quizError;

    // Create question records
    const questionsToInsert = parsedQuestions.questions.map((q: any) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      domain: q.domain,
    }));

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    if (questionsError) throw questionsError;

    return new Response(
      JSON.stringify({ quiz, questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-quiz:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
