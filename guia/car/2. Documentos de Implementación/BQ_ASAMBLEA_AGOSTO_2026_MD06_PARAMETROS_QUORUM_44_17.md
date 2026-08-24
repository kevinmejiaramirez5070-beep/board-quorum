# BOARD QUORUM – ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI

## SOLICITUD QUIRÚRGICA / PRECISIÓN DE QUÓRUM N.º 06
### Parámetros de control para la Asamblea del 26 de agosto de 2026

**Destino:** Andrés – Implementación Board Quorum  
**Tipo:** Precisión funcional / parámetros de prueba  
**Base validada:** 22 de agosto de 2026  
**Hora convocada de inicio:** 6:00 p. m.

---

## 1. OBJETIVO

Andrés:

Para continuar las pruebas de Asamblea necesitamos dejar fijados los valores de control que Board Quorum debe mostrar y utilizar con la base validada actualmente.

La base contiene:

```text
85 Delegados PRINCIPALES
55 Delegados SUPLENTES
140 registros totales
```

Para efectos de quórum, el universo aplicable es:

```text
N = 85 Delegados Principales habilitados
```

Los 55 Suplentes no aumentan el universo. Su función es sustituir la representación del Principal cuando corresponda.

---

## 2. QUÓRUM INICIAL – HORA CONVOCADA 6:00 P. M.

A la hora fijada para iniciar la Asamblea:

```text
6:00 p. m.
```

Board Quorum debe evaluar el quórum inicial sobre los 85 Delegados Principales habilitados.

La regla estatutaria es:

```text
50 % + 1
```

Cálculo para esta Asamblea:

```text
85 × 50 % = 42,5

42,5 + 1 = 43,5
```

Como el quórum solo puede expresarse en personas enteras y debe alcanzarse como mínimo el valor exigido:

```text
QUÓRUM INICIAL = 44
```

### Valor de control esperado

```text
ELEGIBLES:         85
MÍNIMO REQUERIDO:  44
```

---

## 3. MOMENTO SIGUIENTE

Si llegada la hora convocada de las 6:00 p. m. no se alcanza el quórum inicial, debe poder aplicarse el estado:

```text
MOMENTO SIGUIENTE
```

Una vez se ejecute la acción visible correspondiente en Board Quorum, el universo permanece igual:

```text
ELEGIBLES = 85
```

Lo que cambia es el mínimo requerido.

La regla aplicable pasa a:

```text
20 %
```

Cálculo:

```text
85 × 20 % = 17
```

Por tanto:

```text
QUÓRUM MOMENTO SIGUIENTE = 17
```

### Valor de control esperado después de aplicar Momento Siguiente

```text
ELEGIBLES:         85
MÍNIMO REQUERIDO:  17
ESTADO:            MOMENTO SIGUIENTE
```

---

## 4. CAMBIO ESPERADO EN BOARD QUORUM

Con esta base, la transición funcional debe verse así:

```text
ANTES DE MOMENTO SIGUIENTE
---------------------------
Elegibles: 85
Mínimo requerido: 44
Regla: 50 % + 1


DESPUÉS DE APLICAR MOMENTO SIGUIENTE
------------------------------------
Elegibles: 85
Mínimo requerido: 17
Regla: 20 %
Estado: MOMENTO SIGUIENTE
```

### Regla crítica

> **El universo de elegibles no cambia.**

La transición es:

```text
85 / 44
   ↓
85 / 17
```

No:

```text
85 → otro universo
```

---

## 5. VENTANA TEMPORAL

La Asamblea está convocada para iniciar a las:

```text
6:00 p. m.
```

Por tanto, la ventana del Momento Siguiente corresponde a la hora siguiente:

```text
6:00 p. m. – 7:00 p. m.
```

Si el botón se ejecuta posteriormente, por ejemplo a las 6:05 p. m., la hora límite continúa siendo:

```text
7:00 p. m.
```

El clic no inicia una nueva hora.

---

## 6. LOS VALORES 44 Y 17 NO SON CONSTANTES DEL SISTEMA

Estos valores son los resultados correspondientes a la base validada actual:

```text
N = 85
```

No deben quedar hardcodeados.

Board Quorum debe calcularlos dinámicamente a partir del universo vigente de Delegados Principales habilitados.

Para esta Asamblea, los valores de prueba son:

```text
N = 85
Quórum inicial = 44
Momento Siguiente = 17
```

Si cambia la base vigente, Board Quorum debe recalcular automáticamente ambos valores.

---

## 7. CRITERIOS DE ACEPTACIÓN

Esta precisión se considera correctamente implementada cuando:

- [ ] Board Quorum tome **85** como universo de elegibles para la base validada actual.
- [ ] A las 6:00 p. m., bajo quórum inicial, muestre **44** como mínimo requerido.
- [ ] Al aplicar Momento Siguiente, mantenga **85** elegibles.
- [ ] Al aplicar Momento Siguiente, cambie el mínimo requerido a **17**.
- [ ] El estado visible cambie a **MOMENTO SIGUIENTE**.
- [ ] La ventana temporal permanezca anclada a las 6:00 p. m. y termine a las 7:00 p. m.
- [ ] Los valores se calculen dinámicamente y no queden fijos en código.
- [ ] La transición y sus valores queden trazados en Board Quorum y en el PDF final de la Asamblea.

---

## 8. REFERENCIAS FUNCIONALES

- Estatuto ASOCOLCI 2025 – Artículo 11: quórum inicial de al menos la mitad más uno (50 % + 1).
- Estatuto ASOCOLCI 2025 – Momento Siguiente: mínimo del 20 %.
- Convocatoria 2.ª Asamblea General Ordinaria de Delegados – 26 de agosto de 2026: hora de inicio 6:00 p. m.
- Base validada al 22 de agosto de 2026: 85 Principales + 55 Suplentes = 140 registros.

---

## CONCLUSIÓN FUNCIONAL

> **Con la base validada actual de 85 Delegados Principales habilitados, Board Quorum debe iniciar la evaluación de quórum a las 6:00 p. m. con un mínimo requerido de 44. Si no se alcanza y se aplica Momento Siguiente, el universo continúa siendo 85 y el mínimo requerido cambia a 17. La ventana del Momento Siguiente permanece comprendida entre las 6:00 p. m. y las 7:00 p. m.**

---

**Fin – Solicitud Quirúrgica / Precisión de Quórum N.º 06**
