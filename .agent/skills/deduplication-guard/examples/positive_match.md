# Example: Positive Match (Duplicate Found)

## Scenario
The user asks to "Add a service to handle Telegram notifications".

## Execution
1. Agent runs `audit_existence.py --search "Telegram" --type "function"`.
2. Output:
```json
{
  "exists": true,
  "matches": [
    {
      "type": "function_definition_match",
      "path": "functions/src/infrastructure/telegram/TelegramService.js",
      "match": "sendTelegramMessage",
      "similarity": "0.95"
    }
  ]
}
```

## Agent Response
> "He detectado que ya existe un servicio de notificaciones en `functions/src/infrastructure/telegram/TelegramService.js`. De acuerdo con el principio **DRY** del Manual de Arquitectura, no crearé un nuevo servicio. ¿Prefieres que extienda la funcionalidad existente o que te muestre cómo utilizar el servicio actual?"
