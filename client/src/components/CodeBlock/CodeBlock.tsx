import io from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import "highlight.js/styles/base16/atelier-dune-light.min.css";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "./CodeBlock.css";
import axios, { AxiosResponse } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Emoji from "../Emoji/Emoji";

const SOCKET_ADDRESS: string = import.meta.env.VITE_SOCKET_ADDRESS as string;
const APP_ADDRESS: string = import.meta.env.VITE_APP_ADDRESS as string;
axios.defaults.baseURL = APP_ADDRESS;

const baseCodeInstructions: string = "// add your code here";
const baseCodeSolution: string = "// this is the solution!";
const newStudentEntered: string = "// A new student entered this room!";

hljs.registerLanguage("javascript", javascript);

const highlightedHtmlCode = (code: string): string => {
  return hljs.highlightAuto(code).value;
};

const normalizeText = (input: string): string => {
  const trimmedText: string = input.trim();
  const singleSpaceText: string = trimmedText.replace(/\s{2,}/g, " ");
  const singleNewlineText: string = singleSpaceText.replace(/\n{2,}/g, "\n");
  return singleNewlineText;
};

interface StudentsCodeContent {
  [key: string]: { code: string; submission: string };
}

const CodeBlock: React.FC = () => {
  const navigate = useNavigate();
  const { codeTitle } = useParams();
  const [isMentor, setIsMentor] = useState<boolean | null>(null);
  const socketRef = useRef<any>(null);

  // student states:
  const [codeContent, setCodeContent] = useState<string>(baseCodeInstructions);
  const [studentSubmissionStatus, setStudentSubmissionStatus] =
    useState<string>("");

  //mentor states:
  const [studentsCodeContent, setStudentsCodeContent] = useState<StudentsCodeContent>({});
  const [solutionContent, setSolutionContent] = useState<string>(baseCodeSolution);

  const handleGoBackToLobby = () => {
    navigate("/");
  };

  useEffect(() => {
    const fetchSolution = async (codeTitle: string): Promise<void> => {
      try {
        const response: AxiosResponse = await axios.get(`/code/${codeTitle}`);
        const { solutionCode, initCode } = response.data;
        setSolutionContent(solutionCode);
        setCodeContent(initCode);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchSolution(codeTitle as string);

    socketRef.current = io(SOCKET_ADDRESS, {
      extraHeaders: {
        "Access-Control-Allow-Origin": "*",
      },
    });

    socketRef.current.emit("joinRoom", codeTitle);

    socketRef.current.on("isMentor", (isMentorResponse: boolean) => {
      setIsMentor(isMentorResponse);
      console.log(`i am a ${isMentorResponse ? "Mentor" : "Student"}`);
      socketRef.current.off("isMentor");

      // only the mentor listen on others students code
      if (isMentorResponse) {
        socketRef.current.on(
          "receiveStudentCode",
          (data: { code: string; studentId: string }) => {
            const { code, studentId } = data;
            setStudentsCodeContent((prevStudentsCodeContent) => ({
              ...prevStudentsCodeContent,
              [studentId]: { code: code, submission: "" },
            }));
          }
        );

        socketRef.current.on(
          "studentSubmissionStatus",
          (data: { submissionStatus: string; studentId: string }) => {
            const { submissionStatus, studentId } = data;
            setStudentsCodeContent((prevStudentsCodeContent) => ({
              ...prevStudentsCodeContent,
              [studentId]: {
                ...prevStudentsCodeContent[studentId],
                submission: submissionStatus,
              },
            }));
          }
        );

        socketRef.current.on("studentEnterCodeBlock", (studentId: string) => {
          setStudentsCodeContent((prevStudentsCodeContent) => ({
            ...prevStudentsCodeContent,
            [studentId]: { code: newStudentEntered, submission: "" },
          }));
        });

        socketRef.current.on("studentLeftRoom", (studentId: string) => {
          setStudentsCodeContent((prevStudentsCodeContent) => {
            const { [studentId]: _, ...rest } = prevStudentsCodeContent;
            return rest;
          });
        });
      }
    });

    return () => {
      if (!isMentor) {
        socketRef.current.emit("studentLeftCodeBlock", {
          room: codeTitle,
          studentId: socketRef.current.id,
        });
      }
      // Disconnect socket on unmount
      socketRef.current.disconnect();
    };
  }, []);

  const sendMessage = (code: string): void => {
    socketRef.current.emit("sendStudentCode", { code, room: codeTitle });
  };

  const handleSubmissionCode = () => {
    const isGoodSubmission: boolean =
      normalizeText(codeContent) === normalizeText(solutionContent);

    const submissionStatus: string = isGoodSubmission
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

  return (
    <>
      <div className="multipleCodesContainer">
        <div className="titleHeaders">
          <h1 className="greeting">
            Hello {isMentor !== null && (isMentor ? "Mentor" : "Student")},
          </h1>
          <button className="backToLobby" onClick={handleGoBackToLobby}>
            back to lobby
          </button>
        </div>
        {!isMentor && (
          // rendering the student code block
          <>
            <h1 className="codeTitle">{codeTitle} Code:</h1>
            <Emoji submissionStatus={studentSubmissionStatus}></Emoji>
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
                readOnly={false}
              />
            </div>
            {/* <Emoji submissionStatus={studentSubmissionStatus}></Emoji> */}
            {isMentor !== null && (
              <div className="centeredButtonContainer">
                <button
                  className="submissionButton"
                  onClick={handleSubmissionCode}
                >
                  Submit
                </button>
              </div>
            )}
          </>
        )}

        {isMentor && (
          // rendering the mentor code block
          <>
            <h1 className="codeTitle">{codeTitle} Solution:</h1>
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
            <hr className="divider"></hr>
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
                    readOnly={true}
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
