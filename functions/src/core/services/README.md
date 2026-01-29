# Core Services

This directory contains pure business logic services used to orchestrate complex operations or format output for external delivery.

## 🏗 Message Builders (Telegram Notification System)

To ensure consistency and robustness across notification flows (Leads, Users, etc.), we implement a **Builder Pattern** with a shared base.

### 1. `BaseMessageBuilder`
**Purpose**: Centralizes formatting utilities and provides "immunity" against Telegram API failures related to formatting.

- **Shared Utilities**:
  - `escapeMarkdown()`: Escapes reserved characters (`_`, `*`, `` ` ``, etc.) for Telegram Markdown V1.
  - `fmtMoney()`: Standardizes MXN currency formatting.
  - `fmtDate()`: Handles Firestore Timestamps and Javascript Dates for locale-aware display.
  - `getFooter()`: Standard branding footer for all admin alerts.

### 2. `LeadMessageBuilder`
**Specialization**: Formats complex messages for new leads.

- **Features**:
  - Extracts customer data (PII) safely.
  - Integrates financial profiles (Affordability) if the user is authenticated.
  - Includes historical interest context.
  - **Robustness**: Automatically escapes lead input to prevent malformed Markdown.

### 3. `UserMessageBuilder`
**Specialization**: Formats alerts for new platform registrations.

- **Features**:
  - Lightweight and focused on Security (UID) and Identity (DisplayName, Email).

## 🚀 Usage Pattern

```typescript
import { UserMessageBuilder } from "./UserMessageBuilder";
const message = UserMessageBuilder.formatMessage(userData);
// send message via NotificationPort...
```

---
> [!TIP]
> **DRY Compliance**: Always add new formatting helpers to `BaseMessageBuilder` instead of duplicating them in specific builders.
