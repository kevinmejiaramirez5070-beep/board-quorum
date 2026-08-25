# BOARD QUORUM – ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI

## SOLICITUD QUIRÚRGICA / CONTINGENCIA N.º 09
### Delegado no encontrado por número de identificación – Solicitud, validación y aprobación manual

**Destino:** Andrés – Implementación Board Quorum  
**Prueba:** 25 de agosto de 2026  
**Tipo:** Flujo funcional de contingencia  
**Ámbito:** Registro de asistencia / identidad / quórum / votación

---

## 1. OBJETIVO

Definir qué debe ocurrir cuando una persona que afirma ser Delegado de la Asamblea ingresa su número de identificación en el enlace de asistencia y Board Quorum responde:

```text
IDENTIFICACIÓN NO ENCONTRADA
```

El objetivo es evitar dos riesgos:

```text
1. Que un Delegado válido quede por fuera por un error de datos o búsqueda.
2. Que una persona no validada pueda autodeclararse Delegado y afectar quórum o votación.
```

---

## 2. REGLA GENERAL

> **Si la identificación no es encontrada, Board Quorum debe permitir solicitar validación manual, pero la persona no adquiere automáticamente la calidad de Delegado Principal o Suplente.**

Mientras la solicitud esté pendiente:

```text
NO cuenta para quórum
NO puede votar
NO ocupa una representación
```

---

## 3. FLUJO PÚBLICO ESPERADO

### Paso 1 – Identificación

La persona ingresa:

```text
Número de identificación
```

Si Board Quorum no encuentra coincidencia, debe mostrar una opción equivalente a:

```text
Identificación no encontrada

[Reintentar]
[Solicitar validación]
```

---

## 4. DATOS MÍNIMOS DE LA SOLICITUD

Si la persona selecciona:

```text
SOLICITAR VALIDACIÓN
```

Board Quorum debe pedir como mínimo:

```text
Número de identificación
Apellidos y nombres
Curso
```

### Regla crítica

> **La persona no debe escoger libremente si es Delegado Principal o Delegado Suplente.**

La condición Principal / Suplente debe ser definida únicamente después de la validación realizada desde Board Quorum.

---

## 5. ESTADO DE LA SOLICITUD

Una vez enviados los datos, la solicitud debe quedar en estado:

```text
PENDIENTE DE VALIDACIÓN
```

y ser visible para los usuarios operativos autorizados de Asamblea.

La solicitud pendiente no genera ningún efecto sobre:

```text
Quórum
Voto
Representación
Universo de elegibles
```

---

## 6. REVISIÓN DESDE BOARD QUORUM

Un usuario operativo autorizado debe revisar la solicitud contra:

```text
Maestro vigente de Delegados
Información de curso
Nombre
Número de identificación
Soporte disponible para la Asamblea
```

El objetivo es confirmar si la persona realmente corresponde a un Delegado válido y, de ser así, determinar:

```text
Curso
Rol: PRINCIPAL o SUPLENTE
```

---

## 7. DECISIONES DISPONIBLES

La solicitud debe permitir al usuario autorizado:

```text
APROBAR
RECHAZAR
```

### Si se APRUEBA

Board Quorum debe registrar:

```text
Persona validada
Curso
Rol asignado: PRINCIPAL / SUPLENTE
Usuario que aprobó
Fecha y hora
Motivo / observación de la contingencia
```

A partir de ese momento se aplican las reglas normales de Asamblea.

### Si se RECHAZA

La persona no adquiere condición de Delegado y:

```text
NO cuenta para quórum
NO puede votar
```

Debe quedar trazabilidad del rechazo.

---

## 8. EFECTO DE UNA APROBACIÓN SOBRE QUÓRUM Y VOTO

### Aprobado como PRINCIPAL

```text
Registra asistencia
Cuenta para quórum
Puede votar
Ocupa la representación de su curso
```

### Aprobado como SUPLENTE con Principal AUSENTE

```text
Registra asistencia
Cuenta para quórum
Puede votar
Actúa como Principal
```

### Aprobado como SUPLENTE con Principal PRESENTE

```text
Registra asistencia
NO agrega quórum
NO agrega voto
El Principal conserva la representación
```

### Regla crítica

> **Un mismo curso nunca puede generar más de una representación computable.**

---

## 9. EVITAR DUPLICIDAD DE IDENTIDAD

Si durante la validación se confirma que la persona sí existe en el Maestro pero existe un error, por ejemplo:

```text
Cédula mal digitada
Espacio o formato incorrecto
Dato incompleto
Asociación incorrecta
```

la prioridad debe ser:

```text
CORREGIR / NORMALIZAR EL REGISTRO EXISTENTE
```

y no crear una segunda identidad para la misma persona.

Toda corrección debe quedar trazada.

---

## 10. REGISTRO APROBADO POR CONTINGENCIA

Cuando la aprobación se realice por contingencia, Board Quorum debe dejar evidencia de que la asistencia fue validada manualmente.

Ejemplo conceptual:

```text
REGISTRO MANUAL VALIDADO

Persona: [Nombre]
Identificación: [Número]
Curso: [Curso]
Rol: PRINCIPAL / SUPLENTE
Aprobado por: [Usuario Board Quorum]
Fecha y hora: [...]
Motivo: Identificación no encontrada en flujo público
```

---

## 11. TRAZABILIDAD MÍNIMA

Board Quorum debe conservar:

```text
Datos ingresados por la persona
Fecha y hora de solicitud
Estado inicial: PENDIENTE
Usuario que revisó
Decisión: APROBADO / RECHAZADO
Fecha y hora de decisión
Curso
Rol asignado, cuando aplique
Motivo / observación
Corrección realizada al Maestro, si hubo lugar
```

---

## 12. IMPACTO EN EL REPORTE DE LA ASAMBLEA

Los registros aprobados manualmente deben poder identificarse posteriormente en la trazabilidad o reporte de la Asamblea.

La finalidad es poder diferenciar:

```text
Registro normal por identificación
vs.
Registro aprobado por contingencia
```

sin afectar la presentación general del reporte.

---

## 13. CRITERIOS DE ACEPTACIÓN

La solicitud se considera resuelta cuando:

- [ ] Una identificación no encontrada permite reintentar.
- [ ] Existe una opción visible para solicitar validación.
- [ ] La persona ingresa identificación, apellidos/nombres y curso.
- [ ] La persona no puede autoseleccionarse como Principal o Suplente.
- [ ] La solicitud queda como **PENDIENTE DE VALIDACIÓN**.
- [ ] Una solicitud pendiente no afecta quórum ni votación.
- [ ] Un usuario autorizado puede aprobar o rechazar.
- [ ] Al aprobar, el usuario define curso y rol Principal / Suplente.
- [ ] La aprobación aplica automáticamente la lógica normal de representación.
- [ ] Un curso nunca genera más de una representación.
- [ ] Si existe un registro previo con error, se prioriza corregirlo en lugar de duplicarlo.
- [ ] La decisión queda trazada por usuario, fecha, hora y motivo.
- [ ] El registro aprobado puede identificarse posteriormente como contingencia validada.

---

## 14. RESULTADO FUNCIONAL ESPERADO

El flujo debe quedar conceptualmente así:

```text
IDENTIFICACIÓN
      ↓
¿ENCONTRADA?
 ┌────┴────┐
 SÍ        NO
 ↓          ↓
FLUJO     SOLICITAR
NORMAL    VALIDACIÓN
             ↓
          PENDIENTE
             ↓
       REVISIÓN OPERADOR
          ┌───┴───┐
       APROBAR   RECHAZAR
          ↓         ↓
    ASIGNAR ROL   SIN EFECTO
          ↓
   APLICAR REGLAS
   DE QUÓRUM/VOTO
```

---

## CONCLUSIÓN FUNCIONAL

> **Cuando un Delegado no sea encontrado por número de identificación, Board Quorum debe ofrecer un flujo de contingencia mediante el cual la persona ingrese identificación, apellidos/nombres y curso. La solicitud queda pendiente y no afecta quórum ni votación hasta que un usuario autorizado la valide. Solo después de la aprobación se asigna la condición Principal o Suplente y se aplican las reglas normales de representación, quórum y voto. Todo el proceso debe quedar trazado.**

---

**Fin – Solicitud Quirúrgica / Contingencia N.º 09**
