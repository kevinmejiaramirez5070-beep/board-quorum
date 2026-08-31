# BOARD QUORUM – ASOCOLCI

## SOLICITUD QUIRÚRGICA – EDICIÓN INDIVIDUAL DEL MAESTRO DE DELEGADOS
### Asamblea General de Delegados

**Destino:** Andrés – Implementación Board Quorum  
**Fecha:** 30 de agosto de 2026  
**Tipo:** Ajuste funcional puntual  
**Principio aplicado:** Reutilizar → Adaptar → Construir

---

# 1. OBJETIVO

Permitir la **edición individual de registros del Maestro de Delegados de Asamblea General**, sin necesidad de modificar el archivo Excel completo y volver a cargar todo el Maestro cuando se requiera una corrección puntual.

La solicitud no pretende crear una funcionalidad nueva desde cero.

Board Quorum ya dispone de una funcionalidad de **edición individual de miembros** en la pantalla **Gestión de Miembros**, mediante la acción de edición representada por el ícono de lápiz.

La solicitud es:

> **Reutilizar esa funcionalidad existente y adaptarla al Maestro de Delegados de Asamblea General.**

---

# 2. COMPORTAMIENTO ACTUAL

Actualmente, en el Maestro de Delegados de Asamblea General es posible:

- visualizar los registros;
- identificar Principales y Suplentes;
- visualizar vínculos;
- desactivar registros;
- cargar nuevamente el Maestro mediante archivo `.xlsx`.

Sin embargo, para una corrección puntual no existe una opción visible de:

```text
EDITAR REGISTRO
```

Esto obliga potencialmente a:

```text
corregir Excel
→ volver a cargar Maestro
→ reemplazar base activa
```

aunque la modificación corresponda a un solo Delegado.

---

# 3. COMPORTAMIENTO DE REFERENCIA YA EXISTENTE

En **Gestión de Miembros**, Board Quorum ya permite editar individualmente registros mediante una acción tipo:

```text
✏ EDITAR
```

Por tanto, no se solicita diseñar un flujo distinto.

La referencia funcional es:

```text
Gestión de Miembros
        ↓
seleccionar registro
        ↓
Editar
        ↓
Guardar cambios
```

Ese mismo comportamiento debe adaptarse al Maestro de Delegados.

---

# 4. COMPORTAMIENTO ESPERADO EN ASAMBLEA

Cada registro del Maestro de Delegados debería contar con una acción:

```text
EDITAR
```

Al seleccionarla, el usuario autorizado debe poder modificar la información propia del registro.

Como mínimo, la edición debe contemplar los campos que Board Quorum ya administra en el Maestro, tales como:

```text
Número de identificación
Nombre
Curso
Rol: Principal / Suplente
Vinculación Principal–Suplente, cuando corresponda
```

La edición debe operar sobre el registro seleccionado, sin requerir una nueva carga masiva.

---

# 5. REGLAS QUE DEBEN CONSERVARSE

La edición individual **no puede saltarse las validaciones existentes del Maestro**.

Al guardar un cambio, Board Quorum debe volver a validar el registro y su impacto en la estructura activa.

## 5.1 Documento

No permitir una modificación que genere una duplicidad inválida de identificación.

## 5.2 Curso

Si se modifica el curso, Board Quorum debe recalcular la relación del registro con el curso nuevo.

## 5.3 Principal / Suplente

Si se modifica el rol:

```text
PRINCIPAL ↔ SUPLENTE
```

Board Quorum debe volver a validar:

- existencia de Principal;
- vínculo con Suplente;
- posibles conflictos;
- estructura de representación del curso.

## 5.4 Vínculo Principal–Suplente

Si cambia el vínculo, el Maestro debe reflejar inmediatamente la nueva relación.

No deben generarse vínculos imposibles o inconsistentes.

---

# 6. REGLA DE RECÁLCULO

Después de guardar una edición que afecte la estructura de representación, Board Quorum debe recalcular el estado del Maestro.

Esto incluye, cuando aplique:

```text
Principales
Suplentes
Cursos con Principal
Vínculos rotos
Cursos sin Suplente
```

La edición no debe dejar indicadores desactualizados.

---

# 7. TRAZABILIDAD MÍNIMA

Toda modificación individual debería dejar registro de auditoría.

Como mínimo:

```text
Registro modificado
Campo modificado
Valor anterior
Valor nuevo
Usuario que realizó el cambio
Fecha y hora
```

El objetivo es poder responder posteriormente:

> ¿Quién cambió qué dato, cuándo y desde qué valor?

---

# 8. PERMISOS

La edición solo debe estar disponible para usuarios autorizados.

Como regla general:

```text
Usuario autorizado
→ puede editar

Usuario no autorizado
→ solo consulta
```

La restricción por organización debe mantenerse.

Un usuario limitado a ASOCOLCI no puede editar registros de otras organizaciones.

---

# 9. RELACIÓN CON LA CARGA MASIVA

Esta solicitud **no reemplaza** la carga por Excel.

Ambas funcionalidades deben coexistir:

```text
CARGA XLSX
→ actualización masiva / reemplazo del Maestro

EDITAR
→ corrección puntual de un registro
```

No debe ser necesario recargar todo el Maestro para corregir un dato individual.

---

# 10. ELIMINACIÓN VS DESACTIVACIÓN

No se solicita incorporar borrado físico de Delegados.

Board Quorum ya dispone de la opción:

```text
DESACTIVAR
```

Por trazabilidad y control, se recomienda conservar:

```text
EDITAR + DESACTIVAR
```

y evitar eliminación física del registro.

---

# 11. CASOS DE PRUEBA

## CP-01 – Editar nombre

Cambiar el nombre de un Delegado.

Esperado:

```text
se guarda el nuevo nombre
no cambia el curso
no cambia el rol
no cambia el quórum estructural
queda trazabilidad
```

## CP-02 – Editar identificación

Modificar número de documento.

Esperado:

```text
se valida duplicidad
si es válido, guarda
si genera conflicto, bloquea
```

## CP-03 – Cambiar curso

Mover un Delegado a otro curso.

Esperado:

```text
recalcula la estructura
actualiza vínculos
actualiza indicadores del Maestro
```

## CP-04 – Cambiar Principal a Suplente

Esperado:

```text
Board Quorum valida si el curso queda sin Principal
actualiza el vínculo
actualiza indicadores
```

## CP-05 – Cambiar Suplente a Principal

Esperado:

```text
Board Quorum valida que no genere dos Principales activos
si existe conflicto, bloquea o solicita resolverlo
```

## CP-06 – Editar vínculo

Modificar el Principal asociado a un Suplente.

Esperado:

```text
nuevo vínculo válido
Maestro actualizado
sin vínculos rotos no justificados
```

---

# 12. CRITERIOS DE ACEPTACIÓN

- [ ] Cada registro del Maestro tiene una opción visible de **Editar**.
- [ ] La edición reutiliza, en lo posible, el patrón ya existente en Gestión de Miembros.
- [ ] Se puede corregir un registro sin recargar todo el Excel.
- [ ] Se pueden editar los campos permitidos del registro.
- [ ] Board Quorum valida duplicidades antes de guardar.
- [ ] Board Quorum valida conflictos Principal/Suplente.
- [ ] Si cambia curso, rol o vínculo, el Maestro se recalcula.
- [ ] Los indicadores superiores del Maestro quedan actualizados.
- [ ] La modificación queda trazable.
- [ ] La carga masiva `.xlsx` continúa funcionando.
- [ ] La opción **Desactivar** continúa disponible.
- [ ] No se requiere borrado físico.
- [ ] Solo usuarios autorizados pueden editar.
- [ ] Se conserva la restricción por organización.

---

# 13. RESULTADO ESPERADO

El usuario autorizado debe poder realizar:

```text
Maestro de Delegados
→ seleccionar Delegado
→ Editar
→ modificar dato
→ Guardar
→ validar
→ recalcular
→ registrar trazabilidad
```

sin necesidad de:

```text
editar Excel completo
→ recargar Maestro completo
```

para una corrección puntual.

---

# CONCLUSIÓN FUNCIONAL

> **La solicitud consiste en reutilizar la funcionalidad de edición individual que Board Quorum ya tiene en Gestión de Miembros y adaptarla al Maestro de Delegados de Asamblea General. La edición debe permitir correcciones puntuales, conservar las validaciones del Maestro, recalcular la estructura cuando corresponda y dejar trazabilidad del cambio. La carga masiva por Excel debe mantenerse como mecanismo independiente para actualizaciones masivas.**

---

**Fin de la solicitud**
