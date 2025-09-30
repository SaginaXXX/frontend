import { useCallback } from "react";
import { useWebSocket } from "@/context/websocket-context";
import { useMediaCapture } from "@/hooks/utils/use-media-capture";

export const useSendAudio = () => {
  const { sendMessage } = useWebSocket();
  void useMediaCapture; // Image capture disabled

  const sendAudioPartition = useCallback(
    async (audio: Float32Array) => {
      const chunkSize = 16384; // larger chunks to reduce WS frames

      // Send the audio data in chunks
      for (let index = 0; index < audio.length; index += chunkSize) {
        const endIndex = Math.min(index + chunkSize, audio.length);
        const chunk = audio.slice(index, endIndex);
        sendMessage({
          type: "mic-audio-data",
          audio: Array.from(chunk),
          // Only send images with first chunk
        });
      }

      // Send end signal after all chunks (no images)
      sendMessage({ type: "mic-audio-end" });
    },
    [sendMessage],
  );

  return {
    sendAudioPartition,
  };
}
