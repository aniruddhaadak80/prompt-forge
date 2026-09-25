import { sealEvent } from "./canonical";
import type { BuildKind, EngineFactor, EngineResult } from "./types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const countMatches = (value: string, expression: RegExp) => value.match(expression)?.length ?? 0;

function factor(key: string, label: string, weight: number, value: number, detail: string): EngineFactor {
  const bounded = Math.round(clamp(value, 0, 100));
  return {
    key,
    label,
    weight,
    value: bounded,
    contribution: Math.round((bounded * weight) / 100),
    detail,
  };
}

export function analyzePrompt(prompt: string, kind: BuildKind, sourceIds: string[] = []): EngineResult {
  const normalized = prompt.trim().toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const concrete = countMatches(normalized, /\b(make|build|create|render|draw|play|move|control|score|track|show|add|use|with|and|then|when)\b/g);
  const controls = countMatches(normalized, /\b(button|slider|keyboard|mouse|drag|touch|click|play|pause|reset|select|toggle|orbit|zoom)\b/g);
  const visual = countMatches(normalized, /\b(color|palette|neon|dark|light|texture|shader|svg|canvas|three|3d|animation|motion|typography)\b/g);
  const constraints = countMatches(normalized, /\b(must|without|no|single|self-contained|responsive|mobile|fallback|deterministic|safe|playable|complete)\b/g);
  const sourceBonus = Math.min(10, sourceIds.length * 3);
  const lengthValue = clamp((words.length / 28) * 100, 0, 100);
  const factors = [
    factor("specificity", "Specificity", 30, clamp((concrete / Math.max(1, words.length / 12)) * 100 + lengthValue * 0.25, 0, 100), `${words.length} words and ${concrete} action words`),
    factor("interaction", "Interaction contract", 25, clamp((controls / 4) * 100, 0, 100), `${controls} control or input signals`),
    factor("visualDirection", "Visual direction", 20, clamp((visual / 4) * 100, 0, 100), `${visual} visual or rendering signals`),
    factor("constraints", "Safety and constraints", 15, clamp((constraints / 3) * 100, 0, 100), `${constraints} explicit constraints`),
    factor("evidence", "Source grounding", 10, clamp(sourceBonus, 0, 100), `${sourceIds.length} attached source records`),
  ];
  const score = clamp(factors.reduce((sum, item) => sum + item.contribution, 0), 0, 100);
  const recommendation = score >= 80
    ? "Ready for a focused playtest: add a failure state and share it."
    : score >= 60
      ? "Promising scaffold: name the primary action and one measurable success state."
      : "Needs a sharper brief: specify the subject, controls, visual system, and done condition.";
  const base = {
    version: "forge-engine-1.0.0",
    score,
    recommendation,
    factors,
    metadata: { kind, sourceCount: sourceIds.length, promptLength: prompt.length },
  };
  return { ...base, seal: sealEvent("", base) };
}
