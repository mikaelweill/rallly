let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (): Promise<void> => {
    if (isLoaded) {
        return Promise.resolve();
    }

    if (loadPromise) {
        return loadPromise;
    }

    loadPromise = new Promise((resolve, reject) => {
        if (isLoading) {
            return;
        }

        isLoading = true;

        // Create script element
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;

        // Handle script load
        script.addEventListener("load", () => {
            isLoaded = true;
            isLoading = false;
            resolve();
        });

        // Handle script error
        script.addEventListener("error", (error) => {
            isLoading = false;
            reject(new Error(`Failed to load Google Maps script: ${error}`));
        });

        // Add script to document
        document.head.appendChild(script);
    });

    return loadPromise;
};
