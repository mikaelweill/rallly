import { FormField, FormItem, FormLabel, FormMessage } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { Textarea } from "@rallly/ui/textarea";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";

import { Trans } from "@/components/trans";
import { useFormValidation } from "@/utils/form-validation";
import { LocationPicker } from "@/components/location-picker/location-picker";

interface Location {
  address: string;
  placeId?: string;
  lat?: number;
  lng?: number;
}

export interface PollDetailsData {
  title: string;
  locations?: Location[];
  description: string;
  isLocationOptimized: boolean;
}

interface PollDetailsFormProps {
  showLocationPicker?: boolean;
}

export const PollDetailsForm = ({ showLocationPicker = true }: PollDetailsFormProps) => {
  const { t } = useTranslation();
  const form = useFormContext<PollDetailsData>();

  const { requiredString } = useFormValidation();
  const {
    register,
    formState: { errors },
    control,
    watch,
  } = form;

  const isLocationOptimized = watch("isLocationOptimized");

  return (
    <div className="grid gap-4 py-1">
      <FormField
        control={control}
        name="title"
        rules={{
          validate: requiredString(t("title")),
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="title">{t("title")}</FormLabel>
            <Input
              {...field}
              type="text"
              error={!!errors.title}
              id="title"
              className="w-full"
              placeholder={t("titlePlaceholder")}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      {showLocationPicker && (
        <>
          <FormField
            control={control}
            name="isLocationOptimized"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Type</FormLabel>
                <div className="flex rounded-lg border p-1">
                  <button
                    type="button"
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${!field.value
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                    onClick={() => field.onChange(false)}
                  >
                    Specific Locations
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${field.value
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                    onClick={() => field.onChange(true)}
                  >
                    Smart Location
                  </button>
                </div>
              </FormItem>
            )}
          />

          {!isLocationOptimized && (
            <FormField
              control={control}
              name="locations"
              render={({ field }) => (
                <LocationPicker
                  multipleLocations={true}
                  locations={field.value ?? []}
                  onLocationsChange={(locations) => {
                    console.log('Locations changed:', locations);
                    // Ensure we have all required fields
                    const validLocations = locations.map(loc => ({
                      address: loc.address,
                      placeId: loc.placeId,
                      lat: loc.lat,
                      lng: loc.lng
                    })).filter(loc => loc.address);
                    field.onChange(validLocations);
                  }}
                />
              )}
            />
          )}
          {isLocationOptimized && (
            <div className="rounded-lg border border-dashed p-4 text-center text-gray-500">
              Venue preferences coming soon...
            </div>
          )}
        </>
      )}

      <FormItem>
        <div>
          <FormLabel className="inline-block" htmlFor="description">
            {t("description")}
          </FormLabel>
          <span className="text-muted-foreground ml-1 text-sm">
            <Trans i18nKey="optionalLabel" defaults="(Optional)" />
          </span>
        </div>
        <Textarea
          className="w-full"
          id="description"
          placeholder={t("descriptionPlaceholder")}
          rows={5}
          {...register("description")}
        />
      </FormItem>
    </div>
  );
};
