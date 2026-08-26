# Board Quorum — Asamblea General de Delegados ASOCOLCI

## Pruebas de votación — 26 de agosto de 2026

> **Documento funcional y técnico**
>
> Propósito: documentar las reglas de representación, los resultados de las pruebas de votación, los errores detectados y el flujo esperado para la implementación de Board Quorum.

---

## 1. Resumen ejecutivo

Las pruebas realizadas el **26 de agosto de 2026** tuvieron como objetivo validar tres aspectos principales:

1. Quién tiene derecho a votar según la representación efectiva del curso.
2. Cómo se determina si el **Principal** o el **Suplente** debe ejercer la representación.
3. Si la identidad mostrada por Board Quorum corresponde exactamente a la cédula ingresada.

### Resultado general

| Área evaluada | Resultado | Observación |
|---|---|---|
| Voto del Principal | ✅ Pasa | El Principal fue reconocido y pudo votar correctamente. |
| Bloqueo del Suplente con Principal presente | ⚠️ Funciona parcialmente | El bloqueo evita un segundo voto, pero la causa mostrada es incorrecta y debe validarse que la regla sea dinámica. |
| Suplente sin Principal asociado | ❌ No pasa | Un Suplente válido fue bloqueado aunque debía ejercer la representación. |
| Identidad de segunda cédula | ❌ No pasa | Se mostró la identidad de la primera persona del registro en lugar de la persona cuya cédula fue ingresada. |

### Conclusión ejecutiva

El flujo del **Principal** funciona correctamente. El bloqueo del **Suplente** cuando el Principal está presente genera el efecto esperado —evitar un segundo voto—, pero la mensajería es incorrecta y todavía debe comprobarse que el criterio utilizado sea realmente dinámico.

El caso **CUARTO F** evidencia una falla crítica: un Suplente válido, sin Principal asociado, fue bloqueado cuando debía poder votar como representante efectivo.

También se detectó una falla de identidad: una segunda cédula perteneciente al mismo núcleo puede localizar el registro, pero Board Quorum termina mostrando la identidad de la primera persona de esa fila. fileciteturn0file0L8-L13

---

# 2. Regla funcional de votación

El derecho a voto debe derivarse de la **representación efectiva del curso**.

```text
DERECHO_A_VOTO = REPRESENTACIÓN_EFECTIVA
```

La lógica esperada es:

| Estado del curso | Quién vota |
|---|---|
| Principal presente | Principal |
| Principal ausente + Suplente presente | Suplente actuando como Principal |
| No existe Principal + Suplente presente | Suplente actuando como Principal |
| Principal + Suplente presentes | Principal |
| Máximo de votos | Un voto efectivo por curso |

La regla fundamental es que el sistema no debe determinar el derecho a voto únicamente por el rol estático registrado como `PRINCIPAL` o `SUPLENTE`, sino por quién está ejerciendo **efectivamente la representación en ese momento**. fileciteturn0file0L14-L21

---

# 3. Caso positivo — Principal de CUARTO C

## Datos de la prueba

- **Cédula:** `1072647375`
- **Nombre:** CAMILO ANDRES PANCHE
- **Rol:** PRINCIPAL
- **Curso:** CUARTO C

## Resultado

El Principal fue reconocido correctamente por Board Quorum y se habilitaron las opciones de votación.

**Resultado: PASA.**

El voto del Principal fue registrado exitosamente. fileciteturn0file0L24-L28

### Criterio de aceptación

```text
Cédula válida
    ↓
Identidad reconocida
    ↓
Principal presente
    ↓
Representación efectiva = Principal
    ↓
Votación habilitada
    ↓
Voto registrado
```

---

# 4. Suplente de CUARTO C con Principal presente

## Datos de la prueba

- **Cédula:** `83235747`
- **Nombre:** CORDOBA ROA ESNEIDER
- **Rol:** SUPLENTE
- **Curso:** CUARTO C

El Suplente fue bloqueado después de que el Principal estuviera presente.

## Resultado

El resultado funcional de bloqueo es correcto porque el curso no puede registrar un segundo voto. Sin embargo, la causa mostrada al usuario es incorrecta y debe validarse que el bloqueo dependa dinámicamente del estado de representación. fileciteturn0file0L29-L35

### Problema de mensajería

Actualmente se muestra:

> “CUARTO C no tiene voto en las sesiones de Junta Directiva”.

Este mensaje es incorrecto por dos motivos:

- **CUARTO C es un curso**, no una sesión.
- La prueba corresponde a una **Asamblea**, no a una Junta Directiva.

### Mensaje funcional esperado

El sistema debe explicar que el Suplente no puede votar porque el **Principal está presente y actualmente ejerce la representación**. fileciteturn0file0L34-L37

---

# 5. Caso crítico — CUARTO F

## Datos de la prueba

- **Cédula:** `1015400791`
- **Nombre:** SANCHEZ GONZALEZ NANCY PILAR
- **Rol:** SUPLENTE
- **Curso:** CUARTO F

En el Maestro vigente **no existe un Principal asociado para CUARTO F**.

Nancy estaba presente y, de acuerdo con la regla de representación efectiva, debía ejercer la representación del curso.

## Resultado

**❌ NO PASA — CRÍTICO**

Board Quorum bloqueó el voto, aunque el Suplente debía estar habilitado.

La regla correcta es:

```text
Principal no disponible
        +
Suplente válido presente
        ↓
Suplente actuando como representante
        ↓
Voto habilitado
```

fileciteturn0file0L40-L47

## Regla obligatoria

La plataforma **no puede utilizar una regla estática equivalente a `SUPLENTE = NO VOTA`**.

Debe resolver dinámicamente el estado real del curso y habilitar al Suplente cuando:

- el Principal está ausente; o
- el Principal no existe.

---

# 6. Problema de identidad con la segunda cédula

También se detectó una falla en el proceso de identificación.

## Caso — TERCERO J

Se ingresó:

```text
Cédula: 1014218012
Persona: ANGELA SUAREZ
```

Sin embargo, Board Quorum mostró:

```text
MONGUI MICHAEL ANDRES
Cédula: 1014207966
```

La identidad mostrada corresponde a la **primera persona de la misma fila**, no a la persona cuya cédula fue realmente ingresada. fileciteturn0file0L48-L51

## Resultado

**❌ NO PASA**

La segunda cédula puede utilizarse para localizar el mismo núcleo, pero la identidad mostrada debe ser exactamente la persona asociada al documento ingresado. fileciteturn0file0L53-L56

### Principio fundamental

> **La representación puede ser única; la identidad no puede ser sustituida.**

Esto significa que el sistema puede mantener la regla de **máximo un voto por curso/núcleo**, pero nunca debe reemplazar la identidad de la persona que se autenticó mediante su cédula.

---

# 7. Flujo funcional esperado

La secuencia de una votación debe ser **única, determinística y auditable**.

```text
CÉDULA
   ↓
IDENTIDAD EXACTA
   ↓
NÚCLEO / CURSO
   ↓
REPRESENTANTE EFECTIVO
   ↓
¿EL CURSO YA VOTÓ?
   ↓
HABILITAR / BLOQUEAR
```

El flujo debe ejecutarse en este orden: fileciteturn0file0L59-L70

| Paso | Control requerido |
|---:|---|
| 1 | Resolver la persona exacta asociada a la cédula ingresada. |
| 2 | Resolver el registro, núcleo y curso correspondientes. |
| 3 | Resolver dinámicamente Principal/Suplente según la asistencia y MD13. |
| 4 | Determinar quién ejerce la representación efectiva. |
| 5 | Verificar si el curso ya tiene un voto válido en esa votación. |
| 6 | Habilitar únicamente al representante efectivo. |
| 7 | Bloquear cualquier segundo voto y explicar la causa real. |

---

# 8. Reglas de negocio

## 8.1. Representación efectiva

```text
SI Principal está presente
    REPRESENTANTE_EFECTIVO = Principal

SI Principal está ausente Y Suplente está presente
    REPRESENTANTE_EFECTIVO = Suplente

SI Principal no existe Y Suplente está presente
    REPRESENTANTE_EFECTIVO = Suplente
```

## 8.2. Un solo voto por curso

La asistencia de varias personas del mismo núcleo no implica múltiples votos.

```text
MAX_VOTOS_POR_CURSO = 1
```

El sistema debe permitir que una persona diferente ejerza la representación cuando corresponda, pero debe conservar el límite de **un voto efectivo por curso**.

## 8.3. Identidad exacta

La persona mostrada en pantalla debe derivarse directamente de la cédula ingresada.

```text
CEDULA_INGRESADA
        ↓
PERSONA_ASOCIADA_A_CEDULA
        ↓
IDENTIDAD_MOSTRADA
```

No debe utilizarse automáticamente la primera persona encontrada en la fila cuando existen múltiples personas asociadas al mismo núcleo.

---

# 9. Mensajes esperados

## 9.1. Suplente bloqueado porque el Principal está presente

### Mensaje

> **No es posible registrar un voto adicional.**
>
> El Delegado Principal del curso está presente y ejerce actualmente la representación. Su asistencia permanece registrada, pero el Suplente no puede votar mientras el Principal ejerza la representación.

Este mensaje explica la **causa real del bloqueo** y evita referencias incorrectas a sesiones de Junta Directiva. fileciteturn0file0L71-L75

---

## 9.2. Suplente actuando porque el Principal está ausente

### Mensaje

> **Delegado Suplente reconocido.**
>
> El Delegado Principal no se encuentra presente. Usted ejerce actualmente la representación del curso y se encuentra habilitado para votar.

fileciteturn0file0L76-L79

---

# 10. Pruebas de aceptación pendientes

La corrección debe superar, como mínimo, las siguientes pruebas:

| # | Escenario | Resultado esperado |
|---:|---|---|
| 1 | Principal presente pero aún no ha votado; Suplente intenta votar | Suplente bloqueado por representación, no por existencia de voto previo. |
| 2 | Suplente vota válidamente con Principal ausente; Principal llega después | No se admite un segundo voto del curso en la misma votación. |
| 3 | `CC_PADRE` identifica el mismo núcleo | Mostrar la identidad real de `CC_PADRE` y conservar máximo un voto. |

Estas pruebas son necesarias para confirmar que la lógica no depende de estados estáticos o de una simple comprobación de si ya existe un voto. fileciteturn0file0L80-L84

---

# 11. Documentos funcionales relacionados

El documento identifica tres documentos funcionales como base de la corrección:

| Documento | Función |
|---|---|
| **MD10 actualizado** | Identidad exacta y doble identificación del mismo núcleo. |
| **MD13** | Resolución dinámica Principal/Suplente. |
| **MD15** | Habilitación dinámica del voto y máximo un voto por curso. |

fileciteturn0file0L85-L89

---

# 12. Criterios de aceptación para producción

La implementación podrá considerarse funcionalmente correcta cuando se cumplan simultáneamente estas condiciones:

- [ ] El Principal presente puede votar.
- [ ] El Suplente no puede votar cuando el Principal está presente y ejerce la representación.
- [ ] El Suplente puede votar cuando el Principal está ausente.
- [ ] El Suplente puede votar cuando no existe Principal asociado.
- [ ] El sistema determina la representación de manera dinámica.
- [ ] Cada curso puede registrar como máximo un voto efectivo.
- [ ] La llegada posterior del Principal no genera un segundo voto.
- [ ] La cédula ingresada determina la identidad mostrada.
- [ ] Una segunda cédula del mismo núcleo no sustituye la identidad de la persona que ingresó el documento.
- [ ] Los mensajes de bloqueo explican la causa real.
- [ ] Los mensajes corresponden al contexto de la Asamblea.
- [ ] El flujo completo puede auditarse desde la cédula hasta la decisión final de habilitar o bloquear.

---

# 13. Modelo lógico recomendado

La lógica funcional puede representarse de la siguiente manera:

```text
                    ┌─────────────────────┐
                    │   CÉDULA INGRESADA   │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Resolver identidad  │
                    │      exacta         │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Resolver núcleo /   │
                    │       curso         │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Resolver asistencia │
                    │ Principal/Suplente  │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Determinar          │
                    │ representante       │
                    │ efectivo            │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ ¿Curso ya votó?     │
                    └──────┬────────┬─────┘
                           │        │
                          NO       SÍ
                           │        │
                           ↓        ↓
                 ┌─────────────┐  ┌─────────────┐
                 │ HABILITAR   │  │  BLOQUEAR   │
                 │    VOTO     │  │  SEGUNDO    │
                 └─────────────┘  │    VOTO     │
                                  └─────────────┘
```

---

# 14. Conclusión final

La arquitectura de votación debe consumir la misma **representación efectiva** que utiliza el quórum.

La regla definitiva es:

```text
Principal presente
    → vota el Principal

Principal ausente
    → vota el Suplente

Principal inexistente
    → vota el Suplente

Independientemente de quién ejerza:
    → máximo 1 voto efectivo por curso

En todos los casos:
    → la identidad mostrada debe coincidir exactamente
      con la cédula ingresada
```

Las pruebas del **26 de agosto de 2026** confirman que el flujo del Principal funciona correctamente. Sin embargo, antes de pasar a producción deben corregirse dos puntos críticos:

1. **Habilitación dinámica del Suplente**, especialmente cuando el Principal está ausente o no existe.
2. **Resolución exacta de identidad**, evitando mostrar la primera persona del registro cuando se ingresa una segunda cédula del mismo núcleo.

La corrección debe conservar la regla de **máximo un voto efectivo por curso** y hacer que cada bloqueo explique de forma precisa la condición que impide votar. fileciteturn0file0L92-L97

---

## Referencia del documento fuente

**Board Quorum – Asamblea General de Delegados ASOCOLCI**  
**Pruebas de votación – 26 de agosto de 2026**  
Documento de referencia: `PDF_VOTACIONES_ASAMBLEA_PRUEBA_26AGO2026.pdf`
