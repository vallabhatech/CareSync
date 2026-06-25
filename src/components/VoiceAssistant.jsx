import { useState } from "react";
import { Fab, Snackbar, Tooltip } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import { useNavigate } from "react-router-dom";

const COMMANDS = [
  {
    keywords: ["dashboard"],
    path: "/dashboard",
    message: "Opening Dashboard",
  },
  {
    keywords: ["medicine", "medicines"],
    path: "/medicine-tracker",
    message: "Opening Medicine Tracker",
  },
  {
    keywords: ["symptom", "symptoms"],
    path: "/symptom-checker",
    message: "Opening Symptom Checker",
  },
  {
    keywords: ["clinic", "clinics"],
    path: "/clinics-nearby",
    message: "Opening Clinics Nearby",
  },
  {
    keywords: ["calculator", "dosage"],
    path: "/dosage-calculator",
    message: "Opening Dosage Calculator",
  },
  {
    keywords: ["health", "metrics"],
    path: "/health-metrics",
    message: "Opening Health Metrics",
  },
  {
    keywords: ["setting", "settings"],
    path: "/settings",
    message: "Opening Settings",
  },
];

function VoiceAssistant() {
  const navigate = useNavigate();

  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");

  const speak = (text) => {
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  };

  const handleCommand = (text) => {
    const command = COMMANDS.find(({ keywords }) =>
      keywords.some((keyword) => text.includes(keyword))
    );

    if (!command) {
      speak(
        "Sorry, I didn't understand."
      );
      return;
    }

    speak(command.message);
    navigate(command.path);
  };

  const startListening = () => {
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
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  return (
    <>
      <Tooltip title={listening ? "Listening..." : "Voice Assistant"}>
        <Fab
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