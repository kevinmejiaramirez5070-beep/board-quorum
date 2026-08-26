# BOARD QUORUM – ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI

## SOLICITUD QUIRÚRGICA / CAMBIO DE FONDO N.º 10
### Doble identificación del núcleo familiar / una sola representación efectiva

**Destino:** Andrés – Implementación Board Quorum  
**Fecha de prueba:** 25 de agosto de 2026  
**Tipo:** Ajuste funcional de identidad, asistencia, quórum y voto  
**Base de control:** Maestro vigente de Asamblea – 85 Principales + 55 Suplentes = 140 registros  

---

## 1. OBJETIVO

Definir sin ambigüedad cómo debe interpretar Board Quorum una fila del Maestro de Delegados cuando contiene simultáneamente:

```text
CC_MADRE
APELLIDOS_NOMBRES_MADRE
CC_PADRE
APELLIDOS_NOMBRES_PADRE
ROL
CURSO
ALUMNO
```

La regla funcional es:

> **Las dos cédulas son identificaciones válidas asociadas al mismo núcleo familiar y a la misma posición de representación.**

Cualquiera de los dos padres puede identificarse para ejercer esa representación.

Sin embargo:

> **El núcleo familiar genera máximo una representación efectiva para quórum y voto.**

Por tanto:

```text
2 cédulas reconocibles
        ↓
1 registro / núcleo familiar
        ↓
1 posición de representación
        ↓
máximo 1 efecto en quórum
        ↓
máximo 1 voto efectivo
```

---

## 2. ALCANCE FUNCIONAL

Este punto **sí afecta directamente el comportamiento de Board Quorum** porque interviene en:

```text
Identificación pública
Registro de asistencia
Representación
Quórum
Habilitación para votar
Prevención de duplicidades
Mensajes al participante
Trazabilidad
```

No es un ajuste meramente visual.

---

## 3. FUNDAMENTO FUNCIONAL Y DOCUMENTAL

El Estatuto vigente establece que la afiliación se estructura por núcleo familiar y dispone que únicamente podrá pertenecer a la Asociación un miembro por núcleo familiar afiliado, ya sea padre, madre o acudiente registrado.

También establece que el Delegado representa al curso y que el Suplente asume la representación cuando el Principal está ausente.

La base validada utilizada por Board Quorum contiene, dentro de una misma fila, campos independientes para:

```text
CC_MADRE
NOMBRE_MADRE
CC_PADRE
NOMBRE_PADRE
```

Por tanto, para efectos de implementación, esas dos identificaciones deben funcionar como **llaves alternativas de acceso al mismo registro funcional**, no como dos representaciones diferentes.

### Regla operativa confirmada para Board Quorum

> **Cualquiera de los dos padres registrados en la fila puede ejercer la representación del núcleo familiar. El primero que se registra ocupa esa representación para la reunión y bloquea al otro para efectos de generar una segunda representación, un segundo efecto de quórum o un segundo voto.**

---

## 4. EJEMPLO DE CONTROL

Registro real utilizado como ejemplo:

```text
CURSO:       PREJARDÍN A
ROL:         PRINCIPAL

CC_MADRE:    1016082913
MADRE:       IBARRA INGRIT PAOLA

CC_PADRE:    1015413709
PADRE:       RODRIGUEZ FERNANDO ALONSO

ALUMNO:      RODRIGUEZ IBARRA HADE NAOMY
```

Board Quorum debe interpretar este registro como:

```text
NÚCLEO FAMILIAR: 1
POSICIÓN PRINCIPAL: 1
CURSO REPRESENTADO: PREJARDÍN A
IDENTIFICACIONES VÁLIDAS: 2
REPRESENTACIONES MÁXIMAS: 1
VOTOS MÁXIMOS: 1
```

### Escenario A – se registra primero la madre

```text
1016082913 – IBARRA INGRIT PAOLA
```

Resultado esperado:

```text
Cédula reconocida: SÍ
Registro identificado: PREJARDÍN A / PRINCIPAL
Representación activada: SÍ
Quórum generado: 1
Voto habilitable: 1
```

Si posteriormente se identifica:

```text
1015413709 – RODRIGUEZ FERNANDO ALONSO
```

Board Quorum debe:

```text
Reconocer la cédula: SÍ
Reconocer el mismo núcleo familiar: SÍ
Crear nueva representación: NO
Aumentar quórum: NO
Habilitar segundo voto: NO
```

### Escenario B – se registra primero el padre

El comportamiento debe ser exactamente simétrico.

Si primero se registra:

```text
1015413709 – RODRIGUEZ FERNANDO ALONSO
```

él ocupa la única representación disponible del núcleo familiar.

Si posteriormente se identifica:

```text
1016082913 – IBARRA INGRIT PAOLA
```

la plataforma debe reconocerla, pero **no puede generar una segunda representación ni un segundo voto**.

---

## 5. HALLAZGO OBSERVADO EN PRUEBAS DEL 25.08.2026

Durante las pruebas se observaron varios registros en los cuales una de las dos identificaciones de la fila fue reconocida y la otra fue reportada como inexistente.

### Caso 1

```text
1015454969 – VASQUEZ MARIA DEL PILAR        → RECONOCIDA
1014241215 – ARDILA RUIZ CRISTIAN (...)     → "CÉDULA NO ENCONTRADA"
```

### Caso 2

```text
1014212412 – ARIZA TATIANA                  → RECONOCIDA
1032381207 – LOPEZ LUIS EDUARDO             → "CÉDULA NO ENCONTRADA"
```

La segunda cédula fue probada sin que previamente se hubiera registrado la primera, descartando que el mensaje se debiera únicamente a un bloqueo por representación ya ocupada.

### Caso 3

```text
1012100559 – LEGUIZAMON JOHANNA             → RECONOCIDA
1016019971 – MARTINEZ FABIAN ORLANDO        → "CÉDULA NO ENCONTRADA"
```

### Caso 4

```text
41939991   – GIL LOTERO MARIA MERCEDES      → RECONOCIDA
80255413   – APONTE RODRIGUEZ EDWAR ANDRES  → "CÉDULA NO ENCONTRADA"
```

### Conclusión del hallazgo

> **NO PASA – Board Quorum no está reconociendo de forma consistente las dos identificaciones asociadas a un mismo registro del Maestro.**

No se concluye que toda `CC_PADRE` falle.

En otras pruebas se observaron documentos ubicados en `CC_PADRE` que sí fueron reconocidos.

El problema funcional confirmado es:

> **Una identificación existente en el Maestro puede ser tratada por Board Quorum como si no existiera.**

---

## 6. MENSAJE ACTUAL QUE NO CORRESPONDE

Cuando la segunda identificación existe en el Excel, Board Quorum está mostrando:

```text
CÉDULA NO ENCONTRADA
No se encontró en la base de datos
```

Ese mensaje es incorrecto para este escenario.

La cédula:

```text
SÍ existe en el Maestro cargado
```

El sistema debe distinguir entre dos situaciones diferentes.

### Situación 1 – documento realmente inexistente

```text
La cédula no coincide con CC_MADRE ni CC_PADRE
de ningún registro activo del Maestro.
```

Mensaje válido:

```text
CÉDULA NO ENCONTRADA
```

Este escenario continúa sujeto al flujo de contingencia definido para participante no encontrado.

### Situación 2 – documento sí existe, pero la representación ya está ocupada

```text
La cédula coincide con un registro válido.
La otra identificación del mismo núcleo familiar
ya activó la representación.
```

Mensaje esperado:

```text
IDENTIFICACIÓN RECONOCIDA

La representación de este núcleo familiar
ya fue registrada.

Este documento no genera una representación
adicional para efectos de quórum ni un voto adicional.
```

No debe mostrarse:

```text
CÉDULA NO ENCONTRADA
```

---

## 7. REGLA DE IDENTIFICACIÓN

Para cada intento de ingreso, Board Quorum debe buscar la cédula contra **ambos campos** del Maestro vigente:

```text
CC_MADRE
CC_PADRE
```

La búsqueda debe tratar ambos documentos como identificadores alternativos del mismo registro.

Conceptualmente:

```text
documento_ingresado
        ↓
buscar en CC_MADRE
        +
buscar en CC_PADRE
        ↓
si existe coincidencia
        ↓
resolver UN MISMO registro funcional
```

No debe ocurrir:

```text
CC_MADRE = identidad principal reconocible
CC_PADRE = dato informativo no reconocible
```

salvo que una fuente funcional futura defina expresamente esa restricción.

---

## 8. REGLA DE UNICIDAD DE REPRESENTACIÓN

La unidad funcional que debe bloquearse no es simplemente la cédula.

Debe bloquearse la **posición de representación asociada al registro/núcleo familiar dentro de la reunión**.

Regla:

```text
Primer documento válido del registro que activa representación
                         ↓
              representación ocupada
                         ↓
segundo documento del mismo registro puede ser reconocido
                         ↓
NO crea segunda representación
NO aumenta quórum
NO habilita segundo voto
```

La plataforma debe conservar la relación:

```text
IDENTIDAD
≠
REPRESENTACIÓN
```

Dos identidades posibles no implican dos representaciones.

---

## 9. RELACIÓN CON PRINCIPAL / SUPLENTE

Este MD no reemplaza la lógica ya definida para Principal y Suplente.

Las dos capas deben operar conjuntamente.

### Capa 1 – Núcleo familiar / registro

```text
CC_MADRE + CC_PADRE
        ↓
una sola posición del registro
```

### Capa 2 – Representación del curso

```text
PRINCIPAL presente
        ↓
Principal ejerce la representación

PRINCIPAL ausente
+
SUPLENTE presente
        ↓
Suplente actúa como Principal
```

Por tanto, si una fila tiene:

```text
ROL = PRINCIPAL
```

cualquiera de las dos identificaciones válidas de esa fila puede activar **esa misma posición Principal**, pero nunca crear dos posiciones.

Si una fila tiene:

```text
ROL = SUPLENTE
```

las dos identificaciones siguen correspondiendo a **una sola posición Suplente**.

La suplencia frente al Principal del curso continúa rigiéndose por las reglas ya documentadas.

---

## 10. PSEUDOLÓGICA FUNCIONAL

```text
INPUT:
    documento_ingresado
    reunion_id

1. Leer Maestro vigente de Asamblea.

2. Normalizar documento_ingresado.

3. Buscar coincidencia en:
       CC_MADRE
       OR
       CC_PADRE

4. Si NO existe coincidencia:
       mostrar "CÉDULA NO ENCONTRADA"
       ofrecer flujo de validación definido para no encontrados
       FIN

5. Si existe coincidencia:
       resolver registro_funcional
       obtener:
           rol
           curso
           núcleo/posición de representación
           CC_MADRE
           CC_PADRE

6. Consultar si esa posición ya tiene
   representación activa en la reunión.

7. Si NO está activa:
       registrar la identidad que ingresó
       activar la única representación disponible
       aplicar reglas Principal/Suplente
       actualizar quórum según corresponda
       habilitar máximo un voto para esa representación

8. Si YA está activa por la otra identificación:
       reconocer la identidad
       NO crear nueva representación
       NO incrementar quórum
       NO habilitar voto adicional
       informar que la representación ya está ocupada

9. Registrar trazabilidad del evento.
```

---

## 11. MODELO CONCEPTUAL MÍNIMO

No se impone una estructura técnica específica.

Sin embargo, la implementación debe poder representar conceptualmente:

```text
REGISTRO DELEGADO / NÚCLEO
- identificador único del registro
- CC_MADRE
- nombre_madre
- CC_PADRE
- nombre_padre
- rol
- curso
- alumno
```

Y para cada reunión:

```text
REPRESENTACIÓN EN REUNIÓN
- registro_delegado_id
- identidad que activó la representación
- fecha_hora_activación
- estado de representación
- efecto_quórum
- habilitación_voto
```

El objetivo es evitar que el bloqueo dependa únicamente del número de cédula.

---

## 12. TRAZABILIDAD MÍNIMA

Cuando una representación sea activada, Board Quorum debe poder conservar:

```text
Reunión
Curso
Rol
Registro / núcleo familiar
Documento que activó la representación
Nombre asociado al documento
Fecha y hora
Efecto en quórum
```

Si posteriormente se intenta utilizar la segunda identificación, debe poder quedar evidenciado:

```text
Documento reconocido
Registro coincidente
Representación ya ocupada
Sin efecto adicional en quórum
Sin voto adicional
Fecha y hora del intento/registro, cuando aplique
```

---

## 13. CASOS DE PRUEBA OBLIGATORIOS

### CP-01 – Madre ingresa primero

```text
1016082913
```

Esperado:

```text
Reconocida
PREJARDÍN A / PRINCIPAL
Representación = 1
```

Luego:

```text
1015413709
```

Esperado:

```text
Reconocido
Mismo núcleo
Representación adicional = 0
Quórum adicional = 0
Voto adicional = 0
```

### CP-02 – Padre ingresa primero

Primero:

```text
1015413709
```

Luego:

```text
1016082913
```

Esperado:

```text
Mismo resultado funcional que CP-01,
invirtiendo únicamente la identidad que activó la representación.
```

### CP-03 – Documento inexistente

Ingresar una cédula que no exista en ningún `CC_MADRE` ni `CC_PADRE`.

Esperado:

```text
CÉDULA NO ENCONTRADA
```

### CP-04 – Segunda identificación no puede aumentar quórum

Después de activar una representación con uno de los padres, ingresar el segundo documento.

Esperado:

```text
quórum_antes = quórum_después
```

### CP-05 – Segunda identificación no puede votar adicionalmente

Después de que la primera identidad del registro tenga habilitada/ejercida la representación:

```text
segundo_documento
```

Esperado:

```text
segundo voto independiente = BLOQUEADO
```

### CP-06 – Registro SUPLENTE con doble identificación

Seleccionar una fila:

```text
ROL = SUPLENTE
CC_MADRE ≠ vacío
CC_PADRE ≠ vacío
```

Esperado:

```text
Ambos documentos reconocen la misma posición SUPLENTE.
Nunca generan dos Suplentes ni dos representaciones.
```

---

## 14. CRITERIOS DE ACEPTACIÓN

La solicitud se considera resuelta cuando:

- [ ] Board Quorum busca la identificación tanto en `CC_MADRE` como en `CC_PADRE`.
- [ ] Una cédula existente en cualquiera de esos campos es reconocida como válida.
- [ ] Las dos cédulas de una misma fila resuelven el mismo registro funcional.
- [ ] El primer padre que se registra puede activar la única representación disponible del núcleo familiar.
- [ ] El segundo padre es reconocido, pero no genera una segunda representación.
- [ ] El segundo padre no incrementa el quórum.
- [ ] El segundo padre no obtiene un segundo voto independiente.
- [ ] El orden madre→padre o padre→madre produce el mismo resultado funcional.
- [ ] El mensaje `CÉDULA NO ENCONTRADA` se usa únicamente cuando el documento realmente no existe en el Maestro activo.
- [ ] Cuando la representación ya está ocupada, el mensaje informa esa situación de manera explícita.
- [ ] La lógica aplica tanto a registros `PRINCIPAL` como `SUPLENTE`.
- [ ] Se mantiene intacta la regla Principal/Suplente por curso.
- [ ] La solución no crea dos miembros, dos delegados ni dos posiciones a partir de una sola fila.
- [ ] La trazabilidad permite identificar qué documento activó la representación.
- [ ] El comportamiento puede probarse de forma reproducible con las cédulas de control.

---

## 15. FUERA DEL ALCANCE DE ESTE MD

Este documento **no define**:

```text
Transferencia de la representación entre madre y padre
durante una misma reunión después de que uno ya la activó.
```

Ese comportamiento no debe inventarse.

Si se requiere posteriormente, deberá existir una regla funcional expresa y auditable.

Tampoco modifica:

```text
Reglas de poder
Reglas de Momento Siguiente
Cálculo general 85 / 44 / 17
Reglas de Principal / Suplente ya aprobadas
```

---

## 16. DEPENDENCIAS

Este ajuste debe integrarse con:

```text
Maestro vigente de Delegados
Registro público de asistencia
Registro manual / masivo de asistencia
Motor de quórum
Habilitación de votación
Mensajería al participante
Trazabilidad
Contingencia de documento no encontrado
```

La lógica debe ser única y reutilizada por todos los puntos de entrada.

No debe existir una búsqueda diferente para asistencia y otra para votación que produzcan resultados contradictorios.

---

## CONCLUSIÓN FUNCIONAL

> **En Board Quorum, `CC_MADRE` y `CC_PADRE` de una misma fila deben funcionar como dos identificaciones válidas de un único registro/núcleo familiar. Cualquiera de los dos padres puede activar la representación; el primero que lo haga ocupa la única representación disponible para esa reunión. La segunda identificación debe seguir siendo reconocida, pero no puede generar una representación adicional, incrementar el quórum ni habilitar un segundo voto. “Cédula no encontrada” solo corresponde cuando el documento realmente no existe en el Maestro vigente.**

---

**Fin – Solicitud Quirúrgica / Cambio de Fondo N.º 10**
