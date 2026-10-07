const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = (modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash') => genAI.getGenerativeModel({ 
  model: modelName,
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
});

/**
 * Generate content from Gemini with JSON parsing
 */
const generateJSON = async (prompt) => {
  try {
    const model = getModel();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timeout')), 10000)
    );
    const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
    const text = result.response.text();
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;
    
    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error('Gemini JSON generation error:', error.message);
    throw new Error(`AI generation failed: ${error.message}`);
  }
};

/**
 * Generate plain text content from Gemini
 */
const generateText = async (prompt) => {
  try {
    const model = getModel();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timeout')), 10000)
    );
    const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
    return result.response.text();
  } catch (error) {
    console.error('Gemini text generation error:', error.message);
    throw new Error(`AI generation failed: ${error.message}`);
  }
};

module.exports = { generateJSON, generateText };
