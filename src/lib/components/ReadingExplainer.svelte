<!-- @component
Conversation interface to explain the reading
-->
<script lang="ts">
  import { onMount } from "svelte";

  export let reading: any;

  let messages: Array<{ role: "user" | "assistant"; content: string }> = [];
  let userInput = "";
  let loading = false;
  let isSpeaking = false;
  let hasInitialized = false;
  let lastReadingTimestamp: string | null = null;
  let suggestionChips: string[] = [];
  let availableVoices: SpeechSynthesisVoice[] = [];

  const getCardPositions = () =>
    reading?.astroTarot?.interpretation?.positions || reading?.analysis?.cards || [];

  function buildOpeningMessage(): string {
    const question = reading?.meta?.question || "your question";
    const timeframe = reading?.meta?.timeframe || "the timeframe you selected";
    const cards = getCardPositions()
      .map((pos: any) => `${pos.position || ""}: ${pos.card || pos.name}`.trim())
      .filter(Boolean);
    const astroThemes = reading?.astroTarot?.astro_summary?.themes || [];
    const actions = reading?.astroTarot?.interpretation?.action_items || [];

    let opening = `I'm here to unpack this reading with you. We focused on "${question}" across ${timeframe}.`;

    if (cards.length > 0) {
      opening += ` The spread highlighted ${cards.join(", ")}.`;
    }

    if (astroThemes.length > 0) {
      opening += ` Cosmically, the big themes were ${astroThemes.join(", ")}.`;
    }

    if (actions.length > 0) {
      opening += ` Suggested next steps included ${actions.slice(0, 3).join(", ")}.`;
    }

    opening += " Ask about any card, astro influence, or how to apply the guidance.";

    return opening;
  }

  function refreshSuggestions() {
    const cards = getCardPositions().map((pos: any) => pos.card || pos.name).filter(Boolean);
    const astroThemes = reading?.astroTarot?.astro_summary?.themes || [];
    const actions = reading?.astroTarot?.interpretation?.action_items || [];

    const baseSuggestions: string[] = [];

    if (cards.length > 0) {
      baseSuggestions.push(`What does ${cards[0]} mean for me right now?`);
    }
    if (astroThemes.length > 0) {
      baseSuggestions.push(`How do the '${astroThemes[0]}' themes influence my path?`);
    }
    if (actions.length > 0) {
      baseSuggestions.push(`How can I take action on "${actions[0]}"?`);
    }
    if (reading?.astroTarot?.resonance?.matches?.length) {
      baseSuggestions.push("What strengths should I lean into from this reading?");
    }
    baseSuggestions.push("How do these cards connect to my question?");

    suggestionChips = baseSuggestions.slice(0, 4);
  }

  onMount(() => {
    const refreshVoices = () => {
      availableVoices = window.speechSynthesis.getVoices().filter(Boolean);
    };
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
    };
  });

  $: if (reading?.meta?.timestamp && reading.meta.timestamp !== lastReadingTimestamp) {
    lastReadingTimestamp = reading.meta.timestamp;
    hasInitialized = false;
    messages = [];
  }

  $: if (reading && !hasInitialized) {
    hasInitialized = true;
    refreshSuggestions();
    messages = [
      {
        role: "assistant",
        content: buildOpeningMessage(),
      },
    ];
  }

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
    utterance.rate = 0.85; // Slightly slower, more deliberate
    utterance.pitch = 0.65; // Lower pitch for older woman voice
    utterance.volume = 0.95;

    const voices = availableVoices.length > 0
      ? availableVoices
      : window.speechSynthesis.getVoices();

    // Prioritize older woman voice descriptors
    const olderWomanDescriptors = [
      'grandma',
      'grandmother',
      'elder',
      'mature',
      'senior',
      'old',
      'aged',
    ];

    const womanDescriptors = [
      'female',
      'woman',
      'lady',
      'mom',
      'mother',
    ];

    const qualityDescriptors = [
      'sage',
      'wise',
      'story',
      'narrator',
      'reader',
    ];

    const sanitize = (value: string) => value.toLowerCase();
    const isBritish = (voice: SpeechSynthesisVoice) => {
      const lang = sanitize(voice.lang || "");
      const name = sanitize(voice.name || "");
      return lang.includes("en-gb") || name.includes("brit") || name.includes("uk");
    };

    // Filter out male voices (including known male voice names)
    const isMale = (voice: SpeechSynthesisVoice) => {
      const name = sanitize(voice.name);
      return name.includes('male') ||
             name.includes('man') ||
             name.includes('boy') ||
             name.includes('david') ||
             name.includes('mark') ||
             name.includes('james') ||
             name.includes('george') ||
             name.includes('daniel') ||
             name.includes('michael') ||
             name.includes('christopher') ||
             name.includes('guy');
    };

    const usVoices = voices.filter(
      (voice) =>
        !isBritish(voice) &&
        !isMale(voice) &&
        sanitize(voice.lang || "").includes("en-us")
    );

    const allEnglishVoices = voices.filter(
      (voice) => !isBritish(voice) && !isMale(voice) && sanitize(voice.lang || "").startsWith("en")
    );

    // All available non-male voices
    const nonMaleVoices = voices.filter(voice => !isMale(voice));

    // Try to find voices in priority order
    const selectedVoice =
      usVoices.find((voice) =>
        olderWomanDescriptors.some((descriptor) => sanitize(voice.name).includes(descriptor))
      ) ||
      usVoices.find((voice) => {
        const name = sanitize(voice.name);
        return womanDescriptors.some(d => name.includes(d)) &&
               qualityDescriptors.some(d => name.includes(d));
      }) ||
      usVoices.find((voice) => {
        const name = sanitize(voice.name);
        return womanDescriptors.some(d => name.includes(d));
      }) ||
      usVoices[0] ||
      allEnglishVoices.find((voice) => {
        const name = sanitize(voice.name);
        return womanDescriptors.some(d => name.includes(d));
      }) ||
      allEnglishVoices[0] ||
      nonMaleVoices[0] ||
      voices[0];

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('ReadingExplainer - Selected voice:', selectedVoice.name, selectedVoice.lang);
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

  function useSuggestion(suggestion: string) {
    userInput = suggestion;
    sendMessage();
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

  {#if suggestionChips.length > 0}
    <div class="flex flex-wrap gap-2 mb-4">
      {#each suggestionChips as suggestion}
        <button
          type="button"
          class="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
          style="background-color: rgba(123, 97, 255, 0.15); color: #EDEBFF; border: 1px solid rgba(123, 97, 255, 0.5);"
          on:click={() => useSuggestion(suggestion)}
        >
          {suggestion}
        </button>
      {/each}
    </div>
  {/if}

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
