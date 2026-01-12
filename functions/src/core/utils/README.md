# Core Utilities

This directory contains shared utility functions used across the Cloud Functions.

## Modules

### `ipUtils.ts`
**Purpose**: Standardizes the extraction of the client's IP address from a Firebase Callable Request.

**Key Features**:
- **Proxy Aware**: Prioritizes `CF-Connecting-IP` (Cloudflare) and `X-Forwarded-For` (Load Balancers).
- **Privacy Compliance**: Does NOT hash the IP address, as required by Meta CAPI for geolocation.
- **Fallback**: Supports fallback to `request.ip` or explicit `leadData.clientIp`.

**Usage**:
```typescript
import { extractClientIp } from "../../core/utils/ipUtils";

const clientIp = extractClientIp(request, data);
```
