# Product Catalog Manager
**Module:** `/catalog`

## Purpose
The **Catalog Manager** acts as the central "Master Data" repository for all vehicles sold by the dealership. Unlike the *Inventory* (which tracks physical cars with VINs), the *Catalog* tracks **Models & Specifications**.

## Key Features

### 1. Unified Product Database
*   Manage a list of all vehicle models (cars, bikes, EVs, trucks).
*   Store "Brochure-level" data: Images, Standard Prices, Variants.

### 2. Dynamic Specifications Engine
*   **Flexible Specs:** Define unlimited technical details for each model.
    *   *EVs:* Battery, Range, Charging Time.
    *   *ICE:* Engine CC, Horsepower, Torque.
    *   *Commercial:* Payload, Towing Capacity.
*   **Quotation Integration:** These specs are designed to feed directly into the **Quotation Engine**, ensuring that sales quotes automatically include the correct technical details without manual typing.

### 3. Visual Management
*   Card-based layout for easy visual identification of models.
*   Quick "Edit" drawer to update prices or specs on the fly.

## Workflow
1.  **Admin/Manager** goes to `Product Catalog`.
2.  Adds a new model (e.g., "Deepal S07 2025").
3.  Defines the standard specs (Battery, Range, etc.).
4.  **Sales Reps** use these models in the *Quotation Engine* (coming integration) to generate perfect quotes instantly.
