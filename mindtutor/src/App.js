import React, { useEffect, useState } from "react";
import ImportTab from "./components/ImportTab";
import ChatTab from "./components/ChatTab";
import QuizTab from "./components/QuizTab";
import LessonTab from "./components/LessonTab";
import DiagnosticsTab from "./components/DiagnosticsTab";
import AIKeyInput from "./components/AIKeyInput";
import { loadAllTopics } from "./utils/storage";

const TABS = ["Import", "Lessons", "Chat", "Quiz", "Diagnostics"];

export default function App() {
  const [active, setActive] = useState("Import");
  const [topics, setTopics] = useState({});
  const [apiKey, setApiKey] = useState(localStorage.getItem("mindtutor_apikey") || "");
  useEffect(() => {
    setTopics(loadAllTopics());
  }, []);
  function refresh() {
    setTopics(loadAllTopics());
  }
  return <div>App</div>;
}