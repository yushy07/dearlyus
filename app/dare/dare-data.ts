export type DareDeckId = 'playful' | 'romantic' | 'deep' | 'chaotic' | 'spicy';

export const DARE_DECKS: Record<
  DareDeckId,
  {
    name: string;
    note: string;
    mark: string;
    truths: string[];
    dares: string[];
  }
> = {
  playful: {
    name: 'Playful',
    mark: 'ribbon',
    note: 'Silly confessions and camera-friendly dares.',
    truths: [
      'What tiny habit of mine makes you smile every time?',
      'What was your most inaccurate first impression of me?',
      'Which of our inside jokes would be impossible to explain?',
      'What is the funniest thing you have done because you missed me?',
      'What nickname for me have you never admitted you considered?',
      'Which one of us would survive a terrible road trip better?',
    ],
    dares: [
      'Imitate how I answer a video call when I am sleepy.',
      'Make up a ten-second theme song for our relationship.',
      'Find the strangest object within reach and sell it to me like an advert.',
      'Send me a selfie with your most dramatic missing-you face.',
      'Speak like a royal narrator until the next bottle spin.',
      'Recreate my favourite expression without saying what it is.',
    ],
  },
  romantic: {
    name: 'Romantic',
    mark: 'heart',
    note: 'Warm questions and little across-the-miles gestures.',
    truths: [
      'Which ordinary moment with me do you wish you could replay tonight?',
      'What song feels most like us right now?',
      'When did the distance make you realise how much I matter?',
      'What detail about our next reunion have you imagined most?',
      'What do I do that makes you feel chosen?',
      'What is one future tradition you want us to create?',
    ],
    dares: [
      'Send a voice note describing our next hug in exactly fifteen seconds.',
      'Hold a heart toward the camera and dedicate it to one memory.',
      'Choose a song for our next virtual slow dance and play ten seconds.',
      'Write me a one-line promise and show it to the camera.',
      'Give me a sincere compliment you have never used before.',
      'Plan the first thirty minutes of our next day together out loud.',
    ],
  },
  deep: {
    name: 'Closer',
    mark: 'moon',
    note: 'Honest questions with room to listen.',
    truths: [
      'What helps you feel close to me on a difficult day apart?',
      'What part of our future feels most exciting and most uncertain?',
      'When do you feel most understood by me?',
      'What would make our distance feel lighter this month?',
      'What have we handled better than you expected?',
      'What do you want us to protect as life changes?',
    ],
    dares: [
      'Look into the camera quietly for fifteen seconds, then say what you felt.',
      'Name three things we are doing well and one thing we can improve gently.',
      'Put our next meaningful check-in on your calendar now.',
      'Describe the homecoming scene you picture most often.',
      'Tell me one way I helped you grow without realising it.',
      'Finish this sentence: even from here, I choose us because…',
    ],
  },
  chaotic: {
    name: 'Chaotic',
    mark: 'spark',
    note: 'Fast, ridiculous and proudly unserious.',
    truths: [
      'What is your most embarrassing unsent message to me?',
      'Which one of my outfits would you ban for comic reasons?',
      'What absurd conspiracy about us could almost be believable?',
      'What is the weirdest snack you would make me try?',
      'Which one of us would lose a reality show first and why?',
      'What harmless lie did you tell to look cooler around me?',
    ],
    dares: [
      'Do a runway walk using only the space visible on camera.',
      'Deliver a weather report about my current mood.',
      'Balance something on your head through the next spin.',
      'Invent a ridiculous couple handshake and teach it through the screen.',
      'Perform a silent dramatic scene until I guess what happened.',
      'Use three random objects to recreate our first date.',
    ],
  },
  spicy: {
    name: 'After Dark',
    mark: 'flame',
    note: 'Flirty prompts unlocked only when both agree.',
    truths: [
      'What do you miss most about being physically close to me?',
      'Which outfit of mine stays in your mind the longest?',
      'What is the first affectionate thing you want at our reunion?',
      'What kind of date-night atmosphere makes you feel most romantic?',
      'What compliment from me makes you blush fastest?',
      'Which kiss from our story would you replay?',
    ],
    dares: [
      'Whisper one thing you cannot wait to tell me in person.',
      'Hold eye contact with the camera for ten slow seconds.',
      'Send a private goodnight voice note for me to keep.',
      'Describe our ideal late-night date using only five words.',
      'Choose what I should wear for our next private video date.',
      'Give me your most convincing come-closer look.',
    ],
  },
};

export const REACTIONS = [
  ['loved_it', 'Loved it'],
  ['made_me_blush', 'Made me blush'],
  ['too_funny', 'Too funny'],
  ['well_played', 'Well played'],
] as const;
