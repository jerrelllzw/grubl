// What people actually crave, expressed positively. Each entry's `term` is fed
// straight into the Places Text Search query, so it matches by natural language
// (e.g. "sushi" also surfaces places Google types as `japanese_restaurant`).
// An empty selection means "surprise me" — see buildFoodQuery in the API layer.
export type Craving = {
    key: string;
    label: string;
    emoji: string;
    term: string;
};

export const CRAVINGS: Craving[] = [
    { key: 'pizza', label: 'Pizza', emoji: '🍕', term: 'pizza' },
    { key: 'burgers', label: 'Burgers', emoji: '🍔', term: 'burgers' },
    { key: 'sushi', label: 'Sushi', emoji: '🍣', term: 'sushi' },
    { key: 'ramen', label: 'Ramen', emoji: '🍜', term: 'ramen' },
    { key: 'italian', label: 'Italian', emoji: '🍝', term: 'italian food' },
    { key: 'chinese', label: 'Chinese', emoji: '🥡', term: 'chinese food' },
    { key: 'mexican', label: 'Mexican', emoji: '🌮', term: 'mexican food' },
    { key: 'indian', label: 'Indian', emoji: '🍛', term: 'indian food' },
    { key: 'thai', label: 'Thai', emoji: '🍤', term: 'thai food' },
    { key: 'korean', label: 'Korean', emoji: '🍲', term: 'korean food' },
    { key: 'japanese', label: 'Japanese', emoji: '🍱', term: 'japanese food' },
    { key: 'vietnamese', label: 'Vietnamese', emoji: '🍜', term: 'vietnamese food' },
    { key: 'seafood', label: 'Seafood', emoji: '🦞', term: 'seafood' },
    { key: 'steak', label: 'Steak', emoji: '🥩', term: 'steakhouse' },
    { key: 'bbq', label: 'BBQ', emoji: '🍖', term: 'barbecue' },
    { key: 'healthy', label: 'Healthy', emoji: '🥗', term: 'healthy vegetarian food' },
    { key: 'breakfast', label: 'Breakfast', emoji: '🍳', term: 'breakfast brunch' },
    { key: 'cafe', label: 'Cafe', emoji: '☕', term: 'cafe coffee' },
    { key: 'bakery', label: 'Bakery', emoji: '🥐', term: 'bakery' },
    { key: 'dessert', label: 'Dessert', emoji: '🍰', term: 'dessert' },
    { key: 'fastfood', label: 'Fast Food', emoji: '🍟', term: 'fast food' },
    { key: 'bar', label: 'Bar', emoji: '🍸', term: 'bar' },
];

export const CRAVING_BY_KEY: Record<string, Craving> = Object.fromEntries(
    CRAVINGS.map((c) => [c.key, c])
);

// Maps a Google `primaryType` to a representative emoji shown on the swipe card.
const PLACE_EMOJI: Record<string, string> = {
    acai_shop: '🍓',
    bagel_shop: '🥯',
    bakery: '🥐',
    bar: '🍸',
    bar_and_grill: '🍻',
    barbecue_restaurant: '🍖',
    breakfast_restaurant: '🍳',
    brunch_restaurant: '🥞',
    buffet_restaurant: '🍽️',
    cafe: '☕',
    cafeteria: '🍱',
    candy_store: '🍬',
    cat_cafe: '🐱',
    chinese_restaurant: '🥡',
    chocolate_factory: '🍫',
    chocolate_shop: '🍫',
    coffee_shop: '☕',
    confectionery: '🍬',
    deli: '🥪',
    dessert_restaurant: '🍰',
    dessert_shop: '🧁',
    diner: '🍳',
    dog_cafe: '🐶',
    donut_shop: '🍩',
    fast_food_restaurant: '🍟',
    fine_dining_restaurant: '🍷',
    food_court: '🍱',
    french_restaurant: '🥖',
    greek_restaurant: '🥙',
    hamburger_restaurant: '🍔',
    ice_cream_shop: '🍦',
    indian_restaurant: '🍛',
    indonesian_restaurant: '🍲',
    italian_restaurant: '🍝',
    japanese_restaurant: '🍱',
    juice_shop: '🧃',
    korean_restaurant: '🍲',
    lebanese_restaurant: '🧆',
    mediterranean_restaurant: '🫒',
    mexican_restaurant: '🌮',
    middle_eastern_restaurant: '🧆',
    pizza_restaurant: '🍕',
    pub: '🍺',
    ramen_restaurant: '🍜',
    sandwich_shop: '🥪',
    seafood_restaurant: '🦞',
    spanish_restaurant: '🥘',
    steak_house: '🥩',
    sushi_restaurant: '🍣',
    tea_house: '🍵',
    thai_restaurant: '🍜',
    turkish_restaurant: '🥙',
    vegan_restaurant: '🥗',
    vegetarian_restaurant: '🥗',
    vietnamese_restaurant: '🍜',
    wine_bar: '🍷',
};

export const getPlaceEmoji = (primaryType?: string): string =>
    (primaryType && PLACE_EMOJI[primaryType]) || '🍴';

// Search radius, in metres. A slider drives this between MIN and MAX.
export const RADIUS_MIN = 500;
export const RADIUS_MAX = 8000;
export const RADIUS_STEP = 500;
export const RADIUS_DEFAULT = 2000;

export const formatRadius = (metres: number): string =>
    metres >= 1000 ? `${(metres / 1000).toFixed(1).replace(/\.0$/, '')} km` : `${metres} m`;

export const PRICE_MAP: Record<string, string> = {
    PRICE_LEVEL_INEXPENSIVE: '$',
    PRICE_LEVEL_MODERATE: '$$',
    PRICE_LEVEL_EXPENSIVE: '$$$',
    PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
};
