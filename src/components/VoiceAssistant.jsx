import { useState } from "react";
import { Fab, Snackbar, Tooltip } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import { useNavigate } from "react-router-dom";

const COMMANDS = {
  dashboard: "/dashboard",
  medicine: "/medicine-tracker",
  medicines: "/medicine-tracker",
  symptom: "/symptom-checker",
  symptoms: "/symptom-checker",
  clinic: "/clinics-nearby",
  clinics: "/clinics-nearby",
  calculator: "/dosage-calculator",
  dosage: "/dosage-calculator",
  health: "/health-metrics",
  metrics: "/health-metrics",
  setting: "/settings",
  settings: "/settings",
};

function VoiceAssistant() {
  const navigate = useNavigate();

  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";

    window.speechSynthesis.speak(speech);
  };

  const handleCommand = (text) => {
    const keyword = Object.keys(COMMANDS).find((word) =>
      text.includes(word)
    );

    if (!keyword) {
      speak("Sorry, I didn't understand.");
      return;
    }

    const path = COMMANDS[keyword];

    const pageName = path
      .replace("/", "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    speak(`Opening ${pageName}`);
    navigate(path);
  };

  const startListening = () => {
    if (listening) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    setListening(true);
    recognition.start();

    recognition.onresult = ({ results }) => {
      const text = results[0][0].transcript.toLowerCase();

      setMessage(`You said: ${text}`);
      handleCommand(text);
    };

    recognition.onerror = () => {
      setMessage("Could not recognize speech.");
      speak("Sorry, I could not recognize your voice.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  return (
    <>
      <Tooltip title={listening ? "Listening..." : "Voice Assistant"}>
        <Fab
          aria-label="voice assistant"
          color={listening ? "secondary" : "primary"}
          onClick={startListening}
          sx={{
            position: "fixed",
            bottom: 80,
            right: 28,
            zIndex: 9999,
          }}
        >
          <MicIcon />
        </Fab>
      </Tooltip>

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={3000}
        onClose={() => setMessage("")}
        message={message}
      />
    </>
  );
}

export default VoiceAssistant;