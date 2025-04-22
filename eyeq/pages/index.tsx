import React, { useState } from "react";
import { generateChatCompletion, saveFinalResponse } from "@/services/openaiservice";
import { AppProps } from "next/app";
import v3_css from "@/styles/v3css.module.css"

interface CustomAppProps extends AppProps {
  isLightMode: boolean;
  toggleTheme: () => void;
}

function App({ isLightMode, toggleTheme } : CustomAppProps) {
  // State for handling the input from the user
  const [input, setInput] = useState("");
  
  // State for storing the response from the API
  const [response, setResponse] = useState("");
  
  // State to hold the current input to be displayed in a new div
  const [displayInput, setDisplayInput] = useState("");
  
  // State to show loading status during API request
  const [loading, setLoading] = useState(false);
  
  // State to store a history of input-output pairs
  type HistoryItem = {
    input: string;
    output: string | null;
  };
  
  type History = HistoryItem[];
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // State to toggle the visibility of the history log
  const [showHistory, setShowHistory] = useState(false);

  const [content, setContent] = useState('');

  // Function to handle form submission and API interaction
  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    // If the input is empty or just white space, do nothing
    if (!input.trim()) {
      return;
    }

    // Show loading bar during API request
    setLoading(true);

    // API call to get the response based on input
    try {
      const result = await generateChatCompletion(input);
      setResponse(result);
      setContent(result)

      // Update history state with the new request and response
      setHistory((previousHistory) => [
        ...previousHistory,
        { input: input, output: result },
      ]);
    } catch (error) {
      // Display error if API request fails
      setResponse("Cannot get a response, try turning on backend");
    } finally {
      // Hide loading bar once API request is finished
      setLoading(false);
    }

    // Update displayed input and clear the input field
    setDisplayInput(input);
    setInput("");
  };

  // Handle Enter key press to submit form without shift key adding a new line
  const handleKeyPress = (e: { key?: any; shiftKey?: any; preventDefault: any; }) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // If input is empty or white space, do nothing
      if (!input.trim()) {
        return;
      }
      handleSubmit(e);
    }
  };

  // Function to handle the download of history log as a text file
  const handleDownload = () => {
    // If no history is available, show an alert
    if (history.length === 0) {
      alert("No history available to download");
      return;
    }

    // Format the history entries as a string
    const historyText = history
      .map((entry, index) => `Entry ${index + 1}:\nInput: ${entry.input}\nOutput: ${entry.output}\n`)
      .join("\n------------------------\n");

    // Create a downloadable file from the history
    const blob = new Blob([historyText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = "SmartConeGPT_History.txt";
    document.body.appendChild(a);
    a.click();

    // Clean up the temporary download link and object URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to download the current response only
  const handleDownloadCurrent = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "SmartConeGPT_Output.txt";
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Toggle the visibility of the history log
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  async function sendToDB(question: string, response: string) {
      setLoading(true)
      await saveFinalResponse(question, response)
      setLoading(false)
  }

  return (
    <div className={`App ${isLightMode ? "light-mode" : "dark-mode"}`}>
      {/* Main container for the input and output sections */}
      <div className="main-container">
        
        {/* Loading bar displayed when API request is in process */}
        {loading && <div className={v3_css.loadingbar}></div>}
        
        <div className={v3_css.divTitle}>Smartcones GPT</div>

        {/* Input section where user can submit their query */}
        <div className="input-container">
          <form onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about SmartCones... or create a SmartCone exercise"
              rows={10}
              cols={80}
            />
            <div className="divButtons">
              {/* Button to submit input */}
              <button type="submit">Submit</button>
              
              {/* Button to toggle light/dark mode
              <button type="button" onClick={toggleTheme}>
                {isLightMode ? "Dark Mode" : "Light Mode"}
              </button> */}

              {/* Button to download history
              <button onClick={handleDownload}>Download History</button> */}

              {/* Button to download current response */}
              <button onClick={handleDownloadCurrent}>Download Current Response</button>

              {/* Button to toggle visibility of history log
              <button onClick={toggleHistory}>
                {showHistory ? "Hide History Log" : "Show History Log"}
              </button> */}

              {/* Button to Send to DB */}
              <button onClick={() => {
                const q : string = document.getElementById("QUESTION")!.innerText
                const a : string = content
                console.log(q)
                if(q != "") {sendToDB(q,a)}
              }}>
                Send Response to DB
              </button>
            </div>
          </form>
        </div>

        {/* Output section to display input and API response */}
        <div className="output-container">
          
          {/* Display the current input submitted */}
          <div className="divInputText">
            <h2>Input:</h2>
            <div><pre id = "QUESTION">{displayInput}</pre></div>
          </div>

          {/* Display the API response */}
          <div className="divResponse">
            <h2>Response:</h2>
            <pre id = "ANSWER" contentEditable={(response != "") ? "true" : "false"}
            onInput={(event) => setContent((event.currentTarget.textContent == null) ? "" : event.currentTarget.textContent)}
            onBlur={() => {}}
            suppressContentEditableWarning={true}
            >{response}</pre>
          </div>

          {/* Conditionally render the history section */}
          {showHistory && (
            <div className="history">
              <h2>History Log:</h2>
              {history.length === 0 ? (
                <p>No previous requests have been made.</p>
              ) : (
                <ul>
                  {history.map((entry, index) => (
                    <li key={index}>
                      <strong>Input:</strong> <pre>{entry.input}</pre>
                      <br />
                      <strong>Output:</strong> <pre>{entry.output}</pre>
                      <hr />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

