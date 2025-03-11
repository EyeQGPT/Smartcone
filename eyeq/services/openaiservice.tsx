import OpenAI from "openai";
import { db } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

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