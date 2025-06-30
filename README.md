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

```yaml
categories:
- svgGenerator: {#FF6F00}
- parser: {#006FFF}
- components: {#388E3C}

traces:
- generateSvgFromCode[svgGenerator] // architecture to generate the svg
-- stringToChartData[parser] // [parse trace chart code]
--- parseCategories[parser]
--- parseTrace[parser]
-- svgBody[svgGenerator] // [generate the svg]
--- svgContent[components]
--- svgLegend[components]
--- svgTraceChart[svgGenerator] // write the trace chart code
---- chartDataToString[parser]
----- categoriesStr[parser]
----- allTraceStr[parser]
------ traceStr[parser]
--- svgStyle[components]
--- svgDefs[svgGenerator]
```

It will generates
![Generated SVG](./doc/svgGenerator.svg)

Note: The generated SVG contains embedded metadata. Opening it again with `traceChart` allows you to re-edit the original trace definition.

## Installation (for contribution)

Clone the repository:

```shell
git clone https://github.com/restimel/traceChart.git
cd traceChart
npm ci
npm run dev
```

Open your browser to the given URL.

##License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.

## Author

Developed by [Restimel](https://github.com/restimel).
