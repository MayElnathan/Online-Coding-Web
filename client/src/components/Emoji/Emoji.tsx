import "./Emoji.css";
import happyEmoji from "../../../public/happy-emoji.png";
import sadEmoji from "../../../public/sad-emoji.png";

interface CardProps {
  submissionStatus: string;
}

const Emoji: React.FC<CardProps> = ({ submissionStatus }) => {
    const goodSubmission = <img className="image" src={happyEmoji} alt="submit correctly! :)" />
    const badSubmission = <img className="image" src={sadEmoji} alt="submit incorrectly! :(" />
  return (
    <div className="emoji-container">
      {submissionStatus === "submittedCorrectly" && goodSubmission}
      {submissionStatus === "submittedIncorrectly" && badSubmission}
    </div>
  );
};

export default Emoji;
