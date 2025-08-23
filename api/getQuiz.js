export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // URL'den sınav ID'sini al (örn: /api/getQuiz?id=123)
  const { searchParams } = new URL(request.url);
  const quizId = searchParams.get('id');

  if (!quizId) {
    return new Response(JSON.stringify({ error: 'Sınav ID gerekli.' }), { status: 400 });
  }

  const API_ENDPOINT = `https://fromizmir.com/wp-json/lolonolo-quiz/v16/quiz/${quizId}`;
  const API_KEY = process.env.LOLONOLO_API_KEY;

  try {
    const response = await fetch(API_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress API hatası: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}