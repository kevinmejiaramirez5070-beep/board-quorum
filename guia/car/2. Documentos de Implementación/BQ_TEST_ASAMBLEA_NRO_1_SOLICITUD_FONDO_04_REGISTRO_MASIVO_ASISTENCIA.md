# BOARD QUORUM – ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI

## SOLICITUD QUIRÚRGICA / CAMBIO DE FONDO N.º 04
### Reutilización y adaptación del registro masivo de asistencia para Asamblea

**Destino:** Andrés – Implementación Board Quorum  
**Tipo:** Reutilización / adaptación de funcionalidad existente  
**Prueba asociada:** TEST ASAMBLEA NRO. 1  
**Referencia previa:** MD-02 – Registro masivo de asistencia, entregado para Junta Directiva

---

## 1. OBJETIVO

Andrés:

Durante la prueba de `TEST ASAMBLEA NRO 1` observamos que en la pantalla de registro manual de asistencia ya aparece la opción:

```text
REGISTRO MASIVO
```

Esta funcionalidad coincide con la mejora previamente solicitada para Junta Directiva mediante el **MD-02 – Registro masivo de asistencia**.

Por lo tanto, para Asamblea la primera instrucción no es construir una nueva solución.

La regla del proyecto es:

```text
REUTILIZAR → ADAPTAR → CONSTRUIR
```

La solicitud es **reutilizar el registro masivo ya existente y validar/adaptar únicamente lo necesario para que respete la lógica propia de Asamblea**.

---

## 2. FUNCIONALIDAD QUE SE ESPERA REUTILIZAR

El registro masivo debe permitir que un usuario autorizado pueda registrar asistencia de varios participantes en una sola operación.

Como mínimo, debe permitir:

```text
Seleccionar varios Delegados
Seleccionar todos
Deseleccionar todos
Registrar en una sola operación a los seleccionados
```

La finalidad es evitar el registro individual repetitivo cuando una parte importante de los Delegados ya se encuentra presente.

---

## 3. DIFERENCIA CLAVE ENTRE JUNTA DIRECTIVA Y ASAMBLEA

La interfaz de registro masivo puede ser reutilizada.

Sin embargo, en Asamblea debe respetarse la lógica definida para:

```text
Principal
Suplente
Curso representado
Representación computable para quórum
```

### Regla crítica

> **Registrar varias personas como asistentes NO significa que todas deban sumar individualmente para quórum.**

Board Quorum debe separar:

```text
Asistencias registradas
≠
Representaciones computables para quórum
```

---

## 4. COMPORTAMIENTO ESPERADO PRINCIPAL / SUPLENTE

Para cada curso:

| Situación | Asistentes registrados | Representaciones para quórum |
|---|---:|---:|
| Solo Principal presente | 1 | 1 |
| Solo Suplente presente y Principal ausente | 1 | 1 |
| Principal + Suplente presentes | 2 | 1 |
| Ninguno presente | 0 | 0 |

### Ejemplo

Si mediante registro masivo se seleccionan simultáneamente:

```text
Principal – Jardín C
Suplente – Jardín C
```

Board Quorum debe registrar:

```text
Asistentes: 2
Representaciones computables: 1
Representante con voto/quórum: Principal
```

El Suplente queda como asistente, pero no genera una segunda posición de quórum.

---

## 5. SUPLENTE SIN PRINCIPAL PRESENTE

Si mediante registro masivo se selecciona:

```text
Suplente – Prejardín A
```

y el Principal de Prejardín A no está presente:

Board Quorum debe registrar:

```text
Asistentes: 1
Representaciones computables: 1
Curso representado: PREJARDÍN A
Actúa como Principal: Sí
```

La condición de Suplente no debe impedir que el curso cuente para quórum cuando corresponde la sustitución.

---

## 6. SI POSTERIORMENTE INGRESA EL PRINCIPAL

Si inicialmente fue registrado el Suplente porque el Principal estaba ausente y posteriormente ingresa el Principal:

Board Quorum debe mantener:

```text
Representaciones del curso: 1
```

y actualizar quién ejerce la representación:

```text
Principal pasa a ejercer la representación
Suplente deja de actuar como Principal
```

El número total de representaciones para quórum no debe aumentar por este cambio.

---

## 7. NO MODIFICAR LA LÓGICA DE NEGOCIO POR EL HECHO DE SER MASIVO

El registro masivo debe ser únicamente una forma más eficiente de ejecutar el mismo proceso de asistencia.

No debe introducir una lógica paralela.

En términos funcionales:

```text
Registro individual
y
Registro masivo
```

deben producir exactamente el mismo resultado final para:

```text
Asistencia
Quórum
Principal / Suplente
Curso representado
Trazabilidad
```

La única diferencia debe ser la forma de selección y envío de los registros.

---

## 8. TRAZABILIDAD

Cuando se utilice registro masivo, Board Quorum debe conservar evidencia suficiente para identificar:

```text
Usuario que realizó el registro
Fecha y hora
Reunión
Delegados seleccionados
Resultado individual de cada registro
```

La operación puede ejecutarse en bloque, pero cada asistencia debe quedar individualmente identificable en el reporte y en la trazabilidad de la reunión.

---

## 9. COMPORTAMIENTO ESPERADO DE LA INTERFAZ

Sin imponer un diseño técnico específico, se espera una experiencia equivalente a:

```text
[ ] Delegado 1 – Curso – Rol
[ ] Delegado 2 – Curso – Rol
[ ] Delegado 3 – Curso – Rol

[Seleccionar todos]
[Deseleccionar todos]

[Registrar asistencia]
```

Para Asamblea es recomendable que el listado permita visualizar, además del nombre:

```text
Curso
Rol: Principal / Suplente
```

porque estos campos son relevantes para comprobar el efecto sobre quórum.

---

## 10. CRITERIOS DE ACEPTACIÓN

La solicitud se considera resuelta cuando:

- [ ] El botón / función **Registro masivo** puede reutilizarse en Asamblea.
- [ ] Permite seleccionar varios Delegados.
- [ ] Permite seleccionar todos.
- [ ] Permite deseleccionar todos.
- [ ] Permite registrar todos los seleccionados en una sola operación.
- [ ] El registro masivo conserva la misma lógica de asistencia del registro individual.
- [ ] Principal + Suplente del mismo curso pueden quedar registrados como asistentes, pero generan máximo una representación para quórum.
- [ ] Si únicamente está presente el Suplente y el Principal está ausente, el curso puede quedar representado por el Suplente.
- [ ] Si posteriormente ingresa el Principal, la representación continúa siendo una sola.
- [ ] El resultado de quórum se actualiza correctamente después de un registro masivo.
- [ ] Cada asistencia permanece individualmente trazable.
- [ ] La operación queda asociada al usuario que ejecutó el registro y a la fecha/hora.
- [ ] No se crea una segunda lógica de negocio diferente para el modo masivo.

---

## 11. RESULTADO ESPERADO DE LA REVISIÓN TÉCNICA

Antes de desarrollar algo nuevo, por favor validar:

```text
1. Si el Registro masivo que ya aparece en Board Quorum está reutilizando
   la funcionalidad desarrollada para Junta Directiva.

2. Si puede habilitarse directamente para Asamblea.

3. Si actualmente el procesamiento masivo respeta la lógica
   Principal / Suplente / curso representado.

4. Qué adaptación mínima se requiere, en caso de ser necesaria.
```

Si el componente ya soporta correctamente esta lógica, no se requiere una construcción adicional.

---

## CONCLUSIÓN FUNCIONAL

> **Para Asamblea debe reutilizarse el Registro masivo de asistencia ya existente en Board Quorum. La funcionalidad debe permitir seleccionar y registrar varios Delegados en una sola operación, pero el procesamiento posterior debe respetar exactamente la lógica de Asamblea: un curso genera máximo una representación para quórum; el Principal prevalece cuando está presente y el Suplente puede asumir la representación cuando el Principal está ausente. El registro masivo debe cambiar la eficiencia de la operación, no las reglas de negocio.**

---

**Fin – Solicitud Quirúrgica / Cambio de Fondo N.º 04**
