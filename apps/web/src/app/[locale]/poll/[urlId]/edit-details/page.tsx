"use client";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { Form } from "@rallly/ui/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import type { PollDetailsData } from "@/components/forms/poll-details-form";
import { PollDetailsForm } from "@/components/forms/poll-details-form";
import { useUpdatePollMutation } from "@/components/poll/mutations";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import type { NextPageWithLayout } from "@/types";

const Page: NextPageWithLayout = () => {
  const { poll } = usePoll();
  const urlId = poll.adminUrlId;
  const { mutate: updatePollMutation, isLoading: isUpdating } =
    useUpdatePollMutation();
  const router = useRouter();

  const pollLink = `/poll/${poll.id}`;

  const redirectBackToPoll = () => {
    router.push(pollLink);
  };

  const form = useForm<PollDetailsData>({
    defaultValues: {
      title: poll.title,
      locations: poll.locations ?? [],
      description: poll.description ?? "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          console.log('Submitting form with data:', data);
          //submit
          updatePollMutation(
            {
              urlId,
              title: data.title,
              description: data.description,
              locations: data.locations?.map(loc => ({
                address: loc.address,
                placeId: loc.placeId,
                lat: loc.lat,
                lng: loc.lng
              })),
            },
            {
              onSuccess: () => {
                console.log('Poll updated successfully');
                redirectBackToPoll();
              },
              onError: (error) => {
                console.error('Failed to update poll:', error);
              }
            },
          );
        })}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans i18nKey="editDetails" defaults="Edit details" />
            </CardTitle>
            <CardDescription>
              <Trans
                i18nKey="editDetailsDescription"
                defaults="Change the details of your event."
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PollDetailsForm />
          </CardContent>
          <CardFooter className="justify-between">
            <Button asChild>
              <Link href={pollLink}>
                <Trans i18nKey="cancel" />
              </Link>
            </Button>
            <Button type="submit" loading={isUpdating} variant="primary">
              <Trans i18nKey="save" />
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default Page;
