const numberSelected = document.querySelectorAll(
  ".buttons button:not(.clear):not(.equals):not(.operator)"
);
const display = document.getElementById("display");
const clear = document.querySelector(".clear");
const operators = document.querySelectorAll(".operator");
const equall = document.querySelector(".equals");
equall.addEventListener("click", () => {
  let expression = display.textContent;

  if (!checkexpression(display.textContent)) {
    display.textContent = "ADD a number first";
    return;
  }

  if (!["+", "-", "*", "/"].some((op) => expression.includes(op))) {
    display.textContent = "ADD an operator";
    return;
  }
  let result = evaluates(display.textContent);
  display.textContent = result;
});


operators.forEach((opButton) => {
  opButton.addEventListener("click", () => {
    const opSymbol = opButton.textContent;
    if (!checkexpression(display.textContent)) {
      display.textContent = "ADD a number first";
    } else {
      if (["+", "-", "*", "/"].includes(display.textContent.slice(-1))) {
        display.textContent = display.textContent.slice(0, -1) + opSymbol;
      } else if (["+", "-", "*", "/"].some((op) => display.textContent.includes(op))) {
        const currentRes = evaluates(display.textContent);
        display.textContent = currentRes;
        if (!currentRes.startsWith("ERROR") && !currentRes.includes("Invalid")) {
          display.textContent += opSymbol;
        }
      } else {
        display.textContent += opSymbol;
      }
    }
  });
});

function checkexpression(exp) {
  return !(
    exp === "0" ||
    exp === "" ||
    exp === "ADD a number first" ||
    exp === "ADD an operator" ||
    exp === "NaN" ||
    exp.startsWith("ERROR") ||
    exp.includes("Invalid") ||
    exp.includes("Incomplete")
  );
}

numberSelected.forEach((button) => {
  button.addEventListener("click", () => {
    const number = button.textContent;
    if (!checkexpression(display.textContent)) {
      display.textContent = number;
    } else {
      display.textContent += number;
    }
  });
});

clear.addEventListener("click", () => {
  display.textContent = "0";
});

function operate(op, a, b) {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b !== 0 ? a / b : "ERROR: Division By ZERO";
    default:
      return "Invalid operator";
  }
}
function evaluates(expression) {
  expression = expression.trim();
  let op = null;
  let index = -1;
  for (let i = 0; i < expression.length; i++) {
    if (
      expression[i] === "*" ||
      expression[i] === "/" ||
      expression[i] === "-" ||
      expression[i] === "+"
    ) {
      op = expression[i];
      index = i;
      break;
    }
  }
  if (!op || expression === "") {
    return "Invalid expression";
  }
  let a = expression.slice(0, index).trim();
  let b = expression.slice(index + 1).trim();
  if (!a || !b) {
    return "Incomplete expression";
  }
  let num1 = parseFloat(a);
  let num2 = parseFloat(b);
  if (isNaN(num1) || isNaN(num2)) {
    return "Invalid Numbers";
  }
  const res = operate(op, num1, num2);
  if (typeof res === "string") {
    return res;
  }
  return res.toString();
}
