// Author: Bin Lee (blee@filynai.com)
// Description: API route that mocks topic extraction results for editor documents.
import { NextRequest, NextResponse } from 'next/server';

interface DocumentTopic {
  id: string;
  title: string;
  searchText: string;
  confidence: number;
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a document analysis expert. Extract 3-5 key topics from the given document content. 

IMPORTANT: Respond with ONLY a valid JSON array. No explanations, no markdown formatting, no code blocks. Just the JSON array.

For each topic, provide:
1. A concise title (2-4 words max)
2. A short phrase from the document that best represents this topic (for navigation)
3. A confidence score (0-1)

Response format (JSON array only):
[
  {
    "id": "topic-1",
    "title": "Topic Title",
    "searchText": "exact phrase from document",
    "confidence": 0.85
  }
]

Focus on the most important themes, concepts, or subjects discussed in the document. The searchText should be a verbatim phrase from the document that represents the topic well.`,
          },
          {
            role: 'user',
            content: `Analyze this document and extract key topics:\n\n${content}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    try {
      console.log('Raw OpenAI response:', aiResponse);

      // Clean the response to handle potential formatting issues
      let cleanedResponse = aiResponse.trim();

      // Remove any markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse
          .replace(/```json\n?/, '')
          .replace(/```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse
          .replace(/```\n?/, '')
          .replace(/```$/, '');
      }

      // Remove any text before the first [ and after the last ]
      const startIndex = cleanedResponse.indexOf('[');
      const endIndex = cleanedResponse.lastIndexOf(']');

      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleanedResponse = cleanedResponse.substring(startIndex, endIndex + 1);
      }

      // Fix common JSON formatting issues
      cleanedResponse = cleanedResponse
        .replace(/,\s*}/g, '}') // Remove trailing commas before }
        .replace(/,\s*]/g, ']') // Remove trailing commas before ]
        .replace(/([^"\\])\n/g, '$1') // Remove unescaped newlines
        .replace(/\t/g, '') // Remove tabs
        .replace(/\r/g, ''); // Remove carriage returns

      // Parse the JSON response from OpenAI
      const topics: DocumentTopic[] = JSON.parse(cleanedResponse);

      // Validate that we have an array
      if (!Array.isArray(topics)) {
        throw new Error('Response is not an array');
      }

      // Validate and sanitize the topics
      const validTopics = topics
        .filter(
          (topic) =>
            topic &&
            typeof topic.title === 'string' &&
            typeof topic.searchText === 'string' &&
            typeof topic.confidence === 'number'
        )
        .slice(0, 5) // Limit to 5 topics max
        .map((topic, index) => ({
          id: topic.id || `topic-${index + 1}`,
          title: topic.title.substring(0, 50), // Limit title length
          searchText: topic.searchText.substring(0, 200), // Limit search text length
          confidence: Math.max(0, Math.min(1, topic.confidence)), // Ensure 0-1 range
        }));

      return NextResponse.json({ topics: validTopics });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw response was:', aiResponse);

      // Fallback: extract topics using simple keyword analysis
      const fallbackTopics = extractFallbackTopics(content);
      return NextResponse.json({ topics: fallbackTopics });
    }
  } catch (error) {
    console.error('Topic extraction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fallback topic extraction using simple analysis
function extractFallbackTopics(content: string): DocumentTopic[] {
  const words = content.toLowerCase().split(/\W+/);
  const wordCount: { [key: string]: number } = {};

  // Count word frequency (excluding common words)
  const commonWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'can',
    'this',
    'that',
    'these',
    'those',
  ]);

  words.forEach((word) => {
    if (word.length > 3 && !commonWords.has(word)) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });

  // Get top words
  const topWords = Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word], index) => ({
      id: `fallback-${index + 1}`,
      title: word.charAt(0).toUpperCase() + word.slice(1),
      searchText: word,
      confidence: 0.5,
    }));

  return topWords;
}
