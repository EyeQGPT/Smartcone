import OpenAI from "openai";
import { sysm } from "@/pages/api/sysmes";
import { db } from './firebaseConfig';
import { collection, addDoc , getDocs } from 'firebase/firestore';

//generating the api chat
//exporting a helper function to interact with the API
export const generateChatCompletion = async (input: string) => {
    try {
        const response = await fetch('/api/hello', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input }),
            signal: AbortSignal.timeout(60000),
        });

        if (!response.ok) {
            console.log("openaiservice.js input is: " + input);
            const errorResponse = await response.text();
            console.error('Error response:', errorResponse);
            throw new Error(`HTTP ERROR! Status: ${response.status}`);
        }

        const data = await response.json();
        await saveQuestionResponse(input, data.message);
        return data.message;
    } catch (error) {
        console.error('Error with backend request: ', error);
        throw error;
    }
}

// Function to save question and response to Firestore
const saveQuestionResponse = async (question: string, response: string) => {
    try {
        const docRef = await addDoc(collection(db, 'questionsResponses'), {
            question,
            response,
            timestamp: new Date()
        });
        console.log('Document written with ID: ', docRef.id);
    } catch (e) {
        console.error('Error adding document: ', e);
    }
};

// Function to save question and response to Firestore
export const saveFinalResponse = async (question: string, response: string) => {
    try {
        const docRef = await addDoc(collection(db, 'GPT_Outputs'), {
            question,
            response,
            timestamp: new Date()
        });
        console.log('Document written with ID: ', docRef.id);
        alert("Response sent successfully to Database");
    } catch (e) {
        console.error('Error adding document: ', e);
    }
};


export async function getAllEntries() {
  try {
    const systemMessageContent = "You are a helpful AI assistant for fitness training.";

    const snapshot = await getDocs(collection(db, "GPT_Outputs"));
    const entries = snapshot.docs.map(doc => doc.data());

    const jsonLStrings = entries.map(element => {
      const jsonObject = {
        messages: [
          { "role": "system", "content": systemMessageContent },
          { "role": "user", "content": element.question },
          { "role": "assistant", "content": element.response }
        ]
      };
      return JSON.stringify(jsonObject);
    });

    const jsonlContent = jsonLStrings.join('\n');

    // For maximum compatibility, use 'application/octet-stream'
    const blob = new Blob([jsonlContent], { type: 'application/octet-stream' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // ==========================================================
    // THIS IS THE MOST IMPORTANT LINE FOR YOUR CURRENT PROBLEM
    // Ensure the filename ends with ".jsonl"
    link.download = "exercises.jsonl";
    // ==========================================================

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return entries;

  } catch (error) {
    console.error("Error fetching entries or creating file:", error);
    alert("Failed to download the file. Check the console for errors.");
    return []; 
  }
}