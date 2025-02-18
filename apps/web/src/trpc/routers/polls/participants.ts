import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";

import { getEmailClient } from "@/utils/emails";
import { createToken } from "@/utils/session";

import {
  createRateLimitMiddleware,
  publicProcedure,
  requireUserMiddleware,
  router,
} from "../../trpc";
import type { DisableNotificationsPayload } from "../../types";

const MAX_PARTICIPANTS = 1000;

async function sendNewParticipantNotifcationEmail({
  pollId,
  pollTitle,
  participantName,
}: {
  pollId: string;
  pollTitle: string;
  participantName: string;
}) {
  const watchers = await prisma.watcher.findMany({
    where: {
      pollId,
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          email: true,
          name: true,
          locale: true,
        },
      },
    },
  });

  await Promise.all(
    watchers.map(async (watcher) => {
      try {
        const email = watcher.user.email;
        const watcherLocale = watcher.user.locale ?? undefined;
        const token = await createToken<DisableNotificationsPayload>(
          { watcherId: watcher.id, pollId },
          { ttl: 0 },
        );
        await getEmailClient(watcherLocale).sendTemplate(
          "NewParticipantEmail",
          {
            to: email,
            props: {
              participantName,
              pollUrl: absoluteUrl(`/poll/${pollId}`),
              disableNotificationsUrl: absoluteUrl(
                `/api/notifications/unsubscribe?token=${token}`,
              ),
              title: pollTitle,
            },
          },
        );
      } catch (err) {
        Sentry.captureException(err);
      }
    }),
  );
}

export const participants = router({
  list: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .query(async ({ input: { pollId } }) => {
      const participants = await prisma.participant.findMany({
        where: {
          pollId,
          deleted: false,
        },
        include: {
          votes: {
            select: {
              optionId: true,
              type: true,
            },
          },
          locationVotes: {
            select: {
              locationId: true,
              type: true,
            },
          },
        },
        orderBy: [
          {
            createdAt: "desc",
          },
          { name: "desc" },
        ],
      });
      return participants;
    }),
  delete: publicProcedure
    .use(createRateLimitMiddleware(20, "1 m"))
    .input(
      z.object({
        participantId: z.string(),
      }),
    )
    .mutation(async ({ input: { participantId } }) => {
      await prisma.participant.update({
        where: {
          id: participantId,
        },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      });
    }),
  add: publicProcedure
    .use(createRateLimitMiddleware(20, "1 m"))
    .use(requireUserMiddleware)
    .input(
      z.object({
        pollId: z.string(),
        name: z.string().min(1, "Participant name is required").max(100),
        email: z.string().optional(),
        votes: z
          .object({
            optionId: z.string(),
            type: z.enum(["yes", "no", "ifNeedBe"]),
          })
          .array(),
        locationVotes: z
          .object({
            locationId: z.string(),
            type: z.enum(["yes", "no", "ifNeedBe"]),
          })
          .array()
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input: { pollId, votes, locationVotes, name, email } }) => {
      const { user } = ctx;

      const participant = await prisma.$transaction(async (prisma) => {
        const participantCount = await prisma.participant.count({
          where: {
            pollId,
            deleted: false,
          },
        });

        if (participantCount >= MAX_PARTICIPANTS) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `This poll has reached its maximum limit of ${MAX_PARTICIPANTS} participants`,
          });
        }

        const participant = await prisma.participant.create({
          data: {
            pollId: pollId,
            name: name,
            email,
            ...(user.isGuest ? { guestId: user.id } : { userId: user.id }),
            locale: user.locale ?? undefined,
          },
          include: {
            poll: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        // Create time votes
        await prisma.vote.createMany({
          data: votes.map(({ optionId, type }) => ({
            optionId,
            type,
            pollId,
            participantId: participant.id,
          })),
        });

        // Create location votes if provided
        if (locationVotes?.length) {
          await prisma.locationVote.createMany({
            data: locationVotes.map(({ locationId, type }) => ({
              locationId,
              type,
              pollId,
              participantId: participant.id,
            })),
          });
        }

        return participant;
      });

      if (email) {
        const token = await createToken(
          { userId: user.id },
          {
            ttl: 0, // basically forever
          },
        );

        ctx.user
          .getEmailClient()
          .queueTemplate("NewParticipantConfirmationEmail", {
            to: email,
            props: {
              title: participant.poll.title,
              editSubmissionUrl: absoluteUrl(
                `/invite/${participant.poll.id}?token=${token}`,
              ),
            },
          });
      }

      waitUntil(
        sendNewParticipantNotifcationEmail({
          pollId,
          pollTitle: participant.poll.title,
          participantName: participant.name,
        }),
      );

      return participant;
    }),
  rename: publicProcedure
    .use(createRateLimitMiddleware(20, "1 m"))
    .input(z.object({ participantId: z.string(), newName: z.string() }))
    .mutation(async ({ input: { participantId, newName } }) => {
      await prisma.participant.update({
        where: {
          id: participantId,
        },
        data: {
          name: newName,
        },
        select: null,
      });
    }),
  update: publicProcedure
    .use(createRateLimitMiddleware(20, "1 m"))
    .input(
      z.object({
        pollId: z.string(),
        participantId: z.string(),
        votes: z
          .object({
            optionId: z.string(),
            type: z.enum(["yes", "no", "ifNeedBe"]),
          })
          .array(),
        locationVotes: z
          .object({
            locationId: z.string(),
            type: z.enum(["yes", "no", "ifNeedBe"]),
          })
          .array()
          .optional(),
      }),
    )
    .mutation(async ({ input: { pollId, participantId, votes, locationVotes } }) => {
      const participant = await prisma.$transaction(async (tx) => {
        // Delete existing time votes
        await tx.vote.deleteMany({
          where: {
            participantId,
            pollId,
          },
        });

        // Create new time votes
        await tx.vote.createMany({
          data: votes.map(({ optionId, type }) => ({
            optionId,
            type,
            pollId,
            participantId,
          })),
        });

        // Handle location votes if provided
        if (locationVotes !== undefined) {
          // Delete existing location votes
          await tx.locationVote.deleteMany({
            where: {
              participantId,
              pollId,
            },
          });

          // Create new location votes if any
          if (locationVotes.length > 0) {
            await tx.locationVote.createMany({
              data: locationVotes.map(({ locationId, type }) => ({
                locationId,
                type,
                pollId,
                participantId,
              })),
            });
          }
        }

        // Return updated participant with all votes
        return tx.participant.findUniqueOrThrow({
          where: {
            id: participantId,
          },
          include: {
            votes: true,
            locationVotes: true,
          },
        });
      });

      return participant;
    }),
});
