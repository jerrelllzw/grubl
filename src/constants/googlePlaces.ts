export const PLACE_TYPE_OPTIONS = [
    { label: 'Bakery', value: 'bakery' },
    { label: 'Bar', value: 'bar' },
    { label: 'Cafe', value: 'cafe' },
    { label: 'Coffee Shop', value: 'coffee_shop' },
    { label: 'Deli', value: 'deli' },
    { label: 'Dessert', value: 'dessert_shop' },
    { label: 'Fast Food', value: 'fast_food_restaurant' },
    { label: 'Fine Dining', value: 'fine_dining_restaurant' },
    { label: 'Food Court', value: 'food_court' },
    { label: 'Ice Cream', value: 'ice_cream_shop' },
    { label: 'Pub', value: 'pub' },
    { label: 'Restaurant', value: 'restaurant' },
    { label: 'Takeaway', value: 'meal_takeaway' },
    { label: 'Tea House', value: 'tea_house' },
];

export const RADIUS_OPTIONS = [200, 400, 800, 1600];

export const PRICE_MAP: Record<string, string> = {
    PRICE_LEVEL_FREE: 'Free',
    PRICE_LEVEL_INEXPENSIVE: '$',
    PRICE_LEVEL_MODERATE: '$$',
    PRICE_LEVEL_EXPENSIVE: '$$$',
    PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
};
