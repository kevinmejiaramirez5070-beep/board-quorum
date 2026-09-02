# BOARD QUORUM – ASOCOLCI
## SOLICITUD QUIRÚRGICA – INDICADORES DEL MAESTRO DE DELEGADOS
### Asamblea General de Delegados

**Destino:** Andrés – Implementación Board Quorum  
**Fecha:** 31 de agosto de 2026  
**Tipo:** Ajuste funcional puntual sobre cálculo y rotulación del Maestro  
**Evidencia:** captura de pantalla del Maestro de Delegados – Asamblea General

---

# 1. OBJETIVO

Corregir y precisar los indicadores superiores del **Maestro de Delegados de Asamblea General**, sin modificar la lógica de quórum que ya viene operando correctamente sobre el universo de Delegados Principales habilitados.

La regla funcional vigente para ASOCOLCI es:

```text
UNIVERSO DE QUÓRUM = DELEGADOS PRINCIPALES HABILITADOS
U = 85
```

De este universo salen los valores de control:

```text
Quórum inicial = 44
Momento Siguiente = 17
```

Los Suplentes **no amplían el universo**.  
Cuando corresponde, actúan en reemplazo del Principal y ocupan una de las representaciones computables.

---

# 2. DATOS DE LA BASE ACTUAL

La base maestra vigente contiene:

```text
85 Principales
55 Suplentes
140 registros activos
```

Estructura por curso:

```text
50 cursos con Principal + Suplente
35 cursos con Principal y sin Suplente
5 cursos con Suplente y sin Principal
```

Por tanto:

```text
Cursos con Principal = 85
Suplentes vinculados a un Principal = 50
Cursos con Principal sin Suplente = 35
```

---

# 3. HALLAZGO 01 – “SIN SUPLENTE” MUESTRA 30

Actualmente Board Quorum muestra:

```text
85 Principales
55 Suplentes
85 Cursos c/ principal
5 Vínculos rotos
30 Sin suplente
```

El valor **30** no concilia con la estructura real del Maestro.

La fórmula correcta es:

```text
Cursos con Principal = 85
Cursos con Principal + Suplente = 50

Sin Suplente = 85 - 50
Sin Suplente = 35
```

## Resultado esperado

Cambiar:

```text
Sin suplente: 30
```

por:

```text
Sin suplente: 35
```

si este indicador pretende mostrar:

> **Cursos con Principal que no tienen Suplente asociado.**

---

# 4. HALLAZGO 02 – “VÍNCULOS ROTOS” PUEDE GENERAR UNA INTERPRETACIÓN INCORRECTA

El valor **5** sí corresponde a los cinco cursos que tienen Suplente pero no Principal asociado.

Sin embargo, la expresión:

```text
Vínculos rotos
```

puede sugerir que existe un error de integridad de datos.

En la operación de ASOCOLCI esos registros pueden ser válidos y Board Quorum ya ha probado que un Suplente de un curso sin Principal puede ejercer la representación cuando corresponde.

## Texto sugerido

Cambiar:

```text
Vínculos rotos: 5
```

por:

```text
Suplentes sin Principal asociado: 5
```

o, si se desea conservar una alerta visual:

```text
⚠ Suplentes sin Principal asociado: 5
```

La plataforma no debe inventar un Principal para estos casos.

---

# 5. HALLAZGO 03 – “DELEGADOS (147)” MEZCLA ACTIVOS E INACTIVOS

La carga vigente contiene:

```text
140 registros activos
```

Board Quorum conserva adicionalmente registros históricos/inactivos, por lo cual en pantalla aparece:

```text
Delegados (147)
```

La conservación de históricos es correcta.

El problema es únicamente de claridad: el usuario puede interpretar que existen 147 Delegados vigentes.

## Texto sugerido

En lugar de:

```text
Delegados (147)
```

mostrar:

```text
Registros: 147
Activos: 140
Inactivos: 7
```

o una variante equivalente.

---

# 6. REGLA OBLIGATORIA – EL UNIVERSO DE QUÓRUM SIGUE SIENDO 85

La existencia de cursos con Suplente sin Principal **no modifica el universo de quórum**.

Para ASOCOLCI:

```text
U = 85 Delegados Principales habilitados
```

Por tanto:

```text
Quórum inicial = 44
Momento Siguiente = 17
```

En Momento Siguiente las 17 representaciones pueden estar ejercidas por:

```text
Principales presentes
+
Suplentes que actúan válidamente en reemplazo del Principal
```

Ejemplo:

```text
14 Principales presentes
+ 3 Suplentes actuando
= 17 representaciones computables
→ QUÓRUM ALCANZADO
```

Pero el denominador continúa siendo:

```text
85
```

Nunca debe mostrarse:

```text
Q / 90
```

como universo de quórum de la Asamblea.

---

# 7. CRITERIOS DE ACEPTACIÓN

- [ ] `Principales = 85`.
- [ ] `Suplentes = 55`.
- [ ] `Cursos con Principal = 85`.
- [ ] `Cursos con Principal sin Suplente = 35`.
- [ ] Los 5 casos sin Principal se muestran como `Suplentes sin Principal asociado`.
- [ ] No se inventan Principales para esos cinco casos.
- [ ] El total activo continúa siendo 140.
- [ ] Los registros históricos pueden conservarse como inactivos.
- [ ] La pantalla diferencia registros activos de inactivos.
- [ ] El universo de quórum continúa siendo 85.
- [ ] Quórum inicial continúa siendo 44.
- [ ] Momento Siguiente continúa siendo 17.
- [ ] Los Suplentes actuando sustituyen representación, pero no amplían el universo.

---

# 8. RESULTADO ESPERADO EN LA CABECERA DEL MAESTRO

Una presentación funcionalmente clara sería:

```text
85  Principales
55  Suplentes
85  Cursos con Principal
5   Suplentes sin Principal asociado
35  Cursos con Principal sin Suplente
```

Y para el listado:

```text
Registros totales: 147
Activos: 140
Inactivos: 7
```

---

# CONCLUSIÓN

> **La lógica principal del Maestro debe mantenerse sobre un universo de 85 Delegados Principales habilitados. El ajuste solicitado se concentra en corregir el indicador “Sin suplente” de 30 a 35, mejorar la denominación de los 5 Suplentes sin Principal asociado y diferenciar claramente registros activos e inactivos. Ninguno de estos ajustes debe modificar los valores de quórum 85 / 44 / 17.**

---

**Fin de la solicitud**
