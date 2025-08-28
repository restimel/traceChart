# Use cases

Here are some examples of how to use **TraceChart** effectively.

## Describe a workflow

TraceChart can be used to represent a workflow step by step.
When tasks need to be broken down further, you can add nested levels.

Each level can represent, for example, a function call stack—making it easy to see which function is called by whom.

**Example: Generating the SVG in this project**

```
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

## Debugging projects

When debugging a complex project, it’s often helpful to know **which functions were called, in what order, and their parent-child relationships**.

This is where the [relative hierarchy](./hierarchies.md#_relative_hierarchy) feature of TraceChart becomes valuable.
You can open a group at the start of a function and close it at the end to visualize the flow.

**Example code to debug:**

```javascript
function alpha(values) {
    values.forEach((value) => {
        if (Array.isArray(value)) {
            return alpha(value);
        }

        if (typeof value === 'string') {
            return gamma(value);
        }

        beta(value);
    });
}

function beta(value) {
    const str = value.toString();

    if (str) {
        gamma(str);
    }
}

function gamma(value) {
    message('value:' + value);
}
```

To visualize this with TraceChart, we add `console.log` statements at the start and end of each function:

```javascript
function alpha(values) {
    console.log('{ alpha');

    values.forEach((value) => {
        console.log(`+ ${value} [value]`);

        if (Array.isArray(value)) {
            return alpha(value);
        }

        if (typeof value === 'string') {
            return gamma(value);
        }

        beta(value);
    });

    console.log('}');
}

function beta(value) {
    console.log('{ beta');

    const str = value.toString();

    if (str) {
        gamma(str);
    }

    console.log('}');
}

function gamma(value) {
    console.log('{ gamma');

    message('value:' + value);

    console.log('}'),
}
```

**Console output after running the code:**

```
{ alpha
+ 42 [value]
{ beta
{ gamma
}
}
+ text [value]
{ gamma
}
+ hello,0 [value]
{ alpha
+ hello [value]
{ gamma
}
+ 0 [value]
{ beta
}
}
}
```

Copy-paste the console output into TraceChart, and you will get a visual chart of the workflow.

⚠️ **Note:** Some browsers append the filename and line number when calling `console.log`.
If that happens, enable the **"input from console"** option in TraceChart to parse the log correctly without extra sanitization.
