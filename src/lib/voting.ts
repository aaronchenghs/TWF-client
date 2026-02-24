import type {
  TierId,
  TierItemId,
  TurnResolution,
  VoteValue,
} from "@twf/contracts";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getParticipationCap(participation: number): 0 | 1 {
  if (participation < 1 / 3) return 0;
  return 1;
}

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

  let sum = 0;
  for (const playerId of actualVoterIds) {
    const voteRaw = votes[playerId];
    if (voteRaw === undefined) continue;

    const vote = voteRaw < 0 ? -1 : voteRaw > 0 ? 1 : 0;

    sum += vote;
    if (vote < 0) up1 += 1;
    else if (vote > 0) down1 += 1;
    else agree += 1;
  }

  const safeTierOrder = tierOrder.length > 0 ? tierOrder : [fromTierId];
  const fromIdxRaw = safeTierOrder.indexOf(fromTierId);
  const fromIdx = fromIdxRaw >= 0 ? fromIdxRaw : 0;

  const participation = eligible === 0 ? 0 : voters / eligible;
  const participationCap = getParticipationCap(participation);

  const wantUp = up1;
  const wantDown = down1;

  let direction: -1 | 0 | 1 = 0;
  if (voters > 0) {
    if (wantDown > voters / 2) direction = 1;
    else if (wantUp > voters / 2) direction = -1;
  }

  const baseMagnitude: 0 | 1 = direction === 0 ? 0 : 1;

  const magnitude = Math.min(baseMagnitude, participationCap) as 0 | 1;
  const driftDeltaRequested = direction * magnitude;

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

  const allActualVotesAgree = voters > 0 && wantUp === 0 && wantDown === 0;

  const mean = voters === 0 ? 0 : sum / voters;
  const score = mean * participation;

  let insertIndex = toTierLength;
  if (voters === 0 || allActualVotesAgree) {
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
