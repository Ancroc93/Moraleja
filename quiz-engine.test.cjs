const test = require("node:test");
const assert = require("node:assert/strict");

global.window = global;
require("./quiz-engine.js");

function answersFor(mode) {
  const answers = {};
  CLARA.interactions.forEach((interaction) => {
    if (interaction.type === "scale" || interaction.type === "choice") {
      const scores = interaction.options.map((option) => option.score);
      const target = mode === "best" ? Math.max(...scores) : Math.min(...scores);
      answers[interaction.id] = scores.indexOf(target);
    } else if (interaction.type === "classify") {
      answers[interaction.id] = Object.fromEntries(
        interaction.items.map((item) => [
          item.id,
          mode === "best"
            ? item.answer
            : item.answer === "observation"
              ? "interpretation"
              : "observation",
        ]),
      );
    } else if (interaction.type === "selectTwo") {
      answers[interaction.id] = interaction.options
        .slice()
        .sort((a, b) => mode === "best" ? b.score - a.score : a.score - b.score)
        .slice(0, 2)
        .map((option) => option.id);
    } else if (interaction.type === "sequence") {
      answers[interaction.id] = mode === "best"
        ? interaction.correctOrder.slice()
        : interaction.correctOrder.slice().reverse();
    } else if (interaction.type === "builder") {
      answers[interaction.id] = Object.fromEntries(
        interaction.groups.map((group) => {
          const options = group.options.slice().sort((a, b) =>
            mode === "best" ? b.score - a.score : a.score - b.score
          );
          return [group.id, options[0].id];
        }),
      );
    }
  });
  return answers;
}

test("CLARA mantiene 20 interacciones equilibradas", () => {
  assert.equal(CLARA.interactions.length, 20);
  assert.equal(CLARA.interactions.filter((item) => item.kind === "behavior").length, 10);
  assert.equal(CLARA.interactions.filter((item) => item.kind === "situation").length, 5);
  assert.equal(CLARA.interactions.filter((item) => item.kind === "applied").length, 5);
  CLARA.DIMS.forEach((dim) => {
    assert.equal(CLARA.interactions.filter((item) => item.dim === dim).length, 4);
  });
});

test("cada interacción conserva su rango de puntaje 0–4", () => {
  CLARA.interactions.forEach((interaction) => {
    assert.ok(["scale", "choice", "selectTwo", "builder"].includes(interaction.type), interaction.id);
    if (interaction.type === "scale") {
      assert.deepEqual(interaction.options.map((option) => option.text), ["Nunca", "Rara vez", "A veces", "Casi siempre", "Siempre"]);
      assert.deepEqual(interaction.options.map((option) => option.score).sort(), [0, 1, 2, 3, 4], interaction.id);
    } else if (interaction.type === "choice") {
      const scores = interaction.options.map((option) => option.score);
      assert.equal(Math.max(...scores), 4, interaction.id);
      assert.equal(Math.min(...scores), 0, interaction.id);
    } else if (interaction.type === "selectTwo") {
      const top = interaction.options.map((option) => option.score).sort((a, b) => b - a);
      assert.equal(top[0] + top[1], 4, interaction.id);
      assert.ok(top.every((score) => score >= 0 && score <= 2), interaction.id);
    } else if (interaction.type === "builder") {
      interaction.groups.forEach((group) => {
        assert.equal(Math.max(...group.options.map((option) => option.score)), 2, interaction.id);
      });
    }
  });
});

test("los ítems de escala redactados en negativo puntúan en sentido inverso", () => {
  const reversed = CLARA.interactions.filter((item) => item.type === "scale" && item.options[0].score === 4);
  assert.deepEqual(reversed.map((item) => item.id).sort(), ["ac-beh-1", "al-beh-1", "c-beh-1", "l-beh-1", "r-beh-1"]);
  assert.equal(CLARA.scoreInteraction(reversed[0], 4), 0);
});

test("la combinación de mayor evidencia produce La Brújula", () => {
  const result = CLARA.calculateResult(answersFor("best"));
  CLARA.DIMS.forEach((dim) => assert.equal(result.scores[dim], 100));
  assert.equal(result.primary, "brujula");
  assert.equal(result.secondary, null);
});

test("la combinación mínima permanece dentro del rango y no produce La Brújula", () => {
  const result = CLARA.calculateResult(answersFor("worst"));
  CLARA.DIMS.forEach((dim) => {
    assert.ok(result.scores[dim] >= 0);
    assert.ok(result.scores[dim] <= 100);
  });
  assert.notEqual(result.primary, "brujula");
});

test("las dimensiones cercanas pueden producir influencia secundaria", () => {
  const match = CLARA.determineArchetypes({
    consciencia: 25,
    lenguaje: 31,
    alineacion: 72,
    relaciones: 76,
    accion: 81,
  });
  assert.equal(match.primary, "chispa");
  assert.equal(match.secondary, "voz");
});

test("el payload conserva versiones, arquetipos y herramientas", () => {
  const result = CLARA.calculateResult(answersFor("best"));
  const payload = CLARA.buildResultPayload(result, "2026-10-13T00:00:00.000Z");
  assert.equal(payload.instrumentVersion, CLARA.VERSION);
  assert.equal(payload.scoringVersion, CLARA.SCORING_VERSION);
  assert.equal(payload.archetype.name, "La Brújula");
  assert.equal(payload.dimensionMeta.consciencia.label, "Consciencia");
  assert.ok(payload.tools.now.name);
  assert.ok(payload.tools.challenge.name);
  assert.ok(payload.tools.script);
});
