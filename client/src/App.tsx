import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lobby from "./components/Loby/Lobby";
import CodeBlock from "./components/CodeBlock/CodeBlock";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/code-block/:codeTitle" element={<CodeBlock />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
