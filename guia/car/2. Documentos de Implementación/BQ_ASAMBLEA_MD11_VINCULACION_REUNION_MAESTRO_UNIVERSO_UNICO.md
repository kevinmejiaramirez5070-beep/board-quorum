# BOARD QUORUM – ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI

## SOLICITUD QUIRÚRGICA / CAMBIO DE FONDO N.º 11
### Vinculación Reunión de Asamblea → Maestro vigente / universo único

**Destino:** Andrés – Implementación Board Quorum  
**Fecha de prueba:** 25 de agosto de 2026  
**Tipo:** Ajuste funcional de vinculación, universo de elegibles y consistencia de quórum  
**Base de control vigente:** 85 Principales + 55 Suplentes = 140 registros  

---

## 1. OBJETIVO

Asegurar que toda reunión creada como **Asamblea** quede vinculada al **Maestro vigente de Delegados de Asamblea General** y que Board Quorum utilice **un único universo de elegibles** en todas las funcionalidades de la reunión.

La regla funcional requerida es:

```text
REUNIÓN TIPO ASAMBLEA
        ↓
ASAMBLEA GENERAL
        ↓
MAESTRO VIGENTE
        ↓
UN ÚNICO UNIVERSO DE ELEGIBLES
        ↓
QUÓRUM / ASISTENCIA / VOTACIÓN / MOMENTO SIGUIENTE / REPORTES
```

La misma reunión no puede operar simultáneamente con universos diferentes.

---

## 2. ALCANCE FUNCIONAL

Este punto afecta directamente:

```text
Creación de reuniones
Asignación del órgano/producto
Maestro de Delegados
Universo de elegibles
Cálculo de quórum
Momento Siguiente
Registro de asistencia
Habilitación de votación
Proyección de quórum
Reportes
Acta
Trazabilidad
```

Por tanto, **sí está dentro del alcance de Board Quorum**.

---

## 3. REGLA FUNCIONAL PRINCIPAL

Cuando el usuario crea una reunión con:

```text
Tipo de reunión = Asamblea
```

Board Quorum debe asegurar que esa reunión quede asociada a:

```text
Órgano / producto = Asamblea General
Maestro = Maestro vigente de Delegados de Asamblea
```

No debe existir una reunión de tipo Asamblea operativa sin un universo de elegibles resuelto.

### Resultado esperado con la base vigente

```text
Principales: 85
Suplentes: 55
Registros totales: 140
Cursos con Principal: 85
Universo de elegibles para quórum: 85
Quórum inicial: 44
Momento Siguiente: 17
```

Los 55 Suplentes **no aumentan el universo de elegibles**.

Su función es reemplazar al Principal cuando corresponda, conforme a las reglas funcionales ya definidas.

---

## 4. EVIDENCIA OBSERVADA – PRUEBA 25.08.2026

Se creó una nueva reunión con:

```text
Título:
25 AGOSTO 2026 3 45 PM PRUEBA

Tipo de reunión:
Asamblea
```

Sin embargo, al ingresar a la reunión Board Quorum mostró:

```text
No hay universo de elegibles

La reunión no tiene un órgano (producto) asignado,
así que no hay maestro de Delegados del cual
calcular el universo de elegibles.
```

En esa misma sección se mostró:

```text
0 / 0 cursos representados
Momento 1 = 0
Momento 2 = 0
Total principales = 0
```

Posteriormente, dentro de la misma reunión, el módulo de quórum mostró:

```text
Presentes: 0
Mínimo requerido: 53
Elegibles: 105
Porcentaje: 0%
```

### Hallazgo

La misma reunión está presentando al menos tres estados incompatibles:

```text
Universo = 0
Universo = 105
Universo esperado = 85
```

Por tanto:

> **NO PASA – la reunión de Asamblea no está resolviendo de manera única y consistente el Maestro vigente ni el universo de elegibles.**

---

## 5. RESULTADO FUNCIONAL ESPERADO

Para la base cargada y validada el 25.08.2026:

```text
85 Principales
55 Suplentes
140 registros
```

toda reunión nueva de Asamblea debe resolver:

```text
Universo de elegibles = 85
```

y calcular:

```text
Momento 1 = 44
Momento 2 = 17
```

Por tanto, antes de registrar asistencia, una reunión correctamente vinculada debería mostrar conceptualmente:

```text
0 presentes
44 mínimo requerido
85 elegibles
Quórum no alcanzado
```

No debe mostrar:

```text
0 elegibles
105 elegibles
53 mínimo
```

ni cualquier otro valor proveniente de una fuente distinta.

---

## 6. PRINCIPIO DE UNIVERSO ÚNICO

Una vez resuelto el Maestro aplicable a la reunión, todas las funcionalidades deben consumir **el mismo universo funcional**.

Conceptualmente:

```text
                 MAESTRO VIGENTE
                       ↓
                85 REPRESENTACIONES
                       ↓
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
     QUÓRUM        ASISTENCIA      VOTACIÓN
        ↓              ↓              ↓
 MOMENTO SIG.       REPORTES          ACTA
```

No debe existir:

```text
Cabecera de reunión        → universo A
Tarjeta de quórum          → universo B
Proyección pantalla        → universo C
Votación                   → universo D
Reporte                     → universo E
```

Todos deben derivar del mismo universo de la reunión.

---

## 7. REUTILIZAR → ADAPTAR → CONSTRUIR

Este MD no solicita crear un segundo Maestro ni un nuevo motor de quórum.

La prioridad es:

### 1. Reutilizar

Usar el **Maestro de Delegados de Asamblea General ya existente**.

### 2. Adaptar

Asegurar que una reunión creada como **Asamblea** quede correctamente vinculada al producto/órgano y Maestro correspondiente.

### 3. Construir

Solo si la arquitectura actual no permite resolver esa asociación de forma segura, incorporar el mecanismo mínimo necesario para garantizarla.

---

## 8. COMPORTAMIENTO EN LA CREACIÓN DE LA REUNIÓN

La creación de una reunión tipo Asamblea debe terminar en uno de estos dos estados válidos:

### Estado válido A – asociación automática

Si Board Quorum puede identificar de forma inequívoca el producto/órgano correspondiente:

```text
Tipo = Asamblea
        ↓
Asamblea General
        ↓
Maestro vigente
        ↓
Universo resuelto
```

La reunión se crea normalmente.

### Estado válido B – asociación requerida antes de crear

Si Board Quorum no puede determinar de forma inequívoca el producto/órgano:

```text
NO permitir crear una reunión operativa
sin resolver previamente la asociación.
```

Debe solicitar la selección correspondiente.

### Estado no válido

```text
Crear la reunión
        ↓
dejarla sin órgano/producto
        ↓
mostrar 0 elegibles
        ↓
usar después otro universo distinto
```

Ese comportamiento no debe ocurrir.

---

## 9. REGLA PARA EL CÁLCULO DEL QUÓRUM

El cálculo debe tomar como denominador las **posiciones Principales habilitadas** del Maestro aplicable a la reunión.

Con la base actual:

```text
N = 85
```

### Momento 1

Regla funcional vigente:

```text
50% + 1
```

Para 85:

```text
85 × 50% = 42,5
42,5 + 1 = 43,5
mínimo entero que cumple = 44
```

Resultado:

```text
MOMENTO 1 = 44
```

### Momento Siguiente

```text
20% de 85 = 17
```

Resultado:

```text
MOMENTO 2 = 17
```

El cambio a Momento Siguiente **no cambia el universo**.

Debe ocurrir:

```text
85 elegibles / 44 mínimo
        ↓
Aplicar Momento Siguiente
        ↓
85 elegibles / 17 mínimo
```

---

## 10. RELACIÓN CON LA ASISTENCIA

El número de personas registradas físicamente puede ser distinto del número de representaciones computables.

Board Quorum debe mantener separados:

```text
PERSONAS REGISTRADAS
≠
REPRESENTACIONES PARA QUÓRUM
```

Pero el universo máximo de representaciones continúa siendo:

```text
85
```

La asistencia no puede modificar el denominador del Maestro.

Solo determina cuántas de esas representaciones se encuentran efectivamente ejercidas.

---

## 11. RELACIÓN CON PRINCIPAL / SUPLENTE

El universo se basa en:

```text
85 posiciones Principales
```

Un Suplente puede ocupar funcionalmente una de esas posiciones cuando el Principal está ausente.

Por tanto:

```text
Principal presente
        ↓
representación del curso = Principal

Principal ausente + Suplente presente
        ↓
representación del curso = Suplente actuando como Principal
```

En ambos casos:

```text
el curso aporta máximo 1 representación
```

El Suplente nunca crea una posición adicional dentro del universo.

---

## 12. RELACIÓN CON MD06 Y MOMENTO SIGUIENTE

Este MD **no reemplaza** la definición funcional de los parámetros de quórum.

Los valores:

```text
85
44
17
```

continúan sujetos a la lógica definida para Asamblea.

El objetivo de MD11 es asegurar que **la reunión realmente tome ese universo** y que el mismo universo sea utilizado de forma consistente en todos los módulos.

---

## 13. PSEUDOLÓGICA FUNCIONAL

```text
INPUT:
    crear_reunion
    tipo_reunion = ASAMBLEA

1. Resolver órgano/producto de Asamblea aplicable.

2. Si NO puede resolverse:
       impedir que la reunión quede operativa
       solicitar asociación válida
       FIN

3. Obtener Maestro vigente asociado.

4. Validar que exista Maestro activo.

5. Obtener posiciones Principales habilitadas.

6. Calcular:
       universo_elegibles = posiciones Principales habilitadas

7. Para base vigente:
       universo_elegibles = 85
       quorum_momento_1 = 44
       quorum_momento_2 = 17

8. Asociar la reunión al universo resuelto.

9. Reutilizar ese mismo universo en:
       quórum
       asistencia
       votación
       Momento Siguiente
       proyección
       reportes
       acta

10. Si cualquier módulo devuelve un universo distinto:
       inconsistencia funcional
       NO PASA
```

---

## 14. CONSISTENCIA DE INTERFAZ

Las distintas vistas de una misma reunión deben ser coherentes entre sí.

Para la base actual, ninguna pantalla de la reunión debe afirmar simultáneamente:

```text
Total elegibles = 0
Total elegibles = 105
Total elegibles = 85
```

El valor debe ser único:

```text
85
```

y derivar de la misma fuente funcional.

---

## 15. MENSAJES DE ERROR

Si excepcionalmente una reunión no tiene Maestro/órgano correctamente asociado, Board Quorum puede advertirlo.

Sin embargo, el mensaje debe conducir a una acción que permita resolver el problema y **no debe permitir que otros módulos continúen calculando quórum sobre un universo diferente**.

Ejemplo conceptual:

```text
No es posible calcular el quórum.

La reunión de Asamblea no tiene asociado
un Maestro vigente de Delegados.

Asigne el Maestro antes de continuar.
```

Mientras este estado exista:

```text
no calcular un universo alternativo
no habilitar votaciones basadas en otro universo
no generar cifras de quórum contradictorias
```

---

## 16. CASOS DE PRUEBA OBLIGATORIOS

### CP-01 – Crear reunión tipo Asamblea

Crear una nueva reunión:

```text
Tipo = Asamblea
```

Esperado:

```text
Órgano/producto resuelto
Maestro vigente resuelto
Universo = 85
Momento 1 = 44
Momento 2 = 17
```

### CP-02 – Reunión sin asistencia

Esperado:

```text
Presentes = 0
Elegibles = 85
Mínimo = 44
Quórum = NO ALCANZADO
```

### CP-03 – Consistencia entre pantallas

Comparar:

```text
Cabecera / resumen
Tarjeta de quórum
Detalle
Proyección pantalla completa
Asistencia
Votación
Reporte
```

Esperado:

```text
Universo único = 85
```

### CP-04 – Momento Siguiente

Con menos de 44 representaciones presentes:

```text
activar Momento Siguiente
```

Esperado:

```text
Universo antes = 85
Mínimo antes = 44

Universo después = 85
Mínimo después = 17
```

### CP-05 – Suplente actuando como Principal

Registrar un Suplente cuando su Principal esté ausente.

Esperado:

```text
Representación del curso = 1
Universo total = 85
```

El universo no aumenta a 86.

### CP-06 – Reporte

Generar reporte de la reunión.

Esperado:

```text
Universo de elegibles = 85
```

El reporte debe coincidir con el valor utilizado durante la reunión.

---

## 17. CRITERIOS DE ACEPTACIÓN

MD11 se considera resuelto cuando:

- [ ] Una reunión creada como `Asamblea` queda asociada correctamente a `Asamblea General`.
- [ ] La reunión consume el Maestro vigente de Delegados correspondiente.
- [ ] La reunión no puede quedar operativa sin un universo de elegibles resuelto.
- [ ] Con la base actual el universo mostrado es `85`.
- [ ] El quórum inicial mostrado es `44`.
- [ ] El Momento Siguiente mostrado es `17`.
- [ ] Los 55 Suplentes no aumentan el universo.
- [ ] Un Suplente actuando como Principal ocupa una posición existente y no crea una nueva.
- [ ] Todas las vistas de la reunión utilizan el mismo universo.
- [ ] No reaparecen valores como `0 elegibles` o `105 elegibles` cuando el Maestro vigente es 85 Principales.
- [ ] Momento Siguiente modifica el mínimo requerido, no el universo.
- [ ] Asistencia, votación, proyección, reportes y acta consumen la misma fuente funcional.
- [ ] Si falta la vinculación al Maestro, Board Quorum bloquea el cálculo en lugar de utilizar un universo alternativo.
- [ ] El comportamiento puede probarse y reproducirse con una nueva reunión de Asamblea.

---

## 18. PUNTO PENDIENTE QUE ESTE MD NO INVENTA

Este MD no define qué debe ocurrir si el Maestro vigente es reemplazado **después de que una reunión ya fue creada o iniciada**.

Debe determinarse, con base en la arquitectura existente y las reglas aprobadas, si la reunión:

```text
a) conserva una fotografía del Maestro aplicable, o
b) sigue el Maestro vigente hasta determinado estado de la reunión.
```

Hasta que exista una definición funcional expresa, no debe asumirse uno de estos comportamientos.

Este vacío no impide implementar el objetivo principal de MD11:

> **Toda reunión nueva de Asamblea debe iniciar vinculada correctamente a un único Maestro y a un único universo.**

---

## 19. FUERA DEL ALCANCE DE ESTE MD

Este documento no modifica:

```text
La composición del Maestro
La regla de doble identificación del núcleo familiar
La lógica Principal/Suplente
Las reglas de poderes
El mecanismo de votación
La regla de cálculo 44 / 17
La regla de segunda convocatoria
```

Solo asegura que **la reunión use correctamente y de forma única las reglas y datos ya definidos**.

---

## CONCLUSIÓN FUNCIONAL

> **Una reunión de tipo Asamblea no puede existir operativamente desconectada del Maestro vigente de Asamblea General. Al crearse, Board Quorum debe resolver un único universo de elegibles y reutilizarlo en quórum, asistencia, votación, Momento Siguiente, proyección, reportes y acta. Con la base actualmente validada, ese universo es 85, con quórum inicial 44 y Momento Siguiente 17. La misma reunión no puede mostrar 0, 105 y 85 elegibles en diferentes componentes.**

---

**Fin – Solicitud Quirúrgica / Cambio de Fondo N.º 11**
