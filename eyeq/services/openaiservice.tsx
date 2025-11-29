import { db } from './firebaseConfig';
import { collection, addDoc , getDocs } from 'firebase/firestore';

/**
 * Generates a chat completion by fetching a model name from Firestore
 * and calling our Next.js API route.
 * @param input The user's prompt string.
 * @returns The AI's response message.
 */
export const generateChatCompletion = async (input: string) => {
    try {
        // 1. Corrected to fetch the model configuration from the "Model" collection.
        const snapshot = await getDocs(collection(db, "Model"));
        let modelName: string = "";

        if (snapshot.docs.length > 0) {
            const firstDoc = snapshot.docs[0];
            modelName = firstDoc.get('Name');
            console.log("Using model from DB:", modelName);
        } else {
            // Updated error message to match the collection name.
            console.error("No model configured in the 'Model' collection.");
            throw new Error(`DB ERROR! Status: No model found in Firestore`);
        }

        if (!modelName) {
            console.error("Model name fetched from Firestore is empty.");
            throw new Error(`DB ERROR! Status: No Name for Model`);
        }

        const response = await fetch('/api/hello', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: input,
                model: modelName, // This key ('model') must match what the API expects
            }),
            signal: AbortSignal.timeout(5 * 60000), // 60-second timeout
        });

        if (!response.ok) {
            const errorResponse = await response.text();
            console.error('Error response from backend:', errorResponse);
            throw new Error(`HTTP ERROR! Status: ${response.status}`);
        }

        const data = await response.json();
        // Save the conversation history after getting a successful response.
        await saveQuestionResponse(input, data.message); 
        return data.message;
    } catch (error) {
        console.error('Error in generateChatCompletion: ', error);
        throw error;
    }
};

/**
 * Saves a single question and its corresponding AI response to Firestore for history.
 * @param question The user's question.
 * @param response The AI's response.
 */
const saveQuestionResponse = async (question: string, response: string) => {
    try {
        const docRef = await addDoc(collection(db, 'questionsResponses'), {
            question,
            response,
            timestamp: new Date()
        });
        console.log('History document written with ID: ', docRef.id);
    } catch (e) {
        console.error('Error adding history document: ', e);
    }
};

async function fetchSystemMessage(): Promise<string> {
    const response = await fetch('/api/system-message');

    if (!response.ok) {
        throw new Error(`Failed to load system message: ${response.status}`);
    }

    const data = await response.json();
    return data.systemMessage as string;
}

/**
 * Saves the final approved response to the 'GPT_Outputs' collection for fine-tuning.
 * @param question The user's question.
 * @param response The AI's response.
 */
export const saveFinalResponse = async (question: string, response: string) => {
    try {
        const docRef = await addDoc(collection(db, 'GPT_Outputs'), {
            question,
            response,
            timestamp: new Date()
        });
        console.log('Final output document written with ID: ', docRef.id);
        // 2. Replaced alert() with a console log for a better user experience.
        console.log("Response sent successfully to Database");
    } catch (e) {
        console.error('Error adding final output document: ', e);
    }
};

/**
 * Fetches all entries from the 'GPT_Outputs' collection, formats them
 * into a JSONL file, and triggers a download.
 * @returns An array of the entries fetched from the database.
 */
export async function getAllEntries() {
  try {
    const systemMessageContent: string = await fetchSystemMessage();

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
    const blob = new Blob([jsonlContent], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "exercises.jsonl";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return entries;

  } catch (error) {
    console.error("Error fetching entries or creating file:", error);
    // 3. Replaced alert() with a console error.
    console.error("Failed to download the file.");
    return []; 
  }
}

