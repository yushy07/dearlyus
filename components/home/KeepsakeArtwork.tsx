/** Small paper objects drawn with native elements, rather than generic feature icons. */
export function KeepsakeArtwork({
  kind,
}: {
  kind: 'letter' | 'scrapbook' | 'gift';
}) {
  return (
    <span className={`keepsake-art keepsake-art--${kind}`} aria-hidden="true">
      {kind === 'letter' && (
        <>
          <span className="letter-note">
            to us,
            <br />
            <em>years from now.</em>
            <small>some things are worth keeping.</small>
          </span>
          <span className="letter-envelope">
            <i>♡</i>
          </span>
        </>
      )}
      {kind === 'scrapbook' && (
        <>
          <span className="scrap-photo scrap-photo--back">
            <img src="/photos/frame2.webp" alt="" loading="lazy" />
            <small>you + me</small>
          </span>
          <span className="scrap-photo scrap-photo--front">
            <img src="/photos/frame1.webp" alt="" loading="lazy" />
            <small>one for the memories.</small>
          </span>
        </>
      )}
      {kind === 'gift' && (
        <>
          <span className="gift-note">
            <small>FOR MY FAVOURITE PERSON</small>
            <em>
              Today is
              <br />
              all yours.
            </em>
            <span>with all my love, ♡</span>
          </span>
          <svg className="gift-ribbon" viewBox="0 0 240 140" fill="none">
            <path
              d="M120 68C67 12 31 19 45 47S93 76 120 68C158 6 203 21 187 48S139 77 120 68ZM117 71C101 104 65 103 69 130M123 71C140 105 173 96 167 133"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M112 65Q120 59 128 67L124 76 114 76Z"
              fill="currentColor"
            />
          </svg>
        </>
      )}
    </span>
  );
}
