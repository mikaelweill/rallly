import { cn } from "@rallly/ui";
import { User2Icon } from "lucide-react";
import * as React from "react";

import { useLocationScores } from "@/hooks/useLocationScores";
import { AnimatedNumber } from "./score-summary";

export interface LocationScoreSummaryProps {
    locationId: string;
    highlight?: boolean;
}

export const LocationScoreSummary: React.FunctionComponent<LocationScoreSummaryProps> = ({
    locationId,
    highlight,
}) => {
    const scoreByLocationId = useLocationScores();
    const score = scoreByLocationId[locationId];

    if (!score) {
        return null;
    }

    const totalScore = score.yes.length + score.ifNeedBe.length;
    const maxScore = Object.values(scoreByLocationId).reduce((max, curr) => {
        const total = curr.yes.length + curr.ifNeedBe.length;
        return total > max ? total : max;
    }, 1);

    return (
        <span
            className={cn(
                "relative inline-flex items-center gap-x-1 text-xs",
                highlight ? "font-medium text-gray-800" : "font-normal text-gray-500",
            )}
            style={{
                opacity: Math.max(totalScore / maxScore, 0.2),
            }}
        >
            <User2Icon className="size-4 opacity-75" />
            <AnimatedNumber score={totalScore} />
            {highlight && score.ifNeedBe.length > 0 ? (
                <span className="inline-block size-1.5 rounded-full bg-amber-400" />
            ) : null}
        </span>
    );
}; 