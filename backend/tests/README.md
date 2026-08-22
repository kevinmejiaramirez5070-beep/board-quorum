# Pruebas de Asamblea — criterios de aceptación MD-01 a MD-05

Verifican las reglas de fondo de `TEST ASAMBLEA NRO. 1` sobre una base de datos
simulada en memoria. **No tocan Supabase ni ninguna base real**, así que se pueden
correr en cualquier momento, incluso sin conexión.

```bash
node backend/tests/asamblea-md01-quorum.test.js
node backend/tests/asamblea-md02-momento.test.js
```

Cada archivo imprime una línea por comprobación y termina con código de salida 0
si todo pasó.

## Qué cubre cada uno

**`asamblea-md01-quorum.test.js`** — universo de elegibles y representación por curso.

- Con 20 Principales + 20 Suplentes + 3 no computables, los elegibles son **20**, no 42.
- Mínimo requerido `FLOOR(20/2)+1 = 11`.
- Principal + Suplente del mismo curso = **una sola** representación; vota el Principal.
- Suplente solo, con el Principal ausente, representa al curso (`acting_as_principal`).
- Si después entra el Principal, la representación **sigue siendo una**.
- Administración, Contabilidad y Revisoría Fiscal no aumentan el universo,
  no cuentan para quórum y quedan fuera del padrón de votantes.
- Los umbrales salen del maestro: N=83 → 42, N=81 → 41, N=84 → 43.

**`asamblea-md02-momento.test.js`** — Momento Siguiente.

- Sin confirmación explícita la acción se rechaza.
- Al aplicar, el universo no cambia; solo el mínimo pasa a `CEIL(N × 20 %)`.
- La hora límite se calcula desde la **hora convocada**, no desde el clic.
- Al alcanzar el 20 % queda registrada la hora exacta.
- Si vence la ventana sin el mínimo, queda cerrado sin quórum.
- No se puede aplicar antes de la hora oficial, ni con la ventana ya vencida,
  ni dos veces.
- Los eventos quedan en `quorum_log`.
