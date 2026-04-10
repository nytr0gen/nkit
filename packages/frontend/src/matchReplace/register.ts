import {
  type FrontendSDK,
  type MatchReplaceRule,
  MatchReplaceSlot,
} from "@/caido";

const duplicateRuleLabel = "Duplicate Rule";

const duplicateNamePattern = /^(.*?)(?: (\d+))?$/;

const splitRuleName = (name: string) => {
  const match = name.match(duplicateNamePattern);
  if (match === null) {
    return {
      baseName: name,
      suffix: undefined,
    };
  }

  const baseName = match[1];
  const suffixText = match[2];
  return {
    baseName,
    suffix:
      suffixText === undefined ? undefined : Number.parseInt(suffixText, 10),
  };
};

const getNextDuplicateName = (
  rule: MatchReplaceRule,
  allRules: MatchReplaceRule[],
) => {
  const { baseName } = splitRuleName(rule.name);
  const relatedRules = allRules.filter((candidate) => {
    if (candidate.collectionId !== rule.collectionId) {
      return false;
    }

    return splitRuleName(candidate.name).baseName === baseName;
  });

  const maxSuffix = relatedRules.reduce((currentMax, candidate) => {
    const { suffix } = splitRuleName(candidate.name);
    const nextValue = suffix ?? 1;
    return nextValue > currentMax ? nextValue : currentMax;
  }, 1);

  return `${baseName} ${maxSuffix + 1}`;
};

const duplicateCurrentRule = async (sdk: FrontendSDK) => {
  const currentRule = sdk.matchReplace.getCurrentRule();
  if (currentRule === undefined) {
    sdk.window.showToast("No Match and Replace rule is currently selected", {
      variant: "warning",
    });
    return;
  }

  const duplicatedRule = await sdk.matchReplace.createRule({
    collectionId: currentRule.collectionId,
    name: getNextDuplicateName(currentRule, sdk.matchReplace.getRules()),
    query: currentRule.query,
    section: currentRule.section,
    sources: currentRule.sources ?? [],
  });

  if (duplicatedRule.isEnabled !== currentRule.isEnabled) {
    await sdk.matchReplace.toggleRule(duplicatedRule.id, currentRule.isEnabled);
  }

  sdk.matchReplace.selectRule(duplicatedRule.id);
  sdk.window.showToast(`Created "${duplicatedRule.name}"`, {
    variant: "success",
  });
};

export const registerMatchReplaceFeature = (sdk: FrontendSDK) => {
  sdk.matchReplace.addToSlot(MatchReplaceSlot.UpdateHeader, {
    type: "Button",
    label: duplicateRuleLabel,
    icon: "fas fa-copy",
    onClick: async () => {
      await duplicateCurrentRule(sdk);
    },
  });
};
