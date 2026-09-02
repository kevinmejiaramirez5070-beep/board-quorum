# BOARD QUORUM – ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI

## PRECISIÓN FUNCIONAL
### Diferencia entre quórum vigente, votantes habilitados y mayoría requerida en una votación ordinaria

**Destino:** Andrés – Implementación Board Quorum  
**Fecha:** 26 de agosto de 2026

---

## 1. OBJETIVO

Evitar que Board Quorum confunda tres cifras diferentes:

1. **Quórum mínimo vigente**
2. **Votantes habilitados presentes**
3. **Mayoría requerida para aprobar una decisión ordinaria**

Estas cifras pueden ser distintas y deben mostrarse separadamente.

---

## 2. REGLA DE QUÓRUM EN MOMENTO SIGUIENTE

Para la Asamblea actual:

```text
U = 85 Delegados habilitados
```

Momento Siguiente exige el 20 % del universo:

```text
Q_MS = CEIL(U × 20 %)
Q_MS = CEIL(85 × 0,20)
Q_MS = 17
```

Por tanto:

```text
17 = mínimo de representaciones computables que deben estar presentes
     para que exista quórum en Momento Siguiente.
```

Este valor **NO es automáticamente el número de votos favorables necesarios para aprobar una proposición**.

---

## 3. VOTANTES HABILITADOS PRESENTES

En la prueba realizada:

```text
Asistentes registrados = 24
Representaciones computables = 18
```

Por tanto:

```text
V = 18 votantes habilitados
```

Board Quorum debe usar como base de la votación a quienes realmente ejercen una representación válida en ese momento.

---

## 4. MAYORÍA SIMPLE PARA UNA VOTACIÓN ORDINARIA

El Estatuto dispone que las decisiones se toman por mayoría simple del número de asistentes habilitados que integran el quórum, salvo que exista una mayoría calificada.

Para una mayoría simple:

```text
M = FLOOR(V / 2) + 1
```

Con 18 votantes habilitados:

```text
M = FLOOR(18 / 2) + 1
M = 9 + 1
M = 10
```

Por tanto:

```text
Quórum mínimo vigente = 17
Votantes habilitados presentes = 18
Mayoría requerida para aprobar = 10
```

---

## 5. EJEMPLO SI HUBIERA EXACTAMENTE 17 VOTANTES HABILITADOS

Si la Asamblea tuviera exactamente 17 representaciones computables:

```text
V = 17
M = FLOOR(17 / 2) + 1
M = 8 + 1
M = 9
```

Resultado:

```text
Quórum mínimo vigente = 17
Votantes habilitados presentes = 17
Mayoría requerida para aprobar = 9
```

---

## 6. COMPORTAMIENTO ESPERADO EN BOARD QUORUM

La pantalla y el PDF deben distinguir claramente:

```text
MOMENTO SIGUIENTE ACTIVO

Universo de Delegados habilitados: 85
Quórum mínimo vigente: 17
Representaciones computables presentes: 18

VOTACIÓN ORDINARIA

Votantes habilitados: 18
Mayoría simple requerida: 10 votos a favor
```

No debe presentarse el número **17** como si fuera la mayoría necesaria para aprobar una decisión.

---

## 7. REGLAS DE CÁLCULO

```text
U = universo de Delegados habilitados

Quórum Momento Siguiente:
Q_MS = CEIL(U × 0,20)

V = representaciones computables presentes y habilitadas para votar

Mayoría simple:
M = FLOOR(V / 2) + 1
```

Para la prueba actual:

```text
U = 85
Q_MS = 17
V = 18
M = 10
```

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] Board Quorum muestra separadamente quórum, votantes habilitados y mayoría requerida.
- [ ] El mínimo de Momento Siguiente se calcula sobre el universo de 85.
- [ ] La mayoría simple se calcula sobre los votantes habilitados presentes.
- [ ] Si hay 18 habilitados, la mayoría requerida es 10.
- [ ] Si hay 17 habilitados, la mayoría requerida es 9.
- [ ] El reporte no presenta 17 como número de votos favorables requerido solo por estar activo Momento Siguiente.
- [ ] La cifra que determina la aprobación cambia dinámicamente con el número de representaciones habilitadas presentes.

---

## CONCLUSIÓN

> **17 determina si existe quórum en Momento Siguiente.  
> 18 es el número de representaciones habilitadas presentes en la prueba.  
> 10 es la mayoría simple requerida para aprobar una decisión ordinaria con esos 18 habilitados.**

Estas tres cifras deben permanecer funcionalmente separadas en Board Quorum.
