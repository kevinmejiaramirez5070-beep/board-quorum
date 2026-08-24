# BOARD QUORUM – ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI

## SOLICITUD QUIRÚRGICA / BASE DE DATOS N.º 07
### Base validada para carga y reemplazo del Maestro de Delegados

**Destino:** Andrés – Implementación Board Quorum  
**Archivo asociado:** `BOARD_QUORUM_ASAMBLEA_AGOSTO_2026_CARGA_FINAL.xlsx`  
**Fecha de validación:** 22 de agosto de 2026  
**Tipo:** Base de control para carga / reemplazo del Maestro de Delegados

---

## 1. OBJETIVO

Andrés:

Te comparto la base validada que debe utilizarse para continuar las pruebas de Asamblea y para reemplazar el Maestro de Delegados actualmente cargado en Board Quorum.

El archivo de referencia es:

```text
BOARD_QUORUM_ASAMBLEA_AGOSTO_2026_CARGA_FINAL.xlsx
```

Esta base debe tomarse como la fuente de control para verificar que Board Quorum reproduzca correctamente los Delegados y sus roles.

---

## 2. COMPOSICIÓN DE LA BASE

El archivo contiene:

```text
85 Delegados PRINCIPALES
55 Delegados SUPLENTES
140 registros totales
```

Por tanto, después de una carga de reemplazo, el maestro vigente debe corresponder a:

```text
PRINCIPALES: 85
SUPLENTES:   55
TOTAL:      140
```

---

## 3. REGLA DE CARGA

La carga de este archivo debe operar como reemplazo del maestro vigente de Asamblea.

La expectativa funcional es:

> **Los registros activos del Maestro de Delegados deben corresponder a la base cargada y no deben quedar Principales o Suplentes activos provenientes de cargas anteriores.**

Si Board Quorum conserva información histórica, esta puede mantenerse para trazabilidad, pero no debe afectar:

```text
Conteo de Principales
Conteo de Suplentes
Universo de elegibles
Quórum
Votaciones
Representación vigente por curso
```

---

## 4. NO MODIFICAR EL ARCHIVO PARA AJUSTARLO AL RESULTADO ACTUAL DE BOARD QUORUM

En la prueba realizada, Board Quorum recibió:

```text
140 OK
0 omitidos
0 errores
```

pero posteriormente mostró:

```text
90 Principales
50 Suplentes
```

Ese resultado no coincide con la estructura del archivo validado:

```text
85 Principales
55 Suplentes
```

Por tanto:

> **No debe modificarse el Excel para hacerlo coincidir con 90 / 50. Board Quorum debe reproducir correctamente la base 85 / 55.**

---

## 5. VALIDACIONES DEL ARCHIVO

La versión entregada para carga fue revisada para conservar:

```text
140 registros
85 PRINCIPALES
55 SUPLENTES
Identificaciones como texto
Roles únicamente PRINCIPAL / SUPLENTE
Curso asociado
Nombres disponibles
Una sola hoja de carga
Sin fórmulas auxiliares
Sin hojas adicionales que puedan interferir con la importación
```

También se incorporaron las correcciones puntuales revisadas durante la depuración de la base.

---

## 6. PRINCIPALES Y SUPLENTES

La carga debe respetar el valor de la columna:

```text
ROL
```

con sus valores:

```text
PRINCIPAL
SUPLENTE
```

Board Quorum no debe cambiar el rol definido en el archivo por efecto de una carga anterior o de registros históricos.

Si un Suplente no tiene Principal asociado en la base vigente, debe conservar su condición de:

```text
SUPLENTE
```

y Board Quorum debe reflejar claramente su situación de vínculo sin convertirlo en Principal.

---

## 7. RESULTADO ESPERADO DESPUÉS DE LA CARGA

Al finalizar la carga y refrescar la página, el control esperado es:

```text
Total cargado: 140
Principales:    85
Suplentes:      55
```

La lista completa del maestro vigente no debe contener registros activos adicionales que alteren esos valores.

---

## 8. RELACIÓN CON EL QUÓRUM

Esta base es también la fuente para el cálculo de quórum definido en el MD N.º 06.

Con:

```text
85 Principales habilitados
```

los valores de control son:

```text
Quórum inicial:     44
Momento Siguiente:  17
```

Los 55 Suplentes no incrementan el universo de quórum; sustituyen la representación del Principal cuando corresponda.

---

## 9. CRITERIOS DE ACEPTACIÓN

La carga se considera correcta cuando:

- [ ] Board Quorum recibe los 140 registros sin errores.
- [ ] El maestro vigente muestra 85 Principales.
- [ ] El maestro vigente muestra 55 Suplentes.
- [ ] El total vigente corresponde a 140 registros.
- [ ] Los roles PRINCIPAL / SUPLENTE coinciden con el Excel.
- [ ] No quedan registros activos de cargas anteriores que alteren los conteos.
- [ ] Los históricos, si se conservan, no afectan quórum ni votación.
- [ ] El universo para quórum queda en 85.
- [ ] La base permite posteriormente validar los valores 44 / 17 definidos en el MD N.º 06.

---

## CONCLUSIÓN FUNCIONAL

> **El archivo `BOARD_QUORUM_ASAMBLEA_AGOSTO_2026_CARGA_FINAL.xlsx` constituye la base validada para reemplazar el Maestro de Delegados de Asamblea. El resultado esperado en Board Quorum es exactamente 85 Principales + 55 Suplentes = 140 registros. La plataforma no debe conservar registros activos de cargas anteriores que modifiquen esa distribución ni alterar los roles definidos en el archivo.**

---

**Fin – Solicitud Quirúrgica / Base de Datos N.º 07**
