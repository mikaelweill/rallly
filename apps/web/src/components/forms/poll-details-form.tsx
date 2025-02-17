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
  } = form;

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
