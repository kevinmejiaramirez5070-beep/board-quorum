# BOARD QUORUM – ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI

## TEST ASAMBLEA NRO. 1  
### SOLICITUD DE FONDO 01 – UNIVERSO CORRECTO PARA EL CÁLCULO DEL QUÓRUM

**Fecha de prueba:** 20 de agosto de 2026  
**Destino:** Andrés – Implementación Board Quorum  
**Tipo:** Hallazgo funcional sobre regla ya entregada  
**Referencia funcional:** `BQ_MODULO_01_DE_08_Motor_Quorum_v3.md` y Estatuto ASOCOLCI 2025, artículos 8 y 11.

---

## 1. OBJETIVO DE ESTA SOLICITUD

Andrés:

Durante la prueba `TEST ASAMBLEA NRO 1` encontramos que Board Quorum está calculando correctamente la fórmula de “mitad más uno”, pero aparentemente la está aplicando sobre un **universo de elegibles incorrecto**.

La solicitud es revisar únicamente **cómo se determina el universo de elegibles para Asamblea**.

Esta no es una regla nueva. La lógica ya estaba definida en el Módulo 1 – Motor de Quórum entregado previamente.

---

## 2. HALLAZGO OBSERVADO EN LA PRUEBA

En la pantalla de quórum de `TEST ASAMBLEA NRO 1`, Board Quorum mostró:

- **Presentes:** 0
- **Elegibles:** 42
- **Mínimo requerido:** 22
- **Estado:** Quórum no alcanzado

El cálculo:

```text
42 / 2 = 21
21 + 1 = 22
```

es matemáticamente correcto.

El punto a revisar es **por qué Board Quorum está tomando 42 como “Elegibles”**.

---

## 3. MUESTRA UTILIZADA PARA ESTA PRUEBA

Para esta prueba se cargó intencionalmente una muestra controlada de:

- **20 Delegados Principales**
- **20 Delegados Suplentes**

La muestra representa **20 posiciones de representación**.

El Principal y el Suplente de un mismo curso **no son dos unidades de quórum**.

Representan una sola posición:

```text
CURSO
 ├── Principal
 └── Suplente
```

Por lo tanto:

```text
20 Principales + 20 Suplentes
NO significa 40 posiciones de quórum.

Significa 20 posiciones de representación.
```

---

## 4. REGLA FUNCIONAL QUE DEBE APLICAR BOARD QUORUM

Para Asamblea General:

> **La unidad de cómputo del quórum es la posición de representación del curso, no la cantidad de personas cargadas en la plataforma.**

Board Quorum debe obtener primero:

```text
N = total de Delegados Principales habilitados
    en el maestro vigente de la Asamblea
```

Ese `N` constituye el universo para calcular el quórum.

No deben incrementar `N`:

- los Delegados Suplentes;
- personas sin rol de Delegado Principal;
- asistentes adicionales;
- registros cargados que no correspondan a una posición principal habilitada.

---

## 5. CÁLCULO ESPERADO PARA TEST ASAMBLEA NRO. 1

Con la muestra actual:

```text
N = 20 Principales habilitados
```

El quórum inicial debe calcularse dinámicamente:

```text
quorum_inicial = FLOOR(N / 2) + 1
```

Por tanto:

```text
FLOOR(20 / 2) + 1
= 10 + 1
= 11
```

### Resultado esperado en pantalla

```text
ELEGIBLES:        20
MÍNIMO REQUERIDO: 11
PRESENTES:         0
ESTADO:            Quórum no alcanzado
```

---

## 6. LÓGICA PRINCIPAL / SUPLENTE

Para cada curso, Board Quorum debe evaluar la representación así:

| Situación | ¿Cuenta para quórum? | Representante con voto |
|---|---:|---|
| Principal presente | 1 | Principal |
| Principal ausente + Suplente presente | 1 | Suplente actuando como Principal |
| Principal y Suplente presentes | 1 | Principal |
| Ninguno presente | 0 | Ninguno |

### Regla crítica

> **Un curso nunca puede aportar más de una representación al quórum.**

Ejemplo:

```text
Curso 6A:
Principal presente
Suplente presente
```

Resultado:

```text
Personas presentes: 2
Representaciones para quórum: 1
Votante: Principal
```

---

## 7. EL SUPLENTE NO AUMENTA EL UNIVERSO

El Suplente existe para reemplazar al Principal cuando este no actúa.

Ejemplo:

```text
Curso 6B:
Principal ausente
Suplente presente
```

Resultado:

```text
Curso representado: SÍ
Representaciones para quórum: 1
acting_as_principal = true
```

Si posteriormente ingresa el Principal:

```text
Curso representado: sigue siendo 1
Votante: pasa al Principal
Suplente: deja de actuar como Principal
```

El quórum no debe aumentar por este cambio.

---

## 8. EL CÁLCULO DEBE SER DINÁMICO

Los valores **11**, **42**, **17**, etc. no deben quedar fijos en código.

Deben ser resultados de la base vigente.

Ejemplos:

```text
N = 20  → quórum inicial = 11
N = 83  → quórum inicial = 42
N = 81  → quórum inicial = 41
N = 84  → quórum inicial = 43
```

Para la Asamblea real de agosto, el valor definitivo dependerá de la base depurada que finalmente quede cargada y habilitada en Board Quorum.

---

## 9. PSEUDOLÓGICA FUNCIONAL

La lógica esperada puede resumirse así:

```text
1. Leer maestro vigente de Delegados de Asamblea.

2. Contar únicamente Principales activos/habilitados:
   N = total_principales

3. Calcular:
   quorum_inicial = FLOOR(N / 2) + 1

4. Para asistencia:
   por cada curso:
       si Principal presente y válido:
           representación = 1
           votante = Principal

       si Principal NO presente
       y Suplente presente y válido:
           representación = 1
           votante = Suplente actuando como Principal

       en cualquier otro caso:
           representación = 0

5. Nunca permitir más de una representación por curso.
```

---

## 10. CRITERIOS DE ACEPTACIÓN DE ESTA SOLICITUD

La solicitud se considera resuelta cuando, utilizando la muestra actual:

- [ ] Board Quorum muestre **20 Elegibles**.
- [ ] Board Quorum calcule **11 como mínimo requerido**.
- [ ] Principal + Suplente del mismo curso sumen **una sola representación**.
- [ ] Un Suplente pueda representar al curso cuando el Principal esté ausente.
- [ ] Si posteriormente ingresa el Principal, la representación siga siendo una sola.
- [ ] Personas o registros que no sean posiciones Principales habilitadas no aumenten el universo de elegibles.
- [ ] El número mínimo requerido cambie automáticamente si cambia el maestro de Delegados.
- [ ] No exista ningún valor de quórum hardcodeado.
- [ ] Los ajustes realizados para Asamblea no alteren la lógica ya operativa de Junta Directiva.

---

## 11. RESULTADO ESPERADO DE LA REVISIÓN TÉCNICA

Antes de construir algo nuevo, por favor revisar la lógica actualmente implementada y confirmar:

1. De dónde sale hoy el valor `42` mostrado como **Elegibles**.
2. Qué consulta o función está alimentando ese valor.
3. Si actualmente está contando personas en lugar de posiciones Principales.
4. Qué componente existente puede reutilizarse o adaptarse para aplicar la lógica definida en el Módulo 1.

Principio del proyecto:

```text
REUTILIZAR → ADAPTAR → CONSTRUIR
```

---

## CONCLUSIÓN FUNCIONAL

Para Asamblea General, Board Quorum debe calcular el quórum sobre el **total de posiciones de Delegado Principal habilitadas en el maestro vigente**.

El Suplente no crea una posición adicional.

Únicamente ocupa la posición del Principal de su curso cuando corresponde.

En `TEST ASAMBLEA NRO 1`, con 20 posiciones Principales habilitadas, el resultado esperado es:

```text
20 ELEGIBLES
11 MÍNIMO REQUERIDO
```

y no:

```text
42 ELEGIBLES
22 MÍNIMO REQUERIDO
```

---

**Fin – Solicitud de Fondo 01**
