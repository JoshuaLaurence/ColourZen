"use client";

import { useEffect, useState } from "react";
import {
  getClosestColorName,
  getRandomColor,
  getSavedColors,
  isValidHexColor,
  removeSavedColor,
  saveColor,
  SavedColor,
  shouldUseDarkText,
} from "../utils";
import ColorPickerLayout from "./ColorPickerLayout";

function SavedColours({
  savedColors,
  onClick,
  onRemove,
}: {
  savedColors: SavedColor[];
  onClick: (color: string) => void;
  onRemove: (savedColor: SavedColor) => void;
}) {
  if (savedColors.length === 0) return null;

  return (
    <div className="saved-colours-container">
      {savedColors.map((savedColor, index) => (
        <div className="saved-colour-item" key={`${savedColor.color}-${index}`}>
          <button
            type="button"
            className="saved-colour"
            style={{ backgroundColor: savedColor.color }}
            aria-label={`Saved ${savedColor.name}, ${savedColor.color}`}
            aria-describedby={`saved-colour-tooltip-${index}`}
            onClick={() => onClick(savedColor.color)}
          />
          <button
            type="button"
            className="saved-colour-remove"
            aria-label={`Remove ${savedColor.name} from saved colours`}
            onClick={() => onRemove(savedColor)}
          >
            ×
          </button>
          <span
            className="saved-colour-tooltip"
            id={`saved-colour-tooltip-${index}`}
            role="tooltip"
          >
            {savedColor.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function handlePaste(
  event: ClipboardEvent,
  onPaste: (color: string) => void,
): void {
  event.preventDefault();
  const clipboardData = event.clipboardData || (window as any).clipboardData;

  if (!clipboardData) {
    return;
  }
  const pastedText: string = clipboardData.getData("text");
  console.log("Pasted text:", pastedText);
  if (!isValidHexColor(pastedText)) {
    return;
  }
  onPaste(pastedText);
}

export default function ColourExperience({
  initialColour,
}: {
  initialColour: string;
}) {
  const [colour, setColour] = useState(initialColour);
  const [copyFeedback, setCopyFeedback] = useState("Copy");
  const shouldUseDark = shouldUseDarkText(colour);
  const [displayedColourName, setDisplayedColourName] = useState(
    () => getClosestColorName(initialColour) ?? initialColour,
  );
  const [savedColors, setSavedColors] = useState<SavedColor[]>([]);
  const textClass = shouldUseDark ? "text-dark" : "text-light";

  useEffect(() => {
    setSavedColors(getSavedColors());
    const listener = (event: ClipboardEvent) => handlePaste(event, setColour);
    window.addEventListener("paste", listener);
    return () => window.removeEventListener("paste", listener);
  }, []);

  useEffect(() => {
    setCopyFeedback("Copy");
  }, [colour]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDisplayedColourName(getClosestColorName(colour) ?? colour);
    }, 140);

    return () => window.clearTimeout(timeoutId);
  }, [colour]);

  async function copyHex() {
    try {
      await navigator.clipboard.writeText(colour.toUpperCase());
      setCopyFeedback("Copied!");
    } catch {
      setCopyFeedback("Couldn’t copy");
    }
  }

  return (
    <ColorPickerLayout color={colour} onColorChange={setColour}>
      <div className="main" style={{ backgroundColor: colour }}>
        <SavedColours
          savedColors={savedColors}
          onClick={setColour}
          onRemove={(savedColor) => {
            setSavedColors(removeSavedColor(savedColor.color));
          }}
        />
        <div className="color">
          <h1
            key={displayedColourName}
            className={`text-baseline text color-title-enter ${textClass}`}
          >
            {displayedColourName}
          </h1>
          <div className="hex-code-item">
            <button
              type="button"
              className={`hex-code text-baseline small-text ${textClass}`}
              onClick={copyHex}
              aria-label={`Copy ${colour.toUpperCase()} to clipboard`}
              aria-describedby="hex-copy-tooltip"
            >
              {colour.toUpperCase()}
            </button>
            <span
              className="saved-colour-tooltip"
              id="hex-copy-tooltip"
              role="tooltip"
              aria-live="polite"
            >
              {copyFeedback}
            </span>
          </div>
          <div className="refresh-button-container">
            <button
              className={`primary-button refresh-button ${textClass}`}
              onClick={() => setColour(getRandomColor())}
            >
              Refresh
            </button>
            <button
              className={`secondary-button refresh-button ${textClass}`}
              onClick={() => {
                const savedColor = {
                  color: colour,
                  name: getClosestColorName(colour) ?? colour,
                };
                setSavedColors(saveColor(savedColor));
              }}
            >
              Save
            </button>
          </div>
          <span className={`footer text-baseline tiny-text ${textClass}`}>
            Paste any hex code to see how it looks
          </span>
        </div>
      </div>
    </ColorPickerLayout>
  );
}
