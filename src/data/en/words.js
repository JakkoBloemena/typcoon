// words.js — English words, roughly ordered by letters-needed then frequency
// (§7.2, §3.3 of the en scope doc). Mixed in once enough letters are active; the
// generator itself filters to the active letter set, so words with a
// not-yet-unlocked letter are skipped.
//
// NOT a translation of the Dutch list — re-authored against curriculumCore's
// unlock order (stage 1-14: f j / d k / s l / a ; / g h / e i / r u / t y /
// n m / o w / c v / p q / b x / z) so real English words appear as early as
// possible. The front section is hand-built and checked key-by-key against the
// stage table, exactly as nl was: stages 1-4 unlock only f j d k s l a (the
// home row), and English words typable from only those letters are sparse
// (as, ask, add, sad, lad, flask, salad, alfalfa…) but real. After that come
// high-frequency English function words (the, and, a, to, in, is, it…) as they
// become typable, then kid-friendly content words (animals, colours, school,
// food, play) — age 8-12 vocabulary, hand-filtered for safety.

export const words = [
  // early short words — already typable from the home row alone, so a kid
  // types REAL words immediately (not just letter drills). Order ~ letters
  // needed. Filtering this list to just f j d k s l a (stage 4) yields well
  // over 10 real English words (§7-A acceptance bar).
  'as', 'ad', 'ask', 'add', 'all', 'sad', 'lad', 'dad', 'fad', 'fall',
  'flask', 'salad', 'alas', 'lass', 'asks', 'adds', 'fads', 'lads', 'dads',
  'falls', 'flasks', 'salads', 'alfalfa',
  // + g h
  'gas', 'hall', 'half', 'flag', 'glad', 'dash', 'hash', 'flash', 'glass',
  'shall', 'lash',
  // + e i
  'is', 'if', 'his', 'age', 'fish', 'dish', 'kid', 'kids', 'side', 'hide',
  'like', 'likes', 'lake', 'deal', 'leaf', 'leash', 'sail', 'ideal',
  // + r u
  'sure', 'fur', 'fair', 'hair', 'dear', 'fear', 'gear', 'rise', 'user',
  'rule', 'rules', 'ruler', 'glare', 'guide', 'ride', 'rides', 'share',
  'said', 'radish', 'grade',
  // + t y
  'the', 'it', 'at', 'sit', 'fit', 'hit', 'list', 'fast', 'last', 'gift',
  'gifts', 'tidy', 'tray', 'dirty', 'trail', 'style', 'study', 'stay',
  'tasty', 'earth', 'guitar', 'ready',
  // + n m
  'and', 'in', 'an', 'man', 'men', 'ten', 'nest', 'mind', 'find', 'kind',
  'hand', 'land', 'sand', 'stand', 'grand', 'friend', 'name', 'game',
  'games', 'time', 'mine', 'line', 'fine', 'nine', 'shine', 'smart',
  'start', 'stars',
  // + o w
  'to', 'of', 'on', 'do', 'so', 'no', 'go', 'how', 'who', 'now', 'row',
  'low', 'slow', 'glow', 'snow', 'grow', 'know', 'show', 'flow', 'window',
  'yellow', 'follow', 'story', 'work', 'world', 'word', 'words', 'wonder',
  // + c v
  'can', 'car', 'cars', 'cat', 'cats', 'cake', 'cave', 'care', 'nice',
  'rice', 'race', 'face', 'place', 'space', 'voice', 'dance', 'circle',
  'color', 'crayon', 'coin', 'coins', 'give', 'live', 'five',
  // + p q
  'up', 'pup', 'pig', 'pigs', 'park', 'plan', 'plant', 'plants', 'paint',
  'paper', 'purple', 'happy', 'puppy', 'apple', 'apples', 'pumpkin',
  'quick', 'queen', 'quiet', 'squirrel', 'spider', 'sport', 'sports',
  'proud',
  // + b x
  'big', 'box', 'boxes', 'bug', 'bugs', 'bird', 'birds', 'book', 'books',
  'ball', 'balls', 'bike', 'bikes', 'best', 'build', 'baby', 'back',
  'black', 'blue', 'brown', 'bright', 'brave', 'table', 'about', 'fox',
  'next', 'excited',
  // + z (all 26 letters active)
  'zoo', 'zebra', 'size', 'lazy', 'crazy', 'dizzy', 'puzzle', 'zigzag',
  'freeze', 'amazing', 'zero',
  // kid-friendly content words (consolidation, stage 15)
  'mommy', 'daddy', 'grandma', 'grandpa', 'friends', 'school', 'teacher',
  'pencil', 'crayons', 'backpack', 'playground', 'swing', 'slide', 'sunny',
  'rainy', 'rainbow', 'flower', 'flowers', 'garden', 'tree', 'trees',
  'grass', 'ocean', 'beach', 'forest', 'animal', 'animals', 'kitten',
  'rabbit', 'turtle', 'frog', 'duck', 'horse', 'sheep', 'chicken',
  'elephant', 'giraffe', 'monkey', 'lion', 'tiger', 'bear', 'whale',
  'dolphin', 'butterfly', 'breakfast', 'dinner', 'snack', 'pizza',
  'pasta', 'cheese', 'juice', 'cookie', 'candy', 'chocolate', 'birthday',
  'present', 'presents', 'balloon', 'music', 'song', 'stories', 'library',
  'picture', 'pictures', 'colors', 'summer', 'winter', 'weekend',
  'morning', 'evening', 'today', 'tomorrow',
];
