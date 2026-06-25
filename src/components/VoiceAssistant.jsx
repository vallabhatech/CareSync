import { useState } from "react";
import { Fab, Snackbar } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import { useNavigate } from "react-router-dom";
function VoiceAssistant() {
    const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");

  const speak = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setMessage("Speech Recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);

    recognition.start();

    recognition.onresult = (event) => {
  const text = event.results[0][0].transcript.toLowerCase();

  setMessage(`You said: ${text}`);

  if (text.includes("dashboard")) {
    speak("Opening Dashboard");
    navigate("/dashboard");
  }

  else if (text.includes("medicine")) {
    speak("Opening Medicine Tracker");
    navigate("/medicine-tracker");
  }

  else if (text.includes("symptom")) {
    speak("Opening Symptom Checker");
    navigate("/symptom-checker");
  }

  else if (text.includes("clinic")) {
    speak("Opening Clinics Nearby");
    navigate("/clinics-nearby");
  }

  else if (text.includes("calculator")) {
    speak("dosage calculator");
    navigate("/dosage-calculator");
  }


  else if (text.includes("health")) {
    speak("health metrics");
    navigate("/health-metrics");
  }

  else if (text.includes("settings")) {
    speak("Opening Settings");
    navigate("/settings");
  }

  else if (text.includes("recommendations")) {
    speak("Opening recommendations");
    navigate("/recommendations");
  }

  else {
    speak("Sorry, I didn't understand.");
  }

  setListening(false);
};

    recognition.onerror = () => {
      setMessage("Could not recognize speech.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  return (
    <>
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