# traceChart

**traceChart** is a lightweight tool for generating SVG charts that visualize sequential points and optionally highlight their association with specific subroutines (functions).
It's particularly useful for visualizing call traces, performance timings, or any chronological sequence of events within a system or application while preserving the stack context.

[Online application](https://restimel.github.io/traceChart/)

## Features

- Generate clean, structured SVG charts based on a simple trace syntax
- Highlight subroutine or function groupings using customizable categories
- Display hierarchical call relationships clearly and compactly
- Load existing SVG charts back into the tool to re-edit the source trace

## Example

Below is an example of a trace definition and the structure it represents:

```
categories:
+ svgGenerator: {#FF6F00}
+ parser: {#006FFF}
+ components: {#388E3C}

traces:
+ generateSvgFromCode[svgGenerator] // architecture to generate the svg
++ stringToChartData[parser] // [parse trace chart code]
+++ parseCategories[parser]
+++ parseTrace[parser]
++ svgBody[svgGenerator] // [generate the svg]
+++ svgContent[components]
+++ svgLegend[components]
+++ svgTraceChart[svgGenerator] // write the trace chart code
++++ chartDataToString[parser]
+++++ categoriesStr[parser]
+++++ allTraceStr[parser]
++++++ traceStr[parser]
+++ svgStyle[components]
+++ svgDefs[svgGenerator]
```

It will generates

![Generated SVG](./docs/svgGenerator.svg?sanitize=true)

Note: The generated SVG contains embedded metadata. Opening it again with `traceChart` allows you to re-edit the original trace definition.

### Trace syntax

A trace line syntax is:
```
<level> <name> [<category>] // [<action>] <comment>
```
* `<level>` (**mandatory**): indicate the level of this trace event.
This is 1 `+` for level 1, for a child of the previous trace add another `+` (so `++` for level 2).
It is also possible to write relative level with `{`.
[More about hierarchy levels](./docs/hierarchies.md)
* `<name>`  (**optional** but highly recommended): the name of the trace event.
Special characters (such as `[]/\`) can be escaped with `\`.
* `<category>` (**optional**): indicate in which category the trace event is linked to.
It will use the defined color for this category.
If missing, it will use the same category as the parent trace event.
* `<action>` (**optional**): Add an important comment for this trace event.
* `<comment>` (**optional**): Add a small comment for this trace event.

### Category syntax

A category line syntax is:
```
+ <category>: <label> {<color>}
```
* `<category>` (**mandatory**): The category name used in the trace section.
* `<label>` (**optional**): The label to display in the legend section.
* `<color>` (**optional**): The color to use for these trace events.

## More information

* [syntax for hierarchies](./docs/hierarchies.md)
* [Some use case example](./docs/useCases.md)

## Installation (for contribution)

Clone the repository:

```shell
# get the project
git clone https://github.com/restimel/traceChart.git
cd traceChart

# retrieve dependencies
npm ci

# run the application
npm run dev
```

Open your browser to the given URL.

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for more details.

## Author

Developed by [Restimel](https://github.com/restimel).
