"use client";

/**
 * The assistant's mascot: a friendly service robot holding up a phone.
 * Blinks, glances toward the phone, and the phone screen cycles through
 * a spec readout — a nod to what the assistant actually does.
 */
export default function AssistantBot({
  size = 28,
  animated = true,
}: {
  size?: number;
  animated?: boolean;
}) {
  return (
    <svg width={size} height={size * (52 / 48)} viewBox="0 0 48 52" fill="none" aria-hidden>
      <defs>
        <linearGradient id="bot-shell" x1="10" y1="10" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.82" />
        </linearGradient>
        <linearGradient id="bot-visor" x1="12" y1="17" x2="36" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0b1220" />
          <stop offset="1" stopColor="#1c2c48" />
        </linearGradient>
        <linearGradient id="bot-screen" x1="34" y1="22" x2="42" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#0071e3" />
        </linearGradient>
      </defs>

      {/* antenna */}
      <line x1="20" y1="3" x2="20" y2="8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="20" cy="2.6" r="2.3" fill="#22d3ee">
        {animated && <animate attributeName="r" values="2.3;2.9;2.3" dur="2s" repeatCount="indefinite" />}
        {animated && <animate attributeName="opacity" values="1;0.45;1" dur="2s" repeatCount="indefinite" />}
      </circle>

      {/* subtle idle bob for the whole robot */}
      <g>
        {animated && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -1.1; 0 0"
            dur="3.6s"
            repeatCount="indefinite"
          />
        )}

        {/* ears */}
        <rect x="4.5" y="18" width="4" height="8" rx="2" fill="currentColor" opacity="0.75" />
        <rect x="31.5" y="18" width="4" height="8" rx="2" fill="currentColor" opacity="0.75" />

        {/* head */}
        <rect x="7" y="8.5" width="26" height="20" rx="7.5" fill="url(#bot-shell)" />

        {/* visor */}
        <rect x="10.5" y="13.5" width="19" height="11" rx="5.5" fill="url(#bot-visor)" />

        {/* eyes — blink together, then glance right toward the phone */}
        <g>
          {animated && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; 0 0; 1.6 0; 1.6 0; 0 0"
              keyTimes="0;0.42;0.5;0.72;0.8"
              dur="5.6s"
              repeatCount="indefinite"
            />
          )}
          <ellipse cx="16.4" cy="19" rx="2.1" ry="2.4" fill="#22d3ee">
            {animated && (
              <animate
                attributeName="ry"
                values="2.4;2.4;0.3;2.4;2.4"
                keyTimes="0;0.86;0.9;0.94;1"
                dur="5.6s"
                repeatCount="indefinite"
              />
            )}
          </ellipse>
          <ellipse cx="23.6" cy="19" rx="2.1" ry="2.4" fill="#22d3ee">
            {animated && (
              <animate
                attributeName="ry"
                values="2.4;2.4;0.3;2.4;2.4"
                keyTimes="0;0.86;0.9;0.94;1"
                dur="5.6s"
                repeatCount="indefinite"
              />
            )}
          </ellipse>
        </g>

        {/* smile */}
        <path
          d="M17.2 25.6c1.4 1.2 5.2 1.2 6.6 0"
          stroke="white"
          strokeOpacity="0.5"
          strokeWidth="1.3"
          strokeLinecap="round"
        />

        {/* neck + shoulders */}
        <rect x="17.5" y="28" width="5" height="3" rx="1.4" fill="currentColor" opacity="0.6" />
        <path d="M11 33h18a4 4 0 014 4v9H7v-9a4 4 0 014-4z" fill="url(#bot-shell)" opacity="0.92" />

        {/* chest status light */}
        <circle cx="20" cy="39.5" r="2.6" fill="#0b1220" opacity="0.35" />
        <circle cx="20" cy="39.5" r="1.5" fill="#22d3ee">
          {animated && (
            <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
          )}
        </circle>

        {/* raised arm holding the phone */}
        <path
          d="M31 35c3.5 0 5.5-2.5 6.5-5.5"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* the phone */}
        <g>
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-7 39 27; 5 39 27; -7 39 27"
              dur="3.6s"
              repeatCount="indefinite"
            />
          )}
          <rect
            x="34.5"
            y="18"
            width="9.5"
            height="15"
            rx="2.4"
            fill="white"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect x="36" y="20" width="6.5" height="10.4" rx="1" fill="url(#bot-screen)" />
          {/* spec bars sweeping on the little screen */}
          <g fill="white" opacity="0.85">
            <rect x="37" y="22" width="4.5" height="1.1" rx="0.55">
              {animated && (
                <animate attributeName="width" values="1.5;4.5;2.5;4.5" dur="2.8s" repeatCount="indefinite" />
              )}
            </rect>
            <rect x="37" y="24.4" width="3" height="1.1" rx="0.55">
              {animated && (
                <animate attributeName="width" values="4.5;2;4.5;3" dur="2.8s" repeatCount="indefinite" />
              )}
            </rect>
            <rect x="37" y="26.8" width="4" height="1.1" rx="0.55">
              {animated && (
                <animate attributeName="width" values="2.5;4.5;1.8;4.5" dur="2.8s" repeatCount="indefinite" />
              )}
            </rect>
          </g>
          <circle cx="39.25" cy="31.6" r="0.65" fill="currentColor" opacity="0.5" />
        </g>
      </g>
    </svg>
  );
}
