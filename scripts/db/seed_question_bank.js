const fs = require('fs');

const subjects = [
  { name: 'Mathematics', topic: 'Algebra', count: 25 },
  { name: 'Biology', topic: 'Cell Biology', count: 25 },
  { name: 'Physics', topic: 'Mechanics', count: 25 },
  { name: 'Chemistry', topic: 'Organic Chemistry', count: 25 }
];

let sql = `
-- Seed Question Bank
DELETE FROM public.question_bank;
`;

const diffs = ['easy', 'medium', 'hard'];

subjects.forEach(sub => {
  for (let i = 1; i <= sub.count; i++) {
    const diff = diffs[i % 3];
    const qText = `${sub.name} Question ${i}: What is the correct KCSE-style answer for this ${sub.topic} problem?`;
    const options = JSON.stringify([`Option A for Q${i}`, `Option B for Q${i}`, `Option C for Q${i}`, `Option D for Q${i}`]);
    const correct = `Option B for Q${i}`;
    const explanation = `Explanation for ${sub.name} Q${i}.`;
    
    sql += `
INSERT INTO public.question_bank (subject, topic, difficulty, question, options, correct_answer, explanation)
VALUES ('${sub.name}', '${sub.topic}', '${diff}', '${qText}', '${options}', '${correct}', '${explanation}');
`;
  }
});

fs.writeFileSync('supabase/seed_question_bank.sql', sql);
console.log('Generated supabase/seed_question_bank.sql');
