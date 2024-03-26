import io from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import "highlight.js/styles/base16/atelier-dune-light.min.css";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "./CodeBlock.css";
import axios from "axios";
import { useParams } from "react-router-dom";

const SOCKET_ADDRESS = import.meta.env.VITE_SOCKET_ADDRESS;
const APP_ADDRESS = import.meta.env.VITE_APP_ADDRESS;
axios.defaults.baseURL = APP_ADDRESS;

const baseCodeInstructions = "// add your code here";
const baseCodeSolution = "// this is the solution!";

hljs.registerLanguage("javascript", javascript);

const CodeBlock: React.FC = () => {
  const { codeTitle } = useParams();
  const [codeContent, setCodeContent] = useState<string>(baseCodeInstructions);
  const [solutionContent, setSolutionContent] =
    useState<string>(baseCodeSolution);
  const [isMentor, setIsMentor] = useState(false);

  const socketRef = useRef<any>(null);

  useEffect(() => {
    const fetchSolution = async (codeTitle: string) => {
      try {
        console.log("codeTitle", codeTitle);
        const response = await axios.get(`/code/${codeTitle}`);
        console.log(response);
        const soulutionCode = response.data.solutionCode;
        const initCode = response.data.initCode;
        setSolutionContent(soulutionCode);
        setCodeContent(initCode);
        console.log("soulutionCode: ", soulutionCode);
        console.log("initCode: ", initCode);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchSolution(codeTitle as string);
    socketRef.current = io(SOCKET_ADDRESS);

    socketRef.current.emit("joinRoom", codeTitle);

    socketRef.current.on("isMentor", (isMentorResponse: boolean) => {
      setIsMentor(isMentorResponse);
      console.log(`i am a ${isMentorResponse ? "Mentor" : "Student"}`);
      socketRef.current.off("isMentor"); // Remove the event listener after it's triggered
    });

    socketRef.current.on("receiveStudentCode", (data: string) => {
      console.log(data);
      setCodeContent(data);
    });

    return () => {
    //   socketRef.current.emit("disconnect-room", codeTitle);
      socketRef.current.disconnect(); // Disconnect socket on unmount
    };
  }, []);

  const sendMessage = (code: string) => {
    socketRef.current.emit("sendStudentCode", { code, room: codeTitle });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setCodeContent(value);
    sendMessage(value);
  };

  const highlightedHtml = hljs.highlightAuto(codeContent).value;
  const HighlightedSolutionHtml = hljs.highlightAuto(solutionContent).value;

  return (
    <>
      <div className="multipleCodesContainer">
        <h1>Student Code:</h1>
        <div className="codeBlockContainer">
          <pre className="highlightedCode">
            <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
          </pre>
          <textarea
            className="textCode"
            value={codeContent}
            onChange={handleCodeChange}
            readOnly={isMentor || false}
          />
        </div>

        {isMentor && (
          <>
            <h1>Solution Code:</h1>
            <div className="codeBlockContainer">
              <pre className="highlightedCode">
                <code
                  dangerouslySetInnerHTML={{ __html: HighlightedSolutionHtml }}
                />
              </pre>
              <textarea
                className="textCode"
                value={solutionContent}
                onChange={handleCodeChange}
                readOnly={true}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CodeBlock;
