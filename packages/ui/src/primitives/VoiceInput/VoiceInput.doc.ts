import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "VoiceInput",
  description: "Voice-to-text control for a composer: idle mic, microphone permission wait, live waveform with timer, transcribing and error.",
  features: [
    "state: idle, requesting, listening, transcribing, processing, error. processing is the step after transcribing, when the app acts on what was said",
    "mode: push-to-send (default, waveform plus a send arrow) or hands-free (voice-activity detection, no send; a centred Murmur stack that fits a side panel)",
    "description is a quiet context line, e.g. what a voice command will act on",
    "The transcript wraps to two lines instead of truncating, at any container width",
    "onCancel adds a cancel button while requesting, transcribing and processing",
    "level (0-1) drives the waveform, omit for a gentle pulse",
    "Cancel discards, Stop sends"
],
  accessibility: [
    "Every icon button has an aria-label",
    "Requesting, transcribing and processing use role=status, error uses role=alert",
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
      title: "Hands-free dock",
      code: '<VoiceInput mode="hands-free" state="listening" level={0.4} transcript="make this heading bigger" description="Pointing at Hero heading" onStop={() => {}} />',
    },
    {
      title: "Listening",
      code: '<VoiceInput state="listening" level={0.6} elapsed="0:07" onStop={() => {}} onCancel={() => {}} />',
    },
  ]
};
