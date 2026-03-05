import type {
  TierId,
  TierItemId,
  TurnResolution,
  VoteValue,
} from "@twf/contracts";
import { clamp } from "./clamp";

export function computeVoteResolution(args: {
  votes: Record<string, VoteValue | undefined>;
  eligibleVoterIds: string[];
  fromTierId: TierId;
  tierOrder: TierId[];
  tiers: Record<TierId, TierItemId[]>;
  currentItemId: TierItemId | null | undefined;
}): TurnResolution {
  const {
    votes,
    eligibleVoterIds,
    fromTierId,
    tierOrder,
    tiers,
    currentItemId,
  } = args;

  const eligible = eligibleVoterIds.length;

  const actualVoterIds = eligibleVoterIds.filter(
    (playerId) => votes[playerId] !== undefined,
  );

  const voters = actualVoterIds.length;

  let up1 = 0;
  let agree = 0;
  let down1 = 0;

  let netTierDelta = 0;
  for (const playerId of actualVoterIds) {
    const voteRaw = votes[playerId];
    if (voteRaw === undefined) continue;

    const vote = voteRaw < 0 ? -1 : voteRaw > 0 ? 1 : 0;

    if (vote < 0) {
      up1 += 1;
      netTierDelta -= 1;
    } else if (vote > 0) {
      down1 += 1;
      netTierDelta += 1;
    } else {
      agree += 1;
    }
  }

  const safeTierOrder = tierOrder.length > 0 ? tierOrder : [fromTierId];
  const fromIdxRaw = safeTierOrder.indexOf(fromTierId);
  const fromIdx = fromIdxRaw >= 0 ? fromIdxRaw : 0;

  const driftDeltaRequested = netTierDelta;

  const toIdx = clamp(
    fromIdx + driftDeltaRequested,
    0,
    safeTierOrder.length - 1,
  );
  const toTierId = safeTierOrder[toIdx] ?? fromTierId;
  const driftDeltaApplied = toIdx - fromIdx;

  const toTierBase = tiers[toTierId] ?? [];
  const toTier = currentItemId
    ? toTierBase.filter((itemId) => itemId !== currentItemId)
    : toTierBase;
  const toTierLength = toTier.length;

  const valuedVoters = up1 + down1;
  const participation = eligible === 0 ? 0 : valuedVoters / eligible;
  const mean = valuedVoters === 0 ? 0 : netTierDelta / valuedVoters;
  const score = mean * participation;

  let insertIndex = toTierLength;
  if (valuedVoters === 0) {
    insertIndex = toTierLength;
  } else {
    const bias = score - driftDeltaApplied;
    const clampedBias = clamp(bias, -0.5, 0.5);
    const insertFraction = clamp(clampedBias + 0.5, 0, 1);
    insertIndex = Math.round(insertFraction * toTierLength);
    insertIndex = clamp(insertIndex, 0, toTierLength);
  }

  return {
    counts: { up2: 0, up1, agree, down1, down2: 0 },
    voters,
    eligible,
    score,
    driftDeltaRequested,
    driftDeltaApplied,
    fromTierId,
    toTierId,
    insertIndex,
  };
}
