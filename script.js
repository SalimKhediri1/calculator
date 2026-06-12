const body = document.body;
const expressionDisplay = document.getElementById("expressionDisplay");
const resultDisplay = document.getElementById("resultDisplay");
const previousDisplay = document.getElementById("previousDisplay");
const statusMessage = document.getElementById("statusMessage");
const historyList = document.getElementById("historyList");
const studySteps = document.getElementById("studySteps");
const graphCanvas = document.getElementById("graphCanvas");
const graphEquation = document.getElementById("graphEquation");
const graphCurrent = document.getElementById("graphCurrent");

let expression = "";
let previousCalculation = "";
let angleMode = "deg";
let justEvaluated = false;
let history = [];
let lastAnswer = "";
let graphState = { zoom: 42, offsetX: 0, offsetY: 0, dragging: false, lastX: 0, lastY: 0 };
let piClicks = [];

const FUNCTIONS = new Set(["sin", "cos", "tan", "asin", "acos", "atan", "log", "ln", "sqrt"]);
const CONSTANTS = { pi: Math.PI, e: Math.E };

function normalizeInput(input) {
  return input
    .replaceAll("π", "pi")
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("√", "sqrt")
    .replaceAll("²", "^2")
    .replaceAll("−", "-");
}

function formatNumber(value) {
  if (!Number.isFinite(value)) throw new Error("Invalid expression");
  if (Math.abs(value) < 1e-12) return "0";
  if (Math.abs(value) >= 1e12 || (Math.abs(value) > 0 && Math.abs(value) < 1e-8)) {
    return value.toExponential(8).replace(/\.?0+e/, "e");
  }
  return Number.isInteger(value) ? String(value) : parseFloat(value.toFixed(10)).toString();
}

function updateDisplay() {
  expressionDisplay.textContent = expression || "0";
  previousDisplay.textContent = previousCalculation || "Ready";

  if (!expression) {
    resultDisplay.textContent = "Enter a calculation";
    return;
  }

  try {
    resultDisplay.textContent = `= ${formatNumber(evaluate(expression))}`;
  } catch (error) {
    resultDisplay.textContent = "Waiting for a valid expression";
  }
}

function startsWithOperator(value) {
  return ["+", "-", "*", "/", "^", "%"].includes(value);
}

function addToExpression(value) {
  if (justEvaluated) {
    expression = startsWithOperator(value) ? expression : "";
    justEvaluated = false;
  }

  expression += value;
  updateDisplay();

  if (value === "pi") watchPiEasterEgg();
}

function clearCalculator() {
  expression = "";
  previousCalculation = "";
  justEvaluated = false;
  statusMessage.textContent = "";
  updateDisplay();
}

function deleteLastCharacter() {
  if (!expression) return;

  const functionMatch = expression.match(/(asin|acos|atan|sqrt|sin|cos|tan|log|ln)\($/);
  if (functionMatch) {
    expression = expression.slice(0, -functionMatch[0].length);
  } else if (expression.endsWith("pi")) {
    expression = expression.slice(0, -2);
  } else {
    expression = expression.slice(0, -1);
  }

  justEvaluated = false;
  updateDisplay();
}

function addInverse() {
  justEvaluated = false;
  expression = expression ? `1/(${expression})` : "1/(";
  updateDisplay();
}

function addAnswer() {
  if (!lastAnswer) return;
  if (justEvaluated) {
    expression = "";
    justEvaluated = false;
  }
  expression += lastAnswer;
  updateDisplay();
}

function evaluateExpression() {
  if (!expression) return;

  try {
    const result = formatNumber(evaluate(expression));
    const completed = { expression, result };
    previousCalculation = `${expression} = ${result}`;
    expression = result;
    lastAnswer = result;
    justEvaluated = true;
    addHistory(completed);
    renderStudySteps(completed.expression, completed.result);
    statusMessage.textContent = "Calculated safely.";
    updateDisplay();
  } catch (error) {
    resultDisplay.textContent = "Invalid expression";
    statusMessage.textContent = "Check parentheses, domains, and division by zero.";
  }
}

function flashButton(button) {
  button.classList.add("is-pressed");
  window.setTimeout(() => button.classList.remove("is-pressed"), 120);
}

function setAngleMode(mode) {
  angleMode = mode;
  document.querySelectorAll("[data-angle]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.angle === mode);
  });
  updateDisplay();
  drawGraph();
}

function setMode(mode) {
  body.dataset.mode = mode;
  document.querySelectorAll("[data-mode-choice]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.modeChoice === mode);
  });
  statusMessage.textContent =
    mode === "programmer" ? "Programmer tools are active below." : "Scientific mode is active.";
}

function setTheme(theme) {
  body.dataset.theme = theme;
  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.themeChoice === theme);
  });
  drawGraph();
}

function addHistory(item) {
  history.unshift(item);
  history = history.slice(0, 12);
  renderHistory();
}

function renderHistory() {
  historyList.replaceChildren();

  if (!history.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-note";
    emptyMessage.textContent = "No calculations yet.";
    historyList.appendChild(emptyMessage);
    return;
  }

  history.forEach((item) => {
    const button = document.createElement("button");
    button.className = "history-item";
    button.type = "button";
    const expressionLine = document.createElement("div");
    const resultLine = document.createElement("div");
    expressionLine.className = "history-expression";
    resultLine.className = "history-result";
    expressionLine.textContent = item.expression;
    resultLine.textContent = item.result;
    button.append(expressionLine, resultLine);
    button.addEventListener("click", () => {
      expression = item.expression;
      justEvaluated = false;
      updateDisplay();
      renderStudySteps(item.expression, item.result);
    });
    historyList.appendChild(button);
  });
}

function renderStudySteps(sourceExpression, result) {
  const normalized = normalizeInput(sourceExpression).replace(/\s/g, "");
  const steps = [];

  const sqrtMatch = normalized.match(/^sqrt\(([-\d.]+)\)$/);
  const powerMatch = normalized.match(/^([-\d.]+)\^2$/);
  const factorialMatch = normalized.match(/^(\d+)!$/);
  const binaryMatch = normalized.match(/^(.+)([+\-*/^])(.+)$/);

  if (sqrtMatch) {
    const value = Number(sqrtMatch[1]);
    const root = Math.sqrt(value);
    steps.push(`${formatNumber(root)} × ${formatNumber(root)} = ${formatNumber(value)}`);
    steps.push(`sqrt(${formatNumber(value)}) = ${result}`);
  } else if (powerMatch) {
    steps.push(`${powerMatch[1]} × ${powerMatch[1]} = ${result}`);
  } else if (factorialMatch) {
    steps.push(`${factorialMatch[1]}! multiplies every whole number from 1 to ${factorialMatch[1]}.`);
    steps.push(`${factorialMatch[1]}! = ${result}`);
  } else if (binaryMatch) {
    steps.push(`Parse the expression using parentheses and operator priority.`);
    steps.push(`${sourceExpression} = ${result}`);
  } else {
    steps.push(`Expression parsed by the safe calculator engine.`);
    steps.push(`Result = ${result}`);
  }

  studySteps.replaceChildren(
    ...steps.map((step) => {
      const item = document.createElement("p");
      item.textContent = step;
      return item;
    })
  );
}

function tokenize(input) {
  const normalized = normalizeInput(input);
  const tokens = [];
  let index = 0;

  while (index < normalized.length) {
    const character = normalized[index];

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (/\d|\./.test(character)) {
      let number = character;
      index += 1;
      while (index < normalized.length && /[\d.]/.test(normalized[index])) {
        number += normalized[index];
        index += 1;
      }
      if ((number.match(/\./g) || []).length > 1 || number === ".") throw new Error("Invalid number");
      tokens.push({ type: "number", value: Number(number) });
      continue;
    }

    if (/[a-z]/i.test(character)) {
      let name = character;
      index += 1;
      while (index < normalized.length && /[a-z]/i.test(normalized[index])) {
        name += normalized[index];
        index += 1;
      }
      tokens.push({ type: "name", value: name.toLowerCase() });
      continue;
    }

    if ("+-*/^()!%,".includes(character)) {
      tokens.push({ type: character, value: character });
      index += 1;
      continue;
    }

    throw new Error("Unknown character");
  }

  tokens.push({ type: "end" });
  return tokens;
}

function evaluate(input, variables = {}) {
  const parser = createParser(tokenize(input), variables);
  const result = parser.parseExpression();
  if (!parser.isAtEnd()) throw new Error("Invalid expression");
  return result;
}

function createParser(tokens, variables) {
  let current = 0;

  function peek() {
    return tokens[current];
  }

  function match(type) {
    if (peek().type !== type) return false;
    current += 1;
    return true;
  }

  function consume(type) {
    if (!match(type)) throw new Error("Invalid expression");
  }

  function startsPrimary(token) {
    return token.type === "number" || token.type === "name" || token.type === "(";
  }

  function parseExpression() {
    return parseAddSubtract();
  }

  function parseAddSubtract() {
    let value = parseMultiplyDivide();

    while (peek().type === "+" || peek().type === "-") {
      const operator = peek().type;
      current += 1;
      const right = parseMultiplyDivide();
      value = operator === "+" ? value + right : value - right;
    }

    return value;
  }

  function parseMultiplyDivide() {
    let value = parsePower();

    while (peek().type === "*" || peek().type === "/" || startsPrimary(peek())) {
      let operator = "*";
      if (peek().type === "*" || peek().type === "/") {
        operator = peek().type;
        current += 1;
      }

      const right = parsePower();
      if (operator === "/" && right === 0) throw new Error("Division by zero");
      value = operator === "*" ? value * right : value / right;
    }

    return value;
  }

  function parsePower() {
    let value = parseUnary();
    if (match("^")) value = Math.pow(value, parsePower());
    return value;
  }

  function parseUnary() {
    if (match("+")) return parseUnary();
    if (match("-")) return -parseUnary();
    return parsePostfix();
  }

  function parsePostfix() {
    let value = parsePrimary();

    while (peek().type === "!" || peek().type === "%") {
      if (match("!")) value = factorial(value);
      if (match("%")) value /= 100;
    }

    return value;
  }

  function parsePrimary() {
    const token = peek();

    if (match("number")) return token.value;

    if (match("name")) {
      if (token.value === "x") return variables.x ?? invalidMath();
      if (CONSTANTS[token.value] !== undefined) return CONSTANTS[token.value];
      if (!FUNCTIONS.has(token.value)) throw new Error("Unknown function");

      consume("(");
      const value = parseExpression();
      consume(")");
      return callFunction(token.value, value);
    }

    if (match("(")) {
      const value = parseExpression();
      consume(")");
      return value;
    }

    throw new Error("Invalid expression");
  }

  function isAtEnd() {
    return peek().type === "end";
  }

  return { parseExpression, isAtEnd };
}

function callFunction(name, value) {
  if (name === "sin") return Math.sin(toRadiansIfNeeded(value));
  if (name === "cos") return Math.cos(toRadiansIfNeeded(value));
  if (name === "tan") return Math.tan(toRadiansIfNeeded(value));
  if (name === "asin") return fromRadiansIfNeeded(Math.asin(value));
  if (name === "acos") return fromRadiansIfNeeded(Math.acos(value));
  if (name === "atan") return fromRadiansIfNeeded(Math.atan(value));
  if (name === "log") return value > 0 ? Math.log10(value) : invalidMath();
  if (name === "ln") return value > 0 ? Math.log(value) : invalidMath();
  if (name === "sqrt") return value >= 0 ? Math.sqrt(value) : invalidMath();
  throw new Error("Unknown function");
}

function toRadiansIfNeeded(value) {
  return angleMode === "deg" ? (value * Math.PI) / 180 : value;
}

function fromRadiansIfNeeded(value) {
  return angleMode === "deg" ? (value * 180) / Math.PI : value;
}

function factorial(value) {
  if (!Number.isInteger(value) || value < 0 || value > 170) throw new Error("Invalid factorial");
  let result = 1;
  for (let number = 2; number <= value; number += 1) result *= number;
  return result;
}

function invalidMath() {
  throw new Error("Invalid expression");
}

function drawGraph() {
  const context = graphCanvas.getContext("2d");
  if (!context) return;

  const ratio = window.devicePixelRatio || 1;
  const rect = graphCanvas.getBoundingClientRect();
  const width = rect.width || graphCanvas.clientWidth || 720;
  const height = rect.height || graphCanvas.clientHeight || 420;

  graphCanvas.width = width * ratio;
  graphCanvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const centerX = width / 2 + graphState.offsetX;
  const centerY = height / 2 + graphState.offsetY;
  const scale = graphState.zoom;
  const styles = getComputedStyle(body);
  const line = styles.getPropertyValue("--line").trim();
  const ink = styles.getPropertyValue("--ink").trim();
  const accent = styles.getPropertyValue("--accent").trim();
  const surface = styles.getPropertyValue("--surface-strong").trim();

  context.clearRect(0, 0, width, height);
  context.fillStyle = surface;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = line;
  context.lineWidth = 1;
  context.beginPath();
  for (let x = centerX % scale; x < width; x += scale) {
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }
  for (let y = centerY % scale; y < height; y += scale) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.stroke();

  context.strokeStyle = ink;
  context.globalAlpha = 0.55;
  context.beginPath();
  context.moveTo(0, centerY);
  context.lineTo(width, centerY);
  context.moveTo(centerX, 0);
  context.lineTo(centerX, height);
  context.stroke();
  context.globalAlpha = 1;

  const expressionToGraph = graphEquation.value.replace(/^y\s*=/i, "");
  graphCurrent.textContent = graphEquation.value || "y=";
  context.strokeStyle = accent;
  context.lineWidth = 2.5;
  context.beginPath();

  let drawing = false;
  for (let pixelX = 0; pixelX <= width; pixelX += 1) {
    const mathX = (pixelX - centerX) / scale;
    let mathY;

    try {
      mathY = evaluateGraphExpression(expressionToGraph, mathX);
    } catch (error) {
      drawing = false;
      continue;
    }

    if (!Number.isFinite(mathY) || Math.abs(mathY) > 1e6) {
      drawing = false;
      continue;
    }

    const pixelY = centerY - mathY * scale;
    if (!drawing) {
      context.moveTo(pixelX, pixelY);
      drawing = true;
    } else {
      context.lineTo(pixelX, pixelY);
    }
  }

  context.stroke();
}

function evaluateGraphExpression(graphExpression, xValue) {
  const savedAngleMode = angleMode;
  angleMode = "rad";

  try {
    return evaluate(graphExpression, { x: xValue });
  } finally {
    angleMode = savedAngleMode;
  }
}

const formulaDefinitions = {
  quadratic: {
    name: "Quadratic Formula",
    fields: ["a", "b", "c"],
    calculate(values) {
      const discriminant = values.b ** 2 - 4 * values.a * values.c;
      if (values.a === 0) return "a cannot be 0.";
      if (discriminant < 0) return `Discriminant ${formatNumber(discriminant)}: no real roots.`;
      const rootOne = (-values.b + Math.sqrt(discriminant)) / (2 * values.a);
      const rootTwo = (-values.b - Math.sqrt(discriminant)) / (2 * values.a);
      return `x = ${formatNumber(rootOne)} or ${formatNumber(rootTwo)}`;
    },
  },
  distance: {
    name: "Distance Formula",
    fields: ["x1", "y1", "x2", "y2"],
    calculate(values) {
      return `d = ${formatNumber(Math.hypot(values.x2 - values.x1, values.y2 - values.y1))}`;
    },
  },
  pythagorean: {
    name: "Pythagorean Theorem",
    fields: ["a", "b"],
    calculate(values) {
      return `c = ${formatNumber(Math.hypot(values.a, values.b))}`;
    },
  },
  ohm: {
    name: "Ohm's Law",
    fields: ["voltage", "current", "resistance"],
    calculate(values) {
      if (Number.isNaN(values.voltage)) return `V = ${formatNumber(values.current * values.resistance)}`;
      if (Number.isNaN(values.current)) return `I = ${formatNumber(values.voltage / values.resistance)}`;
      if (Number.isNaN(values.resistance)) return `R = ${formatNumber(values.voltage / values.current)}`;
      return "Leave one field blank to solve it.";
    },
  },
  wave: {
    name: "Wave Speed",
    fields: ["frequency", "wavelength"],
    calculate(values) {
      return `v = ${formatNumber(values.frequency * values.wavelength)}`;
    },
  },
  variance: {
    name: "Variance",
    fields: ["values"],
    calculate(values) {
      const list = parseList(values.values);
      const mean = average(list);
      return `variance = ${formatNumber(average(list.map((value) => (value - mean) ** 2)))}`;
    },
  },
  standardDeviation: {
    name: "Standard Deviation",
    fields: ["values"],
    calculate(values) {
      const list = parseList(values.values);
      const mean = average(list);
      return `σ = ${formatNumber(Math.sqrt(average(list.map((value) => (value - mean) ** 2))))}`;
    },
  },
  zScore: {
    name: "Z-score",
    fields: ["value", "mean", "standardDeviation"],
    calculate(values) {
      return `z = ${formatNumber((values.value - values.mean) / values.standardDeviation)}`;
    },
  },
};

function parseList(value) {
  const list = String(value)
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((number) => Number.isFinite(number));
  if (!list.length) throw new Error("Invalid list");
  return list;
}

function average(list) {
  return list.reduce((sum, value) => sum + value, 0) / list.length;
}

function setupFormulas() {
  const formulaSelect = document.getElementById("formulaSelect");
  formulaSelect.innerHTML = Object.entries(formulaDefinitions)
    .map(([key, formula]) => `<option value="${key}">${formula.name}</option>`)
    .join("");
  formulaSelect.addEventListener("change", renderFormulaFields);
  document.getElementById("calculateFormula").addEventListener("click", calculateFormula);
  renderFormulaFields();
}

function renderFormulaFields() {
  const formulaKey = document.getElementById("formulaSelect").value;
  const formula = formulaDefinitions[formulaKey];
  const fields = document.getElementById("formulaFields");
  fields.replaceChildren(
    ...formula.fields.map((field) => {
      const wrapper = document.createElement("div");
      const label = document.createElement("label");
      const input = document.createElement("input");
      const inputId = `formula-${field}`;

      wrapper.className = "field";
      label.htmlFor = inputId;
      label.textContent = field;
      input.id = inputId;
      input.dataset.formulaField = field;
      input.placeholder = field === "values" ? "2,4,6" : field;
      wrapper.append(label, input);
      return wrapper;
    })
  );
  document.getElementById("formulaResult").textContent = `${formula.name} ready.`;
}

function calculateFormula() {
  const formulaKey = document.getElementById("formulaSelect").value;
  const formula = formulaDefinitions[formulaKey];
  const values = {};

  document.querySelectorAll("[data-formula-field]").forEach((input) => {
    const key = input.dataset.formulaField;
    values[key] = key === "values" ? input.value : Number(input.value);
    if (key !== "values" && input.value.trim() === "") values[key] = NaN;
  });

  try {
    document.getElementById("formulaResult").textContent = formula.calculate(values);
  } catch (error) {
    document.getElementById("formulaResult").textContent = "Invalid formula input.";
  }
}

const converters = {
  length: {
    units: ["m", "km", "ft"],
    toBase: { m: (v) => v, km: (v) => v * 1000, ft: (v) => v * 0.3048 },
    fromBase: { m: (v) => v, km: (v) => v / 1000, ft: (v) => v / 0.3048 },
  },
  mass: {
    units: ["kg", "lb"],
    toBase: { kg: (v) => v, lb: (v) => v * 0.45359237 },
    fromBase: { kg: (v) => v, lb: (v) => v / 0.45359237 },
  },
  temperature: {
    units: ["Celsius", "Fahrenheit"],
    toBase: { Celsius: (v) => v, Fahrenheit: (v) => ((v - 32) * 5) / 9 },
    fromBase: { Celsius: (v) => v, Fahrenheit: (v) => (v * 9) / 5 + 32 },
  },
  speed: {
    units: ["km/h", "m/s"],
    toBase: { "km/h": (v) => v / 3.6, "m/s": (v) => v },
    fromBase: { "km/h": (v) => v * 3.6, "m/s": (v) => v },
  },
};

function setupConverter() {
  const category = document.getElementById("converterCategory");
  category.innerHTML = Object.keys(converters)
    .map((key) => `<option value="${key}">${key}</option>`)
    .join("");
  category.addEventListener("change", renderConverterUnits);
  ["converterValue", "converterFrom", "converterTo"].forEach((id) => {
    document.getElementById(id).addEventListener("input", convertUnits);
  });
  renderConverterUnits();
}

function renderConverterUnits() {
  const converter = converters[document.getElementById("converterCategory").value];
  const options = converter.units.map((unit) => `<option value="${unit}">${unit}</option>`).join("");
  document.getElementById("converterFrom").innerHTML = options;
  document.getElementById("converterTo").innerHTML = options;
  document.getElementById("converterTo").selectedIndex = 1;
  convertUnits();
}

function convertUnits() {
  const type = document.getElementById("converterCategory").value;
  const value = Number(document.getElementById("converterValue").value);
  const from = document.getElementById("converterFrom").value;
  const to = document.getElementById("converterTo").value;
  const converter = converters[type];

  if (!Number.isFinite(value)) {
    document.getElementById("converterResult").textContent = "Invalid value.";
    return;
  }

  const baseValue = converter.toBase[from](value);
  const converted = converter.fromBase[to](baseValue);
  document.getElementById("converterResult").textContent = `${formatNumber(value)} ${from} = ${formatNumber(
    converted
  )} ${to}`;
}

function runProgrammer() {
  const base = Number(document.getElementById("programmerBase").value);
  const first = parseProgrammerValue(document.getElementById("programmerA").value, base);
  const second = parseProgrammerValue(document.getElementById("programmerB").value || "0", base);
  const operation = document.getElementById("programmerOperation").value;

  if (!Number.isFinite(first) || (operation !== "NOT" && !Number.isFinite(second))) {
    document.getElementById("programmerResult").textContent = "Invalid programmer input.";
    return;
  }

  const operations = {
    AND: first & second,
    OR: first | second,
    XOR: first ^ second,
    NOT: ~first,
    LSHIFT: first << second,
    RSHIFT: first >> second,
  };
  const result = operations[operation];

  document.getElementById("binOutput").textContent = result.toString(2);
  document.getElementById("octOutput").textContent = result.toString(8);
  document.getElementById("decOutput").textContent = result.toString(10);
  document.getElementById("hexOutput").textContent = result.toString(16).toUpperCase();
  document.getElementById("programmerResult").textContent = `${operation} result: ${result}`;
}

function parseProgrammerValue(value, base) {
  const text = value.trim();
  const patterns = {
    2: /^[01]+$/i,
    8: /^[0-7]+$/i,
    10: /^-?\d+$/i,
    16: /^-?[0-9a-f]+$/i,
  };

  if (!patterns[base].test(text)) return NaN;
  return parseInt(text, base);
}

function handleKeyboard(key) {
  if (/^\d$/.test(key) || ["+", "-", "*", "/", "^", ".", "(", ")", "!", "%"].includes(key)) {
    addToExpression(key);
    return true;
  }
  if (key === "Enter" || key === "=") {
    evaluateExpression();
    return true;
  }
  if (key === "Backspace" || key === "Delete") {
    deleteLastCharacter();
    return true;
  }
  if (key === "Escape" || key.toLowerCase() === "c") {
    clearCalculator();
    return true;
  }
  if (key.toLowerCase() === "p") {
    addToExpression("pi");
    return true;
  }
  return false;
}

function isEditingTextField(target) {
  if (!target || target === document.body) return false;

  const tagName = target.tagName ? target.tagName.toLowerCase() : "";
  return ["input", "textarea", "select"].includes(tagName) || target.isContentEditable;
}

function watchPiEasterEgg() {
  const now = Date.now();
  piClicks = piClicks.filter((time) => now - time < 2200);
  piClicks.push(now);

  if (piClicks.length >= 3) {
    statusMessage.textContent = "π rhythm unlocked: elegant enough.";
    body.classList.add("celebrate");
    window.setTimeout(() => body.classList.remove("celebrate"), 520);
    piClicks = [];
  }
}

function setupEvents() {
  document.querySelectorAll("[data-insert]").forEach((button) => {
    button.addEventListener("click", () => {
      addToExpression(button.dataset.insert);
      flashButton(button);
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.action === "clear") clearCalculator();
      if (button.dataset.action === "delete") deleteLastCharacter();
      if (button.dataset.action === "equals") evaluateExpression();
      if (button.dataset.action === "inverse") addInverse();
      if (button.dataset.action === "answer") addAnswer();
      if (button.dataset.action === "steps" && expression) {
        try {
          renderStudySteps(expression, formatNumber(evaluate(expression)));
        } catch (error) {
          studySteps.innerHTML = "<p>Complete a valid expression first.</p>";
        }
      }
      flashButton(button);
    });
  });

  document.querySelectorAll("[data-angle]").forEach((button) => {
    button.addEventListener("click", () => setAngleMode(button.dataset.angle));
  });

  document.querySelectorAll("[data-mode-choice]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.modeChoice));
  });

  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.themeChoice));
  });

  document.getElementById("clearHistory").addEventListener("click", () => {
    history = [];
    renderHistory();
  });

  document.getElementById("drawGraph").addEventListener("click", drawGraph);
  graphEquation.addEventListener("input", drawGraph);
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      graphEquation.value = button.dataset.preset;
      drawGraph();
    });
  });
  document.querySelectorAll("[data-graph]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.graph === "zoom-in") graphState.zoom *= 1.2;
      if (button.dataset.graph === "zoom-out") graphState.zoom /= 1.2;
      if (button.dataset.graph === "reset") graphState = { ...graphState, zoom: 42, offsetX: 0, offsetY: 0 };
      drawGraph();
    });
  });

  graphCanvas.addEventListener("pointerdown", (event) => {
    graphState.dragging = true;
    graphState.lastX = event.clientX;
    graphState.lastY = event.clientY;
    if (graphCanvas.setPointerCapture) {
      graphCanvas.setPointerCapture(event.pointerId);
    }
  });
  graphCanvas.addEventListener("pointermove", (event) => {
    if (!graphState.dragging) return;
    graphState.offsetX += event.clientX - graphState.lastX;
    graphState.offsetY += event.clientY - graphState.lastY;
    graphState.lastX = event.clientX;
    graphState.lastY = event.clientY;
    drawGraph();
  });
  graphCanvas.addEventListener("pointerup", () => {
    graphState.dragging = false;
  });

  document.getElementById("runProgrammer").addEventListener("click", runProgrammer);
  ["programmerBase", "programmerA", "programmerB", "programmerOperation"].forEach((id) => {
    document.getElementById(id).addEventListener("input", runProgrammer);
  });

  document.addEventListener("keydown", (event) => {
    if (isEditingTextField(event.target)) return;

    if (handleKeyboard(event.key)) {
      event.preventDefault();
      const button = [...document.querySelectorAll("button")].find((candidate) => {
        return (
          candidate.dataset.insert === event.key ||
          (event.key === "p" && candidate.dataset.insert === "pi") ||
          (candidate.dataset.action === "equals" && (event.key === "Enter" || event.key === "=")) ||
          (candidate.dataset.action === "delete" && (event.key === "Backspace" || event.key === "Delete")) ||
          (candidate.dataset.action === "clear" && (event.key === "Escape" || event.key.toLowerCase() === "c"))
        );
      });
      if (button) flashButton(button);
    }
  });

  window.addEventListener("resize", drawGraph);
}

setupEvents();
setupFormulas();
setupConverter();
runProgrammer();
renderHistory();
updateDisplay();
drawGraph();
