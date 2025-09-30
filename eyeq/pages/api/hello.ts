import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import path from 'path';
import dotenv from 'dotenv';

import { sysm } from './sysmes';


// Load environment variables
// dotenv.config({ path: path.join("files/.env")});
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Read the system message from the text file
const data = sysm;

// Constant string for the system message
const SYSMESG = data;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || '', // Ensure the API key is available in your .env
});

function formatResponse(text: string) {
  // Adding spacing between sentences
  let formattedText = text.replace(/\. /g, '.\n\n');

  // Check for any JSON code to format
  const jsonText = formattedText.match(/```json([\s\S]*?)```/);
  
  if (jsonText) {
    const jsonString = jsonText[1].trim(); // Extracting the JSON block
    try {
      const parsedJSON = JSON.parse(jsonString);
      const formattedJSON = JSON.stringify(parsedJSON, null, 2);

      // Replacing the original JSON with the formatted one
      formattedText = formattedText.replace(jsonText[0], `\n\n\`\`\`json\n${formattedJSON}\n\`\`\`\n`);
    } catch (error) {
      console.error("Error while parsing JSON: ", error);
    }
  }

  return formattedText;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Request Method:', req.method);  // Log the request method
  if (req.method === 'POST') {
    const { input: input, model: model } = req.body;
    console.log(input);

    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: SYSMESG },
          { role: "user", content: input },
        ],
        max_tokens: 5000,
        temperature: 0.7,    
      });

      const formattedMessage = formatResponse(response.choices[0].message.content || ":-)");

      res.status(200).json({
        message: formattedMessage || response.choices[0].message.content,
      });
    } catch (error) {
      console.error("Error with OpenAI API request: ", error);
      res.status(500).send("Error with OpenAI API request");
    }
  } else {
    console.log('Method Not Allowed: ', req.method);  // Log the method if it's not POST
    res.status(405).send("Method Not Allowed");
  }
}