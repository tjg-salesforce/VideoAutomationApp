// Gemini API utility for AI-powered conversation generation

export interface GeminiMessage {
  sender: 'customer' | 'agent';
  text: string;
  timestamp?: string;
}

export interface GenerateConversationParams {
  prompt: string;
  customerName?: string;
  agentName?: string;
  apiKey: string;
  existingMessages?: Array<{ sender: 'customer' | 'agent'; text: string }>;
}

/**
 * Generates a conversation using Google Gemini API
 * Ensures messages alternate between customer and agent
 */
export async function generateConversation({
  prompt,
  customerName = 'Customer',
  agentName = 'Agent',
  apiKey,
  existingMessages = []
}: GenerateConversationParams): Promise<GeminiMessage[]> {
  try {
    // Build context from existing messages if provided
    let existingContext = '';
    if (existingMessages && existingMessages.length > 0) {
      const conversationText = existingMessages.map((msg, idx) => 
        `${idx + 1}. ${msg.sender === 'customer' ? customerName : agentName}: "${msg.text}"`
      ).join('\n');
      
      existingContext = `\n\nEXISTING CONVERSATION CONTEXT:
${conversationText}

CRITICAL INSTRUCTIONS:
1. The user wants to generate a NEW complete conversation that REPLACES the existing one above
2. However, you MUST maintain consistency with specific details mentioned in the existing conversation (product names, brands, specific issues, customer details, etc.)
3. If the user's new prompt doesn't mention specific details from the existing conversation, you should still incorporate those details naturally into the new conversation
4. For example, if the existing conversation mentions "Ford Bronco" and the new prompt doesn't mention a car model, the new conversation should still reference "Ford Bronco"
5. Generate a fresh conversation flow based on the new prompt, but preserve important contextual details from the existing conversation
6. The new conversation should feel like a natural continuation or variation that maintains the same context`;
    }

    const systemPrompt = `You are a conversation generator for SMS/text message conversations between a customer and a customer service agent.

Requirements:
1. Generate a realistic SMS conversation based on the user's prompt
2. Messages MUST alternate between customer and agent
3. Start with the customer's first message
4. Keep messages concise and realistic for SMS (typically 1-3 sentences)
5. Generate 6-12 messages total (3-6 from each party)
6. Return ONLY a valid JSON array of messages in this exact format:
[
  {"sender": "customer", "text": "message text here"},
  {"sender": "agent", "text": "message text here"},
  {"sender": "customer", "text": "message text here"}
]

CRITICAL JSON FORMATTING RULES:
- You MUST return valid JSON that can be parsed by JSON.parse()
- All quotes within message text MUST be escaped with backslash: \\"
- Example of CORRECT format: {"sender": "customer", "text": "I said \\"hello\\" to them"}
- Example of WRONG format: {"sender": "customer", "text": "I said "hello" to them"} (this breaks JSON)
- If message text contains quotes, apostrophes, or special characters, escape them properly
- Do NOT use single quotes, only double quotes escaped with backslash
- Ensure all strings are properly closed with matching quotes
- Return ONLY the JSON array, no markdown code blocks, no explanations, no other text, no leading/trailing whitespace

The customer name is: ${customerName}
The agent name is: ${agentName}

User's prompt: ${prompt}${existingContext}

Return ONLY the valid JSON array, no other text or explanation.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
            responseSchema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sender: {
                    type: "string",
                    enum: ["customer", "agent"]
                  },
                  text: {
                    type: "string"
                  },
                  timestamp: {
                    type: "string"
                  }
                },
                required: ["sender", "text"]
              }
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `Gemini API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    
    // Extract the generated text or structured data
    // When responseSchema is used, the response might be structured differently
    let generatedText = '';
    let structuredData: any = null;
    
    // Try multiple ways to extract the response
    if (data.candidates?.[0]?.content?.parts) {
      // Standard format: parts array
      const parts = data.candidates[0].content.parts;
      for (const part of parts) {
        if (part.text) {
          generatedText = part.text;
          break;
        } else if (part.functionCall) {
          // Function call format (unlikely but possible)
          structuredData = part.functionCall;
        } else if (part.structVal) {
          // Structured value format (when using responseSchema)
          structuredData = part.structVal;
        }
      }
    } else if (data.candidates?.[0]?.content?.text) {
      // Direct text property
      generatedText = data.candidates[0].content.text;
    } else if (data.candidates?.[0]?.content) {
      // Check for structured content
      const content = data.candidates[0].content;
      if (content.parts && content.parts[0]) {
        const firstPart = content.parts[0];
        if (firstPart.text) {
          generatedText = firstPart.text;
        } else if (firstPart.structVal) {
          structuredData = firstPart.structVal;
        }
      }
    } else if (typeof data === 'string') {
      // Direct string response
      generatedText = data;
    } else if (data.text) {
      // Text at root level
      generatedText = data.text;
    } else if (Array.isArray(data)) {
      // Direct array response (when responseSchema returns array)
      structuredData = data;
    }
    
    // If we got structured data, convert it to messages format
    if (structuredData && !generatedText) {
      // Handle structured response from responseSchema
      if (Array.isArray(structuredData)) {
        // Already an array
        const messages: GeminiMessage[] = structuredData.map((item: any) => ({
          sender: item.sender || 'customer',
          text: item.text || '',
          timestamp: item.timestamp
        }));
        return messages;
      } else if (structuredData.values) {
        // StructVal format - convert to array
        const values = structuredData.values;
        if (Array.isArray(values)) {
          const messages: GeminiMessage[] = values.map((item: any) => ({
            sender: item.sender?.stringValue || item.sender || 'customer',
            text: item.text?.stringValue || item.text || '',
            timestamp: item.timestamp?.stringValue || item.timestamp
          }));
          return messages;
        }
      }
    }
    
    if (!generatedText && !structuredData) {
      console.error('No response from Gemini API. Full response:', JSON.stringify(data, null, 2));
      throw new Error('No response from Gemini API. Please check the console for details.');
    }

    // Parse the JSON response
    // Try to extract JSON from the response (in case there's extra text)
    let jsonText = generatedText.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to find JSON array in the text
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Try to fix common JSON issues before parsing
    let messages: GeminiMessage[] = [];
    try {
      messages = JSON.parse(jsonText);
    } catch (parseError: any) {
      // If parsing fails, try to fix common issues
      console.warn('Initial JSON parse failed, attempting to fix:', parseError.message);
      
      // Try to fix unescaped quotes in string values
      // This regex finds string values and ensures quotes are properly escaped
      let fixedJson = jsonText;
      
      // Replace unescaped quotes within string values (but not at boundaries)
      // This is a heuristic approach - find patterns like: "text"more text"
      fixedJson = fixedJson.replace(/"([^"]*)"([^,}\]]*)"([^,}\]]*)/g, (match, p1, p2, p3) => {
        // If we have a pattern like "text"more"text, escape the middle quote
        if (p2 && p2.includes('"')) {
          return `"${p1}"${p2.replace(/"/g, '\\"')}"${p3}`;
        }
        return match;
      });
      
      // Try a more aggressive fix: find all message objects and fix their text fields
      try {
        // Extract all text fields and fix them - handle escaped quotes properly
        fixedJson = fixedJson.replace(/"text"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g, (match, textContent) => {
          // Escape any unescaped quotes in the text content
          // Process character by character to handle escaped sequences properly
          let fixedText = '';
          for (let i = 0; i < textContent.length; i++) {
            if (textContent[i] === '\\' && i + 1 < textContent.length) {
              // This is an escape sequence, keep it as is
              fixedText += textContent[i] + textContent[i + 1];
              i++; // Skip next character
            } else if (textContent[i] === '"') {
              // Unescaped quote, escape it
              fixedText += '\\"';
            } else {
              fixedText += textContent[i];
            }
          }
          return `"text":"${fixedText}"`;
        });
        
        messages = JSON.parse(fixedJson);
      } catch (secondError) {
        // Last resort: try to manually extract messages using a more robust approach
        console.warn('Fixed JSON parse also failed, attempting manual extraction. Response:', jsonText.substring(0, 500));
        messages = [];
        
        // Try to extract messages using a state machine approach
        // Look for patterns like: {"sender": "customer", "text": "..."}
        const senderPattern = /"sender"\s*:\s*"([^"]+)"/g;
        const textPattern = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
        
        // Find all sender and text matches
        const senderMatches = Array.from(jsonText.matchAll(senderPattern));
        const textMatches = Array.from(jsonText.matchAll(textPattern));
        
        // Pair them up
        const minLength = Math.min(senderMatches.length, textMatches.length);
        for (let i = 0; i < minLength; i++) {
          const sender = senderMatches[i][1];
          let text = textMatches[i][1] || '';
          
          // Unescape common escape sequences
          text = text
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\');
          
          if (sender && text) {
            messages.push({
              sender: (sender === 'customer' || sender === 'agent') ? sender : 'customer',
              text: text.trim(),
              timestamp: undefined
            });
          }
        }
        
        // If that didn't work, try a simpler pattern match
        if (messages.length === 0) {
          // Look for any pattern that looks like a message object
          const simplePattern = /\{\s*"sender"\s*:\s*"([^"]+)"[^}]*"text"\s*:\s*"([^"]+)"[^}]*\}/g;
          let match;
          while ((match = simplePattern.exec(jsonText)) !== null) {
            const sender = match[1];
            let text = match[2] || '';
            text = text.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
            
            if (sender && text) {
              messages.push({
                sender: (sender === 'customer' || sender === 'agent') ? sender : 'customer',
                text: text.trim(),
                timestamp: undefined
              });
            }
          }
        }
        
        if (messages.length === 0) {
          // Log the actual response for debugging
          console.error('Failed to extract messages. Full response:', generatedText);
          throw new Error(`Failed to parse JSON response. The AI may have returned invalid JSON. Please try generating again with a simpler prompt. Original error: ${parseError.message}`);
        }
      }
    }

    // Validate and ensure alternating pattern
    const validatedMessages: GeminiMessage[] = [];
    let expectedSender: 'customer' | 'agent' = 'customer'; // Start with customer

    for (const message of messages) {
      // Ensure valid sender
      if (message.sender !== 'customer' && message.sender !== 'agent') {
        // Auto-correct: alternate based on expected sender
        message.sender = expectedSender;
      }

      // Ensure text exists and is not empty
      if (message.text && message.text.trim()) {
        validatedMessages.push({
          sender: message.sender,
          text: message.text.trim(),
          timestamp: message.timestamp
        });
        
        // Switch expected sender for next message
        expectedSender = message.sender === 'customer' ? 'agent' : 'customer';
      }
    }

    // If we have an odd number of messages, ensure it ends with agent (for closure)
    if (validatedMessages.length > 0 && validatedMessages.length % 2 === 1) {
      const lastMessage = validatedMessages[validatedMessages.length - 1];
      if (lastMessage.sender === 'customer') {
        // Add a final agent response
        validatedMessages.push({
          sender: 'agent',
          text: 'Is there anything else I can help you with?',
          timestamp: undefined
        });
      }
    }

    return validatedMessages;
  } catch (error) {
    console.error('Error generating conversation:', error);
    throw error;
  }
}

export interface ScriptSection {
  headline: string;
  script: string;
  visualDescription: string;
  notes?: string;
}

export interface GenerateScriptParams {
  prompt: string;
  apiKey: string;
  existingSections?: ScriptSection[];
  targetSectionIndex?: number; // For single-section editing
}

/**
 * Generates script sections using Google Gemini API
 * Can generate all sections or edit a single section
 */
export async function generateScript({
  prompt,
  apiKey,
  existingSections = [],
  targetSectionIndex
}: GenerateScriptParams): Promise<ScriptSection[]> {
  try {
    // Build context from existing sections if provided
    let existingContext = '';
    if (existingSections && existingSections.length > 0) {
      const sectionsText = existingSections.map((section, idx) => 
        `Section ${idx + 1}:
- Headline: ${section.headline || '(none)'}
- Script: ${section.script || '(none)'}
- Visual Description: ${section.visualDescription || '(none)'}
- Notes: ${section.notes || '(none)'}`
      ).join('\n\n');
      
      if (targetSectionIndex !== undefined) {
        existingContext = `\n\nEXISTING SCRIPT CONTEXT (all sections):
${sectionsText}

CRITICAL INSTRUCTIONS:
1. You are editing ONLY Section ${targetSectionIndex + 1} (the section at index ${targetSectionIndex})
2. Maintain consistency with the other sections (product names, tone, style, etc.)
3. The headline should be max 10 words
4. Generate a complete section that fits naturally with the existing script flow
5. Return ONLY the edited section, not all sections`;
      } else {
        existingContext = `\n\nEXISTING SCRIPT CONTEXT:
${sectionsText}

CRITICAL INSTRUCTIONS:
1. The user wants to generate a NEW complete script that REPLACES the existing one above
2. However, you MUST maintain consistency with specific details mentioned in the existing script (product names, brands, specific features, tone, etc.)
3. If the user's new prompt doesn't mention specific details from the existing script, you should still incorporate those details naturally
4. Generate a fresh script flow based on the new prompt, but preserve important contextual details from the existing script
5. Each section should have a headline (max 10 words), script text, visual description, and optional notes`;
      }
    }

    const systemPrompt = `You are a video script generator that creates structured script sections for video production.

Requirements:
1. Generate realistic video script sections based on the user's prompt
2. Each section should have:
   - Headline: A brief description (max 10 words) for the section
   - Script: The actual script text to be spoken/displayed (can be multiple sentences)
   - Visual Description: Description of what should be shown on screen during this section
   - Notes: Optional notes or production considerations
3. Generate 3-8 sections total (unless editing a single section)
4. Return ONLY a valid JSON array of sections in this exact format:
[
  {
    "headline": "Section headline here (max 10 words)",
    "script": "The script text for this section...",
    "visualDescription": "What should be shown visually...",
    "notes": "Optional production notes..."
  }
]

CRITICAL JSON FORMATTING RULES:
- You MUST return valid JSON that can be parsed by JSON.parse()
- All quotes within text fields MUST be escaped with backslash: \\"
- Example: {"script": "I said \\"hello\\" to them"}
- Do NOT use single quotes, only double quotes escaped with backslash
- Ensure all strings are properly closed with matching quotes
- Return ONLY the JSON array, no markdown code blocks, no explanations, no other text

User's prompt: ${prompt}${existingContext}

Return ONLY the valid JSON array, no other text or explanation.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
            responseSchema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  script: { type: "string" },
                  visualDescription: { type: "string" },
                  notes: { type: "string" }
                },
                required: ["headline", "script", "visualDescription"]
              }
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `Gemini API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    
    // Extract the generated text or structured data
    let generatedText = '';
    let structuredData: any = null;
    
    if (data.candidates?.[0]?.content?.parts) {
      const parts = data.candidates[0].content.parts;
      for (const part of parts) {
        if (part.text) {
          generatedText = part.text;
          break;
        } else if (part.structVal) {
          structuredData = part.structVal;
        }
      }
    } else if (data.candidates?.[0]?.content?.text) {
      generatedText = data.candidates[0].content.text;
    } else if (Array.isArray(data)) {
      structuredData = data;
    }
    
    // If we got structured data, convert it to sections format
    if (structuredData && !generatedText) {
      if (Array.isArray(structuredData)) {
        const sections: ScriptSection[] = structuredData.map((item: any) => ({
          headline: item.headline?.stringValue || item.headline || '',
          script: item.script?.stringValue || item.script || '',
          visualDescription: item.visualDescription?.stringValue || item.visualDescription || '',
          notes: item.notes?.stringValue || item.notes || ''
        }));
        return sections;
      } else if (structuredData.values) {
        const values = structuredData.values;
        if (Array.isArray(values)) {
          const sections: ScriptSection[] = values.map((item: any) => ({
            headline: item.headline?.stringValue || item.headline || '',
            script: item.script?.stringValue || item.script || '',
            visualDescription: item.visualDescription?.stringValue || item.visualDescription || '',
            notes: item.notes?.stringValue || item.notes || ''
          }));
          return sections;
        }
      }
    }
    
    if (!generatedText && !structuredData) {
      console.error('No response from Gemini API. Full response:', JSON.stringify(data, null, 2));
      throw new Error('No response from Gemini API. Please check the console for details.');
    }

    // Parse the JSON response
    let jsonText = generatedText.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Try to fix common JSON issues before parsing
    let sections: ScriptSection[] = [];
    try {
      sections = JSON.parse(jsonText);
    } catch (parseError: any) {
      // If parsing fails, try to fix common issues
      console.warn('Initial JSON parse failed, attempting to fix:', parseError.message);
      
      // Try to fix unescaped quotes in string values
      let fixedJson = jsonText;
      
      // Fix quotes in all string fields (headline, script, visualDescription, notes)
      const stringFields = ['headline', 'script', 'visualDescription', 'notes'];
      
      for (const field of stringFields) {
        // Pattern to match: "field": "content with possible unescaped quotes"
        const fieldPattern = new RegExp(`"${field}"\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'g');
        fixedJson = fixedJson.replace(fieldPattern, (match, fieldContent) => {
          // Process character by character to handle escaped sequences properly
          let fixedContent = '';
          for (let i = 0; i < fieldContent.length; i++) {
            if (fieldContent[i] === '\\' && i + 1 < fieldContent.length) {
              // This is an escape sequence, keep it as is
              fixedContent += fieldContent[i] + fieldContent[i + 1];
              i++; // Skip next character
            } else if (fieldContent[i] === '"') {
              // Unescaped quote, escape it
              fixedContent += '\\"';
            } else {
              fixedContent += fieldContent[i];
            }
          }
          return `"${field}":"${fixedContent}"`;
        });
      }
      
      try {
        sections = JSON.parse(fixedJson);
      } catch (secondError) {
        // Last resort: try to manually extract sections
        console.warn('Fixed JSON parse also failed, attempting manual extraction. Response:', jsonText.substring(0, 500));
        sections = [];
        
        // Try to extract sections using regex patterns
        // Look for patterns like: {"headline": "...", "script": "...", "visualDescription": "...", "notes": "..."}
        const headlinePattern = /"headline"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
        const scriptPattern = /"script"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
        const visualDescPattern = /"visualDescription"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
        const notesPattern = /"notes"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
        
        // Find all matches
        const headlineMatches = Array.from(jsonText.matchAll(headlinePattern));
        const scriptMatches = Array.from(jsonText.matchAll(scriptPattern));
        const visualDescMatches = Array.from(jsonText.matchAll(visualDescPattern));
        const notesMatches = Array.from(jsonText.matchAll(notesPattern));
        
        // Pair them up by index
        const maxLength = Math.max(
          headlineMatches.length,
          scriptMatches.length,
          visualDescMatches.length,
          notesMatches.length
        );
        
        for (let i = 0; i < maxLength; i++) {
          const headline = headlineMatches[i]?.[1] || '';
          const script = scriptMatches[i]?.[1] || '';
          const visualDescription = visualDescMatches[i]?.[1] || '';
          const notes = notesMatches[i]?.[1] || '';
          
          // Unescape common escape sequences
          const unescape = (str: string) => str
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\');
          
          // Only add section if it has at least headline or script
          if (headline || script) {
            sections.push({
              headline: unescape(headline).trim(),
              script: unescape(script).trim(),
              visualDescription: unescape(visualDescription).trim(),
              notes: unescape(notes).trim() || undefined
            });
          }
        }
        
        // If that didn't work, try a simpler pattern match
        if (sections.length === 0) {
          // Look for any pattern that looks like a section object
          const sectionPattern = /\{\s*"headline"\s*:\s*"([^"]+)"[^}]*"script"\s*:\s*"([^"]+)"[^}]*\}/g;
          let match;
          while ((match = sectionPattern.exec(jsonText)) !== null) {
            const headline = match[1] || '';
            let script = match[2] || '';
            script = script.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
            
            if (headline || script) {
              sections.push({
                headline: headline.trim(),
                script: script.trim(),
                visualDescription: '',
                notes: undefined
              });
            }
          }
        }
        
        if (sections.length === 0) {
          // Log the actual response for debugging
          console.error('Failed to extract sections. Full response:', generatedText);
          throw new Error(
            `Failed to parse JSON response. The AI may have returned invalid JSON. ` +
            `Please try generating again with a simpler prompt. Original error: ${parseError.message}`
          );
        }
      }
    }

    // Validate sections
    const validatedSections: ScriptSection[] = sections
      .filter((section: any) => section && (section.headline || section.script))
      .map((section: any) => ({
        headline: (section.headline || '').trim().substring(0, 100), // Limit headline length
        script: (section.script || '').trim(),
        visualDescription: (section.visualDescription || '').trim(),
        notes: (section.notes || '').trim() || undefined
      }));

    if (validatedSections.length === 0) {
      throw new Error('No valid sections were generated. Please try again with a different prompt.');
    }

    // If editing a single section, return only that section
    if (targetSectionIndex !== undefined && validatedSections.length > 0) {
      return [validatedSections[0]]; // Return only the first (and should be only) section
    }

    return validatedSections;
  } catch (error) {
    console.error('Error generating script:', error);
    throw error;
  }
}

