import { FormField, FormItem, FormLabel } from "@rallly/ui/form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@rallly/ui/select";
import { useFormContext } from "react-hook-form";
import { Trans } from "react-i18next";
import { PLACE_TYPES, PLACE_CATEGORIES } from "@/lib/google-place-types";
import { ChevronDown } from "lucide-react";
import { cn } from "@rallly/ui";

export interface VenuePreferencesData {
    venueType: string;
    subType?: string;
    minRating?: number;
    priceLevel?: number;
}

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
        </div>
    );
}; 