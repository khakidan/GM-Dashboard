# Testing Philosophy & Quality Standards

Referenced from the root [AGENTS.md](../../AGENTS.md). This project follows the testing principles established by Kent C. Dodds and the Testing Library team. Every AI agent working on this codebase must read and apply these principles before writing any tests.

---

## The Prime Directive

> "The more your tests resemble the way your software is used, the more confidence they can give you."
>
> — Kent C. Dodds / Testing Library

Reference URLs (read before writing tests):

- https://testing-library.com/docs/guiding-principles
- https://kentcdodds.com/blog/testing-implementation-details
- https://kentcdodds.com/blog/common-testing-mistakes
- https://kentcdodds.com/blog/write-tests

---

## What Makes a Good Test

A good test:

- Simulates real user or caller behavior (render a component, fire an event, assert on what the user sees or what data reaches the database).
- Asserts on **outcomes**, not implementation details.
- Would catch a real bug if behavior broke.
- Does not need to change simply because code was refactored.

---

## The Three Anti-Patterns to Avoid

### Anti-Pattern 1 — Shallow call assertion

Testing only that a function was called without checking what data it received.

```ts
// BAD
expect(updateCharacterDB).toHaveBeenCalled();
```

```ts
// GOOD
expect(updateCharacterDB).toHaveBeenCalledWith(
  expect.objectContaining({
    resourcePools: expect.stringContaining("Rage"),
  }),
  expect.any(Object)
);
```

### Anti-Pattern 2 — Circular mock assertion

Returning data from a mock and then asserting that the same mock data was returned.

```ts
// BAD
vi.mocked(useAppState).mockReturnValue({
  state: { encounters: [mockEnc] },
});

expect(result).toEqual(mockEnc);
```

This can never fail because the test itself injected the expected value.

Instead, assert on a transformation or observable side effect produced by the code under test.

### Anti-Pattern 3 — Testing implementation details

Do not assert on:

- internal component state
- internal helper functions
- implementation structure

```ts
// BAD
expect(component.state.isLoading).toBe(true);
```

Instead, assert on observable behavior.

```ts
// GOOD
expect(
  screen.getByText("Loading...")
).toBeInTheDocument();
```

---

## What to Assert Instead

### Hook tests

Assert on the resulting state change.

```ts
// BAD
expect(handleUpdate).toHaveBeenCalled();
```

```ts
// GOOD
expect(result.current.characters[0].maxHp).toBe(55);
```

### Component tests

Assert on:

- what the user sees
- the exact data passed to the service layer

```ts
// BAD
expect(onConfirmMock).toHaveBeenCalled();
```

```ts
// GOOD
expect(onConfirmMock).toHaveBeenCalledWith(
  expect.objectContaining({
    proficiencies: expect.stringContaining(
      '"proficiencyBonus":3'
    ),
  })
);
```

### Service/database tests

Assert on the exact row data written at the proper column indexes—not merely that a write function was invoked.

---

## When Mocking Is Acceptable

Appropriate uses:

- Network calls (`sheetsService`, `dbOperations` in component/hook tests)
- External dependencies (Google authentication)
- Browser APIs unavailable in jsdom

Not appropriate:

- The function currently under test
- Pure utility functions in `lib/`
- Zustand store behavior (prefer the real store or realistic state scenarios, then assert on resulting state changes)

---

## The Seam Test Standard

The highest-value tests in this project are **seam tests**—tests verifying the connection between the UI layer and the data layer.

For every form submission or inline edit:

1. Render the real component.
2. Simulate real user interaction.
3. Verify that the **complete** data object reaching the service layer contains the correct values in the correct fields.

A test that merely checks "the function was called" at the seam is **not acceptable**. It must verify **what** was passed.
