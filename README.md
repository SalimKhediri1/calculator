# Odin Scientific Calculator

A polished, dependency-free calculator web app built with plain HTML, CSS, and JavaScript.

## What is included

- Scientific calculator with arithmetic, parentheses, decimals, percentage, powers, square root, inverse, factorial, `pi`, and `e`.
- Trigonometry and inverse trigonometry with DEG/RAD mode.
- Logarithms with `log` and `ln`.
- Safe expression parser instead of direct `eval`.
- Previous calculation display, live result display, history, and click-to-reuse history items.
- Study Mode with concise steps for selected expressions.
- Canvas graphing for equations like `y=x^2`, `y=sin(x)`, `y=cos(x)`, `y=log(x)`, and `y=sqrt(x)`.
- Formula library for common math, physics, and statistics formulas.
- Unit converter for length, mass, temperature, and speed.
- Programmer mode for binary, decimal, octal, hexadecimal, and bitwise operations.
- Minimal, Cyberpunk, and Retro Casio themes.

## Run locally

Open `calculator.html` directly in your browser.

You can also serve the folder locally:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000/calculator.html
```

## Manual testing checklist

- `2 + 3 =` should show `5`.
- `(2 + 3) * 4 =` should show `20`.
- `sin(30) =` in DEG mode should show `0.5`.
- `asin(0.5) =` in DEG mode should show `30`.
- `log(100) =` should show `2`.
- `ln(e) =` should show `1`.
- `sqrt(16) =` should show `4`.
- `2 ^ 3 =` should show `8`.
- `5! =` should show `120`.
- `50% =` should show `0.5`.
- `1 / 0 =` should show `Invalid expression`.
- Add two calculations, then click one in History to reuse it.
- Draw `y=sin(x)`, `y=x^2`, and `y=sqrt(x)` in Courbes.
- Use zoom and drag on the graph canvas.
- Formula Library: test Pythagorean with `a=3`, `b=4` and expect `c=5`.
- Unit Converter: convert `1 km` to `m` and expect `1000 m`.
- Programmer Mode: decimal `12 AND 5` should produce decimal `4`.
- Keyboard: number keys, operators, `Enter`, `Backspace`, `Escape`, and `C` should work.
