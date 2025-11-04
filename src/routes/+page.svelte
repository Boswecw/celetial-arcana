<div class="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden" style="background: linear-gradient(135deg, #0B0724 0%, #17133A 100%);">
  <style>
    .star {
      position: absolute;
      width: 2px;
      height: 2px;
      background: white;
      border-radius: 50%;
      pointer-events: none;
    }

    .bright-star {
      position: absolute;
      pointer-events: none;
      animation: twinkle 2s ease-in-out infinite;
    }

    .hero-star {
      pointer-events: none;
      position: absolute;
      width: clamp(28px, 4vw, 44px);
      height: clamp(28px, 4vw, 44px);
      right: clamp(-10px, -1vw, -20px);
      top: clamp(-12px, -1vw, -32px);
    }

    @keyframes twinkle {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  </style>

  <!-- Scattered Stars Background -->
  <div class="star" style="top: 8%; left: 10%; opacity: 0.8;"></div>
  <div class="star" style="top: 12%; left: 15%; opacity: 0.6;"></div>
  <div class="star" style="top: 20%; left: 8%; opacity: 0.5;"></div>
  <div class="star" style="top: 15%; left: 22%; opacity: 0.7;"></div>
  <div class="star" style="top: 35%; left: 5%; opacity: 0.6;"></div>
  <div class="star" style="top: 45%; left: 18%; opacity: 0.5;"></div>
  <div class="star" style="top: 10%; left: 85%; opacity: 0.7;"></div>
  <div class="star" style="top: 18%; left: 92%; opacity: 0.6;"></div>
  <div class="star" style="top: 28%; left: 88%; opacity: 0.5;"></div>
  <div class="star" style="top: 35%; left: 95%; opacity: 0.7;"></div>
  <div class="star" style="top: 42%; left: 80%; opacity: 0.6;"></div>
  <div class="star" style="top: 5%; left: 45%; opacity: 0.8;"></div>
  <div class="star" style="top: 8%; left: 55%; opacity: 0.6;"></div>
  <div class="star" style="top: 15%; left: 40%; opacity: 0.5;"></div>
  <div class="star" style="top: 20%; left: 60%; opacity: 0.7;"></div>
  <div class="star" style="top: 85%; left: 50%; opacity: 0.6;"></div>
  <div class="star" style="top: 75%; left: 25%; opacity: 0.5;"></div>
  <div class="star" style="top: 80%; left: 75%; opacity: 0.7;"></div>
  <div class="star" style="top: 65%; left: 12%; opacity: 0.6;"></div>
  <div class="star" style="top: 70%; left: 88%; opacity: 0.5;"></div>
  <div class="star" style="top: 25%; left: 30%; opacity: 0.6;"></div>
  <div class="star" style="top: 30%; left: 70%; opacity: 0.5;"></div>
  <div class="star" style="top: 50%; left: 35%; opacity: 0.7;"></div>
  <div class="star" style="top: 55%; left: 65%; opacity: 0.6;"></div>
  <div class="star" style="top: 55%; left: 20%; opacity: 0.5;"></div>
  <div class="star" style="top: 50%; left: 80%; opacity: 0.6;"></div>
  <div class="star" style="top: 70%; left: 42%; opacity: 0.5;"></div>
  <div class="star" style="top: 65%; left: 58%; opacity: 0.7;"></div>
  <div class="star" style="top: 90%; left: 15%; opacity: 0.6;"></div>
  <div class="star" style="top: 88%; left: 85%; opacity: 0.5;"></div>
  <div class="star" style="top: 40%; left: 50%; opacity: 0.6;"></div>
  <div class="star" style="top: 35%; left: 25%; opacity: 0.5;"></div>
  <div class="star" style="top: 45%; left: 75%; opacity: 0.7;"></div>
  <div class="star" style="top: 60%; left: 40%; opacity: 0.6;"></div>
  <div class="star" style="top: 75%; left: 60%; opacity: 0.5;"></div>

  <div class="max-w-4xl mx-auto text-center space-y-8 relative z-10">
    <!-- Hero Title -->
    <div class="space-y-4 relative">
      <div class="inline-flex items-center justify-center">
        <img
          src="/Celestia_Arcana_banner.png"
          alt="Celestia Arcana"
          class="h-12 sm:h-16 md:h-20 lg:h-24 w-auto max-w-full"
        />
      </div>
      <p class="text-xl md:text-2xl" style="color: #C6A7FF;">
        Discover the cosmic wisdom of tarot, guided by the stars
      </p>
    </div>

    <!-- Description -->
    <div class="space-y-4 max-w-2xl mx-auto" style="color: #B3A9C7;">
      <p class="text-lg">
        Celestia Arcana combines ancient tarot wisdom with modern astrology to provide personalized readings aligned with celestial movements.
      </p>
      <p class="text-lg">
        Each card drawn is influenced by the positions of the stars and planets, creating a unique connection between the cosmos and your destiny.
      </p>
    </div>

    <!-- CTA Buttons -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center pt-8">
      <a
        href="/deck"
        class="cta-primary"
      >
        Explore the Deck
      </a>
      <a
        href="/reading"
        class="cta-secondary"
      >
        Start a Reading
      </a>
      <a
        href="/alignment"
        class="cta-secondary"
      >
        View Your Chart
      </a>
      <a
        href="/dashboard"
        class="cta-secondary"
      >
        AI Dashboard
      </a>
    </div>

    <!-- Features Grid -->
    <div class="grid md:grid-cols-3 gap-6 pt-12">
      <!-- Feature 1 -->
      <div class="card-surface p-8 space-y-4">
        <div class="text-4xl mb-2">✨</div>
        <h3 class="text-2xl font-bold bg-gradient-to-r from-[#C6A7FF] to-[#7B61FF] bg-clip-text text-transparent">78 Sacred Cards</h3>
        <p class="text-base leading-relaxed" style="color: #C6A7FF;">
          The complete Rider-Waite-Smith deck with upright and reversed interpretations
        </p>
      </div>

      <!-- Feature 2 -->
      <div class="card-surface p-8 space-y-4">
        <div class="text-4xl mb-2">🌙</div>
        <h3 class="text-2xl font-bold bg-gradient-to-r from-[#FF4EDB] to-[#C6A7FF] bg-clip-text text-transparent">Cosmic Alignment</h3>
        <p class="text-base leading-relaxed" style="color: #C6A7FF;">
          Readings influenced by real celestial positions and planetary movements
        </p>
      </div>

      <!-- Feature 3 -->
      <div class="card-surface p-8 space-y-4">
        <div class="text-4xl mb-2">🔮</div>
        <h3 class="text-2xl font-bold bg-gradient-to-r from-[#4DF2B0] to-[#7B61FF] bg-clip-text text-transparent">AI Insights</h3>
        <p class="text-base leading-relaxed" style="color: #C6A7FF;">
          Personalized interpretations powered by advanced AI analysis
        </p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-8 pt-12 text-center w-full">
      <div>
        <p class="text-4xl font-bold" style="color: #7B61FF;">78</p>
        <p style="color: #B3A9C7;">Tarot Cards</p>
      </div>
      <div>
        <p class="text-4xl font-bold" style="color: #FF4EDB;">∞</p>
        <p style="color: #B3A9C7;">Possible Readings</p>
      </div>
      <div>
        <p class="text-4xl font-bold" style="color: #4DF2B0;">100%</p>
        <p style="color: #B3A9C7;">Cosmic Accuracy</p>
      </div>
    </div>
  </div>
</div>
