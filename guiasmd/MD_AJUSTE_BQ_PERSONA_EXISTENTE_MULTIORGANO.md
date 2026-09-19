# BOARD QUORUM – AJUSTE FUNCIONAL
## Vinculación de una persona existente a un segundo órgano

**Cliente piloto:** ASOCOLCI  
**Módulo:** Gestión de Miembros  
**Fecha del hallazgo:** 16 de septiembre de 2026  
**Destino:** Andrés – Implementación Board Quorum  

---

## 1. Situación actual

Board Quorum valida correctamente que el **número de identificación sea único**.

Sin embargo, actualmente se presenta este caso:

1. Una persona ya existe en **Asamblea General**.
2. Posteriormente esa misma persona es elegida o incorporada a **Junta Directiva**.
3. Al intentar registrarla en Junta Directiva desde **Nuevo Miembro**, el sistema detecta que la cédula ya existe.
4. La operación queda bloqueada y no permite vincular a la persona al nuevo órgano.

### Caso real observado

**María del Pilar Herrera Chaparro**  
**CC:** 52.791.026  
**Ya existe en:** Asamblea General  
**Debe incorporarse también a:** Junta Directiva  
**Rol / cargo:** Vocal Principal

---

## 2. Problema funcional

El sistema está tratando dos conceptos diferentes como si fueran uno solo:

- **Identidad de la persona**
- **Pertenencia de la persona a un órgano**

La identidad sí debe ser única.

La pertenencia no necesariamente debe ser única, porque una misma persona puede pertenecer válidamente a más de un órgano.

---

## 3. Comportamiento requerido

Cuando se ingrese un número de identificación que ya existe:

### NO debe

- Crear una segunda persona.
- Modificar artificialmente el tipo o número de documento.
- Eliminar la pertenencia existente al otro órgano.
- Bloquear automáticamente la operación solo porque la persona ya existe.

### SÍ debe

1. Identificar a la persona existente.
2. Recuperar su registro.
3. Verificar si ya pertenece al órgano seleccionado.
4. Si **no pertenece**, permitir crear únicamente la nueva pertenencia al órgano.
5. Mantener intacta cualquier pertenencia previa.

---

## 4. Regla funcional

> **Una persona debe existir una sola vez por número de identificación, pero puede tener una o varias pertenencias a órganos diferentes.**

Ejemplo:

```text
PERSONA
CC 52791026
MARIA DEL PILAR HERRERA CHAPARRO

    ├── Asamblea General
    │      └── Delegada / condición correspondiente
    │
    └── Junta Directiva
           └── Vocal Principal
```

---

## 5. Lógica esperada

```text
Ingresar número de identificación
        ↓
¿La persona existe?
        │
        ├── NO → Crear persona + pertenencia al órgano
        │
        └── SÍ
             ↓
        Recuperar persona existente
             ↓
        ¿Ya pertenece al órgano seleccionado?
             │
             ├── NO → Crear nueva pertenencia al órgano
             │
             └── SÍ → Informar que esa pertenencia ya existe
```

---

## 6. Modelo conceptual

### PERSONA

- id_persona
- tipo_documento
- numero_documento
- nombre

### PERTENENCIA_ORGANO

- id_persona
- organo
- tipo_participante
- rol_organico
- cargo_funcional
- estado

La validación de unicidad debe aplicarse a **PERSONA**.

La pertenencia a órganos debe administrarse separadamente.

---

## 7. Criterios de aceptación

El ajuste se considera correcto cuando:

1. **CC 52.791.026** continúa existiendo una sola vez como persona.
2. María del Pilar Herrera Chaparro mantiene su pertenencia a **Asamblea General**.
3. La misma persona puede incorporarse también a **Junta Directiva**.
4. En Junta Directiva queda configurada como:
   - Tipo de participante: **Principal**
   - Rol orgánico: **Vocales**
   - Cargo funcional: **Vocal Principal**
5. No se crea un segundo registro de identidad.
6. La incorporación a Junta Directiva no modifica ni elimina sus datos o condición en Asamblea General.
7. Si posteriormente se intenta crear nuevamente la misma pertenencia al mismo órgano, el sistema debe advertir que esa asociación ya existe.

---

## 8. Resultado esperado

La lógica final debe ser:

```text
1 PERSONA
1 IDENTIFICACIÓN
N PERTENENCIAS A ÓRGANOS
1 CONFIGURACIÓN DE ROL/CARGO POR CADA PERTENENCIA
```

---

## 9. Alcance

Este ajuste afecta directamente:

- Gestión de Miembros.
- Integridad de la base de datos.
- Composición de órganos.
- Configuración de roles y cargos.
- Potencialmente quórum y votaciones.

Por lo anterior, la actualización de la Junta Directiva no puede considerarse completamente cerrada mientras este caso no pueda registrarse correctamente.
