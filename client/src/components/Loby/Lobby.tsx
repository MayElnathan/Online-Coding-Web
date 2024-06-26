import { Link } from "react-router-dom";
import Card from "../Card/Card";
import "./Lobby.css";

const codeBlocksTitles = [
  "SocketIO-ServerSide",
  "InputFile-Component",
  "Axios-fetchData()",
  "Flatten-Nested-Array",
];

const Lobby: React.FC = () => {
  return (
    <Card>
      <h1>Choose Code Block</h1>
      <ul className="list-container">
        {codeBlocksTitles.flatMap((title, index) => {
          return (
            <Link key={index} to={`/code-block/${title}`} className="link">
              {title}
            </Link>
          );
        })}
      </ul>
    </Card>
  );
};

export default Lobby;
