# BOARD QUORUM – ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI

## SOLICITUD QUIRÚRGICA / CAMBIO DE FONDO N.º 02  
### Activación, control y trazabilidad del “Momento Siguiente”

**Destino:** Andrés – Implementación Board Quorum  
**Tipo:** Ajuste funcional de fondo  
**Prueba asociada:** TEST ASAMBLEA NRO. 1

---

## 1. OBJETIVO

Andrés:

En la prueba de Asamblea identificamos que Board Quorum debe distinguir de forma expresa entre:

- **Quórum inicial**
- **Momento Siguiente**

No basta con cambiar automáticamente el número mínimo requerido. El sistema debe saber **en qué estado se encuentra la Asamblea**, quién produjo la transición y cuándo ocurrió.

La necesidad funcional es incorporar un mecanismo visible, controlado y auditable para pasar al estado **Momento Siguiente** cuando corresponda.

---

## 2. CUÁNDO APLICA

La Asamblea tiene una hora oficial de inicio definida en la convocatoria.

Para la Asamblea del 26 de agosto de 2026:

```text
Registro:       5:30 p. m.
Hora de inicio: 6:00 p. m.
```

Si llegada la hora oficial de inicio no se alcanza el quórum inicial, Board Quorum debe permitir aplicar el régimen de **Momento Siguiente**.

Antes de esa hora puede registrarse asistencia y visualizarse el avance del quórum, pero el sistema continúa bajo la regla de quórum inicial.

---

## 3. BOTÓN VISIBLE

Board Quorum debe incorporar dentro de la reunión una acción claramente visible, por ejemplo:

```text
APLICAR MOMENTO SIGUIENTE
```

La acción no debe ocurrir de forma silenciosa u oculta.

La finalidad es que quede identificable el momento en que la Asamblea deja de evaluarse bajo el quórum inicial y pasa al régimen de **Momento Siguiente**.

No se está imponiendo un diseño gráfico específico; la exigencia funcional es que exista una **acción visible, controlada y auditable**.

---

## 4. USUARIO AUTORIZADO

La acción:

```text
APLICAR MOMENTO SIGUIENTE
```

debe estar habilitada para el perfil de **Revisoría Fiscal**.

Los usuarios de Administración pueden apoyar la operación general de la Asamblea y visualizar el quórum, pero no deben ejecutar esta acción.

La matriz completa de usuarios y permisos se documentará en el **MD N.º 03**.

---

## 5. QUÉ DEBE OCURRIR AL ACTIVARLO

Board Quorum debe mantener el mismo universo de elegibles definido para la Asamblea.

Lo único que cambia es el mínimo requerido.

Ejemplo con la muestra actual:

```text
Elegibles:       20
Quórum inicial:  11
```

Al aplicar Momento Siguiente:

```text
Elegibles:                   20
Mínimo Momento Siguiente:     4
```

Regla:

```text
momento_siguiente = CEIL(N × 20 %)
```

donde:

```text
N = universo de posiciones de representación habilitadas
```

### Regla crítica

> El universo de elegibles NO cambia.  
> Cambia únicamente la regla porcentual aplicable.

Los valores no deben quedar fijos en código.

---

## 6. EL BOTÓN NO INICIA UNA NUEVA HORA

Este punto es crítico.

Si la Asamblea fue convocada para las:

```text
6:00 p. m.
```

la ventana del Momento Siguiente termina a las:

```text
7:00 p. m.
```

Si Revisoría Fiscal ejecuta la acción a las 6:05 p. m., 6:10 p. m. o 6:20 p. m., Board Quorum **no puede contar una nueva hora desde el clic**.

El clic únicamente registra que dentro del sistema se ha aplicado el estado **Momento Siguiente**.

La hora límite continúa ligada a la hora oficial fijada en la convocatoria.

---

## 7. INFORMACIÓN VISIBLE DURANTE MOMENTO SIGUIENTE

Una vez aplicada la acción, Board Quorum debe mostrar de forma clara algo equivalente a:

```text
ESTADO: MOMENTO SIGUIENTE
```

y permitir identificar como mínimo:

```text
Elegibles
Representaciones presentes
Mínimo requerido actual
Porcentaje actual
Hora oficial de inicio
Hora límite del Momento Siguiente
Estado: alcanzado / no alcanzado
```

El usuario no debe limitarse a ver que el mínimo cambió.

Debe poder entender claramente **por qué cambió la regla aplicable**.

---

## 8. TRAZABILIDAD OBLIGATORIA

Cuando Revisoría Fiscal ejecute:

```text
APLICAR MOMENTO SIGUIENTE
```

Board Quorum debe registrar como mínimo:

```text
Acción realizada
Usuario que ejecutó la acción
Fecha y hora de ejecución
Hora oficial convocada
Número de elegibles
Representaciones presentes en ese momento
Quórum inicial requerido
Nuevo mínimo requerido – 20 %
Hora límite del Momento Siguiente
```

La actuación debe poder reconstruirse posteriormente de manera objetiva.

---

## 9. TRAZABILIDAD EN EL PDF FINAL DE LA ASAMBLEA

La evidencia del Momento Siguiente debe quedar obligatoriamente reflejada en el **PDF final del reporte de la Asamblea**.

No basta con guardar la información en la base de datos.

El PDF debe permitir identificar, como mínimo:

```text
MOMENTO SIGUIENTE

Hora convocada
Usuario de Revisoría Fiscal que aplicó la acción
Fecha y hora de aplicación
Número de elegibles
Quórum inicial requerido
Representaciones presentes al momento del cambio
Mínimo requerido del Momento Siguiente
Hora límite
Resultado final: alcanzado / no alcanzado
Hora exacta del resultado
```

Ejemplo conceptual:

```text
MOMENTO SIGUIENTE

Hora convocada:                         6:00 p. m.
Aplicado por:                           Revisoría Fiscal – [usuario]
Hora de aplicación:                     6:04 p. m.
Elegibles:                              83
Quórum inicial requerido:               42
Presentes al momento de aplicación:     35
Mínimo Momento Siguiente:               17
Hora límite:                            7:00 p. m.
```

---

## 10. SI SE ALCANZA EL 20 %

En cuanto las representaciones presentes alcancen el mínimo requerido dentro de la ventana aplicable, Board Quorum debe registrar automáticamente:

```text
QUÓRUM DE MOMENTO SIGUIENTE ALCANZADO
```

y guardar la fecha y hora exactas en que ocurrió.

Esta información debe quedar también en el PDF final de la Asamblea.

### Importante

```text
Quórum alcanzado ≠ Asamblea instalada
```

Son hechos funcionalmente distintos y no deben confundirse.

---

## 11. SI VENCE LA HORA SIN ALCANZAR EL MÍNIMO

Si se alcanza la hora límite sin obtener el 20 %, Board Quorum debe registrar:

```text
MOMENTO SIGUIENTE FINALIZADO – QUÓRUM NO ALCANZADO
```

y conservar la evidencia correspondiente.

La lógica de **Segunda Convocatoria** queda fuera del alcance de este MD y debe tratarse por separado.

---

## 12. CRITERIOS DE ACEPTACIÓN

La solicitud se considera resuelta cuando:

- [ ] Existe una acción visible para **Aplicar Momento Siguiente**.
- [ ] La acción está disponible para el perfil de Revisoría Fiscal.
- [ ] Al ejecutarla, el universo de elegibles permanece igual.
- [ ] El mínimo requerido cambia dinámicamente al 20 %.
- [ ] La hora límite se calcula desde la hora oficial de convocatoria, no desde el clic.
- [ ] Board Quorum muestra claramente que la reunión está en estado **Momento Siguiente**.
- [ ] Se registra usuario, fecha, hora, elegibles, presentes, mínimo inicial, nuevo mínimo y hora límite.
- [ ] Si se alcanza el 20 %, queda registrada la hora exacta.
- [ ] Si vence la ventana sin alcanzar el mínimo, queda registrado el cierre por falta de quórum.
- [ ] Toda la trazabilidad relevante aparece en el **PDF final de la Asamblea**.
- [ ] Los valores de quórum no quedan hardcodeados.

---

## CONCLUSIÓN FUNCIONAL

> **Board Quorum debe incorporar una acción visible “Aplicar Momento Siguiente”, habilitada para el perfil de Revisoría Fiscal cuando, llegada la hora oficial de inicio, no se haya alcanzado el quórum inicial. Su ejecución mantiene el mismo universo de elegibles y cambia el mínimo requerido al 20 %. La ventana temporal permanece vinculada a la hora original de convocatoria. La acción, el usuario que la ejecutó, los valores de quórum, las fechas y horas y el resultado posterior deben quedar trazados en Board Quorum y reflejados obligatoriamente en el PDF final de la Asamblea.**

---

**Fin – Solicitud Quirúrgica / Cambio de Fondo N.º 02**
