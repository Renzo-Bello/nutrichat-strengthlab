# NutriChat · StrengthLab

Abre https://renzo-bello.github.io/nutrichat-strengthlab/.

## Registrar alimentos

1. Escribe `Mi meta es 2300 kcal`.
2. Escribe `Me comeré 200 g de pan marraqueta`.
3. Confirma con **Registrar 200 g**. Consultar no modifica el diario.
4. Recarga para comprobar que el registro persiste.
5. Usa × para eliminar una entrada y **Deshacer** para restaurarla.

## Elegir un menú por calorías

1. Abre la pestaña **Menú**.
2. Elige una meta de 1.800 a 2.400 kcal, en tramos de 100.
3. Revisa cuatro propuestas: menú casero, con legumbres, con atún o con carne de soya. Cada una muestra fotos ilustrativas y cuatro bloques en este orden: desayuno, almuerzo, cena y post entreno. Incluye ingredientes, porciones y macros.
4. Pulsa **Usar como meta de hoy** para guardar ese objetivo en la fecha seleccionada.

Entre las comidas aparece una pausa para tomar un vaso de agua de 250 ml (0 kcal). Las porciones se ajustan proporcionalmente a la meta. Los valores son referencias genéricas y aproximadas, calculadas con la regla 4/4/9; pueden variar según marca, preparación y peso real. Son menús iniciales, no una prescripción individual. Las fotos, recetas pesadas y etiquetas de cada asesorado permitirán sustituir estas referencias por platos personalizados.

## Alimentos y datos

El catálogo incluye alimentos de referencia y permite añadir productos propios con la etiqueta por 100 g. Usa valores por 100 g, no por porción, y distingue entre alimentos crudos y cocidos. El cálculo de kcal es P × 4 + C × 4 + G × 9.

Los datos se guardan en IndexedDB en cada navegador. No se suben a GitHub, no se sincronizan entre dispositivos y aún no hay cuentas para asesorados. Puedes descargar un respaldo JSON desde **Alimentos** y restaurarlo en otro navegador. Al restaurar, se combinan registros y alimentos; las metas del respaldo reemplazan las existentes en las mismas fechas.
