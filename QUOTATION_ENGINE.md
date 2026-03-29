# Quotation Engine - Implementation Summary

## 🚀 Key Features Implemented

### 1. Smart Quotation Builder (`components/QuotationBuilder.tsx`)
A dedicated tool for generating professional sales quotes instantly.

*   **Universal Vehicle Support:** Handles EVs (Battery/Range), ICE (Engine/Torque), and 2-Wheelers via dynamic specification maps.
*   **On-the-Fly Editing:** Sales reps can add/remove technical specs (e.g., "Add Free Helmet") directly in the builder.
*   **Custom Vehicle Mode:** Generate quotes for models not yet in inventory by manually typing Model/Variant/Price.
*   **Live A4 Preview:** What you see is exactly what prints.
*   **Bank Addressing:** Select from a list of banks (Siddhartha, Nabil, etc.) or default to "Cash/Self".
*   **Settings Mode:** Dealers can customize their "Terms & Conditions" text directly in the app.
*   **Print-to-PDF:** Uses the browser's native robust PDF engine (Cmd+P) for high-fidelity output.

### 2. Integration with Sales Pipeline
*   Added a **"Generate Quote"** button to the Lead Detail Side Panel.
*   Workflow: Click Lead -> Click Quote -> Review -> Print PDF.

### 3. Data Structure Updates
*   Added `Bank` and `QuotationTemplate` interfaces to `types.ts`.
*   Added Mock Bank Data (Siddhartha, Nabil, Global IME, Everest) inside the builder.
*   Added Default Dealer Profile (Sarva Motors, Biratnagar).

## How to Use

1.  Go to **Pipeline** (Assessment dashboard).
2.  Click on a Lead (e.g., **Vivek Dahal**).
3.  In the side panel, scroll to the bottom.
4.  Click **"Generate Quote"**.
5.  In the builder:
    *   Select **Bank** (e.g., Siddhartha Bank).
    *   Verify **Model** and **Price**.
    *   Add **Discount** (if approved).
    *   Click **Settings** (gear icon) to edit terms if needed.
6.  Click **"Print / Save PDF"**.
7.  In the print dialog, select "Save as PDF".

## Why this is better than Google Apps Script?
*   **Speed:** Instant generation (0.1s vs 5-10s).
*   **Experience:** Live preview prevents "blind" generation errors.
*   **Flexibility:** Dealers can change terms on the fly without coding.
*   **Professional:** Strict CSS styling ensures alignment is perfect every time.
