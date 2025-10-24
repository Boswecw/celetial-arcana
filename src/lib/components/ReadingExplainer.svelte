<!-- @component
Conversation interface to explain the reading
-->
<script lang="ts">
  export let reading: any;

  let messages: Array<{ role: "user" | "assistant"; content: string }> = [];
  let userInput = "";
  let loading = false;
  let isSpeaking = false;

  async function sendMessage() {
    if (!userInput.trim()) return;

    // Add user message
    const userMessage = userInput.trim();
    messages = [...messages, { role: "user", content: userMessage }];
    userInput = "";
    loading = true;

    try {
      const response = await fetch("/api/reading-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reading,
          userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get explanation");
      }

      const data = await response.json();
      messages = [...messages, { role: "assistant", content: data.explanation }];

      // Auto-speak the response
      if ("speechSynthesis" in window) {
        speakMessage(data.explanation);
      }
    } catch (error) {
      console.error("Error:", error);
      messages = [
        ...messages,
        {
          role: "assistant",
          content: "I encountered an error explaining the reading. Please try again.",
        },
      ];
    } finally {
      loading = false;
    }
  }

  function speakMessage(text: string) {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      return;
    }

    isSpeaking = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find((voice) =>
      voice.name.includes("Female") || voice.name.includes("female")
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onend = () => {
      isSpeaking = false;
    };

    utterance.onerror = () => {
      isSpeaking = false;
    };

    window.speechSynthesis.speak(utterance);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="card-surface p-8 rounded-2xl mt-8">
  <h3 class="text-2xl font-bold mb-6" style="color: #C6A7FF;">
    💬 Ask About Your Reading
  </h3>

  <!-- Messages -->
  <div
    class="space-y-4 mb-6 p-4 rounded-lg overflow-y-auto"
    style="background-color: rgba(123, 97, 255, 0.05); max-height: 400px; border: 1px solid #7B61FF;"
  >
    {#if messages.length === 0}
      <p style="color: #B3A9C7; text-align: center;">
        Ask me anything about your reading...
      </p>
    {/if}

    {#each messages as message}
      <div class="mb-4">
        <div
          class="text-sm font-semibold mb-2"
          style="color: {message.role === 'user' ? '#7B61FF' : '#FF4EDB'};"
        >
          {message.role === "user" ? "You" : "Celestia"}
        </div>
        <div
          class="p-3 rounded-lg"
          style="background-color: {message.role === 'user'
            ? 'rgba(123, 97, 255, 0.1)'
            : 'rgba(255, 78, 219, 0.1)'}; color: #EDEBFF;"
        >
          {message.content}
        </div>
      </div>
    {/each}

    {#if loading}
      <div class="text-center py-4">
        <p style="color: #C6A7FF;">✨ Celestia is thinking...</p>
      </div>
    {/if}
  </div>

  <!-- Input -->
  <div class="space-y-3">
    <textarea
      bind:value={userInput}
      on:keydown={handleKeydown}
      placeholder="What does this card mean? How should I interpret this? What's the connection between...?"
      class="w-full p-4 rounded-lg bg-opacity-50 border-2 focus:outline-none text-base"
      style="background-color: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #EDEBFF;"
      rows="3"
      disabled={loading}
    ></textarea>

    <div class="flex gap-3">
      <button
        on:click={sendMessage}
        disabled={loading || !userInput.trim()}
        class="flex-1 py-3 px-6 rounded-lg font-bold transition-all duration-200"
        style="background-color: #7B61FF; color: #EDEBFF; opacity: {loading || !userInput.trim()
          ? 0.6
          : 1}; cursor: {loading || !userInput.trim() ? 'not-allowed' : 'pointer'};"
      >
        {loading ? "💭 Thinking..." : "📤 Ask"}
      </button>

      {#if messages.length > 0 && messages[messages.length - 1].role === "assistant"}
        <button
          on:click={() => speakMessage(messages[messages.length - 1].content)}
          class="px-6 py-3 rounded-lg font-bold transition-all duration-200"
          style="background-color: #FF4EDB; color: #EDEBFF; opacity: {isSpeaking ? 0.7 : 1}; cursor: pointer;"
        >
          {isSpeaking ? "🔇 Stop" : "🔊 Listen"}
        </button>
      {/if}
    </div>
  </div>

  <p class="text-sm mt-4" style="color: #B3A9C7;">
    💡 Tip: Ask about specific cards, what themes mean, or how to apply the guidance.
  </p>
</div>

<style>
  textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>

