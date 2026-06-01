# React Repository Rules

- Always use global-variable scss when possible. If a value is very CLOSE but not quite the value of the variable, still use the variable.
- Prefer functional patterns (pure functions, immutability, avoid side effects, prefer functional methods over manual for and while loops)
- Boolean names: `is`, `has`, `should` prefix always
- Use SCSS nesting at component level
- One export per component file
- No non-null assertions (`!`)
- Avoid nested ternaries
- Prefer early returns over nesting when possible
- Following existing patterns from the codebase when possible
- Redux variables in the component level should be prefixed with `$` and match the exact name of the redux variable
- Defined constants should use UPPER_CAMEL_CASE
- Use the spread operating for objects when possible (`...`)
- Components should be organized as closely as possible like this: Hooks -> Global variables -> useStates -> useRefs -> Local variables -> useMemos -> functions -> useCallbacks -> useEffects -> ...
- useEffects should use named functions, not anonymous
- useStates should always be typed
- Component file names should match the name of the main component defined within them
- Prefer const objects over enums
