# Hierarchical level

Traces can be displayed hierarchically.
The *hierarchical level* defines the hierarchy of traces.

There are two ways to define hierarchy: **absolute hierarchy** and **relative hierarchy**.

## Absolute hierarchy

Use `+` at the start of a line to set the hierarchy level.

Each `+` increases the depth by one level.

A trace line should start with `+`, each character represents a level in the hierarchy.

```
+ Task 1   // level 1
++ Task 2  // level 2 (child of Task 1)
+++ Task 3 // level 3 (child of Task 2)
+++ Task 4 // level 3 (also child of Task 2)
+ Task 5   // level 1 (sibling of Task 1)
```

## Relative hierarchy

Relative hierarchy uses `{` and `}` to open and close groups.

Inside a group, the indentation restarts at level 1, relative to the group’s parent.

* `{` → increases hierarchy level (opens a new group)
* `}` → decreases hierarchy level (closes the current group)

Example:

If the trace line starts with `{`, it opens a new level.
They could be closed with a line starting with `}`

Inside this group the indentation level restarts at 1.

```
+ Task 1
{         // new group at level 1
+ Task 2  // level 2
++ Task 3 // level 3 (child of Task 2)
}         // back to level 1
+ Task 4
++ Task 5
{ Group2  // level 1, opens a new group
{ Group3  // level 2 (child of Group2), opens another group
+ Task 6  // level 3 (child of Group3)
}
+ Task 7  // level 2 (child of Group2)
}

```

### Mixing `+` and `{`

You can also open a new group (`{`) starting from a specific `+` level.

In this case, the group’s hierarchy restarts from 1, relative to where it was opened.

* `+{` is equivalent to `{`

```
+ Task 1
++{ Group1      // level 2 (child of Task 1), opens a new group
+ Task 3        // level 3 (child of Group1)
}
++ Task 4       // level 2 (child of Task 1)
+++{ Group2     // level 3 (child of Task 4), opens a new group
+ Task 5        // level 4 (child of Group2)
}
+ Task 6        // level 1

```
