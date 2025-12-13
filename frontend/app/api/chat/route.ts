import { NextResponse } from 'next/server';

// System prompt for code generation
const SYSTEM_PROMPT = `You are FinalCode AI, an expert web developer assistant that helps users build applications through natural language.

Your role:
1. Generate clean, working code based on user descriptions
2. Explain what you're creating in a friendly way
3. Always provide complete, runnable code

Guidelines:
- Generate HTML, CSS, and JavaScript code that works together
- Use modern, clean design with good UX
- Include helpful comments in the code
- Make the code responsive and accessible
- Use vanilla JavaScript (no frameworks) unless specifically asked
- Always use semantic HTML

When generating code:
- For complete apps, provide separate code blocks for HTML, CSS, and JavaScript
- Label each code block clearly with the language (html, css, javascript)
- Make sure the code is complete and can run immediately
- Include any necessary error handling

Response format:
1. Brief explanation of what you're creating
2. Code blocks with language labels
3. Optional: Tips or suggestions for customization

Keep responses concise but complete. Focus on delivering working code quickly.`;

export async function POST(request: NextRequest) {
  try {
    const { message, currentFiles } = await request.json();

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        response: `⚠️ **API Key Required**

To use the AI assistant, you need to configure your Anthropic API key:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com/)
2. Create a file called \`.env.local\` in your project root
3. Add: \`ANTHROPIC_API_KEY=your-key-here\`
4. Restart the development server

Once configured, I'll be able to generate code for you! 🚀`,
        files: {}
      }, { status: 200 });
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Build context with current files
    const filesContext = Object.entries(currentFiles)
      .map(([name, content]) => `### ${name}\n\`\`\`\n${content}\n\`\`\``)
      .join('\n\n');

    const userMessage = `Current project files:
${filesContext}

User request: ${message}

Please help with this request. If generating new code, provide complete files that can replace the current ones.`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        }
      ],
    });

    // Extract text response
    const textContent = response.content.find(block => block.type === 'text');
    const responseText = textContent ? textContent.text : 'I apologize, but I could not generate a response.';

    // Try to extract complete files from the response
    const extractedFiles: Record<string, string> = {};
    
    // Look for code blocks with file indicators
    const htmlMatch = responseText.match(/```html\n([\s\S]*?)```/);
    const cssMatch = responseText.match(/```css\n([\s\S]*?)```/);
    const jsMatch = responseText.match(/```(?:javascript|js)\n([\s\S]*?)```/);

    if (htmlMatch) extractedFiles['index.html'] = htmlMatch[1].trim();
    if (cssMatch) extractedFiles['style.css'] = cssMatch[1].trim();
    if (jsMatch) extractedFiles['script.js'] = jsMatch[1].trim();

    return NextResponse.json({
      response: responseText,
      files: Object.keys(extractedFiles).length > 0 ? extractedFiles : {},
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    // Handle specific errors
    if (error.status === 401) {
      return NextResponse.json({
        response: '❌ **Invalid API Key**\n\nYour Anthropic API key appears to be invalid. Please check your `.env.local` file and make sure the key is correct.',
        files: {}
      }, { status: 200 });
    }

    if (error.status === 429) {
      return NextResponse.json({
        response: '⏳ **Rate Limited**\n\nToo many requests. Please wait a moment and try again.',
        files: {}
      }, { status: 200 });
    }

    return NextResponse.json({
      response: `❌ **Error**\n\nSomething went wrong: ${error.message || 'Unknown error'}. Please try again.`,
      files: {}
    }, { status: 200 });
  }
}
