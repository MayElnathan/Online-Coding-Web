import io from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import "highlight.js/styles/base16/atelier-dune-light.min.css";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "./CodeBlock.css";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Emoji from "../Emoji/Emoji";

const SOCKET_ADDRESS = import.meta.env.VITE_SOCKET_ADDRESS;
const APP_ADDRESS = import.meta.env.VITE_APP_ADDRESS;
axios.defaults.baseURL = APP_ADDRESS;

const baseCodeInstructions = "// add your code here";
const baseCodeSolution = "// this is the solution!";
const newStudentEntered = "// A new student entered this room!";

hljs.registerLanguage("javascript", javascript);

const highlightedHtmlCode = (code: string) => {
  return hljs.highlightAuto(code).value;
};

const normalizeText = (input: string) => {
  const trimmedText = input.trim();
  const singleSpaceText = trimmedText.replace(/\s{2,}/g, " ");
  const singleNewlineText = singleSpaceText.replace(/\n{2,}/g, "\n");
  return singleNewlineText;
};

const CodeBlock: React.FC = () => {
  const navigate = useNavigate();
  const { codeTitle } = useParams();
  const [isMentor, setIsMentor] = useState(false);
  const socketRef = useRef<any>(null);

  // student states:
  const [codeContent, setCodeContent] = useState<string>(baseCodeInstructions);
  const [studentSubmissionStatus, setStudentSubmissionStatus] =
    useState<string>("");

  //mentor states:
  const [studentsCodeContent, setStudentsCodeContent] = useState<{
    [key: string]: { code: string; submission: string };
  }>({});
  const [solutionContent, setSolutionContent] =
    useState<string>(baseCodeSolution);

  const handleGoBackToLobby = () => {
    navigate("/");
  };

  useEffect(() => {
    const fetchSolution = async (codeTitle: string) => {
      try {
        const response = await axios.get(`/code/${codeTitle}`);
        const { solutionCode, initCode } = response.data;
        setSolutionContent(solutionCode);
        setCodeContent(initCode);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchSolution(codeTitle as string);
    // socketRef.current = io(`216.24.57.4:8080`, {
    //     withCredentials: true,
    //     extraHeaders: {
    //       "Access Control Allow Origin": "sad",
    //     },
    //   });

    socketRef.current = io(SOCKET_ADDRESS
    //     , {
    //   withCredentials: true,
    //   extraHeaders: {
    //     "Access-Control-Allow-Origin": "fghfhg.com",
    //   },
    // }
    );

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

        //   }else{
        //     socketRef.current.on("disconnect", () => {
        //         // if (isMentor) {
        //         //   handleGoBackToLobby();
        //         // } else {
        //           alert("The mentor has left the room!");
        //           handleGoBackToLobby();
        //         // }
        //       });
      }
    });

    // socketRef.current.on("disconnect", () => {
    //   if (isMentor) {
    //     handleGoBackToLobby();
    //   } else {
    //     alert("The mentor has left the room!");
    //     handleGoBackToLobby();
    //   }
    // });

    return () => {
      if (!isMentor) {
        socketRef.current.emit("studentLeftCodeBlock", {
          room: codeTitle,
          studentId: socketRef.current.id,
        });
      }
      //   else {
      //     socketRef.current.emit("mentorLeftCodeBlock", codeTitle);
      //   }
      socketRef.current.disconnect(); // Disconnect socket on unmount
    };
  }, []);

  const sendMessage = (code: string) => {
    socketRef.current.emit("sendStudentCode", { code, room: codeTitle });
  };

  const handleSubmissionCode = () => {
    const isGoodSubmission =
      normalizeText(codeContent) === normalizeText(solutionContent);

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

  return (
    <>
      <div className="multipleCodesContainer">
        <div className="titleHeaders">
          <h1 className="greeting">Hello {isMentor ? "Mentor" : "Student"},</h1>
          <button className="backToLobby" onClick={handleGoBackToLobby}>
            back to lobby
          </button>
        </div>
        {!isMentor && (
          <>
            <h1 className="codeTitle">{codeTitle} Code:</h1>
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
            <Emoji submissionStatus={studentSubmissionStatus}></Emoji>
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
