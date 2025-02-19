// Based on https://developers.google.com/maps/documentation/places/web-service/supported_types

export interface PlaceTypeOption {
    value: string;
    label: string;
    category: string;
}

export const PLACE_TYPES: PlaceTypeOption[] = [
    // Food & Drink
    { value: "restaurant", label: "Restaurant", category: "Food & Drink" },
    { value: "cafe", label: "Cafe", category: "Food & Drink" },
    { value: "bar", label: "Bar", category: "Food & Drink" },
    { value: "bakery", label: "Bakery", category: "Food & Drink" },
    { value: "meal_takeaway", label: "Takeaway", category: "Food & Drink" },

    // Entertainment & Recreation
    { value: "amusement_park", label: "Amusement Park", category: "Entertainment" },
    { value: "aquarium", label: "Aquarium", category: "Entertainment" },
    { value: "art_gallery", label: "Art Gallery", category: "Entertainment" },
    { value: "bowling_alley", label: "Bowling Alley", category: "Entertainment" },
    { value: "casino", label: "Casino", category: "Entertainment" },
    { value: "movie_theater", label: "Movie Theater", category: "Entertainment" },
    { value: "night_club", label: "Night Club", category: "Entertainment" },

    // Sports & Fitness
    { value: "gym", label: "Gym", category: "Sports & Fitness" },
    { value: "stadium", label: "Stadium", category: "Sports & Fitness" },
    { value: "swimming_pool", label: "Swimming Pool", category: "Sports & Fitness" },

    // Outdoors & Parks
    { value: "park", label: "Park", category: "Outdoors" },
    { value: "campground", label: "Campground", category: "Outdoors" },
    { value: "beach", label: "Beach", category: "Outdoors" },

    // Shopping
    { value: "shopping_mall", label: "Shopping Mall", category: "Shopping" },
    { value: "department_store", label: "Department Store", category: "Shopping" },
    { value: "convenience_store", label: "Convenience Store", category: "Shopping" },

    // Business & Meeting Places
    { value: "conference_center", label: "Conference Center", category: "Business" },
    { value: "coworking_space", label: "Coworking Space", category: "Business" },
    { value: "library", label: "Library", category: "Business" },

    // Culture & Education
    { value: "museum", label: "Museum", category: "Culture" },
    { value: "university", label: "University", category: "Culture" },
    { value: "school", label: "School", category: "Culture" },
];

// Get unique categories
export const PLACE_CATEGORIES = Array.from(
    new Set(PLACE_TYPES.map((type) => type.category))
); 