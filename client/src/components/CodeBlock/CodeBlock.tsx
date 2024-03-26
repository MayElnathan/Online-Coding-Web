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

const highlightedHtmlCode = (code: string) => {
  return hljs.highlightAuto(code).value;
};

const normalizeText = (input: string) => {
  const trimmedText = input.trim();
  // Replace multiple spaces with a single space
  const singleSpaceText = trimmedText.replace(/\s{2,}/g, " ");
  // Replace multiple newline characters with a single newline
  const singleNewlineText = singleSpaceText.replace(/\n{2,}/g, "\n");
  return singleNewlineText;
};

const CodeBlock: React.FC = () => {
  const { codeTitle } = useParams();
  const [codeContent, setCodeContent] = useState<string>(baseCodeInstructions);
  const [studentSubmissionStatus, setStudentSubmissionStatus] =
    useState<string>("");
  //   const [studentsCodeContent, setStudentsCodeContent] = useState<{
  //     [key: string]: string;
  //   }>({});
  const [studentsCodeContent, setStudentsCodeContent] = useState<{
    [key: string]: { code: string; submission: string };
  }>({});

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

      // only the mentor listen on others students code
      if (isMentorResponse) {
        socketRef.current.on(
          "receiveStudentCode",
          (data: { code: string; studentId: string }) => {
            const { code, studentId } = data;
            setStudentsCodeContent((prevStudentsCodeContent) => ({
              ...prevStudentsCodeContent,
              [studentId]: { code: code, submission: "working" }, // Set the default value for submition
              //   [studentId]: code,
            }));
          }
        );

        socketRef.current.on(
          "studentSubmissionStatus",
          (data: { submissionStatus: string; studentId: string }) => {
            console.log("data on submmition", data);
            const { submissionStatus, studentId } = data;
            setStudentsCodeContent((prevStudentsCodeContent) => ({
              ...prevStudentsCodeContent,
              [studentId]: {
                ...prevStudentsCodeContent[studentId],
                submission: submissionStatus,
              }, // Set the default value for submition
              //   [studentId]: code,
            }));

            console.log(
              " a student has submitted his code :",
              submissionStatus
            );
          }
        );
      }
    });

    return () => {
      //   socketRef.current.emit("disconnect-room", codeTitle);
      socketRef.current.disconnect(); // Disconnect socket on unmount
    };
  }, []);

  const sendMessage = (code: string) => {
    socketRef.current.emit("sendStudentCode", { code, room: codeTitle });
  };

  const handleSubmissionCode = () => {
    const isGoodSubmission =
      normalizeText(codeContent) === normalizeText(solutionContent);

    console.log("isGoodSubmission", isGoodSubmission);

    const submissionStatus = isGoodSubmission
      ? "submittedCorrectly"
      : "submittedIncorrectly";
    setStudentSubmissionStatus(submissionStatus);
    socketRef.current.emit("studentSubmission", {
      submissionStatus,
      room: codeTitle,
    });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setCodeContent(value);
    sendMessage(value);
    setStudentSubmissionStatus("");
  };

  //   const highlightedHtml = hljs.highlightAuto(codeContent).value;
  //   const HighlightedSolutionHtml = hljs.highlightAuto(solutionContent).value;

  return (
    <>
      <div className="multipleCodesContainer">
        {!isMentor && (
          <>
            <h1 className="codeTitle">Student Code:</h1>
            <div className={`codeBlockContainer ${studentSubmissionStatus}`}>
              <pre className="highlightedCode">
                <code
                  dangerouslySetInnerHTML={{
                    __html: highlightedHtmlCode(codeContent),
                  }}
                />
              </pre>
              <textarea
                className="textCode"
                value={codeContent}
                onChange={handleCodeChange}
                readOnly={isMentor || false}
              />
            </div>
            <div className="centeredButtonContainer">
              <button
                className="submissionButton"
                onClick={handleSubmissionCode}
              >
                Submit
              </button>
            </div>
          </>
        )}

        {isMentor && (
          <>
            <h1 className="codeTitle">Solution Code:</h1>
            <div className="codeBlockContainer solution">
              <pre className="highlightedCode">
                <code
                  dangerouslySetInnerHTML={{
                    __html: highlightedHtmlCode(solutionContent),
                  }}
                />
              </pre>
              <textarea
                className="textCode"
                value={solutionContent}
                onChange={handleCodeChange}
                readOnly={true}
              />
            </div>
            {Object.entries(studentsCodeContent).map(([studentId, data]) => (
              <div key={studentId}>
                <h1 className="codeTitle">Student Code:</h1>
                <div className={`codeBlockContainer ${data.submission}`}>
                  <pre className="highlightedCode">
                    <code
                      dangerouslySetInnerHTML={{
                        __html: highlightedHtmlCode(data.code),
                      }}
                    />
                  </pre>
                  <textarea
                    className="textCode"
                    value={data.code}
                    // onChange={handleCodeChange}
                    readOnly={isMentor || true}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default CodeBlock;
