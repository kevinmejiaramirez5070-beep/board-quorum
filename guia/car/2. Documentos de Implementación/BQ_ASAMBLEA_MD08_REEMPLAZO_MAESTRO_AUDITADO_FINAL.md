# BOARD QUORUM – ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI

## SOLICITUD QUIRÚRGICA / CAMBIO DE FONDO N.º 08
### Reemplazo íntegro del Maestro vigente de Delegados y segregación de históricos

**Destino:** Andrés – Implementación Board Quorum  
**Prueba:** 25 de agosto de 2026  
**Tipo:** Ajuste funcional de fondo  
**Base de control:** `BOARD_QUORUM_ASAMBLEA_AGOSTO_2026_CARGA_FINAL.xlsx`

---

## 1. OBJETIVO

Definir con precisión cómo debe comportarse Board Quorum cuando se carga una nueva base de Delegados para Asamblea.

La regla funcional esperada es simple:

> **La nueva base cargada debe sustituir íntegramente el Maestro vigente anterior.**

La carga del Maestro debe operar como **REEMPLAZO del universo vigente**, no como acumulación de registros activos de distintas cargas.

---

## 2. EVIDENCIA CONFIRMADA EN LA PRUEBA DEL 25.08.2026

La base validada cargada contiene exactamente:

```text
85 PRINCIPALES
55 SUPLENTES
140 REGISTROS
```

La carga fue aceptada por Board Quorum.

Posteriormente, el resumen del Maestro mostró:

```text
90 PRINCIPALES
55 SUPLENTES
85 CURSOS CON PRINCIPAL
5 VÍNCULOS ROTOS
30 SIN SUPLENTE
```

Además, la lista completa llegó a mostrar:

```text
147 DELEGADOS
```

Por tanto, el Maestro visible/operativo no quedó reproduciendo exactamente la estructura del archivo cargado.

---

## 3. HALLAZGO FUNCIONAL

El punto que requiere revisión no es la composición del Excel.

La diferencia confirmada es:

```text
ARCHIVO VALIDADO
85 PRINCIPALES
55 SUPLENTES
140 REGISTROS

BOARD QUORUM
90 PRINCIPALES
55 SUPLENTES
147 REGISTROS LISTADOS
```

También se observaron casos en los que permanecen registros de cargas anteriores, algunos inactivos y otros aparentemente activos.

Ejemplos observados en la lista:

```text
PREJARDÍN A → más de un Principal activo
OCTAVO E    → más de un Principal activo
```

Esto puede alterar el Maestro vigente aunque la nueva carga haya sido aceptada correctamente.

---

## 4. HIPÓTESIS TÉCNICA – NO CERRADA

Como hipótesis de trabajo, los Principales adicionales podrían corresponder a registros de cargas anteriores que permanecen activos después de cargar la nueva base.

Esta hipótesis explica parte de lo observado, pero:

> **No se considera causa técnica confirmada.**

La validación de la causa corresponde a la revisión de implementación.

---

## 5. REGLA FUNCIONAL DE REEMPLAZO

Cuando un usuario autorizado cargue una nueva base como Maestro de Delegados de Asamblea:

```text
NUEVA BASE
      ↓
SUSTITUYE
      ↓
MAESTRO VIGENTE ANTERIOR
```

Después de la carga:

> **Solo los registros contenidos en la nueva base pueden quedar vigentes/activos para efectos funcionales de Asamblea.**

Los registros provenientes de cargas anteriores no pueden continuar afectando:

```text
Conteo de Principales
Conteo de Suplentes
Relación Principal / Suplente
Universo de elegibles
Quórum
Votaciones
Representación por curso
```

---

## 6. HISTÓRICOS

Si Board Quorum requiere conservar las cargas anteriores por trazabilidad, pueden mantenerse como histórico.

Pero deben quedar claramente separados del Maestro vigente.

Regla:

> **Histórico no equivale a vigente.**

Un registro histórico:

```text
NO debe contar como Principal vigente
NO debe contar como Suplente vigente
NO debe afectar quórum
NO debe afectar votaciones
NO debe afectar representación por curso
```

---

## 7. LOS 5 VÍNCULOS ROTOS NO DEBEN CONFUNDIRSE CON LOS PRINCIPALES ADICIONALES

En la base actual existen 5 Suplentes cuyo curso no tiene Principal asociado.

Board Quorum los identifica como:

```text
SUPLENTE – SIN VÍNCULO
```

Los cinco casos observados corresponden a:

```text
SEGUNDO D
SEGUNDO E
TERCERO A
CUARTO F
SEXTO G
```

Estos registros forman parte de la base cargada y deben conservar su rol:

```text
SUPLENTE
```

No deben:

```text
convertirse en Principal
crear un Principal adicional
alterar el total de 85 Principales del archivo
```

Este MD no define aquí el efecto posterior de un Suplente sin vínculo sobre asistencia/quórum; ese comportamiento debe validarse por separado.

---

## 8. RESULTADO ESPERADO DESPUÉS DEL REEMPLAZO

Al cargar:

```text
BOARD_QUORUM_ASAMBLEA_AGOSTO_2026_CARGA_FINAL.xlsx
```

el Maestro vigente debe reflejar exactamente:

```text
PRINCIPALES: 85
SUPLENTES:   55
TOTAL:      140
```

Si existen registros históricos adicionales, estos pueden permanecer almacenados, pero deben quedar fuera del Maestro vigente y fuera de los cálculos funcionales de Asamblea.

---

## 9. IMPACTO DIRECTO SOBRE EL QUÓRUM

Este ajuste es crítico porque el Maestro alimenta el universo utilizado por el motor de quórum.

Con la base validada:

```text
85 PRINCIPALES HABILITADOS
```

el universo funcional para quórum debe partir de esos 85 Principales, sin incorporar Principales residuales de cargas anteriores.

Por tanto:

> **Mientras Board Quorum muestre 90 Principales frente a una base vigente de 85, no debe considerarse cerrado el Maestro para las pruebas definitivas de quórum.**

Los parámetros concretos de quórum inicial y Momento Siguiente se encuentran desarrollados en el MD específico de quórum.

---

## 10. CRITERIOS DE ACEPTACIÓN

La solicitud se considera resuelta cuando:

- [ ] Una nueva carga sustituye completamente el Maestro vigente anterior.
- [ ] Con el archivo validado, Board Quorum muestra **85 Principales**.
- [ ] Con el archivo validado, Board Quorum muestra **55 Suplentes**.
- [ ] El Maestro vigente contiene **140 registros funcionales**.
- [ ] No permanecen activos registros de cargas anteriores que alteren la base vigente.
- [ ] Los históricos, si se conservan, quedan claramente segregados.
- [ ] Los históricos no afectan quórum, votación ni representación.
- [ ] Los 5 Suplentes sin Principal permanecen clasificados como **SUPLENTE**.
- [ ] Ningún vínculo roto genera un Principal adicional.
- [ ] La lista, los contadores y el universo funcional del Maestro son coherentes entre sí.
- [ ] El Maestro vigente queda listo para continuar las pruebas de quórum sobre una base limpia.

---

## 11. VALIDACIÓN FINAL ESPERADA

Después del ajuste, una recarga del mismo archivo debe permitir comprobar:

```text
Archivo cargado:
85 P + 55 S = 140

Board Quorum:
85 P + 55 S = 140

Diferencia:
0
```

---

## CONCLUSIÓN FUNCIONAL

> **La carga del Maestro de Delegados de Asamblea debe ser de reemplazo y no acumulativa. Cada nueva base validada sustituye íntegramente la base vigente anterior. Board Quorum puede conservar históricos para trazabilidad, pero estos deben quedar segregados y sin efecto funcional sobre roles, vínculos, quórum, votaciones o representación de la Asamblea vigente.**

---

**Fin – Solicitud Quirúrgica / Cambio de Fondo N.º 08**
