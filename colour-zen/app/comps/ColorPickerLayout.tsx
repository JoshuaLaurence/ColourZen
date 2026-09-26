"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./ColorPickerLayout.module.css";

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

type ColorPickerLayoutProps = {
  color: string;
  onColorChange: (color: string) => void;
  children: ReactNode;
};

function hexToRgb(hex: string): RGB {
  const value = hex.replace(/^#/, "");
  const expanded =
    value.length === 3
      ? [...value].map((digit) => digit + digit).join("")
      : value;
  const number = Number.parseInt(expanded, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    switch (max) {
      case red:
        hue = ((green - blue) / delta) % 6;
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return {
    h: Math.round(hue),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

function hslToHex({ h, s, l }: HSL): string {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hueSection = h / 60;
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hueSection < 1) [red, green] = [chroma, secondary];
  else if (hueSection < 2) [red, green] = [secondary, chroma];
  else if (hueSection < 3) [green, blue] = [chroma, secondary];
  else if (hueSection < 4) [green, blue] = [secondary, chroma];
  else if (hueSection < 5) [red, blue] = [secondary, chroma];
  else [red, blue] = [chroma, secondary];

  const match = lightness - chroma / 2;
  return rgbToHex({
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  });
}

function normalizeHex(value: string): string | undefined {
  const hex = value.trim().replace(/^#/, "");
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) return undefined;
  const expanded =
    hex.length === 3 ? [...hex].map((digit) => digit + digit).join("") : hex;
  return `#${expanded.toLowerCase()}`;
}

export default function ColorPickerLayout({
  color,
  onColorChange,
  children,
}: ColorPickerLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState(color.toUpperCase());
  const [rgbDraft, setRgbDraft] = useState(() => {
    const initialRgb = hexToRgb(color);
    return [String(initialRgb.r), String(initialRgb.g), String(initialRgb.b)];
  });
  const [inputError, setInputError] = useState("");
  const activeInput = useRef<"hex" | "rgb" | null>(null);
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb);

  useEffect(() => {
    if (activeInput.current !== "hex") setHexDraft(color.toUpperCase());
    if (activeInput.current !== "rgb") {
      setRgbDraft([String(rgb.r), String(rgb.g), String(rgb.b)]);
    }
    setInputError("");
  }, [color, rgb.r, rgb.g, rgb.b]);

  function updateHsl(next: HSL) {
    onColorChange(hslToHex(next));
  }

  function handleHexChange(value: string) {
    activeInput.current = "hex";
    setHexDraft(value);
    setInputError("");
    const normalized = normalizeHex(value);
    if (normalized) onColorChange(normalized);
  }

  function finishHexInput() {
    activeInput.current = null;
    const normalized = normalizeHex(hexDraft);
    if (!normalized) {
      setInputError("Enter a 3- or 6-digit HEX value.");
      setHexDraft(color.toUpperCase());
      return;
    }
    setInputError("");
    setHexDraft(normalized.toUpperCase());
    onColorChange(normalized);
  }

  function handleRgbChange(index: number, value: string) {
    activeInput.current = "rgb";
    const nextDraft = rgbDraft.map((channel, channelIndex) =>
      channelIndex === index ? value : channel,
    );
    setRgbDraft(nextDraft);
    setInputError("");

    const channels = nextDraft.map((channel) =>
      channel.trim() === "" ? Number.NaN : Number(channel),
    );
    if (
      !channels.some(
        (channel) => !Number.isInteger(channel) || channel < 0 || channel > 255,
      )
    ) {
      onColorChange(
        rgbToHex({ r: channels[0], g: channels[1], b: channels[2] }),
      );
    }
  }

  function finishRgbInput() {
    activeInput.current = null;
    const channels = rgbDraft.map((value) =>
      value.trim() === "" ? Number.NaN : Number(value),
    );
    if (
      channels.some(
        (channel) => !Number.isInteger(channel) || channel < 0 || channel > 255,
      )
    ) {
      setInputError("RGB channels must be whole numbers from 0 to 255.");
      setRgbDraft([String(rgb.r), String(rgb.g), String(rgb.b)]);
      return;
    }
    setInputError("");
    onColorChange(rgbToHex({ r: channels[0], g: channels[1], b: channels[2] }));
  }

  const hueTrack: CSSProperties = {
    "--range-track":
      "linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
  } as CSSProperties;
  const saturationTrack: CSSProperties = {
    "--range-track": `linear-gradient(90deg, hsl(${hsl.h} 0% ${hsl.l}%), hsl(${hsl.h} 100% ${hsl.l}%))`,
  } as CSSProperties;
  const lightnessTrack: CSSProperties = {
    "--range-track": `linear-gradient(90deg, #000, hsl(${hsl.h} ${hsl.s}% 50%), #fff)`,
  } as CSSProperties;

  return (
    <div
      className={styles.layout}
      data-picker-open={isOpen}
      style={{ backgroundColor: color }}
    >
      <aside
        className={styles.drawer}
        data-open={isOpen}
        aria-label="Color picker"
      >
        <div
          className={styles.panel}
          id="color-picker-panel"
          aria-hidden={!isOpen}
          inert={!isOpen}
        >
          <div className={styles.panelContent}>
            <header className={styles.header}>
              <div>
                <p className={styles.eyebrow}>COLOR STUDIO</p>
                <h2 className={styles.title}>Fine-tune your color</h2>
              </div>
              <span
                className={styles.preview}
                style={{ backgroundColor: color }}
                aria-label={`Current color ${color}`}
              />
            </header>

            <section className={styles.sliders} aria-label="HSL controls">
              <label className={styles.sliderLabel} htmlFor="picker-hue">
                <span>Hue</span>
                <output>{hsl.h}°</output>
              </label>
              <input
                id="picker-hue"
                className={styles.range}
                style={hueTrack}
                type="range"
                min="0"
                max="359"
                value={hsl.h}
                onChange={(event) =>
                  updateHsl({ ...hsl, h: Number(event.target.value) })
                }
              />

              <label className={styles.sliderLabel} htmlFor="picker-saturation">
                <span>Saturation</span>
                <output>{hsl.s}%</output>
              </label>
              <input
                id="picker-saturation"
                className={styles.range}
                style={saturationTrack}
                type="range"
                min="0"
                max="100"
                value={hsl.s}
                onChange={(event) =>
                  updateHsl({ ...hsl, s: Number(event.target.value) })
                }
              />

              <label className={styles.sliderLabel} htmlFor="picker-lightness">
                <span>Lightness</span>
                <output>{hsl.l}%</output>
              </label>
              <input
                id="picker-lightness"
                className={styles.range}
                style={lightnessTrack}
                type="range"
                min="0"
                max="100"
                value={hsl.l}
                onChange={(event) =>
                  updateHsl({ ...hsl, l: Number(event.target.value) })
                }
              />
            </section>

            <div className={styles.valueForm}>
              <label className={styles.sectionLabel} htmlFor="picker-hex">
                HEX
              </label>
              <div className={styles.valueRow}>
                <input
                  id="picker-hex"
                  className={styles.textInput}
                  value={hexDraft}
                  maxLength={7}
                  spellCheck={false}
                  autoComplete="off"
                  onBlur={finishHexInput}
                  onChange={(event) => {
                    handleHexChange(event.target.value);
                  }}
                />
              </div>
            </div>

            <div className={styles.valueForm}>
              <span className={styles.sectionLabel}>RGB</span>
              <div className={styles.rgbRow}>
                {rgbDraft.map((channel, index) => (
                  <input
                    key={index}
                    className={styles.textInput}
                    aria-label={`RGB ${["red", "green", "blue"][index]}`}
                    inputMode="numeric"
                    type="number"
                    min="0"
                    max="255"
                    value={channel}
                    onChange={(event) =>
                      handleRgbChange(index, event.target.value)
                    }
                    onBlur={finishRgbInput}
                  />
                ))}
              </div>
            </div>

            <p className={styles.error} role="status">
              {inputError}
            </p>
            <p className={styles.helper}>
              Adjust the sliders or enter a value.
            </p>
          </div>
        </div>
      </aside>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close color picker" : "Open color picker"}
        aria-expanded={isOpen}
        aria-controls="color-picker-panel"
      >
        <span aria-hidden="true">{isOpen ? "👈" : "👉"}</span>
      </button>
      <div className={styles.canvas}>{children}</div>
    </div>
  );
}
