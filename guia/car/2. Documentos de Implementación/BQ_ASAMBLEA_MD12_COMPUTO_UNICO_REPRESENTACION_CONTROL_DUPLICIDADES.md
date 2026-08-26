# BOARD QUORUM – ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI

## SOLICITUD QUIRÚRGICA / CAMBIO DE FONDO N.º 12
### Cómputo único de representación en Asamblea / control de duplicidades por persona, rol y curso

**Destino:** Andrés – Implementación Board Quorum  
**Fecha de prueba:** 25 de agosto de 2026  
**Tipo:** Ajuste funcional de cómputo de quórum, representación y control de duplicidades  
**Base de control vigente:** 85 Delegados Principales + 55 Delegados Suplentes = 140 registros  

---

## 1. OBJETIVO

Definir de forma implementable, comprobable y auditable cómo debe calcular Board Quorum el número de **representaciones computables para quórum** en una reunión de Asamblea.

La regla central es:

> **La asistencia física no equivale al quórum. El quórum se calcula sobre representaciones únicas de Asamblea.**

Con la base actualmente validada:

```text
Universo de representación = 85
```

Por tanto:

```text
0 ≤ representaciones computables ≤ 85
```

Nunca puede existir un resultado de quórum superior a 85 mientras ese sea el universo vigente de posiciones Principales habilitadas.

---

## 2. ALCANCE FUNCIONAL

Este punto afecta directamente:

```text
Asistencia
Identidad
Roles
Principal / Suplente
Representación por curso
Quórum
Momento Siguiente
Votación
Proyección en pantalla
Reportes
Acta
Trazabilidad
```

No es un ajuste visual.

---

## 3. EVIDENCIA OBSERVADA – PRUEBA 25.08.2026

Después de utilizar la opción de aceptación masiva de asistencia, Board Quorum mostró:

```text
Asistencia registrada:        162
Representaciones computables: 96
Elegibles:                    105
Mínimo requerido:             53
```

En el detalle de quórum se observaron, entre otros, registros que la plataforma estaba tratando como computables por condiciones diferentes a la representación única de Delegado en Asamblea, incluyendo cargos de:

```text
PRESIDENCIA
VICEPRESIDENCIA
SECRETARÍA
TESORERÍA
FISCALÍA
VOCALES
JUNTA DE VIGILANCIA
```

También se observaron personas que aparecían en más de una condición o rol dentro de la reunión.

Ejemplos detectados en el detalle:

```text
EILEN MILENA PIEDRAHITA ESCOBAR – PRESIDENCIA
PIEDRAHITA EILEN – NOVENO B

ESTEFANÍA NÚÑEZ DOMÍNGUEZ – VOCALES
NUÑEZ DOMINGUEZ ESTEFANIA – TERCERO C

DIANA PAOLA MOLINA CARDENAS – VOCALES
MOLINA DIANA PAOLA – SEPTIMO C

JENNY MARCELA VIRGUEZ – SECRETARIA
VIRGUEZ JENNY MARCELA – ONCE E
```

Adicionalmente, el detalle mostró una regla:

```text
Junta de Vigilancia → +1 voto institucional
```

Para el cómputo de quórum de la Asamblea, esa condición no debe crear una representación adicional.

### Conclusión del hallazgo

> **NO PASA – el motor de quórum está permitiendo que roles, identidades o registros adicionales produzcan un número de representaciones computables superior al universo válido de Asamblea.**

---

## 4. UNIVERSO FUNCIONAL DE ASAMBLEA

Con el Maestro vigente:

```text
Principales = 85
Suplentes   = 55
Total       = 140
```

El universo para quórum es:

```text
U = 85
```

Los 55 Suplentes no aumentan el universo.

Su función es ocupar una posición existente cuando el Principal correspondiente está ausente y el Suplente actúa como Principal.

---

## 5. UNIDAD DE CÓMPUTO

La unidad de cómputo no es:

```text
persona
cédula
rol
cargo
registro de asistencia
```

La unidad de cómputo es:

> **una posición de representación válida de Asamblea.**

Para cada curso elegible `i`:

```text
R_i ∈ {0,1}
```

donde:

```text
R_i = 0  → el curso no tiene representación válida presente
R_i = 1  → el curso tiene una representación válida presente
```

Nunca:

```text
R_i = 2
```

---

## 6. FÓRMULA DEL QUÓRUM PRESENTE

Sea:

```text
U = universo de posiciones elegibles
Q = representaciones computables presentes
R_i = representación computable de cada curso
```

Entonces:

```text
Q = Σ R_i
```

para todos los cursos elegibles.

Con la base vigente:

```text
U = 85
```

y debe cumplirse siempre:

```text
0 ≤ Q ≤ 85
```

---

## 7. ASISTENCIA FÍSICA VS. REPRESENTACIÓN

Sea:

```text
A = personas con asistencia registrada
Q = representaciones computables
```

Puede ocurrir:

```text
A > U
```

porque pueden existir asistentes que no generen representación para quórum.

Por ejemplo:

```text
A = 162
```

no es, por sí solo, una inconsistencia.

La restricción obligatoria es:

```text
Q ≤ U
```

Con el universo vigente:

```text
Q ≤ 85
```

Por tanto:

```text
A = 162   → puede ser posible
Q = 96    → NO puede ser correcto si U = 85
```

---

## 8. REGLA PRINCIPAL / SUPLENTE

Por cada curso:

### Caso A – Principal presente

```text
Principal presente
→ R_i = 1
```

El Suplente no genera una segunda representación.

### Caso B – Principal ausente + Suplente presente

```text
Principal ausente
+
Suplente presente
→ Suplente actúa como Principal
→ R_i = 1
```

### Caso C – Principal y Suplente presentes

```text
Principal presente
+
Suplente presente
→ R_i = 1
```

Nunca:

```text
R_i = 2
```

---

## 9. REGLA DE NÚCLEO FAMILIAR

MD10 define que una misma fila puede contener:

```text
CC_MADRE
CC_PADRE
```

como dos identificaciones válidas de un mismo núcleo familiar / posición de representación.

Por tanto:

```text
2 cédulas reconocibles
→ 1 registro funcional
→ máximo 1 representación
```

Si uno de los padres ya activó la representación:

```text
segundo padre reconocido
→ representación adicional = 0
→ quórum adicional = 0
→ voto adicional = 0
```

---

## 10. REGLA DE PERSONA CON MÚLTIPLES ROLES

Una misma persona puede aparecer en Board Quorum con más de una condición o rol.

Ejemplo conceptual:

```text
Delegado + Presidente de Junta Directiva
Delegado + Vocal
Delegado + Secretario
Delegado + integrante de Junta de Vigilancia
```

Esto no significa múltiples representaciones de Asamblea.

La regla es:

```text
1 persona
+ múltiples roles
→ máximo 1 representación de Asamblea
```

Y esa representación solo existe si la persona está habilitada como Delegado Principal o Suplente actuando como Principal dentro de la Asamblea.

---

## 11. CARGOS DE OTROS ÓRGANOS

Los siguientes cargos no generan por sí mismos una representación adicional de Asamblea:

```text
PRESIDENCIA
VICEPRESIDENCIA
SECRETARÍA
TESORERÍA
FISCALÍA
VOCALES
JUNTA DE VIGILANCIA
ADMINISTRACIÓN
CONTABILIDAD
REVISORÍA FISCAL
```

Si una persona que ocupa alguno de esos cargos también es Delegado habilitado:

```text
se evalúa por su condición de Delegado en Asamblea
```

No por el cargo adicional.

Por tanto:

```text
cargo adicional
→ +0 representaciones
```

---

## 12. JUNTA DE VIGILANCIA

La prueba mostró:

```text
Junta de Vigilancia → +1 voto institucional
```

Para el cálculo del quórum de Asamblea esa regla no debe aumentar:

```text
universo
representaciones presentes
quórum
votos de Asamblea
```

salvo que exista una fuente autorizada que expresamente otorgue ese efecto.

Mientras no exista esa regla:

```text
Junta de Vigilancia
→ +0 representaciones de Asamblea
```

---

## 13. REGLA DE UNICIDAD POR CURSO

Para cada curso elegible debe existir como máximo una representación computable.

Conceptualmente:

```text
REPRESENTACIÓN_CURSO_i =
    1 si existe Principal presente
    1 si Principal está ausente y Suplente actúa como Principal
    0 en los demás casos
```

Equivalente:

```text
R_i = min(1, representaciones válidas activas del curso i)
```

Esta regla debe aplicarse antes de sumar el quórum total.

---

## 14. REGLA DE UNICIDAD POR PERSONA

Una misma identidad no puede aportar dos veces al quórum por aparecer:

```text
como Delegado
y además
como integrante de Junta Directiva
o Junta de Vigilancia
u otro rol
```

La plataforma debe resolver la identidad antes del cómputo.

Conceptualmente:

```text
identidad única
→ roles asociados
→ condición válida de Asamblea
→ máximo 1 representación
```

---

## 15. REGLA DE UNICIDAD POR NÚCLEO FAMILIAR

Una misma posición del Maestro puede ser accesible por más de una cédula.

La plataforma debe resolver:

```text
cédula
→ registro/núcleo familiar
→ posición de representación
```

y no:

```text
cédula
→ nueva representación independiente
```

---

## 16. ALGORITMO FUNCIONAL

```text
INPUT:
    reunión de Asamblea
    Maestro vigente

1. Resolver universo U de posiciones Principales habilitadas.

2. Para la base vigente:
       U = 85

3. Leer asistencias registradas.

4. Resolver identidad única de cada persona.

5. Resolver el registro/núcleo familiar asociado.

6. Resolver rol de Asamblea:
       Principal
       Suplente

7. Para cada curso:
       si Principal está presente:
           R_i = 1
       else if Suplente válido está presente:
           R_i = 1
       else:
           R_i = 0

8. Ignorar para quórum:
       roles adicionales
       cargos de Junta Directiva
       Junta de Vigilancia
       Administración
       Contabilidad
       Revisoría Fiscal
       duplicados de identidad
       segunda cédula del mismo núcleo
       Suplente cuando ya está actuando el Principal

9. Calcular:
       Q = Σ R_i

10. Validar:
       Q ≤ U

11. Si:
       Q > U
   entonces:
       ERROR FUNCIONAL
       no publicar resultado de quórum como válido.
```

---

## 17. CÁLCULO DEL QUÓRUM INICIAL

La regla vigente para la Asamblea es:

```text
50% + 1
```

Para un universo `U`:

```text
M1 = ceil((U × 0.50) + 1)
```

Con:

```text
U = 85
```

se obtiene:

```text
85 × 0.50 = 42.5
42.5 + 1 = 43.5
ceil(43.5) = 44
```

Por tanto:

```text
M1 = 44
```

---

## 18. CÁLCULO DE MOMENTO SIGUIENTE

La regla vigente es:

```text
20% del mismo universo
```

Por tanto:

```text
M2 = ceil(U × 0.20)
```

Con:

```text
U = 85
```

se obtiene:

```text
85 × 0.20 = 17
```

Por tanto:

```text
M2 = 17
```

El universo no cambia:

```text
85 elegibles / 44 mínimo
        ↓
Momento Siguiente
        ↓
85 elegibles / 17 mínimo
```

---

## 19. INVARIANTES FUNCIONALES

Board Quorum debe garantizar en toda reunión de Asamblea:

```text
I-01: U = universo único resuelto para la reunión

I-02: 0 ≤ Q ≤ U

I-03: por curso, R_i ∈ {0,1}

I-04: una identidad no suma dos veces

I-05: un núcleo familiar no suma dos veces

I-06: Principal + Suplente del mismo curso no suman dos veces

I-07: un cargo adicional no genera representación adicional

I-08: Junta de Vigilancia no genera representación institucional adicional

I-09: el número de asistentes físicos puede ser mayor que Q

I-10: todas las pantallas y reportes deben utilizar el mismo Q
```

---

## 20. CASOS DE PRUEBA OBLIGATORIOS

### CP-01 – Aceptar a todos

Registrar masivamente todos los asistentes disponibles.

Esperado:

```text
A puede ser > 85
Q nunca puede ser > 85
```

### CP-02 – Principal + Suplente del mismo curso

Ambos presentes.

Esperado:

```text
R_i = 1
```

### CP-03 – Padre + madre del mismo núcleo

Ambas identificaciones reconocidas.

Esperado:

```text
representaciones = 1
```

### CP-04 – Delegado con cargo de Junta Directiva

Una misma persona aparece como:

```text
Delegado
+
cargo JD
```

Esperado:

```text
representaciones = 1
```

### CP-05 – Persona solo con cargo JD

Persona presente pero sin condición de Delegado computable.

Esperado:

```text
representaciones = 0
```

### CP-06 – Junta de Vigilancia

Integrantes presentes.

Esperado:

```text
representación institucional adicional = 0
```

### CP-07 – Control de techo

Con la base vigente:

```text
U = 85
```

Esperado:

```text
Q nunca > 85
```

### CP-08 – Reporte y proyección

Comparar:

```text
Detalle de quórum
Tarjeta de quórum
Proyección pantalla completa
Reporte
Acta
```

Esperado:

```text
mismo U
mismo Q
```

---

## 21. CRITERIOS DE ACEPTACIÓN

MD12 se considera resuelto cuando:

- [ ] El universo de Asamblea utilizado es el definido por el Maestro vigente.
- [ ] Con la base actual `U = 85`.
- [ ] Cada curso puede aportar máximo una representación.
- [ ] El Principal presente aporta una representación.
- [ ] El Suplente solo aporta representación cuando corresponde actuar como Principal.
- [ ] Principal y Suplente del mismo curso nunca aportan dos representaciones.
- [ ] Madre y padre del mismo núcleo nunca aportan dos representaciones.
- [ ] Una misma persona con varios roles nunca aporta dos representaciones.
- [ ] Cargos de Junta Directiva no generan representación adicional.
- [ ] Junta de Vigilancia no genera un `+1` institucional para quórum de Asamblea.
- [ ] Administración, Contabilidad y Revisoría Fiscal no generan representación por esa condición.
- [ ] La asistencia física puede ser superior al universo sin modificar el denominador.
- [ ] El quórum computable nunca supera el universo.
- [ ] Con `U = 85`, debe cumplirse siempre `Q ≤ 85`.
- [ ] El quórum inicial se calcula en 44.
- [ ] Momento Siguiente se calcula en 17.
- [ ] Todos los módulos muestran el mismo resultado de quórum.
- [ ] El detalle permite auditar por qué cada persona/registro cuenta o no cuenta.

---

## 22. RELACIÓN CON OTROS MD

Este documento complementa:

```text
MD05 – Identidad y roles por órgano
MD10 – Doble identificación del núcleo familiar / una sola representación
MD11 – Vinculación Reunión de Asamblea → Maestro vigente / universo único
```

La relación es:

```text
MD05
→ define identidad y rol

MD10
→ evita duplicidad por dos cédulas del mismo núcleo

MD11
→ asegura un único Maestro y universo

MD12
→ asegura un único cómputo final de representación
```

---

## 23. FUERA DEL ALCANCE

Este MD no redefine:

```text
el Maestro de Delegados
la composición 85 / 55
las reglas de poderes
la transferencia de representación durante una reunión
la segunda convocatoria
```

Tampoco define nuevos derechos para Junta Directiva, Junta de Vigilancia u otros roles.

Si una fuente autorizada establece posteriormente un derecho adicional, deberá modelarse expresamente.

---

## CONCLUSIÓN FUNCIONAL

> **Board Quorum debe calcular el quórum de Asamblea sobre representaciones únicas, no sobre asistencias brutas ni sobre la suma de roles. Con el Maestro vigente, el universo máximo es 85. Cada curso puede aportar 0 o 1 representación. Una misma persona, un mismo núcleo familiar, Principal y Suplente del mismo curso, o cargos adicionales en otros órganos nunca pueden generar una representación adicional. En consecuencia, con U = 85 debe cumplirse siempre Q ≤ 85.**

---

**Fin – Solicitud Quirúrgica / Cambio de Fondo N.º 12**
