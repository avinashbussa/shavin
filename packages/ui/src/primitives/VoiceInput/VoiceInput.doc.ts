import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "VoiceInput",
  description: "Voice-to-text control for a composer: idle mic, microphone permission wait, live waveform with timer, transcribing and error.",
  features: [
    "state: idle, requesting, listening, transcribing, error",
    "level (0-1) drives the waveform, omit for a gentle pulse",
    "Cancel discards, Stop sends"
],
  accessibility: [
    "Every icon button has an aria-label",
    "Requesting and transcribing use role=status, error uses role=alert",
    "Waveform is decorative (aria-hidden)"
],
  keyboard: "Tab to Discard or Stop and send, Enter or Space to activate.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Own the MediaRecorder and speech logic in your app, VoiceInput is the visual state only." },
      { guidance: false, description: "Do not start recording on mount, always require a user click." }
    ]
  },
  examples: [
    {
      title: "Listening",
      code: '<VoiceInput state="listening" level={0.6} elapsed="0:07" onStop={() => {}} onCancel={() => {}} />',
    },
  ]
};
