import { cn } from "@rallly/ui";
import { AnimatePresence, m } from "framer-motion";
import { User2Icon } from "lucide-react";
import * as React from "react";
import { usePrevious } from "react-use";

import { usePoll } from "@/components/poll-context";
import { IfScoresVisible } from "@/components/visibility";

export interface PopularityScoreProps {
  yesScore: number;
  ifNeedBeScore?: number;
  highlight?: boolean;
  highScore: number;
}

export const ConnectedScoreSummary: React.FunctionComponent<{
  optionId: string;
}> = ({ optionId }) => {
  const { getScore, highScore } = usePoll();
  const { yes, ifNeedBe } = getScore(optionId);
  const score = yes + ifNeedBe;
  const highlight = score === highScore && score > 1;
  return (
    <IfScoresVisible>
      <ScoreSummary
        yesScore={yes}
        ifNeedBeScore={ifNeedBe}
        highScore={highScore}
        highlight={highlight}
      />
    </IfScoresVisible>
  );
};

export const AnimatedNumber = ({ score }: { score: number }) => {
  const prevScore = usePrevious(score);
  return (
    <AnimatePresence mode="wait">
      <m.span
        key={score}
        initial={
          prevScore !== undefined
            ? {
              y: score > prevScore ? 10 : -10,
              opacity: 0,
            }
            : undefined
        }
        animate={{ y: 0, opacity: 1 }}
        exit={{
          y: score > (prevScore ?? 0) ? -10 : 10,
          opacity: 0,
          position: "absolute",
        }}
      >
        {score}
      </m.span>
    </AnimatePresence>
  );
};

const ScoreSummary: React.FunctionComponent<PopularityScoreProps> = React.memo(
  function PopularityScore({
    yesScore = 0,
    ifNeedBeScore = 0,
    highlight,
    highScore,
  }) {
    const score = yesScore + ifNeedBeScore;

    return (
      <span
        className={cn(
          "relative inline-flex items-center gap-x-1 text-xs",
          highlight ? "font-medium text-gray-800" : "font-normal text-gray-500",
        )}
        style={{
          opacity: Math.max(score / highScore, 0.2),
        }}
      >
        <User2Icon className="size-4 opacity-75" />
        <AnimatedNumber score={score} />
        {highlight ? (
          ifNeedBeScore > 0 ? (
            <span className="inline-block size-1.5 rounded-full bg-amber-400" />
          ) : null
        ) : null}
      </span>
    );
  },
);
