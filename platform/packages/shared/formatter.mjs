import { COLOR_NAMES, DIRECTION_NAMES } from "./constants.mjs";

const EVENT_TEXT = {
  zh: { key: "取得鑰匙", treasure: "開啟寶箱" },
  ja: { key: "鍵を入手", treasure: "宝箱を開ける" },
  en: { key: "Obtain the key", treasure: "Open the treasure chest" }
};

function assertLanguage(language) {
  if (!COLOR_NAMES[language]) throw new Error(`Unsupported language: ${language}`);
}

function formatAction(step, language) {
  const colors = COLOR_NAMES[language];
  const directions = DIRECTION_NAMES[language];
  const walk = colors[step.walkTo];
  const tile = colors[step.tile];

  if (!walk || !tile) throw new Error("Answer step contains an invalid color.");

  if (step.type === "moveTile") {
    const reference = colors[step.relativeTo];
    const direction = directions[step.direction];
    if (!reference || !direction) throw new Error("Move step contains an invalid reference or direction.");

    if (language === "zh") return `走到${walk}，${tile}移至${reference}${direction}。`;
    if (language === "ja") return `${walk}へ進み、${tile}を${reference}の${direction}へ移動。`;
    return `Go to ${walk}; move ${tile} ${direction} of ${reference}.`;
  }

  if (step.type === "rotateTile") {
    const clockwise = step.rotation === "clockwise";
    if (language === "zh") return `走到${walk}，${tile}${clockwise ? "順時針" : "逆時針"}旋轉 120°。`;
    if (language === "ja") return `${walk}へ進み、${tile}を${clockwise ? "時計回り" : "反時計回り"}に120°回転。`;
    return `Go to ${walk}; rotate ${tile} 120° ${clockwise ? "clockwise" : "counterclockwise"}.`;
  }

  throw new Error(`Unsupported answer step: ${step.type}`);
}

export function formatSolution(solution, language = "zh") {
  assertLanguage(language);
  const steps = Array.isArray(solution?.steps) ? solution.steps : [];
  let actionNumber = 0;

  return steps.map(step => {
    if (step.type === "event") {
      const event = EVENT_TEXT[language][step.event];
      if (!event) throw new Error(`Unsupported solution event: ${step.event}`);
      return `• ${event}`;
    }

    actionNumber += 1;
    return `${actionNumber}. ${formatAction(step, language)}`;
  }).join("\n");
}

export function formatAllLanguages(solution) {
  return {
    zh: formatSolution(solution, "zh"),
    ja: formatSolution(solution, "ja"),
    en: formatSolution(solution, "en")
  };
}
