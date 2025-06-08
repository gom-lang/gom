# The Gom Programming Language

**Gom** is a statically typed, compiled programming language based on a subset of TypeScript's syntax. Imagine writing TypeScript, but instead of compiling to JavaScript, it compiles to LLVM IR which can then be compiled directly to machine code.

Here’s a typical hello world program in Gom:

```ts
import io;

function main() {
	io.log("Hello, world!");
}
```

The `main` function is the entry point to the program, similar to other statically-typed languages. `log` is the standard library function to print content to the console.

Simple arithmetic and function declaration looks like this:

```ts
import io;

function add(a: int, b: int): int {
	return a + b;
}

function main() {
	io.log("Sum:", add(1, 2)); // Prints "Sum: 3"
}
```

Defining complex data structures is possible via the `type` keyword. `let` is the variable declaration keyword, it infers type from the expression on the right hand side of `=`.

```ts
import io;

// List
type Numbers = [int];

// Struct
type Temperature = {
	high: int,
	low: int,
	avg: int
};

function main() {
	let a = 1; // type inferred as int
	io.log("a: ", a);

	let temperature = Temperature {
		high: 32,
		low: 26,
		avg: 29
	};

	io.log("Average temperature: ", temperature.avg);

	let numbers = Numbers { 1, 2, 3, 4, 5 }, i = 0;
	for(i; i < numbers.length; i = i + 1) {
		io.log("Number at index ", i, " is ", numbers.i);
	}
}
```

Other types can be defined using the `type` keyword.

```ts
type Count = int;
type Name = str;

// Struct
type Person = {
	name: Name,
	age: Count
};

// Tuple
type Tuple = { int, bool };

// List
type Numbers = [int];

// List of structs
type People = [Person];
```

## Development Status

| Stage | Status |
| --- | --- |
| Base grammar definition | ✅ Done |
| Lexical Analysis | ✅ Done |
| Syntactic Analysis (parsing) | ✅ Done |
| Semantic Analysis & preliminary type system | ✅ Done |
| LLVM IR Generation | ✅ Done |
| Complex data structures - structs | ✅ Done |
| Complex data structures - lists | ⚙️ In progress |
| Modules | ⏳ Not started |

## Trying out Gom

The `src/index.ts` file is the entry point for the Gom compiler. To execute the compiler, clone and set up the repository locally:

```bash
npm install
```

To compile a Gom program, run:

```bash
npm run compile examples/readme.gom llvm
# then run the generated executable
./examples/readme
```

## Updates

https://github.com/gom-lang/gom/commits/main/