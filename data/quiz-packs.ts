import { QuizPack } from '@/types';

export const QUIZ_PACKS: QuizPack[] = [
  {
    id: 'starter',
    name: 'Cute Starter Pack',
    badge: '★ Popular',
    description: 'Lighthearted, fun questions about daily favorites and habits.',
    questions: [
      {
        q: "What's Mia's go-to karaoke song? 🎤",
        options: ['Bohemian Rhapsody 🎸', 'Something by IU 🎧', 'Rap god, allegedly 🎤', 'Love Story by Taylor 💖'],
        honestAnswerIndex: 0,
      },
      {
        q: 'What is our ultimate comfort food on video calls? 🍜',
        options: ['Late-night spicy ramen 🌶️', 'Hot cheese pizza 🍕', 'Boba milk tea 🧋', 'Tacos & fries 🍟'],
        honestAnswerIndex: 0,
      },
      {
        q: 'Who usually falls asleep on the call first? 😴',
        options: ['Definitely {partnerA} 🌸', 'Always {partnerB} 🌙', 'Simultaneous pass out 💤', 'Neither, we talk until 4am ☕'],
        honestAnswerIndex: 1,
      },
      {
        q: 'What is our dream reunion city? ✈️',
        options: ['Tokyo in Cherry Blossom season 🌸', 'Paris along the Seine 🥐', 'Seoul late-night street food 🍢', 'Cozy cabin in Banff 🏔️'],
        honestAnswerIndex: 0,
      },
      {
        q: 'What makes {partnerA} laugh until they cry? 😂',
        options: ['Terrible puns & dad jokes 🃏', 'Awkward video call lags 📶', 'Funny animal TikToks 🐱', '{partnerB} doing bad voice impressions 🎭'],
        honestAnswerIndex: 3,
      },
    ],
  },
  {
    id: 'deep',
    name: 'Deep & Intimate',
    badge: 'New',
    description: 'Vulnerable questions about feelings, fears, and devotion.',
    questions: [
      {
        q: 'When did you first realize you were in love? 💘',
        options: ['The 6-hour phone call that felt like 5 minutes', 'When we had to say goodbye at the airport', 'A random Tuesday laughing together', 'Before we even met in person'],
        honestAnswerIndex: 0,
      },
      {
        q: 'What is the hardest part about long distance for us? 🌍',
        options: ['Not being able to hug after a hard day', 'Time zone math and bedtime difference', 'Missing shared meals & routines', 'Counting down months between visits'],
        honestAnswerIndex: 0,
      },
      {
        q: 'What is something you admire most about your partner? 💎',
        options: ['Unwavering kindness and warmth', 'Drive, ambition & intelligence', 'Sense of humor through tough days', 'Patience & understanding'],
        honestAnswerIndex: 0,
      },
      {
        q: 'What is our favorite love language? 💌',
        options: ['Words of affirmation & long texts', 'Quality time on FaceTime', 'Receiving surprise care packages', 'Physical touch (when together)'],
        honestAnswerIndex: 1,
      },
      {
        q: 'Where do you see us 3 years from now? 🏡',
        options: ['Living in the same city with a cute dog', 'Married and traveling the world', 'Cooking dinner together every night', 'All of the above! ✨'],
        honestAnswerIndex: 3,
      },
    ],
  },
  {
    id: 'spicy',
    name: 'Spicy & Wild 🔥',
    badge: '18+',
    description: 'Exciting, cheeky questions for date night after dark.',
    questions: [
      {
        q: 'What is the first thing we do the second we reunite at the airport? 💋',
        options: ['The longest kiss in history', 'Drop bags and run into each other’s arms', 'Go eat spicy food together', 'Stare in disbelief for 10 seconds'],
        honestAnswerIndex: 1,
      },
      {
        q: 'What is the most attractive thing {partnerB} wears on camera? 👀',
        options: ['Messy morning hair & oversized hoodie', 'Clean crisp white shirt', 'Cozy glasses & beanie', 'Sweatpants & smile'],
        honestAnswerIndex: 0,
      },
      {
        q: 'Who is the bigger flirt when we text? 😏',
        options: ['{partnerA} with cute emojis & hints', '{partnerB} with smooth late-night lines', 'Equal flirty chaos', 'Whoever is caffeinated'],
        honestAnswerIndex: 0,
      },
      {
        q: 'Favorite late-night conversation topic? 🌙',
        options: ['Romantic future fantasies', 'Deep 3am philosophical secrets', 'Funny gossip from our day', 'Planning next hotel dates'],
        honestAnswerIndex: 0,
      },
    ],
  },
  {
    id: 'travel',
    name: 'Travel & Adventures ✈️',
    badge: 'Popular',
    description: 'Dream getaways, packing quirks, and airport reunion plans.',
    questions: [
      {
        q: 'Who panics more at the airport security line? 🛂',
        options: ['{partnerA} checking passport 14 times', '{partnerB} thinking they forgot something', 'Both completely calm', 'Neither, too excited to see each other'],
        honestAnswerIndex: 0,
      },
      {
        q: 'Window seat or aisle seat? 💺',
        options: ['Window for views & sleep', 'Aisle for legroom', 'Middle as long as we are together', 'Window for {partnerA}, Aisle for {partnerB}'],
        honestAnswerIndex: 3,
      },
      {
        q: 'Our ideal vacation style: 🏖️',
        options: ['All-inclusive beach resort & cocktails', 'Hiking mountains & exploring trails', 'Walking 25,000 steps a day in Europe/Asia', 'Cozy cabin rental with private hot tub'],
        honestAnswerIndex: 2,
      },
    ],
  },
  {
    id: 'nostalgia',
    name: 'Childhood & Nostalgia 🧸',
    description: 'Old memories, childhood crushes, and teenage obsessions.',
    questions: [
      {
        q: 'What was your favorite childhood cartoon/anime? 📺',
        options: ['Pokémon / Sailor Moon ⚡', 'SpongeBob / Cartoon Network 🍍', 'Avatar: The Last Airbender 🌪️', 'Studio Ghibli films 🍃'],
        honestAnswerIndex: 0,
      },
      {
        q: 'Were you the teacher’s pet or the class clown? 🎒',
        options: ['Straight-A teacher’s pet 📚', 'Sneaky class clown 🤡', 'Quiet kid reading in the back 📖', 'Social butterfly talking all class 🦋'],
        honestAnswerIndex: 3,
      },
    ],
  },
  {
    id: 'food',
    name: 'Food & Late Night Cravings 🍜',
    description: 'Tastebuds, secret snacks, and arguing over where to eat.',
    questions: [
      {
        q: 'If we could only eat one cuisine forever: 🌮',
        options: ['Authentic Italian Pasta & Pizza 🍝', 'Japanese Sushi & Ramen 🍣', 'Indonesian Spicy Street Food 🌶️', 'Korean BBQ & Fried Chicken 🍗'],
        honestAnswerIndex: 1,
      },
      {
        q: 'Sweet tooth or savory crunch? 🍰',
        options: ['Ice cream, boba & pastries 🧁', 'Chips, fries & cheesy dips 🍟', 'Both at the exact same time 🍫', 'Fresh fruit & smoothies 🍓'],
        honestAnswerIndex: 0,
      },
    ],
  },
  {
    id: 'future-home',
    name: 'Money & Future Home 🏡',
    description: 'Interior aesthetics, pet names, and dream living rooms.',
    questions: [
      {
        q: 'What pet are we getting first when we close the distance? 🐾',
        options: ['Golden Retriever / Corgi puppy 🐶', 'Fluffy ginger cat 🐱', 'Two rescue kittens 🐾', 'Plants first, pets later 🌿'],
        honestAnswerIndex: 0,
      },
      {
        q: 'Our future home aesthetic: 🛋️',
        options: ['Sunlit Japandi minimalist with wood & plants', 'Cozy warm vintage brick & bookshelves', 'Modern high-rise condo with city views', 'Country cottage with big flower garden'],
        honestAnswerIndex: 0,
      },
    ],
  },
  {
    id: 'closing-distance',
    name: 'Closing the Distance ⏳',
    badge: 'Special',
    description: 'Visas, packing bags, and the final countdown to forever.',
    questions: [
      {
        q: 'What are you most excited to do on our first regular Tuesday together? 🍳',
        options: ['Grocery shopping together holding hands 🛒', 'Making breakfast in our kitchen in pajamas 🥞', 'Coming home and hugging without saying goodbye 🚪', 'Falling asleep and waking up in the same bed 🛌'],
        honestAnswerIndex: 2,
      },
      {
        q: 'Who will cry harder at the final one-way flight airport gate? 😭',
        options: ['{partnerA} (happy tears floodgate)', '{partnerB} (pretending not to cry)', 'Both ugly crying in public', 'Our families seeing us finally together'],
        honestAnswerIndex: 2,
      },
    ],
  },
];
