# BOARD QUORUM – ASOCOLCI
## 01 – AJUSTE FINAL | GESTIÓN DE MIEMBROS

**Destino:** Andrés – Implementación Board Quorum  
**Fecha:** 8 de septiembre de 2026  
**Tipo:** Ajuste funcional final y puntual  
**Principio:** Reutilizar → Adaptar → Construir

---

# 1. OBJETIVO

Ajustar el formulario **Gestión de Miembros → Editar Miembro** para que los campos disponibles sean coherentes con el órgano seleccionado y para evitar que estados que dependen de cada reunión queden guardados como atributos manuales permanentes del miembro.

> **No se solicita rehacer Gestión de Miembros.**

La separación por órgano ya existe y debe conservarse:

```text
Asamblea General (140)
Junta Directiva (22)
```

Este comportamiento actual se considera correcto.

---

# 2. HALLAZGO

Actualmente, al editar un miembro, el formulario permite manejar campos como:

```text
Órgano de Gobierno
Tipo de Documento
Número de Documento
Nombre
Rol Orgánico
Cargo Funcional
Tipo de Participante
Rol en Votación
Cuenta para Quórum
Puede Votar
```

La edición de datos estructurales es correcta.

El punto a ajustar es que algunos campos representan **estados dinámicos de una reunión**, no características permanentes del miembro.

En particular:

```text
Rol en Votación = Suplente Actuando
Cuenta para Quórum
Puede Votar
```

---

# 3. PRINCIPIO FUNCIONAL

Board Quorum debe distinguir:

```text
DATO ESTRUCTURAL DEL MIEMBRO
```

de:

```text
ESTADO DINÁMICO EN UNA REUNIÓN
```

Ejemplo:

```text
Tipo de Participante = Suplente
```

es un dato estructural.

En cambio:

```text
Suplente Actuando
Cuenta para Quórum
Puede Votar
```

pueden cambiar según:

```text
órgano
reunión
asistencia
presencia o ausencia del Principal
representación efectiva
```

y, por tanto, deben ser resueltos por el motor de Board Quorum durante cada reunión.

---

# 4. ASAMBLEA GENERAL

Cuando:

```text
Órgano de Gobierno = Asamblea General
```

el formulario debe permitir editar los datos estructurales propios del Delegado, por ejemplo:

```text
Tipo de Documento
Número de Documento
Nombre
Curso / Rol Orgánico
Tipo de Participante = Principal / Suplente
```

La condición de Principal o Suplente es estructural.

Sin embargo, Board Quorum debe determinar en cada reunión:

```text
quién ejerce la representación
quién cuenta para quórum
quién puede votar
si un Suplente está actuando como Principal
```

## Regla dinámica

```text
Principal presente
→ Principal ejerce representación
→ cuenta para quórum
→ puede votar

Principal ausente + Suplente presente
→ Suplente actúa
→ cuenta para quórum
→ puede votar

Principal presente + Suplente presente
→ Suplente puede registrar asistencia
→ no genera representación adicional
→ no puede ejercer un segundo voto
```

Por lo anterior, en Asamblea General no deberían quedar como parámetros manuales permanentes:

```text
Cuenta para Quórum
Puede Votar
Suplente Actuando
```

---

# 5. JUNTA DIRECTIVA

Cuando:

```text
Órgano de Gobierno = Junta Directiva
```

el formulario sí debe permitir editar datos estructurales propios de Junta Directiva, tales como:

```text
Nombre
Documento
Rol Orgánico
Cargo Funcional
Condición Principal / Suplente
Junta de Vigilancia
Revisoría Fiscal / otros perfiles aplicables
```

Los cargos estructurales pueden incluir, según la configuración vigente:

```text
Presidente
Vicepresidente
Secretaría Principal / Suplente
Tesorería Principal / Suplente
Fiscalía Principal / Suplente
Vocal Principal / Suplente
Junta de Vigilancia
Revisor Fiscal
Contadora
```

Sin embargo, la condición:

```text
Suplente Actuando
```

también debe resolverse según la reunión y la presencia o ausencia del Principal.

De igual forma, **Cuenta para Quórum** y **Puede Votar** no deberían utilizarse como una forma manual de alterar las reglas del órgano cuando Board Quorum ya debe resolverlas por rol y asistencia.

---

# 6. COMPORTAMIENTO ESPERADO DEL FORMULARIO

La edición debe ser contextual.

## Si el órgano es Asamblea General

Mostrar únicamente los campos que aplican al Delegado de Asamblea.

No mostrar o no permitir editar manualmente campos de cargos propios de Junta Directiva que no correspondan.

## Si el órgano es Junta Directiva

Mostrar los campos y cargos propios de Junta Directiva.

No mezclar campos sin aplicación al órgano seleccionado.

---

# 7. IMPORTANTE – NO ALTERAR EL MOTOR YA VALIDADO

Este ajuste no debe modificar las reglas de quórum y votación que ya vienen funcionando.

En particular, para Asamblea General ASOCOLCI:

```text
Universo = 85
Quórum inicial = 44
Momento Siguiente = 17
```

La habilitación efectiva de una persona dentro de una reunión debe seguir dependiendo del motor de representación y asistencia.

---

# 8. CRITERIOS DE ACEPTACIÓN

- [ ] Se mantiene la separación actual `Asamblea General (140)` / `Junta Directiva (22)`.
- [ ] El botón **Editar** continúa disponible.
- [ ] Se pueden corregir datos estructurales del miembro.
- [ ] El formulario adapta sus campos al órgano seleccionado.
- [ ] Asamblea no muestra cargos propios de Junta Directiva cuando no aplican.
- [ ] Junta Directiva muestra únicamente los campos/cargos aplicables.
- [ ] `Suplente Actuando` no queda como una condición manual permanente.
- [ ] `Cuenta para Quórum` no permite alterar manualmente el resultado que corresponde calcular al motor.
- [ ] `Puede Votar` no permite alterar manualmente el derecho derivado de rol, representación y asistencia.
- [ ] Las reglas ya validadas de Principal/Suplente continúan funcionando.
- [ ] Los cambios de datos estructurales no rompen la lógica de quórum ni votación.

---

# 9. RESULTADO ESPERADO

```text
GESTIÓN DE MIEMBROS
        ↓
seleccionar órgano
        ↓
seleccionar miembro
        ↓
Editar
        ↓
mostrar únicamente datos estructurales aplicables
        ↓
Guardar
```

Durante la reunión:

```text
asistencia + rol + representación
        ↓
motor Board Quorum
        ↓
cuenta para quórum / puede votar / suplente actuando
```

---

# CONCLUSIÓN

> **La separación de miembros entre Asamblea General y Junta Directiva ya existe y debe conservarse. El ajuste solicitado se limita a hacer contextual el formulario “Editar Miembro” y a separar los datos estructurales del miembro de los estados dinámicos que Board Quorum debe calcular en cada reunión.**

---

**Fin de la solicitud**
