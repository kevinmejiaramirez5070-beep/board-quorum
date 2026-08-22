# BOARD QUORUM – ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI

## SOLICITUD QUIRÚRGICA / REVISIÓN DE FONDO N.º 05
### Identidad de la persona, roles por órgano y tipos de participante en Asamblea

**Destino:** Andrés – Implementación Board Quorum  
**Tipo:** Revisión funcional de identidad, roles y participación  
**Prueba asociada:** TEST ASAMBLEA NRO. 1

---

## 1. OBJETIVO

Andrés:

Durante las pruebas de Asamblea identificamos la necesidad de dejar completamente separadas estas tres cosas:

```text
1. La identidad de la persona
2. El rol que tiene en cada órgano
3. La condición con la que participa en una Asamblea determinada
```

La finalidad de esta revisión es evitar que una misma persona sea interpretada de forma incorrecta por Board Quorum cuando pertenece simultáneamente a Junta Directiva y Asamblea, o cuando participa en Asamblea sin ser Delegado.

---

## 2. REGLA CENTRAL DE IDENTIDAD

La identificación de la persona debe ser única.

Conceptualmente:

```text
CÉDULA = PERSONA
```

Una misma persona puede tener diferentes roles según el órgano en el que actúa.

Ejemplo:

```text
Persona: Juan Pérez
Cédula: 123456789

En Junta Directiva:
Cargo = Tesorero

En Asamblea:
Rol = Delegado Principal – Quinto A
```

Para efectos de una reunión de Asamblea, Board Quorum debe aplicar exclusivamente la condición que esa persona tenga dentro de Asamblea.

El cargo que tenga en Junta Directiva no debe modificar:

```text
Quórum de Asamblea
Derecho a voto en Asamblea
Curso representado
Condición Principal / Suplente
```

---

## 3. REGLA DE ROLES POR ÓRGANO

Board Quorum debe manejar conceptualmente:

```text
PERSONA
   +
ÓRGANO
   +
ROL EN ESE ÓRGANO
```

Ejemplos:

```text
Persona A
 ├── Junta Directiva → Presidente
 └── Asamblea → Delegado Principal – Curso X

Persona B
 ├── Junta Directiva → Secretario
 └── Asamblea → Delegado Suplente – Curso Y
```

La misma persona no debe duplicarse conceptualmente como dos identidades distintas.

Puede tener varias vinculaciones, pero la identidad sigue siendo una.

---

## 4. TIPOS DE PARTICIPANTE EN ASAMBLEA

Para Asamblea deben contemplarse al menos las siguientes categorías:

```text
DELEGADO PRINCIPAL
DELEGADO SUPLENTE
ADMINISTRACIÓN
CONTABILIDAD
REVISORÍA FISCAL
```

Estas categorías no tienen el mismo efecto sobre quórum y voto.

---

## 5. REGLAS DE QUÓRUM Y VOTO POR TIPO DE PARTICIPANTE

| Tipo de participante | Registra asistencia | Cuenta para quórum | Puede votar |
|---|:---:|:---:|:---:|
| Delegado Principal habilitado | Sí | Sí | Sí |
| Delegado Suplente con Principal ausente | Sí | Sí | Sí |
| Delegado Suplente con Principal presente | Sí | No | No |
| Administración | Sí | No | No |
| Contabilidad | Sí | No | No |
| Revisoría Fiscal | Sí | No | No |

### Regla crítica

> **Contabilidad, Revisoría Fiscal y Administración pueden estar presentes y quedar registrados en la Asamblea, pero no generan posición de representación, no incrementan el universo de elegibles, no cuentan para quórum y no tienen voto por esa condición.**

---

## 6. VALIDACIÓN DE DELEGADOS CONTRA LA BASE VIGENTE

La calidad de:

```text
Delegado Principal
o
Delegado Suplente
```

debe provenir de la base vigente de Delegados cargada para la Asamblea.

No debe derivarse de:

```text
El cargo que la persona tenga en Junta Directiva
Su existencia como miembro general de Board Quorum
Una selección libre realizada por el participante
```

### Regla funcional

> **Una persona solo puede ser tratada como Delegado Principal o Suplente cuando exista soporte en el maestro vigente de Delegados de Asamblea.**

Board Quorum debe validar, como mínimo:

```text
Número de identificación
Nombre
Curso
Rol: Principal / Suplente
Condición vigente / habilitada
Relación Principal – Suplente del curso
```

---

## 7. FLUJO NORMAL DEL ENLACE DE ASISTENCIA

### Paso 1

La persona ingresa:

```text
Número de identificación
```

### Paso 2

Si la identificación existe en la base vigente de Delegados, Board Quorum debe identificar automáticamente:

```text
Apellidos y nombres
Curso
Rol: Principal o Suplente
```

### Regla

> **El participante no debe escoger libremente si es Principal o Suplente.**

Esa condición debe provenir de la base cargada.

Ejemplo:

```text
Identificación: 123456789
Nombre: María Pérez Gómez
Curso: 5A
Tipo de participante: DELEGADO PRINCIPAL
```

---

## 8. PARTICIPANTES QUE NO SON DELEGADOS

Cuando se trate de participantes no Delegados, Board Quorum debe permitir registrar:

```text
Número de identificación
Apellidos
Nombres
Tipo de participante
```

Las categorías disponibles para este caso serán:

```text
ADMINISTRACIÓN
CONTABILIDAD
REVISORÍA FISCAL
```

Para las tres categorías:

```text
Cuenta para quórum: NO
Puede votar: NO
```

---

## 9. EXCEPCIÓN – REGISTRO MANUAL POR CONTINGENCIA

Puede existir un caso en el que una persona sí sea Delegado, pero Board Quorum no la encuentre correctamente por:

```text
Error de identificación
Error de carga
Error de asociación
Problema de formato
Inconsistencia del registro
Otra contingencia operativa
```

En ese caso, un usuario operativo autorizado de Board Quorum podrá realizar el registro manual.

### Regla crítica

> **El registro manual es una contingencia. No puede utilizarse para convertir en Delegado a una persona que no tenga soporte como tal.**

Antes del registro manual debe verificarse la condición real de la persona.

---

## 10. OPCIONES DISPONIBLES EN REGISTRO MANUAL

Para el usuario operativo autorizado, el registro manual puede permitir seleccionar:

```text
DELEGADO PRINCIPAL
DELEGADO SUPLENTE
ADMINISTRACIÓN
CONTABILIDAD
REVISORÍA FISCAL
```

Pero cuando se seleccione Principal o Suplente debe existir soporte en la base de Delegados o evidencia válida que permita corregir la contingencia.

---

## 11. TRAZABILIDAD DEL REGISTRO MANUAL

Cuando un usuario de Board Quorum realice un registro manual, debe quedar evidencia suficiente para identificar:

```text
Usuario que realizó el registro
Fecha y hora
Persona registrada
Número de identificación
Curso, cuando aplique
Tipo de participante asignado
Motivo del registro manual
Reunión / Asamblea
```

La actuación debe poder revisarse posteriormente.

---

## 12. CASO ESPECIAL – PERSONA QUE PERTENECE A JUNTA Y ASAMBLEA

Si una persona es miembro de Junta Directiva y también Delegado:

```text
La identidad es la misma
Los roles son diferentes
El comportamiento depende del órgano
```

Ejemplo:

```text
Persona: [misma cédula]

Junta Directiva:
Cargo = Vicepresidente

Asamblea:
Rol = Delegado Suplente – Curso 7B
```

En una reunión de Asamblea:

```text
Board Quorum debe evaluar únicamente:
Delegado Suplente – Curso 7B
```

Su cargo de Vicepresidente no debe producir ningún efecto adicional en:

```text
Quórum
Voto
Representación
```

---

## 13. RELACIÓN CON EL UNIVERSO DE ELEGIBLES

La existencia de participantes adicionales como:

```text
Administración
Contabilidad
Revisoría Fiscal
```

no debe aumentar el universo de elegibles para quórum.

Ejemplo:

```text
20 Principales
20 Suplentes
1 Contabilidad
1 Revisoría Fiscal
1 Administración
```

No significa:

```text
43 elegibles
```

El universo de quórum continúa determinado por las posiciones de representación habilitadas conforme a la lógica definida en el MD N.º 01.

---

## 14. CRITERIOS DE ACEPTACIÓN

La revisión se considera resuelta cuando:

- [ ] Una misma cédula puede tener roles distintos según el órgano.
- [ ] El rol de Junta Directiva no altera el rol de Asamblea.
- [ ] Principal / Suplente se determina desde la base vigente de Delegados.
- [ ] El participante no puede autodeclararse libremente Principal o Suplente desde el enlace público.
- [ ] Administración puede registrarse como participante no computable.
- [ ] Contabilidad puede registrarse como participante no computable.
- [ ] Revisoría Fiscal puede registrarse como participante no computable.
- [ ] Administración, Contabilidad y Revisoría Fiscal no incrementan el universo de elegibles.
- [ ] Administración, Contabilidad y Revisoría Fiscal no cuentan para quórum.
- [ ] Administración, Contabilidad y Revisoría Fiscal no votan por esa condición.
- [ ] Existe una vía de registro manual para contingencias.
- [ ] El registro manual de Principal / Suplente exige soporte en la base o evidencia válida.
- [ ] Todo registro manual queda trazado por usuario, fecha, hora, persona, tipo y motivo.
- [ ] La implementación evita duplicar conceptualmente a una misma persona por pertenecer a más de un órgano.

---

## 15. RESULTADO ESPERADO DE LA REVISIÓN TÉCNICA

Antes de construir algo nuevo, por favor revisar cómo está modelado actualmente Board Quorum y confirmar:

```text
1. Si la identidad de una persona se maneja de forma única.

2. Cómo se relaciona una misma persona con Junta Directiva y Asamblea.

3. Si el rol se almacena por órgano/producto o directamente sobre la persona.

4. Si Contabilidad y Revisoría Fiscal, que ya aparecen en Asamblea,
   están correctamente excluidas del universo de quórum y voto.

5. Si Administración puede incorporarse como tipo de participante
   no computable.

6. Si el flujo público de asistencia puede identificar automáticamente
   Principal / Suplente desde el maestro de Delegados.

7. Si existe o puede reutilizarse un registro manual controlado
   para resolver contingencias.
```

Aplicar siempre:

```text
REUTILIZAR → ADAPTAR → CONSTRUIR
```

---

## CONCLUSIÓN FUNCIONAL

> **Board Quorum debe separar identidad, órgano y rol. Una misma persona puede pertenecer simultáneamente a Junta Directiva y Asamblea con funciones distintas, sin que un rol contamine al otro. La condición de Delegado Principal o Suplente debe provenir de la base vigente de Delegados de Asamblea. Administración, Contabilidad y Revisoría Fiscal pueden participar y registrar asistencia, pero no aumentan el universo de elegibles, no cuentan para quórum y no votan por esa condición. En caso de contingencia, un usuario operativo autorizado podrá realizar registro manual, siempre con soporte y trazabilidad.**

---

**Fin – Solicitud Quirúrgica / Revisión de Fondo N.º 05**
