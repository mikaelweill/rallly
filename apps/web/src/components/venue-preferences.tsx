import { FormField, FormItem, FormLabel } from "@rallly/ui/form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@rallly/ui/select";
import { useFormContext } from "react-hook-form";
import { Trans } from "react-i18next";
import { PLACE_TYPES, PLACE_CATEGORIES } from "@/lib/google-place-types";
import { ChevronDown, Star } from "lucide-react";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";

export interface VenuePreferencesData {
    venueType: string;
    subType?: string;
    minRating?: number;
    priceLevel?: number;
}

const PriceLevel = ({ value, onChange }: { value?: number; onChange: (value: number | undefined) => void }) => {
    return (
        <FormItem>
            <FormLabel>
                <Trans defaults="Price Level">Price Level</Trans>
            </FormLabel>
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                    <Button
                        key={level}
                        variant="ghost"
                        className={cn(
                            "px-2 hover:bg-green-50",
                            value === level && "bg-green-50"
                        )}
                        onClick={() => {
                            onChange(value === level ? undefined : level);
                        }}
                    >
                        <span className={cn(
                            "text-base",
                            level <= (value ?? 0) ? "text-green-600" : "text-gray-400"
                        )}>
                            {"$".repeat(level)}
                        </span>
                    </Button>
                ))}
            </div>
            <div className="text-sm text-gray-500">
                {value ? `Maximum price level: ${value}` : "No price preference"}
            </div>
        </FormItem>
    );
};

const StarRating = ({ value, onChange }: { value?: number; onChange: (value: number | undefined) => void }) => {
    return (
        <FormItem>
            <FormLabel>
                <Trans defaults="Minimum Rating">Minimum Rating</Trans>
            </FormLabel>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                        key={rating}
                        variant="ghost"
                        className={cn(
                            "px-2 hover:bg-gray-100",
                            value === rating && "bg-gray-100"
                        )}
                        onClick={() => {
                            onChange(value === rating ? undefined : rating);
                        }}
                    >
                        <Star className={cn(
                            "h-5 w-5",
                            rating <= (value ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        )} />
                    </Button>
                ))}
            </div>
            <div className="text-sm text-gray-500">
                {value ? `${value}+ stars` : "No rating preference"}
            </div>
        </FormItem>
    );
};

export const VenuePreferences = () => {
    const form = useFormContext<VenuePreferencesData>();

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <FormField
                control={form.control}
                name="venueType"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            <Trans defaults="Venue Type">Venue Type</Trans>
                        </FormLabel>
                        <Select
                            value={field.value}
                            onValueChange={field.onChange}
                        >
                            <SelectTrigger className={cn(
                                "w-full bg-white relative flex items-center",
                                "text-muted-foreground hover:text-foreground",
                                "cursor-pointer transition-colors",
                                field.value && "text-foreground"
                            )}>
                                <div className="flex-1 flex items-center gap-x-2">
                                    <span className="truncate">
                                        {field.value ? (
                                            PLACE_TYPES.find(type => type.value === field.value)?.label
                                        ) : (
                                            "Click to select venue type ↓"
                                        )}
                                    </span>
                                </div>
                                <ChevronDown className="h-4 w-4 shrink-0" />
                            </SelectTrigger>
                            <SelectContent>
                                {PLACE_CATEGORIES.map((category) => (
                                    <SelectGroup key={category}>
                                        <SelectLabel>{category}</SelectLabel>
                                        {PLACE_TYPES
                                            .filter((type) => type.category === category)
                                            .map((type) => (
                                                <SelectItem
                                                    key={type.value}
                                                    value={type.value}
                                                >
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="priceLevel"
                render={({ field }) => (
                    <PriceLevel
                        value={field.value}
                        onChange={field.onChange}
                    />
                )}
            />
            <FormField
                control={form.control}
                name="minRating"
                render={({ field }) => (
                    <StarRating
                        value={field.value}
                        onChange={field.onChange}
                    />
                )}
            />
        </div>
    );
}; 